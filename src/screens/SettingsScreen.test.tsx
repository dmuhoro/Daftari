import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import SettingsScreen from './SettingsScreen'

vi.mock('../lib/store', () => {
  const storeState = {
    language: 'sw', setLanguage: vi.fn(),
    theme: 'light', setTheme: vi.fn(),
    business: { id: 'biz-1', name: 'Duka Bora', currency: 'KES', category: 'retail', subcategory: 'general_retail', payment_methods: ['cash', 'mpesa'] },
    updateBusiness: vi.fn(),
    businesses: [{ id: 'biz-1', name: 'Duka Bora', currency: 'KES', category: 'retail', subcategory: 'general_retail', payment_methods: ['cash', 'mpesa'] }],
    activeBusinessId: 'biz-1', setBusiness: vi.fn(), setActiveBusinessId: vi.fn(),
    transactions: [],
  }
  const useStoreMock = Object.assign(
    vi.fn((s?: (state: Record<string, unknown>) => unknown) => s ? s(storeState as unknown as Record<string, unknown>) : storeState),
    { getState: vi.fn(() => storeState) }
  )
  return { useStore: useStoreMock }
})

vi.mock('../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    language: 'sw',
  }),
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({
        data: { user: { email: 'test@example.com', created_at: '2026-01-01', last_sign_in_at: '2026-07-20' } },
        error: null,
      })),
      signOut: vi.fn(),
    },
  },
}))

vi.mock('../lib/analytics', () => ({ track: vi.fn(), EVENTS: {} }))
vi.mock('../lib/repository', () => ({ getBusiness: vi.fn(() => Promise.resolve({ ok: true, value: { id: 'biz-1' } })), updateBusiness: vi.fn(), addBusiness: vi.fn() }))
vi.mock('../lib/businessCategories', () => ({ BUSINESS_CATEGORIES: { retail: { label: { sw: 'Rejareja', en: 'Retail' }, subcategories: { general_retail: { sw: 'Rejareja Kwa Ujumla', en: 'General Retail' } } } }, categoryEmoji: () => '🏪' }))
vi.mock('../lib/csv', () => ({ transactionsToCSV: vi.fn(() => ''), downloadCSV: vi.fn() }))
vi.mock('../lib/backup', () => ({ exportAllData: vi.fn() }))
vi.mock('../lib/syncAll', () => ({ pullFromSupabase: vi.fn() }))
vi.mock('../features/sync/syncQueue', () => ({ flushQueue: vi.fn() }))
vi.mock('../lib/referral', () => ({ generateReferralUrl: vi.fn(), shareViaWhatsApp: vi.fn() }))
vi.mock('../hooks/usePWAInstall', () => ({ usePWAInstall: () => ({ canInstall: false, install: vi.fn() }) }))
vi.mock('../hooks/useToast', () => ({ useToast: () => ({ toast: vi.fn() }) }))

describe('SettingsScreen', () => {
  const onSignOut = vi.fn()
  beforeEach(() => { vi.clearAllMocks() })

  it('renders user profile section', async () => {
    render(<SettingsScreen onSignOut={onSignOut} />)
    await waitFor(() => expect(screen.getByText('user_profile')).toBeDefined())
  })

  it('shows language section', () => {
    render(<SettingsScreen onSignOut={onSignOut} />)
    expect(screen.getByText('language')).toBeDefined()
  })

  it('shows appearance section', () => {
    render(<SettingsScreen onSignOut={onSignOut} />)
    expect(screen.getByText('appearance')).toBeDefined()
  })

  it('shows sign out button', () => {
    render(<SettingsScreen onSignOut={onSignOut} />)
    expect(screen.getByText('sign_out')).toBeDefined()
  })
})
