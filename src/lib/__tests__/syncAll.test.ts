/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'

function createDbMock() {
  const chain = (result: unknown[] = []) => ({
    equals: vi.fn(() => chain(result)),
    anyOf: vi.fn(() => chain(result)),
    toArray: vi.fn(() => Promise.resolve(result)),
    first: vi.fn(() => Promise.resolve(null)),
    modify: vi.fn(() => Promise.resolve(result.length)),
  })
  const table = () => ({
    toArray: vi.fn(() => Promise.resolve([])),
    put: vi.fn(() => Promise.resolve(1)),
    where: vi.fn(() => chain([])),
  })
  return {
    transactions: { ...table(), where: vi.fn(() => chain([])) },
    business: table(),
    daily_closes: table(),
    customers: table(),
    suppliers: table(),
    purchase_orders: table(),
    stock_adjustments: table(),
  }
}

const mockDb = createDbMock()
const mockSupabaseUpsert = vi.fn()
const selectResultsQueue: any[] = []
let tablesThatThrow: string[] = []

function queryFromResult(p: Promise<any>) {
  const q: any = () => p
  q.eq = vi.fn(() => q)
  q.in = vi.fn(() => q)
  q.range = vi.fn(() => q)
  q.then = (onfulfilled: any, onrejected?: any) => p.then(onfulfilled, onrejected)
  return q
}

vi.mock('../db', () => ({ db: mockDb }))

vi.mock('../supabase', () => ({
  supabase: {
    auth: { getUser: vi.fn() },
    from: vi.fn((_table: string) => {
      function buildSelect() {
        const next = () => {
          const p = selectResultsQueue.shift()
          return p ?? Promise.resolve({ data: [], error: null })
        }
        const rangeFn = () => {
          if (tablesThatThrow.includes(_table)) throw new Error('table not found')
          return queryFromResult(next())
        }
        return {
          range: vi.fn(rangeFn),
          eq: vi.fn(() => ({ range: vi.fn(rangeFn) })),
          in: vi.fn(() => ({ range: vi.fn(rangeFn) })),
        }
      }
      return {
        upsert: mockSupabaseUpsert,
        select: vi.fn(() => buildSelect()),
      }
    }),
  },
}))

vi.mock('../logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('../sentry', () => ({
  captureError: vi.fn(),
}))

function resetMockDb() {
  const fresh = createDbMock()
  for (const tableName of Object.keys(fresh)) {
    for (const method of Object.keys((fresh as any)[tableName])) {
      (mockDb as any)[tableName][method] = (fresh as any)[tableName][method]
    }
  }
}

beforeEach(async () => {
  vi.clearAllMocks()
  resetMockDb()
  selectResultsQueue.length = 0
  tablesThatThrow = []
  const { supabase } = await import('../supabase')
  supabase.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
})

describe('syncAllTables', () => {
  it('returns empty results when nothing to sync', async () => {
    const { syncAllTables } = await import('../syncAll')
    const result = await syncAllTables()
    expect(result).toEqual({})
  })

  it('syncs unsynced transactions and marks them synced', async () => {
    const tx = { local_id: 'tx-1', type: 'income', amount: 500, synced: 0 }
    mockDb.transactions.where = vi.fn(() => ({
      equals: vi.fn(() => ({
        toArray: vi.fn(() => Promise.resolve([tx])),
        modify: vi.fn(() => Promise.resolve(1)),
      })),
      anyOf: vi.fn(() => ({ modify: vi.fn(() => Promise.resolve(1)) })),
    })) as any
    mockSupabaseUpsert.mockResolvedValue({ error: null })

    const { syncAllTables } = await import('../syncAll')
    const result = await syncAllTables()

    expect(result.transactions?.synced).toBe(1)
    expect(result.transactions?.failed).toBe(0)
    expect(mockSupabaseUpsert).toHaveBeenCalledTimes(1)
  })

  it('handles upsert failure for a transaction', async () => {
    mockDb.transactions.where = vi.fn(() => ({
      equals: vi.fn(() => ({
        toArray: vi.fn(() => Promise.resolve([{ local_id: 'tx-1', synced: 0 }])),
        modify: vi.fn(() => Promise.resolve(0)),
      })),
      anyOf: vi.fn(() => ({ modify: vi.fn(() => Promise.resolve(0)) })),
    })) as any
    mockSupabaseUpsert.mockRejectedValue(new Error('network error'))

    const { syncAllTables } = await import('../syncAll')
    const result = await syncAllTables()

    expect(result.transactions?.synced).toBe(0)
    expect(result.transactions?.failed).toBe(1)
    expect(result.transactions?.errors[0]).toBe('network error')
  })

  it('syncs businesses', async () => {
    const chain = (result: unknown[] = []) => ({
      equals: vi.fn(() => chain(result)),
      anyOf: vi.fn(() => chain(result)),
      toArray: vi.fn(() => Promise.resolve(result)),
      first: vi.fn(() => Promise.resolve(null)),
      modify: vi.fn(() => Promise.resolve(result.length)),
    });
    mockDb.business.where = vi.fn().mockImplementation(() => chain([
      { local_id: 'b-1', name: 'Shop', currency: 'KES', user_id: 'user-1' },
    ])) as any;

    mockSupabaseUpsert.mockResolvedValue({ error: null })

    const { syncAllTables } = await import('../syncAll')
    const result = await syncAllTables()

    expect(result.businesses?.synced).toBe(1)
  })

  it('syncs daily closes and customers', async () => {
    const chain = (result: unknown[] = []) => ({
      equals: vi.fn(() => chain(result)),
      anyOf: vi.fn(() => chain(result)),
      toArray: vi.fn(() => Promise.resolve(result)),
      first: vi.fn(() => Promise.resolve(null)),
      modify: vi.fn(() => Promise.resolve(result.length)),
    });
    mockDb.daily_closes.where = vi.fn().mockImplementation(() => chain([
      { date: '2024-01-01', business_id: 'b-1', profit: 100, revenue: 500, expenses: 400 },
    ])) as any;
    mockDb.customers.where = vi.fn().mockImplementation(() => chain([
      { name: 'Alice', phone: '123', business_id: 'b-1' },
    ])) as any;

    mockSupabaseUpsert.mockResolvedValue({ error: null })

    const { syncAllTables } = await import('../syncAll')
    const result = await syncAllTables()

    expect(result.daily_closes?.synced).toBe(1)
    expect(result.customers?.synced).toBe(1)
  })
})

describe('pullFromSupabase', () => {
  it('returns error when no user', async () => {
    const { supabase } = await import('../supabase')
    ;(supabase.auth.getUser as any).mockResolvedValue({ data: { user: null }, error: null })

    const { pullFromSupabase } = await import('../syncAll')
    const result = await pullFromSupabase()

    expect(result.errors).toContain('No authenticated user')
    expect(result.restored).toEqual([])
  })

  it('pulls transactions and upserts to local db', async () => {
    selectResultsQueue.push(
      Promise.resolve({ data: [{ local_id: 'tx-1', amount: 500, type: 'income', synced: 1, user_id: 'user-1' }], error: null }),
    )

    const { pullFromSupabase } = await import('../syncAll')
    const result = await pullFromSupabase()

    expect(result.errors).toEqual([])
    expect(result.restored).toContain('1 transactions')
    expect(mockDb.transactions.put).toHaveBeenCalled()
  })

  it('pulls businesses and upserts to local db', async () => {
    selectResultsQueue.push(
      Promise.resolve({ data: [], error: null }), // transactions (empty)
      Promise.resolve({ data: [{ local_id: 'b-1', name: 'Remote Shop', user_id: 'user-1' }], error: null }), // businesses
    )

    const { pullFromSupabase } = await import('../syncAll')
    const result = await pullFromSupabase()

    expect(result.restored).toContain('1 businesses')
    expect(mockDb.business.put).toHaveBeenCalled()
  })

  it('pulls customers scoped to business IDs', async () => {
    selectResultsQueue.push(
      Promise.resolve({ data: [], error: null }), // transactions (empty)
      Promise.resolve({ data: [{ local_id: 'b-1', name: 'Shop', user_id: 'user-1' }], error: null }), // businesses
      Promise.resolve({ data: [{ local_id: 'c-1', name: 'Alice', business_id: 'b-1' }], error: null }), // customers
    )

    const { pullFromSupabase } = await import('../syncAll')
    const result = await pullFromSupabase()

    expect(result.errors).toEqual([])
  })

  it('handles error during pull gracefully', async () => {
    selectResultsQueue.push(
      Promise.resolve({ data: null, error: new Error('DB error') }), // transactions
    )

    const { pullFromSupabase } = await import('../syncAll')
    const result = await pullFromSupabase()

    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('handles missing tables (suppliers, purchase_orders, stock_adjustments)', async () => {
    tablesThatThrow = ['daftari_suppliers', 'daftari_purchase_orders', 'daftari_stock_adjustments']

    selectResultsQueue.push(
      Promise.resolve({ data: [], error: null }), // transactions
      Promise.resolve({ data: [{ local_id: 'b-1', name: 'Shop', user_id: 'user-1' }], error: null }), // businesses
      Promise.resolve({ data: [], error: null }), // customers
      Promise.resolve({ data: [], error: null }), // daily_closes
    )

    const { pullFromSupabase } = await import('../syncAll')
    const result = await pullFromSupabase()

    expect(result.errors).toEqual([])
  })

  it('conflict resolution: local version wins when newer', async () => {
    selectResultsQueue.push(
      Promise.resolve({ data: [{ local_id: 'tx-1', amount: 500, type: 'income', updated_at: '2024-01-01T00:00:00Z', user_id: 'user-1' }], error: null }),
    )

    mockDb.transactions.where = vi.fn(() => ({
      equals: vi.fn(() => ({
        first: vi.fn(() => Promise.resolve({
          local_id: 'tx-1', amount: 500,
          updated_at: '2024-06-01T00:00:00Z',
        })),
      })),
    })) as any

    const { pullFromSupabase } = await import('../syncAll')
    const result = await pullFromSupabase()

    expect(mockDb.transactions.put).not.toHaveBeenCalled()
    expect(result.errors).toEqual([])
  })

  it('conflict resolution: remote version wins when newer', async () => {
    selectResultsQueue.push(
      Promise.resolve({ data: [{ local_id: 'tx-1', amount: 999, type: 'income', updated_at: '2024-06-15T00:00:00Z', user_id: 'user-1' }], error: null }),
    )

    mockDb.transactions.where = vi.fn(() => ({
      equals: vi.fn(() => ({
        first: vi.fn(() => Promise.resolve({
          local_id: 'tx-1', amount: 500,
          updated_at: '2024-06-01T00:00:00Z',
        })),
      })),
    })) as any

    const { pullFromSupabase } = await import('../syncAll')
    await pullFromSupabase()

    expect(mockDb.transactions.put).toHaveBeenCalled()
  })
})
