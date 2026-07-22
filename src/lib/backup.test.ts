/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const tableData: Record<string, any[]> = {
  transactions: [{ local_id: 'tx-1', amount: 500 }],
  business: [{ local_id: 'b-1', name: 'Duka' }],
  customers: [{ local_id: 'c-1', name: 'John' }],
  daily_closes: [{ local_id: 'dc-1', date: '2026-07-22' }],
  suppliers: [],
  purchase_orders: [],
  stock_adjustments: [],
  sync_queue: [],
}

const mockTable = vi.fn((name: string) => ({
  toArray: vi.fn(() => Promise.resolve(tableData[name] || [])),
}))

vi.mock('./db', () => ({
  db: {
    table: mockTable,
  },
}))

describe('backup', () => {
  let clickMock: ReturnType<typeof vi.fn>
  let mockAnchor: any
  let createObjectURLSpy: ReturnType<typeof vi.fn>
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()

    clickMock = vi.fn()
    mockAnchor = { href: '', download: '', click: clickMock }

    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any)

    createObjectURLSpy = vi.fn(() => 'blob:mock-url')
    revokeObjectURLSpy = vi.fn()
    vi.spyOn(URL, 'createObjectURL').mockImplementation(createObjectURLSpy as any)
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(revokeObjectURLSpy as any)
  })

  it('reads all 8 tables from Dexie', async () => {
    const { exportAllData } = await import('./backup')
    await exportAllData()

    expect(mockTable).toHaveBeenCalledTimes(8)
    expect(mockTable).toHaveBeenCalledWith('transactions')
    expect(mockTable).toHaveBeenCalledWith('business')
    expect(mockTable).toHaveBeenCalledWith('customers')
    expect(mockTable).toHaveBeenCalledWith('daily_closes')
    expect(mockTable).toHaveBeenCalledWith('suppliers')
    expect(mockTable).toHaveBeenCalledWith('purchase_orders')
    expect(mockTable).toHaveBeenCalledWith('stock_adjustments')
    expect(mockTable).toHaveBeenCalledWith('sync_queue')
  })

  it('creates a JSON blob with table data', async () => {
    const { exportAllData } = await import('./backup')
    await exportAllData()

    expect(createObjectURLSpy).toHaveBeenCalled()
    const blobArg = createObjectURLSpy.mock.calls[0][0]
    expect(blobArg).toBeInstanceOf(Blob)
    expect(blobArg.type).toBe('application/json')
  })

  it('triggers download via anchor click', async () => {
    const { exportAllData } = await import('./backup')
    await exportAllData()

    expect(mockAnchor.download).toMatch(/^daftari-backup-\d{4}-\d{2}-\d{2}\.json$/)
    expect(clickMock).toHaveBeenCalled()
  })

  it('creates and revokes object URL', async () => {
    const { exportAllData } = await import('./backup')
    await exportAllData()

    expect(createObjectURLSpy).toHaveBeenCalled()
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url')
  })

  it('handles empty tables without error', async () => {
    const { exportAllData } = await import('./backup')
    await exportAllData()
    expect(clickMock).toHaveBeenCalled()
  })

  it('gracefully handles table read errors', async () => {
    mockTable.mockImplementation((name: string) => {
      if (name === 'transactions') {
        return { toArray: vi.fn(() => Promise.reject(new Error('read error'))) }
      }
      return { toArray: vi.fn(() => Promise.resolve([])) }
    })

    const { exportAllData } = await import('./backup')
    await exportAllData()
    expect(clickMock).toHaveBeenCalled()
  })
})
