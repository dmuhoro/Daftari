import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BatchEntryScreen from './BatchEntryScreen'

vi.mock('../lib/store', () => {
  const storeState = {
    language: 'sw',
    business: { id: 'biz-1', name: 'Duka Bora', currency: 'KES', category: 'retail' },
    addTransaction: vi.fn(async () => 'batch-1'),
    activeBusinessId: 'biz-1',
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

describe('BatchEntryScreen', () => {
  const onBack = vi.fn()

  beforeEach(() => { vi.clearAllMocks() })

  it('renders with income/expense toggle', () => {
    render(<BatchEntryScreen onBack={onBack} />)
    // t('sale') and t('expense') return keys
    expect(screen.getByText('sale')).toBeDefined()
    expect(screen.getByText('expense')).toBeDefined()
  })

  it('renders batch entry header', () => {
    render(<BatchEntryScreen onBack={onBack} />)
    expect(screen.getByText('batch_entry')).toBeDefined()
  })

  it('renders add and done buttons', () => {
    render(<BatchEntryScreen onBack={onBack} />)
    expect(screen.getByText('batch_add')).toBeDefined()
    expect(screen.getByText('batch_done')).toBeDefined()
  })

  it('disables add button when amount is empty', () => {
    render(<BatchEntryScreen onBack={onBack} />)
    expect(screen.getByText('batch_add')).toBeDisabled()
  })

  it('enables add button when valid amount entered', () => {
    render(<BatchEntryScreen onBack={onBack} />)
    const amountInput = screen.getByPlaceholderText('batch_amount')
    fireEvent.change(amountInput, { target: { value: '500' } })
    expect(screen.getByText('batch_add')).not.toBeDisabled()
  })

  it('calls onBack when done button clicked', () => {
    render(<BatchEntryScreen onBack={onBack} />)
    fireEvent.click(screen.getByText('batch_done'))
    expect(onBack).toHaveBeenCalledOnce()
  })

  it('increments count after adding entry', async () => {
    render(<BatchEntryScreen onBack={onBack} />)
    const amountInput = screen.getByPlaceholderText('batch_amount')
    fireEvent.change(amountInput, { target: { value: '500' } })
    fireEvent.click(screen.getByText('batch_add'))
    // Count should show batch_count after first add
    await vi.waitFor(() => {
      expect(screen.getByText(/batch_count/)).toBeDefined()
    })
  })
})
