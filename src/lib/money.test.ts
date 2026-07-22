import { describe, it, expect } from 'vitest'
import {
  cents, toKES, kesAdd, kesSubtract, kesSum,
  formatKES, formatKESCompact, parseKESInput,
  isProfit, isLoss, KES_ZERO,
  type KES,
} from './money'

describe('cents()', () => {
  it('rounds to nearest integer', () => {
    expect(cents(12.6)).toBe(13)
    expect(cents(12.4)).toBe(12)
    expect(cents(12.5)).toBe(13)
  })
  it('handles zero', () => expect(cents(0)).toBe(0))
  it('handles negative amounts', () => expect(cents(-50.7)).toBe(-51))
})

describe('toKES()', () => {
  it('creates a KES branded value', () => {
    const amount = toKES(1500)
    expect(amount).toBe(1500)
  })
  it('rounds to integer', () => {
    expect(toKES(15.7)).toBe(16)
  })
})

describe('kesAdd()', () => {
  it('adds two KES amounts', () => {
    const a = toKES(500)
    const b = toKES(300)
    expect(kesAdd(a, b)).toBe(800)
  })
  it('handles zero', () => {
    expect(kesAdd(KES_ZERO, toKES(100))).toBe(100)
  })
})

describe('kesSubtract()', () => {
  it('subtracts two KES amounts', () => {
    const result = kesSubtract(toKES(500), toKES(200))
    expect(result).toBe(300)
  })
  it('can produce negative results', () => {
    expect(kesSubtract(toKES(100), toKES(300))).toBe(-200)
  })
})

describe('kesSum()', () => {
  it('sums an array of KES amounts', () => {
    const amounts: KES[] = [toKES(100), toKES(200), toKES(300)]
    expect(kesSum(amounts)).toBe(600)
  })
  it('returns KES_ZERO for empty array', () => {
    expect(kesSum([])).toBe(0)
  })
})

describe('formatKES()', () => {
  it('formats with KES prefix and commas', () => {
    expect(formatKES(toKES(1500))).toBe('KES 1,500')
  })
  it('formats zero', () => {
    expect(formatKES(KES_ZERO)).toBe('KES 0')
  })
  it('formats large numbers', () => {
    expect(formatKES(toKES(100000))).toBe('KES 100,000')
  })
})

describe('formatKESCompact()', () => {
  it('formats thousands as k', () => {
    expect(formatKESCompact(toKES(1500))).toBe('KES 1.5k')
  })
  it('formats millions as M', () => {
    expect(formatKESCompact(toKES(2500000))).toBe('KES 2.5M')
  })
  it('formats small amounts normally', () => {
    expect(formatKESCompact(toKES(500))).toBe('KES 500')
  })
})

describe('parseKESInput()', () => {
  it('parses a valid number', () => {
    expect(parseKESInput('1500')).toBe(1500)
  })
  it('strips currency symbols', () => {
    expect(parseKESInput('KES 1,500')).toBe(1500)
  })
  it('returns null for empty string', () => {
    expect(parseKESInput('')).toBeNull()
  })
  it('returns null for non-numeric', () => {
    expect(parseKESInput('abc')).toBeNull()
  })
  it('returns null for negative', () => {
    expect(parseKESInput('-100')).toBeNull()
  })
  it('handles decimals', () => {
    expect(parseKESInput('15.5')).toBe(16)
  })
})

describe('isProfit()', () => {
  it('returns true for positive amounts', () => {
    expect(isProfit(toKES(500))).toBe(true)
  })
  it('returns false for zero', () => {
    expect(isProfit(KES_ZERO)).toBe(false)
  })
  it('returns false for negative', () => {
    expect(isProfit(toKES(-100))).toBe(false)
  })
})

describe('isLoss()', () => {
  it('returns true for negative amounts', () => {
    expect(isLoss(toKES(-100))).toBe(true)
  })
  it('returns false for zero', () => {
    expect(isLoss(KES_ZERO)).toBe(false)
  })
  it('returns false for positive', () => {
    expect(isLoss(toKES(500))).toBe(false)
  })
})

describe('KES_ZERO', () => {
  it('is zero', () => {
    expect(KES_ZERO).toBe(0)
  })
})
