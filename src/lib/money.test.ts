import { describe, it, expect } from 'vitest'
import {
  kes, kesAdd, kesSubtract, kesSum,
  formatKES, parseKESInput,
  isProfit, isLoss, KES_ZERO,
} from './money'

describe('kes()', () => {
  it('rounds to nearest shilling', () => {
    expect(kes(12.6)).toBe(13)
    expect(kes(12.4)).toBe(12)
    expect(kes(12.5)).toBe(13)
  })
  it('handles zero', () => expect(kes(0)).toBe(0))
  it('handles negative amounts', () => expect(kes(-50)).toBe(-50))
})

describe('kesAdd()', () => {
  it('adds two amounts correctly', () => {
    expect(kesAdd(kes(100), kes(50))).toBe(150)
  })
  it('handles zero', () => {
    expect(kesAdd(kes(200), KES_ZERO)).toBe(200)
  })
})

describe('kesSubtract()', () => {
  it('subtracts correctly', () => {
    expect(kesSubtract(kes(500), kes(200))).toBe(300)
  })
  it('can produce negative result (loss)', () => {
    expect(kesSubtract(kes(100), kes(300))).toBe(-200)
  })
})

describe('kesSum()', () => {
  it('sums an array of amounts', () => {
    expect(kesSum([kes(100), kes(200), kes(50)])).toBe(350)
  })
  it('returns zero for empty array', () => {
    expect(kesSum([])).toBe(0)
  })
})

describe('formatKES()', () => {
  it('formats with KES prefix', () => {
    expect(formatKES(kes(1250))).toBe('KES 1,250')
  })
  it('formats zero', () => {
    expect(formatKES(KES_ZERO)).toBe('KES 0')
  })
})

describe('parseKESInput()', () => {
  it('parses clean number string', () => {
    expect(parseKESInput('500')).toBe(500)
  })
  it('parses number with commas', () => {
    expect(parseKESInput('1,500')).toBe(1500)
  })
  it('returns null for non-numeric input', () => {
    expect(parseKESInput('abc')).toBeNull()
  })
  it('returns null for negative input', () => {
    expect(parseKESInput('-100')).toBeNull()
  })
  it('returns null for empty string', () => {
    expect(parseKESInput('')).toBeNull()
  })
})

describe('isProfit / isLoss', () => {
  it('correctly identifies profit', () => {
    expect(isProfit(kes(100))).toBe(true)
    expect(isProfit(KES_ZERO)).toBe(false)
  })
  it('correctly identifies loss', () => {
    expect(isLoss(kes(-50))).toBe(true)
    expect(isLoss(KES_ZERO)).toBe(false)
  })
})
