/**
 * Safely round a value to remove floating-point artifacts.
 * Use after any arithmetic before rendering.
 *
 * @example
 *   roundCurrency(4.039000000000001)  // → 4.039
 *   roundCurrency(19.9999999997)      // → 20
 *   roundCurrency(12.00000000002)     // → 12
 */
export function roundCurrency(value: number, decimals: number = 3): number {
  const mult = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * mult) / mult;
}

/**
 * Format a price/amount for display, guaranteed no floating-point artifacts.
 *
 * - Converts to Number
 * - Rounds to remove FP garbage
 * - Returns locale-formatted string with exactly `decimals` fraction digits
 *
 * For BDT (non-crypto) use decimals=2 or 3 as needed.
 * For crypto/USD use decimals=2.
 */
export function formatPrice(value: number | string | undefined | null, decimals: number = 3): string {
  const num = Number(value) || 0;
  const rounded = roundCurrency(num, decimals);
  return rounded.toFixed(decimals);
}

/**
 * Format a unit price (per-1000 SMM rate) — same as formatPrice but
 * always uses 3 decimal places since SMM rates are often fractional.
 */
export function formatUnitPrice(value: number | string | undefined | null): string {
  return formatPrice(value, 3);
}
