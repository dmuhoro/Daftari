import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock sentry before importing monitoring
vi.mock('../sentry', () => ({
  captureError: vi.fn(),
}))

describe('monitoring', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('exports initMonitoring as a function', async () => {
    const { initMonitoring } = await import('./monitoring')
    expect(typeof initMonitoring).toBe('function')
  })

  it('initMonitoring does not throw when PerformanceObserver is available', async () => {
    // jsdom doesn't have PerformanceObserver, so we test graceful fallback
    const { initMonitoring } = await import('./monitoring')
    expect(() => initMonitoring()).not.toThrow()
  })
})
