import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import HistoryScreen from './HistoryScreen'

vi.mock('../lib/store', () => {
  const mockTransactions = [
    { local_id: 'tx-1', type: 'income' as const, amount: 5000, category: 'Mauzo', source: 'manual', recorded_at: new Date().toISOString(), synced: 1, description: 'Karatasi 10' },
    { local_id: 'tx-2', type: 'expense' as const, amount: 2000, category: 'Ununuzi', source: 'manual', recorded_at: new Date().toISOString(), synced: 1, description: 'Mafuta' },
    { local_id: 'tx-3', type: 'withdrawal' as const, amount: 1000, category: 'Utoaji', source: 'manual', recorded_at: new Date().toISOString(), synced: 1 },
  ]
  const storeState = {
    transactions: mockTransactions,
    updateTransaction: vi.fn(),
    deleteTransaction: vi.fn(),
    addTransaction: vi.fn(),
    language: 'sw' as const,
  }
  const useStoreMock = Object.assign(
    vi.fn((s?: (state: Record<string, unknown>) => unknown) => s ? s(storeState as unknown as Record<string, unknown>) : storeState),
    { getState: vi.fn(() => storeState) }
  )
  return { useStore: useStoreMock }
})

vi.mock('../lib/csv', () => ({ transactionsToCSV: vi.fn(() => ''), downloadCSV: vi.fn() }))
vi.mock('../features/sync/syncQueue', () => ({ flushQueue: vi.fn() }))
vi.mock('../hooks/useOnlineStatus', () => ({ useOnlineStatus: () => ({ isOnline: true }) }))

vi.mock('../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    language: 'sw',
  }),
}))

describe('HistoryScreen', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('renders search input', () => {
    render(<HistoryScreen />)
    expect(document.querySelector('input[type="text"]')).toBeDefined()
  })

  it('renders filter tabs', () => {
    render(<HistoryScreen />)
    expect(screen.getByText('filter_all')).toBeDefined()
    expect(screen.getByText('filter_this_week')).toBeDefined()
    expect(screen.getByText('filter_this_month')).toBeDefined()
  })

  it('shows income transactions', () => {
    render(<HistoryScreen />)
    expect(screen.getByText('Karatasi 10')).toBeDefined()
  })

  it('shows expense transactions', () => {
    render(<HistoryScreen />)
    expect(screen.getByText('Mafuta')).toBeDefined()
  })

  it('formats income amount', () => {
    render(<HistoryScreen />)
    expect(screen.getAllByText(/5,000/)[0]).toBeDefined()
  })

  it('formats expense amount', () => {
    render(<HistoryScreen />)
    expect(screen.getAllByText(/2,000/)[0]).toBeDefined()
  })
})
