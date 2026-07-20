import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DashboardScreen from './DashboardScreen'

vi.mock('../lib/repository', () => ({
  countCustomers: vi.fn(() => Promise.resolve({ ok: true, value: 5 })),
  getAllDailyCloses: vi.fn(() => Promise.resolve({ ok: true, value: [] })),
  calculateProfit: () => 3000,
  calculateFulizaDebt: () => 0,
  calculateWeeklyProfits: () => [],
}))

vi.mock('../features/sync/SyncDot', () => ({ default: () => null }))
vi.mock('../lib/analytics', () => ({ track: vi.fn(), EVENTS: {} }))

vi.mock('../lib/store', () => {
  const storeState = {
    language: 'sw',
    business: { id: 'biz-1', name: 'Duka Bora', currency: 'KES', category: 'retail' as const, subcategory: 'general_retail' as const, payment_methods: ['cash', 'mpesa'], products: [{ id: 'p1', name: 'Unga', price: 200, stock: 50, low_stock_threshold: 10 }] },
    businesses: [{ id: 'biz-1', name: 'Duka Bora', currency: 'KES', category: 'retail', subcategory: 'general_retail', payment_methods: ['cash', 'mpesa'], products: [] }],
    activeBusinessId: 'biz-1',
    transactions: [
      { local_id: '1', type: 'income' as const, amount: 5000, category: 'Mauzo', source: 'manual', recorded_at: new Date().toISOString(), synced: 1 },
      { local_id: '2', type: 'expense' as const, amount: 2000, category: 'Ununuzi', source: 'manual', recorded_at: new Date().toISOString(), synced: 1 },
    ],
    lastCloseDate: null, closePromptDismissedAt: null, theme: 'light' as const,
    setBusiness: vi.fn(), setActiveBusinessId: vi.fn(), setLanguage: vi.fn(),
  }
  const useStore = Object.assign(
    vi.fn((s?: (state: Record<string, unknown>) => unknown) => s ? s(storeState as unknown as Record<string, unknown>) : storeState),
    { getState: vi.fn(() => storeState) }
  )
  return { useStore }
})

vi.mock('../lib/businessCategories', () => ({
  BUSINESS_CATEGORIES: {
    retail: { label: { sw: 'Rejareja', en: 'Retail' }, subcategories: { general_retail: { sw: 'Rejareja Kwa Ujumla', en: 'General Retail' } } },
  },
  categoryEmoji: () => '🏪',
  CATEGORY_DASHBOARD_LABELS: {
    retail: {
      incomeLabel: { sw: 'Mauzo', en: 'Sales' },
      expenseLabel: { sw: 'Gharama', en: 'Costs' },
      emptyTitle: { sw: 'Hakuna mauzo leo', en: 'No sales today' },
      emptyDesc: { sw: 'Bonyeza + kurekodi', en: 'Tap + to record' },
      emptyWeekTitle: { sw: 'Hakuna mauzo wiki hii', en: 'No sales this week' },
      emptyWeekDesc: { sw: 'Mauzo yataonekana', en: 'Sales will appear' },
    },
  },
}))

vi.mock('../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    language: 'sw',
  }),
}))

describe('DashboardScreen', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('renders business name', () => {
    render(<DashboardScreen />)
    expect(screen.getByText('Duka Bora')).toBeDefined()
  })

  it('shows today tab', () => {
    render(<DashboardScreen />)
    expect(screen.getByText('today')).toBeDefined()
  })

  it('shows this week tab', () => {
    render(<DashboardScreen />)
    expect(screen.getByText('this_week')).toBeDefined()
  })

  it('displays profit section', () => {
    render(<DashboardScreen />)
    expect(screen.getByText('leo_faida')).toBeDefined()
  })

  it('displays category income label (Mauzo)', () => {
    render(<DashboardScreen />)
    expect(screen.getByText('Mauzo')).toBeDefined()
  })

  it('displays category expense label (Gharama)', () => {
    render(<DashboardScreen />)
    expect(screen.getByText('Gharama')).toBeDefined()
  })

  it('displays cash available', () => {
    render(<DashboardScreen />)
    expect(screen.getByText('pesa_iliyobaki')).toBeDefined()
  })

  it('switches to wiki tab', () => {
    render(<DashboardScreen />)
    fireEvent.click(screen.getByText('this_week'))
    expect(screen.getByText('wiki_faida')).toBeDefined()
  })

  it('shows customer count section', async () => {
    render(<DashboardScreen />)
    await waitFor(() => expect(screen.getByText('wateja_wangu')).toBeDefined())
  })
})
