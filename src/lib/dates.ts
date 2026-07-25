/**
 * @module dates
 * @description Cached Nairobi timezone utilities.
 * The Intl.DateTimeFormat is expensive to create (~91ms in prod traces).
 * We use a simple UTC+3 offset since Africa/Nairobi has no DST.
 */

const NAIROBI_OFFSET_MS = 3 * 60 * 60 * 1000

/** Get a Date object representing the current instant in Nairobi time */
export function nowInNairobi(): Date {
  return new Date(Date.now() + NAIROBI_OFFSET_MS)
}

/** Get today's date string in YYYY-MM-DD format (Nairobi time) */
export function todayNairobi(): string {
  return nowInNairobi().toISOString().slice(0, 10)
}

/** Get the current hour in Nairobi time (0-23) */
export function nairobiHour(): number {
  return nowInNairobi().getUTCHours()
}

/** Get the current Nairobi ISO datetime string */
export function nairobiISO(): string {
  return nowInNairobi().toISOString()
}
