/* global clearInterval, console, CustomFunctions, setInterval */
import { queryEncodedCurve } from '@query-curve/query';


/**
 * Queries a curve based on input values.
 * @customfunction QUERYCURVE
 * @param value Value to query for along the curve (i.e. the x value).
 * @param curve The encoded curve to query (generate at https://querycurve.com)
 * @returns Result of the query.
 */
export function QUERYCURVE(value: number | string, curve: string): number | null {
  if (typeof curve !== 'string') throw new Error('Curve must be a string');
  if (curve.length === 0) throw new Error('Curve cannot be empty');
  if (!curve.replace(/^/, '-').match(/^(?:--?[A-Za-z0-9]+){4,}$/)) throw new Error('Curve is not valid');
  return queryEncodedCurve(curve, typeof value === 'string' ? parseFloat(value) : value);
}
