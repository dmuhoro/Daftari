import { db, type Transaction, type SyncQueueItem, type Business } from './db'
import type {
  DailyClose, Customer, Supplier, StockAdjustment, PurchaseOrder,
} from './db'
import { logger } from './logger'
import { ok, err, appError } from './types'
import type { Result, AppError } from './types'

// ─── Helpers ────────────────────────────────────────────────────────────────

const todayBounds = () => {
  const now = new Date()
  const nairobi = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Nairobi' }))
  const start = new Date(nairobi); start.setHours(0, 0, 0, 0)
  const end = new Date(nairobi); end.setHours(23, 59, 59, 999)
  return { start: start.toISOString(), end: end.toISOString() }
}

const monthBounds = () => {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  return { start: start.toISOString(), end: now.toISOString() }
}

const daysAgo = (days: number) => {
  const d = new Date(); d.setDate(d.getDate() - days)
  return d.toISOString()
}

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

export const getTransactionByLocalId = async (
  local_id: string
): Promise<Result<Transaction | null, AppError>> => {
  try {
    const tx = await db.transactions.where('local_id').equals(local_id).first()
    return ok(tx ?? null)
  } catch (cause) {
    logger.error('repository:get_transaction_failed', cause, { local_id })
    return err(appError('DEXIE_READ_FAILED', 'Failed to read transaction', cause))
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

export const getTransactionsBetween = async (
  start: string,
  end: string
): Promise<Result<Transaction[], AppError>> => {
  try {
    const txs = await db.transactions
      .where('recorded_at')
      .between(start, end, true, true)
      .toArray()
    return ok(txs)
  } catch (cause) {
    logger.error('repository:get_between_failed', cause, { start, end })
    return err(appError('DEXIE_READ_FAILED', 'Failed to read transactions', cause))
  }
}

export const getTodayTransactions = async (): Promise<Result<Transaction[], AppError>> => {
  const { start, end } = todayBounds()
  return getTransactionsBetween(start, end)
}

export const getRecentTransactions = async (
  days: number
): Promise<Result<Transaction[], AppError>> => {
  try {
    const txs = await db.transactions
      .where('recorded_at')
      .above(daysAgo(days))
      .reverse()
      .toArray()
    return ok(txs)
  } catch (cause) {
    logger.error('repository:get_recent_failed', cause, { days })
    return err(appError('DEXIE_READ_FAILED', 'Failed to read recent transactions', cause))
  }
}

export const getTransactionsForMonth = async (): Promise<Result<Transaction[], AppError>> => {
  const { start, end } = monthBounds()
  return getTransactionsBetween(start, end)
}

export const getLastTransaction = async (): Promise<Result<Transaction | null, AppError>> => {
  try {
    const tx = await db.transactions.orderBy('recorded_at').last()
    return ok(tx ?? null)
  } catch (cause) {
    logger.error('repository:get_last_tx_failed', cause)
    return err(appError('DEXIE_READ_FAILED', 'Failed to read last transaction', cause))
  }
}

export const getUnsyncedTransactions = async (): Promise<Result<Transaction[], AppError>> => {
  try {
    const txs = await db.transactions.where('synced').equals(0).toArray()
    return ok(txs)
  } catch (cause) {
    logger.error('repository:get_unsynced_transactions_failed', cause)
    return err(appError('DEXIE_READ_FAILED', 'Failed to read unsynced transactions', cause))
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

export const saveBusiness = async (name: string): Promise<Result<number, AppError>> => {
  try {
    const existing = await db.business.toCollection().first()
    if (existing?.id) {
      await db.business.update(existing.id, { name })
      return ok(existing.id)
    }
    const id = await db.business.add({
      name,
      currency: 'KES',
      created_at: new Date().toISOString(),
    } as Business)
    return ok(id as number)
  } catch (cause) {
    logger.error('repository:save_business_failed', cause)
    return err(appError('DEXIE_WRITE_FAILED', 'Failed to save business', cause))
  }
}

// ─── Sync Queue ──────────────────────────────────────────────────────────────

export const addSyncQueueItem = async (
  item: Omit<SyncQueueItem, 'id'>
): Promise<Result<void, AppError>> => {
  try {
    await db.sync_queue.add(item as SyncQueueItem)
    return ok(undefined)
  } catch (cause) {
    logger.error('repository:add_sync_queue_failed', cause)
    return err(appError('DEXIE_WRITE_FAILED', 'Failed to add sync queue item', cause))
  }
}

export const getUnsyncedQueue = async (): Promise<Result<SyncQueueItem[], AppError>> => {
  try {
    const items = await db.sync_queue.where('synced').equals(0).toArray()
    return ok(items)
  } catch (cause) {
    logger.error('repository:get_unsynced_queue_failed', cause)
    return err(appError('DEXIE_READ_FAILED', 'Failed to read sync queue', cause))
  }
}

export const getAllSyncQueueItems = async (): Promise<Result<SyncQueueItem[], AppError>> => {
  try {
    const items = await db.sync_queue.toArray()
    return ok(items)
  } catch (cause) {
    logger.error('repository:get_all_sync_queue_failed', cause)
    return err(appError('DEXIE_READ_FAILED', 'Failed to read sync queue', cause))
  }
}

export const countUnsyncedQueueItems = async (): Promise<Result<number, AppError>> => {
  try {
    const count = await db.sync_queue.where('synced').equals(0).count()
    return ok(count)
  } catch (cause) {
    logger.error('repository:count_unsynced_queue_failed', cause)
    return err(appError('DEXIE_READ_FAILED', 'Failed to count unsynced queue', cause))
  }
}

export const markSynced = async (id: number): Promise<Result<void, AppError>> => {
  try {
    await db.sync_queue.update(id, { synced: 1 })
    return ok(undefined)
  } catch (cause) {
    logger.error('repository:mark_synced_failed', cause, { id })
    return err(appError('DEXIE_WRITE_FAILED', 'Failed to mark entry synced', cause))
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

export const upsertDailyClose = async (
  date: string,
  data: Omit<DailyClose, 'id' | 'date'>
): Promise<Result<number, AppError>> => {
  try {
    const existing = await db.daily_closes.where('date').equals(date).first()
    if (existing?.id) {
      await db.daily_closes.update(existing.id, data)
      return ok(existing.id)
    }
    const id = await db.daily_closes.add({ ...data, date } as DailyClose)
    return ok(id as number)
  } catch (cause) {
    logger.error('repository:upsert_daily_close_failed', cause, { date })
    return err(appError('DEXIE_WRITE_FAILED', 'Failed to upsert daily close', cause))
  }
}

export const getDailyCloseByDate = async (
  date: string
): Promise<Result<DailyClose | null, AppError>> => {
  try {
    const close = await db.daily_closes.where('date').equals(date).first()
    return ok(close ?? null)
  } catch (cause) {
    logger.error('repository:get_daily_close_failed', cause, { date })
    return err(appError('DEXIE_READ_FAILED', 'Failed to read daily close', cause))
  }
}

export const getLatestDailyClose = async (): Promise<Result<DailyClose | null, AppError>> => {
  try {
    const close = await db.daily_closes.orderBy('date').last()
    return ok(close ?? null)
  } catch (cause) {
    logger.error('repository:get_latest_daily_close_failed', cause)
    return err(appError('DEXIE_READ_FAILED', 'Failed to read latest daily close', cause))
  }
}

export const getAllDailyCloses = async (): Promise<Result<DailyClose[], AppError>> => {
  try {
    const closes = await db.daily_closes.toArray()
    return ok(closes)
  } catch (cause) {
    logger.error('repository:get_all_daily_closes_failed', cause)
    return err(appError('DEXIE_READ_FAILED', 'Failed to read daily closes', cause))
  }
}

// ─── Customers ───────────────────────────────────────────────────────────────

export const getAllCustomers = async (): Promise<Result<Customer[], AppError>> => {
  try {
    const customers = await db.customers.toArray()
    return ok(customers)
  } catch (cause) {
    logger.error('repository:get_all_customers_failed', cause)
    return err(appError('DEXIE_READ_FAILED', 'Failed to read customers', cause))
  }
}

export const getCustomerByName = async (
  name: string
): Promise<Result<Customer | null, AppError>> => {
  try {
    const customer = await db.customers.where('name').equals(name).first()
    return ok(customer ?? null)
  } catch (cause) {
    logger.error('repository:get_customer_by_name_failed', cause, { name })
    return err(appError('DEXIE_READ_FAILED', 'Failed to read customer', cause))
  }
}

export const countCustomersByName = async (
  name: string
): Promise<Result<number, AppError>> => {
  try {
    const count = await db.customers.where('name').equals(name).count()
    return ok(count)
  } catch (cause) {
    logger.error('repository:count_customers_by_name_failed', cause, { name })
    return err(appError('DEXIE_READ_FAILED', 'Failed to count customers', cause))
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

export const upsertCustomer = async (
  customer: Omit<Customer, 'id'>
): Promise<Result<number, AppError>> => {
  try {
    const existing = await db.customers.where('name').equals(customer.name).first()
    if (existing?.id) {
      await db.customers.update(existing.id, customer)
      return ok(existing.id)
    }
    const id = await db.customers.add(customer as Customer)
    return ok(id as number)
  } catch (cause) {
    logger.error('repository:upsert_customer_failed', cause)
    return err(appError('DEXIE_WRITE_FAILED', 'Failed to upsert customer', cause))
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

export const getUnsyncedCustomers = async (): Promise<Result<Customer[], AppError>> => {
  try {
    const customers = await db.customers.where('synced').equals(0).toArray()
    return ok(customers)
  } catch (cause) {
    logger.error('repository:get_unsynced_customers_failed', cause)
    return err(appError('DEXIE_READ_FAILED', 'Failed to read unsynced customers', cause))
  }
}

// ─── Suppliers ───────────────────────────────────────────────────────────────

export const getAllSuppliers = async (): Promise<Result<Supplier[], AppError>> => {
  try {
    const suppliers = await db.suppliers.toArray()
    return ok(suppliers)
  } catch (cause) {
    logger.error('repository:get_all_suppliers_failed', cause)
    return err(appError('DEXIE_READ_FAILED', 'Failed to read suppliers', cause))
  }
}

export const countSuppliersByName = async (
  name: string
): Promise<Result<number, AppError>> => {
  try {
    const count = await db.suppliers.where('name').equals(name).count()
    return ok(count)
  } catch (cause) {
    logger.error('repository:count_suppliers_by_name_failed', cause, { name })
    return err(appError('DEXIE_READ_FAILED', 'Failed to count suppliers', cause))
  }
}

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

export const updateSupplier = async (
  id: number,
  updates: Partial<Supplier>
): Promise<Result<void, AppError>> => {
  try {
    await db.suppliers.update(id, updates)
    return ok(undefined)
  } catch (cause) {
    logger.error('repository:update_supplier_failed', cause, { id })
    return err(appError('DEXIE_WRITE_FAILED', 'Failed to update supplier', cause))
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

export const getUnsyncedSuppliers = async (): Promise<Result<Supplier[], AppError>> => {
  try {
    const suppliers = await db.suppliers.where('synced').equals(0).toArray()
    return ok(suppliers)
  } catch (cause) {
    logger.error('repository:get_unsynced_suppliers_failed', cause)
    return err(appError('DEXIE_READ_FAILED', 'Failed to read unsynced suppliers', cause))
  }
}

// ─── Purchase Orders ─────────────────────────────────────────────────────────

export const getAllPurchaseOrders = async (): Promise<Result<PurchaseOrder[], AppError>> => {
  try {
    const orders = await db.purchase_orders.toArray()
    return ok(orders)
  } catch (cause) {
    logger.error('repository:get_all_purchase_orders_failed', cause)
    return err(appError('DEXIE_READ_FAILED', 'Failed to read purchase orders', cause))
  }
}

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

export const updatePurchaseOrder = async (
  id: number,
  updates: Partial<PurchaseOrder>
): Promise<Result<void, AppError>> => {
  try {
    await db.purchase_orders.update(id, updates)
    return ok(undefined)
  } catch (cause) {
    logger.error('repository:update_purchase_order_failed', cause, { id })
    return err(appError('DEXIE_WRITE_FAILED', 'Failed to update purchase order', cause))
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

export const deletePurchaseOrder = async (
  id: number
): Promise<Result<void, AppError>> => {
  try {
    await db.purchase_orders.delete(id)
    return ok(undefined)
  } catch (cause) {
    logger.error('repository:delete_purchase_order_failed', cause, { id })
    return err(appError('DEXIE_WRITE_FAILED', 'Failed to delete purchase order', cause))
  }
}

export const getUnsyncedPurchaseOrders = async (): Promise<Result<PurchaseOrder[], AppError>> => {
  try {
    const orders = await db.purchase_orders.where('synced').equals(0).toArray()
    return ok(orders)
  } catch (cause) {
    logger.error('repository:get_unsynced_purchase_orders_failed', cause)
    return err(appError('DEXIE_READ_FAILED', 'Failed to read unsynced purchase orders', cause))
  }
}

// ─── Stock Adjustments ───────────────────────────────────────────────────────

export const getAllStockAdjustments = async (): Promise<Result<StockAdjustment[], AppError>> => {
  try {
    const adjustments = await db.stock_adjustments.toArray()
    return ok(adjustments)
  } catch (cause) {
    logger.error('repository:get_all_stock_adjustments_failed', cause)
    return err(appError('DEXIE_READ_FAILED', 'Failed to read stock adjustments', cause))
  }
}

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

export const deleteStockAdjustment = async (
  id: number
): Promise<Result<void, AppError>> => {
  try {
    await db.stock_adjustments.delete(id)
    return ok(undefined)
  } catch (cause) {
    logger.error('repository:delete_stock_adjustment_failed', cause, { id })
    return err(appError('DEXIE_WRITE_FAILED', 'Failed to delete stock adjustment', cause))
  }
}

export const getUnsyncedStockAdjustments = async (): Promise<Result<StockAdjustment[], AppError>> => {
  try {
    const adjustments = await db.stock_adjustments.where('synced').equals(0).toArray()
    return ok(adjustments)
  } catch (cause) {
    logger.error('repository:get_unsynced_stock_adjustments_failed', cause)
    return err(appError('DEXIE_READ_FAILED', 'Failed to read unsynced stock adjustments', cause))
  }
}

// ─── Business (product helpers) ──────────────────────────────────────────────

export const updateBusinessProducts = async (
  id: number,
  products: string
): Promise<Result<void, AppError>> => {
  try {
    await db.business.update(id, { products })
    return ok(undefined)
  } catch (cause) {
    logger.error('repository:update_business_products_failed', cause)
    return err(appError('DEXIE_WRITE_FAILED', 'Failed to update business products', cause))
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
  return income - outflow
}

export const calculateFulizaDebt = (transactions: Transaction[]): number => {
  const taken   = transactions.filter(t => t.type === 'debt_taken').reduce((s, t) => s + t.amount, 0)
  const repaid  = transactions.filter(t => t.type === 'debt_repaid').reduce((s, t) => s + t.amount, 0)
  return taken - repaid
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

// ─── Legacy alias ────────────────────────────────────────────────────────────

export const enqueue = addSyncQueueItem
