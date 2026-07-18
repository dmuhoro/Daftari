/**
 * @module logger
 * @description Structured logger for Daftari.
 *
 * In development: logs to console with [Daftari] prefix and event name.
 * In production: suppresses info/warn, sends errors to error tracking if configured.
 *
 * Usage:
 *   logger.info('sync:flush_started', { queueSize: 3 })
 *   logger.error('dexie:write_failed', error, { local_id: '...' })
 *   logger.warn('sms:parse_fallback_used', { rawLength: 120 })
 */

type LogData = Record<string, unknown>

const isDev = import.meta.env.DEV

const formatEvent = (event: string): string => `[Daftari] ${event}`

export const logger = {
  /**
   * Log an informational event. Silent in production.
   * Use for: sync events, navigation, user actions, feature usage.
   */
  info: (event: string, data?: LogData): void => {
    if (isDev) {
      console.info(formatEvent(event), data ?? '')
    }
  },

  /**
   * Log a warning. Silent in production.
   * Use for: degraded state, fallback behaviour, recoverable issues.
   */
  warn: (event: string, data?: LogData): void => {
    if (isDev) {
      console.warn(formatEvent(event), data ?? '')
    }
  },

  /**
   * Log an error. Always fires — add production error tracking here.
   * NEVER include PII, user data, or financial amounts in error logs.
   * Safe to log: error codes, component names, operation names, counts.
   * Unsafe to log: names, phone numbers, amounts, business names.
   */
  error: (event: string, cause: unknown, data?: LogData): void => {
    const safeError = cause instanceof Error
      ? { name: cause.name, message: cause.message }
      : { raw: String(cause) }

    if (isDev) {
      console.error(formatEvent(event), { ...safeError, ...data })
    }

    // Production error tracking integration point:
    // errorTracker.captureException(cause, { extra: { event, ...data } })
  },

  /**
   * Log a user action for analytics. Silent in production unless analytics configured.
   * Keep event names as 'noun:verb' format: 'transaction:recorded', 'sync:completed'
   */
  track: (event: string, data?: LogData): void => {
    if (isDev) {
      console.debug(formatEvent(`track:${event}`), data ?? '')
    }
    // Analytics integration point:
    // analytics.track(event, data)
  },
} as const
