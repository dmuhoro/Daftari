/**
 * @module constants
 * @description Application-wide constants for Daftari.
 * Import from here. Never hardcode these values elsewhere.
 */

/** App metadata */
export const APP = {
  NAME:     'Daftari' as const,
  // Must match package.json "version" — sentry release + monitoring key off it.
  VERSION:  '6.5.0'  as const,
  LOCALE:   'en-KE'  as const,
  TIMEZONE: 'Africa/Nairobi' as const,
} as const

/** Supabase table names — never hardcode these strings in queries */
export const TABLES = {
  BUSINESSES:         'daftari_businesses'         as const,
  TRANSACTIONS:       'daftari_transactions'       as const,
  SYNC_QUEUE:         'daftari_sync_queue'         as const,
  CUSTOMERS:          'daftari_customers'          as const,
  DAILY_CLOSES:       'daftari_daily_closes'       as const,
  SUPPLIERS:          'daftari_suppliers'          as const,
  PURCHASE_ORDERS:    'daftari_purchase_orders'    as const,
  STOCK_ADJUSTMENTS:  'daftari_stock_adjustments'  as const,
  PUSH_SUBSCRIPTIONS: 'daftari_push_subscriptions' as const,
  ANALYTICS:          'daftari_analytics'          as const,
} as const

/** Dexie DB name and version */
export const DB = {
  NAME:    'DaftariDB' as const,
  VERSION: 7           as const,  // increment in db.ts when schema changes
} as const

/** LocalStorage keys — single place, prevents typos */
export const STORAGE_KEYS = {
  LANGUAGE:             'daftari-language'              as const,
  BUSINESS:             'daftari-business'              as const,
  LAST_CLOSE_DATE:      'daftari-last-close-date'       as const,
  CLOSE_DISMISSED_AT:   'daftari-close-dismissed-at'    as const,
  THEME:                'daftari-theme'                 as const,
} as const

/** Daily close prompt timing */
export const DAILY_CLOSE = {
  TRIGGER_HOUR_EAT:  20,          // 8pm East Africa Time
  DISMISS_DURATION:  2 * 60 * 60 * 1000,  // 2 hours in ms
} as const

/** Sync queue behaviour */
export const SYNC = {
  MAX_RETRY_COUNT:  5,
  RETRY_BACKOFF_MS: 5000,
} as const

/** Fuliza alert threshold — show alert when debt > this % of today's revenue */
export const FULIZA = {
  ALERT_THRESHOLD_PERCENT: 20,
} as const

/** Validation constraints */
export const VALIDATION = {
  BUSINESS_NAME_MIN:    2,
  BUSINESS_NAME_MAX:    80,
  DESCRIPTION_MAX:      200,
  AMOUNT_MIN:           1,
  AMOUNT_MAX:           999_999,
} as const

/** Transaction category keys — used across feature files */
export const INCOME_CATEGORIES = [
  'product_sale',
  'service',
  'bulk_order',
  'mpesa',
  'other',
] as const

export type IncomeCategoryKey = typeof INCOME_CATEGORIES[number]
