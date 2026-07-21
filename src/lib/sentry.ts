import * as Sentry from '@sentry/react'
import { APP } from './constants'

const DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined

export const initSentry = (): void => {
  if (!DSN) {
    if (import.meta.env.DEV) {
      console.info('[Daftari] Sentry disabled — VITE_SENTRY_DSN not set')
    }
    return
  }

  Sentry.init({
    dsn: DSN,
    release: `daftari@${APP.VERSION}`,
    environment: import.meta.env.MODE,
    tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,

    beforeSend(event) {
      if (event.user) {
        delete event.user.email
        delete event.user.username
        delete event.user.ip_address
      }

      return event
    },

    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Network request failed',
      'Failed to fetch',
      'Load failed',
    ],
  })
}

export const captureError = (
  error: unknown,
  context: { feature: string; action: string }
): void => {
  if (!DSN) return
  Sentry.withScope(scope => {
    scope.setTag('feature', context.feature)
    scope.setTag('action', context.action)
    Sentry.captureException(error)
  })
}

export const captureBreadcrumb = (
  message: string,
  category?: string,
  data?: Record<string, unknown>
): void => {
  if (!DSN) return
  Sentry.addBreadcrumb({
    message,
    category: category ?? 'app',
    data,
    level: 'info' as Sentry.SeverityLevel,
  })
}

export const setSentryUser = (userId: string): void => {
  if (!DSN) return
  Sentry.setUser({ id: userId })
}

export const clearSentryUser = (): void => {
  if (!DSN) return
  Sentry.setUser(null)
}
