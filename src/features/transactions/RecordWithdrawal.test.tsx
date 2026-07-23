import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RecordWithdrawal from './RecordWithdrawal'

vi.mock('../../lib/store', () => {
  const storeState = {
    language: 'sw',
    addTransaction: vi.fn(async () => 'w-1'),
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

describe('RecordWithdrawal', () => {
  const onSave = vi.fn()
  const onCancel = vi.fn()

  beforeEach(() => { vi.clearAllMocks() })

  it('renders amount input, note input, and buttons', () => {
    render(<RecordWithdrawal onSave={onSave} onCancel={onCancel} />)
    expect(screen.getByPlaceholderText('0')).toBeDefined()
    expect(screen.getByText('save')).toBeDefined()
    expect(screen.getByText('cancel')).toBeDefined()
  })

  it('shows withdrawal warning', () => {
    render(<RecordWithdrawal onSave={onSave} onCancel={onCancel} />)
    expect(screen.getByText('withdrawal_warning')).toBeDefined()
  })

  it('disables save when amount is empty', () => {
    render(<RecordWithdrawal onSave={onSave} onCancel={onCancel} />)
    expect(screen.getByText('save')).toBeDisabled()
  })

  it('shows error for zero amount', () => {
    render(<RecordWithdrawal onSave={onSave} onCancel={onCancel} />)
    const input = screen.getByPlaceholderText('0')
    fireEvent.change(input, { target: { value: '0' } })
    fireEvent.blur(input)
    expect(screen.getByText('please_enter_valid_amount')).toBeDefined()
  })

  it('enables save when valid amount entered', () => {
    render(<RecordWithdrawal onSave={onSave} onCancel={onCancel} />)
    const input = screen.getByPlaceholderText('0')
    fireEvent.change(input, { target: { value: '500' } })
    expect(screen.getByText('save')).not.toBeDisabled()
  })

  it('calls onCancel when cancel clicked', () => {
    render(<RecordWithdrawal onSave={onSave} onCancel={onCancel} />)
    fireEvent.click(screen.getByText('cancel'))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('shows success flash after saving', async () => {
    render(<RecordWithdrawal onSave={onSave} onCancel={onCancel} />)
    const input = screen.getByPlaceholderText('0')
    fireEvent.change(input, { target: { value: '2000' } })
    fireEvent.click(screen.getByText('save'))
    await waitFor(() => {
      expect(screen.getByText(/KES 2,000/)).toBeDefined()
    })
  })
})
