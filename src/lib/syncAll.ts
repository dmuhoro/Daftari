import { db, type Transaction, type Business, type Customer, type DailyClose, type Supplier, type PurchaseOrder, type StockAdjustment } from './db'
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

  const suppliers = await db.suppliers.toArray()
  if (suppliers.length > 0) {
    results.suppliers = await upsertToRemote('daftari_suppliers', suppliers.map(s => ({
      local_id: s.local_id,
      name: s.name,
      phone: s.phone,
      email: s.email,
      address: s.address,
      notes: s.notes,
      business_id: s.business_id,
      created_at: s.created_at,
      updated_at: new Date().toISOString(),
    })))
  }

  const purchaseOrders = await db.purchase_orders.toArray()
  if (purchaseOrders.length > 0) {
    results.purchase_orders = await upsertToRemote('daftari_purchase_orders', purchaseOrders.map(po => ({
      local_id: po.local_id,
      business_id: po.business_id,
      supplier_id: po.supplier_id,
      items: po.items,
      status: po.status,
      total_cost: po.total_cost,
      notes: po.notes,
      created_at: po.created_at,
      updated_at: new Date().toISOString(),
    })))
  }

  const stockAdjustments = await db.stock_adjustments.toArray()
  if (stockAdjustments.length > 0) {
    results.stock_adjustments = await upsertToRemote('daftari_stock_adjustments', stockAdjustments.map(a => ({
      local_id: a.local_id,
      business_id: a.business_id,
      product_id: a.product_id,
      product_name: a.product_name,
      quantity_change: a.quantity_change,
      reason: a.reason,
      reason_text: a.reason_text,
      notes: a.notes,
      created_at: a.created_at,
    })))
  }

  logger.info('sync:all_tables_complete', Object.fromEntries(
    Object.entries(results).map(([k, v]) => [k, `${v.synced} synced, ${v.failed} failed`])
  ))

  return results
}

const PAGE_SIZE = 500

export async function pullFromSupabase(): Promise<{ restored: string[]; errors: string[] }> {
  const restored: string[] = []
  const errors: string[] = []
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { restored, errors: ['No authenticated user'] }

  async function pullTable(
    table: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filters?: (q: any) => any
  ): Promise<{ data: Record<string, unknown>[]; error: unknown }> {
    const all: Record<string, unknown>[] = []
    let from = 0

    while (true) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q: any = supabase.from(table).select('*').range(from, from + PAGE_SIZE - 1)
      if (filters) q = filters(q)
      const { data, error } = await q as { data: Record<string, unknown>[] | null; error: unknown }
      if (error) return { data: [], error }
      if (!data || data.length === 0) break
      all.push(...data)
      if (data.length < PAGE_SIZE) break
      from += PAGE_SIZE
    }

    return { data: all, error: null }
  }

  try {
    // Pull transactions (paginated)
    {
      const { data: remoteTx, error: txErr } = await pullTable('daftari_transactions', q => q.eq('user_id', user.id))
      if (txErr) throw txErr
      if (remoteTx.length > 0) {
        for (const tx of remoteTx) {
          const existing = await db.transactions.where('local_id').equals(tx.local_id as string).first()
          if (!existing || (tx.updated_at && existing.updated_at && tx.updated_at > existing.updated_at)) {
            await db.transactions.put(tx as unknown as Transaction)
          }
        }
        restored.push(`${remoteTx.length} transactions`)
      }
    }

    // Pull businesses (paginated)
    let remoteBiz: Record<string, unknown>[] = []
    {
      const { data, error: bizErr } = await pullTable('daftari_businesses', q => q.eq('user_id', user.id))
      if (bizErr) throw bizErr
      remoteBiz = data
      if (data.length > 0) {
        for (const biz of data) {
          const existing = await db.business.where('local_id').equals(biz.local_id as string).first()
          if (!existing || (biz.updated_at && existing.updated_at && biz.updated_at > existing.updated_at)) {
            await db.business.put(biz as unknown as Business)
          }
        }
        restored.push(`${data.length} businesses`)
      }
    }

    // Collect user's business IDs for tenant-scoped pulls
    const bizIds = remoteBiz.map(b => b.local_id as string).filter(Boolean)

    // Pull customers (paginated, scoped to user's businesses)
    {
      const { data, error } = bizIds.length > 0
        ? await pullTable('daftari_customers', q => q.in('business_id', bizIds))
        : await pullTable('daftari_customers')
      if (!error && data.length > 0) {
        let count = 0
        for (const c of data) {
          const existing = c.local_id ? await db.customers.where('local_id').equals(c.local_id as string).first() : null
          if (!existing) { await db.customers.put(c as unknown as Customer); count++ }
        }
        restored.push(`${count} customers`)
      }
    }

    // Pull daily closes (paginated, scoped to user's businesses)
    {
      const { data, error } = bizIds.length > 0
        ? await pullTable('daftari_daily_closes', q => q.in('business_id', bizIds))
        : await pullTable('daftari_daily_closes')
      if (!error && data.length > 0) {
        let count = 0
        for (const c of data) {
          const existing = c.local_id ? await db.daily_closes.where('local_id').equals(c.local_id as string).first() : null
          if (!existing) { await db.daily_closes.put(c as unknown as DailyClose); count++ }
        }
        restored.push(`${count} daily closes`)
      }
    }

    // Pull suppliers (table may not exist for older deployments)
    try {
      const { data, error } = bizIds.length > 0
        ? await pullTable('daftari_suppliers', q => q.in('business_id', bizIds))
        : await pullTable('daftari_suppliers')
      if (!error && data.length > 0) {
        let count = 0
        for (const s of data) {
          const existing = s.local_id ? await db.suppliers.where('local_id').equals(s.local_id as string).first() : null
          if (!existing) { await db.suppliers.put(s as unknown as Supplier); count++ }
        }
        restored.push(`${count} suppliers`)
      }
    } catch (cause) { logger.warn('sync:pull_suppliers_table_missing', { error: cause instanceof Error ? cause.message : String(cause) }) }

    // Pull purchase orders (table may not exist for older deployments)
    try {
      const { data, error } = bizIds.length > 0
        ? await pullTable('daftari_purchase_orders', q => q.in('business_id', bizIds))
        : await pullTable('daftari_purchase_orders')
      if (!error && data.length > 0) {
        let count = 0
        for (const po of data) {
          const existing = po.local_id ? await db.purchase_orders.where('local_id').equals(po.local_id as string).first() : null
          if (!existing) { await db.purchase_orders.put(po as unknown as PurchaseOrder); count++ }
        }
        restored.push(`${count} purchase orders`)
      }
    } catch (cause) { logger.warn('sync:pull_purchase_orders_table_missing', { error: cause instanceof Error ? cause.message : String(cause) }) }

    // Pull stock adjustments (table may not exist for older deployments)
    try {
      const { data, error } = bizIds.length > 0
        ? await pullTable('daftari_stock_adjustments', q => q.in('business_id', bizIds))
        : await pullTable('daftari_stock_adjustments')
      if (!error && data.length > 0) {
        let count = 0
        for (const a of data) {
          const existing = a.local_id ? await db.stock_adjustments.where('local_id').equals(a.local_id as string).first() : null
          if (!existing) { await db.stock_adjustments.put(a as unknown as StockAdjustment); count++ }
        }
        restored.push(`${count} stock adjustments`)
      }
    } catch (cause) { logger.warn('sync:pull_stock_adjustments_table_missing', { error: cause instanceof Error ? cause.message : String(cause) }) }
  } catch (cause) {
    const msg = cause instanceof Error ? cause.message : String(cause)
    errors.push(msg)
    captureError(cause, { feature: 'sync', action: 'pullFromSupabase' })
  }

  return { restored, errors }
}
