import { describe, it, expect } from 'vitest'
import { transactionsToCSV } from './csv'
import type { Transaction } from './db'

const makeTx = (overrides: Partial<Transaction> = {}): Transaction => ({
  local_id: 'tx-1',
  type: 'income',
  amount: 500,
  category: 'sales',
  source: 'manual',
  recorded_at: '2024-06-15T10:30:00.000Z',
  synced: 0,
  ...overrides,
})

describe('transactionsToCSV()', () => {
  it('returns headers only for empty array', () => {
    const csv = transactionsToCSV([])
    const lines = csv.split('\n')
    expect(lines).toHaveLength(1)
    expect(lines[0]).toContain('Receipt ID')
    expect(lines[0]).toContain('Type')
    expect(lines[0]).toContain('Amount (KES)')
  })

  it('converts a single transaction to CSV row', () => {
    const tx = makeTx({ receipt_id: 'RCP-001', description: 'Unga sale' })
    const csv = transactionsToCSV([tx])
    const lines = csv.split('\n')
    expect(lines).toHaveLength(2)
    expect(lines[1]).toContain('RCP-001')
    expect(lines[1]).toContain('income')
    expect(lines[1]).toContain('500')
    expect(lines[1]).toContain('Unga sale')
  })

  it('escapes commas in description', () => {
    const tx = makeTx({ description: 'Unga, Mgongo' })
    const csv = transactionsToCSV([tx])
    expect(csv).toContain('"Unga, Mgongo"')
  })

  it('escapes double quotes in description', () => {
    const tx = makeTx({ description: 'Say "hello"' })
    const csv = transactionsToCSV([tx])
    expect(csv).toContain('"Say ""hello"""')
  })

  it('extracts date and time from recorded_at', () => {
    const tx = makeTx({ recorded_at: '2024-06-15T14:30:00.000Z' })
    const csv = transactionsToCSV([tx])
    const lines = csv.split('\n')
    const row = lines[1]
    expect(row).toContain('2024-06-15')
    expect(row).toContain('14:30')
  })

  it('includes payment_method, mpesa_code, mpesa_sender when present', () => {
    const tx = makeTx({
      payment_method: 'mpesa_send_money',
      mpesa_code: 'QHK12345',
      mpesa_sender: 'John Doe',
    })
    const csv = transactionsToCSV([tx])
    expect(csv).toContain('mpesa_send_money')
    expect(csv).toContain('QHK12345')
    expect(csv).toContain('John Doe')
  })

  it('omits optional fields when not present', () => {
    const tx = makeTx()
    const csv = transactionsToCSV([tx])
    const lines = csv.split('\n')
    const row = lines[1]
    // receipt_id, type, category, amount, description (empty), date, time, payment_method (empty), mpesa_code (empty), mpesa_sender (empty), recorded_at
    const cols = row.split(',')
    expect(cols[0]).toBe('') // no receipt_id
    expect(cols[7]).toBe('') // no payment_method
  })
})
