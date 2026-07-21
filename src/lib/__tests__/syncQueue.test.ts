/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

function mockWhere(db: any, result: any) {
  db.sync_queue.where.mockReturnValue(result)
}

function mockFrom(supabase: any, result: any) {
  supabase.from.mockReturnValue(result)
}

describe('syncQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getPendingCount', () => {
    it('returns count of unsynced items', async () => {
      const { getPendingCount } = await import('../../features/sync/syncQueue')
      const { db } = await import('../../lib/db')
      mockWhere(db, {
        equals: vi.fn().mockReturnValue({
          count: vi.fn().mockResolvedValue(3),
        }),
      })

      const count = await getPendingCount()
      expect(count).toBe(3)
    })
  })

  describe('getDeadLetterCount', () => {
    it('returns count of dead-letter items (synced=2)', async () => {
      const { getDeadLetterCount } = await import('../../features/sync/syncQueue')
      const { db } = await import('../../lib/db')
      mockWhere(db, {
        equals: vi.fn().mockReturnValue({
          count: vi.fn().mockResolvedValue(1),
        }),
      })

      const count = await getDeadLetterCount()
      expect(count).toBe(1)
    })
  })

  describe('addToQueue', () => {
    it('adds item with _retries counter initialized to 0', async () => {
      const { addToQueue } = await import('../../features/sync/syncQueue')
      const { db } = await import('../../lib/db')
      mockWhere(db, {
        equals: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(undefined),
        }),
      })

      await addToQueue('upsert', 'daftari_customers', 'cust-1', { name: 'Test' })

      const addCall = db.sync_queue.add.mock.calls[0][0]
      expect(addCall.operation).toBe('upsert')
      expect(addCall.table_name).toBe('daftari_customers')
      expect(addCall.record_id).toBe('cust-1')
      expect(addCall.synced).toBe(0)

      const payload = JSON.parse(addCall.payload)
      expect(payload._retries).toBe(0)
      expect(payload.name).toBe('Test')
    })
  })

  describe('flushQueue', () => {
    it('returns zero counts when queue is empty', async () => {
      const { flushQueue } = await import('../../features/sync/syncQueue')
      const { db } = await import('../../lib/db')
      mockWhere(db, {
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
        }),
      })

      const result = await flushQueue()
      expect(result).toEqual({ synced: 0, failed: 0 })
    })

    it('processes upsert items and deletes queue entry on success', async () => {
      const { flushQueue } = await import('../../features/sync/syncQueue')
      const { supabase } = await import('../../lib/supabase')
      const { db } = await import('../../lib/db')

      const items = [{
        id: 1,
        operation: 'upsert',
        table_name: 'daftari_customers',
        record_id: 'cust-1',
        payload: JSON.stringify({ name: 'Alice', _retries: 0 }),
        synced: 0,
        created_at: new Date().toISOString(),
      }]

      mockWhere(db, {
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue(items),
        }),
      })

      mockFrom(supabase, {
        upsert: vi.fn().mockResolvedValue({ error: null }),
      } as any)

      const result = await flushQueue()

      expect(supabase.from).toHaveBeenCalledWith('daftari_customers')
      expect(db.sync_queue.delete).toHaveBeenCalledWith(1)
      expect(result).toEqual({ synced: 1, failed: 0 })
    })

    it('processes delete items and removes queue entry on success', async () => {
      const { flushQueue } = await import('../../features/sync/syncQueue')
      const { supabase } = await import('../../lib/supabase')
      const { db } = await import('../../lib/db')

      const items = [{
        id: 2,
        operation: 'delete',
        table_name: 'daftari_suppliers',
        record_id: 'sup-1',
        payload: '',
        synced: 0,
        created_at: new Date().toISOString(),
      }]

      mockWhere(db, {
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue(items),
        }),
      })

      mockFrom(supabase, {
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      } as any)

      const result = await flushQueue()

      expect(supabase.from).toHaveBeenCalledWith('daftari_suppliers')
      expect(db.sync_queue.delete).toHaveBeenCalledWith(2)
      expect(result).toEqual({ synced: 1, failed: 0 })
    })

    it('moves item to dead-letter after MAX_RETRIES', async () => {
      const { flushQueue } = await import('../../features/sync/syncQueue')
      const { supabase } = await import('../../lib/supabase')
      const { db } = await import('../../lib/db')

      const items = [{
        id: 3,
        operation: 'upsert',
        table_name: 'daftari_transactions',
        record_id: 'tx-1',
        payload: JSON.stringify({ local_id: 'tx-1', _retries: 5 }),
        synced: 0,
        created_at: new Date().toISOString(),
      }]

      mockWhere(db, {
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue(items),
        }),
      })

      mockFrom(supabase, {
        upsert: vi.fn().mockResolvedValue({ error: new Error('timeout') }),
      } as any)

      await flushQueue()

      expect(db.sync_queue.update).toHaveBeenCalledWith(3, {
        synced: 2,
        payload: expect.stringContaining('_retries'),
      })
    })

    it('strips _retries before sending to Supabase', async () => {
      const { flushQueue } = await import('../../features/sync/syncQueue')
      const { supabase } = await import('../../lib/supabase')
      const { db } = await import('../../lib/db')

      const items = [{
        id: 4,
        operation: 'upsert',
        table_name: 'daftari_transactions',
        record_id: 'tx-2',
        payload: JSON.stringify({ local_id: 'tx-2', amount: 500, _retries: 0 }),
        synced: 0,
        created_at: new Date().toISOString(),
      }]

      mockWhere(db, {
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue(items),
        }),
      })

      let upserted: any = null
      mockFrom(supabase, {
        upsert: vi.fn().mockImplementation((data) => {
          upserted = data
          return { error: null }
        }),
      } as any)

      await flushQueue()

      expect(upserted).not.toBeNull()
      expect(upserted._retries).toBeUndefined()
      expect(upserted.local_id).toBe('tx-2')
      expect(upserted.amount).toBe(500)
    })

    it('uses fallback table name when table_name is empty', async () => {
      const { flushQueue } = await import('../../features/sync/syncQueue')
      const { supabase } = await import('../../lib/supabase')
      const { db } = await import('../../lib/db')

      const items = [{
        id: 5,
        operation: 'upsert',
        table_name: '',
        record_id: 'tx-3',
        payload: JSON.stringify({ local_id: 'tx-3', _retries: 0 }),
        synced: 0,
        created_at: new Date().toISOString(),
      }]

      mockWhere(db, {
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue(items),
        }),
      })

      mockFrom(supabase, {
        upsert: vi.fn().mockResolvedValue({ error: null }),
      } as any)

      await flushQueue()
      expect(supabase.from).toHaveBeenCalledWith('daftari_transactions')
    })

    it('skips items in exponential backoff window', async () => {
      const { flushQueue } = await import('../../features/sync/syncQueue')
      const { supabase } = await import('../../lib/supabase')
      const { db } = await import('../../lib/db')

      const twoSecAgo = new Date(Date.now() - 2000).toISOString()
      const items = [{
        id: 6,
        operation: 'upsert',
        table_name: 'daftari_transactions',
        record_id: 'tx-4',
        payload: JSON.stringify({ local_id: 'tx-4', _retries: 2 }),
        synced: 0,
        created_at: twoSecAgo,
      }]

      mockWhere(db, {
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue(items),
        }),
      })

      const upsertFn = vi.fn()
      mockFrom(supabase, {
        upsert: upsertFn,
      } as any)

      await flushQueue()

      expect(upsertFn).not.toHaveBeenCalled()
      expect(db.sync_queue.delete).not.toHaveBeenCalled()
    })
  })
})
