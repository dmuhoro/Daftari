/** Safe integer: rounds to nearest whole number. Prevents floating-point drift in KES arithmetic. */
export const cents = (amount: number): number => Math.round(amount)
