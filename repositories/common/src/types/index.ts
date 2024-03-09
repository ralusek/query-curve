
export type Vector2 = [number, number];
export type BezierPoint = {
  point: Vector2;
  handle: [Vector2, Vector2];
};

export type BezierCurve = {
  scale: Vector2; // x and y scale factors
  points: BezierPoint[];
};

export type BezierSegment = [
  number, // Start point x
  number, // Start point y
  number, // Start handle x
  number, // Start handle y
  number, // End handle x
  number, // End handle y
  number, // End point x
  number, // End point y
];

// Chain of bezier segments. Neighboring segments share points.
// Rather than being interpreted as
// PX PY HX HY HX HY PX PY PX PY HX HY HX HY PX PY
// it should be interpreted as
// PX PY HX HY HX HY PX PY HX HY HX HY PX PY
// in order to avoid redundancy
export type BezierChain = number[];

// BezierChain with first element being the x scale factor and the second being the y scale factor
export type ScaledBezierChain = number[];

// ScaledBezierChain, where each value has been raised to 10^6, rounded to the nearest integer, and encoded in base62
export type EncodedScaledBezierChain = string;

export type Vector = number[];
