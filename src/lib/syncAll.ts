import { db } from './db'
import { supabase } from './supabase'
import { logger } from './logger'
import { captureError } from './sentry'

interface SyncResult {
  synced: number
  failed: number
  errors: string[]
}

async function upsertToRemote(
  table: string,
  records: Record<string, unknown>[]
): Promise<SyncResult> {
  const result: SyncResult = { synced: 0, failed: 0, errors: [] }
  for (const record of records) {
    try {
      const { error } = await supabase
        .from(table)
        .upsert(record, { onConflict: 'local_id' })
      if (error) throw error
      result.synced++
    } catch (cause) {
      result.failed++
      result.errors.push(cause instanceof Error ? cause.message : String(cause))
    }
  }
  return result
}

export async function syncAllTables(): Promise<Record<string, SyncResult>> {
  const results: Record<string, SyncResult> = {}

  // Sync transactions
  const unsyncedTx = await db.transactions.where('synced').equals(0).toArray()
  if (unsyncedTx.length > 0) {
    results.transactions = await upsertToRemote('daftari_transactions', unsyncedTx as unknown as Record<string, unknown>[])
    if (results.transactions.synced > 0) {
      const ids = unsyncedTx.slice(0, results.transactions.synced).map(t => t.local_id)
      await db.transactions.where('local_id').anyOf(ids).modify({ synced: 1 })
    }
  }

  // Sync businesses
  const businesses = await db.business.toArray()
  if (businesses.length > 0) {
    results.businesses = await upsertToRemote('daftari_businesses', businesses.map(b => ({
      local_id: b.local_id || b.user_id || crypto.randomUUID(),
      name: b.name,
      owner_name: b.owner_name,
      currency: b.currency,
      user_id: b.user_id,
      category: b.category,
      subcategory: b.subcategory,
      payment_methods: b.payment_methods,
      products: b.products,
      created_at: b.created_at,
      updated_at: new Date().toISOString(),
    })))
  }

  // Sync daily closes
  const closes = await db.daily_closes.toArray()
  if (closes.length > 0) {
    results.daily_closes = await upsertToRemote('daftari_daily_closes', closes.map(c => ({
      local_id: c.local_id || c.date,
      date: c.date,
      business_id: c.business_id,
      profit: c.profit,
      revenue: c.revenue,
      expenses: c.expenses,
      created_at: c.created_at,
      updated_at: new Date().toISOString(),
    })))
  }

  // Sync customers
  const customers = await db.customers.toArray()
  if (customers.length > 0) {
    results.customers = await upsertToRemote('daftari_customers', customers.map(c => ({
      local_id: c.local_id || c.name,
      name: c.name,
      phone: c.phone,
      business_id: c.business_id,
      total_visits: c.total_visits,
      total_spent: c.total_spent,
      last_visit: c.last_visit,
      created_at: c.created_at,
      updated_at: new Date().toISOString(),
    })))
  }

  logger.info('sync:all_tables_complete', Object.fromEntries(
    Object.entries(results).map(([k, v]) => [k, `${v.synced} synced, ${v.failed} failed`])
  ))

  return results
}

export async function pullFromSupabase(): Promise<{ restored: string[]; errors: string[] }> {
  const restored: string[] = []
  const errors: string[] = []
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { restored, errors: ['No authenticated user'] }

  try {
    // Pull transactions
    const { data: remoteTx, error: txErr } = await supabase
      .from('daftari_transactions')
      .select('*')
      .eq('user_id', user.id)
    if (txErr) throw txErr
    if (remoteTx && remoteTx.length > 0) {
      for (const tx of remoteTx) {
        const existing = await db.transactions.where('local_id').equals(tx.local_id).first()
        if (!existing || (tx.updated_at && existing.updated_at && tx.updated_at > existing.updated_at)) {
          await db.transactions.put(tx)
        }
      }
      restored.push(`${remoteTx.length} transactions`)
    }

    // Pull businesses
    const { data: remoteBiz, error: bizErr } = await supabase
      .from('daftari_businesses')
      .select('*')
      .eq('user_id', user.id)
    if (bizErr) throw bizErr
    if (remoteBiz && remoteBiz.length > 0) {
      for (const biz of remoteBiz) {
        const existing = await db.business.where('local_id').equals(biz.local_id).first()
        if (!existing || (biz.updated_at && existing.updated_at && biz.updated_at > existing.updated_at)) {
          await db.business.put(biz)
        }
      }
      restored.push(`${remoteBiz.length} businesses`)
    }
  } catch (cause) {
    const msg = cause instanceof Error ? cause.message : String(cause)
    errors.push(msg)
    captureError(cause, { feature: 'sync', action: 'pullFromSupabase' })
  }

  return { restored, errors }
}
