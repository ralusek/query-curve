// Types
import { BezierChain, BezierCurve, BezierPoint, EncodedScaledBezierChain, ScaledBezierChain, Vector, Vector2 } from '@common/types';

// Utils
import encode from '@common/utils/encoding/scaledBezierChain/encode';
import decode from '@common/utils/encoding/scaledBezierChain/decode';
import validateScaledBezierChainLength from '@common/utils/encoding/scaledBezierChain/validate/length';

export function addVector<T extends Vector>(a: T, b: T): T {
  return a.map((v, i) => v + b[i]) as T;
}

export function subtractVector<T extends Vector>(a: T, b: T): T {
  return a.map((v, i) => v - b[i]) as T;
}

export function areEqualVectors<T extends Vector>(a: T, b: T): boolean {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

const exp = 1e7;
function truncate(number: number) {
  return Math.round(number * exp) / exp;
}

export function curveToScaledChain(
  curve: BezierCurve,
): ScaledBezierChain {
  return [...curve.scale, ...curveToChain(curve)];
}

export function curveToEncodedChain(curve: BezierCurve): EncodedScaledBezierChain {
  const scaledChain = curveToScaledChain(curve);
  return encode(scaledChain);
}

export function curveToChain(curve: BezierCurve): BezierChain {
  const chain: BezierChain = [];
  for (let i = 0; i < curve.points.length - 1; i++) {
    const point = curve.points[i].point; // Start point
    const handle1 = curve.points[i].handle[1]; // Start handle
    const handle2 = curve.points[i + 1].handle[0]; // End handle
    
    // We don't include the end point of the segment in the chain, as it will
    // be the start point of the next segment
    chain.push(truncate(point[0]), truncate(point[1]), truncate(handle1[0]), truncate(handle1[1]), truncate(handle2[0]), truncate(handle2[1]));
  }
  // Add the last handle and point
  const last = curve.points[curve.points.length - 1];
  chain.push(truncate(last.point[0]), truncate(last.point[1]));

  return chain;
}

export function scaledChainToCurve(chain: BezierChain): BezierCurve {
  if (validateScaledBezierChainLength(chain)) throw new Error('Invalid chain length');
  const first = 2; // First 2 values are x and y scale factors
  const last = chain.length - 1;

  const points: BezierPoint[] = [];

  // Handle first point
  points.push({
    point: [chain[first], chain[first + 1]],
    // We just default the first point left handle to the point's y position and -1 x.
    // This handle isn't saved in the chain and isn't used for anything.
    handle: [[-1, chain[first + 1]], [chain[first + 2], chain[first + 3]]],
  });
  
  for (let i = first + 4; i < chain.length - 4; i += 6) {
    const leftHandle: Vector2 = [chain[i], chain[i + 1]];
    const point: Vector2 = [chain[i + 2], chain[i + 3]];
    const rightHandle: Vector2 = [chain[i + 4], chain[i + 5]];
    points.push({
      point,
      handle: [leftHandle, rightHandle],
    });
  }

  // Handle last point
  points.push({
    point: [chain[last - 1], chain[last]],
    // We just default the last point right handle to the point's y position and x of 2.
    // This handle isn't saved in the chain and isn't used for anything.
    handle: [[chain[last - 3], chain[last - 2]], [2, chain[last]]],
  });

  return { points, scale: [chain[0], chain[1]] };
}

export function encodedChainToCurve(encodedChain: EncodedScaledBezierChain): BezierCurve {
  return scaledChainToCurve(decode(encodedChain));
}

export type EditableBezierCurve = {
  addPoint: (
    point: {
      point: BezierPoint['point'];
      handle?: BezierPoint['handle'];
    },
    scaled?: boolean,
  ) => number | null;
  removePoint: (index: number) => void;
  setHandlePosition: (index: number, handleIndex: 0 | 1, position: Vector2, scaled?: boolean) => void;
  setPointPosition: (index: number, position: Vector2, scaled?: boolean) => void;
  getScaledPoint: (index: number) => BezierPoint;
  getScaledPoints: () => BezierPoint[];
  points: BezierPoint[];
  scale: Vector2;
  setScale: (scale: Vector2, options?: { transformPoints?: boolean }) => void;
  curve: BezierCurve;
  clone: () => EditableBezierCurve;
  fromScaledChain: (chain: ScaledBezierChain) => EditableBezierCurve;
  fromEncodedChain: (encodedChain: EncodedScaledBezierChain) => EditableBezierCurve;
};

export default function bezierCurve(
  curve: BezierCurve = {
    points: [],
    scale: [1, 1],
  },
  config: {
    onPointAdd?: (curve: BezierCurve, index: number) => void;
    onPointRemove?: (curve: BezierCurve, index: number) => void;
    onPointChange?: (curve: BezierCurve, index: number, isNew?: boolean) => void;
  } = {},
): EditableBezierCurve {
  if (curve.scale[0] === 0 || curve.scale[1] === 0) throw new Error('Scale cannot be 0');

  curve = JSON.parse(JSON.stringify(curve));
  curve.points.forEach((point) => addPoint(point, false));

  function addPoint(
    point: {
      point: BezierPoint['point'];
      handle?: BezierPoint['handle'];
    },
    scaled?: boolean,
  ) {
    const index = (() => {
      if (!curve.points.length) return 0;
      if (scaled) point = {
        ...point,
        point: [point.point[0] / curve.scale[0], point.point[1] / curve.scale[1]],
      };
      let wasEqual = false;
  
      // Find index to insert point by finding the first point with x greater than the new point
      const index = curve.points.findIndex((p) => {
        if (
          p.point[0] === point.point[0] &&
          p.point[1] === point.point[1]
        ) return wasEqual = true;
        return p.point[0] > point.point[0];
      });

      if (index === -1) return curve.points.length;

      return wasEqual ? null : index;
    })();

    if (index === null) return null; // Ignore if point already exists

    point.handle = point.handle ?? [[point.point[0] - 0.05, point.point[1]], [point.point[0] + 0.05, point.point[1]]];

    curve.points.splice(index, 0, point as BezierPoint);

    enforceBoundsWithNeighbors(index);

    config.onPointAdd?.(curve, index);
    config.onPointChange?.(curve, index, true);

    return index;
  }

  function removePoint(index: number) {
    if (index < 0 || index >= curve.points.length) throw new Error('Index out of bounds');
    const removed = curve.points.splice(index, 1);

    if (removed.length) config.onPointRemove?.(curve, index);
  }

  /**
   * Enforces boundaries and returns whether the point or its handles were changed
   * @param index 
   * @returns 
   */
  function enforceBounds(index: number): boolean {
    const current = curve.points[index];
    const point = current.point;
    const handles = current.handle;

    const original = curve.points[index].point.slice() as Vector2;
    const originalHandles = curve.points[index].handle.map((h) => h.slice()) as [Vector2, Vector2];

    // Restrict x movement of point with respect to the previous and next
    point[0] = ((position: Vector2) => {
      // Ensure point is not beyond the previous point
      return Math.max(
        curve.points[index - 1]?.point[0] ?? point[0],
        // Ensure point is not beyond the next point
        Math.min(curve.points[index + 1]?.point[0] ?? position[0], position[0]),
      );
    })(point) ?? point[0];

    const offset = subtractVector(point, original);
    // Update handles by same offset before enforcing handle bounds. This is to prevent
    // handles from being restricted by the point position without consideration for how
    // the point was actually moved wrt to the boundary enforcements
    handles[0] = addVector(handles[0], offset);
    handles[1] = addVector(handles[1], offset);

    // Restrict x movement of handle 0 with respect to the previous and current
    handles[0][0] = ((position: Vector2) => {
      if (!index) return;
      // Ensure handle is not beyond the point
      return Math.min(
        // Ensure handle is not beyond the previous point
        Math.max(curve.points[index - 1].point[0], position[0]),
        curve.points[index].point[0],
      );
    })(handles[0]) ?? handles[0][0];

    // Restrict x movement of handle 1 with respect to the current and next
    handles[1][0] = ((position: Vector2) => {
      if (index === curve.points.length - 1) return;
      // Ensure handle is not beyond the point
      return Math.max(
        // Ensure handle is not beyond the next point
        Math.min(curve.points[index + 1].point[0], position[0]),
        curve.points[index].point[0],
      );
    })(handles[1]) ?? handles[1][0];

    if (!areEqualVectors(point, original) || !originalHandles.every((h, i) => areEqualVectors(h, curve.points[index].handle[i]))) {
      config.onPointChange?.(curve, index);
      return true;
    }

    return false;
  }

  /**
   * Enforces bounds for the point and its neighbors and returns whether the point or its handles were changed
   * for each point
   * @param index 
   */
  function enforceBoundsWithNeighbors(index: number): boolean[] {
    // Enforce bounds for the point and its neighbors. We start with current so that
    // we don't inadvertently impact neighbors prior to enforcing bounds for the current
    return [
      index,
      index - 1 >= 0 ? index - 1 : null,
      index + 1 < curve.points.length ? index + 1 : null,
    ].map((i) => i === null ? false : enforceBounds(i));
  }

  function setHandlePosition(index: number, handleIndex: 0 | 1, position: Vector2, scaled?: boolean) {
    if (scaled) position = [position[0] / curve.scale[0], position[1] / curve.scale[1]];
    curve.points[index].handle[handleIndex] = position;
    const changed = enforceBounds(index);
    // If boundary change didn't already call onPointChange, call it here
    if (!changed) config.onPointChange?.(curve, index);
  }

  function setPointPosition(index: number, position: Vector2, scaled?: boolean) {
    position = scaled ? [position[0] / curve.scale[0], position[1] / curve.scale[1]] : position.slice() as Vector2;
    const originalPosition = curve.points[index].point.slice() as Vector2;
    curve.points[index].point = position;

    // Move handles by same offset
    const offset = subtractVector(curve.points[index].point, originalPosition);
    curve.points[index].handle[0] = addVector(curve.points[index].handle[0], offset);
    curve.points[index].handle[1] = addVector(curve.points[index].handle[1], offset);

    const [changed] = enforceBoundsWithNeighbors(index);
    // If boundary change didn't already call onPointChange, call it here
    if (!changed) config.onPointChange?.(curve, index);
  }

  function setScale(scale: Vector2, { transformPoints = false } = {}) {
    if (!scale[0] || !scale[1]) throw new Error('Scale cannot be 0');
    const previous = curve.scale;
    curve.scale = scale.slice() as Vector2;
    
    if (transformPoints) {
      const ratio = [scale[0] / previous[0], scale[1] / previous[1]];
      if (transformPoints) curve.points.forEach((point) => {
        point.point = [point.point[0] * ratio[0], point.point[1] * ratio[1]];
        point.handle = [
          [point.handle[0][0] * ratio[0], point.handle[0][1] * ratio[1]],
          [point.handle[1][0] * ratio[0], point.handle[1][1] * ratio[1]],
        ];
      });
    }
  }

  function getScaledPoint(index: number): BezierPoint {
    const point = curve.points[index];
    return {
      point: [point.point[0] * curve.scale[0], point.point[1] * curve.scale[1]],
      handle: [
        [point.handle[0][0] * curve.scale[0], point.handle[0][1] * curve.scale[1]],
        [point.handle[1][0] * curve.scale[0], point.handle[1][1] * curve.scale[1]],
      ],
    };
  }

  function fromScaledChain(chain: ScaledBezierChain) {
    const newCurve = scaledChainToCurve(chain);
    const previousPoints = curve.points;
    curve.points = [];

    previousPoints.forEach((point, i) => config.onPointRemove?.(curve, i));
    newCurve.points.forEach((point) => addPoint(point, false));

    setScale(newCurve.scale);

    return instance;
  }

  function fromEncodedChain(encodedChain: EncodedScaledBezierChain) {
    return fromScaledChain(decode(encodedChain));
  }

  const instance = {
    addPoint,
    removePoint,
    setHandlePosition,
    setPointPosition,

    getScaledPoint,
    getScaledPoints: () => curve.points.map((point, i) => getScaledPoint(i)),

    get points() {
      return curve.points.slice() as BezierPoint[];
    },
    get scale() {
      return curve.scale.slice() as Vector2;
    },
    setScale,
    get curve() {
      return {
        ...curve,
        scale: curve.scale.slice(),
      } as BezierCurve;
    },

    clone: (): EditableBezierCurve => bezierCurve(curve, config),
    fromScaledChain,
    fromEncodedChain,
  };

  return instance;
}
