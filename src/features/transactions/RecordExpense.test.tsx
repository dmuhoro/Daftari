import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RecordExpense from './RecordExpense'

vi.mock('../../lib/store', () => {
  const storeState = {
    language: 'sw',
    business: { id: 'biz-1', name: 'Duka Bora', currency: 'KES', category: 'retail', subcategory: 'general_retail' },
    addTransaction: vi.fn(async () => 'exp-1'),
    activeBusinessId: 'biz-1',
  }
  const useStore = Object.assign(
    vi.fn((s?: (state: typeof storeState) => unknown) => s ? s(storeState) : storeState),
    { getState: vi.fn(() => storeState) },
  )
  return { useStore }
})
vi.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => ({ t: (key: string) => key, language: 'sw' }),
}))
vi.mock('../../lib/analytics', () => ({ track: vi.fn(), EVENTS: {} }))
vi.mock('../../lib/businessCategories', () => ({
  BUSINESS_CATEGORIES: {
    retail: {
      expenseCategories: [
        { key: 'ingredients', sw: 'Vifaa', en: 'Ingredients' },
        { key: 'transport', sw: 'Usafiri', en: 'Transport' },
      ],
    },
  },
}))

describe('RecordExpense', () => {
  const onSave = vi.fn()
  const onCancel = vi.fn()

  beforeEach(() => { vi.clearAllMocks() })

  it('renders amount input and save/cancel buttons', () => {
    render(<RecordExpense onSave={onSave} onCancel={onCancel} />)
    expect(screen.getByPlaceholderText('0')).toBeDefined()
    expect(screen.getByText('save')).toBeDefined()
    expect(screen.getByText('cancel')).toBeDefined()
  })

  it('renders expense categories', () => {
    render(<RecordExpense onSave={onSave} onCancel={onCancel} />)
    expect(screen.getByText('Vifaa')).toBeDefined()
    expect(screen.getByText('Usafiri')).toBeDefined()
  })

  it('disables save when amount is empty', () => {
    render(<RecordExpense onSave={onSave} onCancel={onCancel} />)
    expect(screen.getByText('save')).toBeDisabled()
  })

  it('shows error for invalid amount', () => {
    render(<RecordExpense onSave={onSave} onCancel={onCancel} />)
    const input = screen.getByPlaceholderText('0')
    fireEvent.change(input, { target: { value: '-50' } })
    fireEvent.blur(input)
    expect(screen.getByText('please_enter_valid_amount')).toBeDefined()
  })

  it('enables save when valid amount entered', () => {
    render(<RecordExpense onSave={onSave} onCancel={onCancel} />)
    const input = screen.getByPlaceholderText('0')
    fireEvent.change(input, { target: { value: '1500' } })
    expect(screen.getByText('save')).not.toBeDisabled()
  })

  it('calls onCancel when cancel clicked', () => {
    render(<RecordExpense onSave={onSave} onCancel={onCancel} />)
    fireEvent.click(screen.getByText('cancel'))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('shows success flash after saving', async () => {
    render(<RecordExpense onSave={onSave} onCancel={onCancel} />)
    const input = screen.getByPlaceholderText('0')
    fireEvent.change(input, { target: { value: '1500' } })
    fireEvent.click(screen.getByText('save'))
    // Receipt renders "KES 1,500"
    await waitFor(() => {
      expect(screen.getByText(/KES 1,500/)).toBeDefined()
    })
  })
})
