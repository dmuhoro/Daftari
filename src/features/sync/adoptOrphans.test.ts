import { describe, it, expect, vi, beforeEach } from 'vitest'
import { db } from '../../lib/db'
import { adoptOrphanedRecords } from './adoptOrphans'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('adoptOrphanedRecords()', () => {
  it('returns a zeroed result without a session user', async () => {
    const r = await adoptOrphanedRecords(null)
    expect(r).toEqual({ transactions: 0, businesses: 0, queue: 0 })
    expect(db.transactions.toArray).not.toHaveBeenCalled()
  })

  it('stamps transactions that have no user_id and re-queues them for sync', async () => {
    vi.mocked(db.transactions.toArray).mockResolvedValue([
      { id: 1, local_id: 'tx-orphan-1', type: 'income', amount: 100, synced: 1 },
      { id: 2, local_id: 'tx-owned', type: 'income', amount: 50, synced: 1, user_id: 'user-a' },
    ])
    vi.mocked(db.business.toArray).mockResolvedValue([])

    const r = await adoptOrphanedRecords('user-a')

    expect(r.transactions).toBe(1)
    expect(db.transactions.update).toHaveBeenCalledWith(1, { user_id: 'user-a', synced: 0 })
    expect(db.transactions.update).not.toHaveBeenCalledWith(2, expect.anything())
  })

  it('stamps businesses that have no user_id', async () => {
    vi.mocked(db.transactions.toArray).mockResolvedValue([])
    vi.mocked(db.business.toArray).mockResolvedValue([
      { id: 9, local_id: 'biz-orphan-1', name: 'Shop', currency: 'KES', synced: 0 },
      { id: 10, local_id: 'biz-owned', name: 'Other', currency: 'KES', synced: 0, user_id: 'user-b' },
    ])

    const r = await adoptOrphanedRecords('user-b')

    expect(r.businesses).toBe(1)
    expect(db.business.update).toHaveBeenCalledWith(9, { user_id: 'user-b', synced: 0 })
    expect(db.business.update).not.toHaveBeenCalledWith(10, expect.anything())
  })

  it('re-stamps queued payloads for affected local records so a flush does not dead-letter', async () => {
    vi.mocked(db.transactions.toArray).mockResolvedValue([
      { id: 1, local_id: 'tx-orphan-1', type: 'income', amount: 100, synced: 0 },
    ])
    vi.mocked(db.business.toArray).mockResolvedValue([])
    vi.mocked((db.sync_queue.where as ReturnType<typeof vi.fn>)).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([
          { id: 5, table_name: 'daftari_transactions', record_id: 'tx-orphan-1', payload: JSON.stringify({ local_id: 'tx-orphan-1', amount: 100 }), synced: 0 },
          { id: 6, table_name: 'daftari_transactions', record_id: 'tx-owned', payload: JSON.stringify({ local_id: 'tx-owned', amount: 50, user_id: 'user-a' }), synced: 0 },
        ]),
      }),
    })

    const r = await adoptOrphanedRecords('user-a')

    expect(r.queue).toBe(1)
    expect(db.sync_queue.update).toHaveBeenCalledWith(5, {
      payload: JSON.stringify({ local_id: 'tx-orphan-1', amount: 100, user_id: 'user-a' }),
    })
    expect(db.sync_queue.update).not.toHaveBeenCalledWith(6, expect.anything())
  })

  it('leaves records that already own a user_id untouched (never rewrites ownership)', async () => {
    vi.mocked(db.transactions.toArray).mockResolvedValue([
      { id: 1, local_id: 'tx-orphan-1', type: 'income', amount: 100, synced: 1 },
      { id: 2, local_id: 'tx-other', type: 'income', amount: 50, synced: 1, user_id: 'user-b' },
    ])
    vi.mocked(db.business.toArray).mockResolvedValue([
      { id: 9, local_id: 'biz-owned', name: 'Shop', currency: 'KES', synced: 0, user_id: 'user-b' },
    ])

    const r = await adoptOrphanedRecords('user-a')

    expect(r.transactions).toBe(1)
    expect(db.transactions.update).toHaveBeenCalledWith(1, { user_id: 'user-a', synced: 0 })
    expect(db.transactions.update).not.toHaveBeenCalledWith(2, expect.anything())
    expect(db.business.update).not.toHaveBeenCalled()
  })

  it('propagates failures instead of silently swallowing them', async () => {
    vi.mocked(db.transactions.toArray).mockRejectedValue(new Error('dexie exploded'))

    await expect(adoptOrphanedRecords('user-a')).rejects.toThrow('dexie exploded')
  })
})