/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockInit = vi.fn()
const mockCaptureException = vi.fn()
const mockWithScope = vi.fn()
const mockAddBreadcrumb = vi.fn()
const mockSetUser = vi.fn()

vi.mock('@sentry/react', () => ({
  init: (...args: any[]) => mockInit(...args),
  captureException: (...args: any[]) => mockCaptureException(...args),
  withScope: (...args: any[]) => mockWithScope(...args),
  addBreadcrumb: (...args: any[]) => mockAddBreadcrumb(...args),
  setUser: (...args: any[]) => mockSetUser(...args),
}))

async function loadWithDSN(dsn: string | undefined) {
  vi.stubEnv('VITE_SENTRY_DSN', dsn ?? '')
  vi.resetModules()
  return await import('./sentry')
}

async function loadWithoutDSN() {
  return loadWithDSN(undefined)
}

async function loadWithDSNValue() {
  return loadWithDSN('https://dsn@sentry.io/123')
}

describe('sentry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initSentry', () => {
    it('does not call Sentry.init when DSN is not set', async () => {
      const { initSentry } = await loadWithoutDSN()
      initSentry()
      expect(mockInit).not.toHaveBeenCalled()
    })

    it('calls Sentry.init when DSN is set', async () => {
      const { initSentry } = await loadWithDSNValue()
      initSentry()
      expect(mockInit).toHaveBeenCalledWith(
        expect.objectContaining({ dsn: 'https://dsn@sentry.io/123' })
      )
    })

    it('strips user email, username, ip_address in beforeSend', async () => {
      const { initSentry } = await loadWithDSNValue()
      initSentry()

      const beforeSend = mockInit.mock.calls[0][0].beforeSend
      const event = {
        user: { email: 'test@example.com', username: 'testuser', ip_address: '1.2.3.4' },
      }
      const result = beforeSend(event)
      expect(result.user).toEqual({})
      expect(result.user.email).toBeUndefined()
      expect(result.user.username).toBeUndefined()
      expect(result.user.ip_address).toBeUndefined()
    })

    it('passes through events without user', async () => {
      const { initSentry } = await loadWithDSNValue()
      initSentry()

      const beforeSend = mockInit.mock.calls[0][0].beforeSend
      const event = { message: 'test' }
      const result = beforeSend(event)
      expect(result).toEqual({ message: 'test' })
    })

    it('includes ignoreErrors list', async () => {
      const { initSentry } = await loadWithDSNValue()
      initSentry()

      expect(mockInit).toHaveBeenCalledWith(
        expect.objectContaining({
          ignoreErrors: expect.arrayContaining([
            'ResizeObserver loop limit exceeded',
            'Network request failed',
          ]),
        })
      )
    })
  })

  describe('captureError', () => {
    it('does nothing when DSN is not set', async () => {
      const { captureError } = await loadWithoutDSN()
      captureError(new Error('test'), { feature: 'sync', action: 'flush' })
      expect(mockWithScope).not.toHaveBeenCalled()
    })

    it('calls Sentry.withScope when DSN is set', async () => {
      mockWithScope.mockImplementation((cb: any) => cb({ setTag: vi.fn() }))
      const { captureError } = await loadWithDSNValue()
      captureError(new Error('test'), { feature: 'sync', action: 'flush' })
      expect(mockWithScope).toHaveBeenCalled()
    })

    it('sets feature and action tags', async () => {
      const mockSetTag = vi.fn()
      mockWithScope.mockImplementation((cb: any) => cb({ setTag: mockSetTag }))

      const { captureError } = await loadWithDSNValue()
      captureError(new Error('test'), { feature: 'analytics', action: 'track' })

      expect(mockSetTag).toHaveBeenCalledWith('feature', 'analytics')
      expect(mockSetTag).toHaveBeenCalledWith('action', 'track')
    })
  })

  describe('captureBreadcrumb', () => {
    it('does nothing when DSN is not set', async () => {
      const { captureBreadcrumb } = await loadWithoutDSN()
      captureBreadcrumb('test message', 'app', { key: 'value' })
      expect(mockAddBreadcrumb).not.toHaveBeenCalled()
    })

    it('adds breadcrumb when DSN is set', async () => {
      const { captureBreadcrumb } = await loadWithDSNValue()
      captureBreadcrumb('clicked button', 'ui', { element: 'save' })

      expect(mockAddBreadcrumb).toHaveBeenCalledWith({
        message: 'clicked button',
        category: 'ui',
        data: { element: 'save' },
        level: 'info',
      })
    })

    it('defaults category to "app" when not provided', async () => {
      const { captureBreadcrumb } = await loadWithDSNValue()
      captureBreadcrumb('navigation')

      expect(mockAddBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'app' })
      )
    })
  })

  describe('setSentryUser', () => {
    it('does nothing when DSN is not set', async () => {
      const { setSentryUser } = await loadWithoutDSN()
      setSentryUser('user-123')
      expect(mockSetUser).not.toHaveBeenCalled()
    })

    it('sets user when DSN is set', async () => {
      const { setSentryUser } = await loadWithDSNValue()
      setSentryUser('user-123')
      expect(mockSetUser).toHaveBeenCalledWith({ id: 'user-123' })
    })
  })

  describe('clearSentryUser', () => {
    it('does nothing when DSN is not set', async () => {
      const { clearSentryUser } = await loadWithoutDSN()
      clearSentryUser()
      expect(mockSetUser).not.toHaveBeenCalled()
    })

    it('clears user when DSN is set', async () => {
      const { clearSentryUser } = await loadWithDSNValue()
      clearSentryUser()
      expect(mockSetUser).toHaveBeenCalledWith(null)
    })
  })
})
