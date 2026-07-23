import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RecordFulizaRepaid from './RecordFulizaRepaid'

vi.mock('../../lib/store', () => {
  const storeState = {
    language: 'sw',
    addTransaction: vi.fn(async () => 'fr-1'),
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

describe('RecordFulizaRepaid', () => {
  const onSave = vi.fn()
  const onCancel = vi.fn()

  beforeEach(() => { vi.clearAllMocks() })

  it('renders amount input and buttons', () => {
    render(<RecordFulizaRepaid onSave={onSave} onCancel={onCancel} />)
    expect(screen.getByPlaceholderText('0')).toBeDefined()
    expect(screen.getByText('save')).toBeDefined()
    expect(screen.getByText('cancel')).toBeDefined()
  })

  it('shows fuliza repay label', () => {
    render(<RecordFulizaRepaid onSave={onSave} onCancel={onCancel} />)
    expect(screen.getByText('lipa_fuliza')).toBeDefined()
  })

  it('disables save when amount is empty', () => {
    render(<RecordFulizaRepaid onSave={onSave} onCancel={onCancel} />)
    expect(screen.getByText('save')).toBeDisabled()
  })

  it('shows error for invalid amount', () => {
    render(<RecordFulizaRepaid onSave={onSave} onCancel={onCancel} />)
    const input = screen.getByPlaceholderText('0')
    fireEvent.change(input, { target: { value: '0' } })
    fireEvent.blur(input)
    expect(screen.getByText('please_enter_valid_amount')).toBeDefined()
  })

  it('enables save when valid amount entered', () => {
    render(<RecordFulizaRepaid onSave={onSave} onCancel={onCancel} />)
    const input = screen.getByPlaceholderText('0')
    fireEvent.change(input, { target: { value: '500' } })
    expect(screen.getByText('save')).not.toBeDisabled()
  })

  it('shows success flash after save', async () => {
    render(<RecordFulizaRepaid onSave={onSave} onCancel={onCancel} />)
    const input = screen.getByPlaceholderText('0')
    fireEvent.change(input, { target: { value: '2500' } })
    fireEvent.click(screen.getByText('save'))

    await waitFor(() => {
      expect(screen.getByText('recorded')).toBeDefined()
    })
  })
})
