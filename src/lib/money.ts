/**
 * @module money
 * @description Safe KES arithmetic utilities for Daftari.
 *
 * Kenya Shilling amounts are stored and manipulated as integers (whole shillings).
 * All arithmetic uses Math.round to eliminate floating-point drift.
 * Display formatting is always separated from arithmetic.
 *
 * ADR Reference: docs/adr/ADR-007-money-arithmetic.md
 */

/** Branded type — prevents mixing raw numbers with KES amounts accidentally */
export type KES = number & { readonly __brand: 'KES' }

/** Construct a KES value from any number. Rounds to nearest shilling. */
export const kes = (amount: number): KES =>
  Math.round(amount) as KES

/** Add two KES amounts safely */
export const kesAdd = (a: KES, b: KES): KES =>
  kes(a + b)

/** Subtract b from a */
export const kesSubtract = (a: KES, b: KES): KES =>
  kes(a - b)

/** Sum an array of KES amounts */
export const kesSum = (amounts: KES[]): KES =>
  amounts.reduce((acc, val) => kesAdd(acc, val), kes(0))

/** Format for display: "KES 1,250" */
export const formatKES = (amount: KES): string =>
  `KES ${amount.toLocaleString('en-KE')}`

/** Format compact: "1,250" (no currency prefix) */
export const formatKESCompact = (amount: KES): string =>
  amount.toLocaleString('en-KE')

/** Parse a raw amount from user input. Returns null if invalid. */
export const parseKESInput = (raw: string): KES | null => {
  const cleaned = raw.replace(/[,\s]/g, '')
  const parsed = parseFloat(cleaned)
  if (isNaN(parsed) || parsed < 0) return null
  return kes(parsed)
}

/** True if amount is positive profit */
export const isProfit = (amount: KES): boolean => amount > 0

/** True if amount is a loss */
export const isLoss = (amount: KES): boolean => amount < 0

/** Zero amount constant */
export const KES_ZERO: KES = kes(0)
