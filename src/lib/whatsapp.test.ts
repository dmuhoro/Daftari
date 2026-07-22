import { describe, it, expect, vi } from 'vitest'
import { formatReceiptText, formatDailySummaryText, shareViaWhatsApp } from './whatsapp'

describe('formatReceiptText()', () => {
  it('formats income receipt with description', () => {
    const result = formatReceiptText('Duka Bora', 'RCP-001', 1500, 'income', 'Unga sale')
    expect(result).toContain('Duka Bora')
    expect(result).toContain('RCP-001')
    expect(result).toContain('KES 1,500')
    expect(result).toContain('Sale')
    expect(result).toContain('Note: Unga sale')
    expect(result).toContain('Powered by Daftari')
  })

  it('formats expense receipt', () => {
    const result = formatReceiptText('Duka Bora', 'RCP-002', 500, 'expense')
    expect(result).toContain('Expense')
    expect(result).not.toContain('Sale')
  })

  it('formats withdrawal receipt', () => {
    const result = formatReceiptText('Duka Bora', 'RCP-003', 2000, 'withdrawal')
    expect(result).toContain('Withdrawal')
  })

  it('omits Note line when description is not provided', () => {
    const result = formatReceiptText('Duka Bora', 'RCP-001', 500, 'income')
    expect(result).not.toContain('Note:')
  })
})

describe('formatDailySummaryText()', () => {
  it('formats summary with all fields', () => {
    const result = formatDailySummaryText('Duka Bora', '2024-06-15', 10000, 3000, 7000, 15)
    expect(result).toContain('Duka Bora')
    expect(result).toContain('2024-06-15')
    expect(result).toContain('Revenue: KES 10,000')
    expect(result).toContain('Expenses: KES 3,000')
    expect(result).toContain('Profit: KES 7,000')
    expect(result).toContain('Transactions: 15')
    expect(result).toContain('Powered by Daftari')
  })
})

describe('shareViaWhatsApp()', () => {
  it('opens WhatsApp with text when no phone number', () => {
    const openSpy = vi.spyOn(window, 'open')
    shareViaWhatsApp('Hello World')
    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('api.whatsapp.com/send?text='),
      '_blank'
    )
    openSpy.mockRestore()
  })

  it('opens WhatsApp with phone number when provided', () => {
    const openSpy = vi.spyOn(window, 'open')
    shareViaWhatsApp('Hello', '254712345678')
    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('wa.me/254712345678'),
      '_blank'
    )
    openSpy.mockRestore()
  })
})
