import { db } from '../../lib/db'
import { logger } from '../../lib/logger'
import { captureError } from '../../lib/sentry'

export type AdoptResult = {
  transactions: number
  businesses: number
  queue: number
}

/**
 * Claim locally cached records that were captured before any session existed.
 *
 * Root cause: store.addTransaction / onboarding stamp `user_id: user?.id`
 * from the current Supabase session. When a record was created with no real
 * session (sign-up with pending email confirmation, older versions, E2E),
 * that stamp is `undefined`. The tenant-scoped reads filter by user_id and
 * the remote RLS `user_id = auth.uid()` rejects the null-owner upsert — so
 * the data is invisible AND un-syncable: a silent orphan.
 *
 * This runs at the real auth boundary (after `getUser()` resolves a session)
 * and claims every local record that still has no user_id, stamping it with
 * the authenticated user so it:
 *   1. becomes visible to getTransactionsForUser / getBusinessesForUser,
 *   2. re-enters the sync path (synced=0) and can pass RLS,
 *   3. gets its queued payload (if any) re-stamped so a pending flush does
 *      not dead-letter again.
 *
 * Idempotent and fail-closed: records that already carry ANY user_id are
 * never touched — adoption never rewrites ownership away from another user.
 */
export async function adoptOrphanedRecords(userId: string | null | undefined): Promise<AdoptResult> {
  if (!userId) return { transactions: 0, businesses: 0, queue: 0 }

  const result: AdoptResult = { transactions: 0, businesses: 0, queue: 0 }

  try {
    const txRecords = await db.transactions.toArray()
    const txOrphans = txRecords.filter(tx => !tx.user_id)

    for (const tx of txOrphans) {
      await db.transactions.update(tx.id!, { user_id: userId, synced: 0 })
      result.transactions++
    }

    const bizRecords = await db.business.toArray()
    const bizOrphans = bizRecords.filter(biz => !biz.user_id)

    for (const biz of bizOrphans) {
      await db.business.update(biz.id!, { user_id: userId, synced: 0 })
      result.businesses++
    }

    if (txOrphans.length > 0 || bizOrphans.length > 0) {
      const affectedIds = new Set([
        ...txOrphans.map(tx => tx.local_id),
        ...bizOrphans.map(biz => biz.local_id ?? String(biz.id ?? '')),
      ].filter(Boolean))

      const pending = await db.sync_queue.where('synced').equals(0).toArray()
      for (const item of pending) {
        if (!affectedIds.has(item.record_id)) continue
        try {
          const payload = item.payload ? JSON.parse(item.payload) : {}
          if (payload && typeof payload === 'object' && !payload.user_id) {
            payload.user_id = userId
            await db.sync_queue.update(item.id!, { payload: JSON.stringify(payload) })
            result.queue++
          }
        } catch {
          // leave malformed payloads untouched; the queue's dead-letter path owns them
        }
      }

      logger.info('sync:adopted_orphans', {
        adopted: result,
        userId,
      })
    }

    return result
  } catch (cause) {
    captureError(cause, { feature: 'sync', action: 'adoptOrphanedRecords' })
    logger.error('sync:adopt_orphans_failed', cause, { userId })
    throw cause
  }
}