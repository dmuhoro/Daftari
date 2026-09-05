import { describe, it, expect, vi, beforeEach } from 'vitest'
import { db } from './db'
import { applyRealtimeChange } from './realtimeApply'

vi.mock('./tenantLoader', () => ({
  loadTenantState: vi.fn(async () => undefined),
}))

import { loadTenantState } from './tenantLoader'

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(db.business.toArray).mockResolvedValue([])
})

function txRow(local_id: string, overrides: Record<string, unknown> = {}) {
  return {
    local_id,
    type: 'income',
    category: 'other',
    source: 'manual',
    amount: 100,
    recorded_at: new Date().toISOString(),
    synced: 1,
    user_id: 'user-a',
    ...overrides,
  }
}

describe('applyRealtimeChange()', () => {
  it('ignores changes that do not belong to the signed-in user', async () => {
    const status = await applyRealtimeChange('daftari_transactions', {
      eventType: 'INSERT',
      new: txRow('tx-foreign', { user_id: 'attacker' }),
      old: null,
    }, 'user-a')

    expect(status).toBe(1)
    expect(db.transactions.put).not.toHaveBeenCalled()
    expect(loadTenantState).not.toHaveBeenCalled()
  })

  it('upserts an INSERT transaction for the user and reloads tenant state', async () => {
    const status = await applyRealtimeChange('daftari_transactions', {
      eventType: 'INSERT',
      new: txRow('tx-1'),
      old: null,
    }, 'user-a')

    expect(status).toBe(0)
    expect(db.transactions.put).toHaveBeenCalledWith(expect.objectContaining({ local_id: 'tx-1', synced: 1 }))
    expect(loadTenantState).toHaveBeenCalledWith('user-a')
  })

  it('upserts an UPDATE business for the user', async () => {
    const status = await applyRealtimeChange('daftari_businesses', {
      eventType: 'UPDATE',
      new: { local_id: 'biz-1', name: 'Fresh Name', currency: 'KES', user_id: 'user-a' },
      old: null,
    }, 'user-a')

    expect(status).toBe(0)
    expect(db.business.put).toHaveBeenCalledWith(expect.objectContaining({ local_id: 'biz-1', name: 'Fresh Name', synced: 1 }))
    expect(loadTenantState).toHaveBeenCalledWith('user-a')
  })

  it('deletes the local copy on a remote DELETE', async () => {
    const status = await applyRealtimeChange('daftari_transactions', {
      eventType: 'DELETE',
      new: null,
      old: { local_id: 'tx-gone', user_id: 'user-a' },
    }, 'user-a')

    expect(status).toBe(0)
    expect(db.transactions.where).toHaveBeenCalledWith('local_id')
    expect(loadTenantState).toHaveBeenCalledWith('user-a')
  })

  it('returns failure status on a write error instead of throwing into the UI', async () => {
    vi.mocked(db.transactions.put).mockRejectedValueOnce(new Error('dexie failed'))

    const status = await applyRealtimeChange('daftari_transactions', {
      eventType: 'INSERT',
      new: txRow('tx-err'),
      old: null,
    }, 'user-a')

    expect(status).toBe(2)
  })
})