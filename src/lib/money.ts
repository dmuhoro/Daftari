/**
 * @module money
 * @description Safe monetary arithmetic for KES.
 * All KES values flow through these functions.
 * Raw +, -, *, / on amount variables outside this file is a P0 bug.
 * All monetary values stored as integer cents (number).
 */

// ─── Branded KES Type ──────────────────────────────────────────────────────
// Prevents mixing KES amounts with raw numbers at compile time.

type Brand<T, B extends string> = T & { readonly __brand: B }
export type KES = Brand<number, 'KES'>

/** Zero KES constant */
export const KES_ZERO: KES = 0 as KES

// ─── Core Helpers ──────────────────────────────────────────────────────────

/** Safe integer: rounds to nearest whole number. Prevents floating-point drift in KES arithmetic. */
export const cents = (amount: number): number => Math.round(amount)

/** Create a KES branded value from a raw number */
export const toKES = (n: number): KES => Math.round(n) as KES

// ─── Safe Arithmetic ───────────────────────────────────────────────────────

/** Add two KES amounts safely */
export const kesAdd = (a: KES, b: KES): KES => (a + b) as KES

/** Subtract b from a safely */
export const kesSubtract = (a: KES, b: KES): KES => (a - b) as KES

/** Sum an array of KES amounts */
export const kesSum = (amounts: KES[]): KES =>
  amounts.reduce<number>((acc, v) => acc + v, 0) as KES

// ─── Formatting ────────────────────────────────────────────────────────────

/** Format as KES with commas: KES 1,500 */
export const formatKES = (amount: KES): string =>
  `KES ${Number(amount).toLocaleString('en-KE')}`

/** Compact format: KES 1.5k */
export const formatKESCompact = (amount: KES): string => {
  const abs = Math.abs(amount)
  if (abs >= 1_000_000) return `KES ${(amount / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `KES ${(amount / 1_000).toFixed(1)}k`
  return formatKES(amount as KES)
}

// ─── Parsing ───────────────────────────────────────────────────────────────

/** Parse a user-entered KES string. Returns null if invalid. */
export const parseKESInput = (input: string): KES | null => {
  const cleaned = input.replace(/[^0-9.-]/g, '')
  if (cleaned === '' || cleaned === '-') return null
  const num = parseFloat(cleaned)
  if (isNaN(num) || num < 0) return null
  return Math.round(num) as KES
}

// ─── Business Logic Helpers ────────────────────────────────────────────────

/** Is this a profit? (positive amount, income) */
export const isProfit = (amount: KES): boolean => amount > 0

/** Is this a loss? (negative amount or zero revenue vs expenses) */
export const isLoss = (amount: KES): boolean => amount < 0
