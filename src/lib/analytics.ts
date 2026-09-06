import { supabase } from './supabase'
import { logger } from './logger'
import { useStore } from './store'

interface AnalyticsEvent {
  event: string
  properties?: Record<string, string | number | boolean>
}

const queue: AnalyticsEvent[] = []

/**
 * Fail-closed telemetry: events never leave the device unless the user has
 * explicitly opted in (Settings → Privacy → "Share anonymous usage stats").
 * Consent is ON only while telemetryEnabled is true; when off, events are
 * still written to the local log but never buffered or sent.
 */
const telemetryEnabled = (): boolean => useStore.getState().telemetryEnabled

export const track = (
  event: string,
  properties?: Record<string, string | number | boolean>
): void => {
  logger.track(event, properties)

  if (!telemetryEnabled()) return

  queue.push({ event, properties })

  if (queue.length >= 10) {
    void flush()
  }
}

export const flush = async (): Promise<void> => {
  if (queue.length === 0) return
  if (!telemetryEnabled()) {
    // Fail closed — never push buffered events without consent.
    queue.length = 0
    return
  }
  const events = queue.splice(0, queue.length)

  try {
    const { error } = await supabase
      .from('daftari_analytics')
      .insert(events.map(e => ({
        event: e.event,
        properties: e.properties ?? {},
        recorded_at: new Date().toISOString(),
      })))

    if (error) {
      logger.warn('analytics:flush_failed', { count: events.length })
      if (queue.length < 50) queue.unshift(...events)
    }
  } catch {
    logger.warn('analytics:flush_exception')
  }
}

export const EVENTS = {
  ONBOARDING_STARTED:        'onboarding_started',
  ONBOARDING_COMPLETED:      'onboarding_completed',
  ONBOARDING_ABANDONED:      'onboarding_abandoned',
  TRANSACTION_RECORDED:      'transaction_recorded',
  SMS_PARSED:                'sms_parsed',
  SMS_PARSE_FAILED:          'sms_parse_failed',
  RECEIPT_VIEWED:            'receipt_viewed',
  WHATSAPP_SHARE_TAPPED:     'whatsapp_share_tapped',
  DAILY_SUMMARY_SHARED:      'daily_summary_shared',
  CUSTOMER_LIST_VIEWED:      'customer_list_viewed',
  CUSTOMER_DETAIL_VIEWED:    'customer_detail_viewed',
  LOW_STOCK_ALERT_SHOWN:     'low_stock_alert_shown',
  RESTOCK_RECORDED:          'restock_recorded',
  DAILY_CLOSE_COMPLETED:     'daily_close_completed',
  DAILY_CLOSE_DISMISSED:     'daily_close_dismissed',
  STREAK_MILESTONE:          'streak_milestone',
  SIGNUP_COMPLETED:          'signup_completed',
  SIGNIN_COMPLETED:          'signin_completed',
  PASSWORD_RESET_REQUESTED:  'password_reset_requested',
  SIGNOUT:                   'signout',
  FEEDBACK_SUBMITTED:        'feedback_submitted',
  REFERRAL_LINK_SHARED:      'referral_link_shared',
  REFERRAL_SIGNUP_COMPLETED: 'referral_signup_completed',
} as const
