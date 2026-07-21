import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RecordSale from './RecordSale'

vi.mock('../../lib/store', () => {
  const storeState = {
    language: 'sw',
    business: {
      id: 'biz-1', name: 'Duka Bora', currency: 'KES', category: 'retail',
      subcategory: 'general_retail',
      payment_methods: ['cash', 'mpesa_send_money'],
      products: [
        { id: 'p1', name: 'Unga', price: 200, stock: 50, low_stock_threshold: 10 },
        { id: 'p2', name: 'Sukari', price: 300, stock: 30, low_stock_threshold: 5 },
      ],
    },
    updateBusiness: vi.fn(),
    activeBusinessId: 'biz-1',
    transactions: [],
    businesses: [],
    theme: 'light' as const,
    lastCloseDate: null,
    closePromptDismissedAt: null,
    setBusiness: vi.fn(),
    setActiveBusinessId: vi.fn(),
    setLanguage: vi.fn(),
    setTheme: vi.fn(),
  }
  storeState.addTransaction = vi.fn(async () => 'receipt-1')
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
vi.mock('../../lib/repository', () => ({ getBusiness: vi.fn(), updateBusiness: vi.fn() }))
vi.mock('../../lib/sentry', () => ({ captureError: vi.fn() }))
vi.mock('../../lib/whatsapp', () => ({ shareViaWhatsApp: vi.fn(), formatReceiptText: vi.fn() }))
vi.mock('../../lib/businessCategories', () => ({
  BUSINESS_CATEGORIES: {
    retail: {
      label: { sw: 'Rejareja', en: 'Retail' },
      subcategories: { general_retail: { sw: 'Rejareja Kwa Ujumla', en: 'General Retail' } },
      incomeCategories: [
        { key: 'product_sale', sw: 'Bidhaa', en: 'Product' },
        { key: 'service', sw: 'Huduma', en: 'Service' },
      ],
    },
  },
  getTemplateProducts: () => [],
}))

describe('RecordSale', () => {
  const onSave = vi.fn()
  const onCancel = vi.fn()

  beforeEach(() => { vi.clearAllMocks() })

  it('renders quick-sale buttons for each product', () => {
    render(<RecordSale onSave={onSave} onCancel={onCancel} />)
    expect(screen.getByText('Unga — KES 200')).toBeDefined()
    expect(screen.getByText('Sukari — KES 300')).toBeDefined()
  })

  it('renders category buttons', () => {
    render(<RecordSale onSave={onSave} onCancel={onCancel} />)
    expect(screen.getByText('Bidhaa')).toBeDefined()
    expect(screen.getByText('Huduma')).toBeDefined()
  })

  it('renders payment method buttons when multiple methods exist', () => {
    render(<RecordSale onSave={onSave} onCancel={onCancel} />)
    expect(screen.getByText('Taslimu')).toBeDefined()
    expect(screen.getByText('M-Pesa')).toBeDefined()
  })

  it('shows amount input', () => {
    render(<RecordSale onSave={onSave} onCancel={onCancel} />)
    expect(screen.getByPlaceholderText('0')).toBeDefined()
  })

  it('shows description input', () => {
    render(<RecordSale onSave={onSave} onCancel={onCancel} />)
    expect(screen.getByPlaceholderText('description')).toBeDefined()
  })

  it('shows cancel and save buttons', () => {
    render(<RecordSale onSave={onSave} onCancel={onCancel} />)
    expect(screen.getByText('cancel')).toBeDefined()
    expect(screen.getByText('save')).toBeDefined()
  })

  it('calls onCancel when cancel is clicked', () => {
    render(<RecordSale onSave={onSave} onCancel={onCancel} />)
    fireEvent.click(screen.getByText('cancel'))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('disables save button when amount is empty', () => {
    render(<RecordSale onSave={onSave} onCancel={onCancel} />)
    expect(screen.getByText('save')).toBeDisabled()
  })

  it('shows amount error for invalid input', () => {
    render(<RecordSale onSave={onSave} onCancel={onCancel} />)
    const input = screen.getByPlaceholderText('0')
    fireEvent.change(input, { target: { value: '-50' } })
    fireEvent.blur(input)
    expect(screen.getByText('please_enter_valid_amount')).toBeDefined()
  })

  it('enables save button when amount is valid', () => {
    render(<RecordSale onSave={onSave} onCancel={onCancel} />)
    const input = screen.getByPlaceholderText('0')
    fireEvent.change(input, { target: { value: '1500' } })
    expect(screen.getByText('save')).not.toBeDisabled()
  })

  it('selects first payment method when only one exists', () => {
    render(<RecordSale onSave={onSave} onCancel={onCancel} />)
    expect(screen.getByText('Taslimu')).toBeDefined()
  })
})
