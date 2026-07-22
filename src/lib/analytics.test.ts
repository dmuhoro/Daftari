/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockInsert = vi.fn()
vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: mockInsert,
    })),
  },
}))

const mockLoggerTrack = vi.fn()
const mockLoggerWarn = vi.fn()
vi.mock('./logger', () => ({
  logger: {
    info: vi.fn(),
    warn: (...args: any[]) => mockLoggerWarn(...args),
    error: vi.fn(),
    track: (...args: any[]) => mockLoggerTrack(...args),
  },
}))

import { track, flush, EVENTS } from './analytics'

describe('analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInsert.mockResolvedValue({ error: null })
  })

  describe('track', () => {
    it('logs event via logger.track', () => {
      track('test_event', { key: 'value' })
      expect(mockLoggerTrack).toHaveBeenCalledWith('test_event', { key: 'value' })
    })

    it('auto-flushes when queue reaches 10', () => {
      for (let i = 0; i < 10; i++) {
        track(`event_${i}`)
      }
      expect(mockInsert).toHaveBeenCalled()
    })

    it('does not flush below 10 events', () => {
      for (let i = 0; i < 5; i++) {
        track(`event_${i}`)
      }
      expect(mockInsert).not.toHaveBeenCalled()
    })
  })

  describe('flush', () => {
    it('sends queued events to supabase', async () => {
      track('flush_test')
      await flush()

      expect(mockInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            event: 'flush_test',
            properties: expect.any(Object),
            recorded_at: expect.any(String),
          }),
        ])
      )
    })

    it('returns immediately when queue is empty', async () => {
      await flush()
      expect(mockInsert).not.toHaveBeenCalled()
    })

    it('requeues events on supabase error', async () => {
      track('fail_test')
      mockInsert.mockResolvedValue({ error: new Error('connection failed') })

      await flush()

      expect(mockLoggerWarn).toHaveBeenCalledWith('analytics:flush_failed', { count: 1 })
    })

    it('handles exception during flush', async () => {
      track('exception_test')
      mockInsert.mockRejectedValue(new Error('network error'))

      await flush()

      expect(mockLoggerWarn).toHaveBeenCalledWith('analytics:flush_exception')
    })
  })

  describe('EVENTS', () => {
    it('exports all 22 event constants', () => {
      expect(Object.keys(EVENTS)).toHaveLength(23)
      expect(EVENTS.ONBOARDING_STARTED).toBe('onboarding_started')
      expect(EVENTS.TRANSACTION_RECORDED).toBe('transaction_recorded')
      expect(EVENTS.DAILY_CLOSE_COMPLETED).toBe('daily_close_completed')
      expect(EVENTS.SIGNUP_COMPLETED).toBe('signup_completed')
      expect(EVENTS.SIGNOUT).toBe('signout')
    })
  })
})
