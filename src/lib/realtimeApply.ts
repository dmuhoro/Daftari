import { db, type Transaction, type Business } from './db'
import { logger } from './logger'
import { captureError } from './sentry'
import { loadTenantState } from './tenantLoader'

export interface RealtimeChange {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: Record<string, unknown> | null
  old: Record<string, unknown> | null
}

export type RealtimeTable = 'daftari_transactions' | 'daftari_businesses'

/**
 * Apply a single realtime change to the LOCAL ledger, then refresh the store.
 *
 * RLS on the server already scopes the stream to the session's own rows; this
 * adds a client-side ownership assertion as a second line of defense (never
 * merge a stranger's row into the user's ledger), an idempotent upsert/delete
 * by local_id, and a tenant reload so the open UI updates without a manual
 * pull or reload. Returns an integer status for tests/observability:
 *   0 = applied, 1 = ignored foreign row, 2 = failure
 */
export async function applyRealtimeChange(
  table: RealtimeTable,
  change: RealtimeChange,
  userId: string
): Promise<0 | 1 | 2> {
  try {
    const row = change.new ?? change.old
    if (!row) return 2

    const ownerKey = table === 'daftari_transactions' ? 'user_id' : 'user_id'
    const owner = row[ownerKey]
    if (owner && owner !== userId) {
      logger.warn('sync:realtime_foreign_row_ignored', { table, local_id: row.local_id })
      return 1
    }

    if (change.eventType === 'DELETE') {
      if (row.local_id) {
        const keyTable = table === 'daftari_transactions' ? db.transactions : db.business
        await keyTable.where('local_id').equals(row.local_id as string).delete()
      }
    } else {
      const record = { ...row, synced: 1 }
      if (table === 'daftari_transactions') {
        await db.transactions.put(record as unknown as Transaction)
      } else {
        await db.business.put(record as unknown as Business)
      }
    }

    await loadTenantState(userId)
    return 0
  } catch (cause) {
    captureError(cause, { feature: 'realtime', action: 'apply_change' })
    return 2
  }
}