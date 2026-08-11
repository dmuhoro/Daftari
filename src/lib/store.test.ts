/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const initialState = {
  language: 'sw' as const,
  business: null,
  businesses: [] as any[],
  activeBusinessId: null,
  activeBusinessIdByUser: {} as Record<string, string>,
  transactions: [] as any[],
  lastCloseDate: null,
  closePromptDismissedAt: null,
  theme: 'system' as const,
}

vi.mock('./repository', () => ({
  saveTransaction: vi.fn().mockResolvedValue({ ok: true, value: 1 }),
  updateTransaction: vi.fn().mockResolvedValue({ ok: true, value: undefined }),
  deleteTransaction: vi.fn().mockResolvedValue({ ok: true, value: undefined }),
}))

vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
    },
  },
}))

vi.mock('../features/sync/syncQueue', () => ({
  addToQueue: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('./receiptId', () => ({
  generateReceiptId: vi.fn(() => 'RCP-001'),
}))

let useStore: any

beforeEach(async () => {
  localStorage.removeItem('daftari-store')
  vi.clearAllMocks()
  const mod = await import('./store')
  useStore = mod.useStore
  useStore.setState(initialState)
})

describe('useStore — sync actions', () => {
  it('starts with default values', () => {
    const state = useStore.getState()
    expect(state.language).toBe('sw')
    expect(state.business).toBeNull()
    expect(state.businesses).toEqual([])
    expect(state.activeBusinessId).toBeNull()
    expect(state.transactions).toEqual([])
    expect(state.lastCloseDate).toBeNull()
    expect(state.closePromptDismissedAt).toBeNull()
    expect(state.theme).toBe('system')
  })

  it('setLanguage updates language', () => {
    useStore.getState().setLanguage('en')
    expect(useStore.getState().language).toBe('en')
  })

  it('setBusiness stores a business', () => {
    const biz = { id: 'biz-1', name: 'Test Shop', currency: 'KES' }
    useStore.getState().setBusiness(biz)
    expect(useStore.getState().business).toEqual(biz)
  })

  it('setBusiness(null) clears business', () => {
    useStore.getState().setBusiness({ id: 'b-1', name: 'X', currency: 'KES' })
    useStore.getState().setBusiness(null)
    expect(useStore.getState().business).toBeNull()
  })

  it('setBusinesses replaces business list', () => {
    const list = [{ id: 'b-1', name: 'A', currency: 'KES' }, { id: 'b-2', name: 'B', currency: 'KES' }]
    useStore.getState().setBusinesses(list)
    expect(useStore.getState().businesses).toHaveLength(2)
  })

  it('addBusiness adds a unique business', () => {
    const biz = { id: 'b-1', name: 'Shop', currency: 'KES' }
    useStore.getState().addBusiness(biz)
    expect(useStore.getState().businesses).toHaveLength(1)
    expect(useStore.getState().businesses[0].id).toBe('b-1')
  })

  it('addBusiness replaces existing business with same id', () => {
    useStore.getState().addBusiness({ id: 'b-1', name: 'Old Name', currency: 'KES' })
    useStore.getState().addBusiness({ id: 'b-1', name: 'New Name', currency: 'KES' })
    expect(useStore.getState().businesses).toHaveLength(1)
    expect(useStore.getState().businesses[0].name).toBe('New Name')
  })

  it('setActiveBusinessId updates active id', () => {
    useStore.getState().setActiveBusinessId('b-42')
    expect(useStore.getState().activeBusinessId).toBe('b-42')
  })

  it('setActiveBusinessId with userId persists per-user preference', () => {
    useStore.getState().setActiveBusinessId('biz-b', 'user-1')
    expect(useStore.getState().activeBusinessId).toBe('biz-b')
    expect(useStore.getState().activeBusinessIdByUser['user-1']).toBe('biz-b')
  })

  it('getPreferredBusinessId returns per-user map entry', () => {
    useStore.getState().setActiveBusinessId('biz-a', 'user-1')
    expect(useStore.getState().getPreferredBusinessId('user-1')).toBe('biz-a')
  })

  it('clearSessionState clears in-memory session data but keeps per-user prefs', () => {
    useStore.getState().setActiveBusinessId('biz-a', 'user-1')
    useStore.getState().setBusiness({ id: 'biz-a', name: 'Shop', currency: 'KES' })
    useStore.getState().setTransactions([{ local_id: 'tx-1' }])
    useStore.getState().clearSessionState()
    expect(useStore.getState().business).toBeNull()
    expect(useStore.getState().transactions).toEqual([])
    expect(useStore.getState().activeBusinessIdByUser['user-1']).toBe('biz-a')
  })

  it('updateBusiness patches the current business', () => {
    useStore.getState().setBusiness({ id: 'b-1', name: 'Shop', currency: 'KES' })
    useStore.getState().updateBusiness({ name: 'Renamed' })
    expect(useStore.getState().business?.name).toBe('Renamed')
    expect(useStore.getState().business?.id).toBe('b-1')
  })

  it('updateBusiness patches current business in businesses list', () => {
    useStore.getState().addBusiness({ id: 'b-1', name: 'Shop', currency: 'KES' })
    useStore.getState().addBusiness({ id: 'b-2', name: 'Other', currency: 'KES' })
    useStore.getState().setBusiness({ id: 'b-1', name: 'Shop', currency: 'KES' })
    useStore.getState().updateBusiness({ name: 'Renamed' })
    const b1 = useStore.getState().businesses.find((b: any) => b.id === 'b-1')
    expect(b1?.name).toBe('Renamed')
    const b2 = useStore.getState().businesses.find((b: any) => b.id === 'b-2')
    expect(b2?.name).toBe('Other')
  })

  it('setTransactions replaces transactions', () => {
    useStore.getState().setTransactions([{ local_id: 't-1', amount: 100 }] as any)
    expect(useStore.getState().transactions).toHaveLength(1)
  })

  it('setLastCloseDate sets date and clears prompt dismissal', () => {
    useStore.getState().dismissClosePrompt()
    useStore.getState().setLastCloseDate('2024-01-15')
    expect(useStore.getState().lastCloseDate).toBe('2024-01-15')
    expect(useStore.getState().closePromptDismissedAt).toBeNull()
  })

  it('dismissClosePrompt sets timestamp', () => {
    useStore.getState().dismissClosePrompt()
    expect(useStore.getState().closePromptDismissedAt).toBeGreaterThan(0)
  })

  it('setTheme changes theme', () => {
    useStore.getState().setTheme('dark')
    expect(useStore.getState().theme).toBe('dark')
  })

  it('setTheme accepts "light"', () => {
    useStore.getState().setTheme('light')
    expect(useStore.getState().theme).toBe('light')
  })
})

describe('useStore — async transaction actions', () => {
  it('addTransaction persists via repository and updates local state', async () => {
    const { saveTransaction } = await import('./repository')
    vi.mocked(saveTransaction).mockResolvedValueOnce({ ok: true, value: 1 })

    const tx = {
      local_id: 'tx-1', type: 'income' as const, amount: 500,
      category: 'sales', source: 'manual', recorded_at: new Date().toISOString(), synced: 0,
    }
    const receiptId = await useStore.getState().addTransaction(tx)

    expect(receiptId).toBe('RCP-001')
    expect(saveTransaction).toHaveBeenCalled()
    const { addToQueue } = await import('../features/sync/syncQueue')
    expect(addToQueue).toHaveBeenCalled()
    const stored = useStore.getState().transactions
    expect(stored).toHaveLength(1)
    expect(stored[0].local_id).toBe('tx-1')
  })

  it('addTransaction for expense does not generate receiptId', async () => {
    const { saveTransaction } = await import('./repository')
    vi.mocked(saveTransaction).mockResolvedValueOnce({ ok: true, value: 1 })

    const tx = {
      local_id: 'tx-2', type: 'expense' as const, amount: 200,
      category: 'supplies', source: 'manual', recorded_at: new Date().toISOString(), synced: 0,
    }
    const receiptId = await useStore.getState().addTransaction(tx)
    expect(receiptId).toBeUndefined()
  })

  it('addTransaction handles saveTransaction failure gracefully', async () => {
    const { saveTransaction } = await import('./repository')
    vi.mocked(saveTransaction).mockRejectedValueOnce(new Error('dexie fail'))

    const tx = {
      local_id: 'tx-3', type: 'income' as const, amount: 100,
      category: 'sales', source: 'manual', recorded_at: new Date().toISOString(), synced: 0,
    }
    await expect(useStore.getState().addTransaction(tx)).rejects.toThrow('dexie fail')
    expect(useStore.getState().transactions).toHaveLength(0)
  })

  it('updateTransaction modifies local state and enqueues sync', async () => {
    const { saveTransaction } = await import('./repository')
    vi.mocked(saveTransaction).mockResolvedValueOnce({ ok: true, value: 1 })

    const tx = { local_id: 'tx-1', type: 'income' as const, amount: 500,
      category: 'sales', source: 'manual', recorded_at: new Date().toISOString(), synced: 0 }
    await useStore.getState().addTransaction(tx)

    await useStore.getState().updateTransaction('tx-1', { amount: 999 })

    const updated = useStore.getState().transactions.find((t: any) => t.local_id === 'tx-1')
    expect(updated?.amount).toBe(999)
    expect(updated?.updated_at).toBeTruthy()
  })

  it('deleteTransaction removes from state and enqueues delete', async () => {
    const { saveTransaction } = await import('./repository')
    vi.mocked(saveTransaction).mockResolvedValueOnce({ ok: true, value: 1 })
    const tx = { local_id: 'tx-1', type: 'income' as const, amount: 500,
      category: 'sales', source: 'manual', recorded_at: new Date().toISOString(), synced: 0 }
    await useStore.getState().addTransaction(tx)
    expect(useStore.getState().transactions).toHaveLength(1)

    await useStore.getState().deleteTransaction('tx-1')
    expect(useStore.getState().transactions).toHaveLength(0)
  })
})

describe('useStore — persistence', () => {
  it('persists language, business, theme to localStorage', () => {
    useStore.getState().setLanguage('en')
    useStore.getState().setBusiness({ id: 'b-1', name: 'P', currency: 'KES' })
    useStore.getState().setTheme('dark')

    const raw = localStorage.getItem('daftari-store')
    expect(raw).toBeTruthy()
    if (!raw) return
    const parsed = JSON.parse(raw)
    expect(parsed.state.language).toBe('en')
    expect(parsed.state.business?.name).toBe('P')
    expect(parsed.state.theme).toBe('dark')
  })

  it('does NOT persist transactions', async () => {
    const { saveTransaction } = await import('./repository')
    vi.mocked(saveTransaction).mockResolvedValueOnce({ ok: true, value: 1 })
    const tx = { local_id: 'tx-1', type: 'income' as const, amount: 500,
      category: 'sales', source: 'manual', recorded_at: new Date().toISOString(), synced: 0 }
    await useStore.getState().addTransaction(tx)

    const raw = localStorage.getItem('daftari-store')
    expect(raw).toBeTruthy()
    if (!raw) return
    const parsed = JSON.parse(raw)
    expect(parsed.state.transactions).toBeUndefined()
  })

  it('restores persisted state on re-import', async () => {
    vi.resetModules()
    const snapshot = {
      state: {
        language: 'en',
        business: { id: 'b-1', name: 'Restored', currency: 'KES' },
        businesses: [],
        activeBusinessId: null,
        lastCloseDate: '2024-06-01',
        closePromptDismissedAt: null,
        theme: 'dark',
      },
      version: 0,
    }
    localStorage.setItem('daftari-store', JSON.stringify(snapshot))

    const { useStore: restoredStore } = await import('./store')
    const state = restoredStore.getState()
    expect(state.language).toBe('en')
    expect(state.business?.name).toBe('Restored')
    expect(state.lastCloseDate).toBe('2024-06-01')
    expect(state.theme).toBe('dark')
  })
})
