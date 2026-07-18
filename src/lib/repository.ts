/**
 * @module repository
 * @description Repository pattern for Daftari's local data layer.
 *
 * All Dexie reads and writes go through this module.
 * Feature components must never import db.ts directly.
 * This enables: unit testing without Dexie, future migration to SQLite, mocking.
 *
 * Every function returns Result<T, AppError> — never throws.
 */

import { db } from './db'
import { logger } from './logger'
import { ok, err, appError } from './types'
import type { Result, Transaction, Business, SyncQueueEntry, AppError } from './types'
import type { KES } from './money'
import { kes } from './money'

// ─── Transactions ─────────────────────────────────────────────────────────

/** Write a new transaction to IndexedDB */
export const saveTransaction = async (
  tx: Omit<Transaction, 'id'>
): Promise<Result<number, AppError>> => {
  try {
    const id = await db.transactions.add(tx as Transaction)
    logger.info('repository:transaction_saved', { type: tx.type, source: tx.source })
    return ok(id as number)
  } catch (cause) {
    logger.error('repository:transaction_save_failed', cause, { type: tx.type })
    return err(appError('DEXIE_WRITE_FAILED', 'Failed to save transaction', cause))
  }
}

/** Read all transactions for today (midnight to midnight, Nairobi time) */
export const getTodayTransactions = async (): Promise<Result<Transaction[], AppError>> => {
  try {
    const now = new Date()
    const nairobi = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Nairobi' }))
    const startOfDay = new Date(nairobi)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(nairobi)
    endOfDay.setHours(23, 59, 59, 999)

    const transactions = await db.transactions
      .where('recorded_at')
      .between(startOfDay.toISOString(), endOfDay.toISOString(), true, true)
      .toArray()

    return ok(transactions as Transaction[])
  } catch (cause) {
    logger.error('repository:get_today_failed', cause)
    return err(appError('DEXIE_READ_FAILED', 'Failed to read today\'s transactions', cause))
  }
}

/** Read all transactions for the last N days */
export const getRecentTransactions = async (
  days: number
): Promise<Result<Transaction[], AppError>> => {
  try {
    const since = new Date()
    since.setDate(since.getDate() - days)
    const transactions = await db.transactions
      .where('recorded_at')
      .above(since.toISOString())
      .reverse()
      .toArray()
    return ok(transactions as Transaction[])
  } catch (cause) {
    logger.error('repository:get_recent_failed', cause, { days })
    return err(appError('DEXIE_READ_FAILED', 'Failed to read recent transactions', cause))
  }
}

/** Read all transactions (for history screen) */
export const getAllTransactions = async (): Promise<Result<Transaction[], AppError>> => {
  try {
    const transactions = await db.transactions
      .orderBy('recorded_at')
      .reverse()
      .toArray()
    return ok(transactions as Transaction[])
  } catch (cause) {
    logger.error('repository:get_all_failed', cause)
    return err(appError('DEXIE_READ_FAILED', 'Failed to read transactions', cause))
  }
}

// ─── Business ─────────────────────────────────────────────────────────────

/** Read the current business (there is at most one per user session) */
export const getBusiness = async (): Promise<Result<Business | null, AppError>> => {
  try {
    const business = await db.business.toCollection().first()
    return ok((business as Business | undefined) ?? null)
  } catch (cause) {
    logger.error('repository:get_business_failed', cause)
    return err(appError('DEXIE_READ_FAILED', 'Failed to read business', cause))
  }
}

/** Save or update the business record */
export const saveBusiness = async (
  business: Omit<Business, 'id'>
): Promise<Result<number, AppError>> => {
  try {
    const existing = await db.business.toCollection().first()
    let id: number
    if (existing?.id) {
      await db.business.update(existing.id, business)
      id = existing.id
    } else {
      id = await db.business.add(business as unknown as import('./db').Business) as number
    }
    logger.info('repository:business_saved', { name: '[redacted]' })
    return ok(id)
  } catch (cause) {
    logger.error('repository:business_save_failed', cause)
    return err(appError('DEXIE_WRITE_FAILED', 'Failed to save business', cause))
  }
}

// ─── Sync Queue ───────────────────────────────────────────────────────────

/** Add an entry to the offline sync queue */
export const enqueue = async (
  entry: Omit<SyncQueueEntry, 'id'>
): Promise<Result<void, AppError>> => {
  try {
    await db.sync_queue.add(entry as unknown as import('./db').SyncQueueItem)
    return ok(undefined)
  } catch (cause) {
    logger.error('repository:enqueue_failed', cause, { table: entry.table_name })
    return err(appError('DEXIE_WRITE_FAILED', 'Failed to enqueue sync entry', cause))
  }
}

/** Read all unsynced queue entries */
export const getUnsyncedQueue = async (): Promise<Result<SyncQueueEntry[], AppError>> => {
  try {
    const entries = await db.sync_queue
      .where('synced')
      .equals(0)
      .toArray()
    return ok(entries as unknown as SyncQueueEntry[])
  } catch (cause) {
    logger.error('repository:get_queue_failed', cause)
    return err(appError('DEXIE_READ_FAILED', 'Failed to read sync queue', cause))
  }
}

/** Mark a queue entry as synced */
export const markSynced = async (id: number): Promise<Result<void, AppError>> => {
  try {
    await db.sync_queue.update(id, { synced: 1 })
    return ok(undefined)
  } catch (cause) {
    logger.error('repository:mark_synced_failed', cause, { id })
    return err(appError('DEXIE_WRITE_FAILED', 'Failed to mark entry synced', cause))
  }
}

// ─── Profit Calculations ──────────────────────────────────────────────────
// Pure functions — no Dexie access. These derive aggregate values from arrays.

/** Calculate net profit from a transaction array */
export const calculateProfit = (transactions: Transaction[]): KES => {
  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const outflow = transactions
    .filter(t => t.type === 'expense' || t.type === 'withdrawal' || t.type === 'debt_repaid')
    .reduce((sum, t) => sum + t.amount, 0)

  return kes(income - outflow)
}

/** Calculate total Fuliza debt (debt_taken - debt_repaid) */
export const calculateFulizaDebt = (transactions: Transaction[]): KES => {
  const taken   = transactions.filter(t => t.type === 'debt_taken').reduce((s, t) => s + t.amount, 0)
  const repaid  = transactions.filter(t => t.type === 'debt_repaid').reduce((s, t) => s + t.amount, 0)
  return kes(taken - repaid)
}

/** Calculate daily profit for each of the last 7 days (for bar chart) */
export const calculateWeeklyProfits = (
  transactions: Transaction[]
): Array<{ date: string; profit: KES; label: string }> => {
  const results = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const dayTx = transactions.filter(t => t.recorded_at.startsWith(dateStr))
    results.push({
      date:   dateStr,
      profit: calculateProfit(dayTx),
      label:  d.toLocaleDateString('en-KE', { weekday: 'short' }),
    })
  }
  return results
}
