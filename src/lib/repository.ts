import { db, type Transaction, type Business } from './db'
import type {
  DailyClose, Customer, Supplier, StockAdjustment, PurchaseOrder,
} from './db'
import { logger } from './logger'
import { ok, err, appError } from './types'
import type { Result, AppError } from './types'
import { cents } from './money'

// ─── Transactions ────────────────────────────────────────────────────────────

export const saveTransaction = async (
  tx: Omit<Transaction, 'id'>
): Promise<Result<number, AppError>> => {
  try {
    const id = await db.transactions.add(tx as Transaction)
    return ok(id as number)
  } catch (cause) {
    logger.error('repository:save_transaction_failed', cause)
    return err(appError('DEXIE_WRITE_FAILED', 'Failed to save transaction', cause))
  }
}

export const updateTransaction = async (
  local_id: string,
  updates: Partial<Omit<Transaction, 'id' | 'local_id'>>
): Promise<Result<void, AppError>> => {
  try {
    await db.transactions.where('local_id').equals(local_id).modify(updates)
    return ok(undefined)
  } catch (cause) {
    logger.error('repository:update_transaction_failed', cause, { local_id })
    return err(appError('DEXIE_WRITE_FAILED', 'Failed to update transaction', cause))
  }
}

export const deleteTransaction = async (
  local_id: string
): Promise<Result<void, AppError>> => {
  try {
    await db.transactions.where('local_id').equals(local_id).delete()
    return ok(undefined)
  } catch (cause) {
    logger.error('repository:delete_transaction_failed', cause, { local_id })
    return err(appError('DEXIE_WRITE_FAILED', 'Failed to delete transaction', cause))
  }
}

export const getAllTransactions = async (): Promise<Result<Transaction[], AppError>> => {
  try {
    const txs = await db.transactions.orderBy('recorded_at').reverse().toArray()
    return ok(txs)
  } catch (cause) {
    logger.error('repository:get_all_transactions_failed', cause)
    return err(appError('DEXIE_READ_FAILED', 'Failed to read transactions', cause))
  }
}

// ─── Business ────────────────────────────────────────────────────────────────

export const getBusiness = async (): Promise<Result<Business | null, AppError>> => {
  try {
    const b = await db.business.toCollection().first()
    return ok(b ?? null)
  } catch (cause) {
    logger.error('repository:get_business_failed', cause)
    return err(appError('DEXIE_READ_FAILED', 'Failed to read business', cause))
  }
}

export const getAllBusinesses = async (): Promise<Result<Business[], AppError>> => {
  try {
    const list = await db.business.toArray()
    return ok(list)
  } catch (cause) {
    logger.error('repository:get_all_businesses_failed', cause)
    return err(appError('DEXIE_READ_FAILED', 'Failed to read businesses', cause))
  }
}

export const addBusiness = async (
  business: Business
): Promise<Result<number, AppError>> => {
  try {
    const id = await db.business.add(business)
    return ok(id as number)
  } catch (cause) {
    logger.error('repository:add_business_failed', cause)
    return err(appError('DEXIE_WRITE_FAILED', 'Failed to add business', cause))
  }
}

export const updateBusiness = async (
  id: number,
  updates: Partial<Business>
): Promise<Result<void, AppError>> => {
  try {
    await db.business.update(id, updates)
    return ok(undefined)
  } catch (cause) {
    logger.error('repository:update_business_failed', cause, { id })
    return err(appError('DEXIE_WRITE_FAILED', 'Failed to update business', cause))
  }
}

// ─── Sync Queue ──────────────────────────────────────────────────────────────

export const countUnsyncedQueueItems = async (): Promise<Result<number, AppError>> => {
  try {
    const count = await db.sync_queue.where('synced').equals(0).count()
    return ok(count)
  } catch (cause) {
    logger.error('repository:count_unsynced_queue_failed', cause)
    return err(appError('DEXIE_READ_FAILED', 'Failed to count unsynced queue', cause))
  }
}

// ─── Daily Closes ────────────────────────────────────────────────────────────

export const saveDailyClose = async (
  close: Omit<DailyClose, 'id'>
): Promise<Result<number, AppError>> => {
  try {
    const id = await db.daily_closes.add(close as DailyClose)
    return ok(id as number)
  } catch (cause) {
    logger.error('repository:save_daily_close_failed', cause)
    return err(appError('DEXIE_WRITE_FAILED', 'Failed to save daily close', cause))
  }
}

export const getDailyClosesByBusinessId = async (
  businessId: string
): Promise<Result<DailyClose[], AppError>> => {
  try {
    const closes = await db.daily_closes.where('business_id').equals(businessId).toArray()
    return ok(closes)
  } catch (cause) {
    logger.error('repository:get_daily_closes_by_business_failed', cause, { businessId })
    return err(appError('DEXIE_READ_FAILED', 'Failed to read daily closes by business', cause))
  }
}

// ─── Customers ───────────────────────────────────────────────────────────────

export const getCustomersByBusinessId = async (
  businessId: string
): Promise<Result<Customer[], AppError>> => {
  try {
    const customers = await db.customers.where('business_id').equals(businessId).toArray()
    return ok(customers)
  } catch (cause) {
    logger.error('repository:get_customers_by_business_failed', cause, { businessId })
    return err(appError('DEXIE_READ_FAILED', 'Failed to read customers by business', cause))
  }
}

export const getCustomerByName = async (
  name: string
): Promise<Result<Customer | null, AppError>> => {
  try {
    const customer = await db.customers.where('name').equals(name).first()
    return ok(customer ?? null)
  } catch (cause) {
    logger.error('repository:get_customer_by_name_failed', cause)
    return err(appError('DEXIE_READ_FAILED', 'Failed to read customer', cause))
  }
}

export const countCustomers = async (): Promise<Result<number, AppError>> => {
  try {
    const count = await db.customers.count()
    return ok(count)
  } catch (cause) {
    logger.error('repository:count_customers_failed', cause)
    return err(appError('DEXIE_READ_FAILED', 'Failed to count customers', cause))
  }
}

export const saveCustomer = async (
  customer: Omit<Customer, 'id'>
): Promise<Result<number, AppError>> => {
  try {
    const id = await db.customers.add(customer as Customer)
    return ok(id as number)
  } catch (cause) {
    logger.error('repository:save_customer_failed', cause)
    return err(appError('DEXIE_WRITE_FAILED', 'Failed to save customer', cause))
  }
}

export const updateCustomer = async (
  id: number,
  updates: Partial<Customer>
): Promise<Result<void, AppError>> => {
  try {
    await db.customers.update(id, updates)
    return ok(undefined)
  } catch (cause) {
    logger.error('repository:update_customer_failed', cause, { id })
    return err(appError('DEXIE_WRITE_FAILED', 'Failed to update customer', cause))
  }
}

// ─── Suppliers ───────────────────────────────────────────────────────────────

export const saveSupplier = async (
  supplier: Omit<Supplier, 'id'>
): Promise<Result<number, AppError>> => {
  try {
    const id = await db.suppliers.add(supplier as Supplier)
    return ok(id as number)
  } catch (cause) {
    logger.error('repository:save_supplier_failed', cause)
    return err(appError('DEXIE_WRITE_FAILED', 'Failed to save supplier', cause))
  }
}

export const getSuppliersByBusinessId = async (
  businessId: string
): Promise<Result<Supplier[], AppError>> => {
  try {
    const suppliers = await db.suppliers.where('business_id').equals(businessId).toArray()
    return ok(suppliers)
  } catch (cause) {
    logger.error('repository:get_suppliers_by_business_failed', cause, { businessId })
    return err(appError('DEXIE_READ_FAILED', 'Failed to read suppliers by business', cause))
  }
}

export const deleteSupplierByLocalId = async (
  localId: string
): Promise<Result<void, AppError>> => {
  try {
    await db.suppliers.where('local_id').equals(localId).delete()
    return ok(undefined)
  } catch (cause) {
    logger.error('repository:delete_supplier_failed', cause, { localId })
    return err(appError('DEXIE_WRITE_FAILED', 'Failed to delete supplier', cause))
  }
}

// ─── Purchase Orders ─────────────────────────────────────────────────────────

export const getPurchaseOrdersByBusinessId = async (
  businessId: string
): Promise<Result<PurchaseOrder[], AppError>> => {
  try {
    const orders = await db.purchase_orders
      .where('business_id').equals(businessId)
      .reverse()
      .toArray()
    return ok(orders)
  } catch (cause) {
    logger.error('repository:get_pos_by_business_failed', cause, { businessId })
    return err(appError('DEXIE_READ_FAILED', 'Failed to read purchase orders by business', cause))
  }
}

export const savePurchaseOrder = async (
  order: Omit<PurchaseOrder, 'id'>
): Promise<Result<number, AppError>> => {
  try {
    const id = await db.purchase_orders.add(order as PurchaseOrder)
    return ok(id as number)
  } catch (cause) {
    logger.error('repository:save_purchase_order_failed', cause)
    return err(appError('DEXIE_WRITE_FAILED', 'Failed to save purchase order', cause))
  }
}

export const updatePurchaseOrderByLocalId = async (
  localId: string,
  updates: Partial<PurchaseOrder>
): Promise<Result<void, AppError>> => {
  try {
    await db.purchase_orders.where('local_id').equals(localId).modify(updates)
    return ok(undefined)
  } catch (cause) {
    logger.error('repository:update_po_by_local_id_failed', cause, { localId })
    return err(appError('DEXIE_WRITE_FAILED', 'Failed to update purchase order', cause))
  }
}

// ─── Stock Adjustments ───────────────────────────────────────────────────────

export const getStockAdjustmentsByBusinessId = async (
  businessId: string
): Promise<Result<StockAdjustment[], AppError>> => {
  try {
    const adjustments = await db.stock_adjustments
      .where('business_id').equals(businessId)
      .reverse()
      .toArray()
    return ok(adjustments)
  } catch (cause) {
    logger.error('repository:get_adjustments_by_business_failed', cause, { businessId })
    return err(appError('DEXIE_READ_FAILED', 'Failed to read stock adjustments by business', cause))
  }
}

export const saveStockAdjustment = async (
  adj: Omit<StockAdjustment, 'id'>
): Promise<Result<number, AppError>> => {
  try {
    const id = await db.stock_adjustments.add(adj as StockAdjustment)
    return ok(id as number)
  } catch (cause) {
    logger.error('repository:save_stock_adjustment_failed', cause)
    return err(appError('DEXIE_WRITE_FAILED', 'Failed to save stock adjustment', cause))
  }
}

// ─── Push Subscriptions ───────────────────────────────────────────────────────

export const upsertPushSubscription = async (
  userId: string,
  subscription: PushSubscription
): Promise<Result<void, AppError>> => {
  try {
    const { supabase } = await import('./supabase')
    const { error } = await supabase.from('daftari_push_subscriptions').upsert({
      user_id: userId,
      subscription: JSON.stringify(subscription),
      created_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    if (error) throw error
    return ok(undefined)
  } catch (cause) {
    logger.error('repository:upsert_push_subscription_failed', cause)
    return err(appError('SUPABASE_UPSERT_FAILED', 'Failed to save push subscription', cause))
  }
}

export const deletePushSubscription = async (
  userId: string
): Promise<Result<void, AppError>> => {
  try {
    const { supabase } = await import('./supabase')
    const { error } = await supabase.from('daftari_push_subscriptions').delete().eq('user_id', userId)
    if (error) throw error
    return ok(undefined)
  } catch (cause) {
    logger.error('repository:delete_push_subscription_failed', cause)
    return err(appError('SUPABASE_UPSERT_FAILED', 'Failed to delete push subscription', cause))
  }
}

// ─── Pure aggregation helpers (no Dexie) ─────────────────────────────────────

export const calculateProfit = (transactions: Transaction[]): number => {
  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  const outflow = transactions
    .filter(t => t.type === 'expense' || t.type === 'withdrawal' || t.type === 'debt_repaid')
    .reduce((sum, t) => sum + t.amount, 0)
  return cents(income - outflow)
}

export const calculateFulizaDebt = (transactions: Transaction[]): number => {
  const taken   = transactions.filter(t => t.type === 'debt_taken').reduce((s, t) => s + t.amount, 0)
  const repaid  = transactions.filter(t => t.type === 'debt_repaid').reduce((s, t) => s + t.amount, 0)
  return cents(taken - repaid)
}

export const calculateWeeklyProfits = (
  transactions: Transaction[]
): Array<{ date: string; profit: number; label: string }> => {
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
