import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DailyClose from './DailyClose'

vi.mock('../../lib/store', () => {
  const ts = new Date().toISOString()
  const storeState = {
    language: 'sw',
    theme: 'light' as const,
    business: { id: 'biz-1', name: 'Duka Bora', currency: 'KES', category: 'retail', payment_methods: ['cash'] },
    activeBusinessId: 'biz-1',
    transactions: [
      { local_id: '1', type: 'income' as const, amount: 5000, category: 'Mauzo', source: 'manual', recorded_at: ts, synced: 1 },
      { local_id: '2', type: 'expense' as const, amount: 2000, category: 'Ununuzi', source: 'manual', recorded_at: ts, synced: 1 },
      { local_id: '3', type: 'income' as const, amount: 3000, category: 'Mauzo', source: 'manual', recorded_at: ts, synced: 1 },
    ],
    setLastCloseDate: vi.fn(),
    lastCloseDate: null,
    closePromptDismissedAt: null,
    setBusiness: vi.fn(),
    updateBusiness: vi.fn(),
    setActiveBusinessId: vi.fn(),
    setLanguage: vi.fn(),
    setTheme: vi.fn(),
    businesses: [],
  }
  const useStore = Object.assign(
    vi.fn((s?: (state: typeof storeState) => unknown) => s ? s(storeState) : storeState),
    { getState: vi.fn(() => storeState) },
  )
  return { useStore }
})

vi.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    language: 'sw',
  }),
}))

vi.mock('../../lib/analytics', () => ({ track: vi.fn(), EVENTS: {} }))
vi.mock('../../lib/repository', () => ({ saveDailyClose: vi.fn(() => Promise.resolve({ ok: true })) }))

describe('DailyClose', () => {
  const onClose = vi.fn()
  const onDismiss = vi.fn()

  beforeEach(() => { vi.clearAllMocks() })

  it('returns null when not visible', () => {
    const { container } = render(<DailyClose visible={false} onClose={onClose} onDismiss={onDismiss} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders the sheet when visible', () => {
    render(<DailyClose visible={true} onClose={onClose} onDismiss={onDismiss} />)
    expect(screen.getByText('funga_siku')).toBeDefined()
  })

  it('displays correct revenue total', () => {
    render(<DailyClose visible={true} onClose={onClose} onDismiss={onDismiss} />)
    expect(screen.getByText('KES 8,000')).toBeDefined()
  })

  it('displays correct expenses total', () => {
    render(<DailyClose visible={true} onClose={onClose} onDismiss={onDismiss} />)
    expect(screen.getByText('KES 2,000')).toBeDefined()
  })

  it('displays correct profit', () => {
    render(<DailyClose visible={true} onClose={onClose} onDismiss={onDismiss} />)
    expect(screen.getByText('KES 6,000')).toBeDefined()
  })

  it('shows baadaye and funga buttons', () => {
    render(<DailyClose visible={true} onClose={onClose} onDismiss={onDismiss} />)
    expect(screen.getByText('baadaye')).toBeDefined()
    expect(screen.getByText('funga')).toBeDefined()
  })

  it('calls onDismiss when backdrop is clicked', () => {
    render(<DailyClose visible={true} onClose={onClose} onDismiss={onDismiss} />)
    const backdrop = document.querySelector('.fixed.inset-0 > div:first-child')
    fireEvent.click(backdrop!)
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('calls onDismiss when baadaye is clicked', () => {
    render(<DailyClose visible={true} onClose={onClose} onDismiss={onDismiss} />)
    fireEvent.click(screen.getByText('baadaye'))
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('calls onClose when funga is clicked', async () => {
    render(<DailyClose visible={true} onClose={onClose} onDismiss={onDismiss} />)
    fireEvent.click(screen.getByText('funga'))

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledOnce()
    })
  })

})
