import { describe, it, expect } from 'vitest'
import { cents } from './money'

describe('cents()', () => {
  it('rounds to nearest integer', () => {
    expect(cents(12.6)).toBe(13)
    expect(cents(12.4)).toBe(12)
    expect(cents(12.5)).toBe(13)
  })
  it('handles zero', () => expect(cents(0)).toBe(0))
  it('handles negative amounts', () => expect(cents(-50.7)).toBe(-51))
})
