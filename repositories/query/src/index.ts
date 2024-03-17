import { BezierChain, BezierSegment, Vector2, ScaledBezierChain, EncodedScaledBezierChain } from '@common/types';

import decode from '@common/utils/encoding/scaledBezierChain/decode';


/**
 * This function finds the y value for a given x value along a cubic Bezier curve.
 * @param curve The cubic Bezier curve, outputted from @query-curve/builder. First 4 elements are (scaleFactorX, scaleFactorY, offsetX, offsetY), rest are the points and handles.
 * @param scaledX The x value for which we will find the associated y value along the curve. This should reflect the value in the scaled & offset coordinate space.
 * @returns The y value for the given x value along the curve.
 */
export default function queryCurve(
  curve: ScaledBezierChain,
  scaledX: number,
) {
  // Because the first 4 items are the scale and offset factors, we need to skip them
  const first = 4;
  const last = curve.length - 1;

  if (!(curve[0] && curve[1])) throw new Error('Scale factors cannot be 0');
  const x = (scaledX / curve[0]) - curve[2]; // Bring back to internal coordinate space by dividing by x scale factor (0 index) and subtracting x offset (2 index)

  if (x < curve[first] || x > curve[last - 1]) return null;
  
  // If any point exactly matches the x value, return the scaled y value. This
  // is not just an optimization, but also reduces floating point errors. It's
  // also the case that values queried at key points, such as first and last,
  // are important to be exact.
  // TODO - This could be optimized by using a binary search
  // TODO - this could potentially be optimized by combining it with
  // the loop being used to find the segmentStartIndex, and simply don't break
  // out when the segment is found to allow the loop to continue to check for exact matches.
  for (let i = first; i < curve.length; i += 6) {
    if (curve[i] === x) return toExternalCoordinate(curve[i + 1]);
  }

  
  let segmentStartIndex: number;

  // TODO - This could be optimized by using a binary search
  for (let i = first; i < curve.length - 7; i += 6) {
    const startPoint = [curve[i], curve[i + 1]];
    const endPoint = [curve[i + 6], curve[i + 7]];
    if (x >= startPoint[0] && x <= endPoint[0]) {
      segmentStartIndex = i;
      break;
    }
  }
 
  const segment: BezierSegment = curve.slice(segmentStartIndex!, segmentStartIndex! + 8) as BezierSegment;
 
  for (let attempts = 0; attempts < 10; attempts++) {
    const tweak = 0.0001 * attempts;
    let t = getTAtX(segment, x >= 1 ? x - tweak : x + tweak);
    if (t === null) t = getTAtXAlternative(segment, x >= 1 ? x - tweak : x + tweak);
    if (t === null) continue;
    const point = getPointOnCurveAtT(segment, t);

    const y = Math.abs(point[1]) < 1e-15 ? 0 : point[1]; // If the y value is very close to 0, return 0
    return toExternalCoordinate(y);
  }

  throw new Error('Failed to find y for x on curve');

  function toExternalCoordinate(value: number) {
    const scaled = (value + curve[3]) * curve[1]; // Add y offset (3 index) and multiply by y scale factor (1 index)
    return Object.is(scaled, -0) ? 0 : scaled;
  }
}

/**
 * This function finds the y value for a given x value along a cubic Bezier curve.
 * @param encodedChain 
 * @param scaledX 
 * @returns 
 */
export function queryEncodedCurve(
  encodedChain: EncodedScaledBezierChain,
  scaledX: number,
) {
  const chain = decode(encodedChain)
  return queryCurve(chain, scaledX);
}

/**
 * More efficient than queryEncodedCurve, as it doesn't need to decode the chain every time. A given
 * curve is kept as a reference in the closure, however, so this is meant for repeated queries on the same curve.
 * @param encodedChain 
 * @returns 
 */
export function getEncodedCurveQueryFunction(encodedChain: EncodedScaledBezierChain) {
  const decodedChain = decode(encodedChain);
  return (scaledX: number) => queryCurve(decodedChain, scaledX);
}


/**
 * Returns the point on a cubic Bezier curve at a given t value.
 * @param segment The cubic Bezier segment to evaluate.
 * @param t The t value at which to evaluate the curve.
 * @returns The cartesian coordinates of the point on the curve at the given t value.
 */
function getPointOnCurveAtT(
  segment: BezierSegment,
  t: number,
): Vector2 {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;

  const a = mt2 * mt;
  const b = mt2 * t * 3;
  const c = mt * t2 * 3;
  const d = t * t2;
  
  const x = a * segment[0] + b * segment[2] + c * segment[4] + d * segment[6];
  const y = a * segment[1] + b * segment[3] + c * segment[5] + d * segment[7];

  return [x, y];
}

/**
 * Returns the derivative of a cubic Bezier curve at a given t value.
 * @param segment The cubic Bezier segment to evaluate.
 * @param t The t value at which to evaluate the derivative.
 * @returns The derivative of the curve at the given t value.
 */
function getDerivativeAtT(
  segment: BezierSegment,
  t: number,
): Vector2 {
  const mt = 1 - t;
  const t2 = t * t;

  // The derivative of a cubic Bezier curve is a second degree polynomial
  const a = -3 * mt * mt;
  const b = 3 * mt * (mt - 2 * t);
  const c = 3 * t * (2 * mt - t);
  const d = 3 * t2;

  const x = a * segment[0] + b * segment[2] + c * segment[4] + d * segment[6];
  const y = a * segment[1] + b * segment[3] + c * segment[5] + d * segment[7];

  return [x, y];
}

/**
 * This function finds the t value for a given x value on a cubic Bezier curve.
 * It is an implementation of the Newton-Raphson method.
 * Implementation reference in chromium: https://chromium.googlesource.com/chromium/src/+/master/ui/gfx/geometry/cubic_bezier.cc
 * @param segment The cubic Bezier segment to evaluate.
 * @param x The x value for which we will find the associated t value along the curve.
 * @returns The t value for the given x value along the curve.
 */
function getTAtX(
  segment: BezierSegment,
  x: number,
) {
  let t = 0.5; // Initial guess
  let xAtT, xDerivativeAtT, xDifference, iterationCount = 0;

  do {
    const pointAtT = getPointOnCurveAtT(segment, t);
    const derivativeAtT = getDerivativeAtT(segment, t);

    xAtT = pointAtT[0];
    xDerivativeAtT = derivativeAtT[0];
    xDifference = x - xAtT;

    // Avoid division by a very small number which can lead to a huge jump
    if (Math.abs(xDerivativeAtT) > 1e-6) {
      t += xDifference / xDerivativeAtT;
    }

    // Keep t within bounds [0, 1]
    t = Math.max(Math.min(t, 1), 0);

    iterationCount++;

    if (iterationCount > 15) {
      // console.warn('Newton-Raphson iteration failed to converge.');
      return null;
    }
  } while (Math.abs(xDifference) > 1e-6);

  return t;
}

/**
 * This is an alternative method to getTAtX. It uses bisecting instead of Newton-Raphson.
 * It is slower but more reliable. It should be used as a fallback when Newton-Raphson fails to converge.
 * Reference implementation in chromium: https://chromium.googlesource.com/chromium/src/+/master/ui/gfx/geometry/cubic_bezier.cc
 * @param points
 * @param x 
 * @param tolerance 
 * @param maxIterations 
 * @returns 
 */
function getTAtXAlternative(
  segment: BezierSegment,
  x: number,
  tolerance: number = 1e-6,
  maxIterations: number = 100
): number | null {
  let a = 0;
  let b = 1;
  let t = (a + b) / 2;

  for (let i = 0; i < maxIterations; i++) {
    t = (a + b) / 2;
    const xAtT = getPointOnCurveAtT(segment, t)[0];

    if (Math.abs(xAtT - x) <= tolerance) {
      // The x value at t is close enough to the desired x value.
      return t;
    }

    // Determine which subinterval to choose for the next iteration.
    if ((xAtT > x) !== (getPointOnCurveAtT(segment, a)[0] > x)) {
      b = t;
    } else {
      a = t;
    }
  }

  // Return null if no convergence after maxIterations
  return null;
}
