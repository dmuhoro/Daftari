import { describe, it, expect } from 'vitest'
import { businessLocalId, mapBusinessToStore, resolveActiveBusiness } from './businessId'

describe('businessLocalId', () => {
  it('prefers local_id over numeric id', () => {
    expect(businessLocalId({ local_id: 'biz-abc', id: 1 })).toBe('biz-abc')
  })

  it('falls back to stringified dexie id', () => {
    expect(businessLocalId({ id: 42 })).toBe('42')
  })
})

describe('mapBusinessToStore', () => {
  it('uses local_id as store id', () => {
    const mapped = mapBusinessToStore({
      local_id: 'loc-1',
      user_id: 'user-99',
      name: 'Shop',
      currency: 'KES',
      synced: 0,
      created_at: '2024-01-01',
    })
    expect(mapped.id).toBe('loc-1')
    expect(mapped.local_id).toBe('loc-1')
  })
})

describe('resolveActiveBusiness', () => {
  const businesses = [
    { id: 'biz-a', local_id: 'biz-a', name: 'A' },
    { id: 'biz-b', local_id: 'biz-b', name: 'B' },
  ]

  it('returns first business when no preference', () => {
    expect(resolveActiveBusiness(businesses, null)?.id).toBe('biz-a')
  })

  it('returns matching business by local_id', () => {
    expect(resolveActiveBusiness(businesses, 'biz-b')?.name).toBe('B')
  })

  it('falls back to first when preference not in list (cross-user stale id)', () => {
    expect(resolveActiveBusiness(businesses, 'other-user-id')?.id).toBe('biz-a')
  })
})
