import { describe, it, expect } from 'vitest'
import { calculateProfit, calculateFulizaDebt, calculateWeeklyProfits } from './repository'
import { kes } from './money'
import type { Transaction } from './types'
import { asLocalId } from './types'

const makeTransaction = (
  type: Transaction['type'],
  amount: number,
  recorded_at = new Date().toISOString()
): Transaction => ({
  local_id:    asLocalId(crypto.randomUUID()),
  type,
  amount:      kes(amount),
  category:    'test',
  source:      'manual',
  payment_method: 'cash',
  recorded_at,
  synced:      0,
})

describe('calculateProfit()', () => {
  it('returns zero for empty array', () => {
    expect(calculateProfit([])).toBe(0)
  })

  it('subtracts expenses from income', () => {
    const txs = [
      makeTransaction('income', 500),
      makeTransaction('expense', 200),
    ]
    expect(calculateProfit(txs)).toBe(300)
  })

  it('treats withdrawals as outflow', () => {
    const txs = [
      makeTransaction('income', 1000),
      makeTransaction('withdrawal', 300),
    ]
    expect(calculateProfit(txs)).toBe(700)
  })

  it('handles pure loss scenario', () => {
    const txs = [
      makeTransaction('income', 100),
      makeTransaction('expense', 500),
    ]
    expect(calculateProfit(txs)).toBe(-400)
  })
})

describe('calculateFulizaDebt()', () => {
  it('returns net Fuliza outstanding', () => {
    const txs = [
      makeTransaction('debt_taken', 500),
      makeTransaction('debt_repaid', 200),
    ]
    expect(calculateFulizaDebt(txs)).toBe(300)
  })

  it('returns zero when fully repaid', () => {
    const txs = [
      makeTransaction('debt_taken', 500),
      makeTransaction('debt_repaid', 500),
    ]
    expect(calculateFulizaDebt(txs)).toBe(0)
  })

  it('returns zero with no Fuliza transactions', () => {
    expect(calculateFulizaDebt([])).toBe(0)
  })
})

describe('calculateWeeklyProfits()', () => {
  it('returns 7 entries', () => {
    expect(calculateWeeklyProfits([])).toHaveLength(7)
  })

  it('assigns profit to correct day', () => {
    const todayISO = new Date().toISOString()
    const txs = [makeTransaction('income', 800, todayISO)]
    const result = calculateWeeklyProfits(txs)
    const today = result[result.length - 1]
    expect(today.profit).toBe(800)
  })
})
