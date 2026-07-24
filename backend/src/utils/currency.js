/**
 * Round a monetary value to the specified number of decimal places.
 * Eliminates floating-point artifacts like 4.039000000000001.
 *
 * @param {number} value  — The raw calculation result
 * @param {number} [decimals=2] — Number of decimal places (default 2 for most currencies)
 * @returns {number}
 */
export function roundCurrency(value, decimals = 2) {
  const mult = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * mult) / mult;
}

/**
 * Round and format a monetary value for display.
 *
 * @param {number} value
 * @param {number} [decimals=2]
 * @returns {string}
 */
export function formatCurrency(value, decimals = 2) {
  const num = Number(value) || 0;
  return roundCurrency(num, decimals).toFixed(decimals);
}
