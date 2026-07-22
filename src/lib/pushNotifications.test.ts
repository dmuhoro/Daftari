/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./repository', () => ({
  upsertPushSubscription: vi.fn().mockResolvedValue({ ok: true }),
  deletePushSubscription: vi.fn().mockResolvedValue({ ok: true }),
}))

vi.mock('./logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

describe('pushNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('requestNotificationPermission', () => {
    it('returns false when Notification API is not available', async () => {
      const original = (window as any).Notification
      delete (window as any).Notification
      const { requestNotificationPermission } = await import('./pushNotifications')
      const result = await requestNotificationPermission()
      expect(result).toBe(false)
      ;(window as any).Notification = original
    })

    it('returns true when permission is granted', async () => {
      const mockRequestPermission = vi.fn().mockResolvedValue('granted')
      ;(window as any).Notification = { requestPermission: mockRequestPermission }
      const { requestNotificationPermission } = await import('./pushNotifications')
      const result = await requestNotificationPermission()
      expect(result).toBe(true)
    })

    it('returns false when permission is denied', async () => {
      const mockRequestPermission = vi.fn().mockResolvedValue('denied')
      ;(window as any).Notification = { requestPermission: mockRequestPermission }
      const { requestNotificationPermission } = await import('./pushNotifications')
      const result = await requestNotificationPermission()
      expect(result).toBe(false)
    })
  })

  describe('subscribeToPush', () => {
    it('returns null when serviceWorker is not available', async () => {
      const original = navigator.serviceWorker
      Object.defineProperty(navigator, 'serviceWorker', { value: undefined, configurable: true })
      const { subscribeToPush } = await import('./pushNotifications')
      const result = await subscribeToPush()
      expect(result).toBeNull()
      Object.defineProperty(navigator, 'serviceWorker', { value: original, configurable: true })
    })

    it('returns null when PushManager is not available', async () => {
      const originalPushManager = (window as any).PushManager
      delete (window as any).PushManager
      const { subscribeToPush } = await import('./pushNotifications')
      const result = await subscribeToPush()
      expect(result).toBeNull()
      ;(window as any).PushManager = originalPushManager
    })

    it('returns existing subscription if already subscribed', async () => {
      const existingSub = { endpoint: 'https://existing' }
      const mockGetSubscription = vi.fn().mockResolvedValue(existingSub)
      const mockReady = Promise.resolve({ pushManager: { getSubscription: mockGetSubscription } })
      Object.defineProperty(navigator, 'serviceWorker', {
        value: { ready: mockReady },
        configurable: true,
      })

      const { subscribeToPush } = await import('./pushNotifications')
      const result = await subscribeToPush()
      expect(result).toBe(existingSub)
    })

    it('returns null when VAPID key is not set', async () => {
      const originalKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
      ;(import.meta.env as any).VITE_VAPID_PUBLIC_KEY = ''
      const mockGetSubscription = vi.fn().mockResolvedValue(null)
      const mockReady = Promise.resolve({ pushManager: { getSubscription: mockGetSubscription } })
      Object.defineProperty(navigator, 'serviceWorker', {
        value: { ready: mockReady },
        configurable: true,
      })

      const { subscribeToPush } = await import('./pushNotifications')
      const result = await subscribeToPush()
      expect(result).toBeNull()
      ;(import.meta.env as any).VITE_VAPID_PUBLIC_KEY = originalKey
    })

    it('returns null on error', async () => {
      const mockReady = Promise.reject(new Error('SW not ready'))
      Object.defineProperty(navigator, 'serviceWorker', {
        value: { ready: mockReady },
        configurable: true,
      })

      const { subscribeToPush } = await import('./pushNotifications')
      const result = await subscribeToPush()
      expect(result).toBeNull()
    })
  })

  describe('unsubscribeFromPush', () => {
    it('returns early when serviceWorker is not available', async () => {
      const original = navigator.serviceWorker
      Object.defineProperty(navigator, 'serviceWorker', { value: undefined, configurable: true })
      const { unsubscribeFromPush } = await import('./pushNotifications')
      await expect(unsubscribeFromPush()).resolves.toBeUndefined()
      Object.defineProperty(navigator, 'serviceWorker', { value: original, configurable: true })
    })

    it('returns early when no subscription exists', async () => {
      const mockGetSubscription = vi.fn().mockResolvedValue(null)
      const mockReady = Promise.resolve({ pushManager: { getSubscription: mockGetSubscription } })
      Object.defineProperty(navigator, 'serviceWorker', {
        value: { ready: mockReady },
        configurable: true,
      })

      const { unsubscribeFromPush } = await import('./pushNotifications')
      await expect(unsubscribeFromPush()).resolves.toBeUndefined()
    })

    it('returns early on error', async () => {
      const mockReady = Promise.reject(new Error('SW not ready'))
      Object.defineProperty(navigator, 'serviceWorker', {
        value: { ready: mockReady },
        configurable: true,
      })

      const { unsubscribeFromPush } = await import('./pushNotifications')
      await expect(unsubscribeFromPush()).resolves.toBeUndefined()
    })
  })
})
