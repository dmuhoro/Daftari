import { describe, it, expect, vi, afterEach } from 'vitest'
import { nowInNairobi, todayNairobi, nairobiHour, nairobiISO } from './dates'

describe('dates', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('todayNairobi returns YYYY-MM-DD format', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-07-15T10:00:00Z'))
    const result = todayNairobi()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('nowInNairobi returns a Date', () => {
    const d = nowInNairobi()
    expect(d).toBeInstanceOf(Date)
  })

  it('nairobiHour returns a number between 0-23', () => {
    const h = nairobiHour()
    expect(h).toBeGreaterThanOrEqual(0)
    expect(h).toBeLessThanOrEqual(23)
  })

  it('nairobiISO returns an ISO string', () => {
    const iso = nairobiISO()
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
  })

  it('todayNairobi accounts for UTC+3 offset', () => {
    vi.useFakeTimers()
    // 2025-07-14T22:00:00Z = 2025-07-15 01:00 NAIROBI (next day)
    vi.setSystemTime(new Date('2025-07-14T22:00:00Z'))
    expect(todayNairobi()).toBe('2025-07-15')
  })

  it('todayNairobi wraps midnight boundary correctly', () => {
    vi.useFakeTimers()
    // 2025-07-15T00:59:59Z = 2025-07-15 03:59:59 NAIROBI (same day)
    vi.setSystemTime(new Date('2025-07-15T00:59:59Z'))
    expect(todayNairobi()).toBe('2025-07-15')
  })

  it('nairobiHour reflects UTC+3 offset', () => {
    vi.useFakeTimers()
    // 2025-07-15T08:00:00Z = 11:00 in Nairobi (UTC+3)
    vi.setSystemTime(new Date('2025-07-15T08:00:00Z'))
    expect(nairobiHour()).toBe(11)
  })

  it('nairobiHour wraps midnight correctly', () => {
    vi.useFakeTimers()
    // 2025-07-15T22:00:00Z = 2025-07-16 01:00 NAIROBI
    vi.setSystemTime(new Date('2025-07-15T22:00:00Z'))
    expect(nairobiHour()).toBe(1)
  })
})
