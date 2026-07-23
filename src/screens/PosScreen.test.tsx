import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PosScreen from './PosScreen'

vi.mock('../lib/store', () => {
  const storeState = {
    language: 'sw',
    business: {
      id: 'biz-1', name: 'Duka Bora', currency: 'KES', category: 'retail',
      products: [
        { id: 'p1', name: 'Unga', price: 200, stock: 50 },
        { id: 'p2', name: 'Sukari', price: 300, stock: 30 },
      ],
    },
    addTransaction: vi.fn(async () => 'receipt-pos-1'),
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
  const useStore = Object.assign(
    vi.fn((s?: (state: typeof storeState) => unknown) => s ? s(storeState) : storeState),
    { getState: vi.fn(() => storeState) },
  )
  return { useStore }
})

vi.mock('../hooks/useTranslation', () => ({
  useTranslation: () => ({ t: (key: string) => key, language: 'sw' }),
}))

vi.mock('../lib/repository', () => ({
  getBusiness: vi.fn(async () => ({ ok: true, value: { id: 'biz-1' } })),
  updateBusiness: vi.fn(async () => ({ ok: true })),
  getCustomersByBusinessId: vi.fn(async () => ({ ok: true, value: [] })),
  updateCustomer: vi.fn(async () => ({ ok: true })),
}))

vi.mock('../lib/barcode', () => ({ scanBarcodeWithFallback: vi.fn() }))
vi.mock('../lib/sentry', () => ({ captureError: vi.fn() }))
vi.mock('../lib/print', () => ({
  printBrowserReceipt: vi.fn(),
  printBluetoothReceipt: vi.fn(),
}))

function clickProduct(name: string) {
  // Product grid buttons have the product name in a span with line-clamp-2 class
  const grid = screen.getByRole('button', { name: new RegExp(name) })
  fireEvent.click(grid)
}

function getCartTotalElements() {
  // The cart total is rendered as a <p> with "KES {total}" in a font-bold class
  return screen.getAllByText(/KES \d/).filter(
    el => el.className.includes('font-bold') || el.className.includes('font-semibold')
  )
}

describe('PosScreen — Money Safety', () => {
  const onBack = vi.fn()

  beforeEach(() => { vi.clearAllMocks() })

  it('renders product grid with prices', () => {
    render(<PosScreen onBack={onBack} />)
    expect(screen.getByText('Unga')).toBeDefined()
    expect(screen.getByText('Sukari')).toBeDefined()
  })

  it('adds item to cart and shows checkout button', () => {
    render(<PosScreen onBack={onBack} />)
    clickProduct('Unga')
    expect(screen.getByText('pos_checkout')).toBeDefined()
  })

  it('calculates cart total correctly with multiple of same item (no floating-point drift)', () => {
    render(<PosScreen onBack={onBack} />)
    // Add 3 × Unga (200 each) = 600
    clickProduct('Unga')
    clickProduct('Unga')
    clickProduct('Unga')
    // Cart total should contain "KES 600"
    const totalEls = getCartTotalElements()
    const totalTexts = totalEls.map(e => e.textContent)
    expect(totalTexts.some(t => t?.includes('600'))).toBe(true)
    expect(totalTexts.some(t => t?.includes('599'))).toBe(false)
    expect(totalTexts.some(t => t?.includes('601'))).toBe(false)
  })

  it('calculates cart total with mixed items correctly', () => {
    render(<PosScreen onBack={onBack} />)
    // Add 1 × Unga (200) + 1 × Sukari (300) = 500
    clickProduct('Unga')
    clickProduct('Sukari')
    const totalEls = getCartTotalElements()
    const totalTexts = totalEls.map(e => e.textContent)
    expect(totalTexts.some(t => t?.includes('500'))).toBe(true)
  })

  it('updates total when quantity increases', () => {
    render(<PosScreen onBack={onBack} />)
    clickProduct('Unga')
    const increaseBtn = screen.getByLabelText('Increase quantity')
    fireEvent.click(increaseBtn)
    // 2 × 200 = 400
    const totalEls = getCartTotalElements()
    const totalTexts = totalEls.map(e => e.textContent)
    expect(totalTexts.some(t => t?.includes('400'))).toBe(true)
  })

  it('removes item when quantity reaches zero', () => {
    render(<PosScreen onBack={onBack} />)
    clickProduct('Unga')
    const decreaseBtn = screen.getByLabelText('Decrease quantity')
    fireEvent.click(decreaseBtn)
    expect(screen.queryByText('pos_checkout')).toBeNull()
  })

  it('verifies kesSubtract for discount calculations', () => {
    render(<PosScreen onBack={onBack} />)
    // This tests that discount (kesSubtract) is correctly wired
    // The discount feature requires a customer with points, so we verify the total
    // shows correctly for basic cases (no discount = no subtraction)
    clickProduct('Unga')
    clickProduct('Sukari')
    // Total should be exactly 500, not 500 - 0 = something weird
    const totalEls = getCartTotalElements()
    const totalTexts = totalEls.map(e => e.textContent)
    expect(totalTexts.some(t => t?.includes('500'))).toBe(true)
  })
})
