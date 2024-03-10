import queryCurve, { queryEncodedCurve } from '@query-curve/query';

/**
 * A custom Google Sheets function that wraps the queryCurve function.
 *
 * @param {number} value The first value from a cell, representing the x value.
 * @param {string} curve The second value from a cell, representing the curve.
 * @return The result from the queryCurve function.
 * @customfunction
 */
globalThis.QUERYCURVE = (value: number | string, curve: string): number | null => {
  // Assuming your compiled queryCurve function is available in the global scope
  // and it is synchronous or you have adapted it to work synchronously in this context.
  return queryEncodedCurve(curve, typeof value === 'string' ? parseFloat(value) : value);
}
