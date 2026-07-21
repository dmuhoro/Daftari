/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { calculateProfit, calculateFulizaDebt, calculateWeeklyProfits } from './repository'
import type { Transaction } from './db'

const makeTransaction = (
  type: Transaction['type'],
  amount: number,
  recorded_at = new Date().toISOString()
): Transaction => ({
  local_id: crypto.randomUUID(),
  type,
  amount,
  category: 'test',
  source: 'manual',
  recorded_at,
  synced: 0,
})

describe('calculateProfit()', () => {
  it('returns zero for empty array', () => {
    expect(calculateProfit([])).toBe(0)
  })

  it('subtracts expenses from income', () => {
    const txs = [
      makeTransaction('income', 500),
      makeTransaction('expense', 200),
    ]
    expect(calculateProfit(txs)).toBe(300)
  })

  it('treats withdrawals as outflow', () => {
    const txs = [
      makeTransaction('income', 1000),
      makeTransaction('withdrawal', 300),
    ]
    expect(calculateProfit(txs)).toBe(700)
  })

  it('handles pure loss scenario', () => {
    const txs = [
      makeTransaction('income', 100),
      makeTransaction('expense', 500),
    ]
    expect(calculateProfit(txs)).toBe(-400)
  })

  it('treats debt_repaid as outflow', () => {
    const txs = [
      makeTransaction('income', 1000),
      makeTransaction('debt_repaid', 400),
    ]
    expect(calculateProfit(txs)).toBe(600)
  })
})

describe('calculateFulizaDebt()', () => {
  it('returns net Fuliza outstanding', () => {
    const txs = [
      makeTransaction('debt_taken', 500),
      makeTransaction('debt_repaid', 200),
    ]
    expect(calculateFulizaDebt(txs)).toBe(300)
  })

  it('returns zero when fully repaid', () => {
    const txs = [
      makeTransaction('debt_taken', 500),
      makeTransaction('debt_repaid', 500),
    ]
    expect(calculateFulizaDebt(txs)).toBe(0)
  })

  it('returns zero with no Fuliza transactions', () => {
    expect(calculateFulizaDebt([])).toBe(0)
  })
})

describe('calculateWeeklyProfits()', () => {
  it('returns 7 entries', () => {
    expect(calculateWeeklyProfits([])).toHaveLength(7)
  })

  it('assigns profit to correct day', () => {
    const todayISO = new Date().toISOString()
    const txs = [makeTransaction('income', 800, todayISO)]
    const result = calculateWeeklyProfits(txs)
    const today = result[result.length - 1]
    expect(today.profit).toBe(800)
  })

  it('has date, profit, and label on each entry', () => {
    const result = calculateWeeklyProfits([])
    for (const entry of result) {
      expect(entry).toHaveProperty('date')
      expect(entry).toHaveProperty('profit')
      expect(entry).toHaveProperty('label')
    }
  })
})

describe('saveTransaction()', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('adds transaction and returns id on success', async () => {
    const { saveTransaction } = await import('./repository')
    const { db } = await import('./db')
    const tx = { local_id: 'tx-1', type: 'income' as const, amount: 500, category: 'test', source: 'manual', recorded_at: new Date().toISOString(), synced: 0 }
    const id = await saveTransaction(tx)
    expect(id.ok).toBe(true)
    if (id.ok) expect(id.value).toBe(1)
    expect(db.transactions.add).toHaveBeenCalled()
  })

  it('returns error on failure', async () => {
    const { saveTransaction } = await import('./repository')
    const { db } = await import('./db')
    vi.mocked(db.transactions.add).mockRejectedValueOnce(new Error('dexie fail'))
    const tx = { local_id: 'tx-2', type: 'income' as const, amount: 100, category: 'test', source: 'manual', recorded_at: new Date().toISOString(), synced: 0 }
    const result = await saveTransaction(tx)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('DEXIE_WRITE_FAILED')
  })
})

describe('updateTransaction()', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('modifies transaction by local_id', async () => {
    const { updateTransaction } = await import('./repository')
    const { db } = await import('./db')
    const result = await updateTransaction('tx-1', { amount: 999 })
    expect(result.ok).toBe(true)
    expect(db.transactions.where).toHaveBeenCalledWith('local_id')
  })

  it('returns error on failure', async () => {
    const { updateTransaction } = await import('./repository')
    const { db } = await import('./db')
    vi.mocked(db.transactions.where).mockReturnValueOnce({
      equals: vi.fn().mockReturnValue({ modify: vi.fn().mockRejectedValueOnce(new Error('fail')) }),
    } as any)
    const result = await updateTransaction('tx-1', { amount: 999 })
    expect(result.ok).toBe(false)
  })
})

describe('deleteTransaction()', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('deletes transaction by local_id', async () => {
    const { deleteTransaction } = await import('./repository')
    const { db } = await import('./db')
    const result = await deleteTransaction('tx-1')
    expect(result.ok).toBe(true)
    expect(db.transactions.where).toHaveBeenCalledWith('local_id')
  })
})

describe('getAllTransactions()', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns ordered transactions', async () => {
    const { getAllTransactions } = await import('./repository')
    const result = await getAllTransactions()
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value).toEqual([])
  })
})

describe('getBusiness()', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns first business or null', async () => {
    const { getBusiness } = await import('./repository')
    const { db } = await import('./db')
    vi.mocked(db.business.toCollection).mockReturnValueOnce({
      first: vi.fn().mockResolvedValue({ id: 1, name: 'Test Biz' }),
    } as any)
    const result = await getBusiness()
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value).toEqual({ id: 1, name: 'Test Biz' })
  })
})

describe('getAllBusinesses()', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns all businesses', async () => {
    const { getAllBusinesses } = await import('./repository')
    const { db } = await import('./db')
    vi.mocked(db.business.toArray).mockResolvedValueOnce([{ id: 1, name: 'Biz A' }] as any)
    const result = await getAllBusinesses()
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value).toHaveLength(1)
  })
})

describe('addBusiness()', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('adds business and returns id', async () => {
    const { addBusiness } = await import('./repository')
    const { db } = await import('./db')
    const biz = { name: 'New Biz', currency: 'KES' as const, created_at: new Date().toISOString(), synced: 0 }
    const result = await addBusiness(biz as any)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value).toBe(1)
    expect(db.business.add).toHaveBeenCalled()
  })
})

describe('updateBusiness()', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('updates business by id', async () => {
    const { updateBusiness } = await import('./repository')
    const { db } = await import('./db')
    const result = await updateBusiness(1, { name: 'Updated' })
    expect(result.ok).toBe(true)
    expect(db.business.update).toHaveBeenCalledWith(1, { name: 'Updated' })
  })
})

describe('saveCustomer()', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('adds customer and returns id', async () => {
    const { saveCustomer } = await import('./repository')
    const { db } = await import('./db')
    const cust = { name: 'John', business_id: 'biz-1', total_visits: 0, total_spent: 0, last_visit: '', synced: 0, created_at: new Date().toISOString() }
    const result = await saveCustomer(cust)
    expect(result.ok).toBe(true)
    expect(db.customers.add).toHaveBeenCalled()
  })
})

describe('countCustomers()', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns customer count', async () => {
    const { countCustomers } = await import('./repository')
    const { db } = await import('./db')
    vi.mocked(db.customers.count).mockResolvedValueOnce(5)
    const result = await countCustomers()
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value).toBe(5)
  })
})

describe('getCustomerByName()', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns customer by name', async () => {
    const { getCustomerByName } = await import('./repository')
    const { db } = await import('./db')
    vi.mocked(db.customers.where).mockReturnValueOnce({
      equals: vi.fn().mockReturnValue({ first: vi.fn().mockResolvedValue({ name: 'Alice' }) }),
    } as any)
    const result = await getCustomerByName('Alice')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value).toEqual({ name: 'Alice' })
  })

  it('returns null for unknown name', async () => {
    const { getCustomerByName } = await import('./repository')
    const result = await getCustomerByName('Nobody')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value).toBeNull()
  })
})

describe('getCustomersByBusinessId()', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns customers for business', async () => {
    const { getCustomersByBusinessId } = await import('./repository')
    const { db } = await import('./db')
    vi.mocked(db.customers.where).mockReturnValueOnce({
      equals: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([{ name: 'Alice' }]) }),
    } as any)
    const result = await getCustomersByBusinessId('biz-1')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value).toHaveLength(1)
  })
})

describe('saveDailyClose()', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('adds daily close and returns id', async () => {
    const { saveDailyClose } = await import('./repository')
    const { db } = await import('./db')
    const close = { date: '2024-01-01', business_id: 'biz-1', profit: 500, revenue: 1000, expenses: 500, synced: 0 }
    const result = await saveDailyClose(close as any)
    expect(result.ok).toBe(true)
    expect(db.daily_closes.add).toHaveBeenCalled()
  })
})

describe('getDailyClosesByBusinessId()', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns daily closes for business', async () => {
    const { getDailyClosesByBusinessId } = await import('./repository')
    const { db } = await import('./db')
    vi.mocked(db.daily_closes.where).mockReturnValueOnce({
      equals: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([{ date: '2024-01-01' }]) }),
    } as any)
    const result = await getDailyClosesByBusinessId('biz-1')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value).toHaveLength(1)
  })
})

describe('saveSupplier()', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('adds supplier and returns id', async () => {
    const { saveSupplier } = await import('./repository')
    const { db } = await import('./db')
    const supplier = { local_id: 'sup-1', business_id: 'biz-1', name: 'Acme', created_at: new Date().toISOString(), synced: 0 }
    const result = await saveSupplier(supplier as any)
    expect(result.ok).toBe(true)
    expect(db.suppliers.add).toHaveBeenCalled()
  })
})

describe('getSuppliersByBusinessId()', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns suppliers for business', async () => {
    const { getSuppliersByBusinessId } = await import('./repository')
    const { db } = await import('./db')
    vi.mocked(db.suppliers.where).mockReturnValueOnce({
      equals: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([{ name: 'Acme' }]) }),
    } as any)
    const result = await getSuppliersByBusinessId('biz-1')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value).toHaveLength(1)
  })
})

describe('deleteSupplierByLocalId()', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('deletes supplier by local_id', async () => {
    const { deleteSupplierByLocalId } = await import('./repository')
    const { db } = await import('./db')
    const result = await deleteSupplierByLocalId('sup-1')
    expect(result.ok).toBe(true)
    expect(db.suppliers.where).toHaveBeenCalledWith('local_id')
  })
})

describe('countUnsyncedQueueItems()', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns count of unsynced items', async () => {
    const { countUnsyncedQueueItems } = await import('./repository')
    const { db } = await import('./db')
    vi.mocked(db.sync_queue.where).mockReturnValueOnce({
      equals: vi.fn().mockReturnValue({ count: vi.fn().mockResolvedValue(3) }),
    } as any)
    const result = await countUnsyncedQueueItems()
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value).toBe(3)
  })
})

describe('savePurchaseOrder()', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('adds purchase order and returns id', async () => {
    const { savePurchaseOrder } = await import('./repository')
    const { db } = await import('./db')
    const po = { local_id: 'po-1', business_id: 'biz-1', status: 'pending' as const, items: '[]', total: 1000, supplier_name: 'Acme', created_at: new Date().toISOString(), synced: 0 }
    const result = await savePurchaseOrder(po as any)
    expect(result.ok).toBe(true)
    expect(db.purchase_orders.add).toHaveBeenCalled()
  })
})

describe('updatePurchaseOrderByLocalId()', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('updates purchase order by local_id', async () => {
    const { updatePurchaseOrderByLocalId } = await import('./repository')
    const { db } = await import('./db')
    const result = await updatePurchaseOrderByLocalId('po-1', { status: 'received' })
    expect(result.ok).toBe(true)
    expect(db.purchase_orders.where).toHaveBeenCalledWith('local_id')
  })
})

describe('getPurchaseOrdersByBusinessId()', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns purchase orders for business', async () => {
    const { getPurchaseOrdersByBusinessId } = await import('./repository')
    const { db } = await import('./db')
    vi.mocked(db.purchase_orders.where).mockReturnValueOnce({
      equals: vi.fn().mockReturnValue({ reverse: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([{ local_id: 'po-1' }]) }) }),
    } as any)
    const result = await getPurchaseOrdersByBusinessId('biz-1')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value).toHaveLength(1)
  })
})

describe('saveStockAdjustment()', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('adds stock adjustment and returns id', async () => {
    const { saveStockAdjustment } = await import('./repository')
    const { db } = await import('./db')
    const adj = { local_id: 'adj-1', business_id: 'biz-1', product_id: 'prod-1', product_name: 'Item', quantity: 10, reason: 'restock' as const, created_at: new Date().toISOString(), synced: 0 }
    const result = await saveStockAdjustment(adj as any)
    expect(result.ok).toBe(true)
    expect(db.stock_adjustments.add).toHaveBeenCalled()
  })
})

describe('getStockAdjustmentsByBusinessId()', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns stock adjustments for business', async () => {
    const { getStockAdjustmentsByBusinessId } = await import('./repository')
    const { db } = await import('./db')
    vi.mocked(db.stock_adjustments.where).mockReturnValueOnce({
      equals: vi.fn().mockReturnValue({ reverse: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([{ local_id: 'adj-1' }]) }) }),
    } as any)
    const result = await getStockAdjustmentsByBusinessId('biz-1')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value).toHaveLength(1)
  })
})
