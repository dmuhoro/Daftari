/**
 * @module types
 * @description Core domain types for Daftari.
 * All shared interfaces, branded IDs, and discriminated unions live here.
 */

// ─── Branded ID Types ──────────────────────────────────────────────────────
// Prevents mixing up different ID types at compile time.

export type Brand<T, B extends string> = T & { readonly __brand: B }
export type TransactionId  = Brand<string, 'TransactionId'>
export type BusinessId     = Brand<string, 'BusinessId'>
export type UserId         = Brand<string, 'UserId'>
export type LocalId        = Brand<string, 'LocalId'>

/** Create a branded LocalId from a raw string */
export const asLocalId = (s: string): LocalId => s as LocalId

// ─── Result Type ──────────────────────────────────────────────────────────
// All async operations in Daftari return Result<T, AppError> instead of throwing.
// This makes error paths explicit and type-checked.

export type Ok<T>  = { readonly ok: true;  readonly value: T }
export type Err<E> = { readonly ok: false; readonly error: E }
export type Result<T, E = AppError> = Ok<T> | Err<E>

export const ok  = <T>(value: T): Ok<T>  => ({ ok: true,  value })
export const err = <E>(error: E): Err<E> => ({ ok: false, error })

// ─── Error Types ──────────────────────────────────────────────────────────

export type AppErrorCode =
  | 'DEXIE_WRITE_FAILED'
  | 'DEXIE_READ_FAILED'
  | 'SUPABASE_UPSERT_FAILED'
  | 'SUPABASE_AUTH_FAILED'
  | 'SMS_PARSE_FAILED'
  | 'VALIDATION_ERROR'
  | 'BUSINESS_NOT_FOUND'
  | 'SYNC_QUEUE_FLUSH_FAILED'
  | 'UNKNOWN_ERROR'

export interface AppError {
  readonly code: AppErrorCode
  readonly message: string
  readonly cause?: unknown
}

export const appError = (
  code: AppErrorCode,
  message: string,
  cause?: unknown
): AppError => ({ code, message, cause })

// ─── Transaction Types ────────────────────────────────────────────────────

export type TransactionType =
  | 'income'
  | 'expense'
  | 'withdrawal'
  | 'debt_taken'
  | 'debt_repaid'

export type TransactionSource =
  | 'manual'
  | 'sms'
  | 'daraja'    // reserved — not built yet

export type PaymentMethod =
  | 'cash'
  | 'mpesa_send_money'
  | 'pochi_la_biashara'
  | 'till_number'
  | 'paybill'
  | 'airtel_money'
  | 'bank_transfer'
  | 'card_pos'

// ─── Business Types ───────────────────────────────────────────────────────

export type BusinessCategoryKey =
  | 'food_beverage'
  | 'retail'
  | 'jua_kali'
  | 'agriculture'
  | 'services'
  | 'transport'
  | 'professional'

export interface Product {
  readonly id: string
  readonly name: string
  readonly price: number
  readonly unit?: string
  readonly stock?: number
  readonly low_stock_threshold?: number
}

export interface Business {
  readonly id?: number
  readonly owner_id: string
  readonly name: string
  readonly type: string            // legacy field, keep for compat
  readonly category?: BusinessCategoryKey
  readonly subcategory?: string
  readonly payment_methods: PaymentMethod[]
  readonly products: Product[]
  readonly currency: 'KES'
  readonly language: 'sw' | 'en'
}

// ─── Sync Types ───────────────────────────────────────────────────────────

export type SyncOperation = 'insert' | 'update' | 'delete'

export interface SyncQueueEntry {
  readonly id?: number
  readonly operation: SyncOperation
  readonly table_name: string
  readonly payload: Record<string, unknown>
  readonly synced: 0 | 1
  readonly retry_count: number
  readonly created_at: string
}

// ─── i18n Types ───────────────────────────────────────────────────────────

export type Language = 'sw' | 'en'
export type Theme = 'light' | 'dark' | 'system'

export interface I18nString {
  readonly sw: string
  readonly en: string
}
