/**
 * Round a monetary value to the specified number of decimal places.
 * Eliminates floating-point artifacts like 4.039000000000001.
 */
export function roundCurrency(value: number, decimals = 2): number {
  const mult = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * mult) / mult;
}

/**
 * Round and format a monetary value for display.
 */
export function formatCurrency(value: number, decimals = 2): string {
  const num = Number(value) || 0;
  return roundCurrency(num, decimals).toFixed(decimals);
}
