import bezierCurve, { curveToEncodedChain, encodedChainToCurve } from '../dist';
import { BezierPoint, Vector2 } from '../dist/@common/types';

describe('@query-curve/builder', () => {
  const shared = bezierCurve({
    points: [
      { point: [0, 0.5], handle: [[-0.05, 0.5], [0.05, 0.5]] },
      { point: [1, 0.5], handle: [[0.95, 0.5], [1.05, 0.5]] },
    ],
    scale: [1, 1],
    offset: [0, 0],
  });

  const template = shared.clone();

  it('should correctly create a new bezier curve', () => {
    const curve = bezierCurve({
      points: [
        { point: [0, 0.5], handle: [[-0.05, 0.5], [0.05, 0.5]] },
        { point: [1, 0.5], handle: [[0.95, 0.5], [1.05, 0.5]] },
      ],
      scale: [1, 1],
      offset: [0, 0],
    });

    expect(curve.points[0].point).toEqual([0, 0.5]);
    expect(curve.points[0].handle).toEqual([[-0.05, 0.5], [0.05, 0.5]]);
    expect(curve.points[1].point).toEqual([1, 0.5]);
    expect(curve.points[1].handle).toEqual([[0.95, 0.5], [1.05, 0.5]]);
  });

  it('should correctly insert a new point at the proper index', () => {
    const point: BezierPoint = { point: [0.5, 0.5], handle: [[0.45, 0.5], [0.55, 0.5]] };
    shared.addPoint(point);

    expect(shared.points[1].point).toEqual([0.5, 0.5]);
    expect(shared.points[1].handle).toEqual([[0.45, 0.5], [0.55, 0.5]]);
  });

  it ('should correctly insert a new point before the first point', () => {
    const point = { point: [-0.5, 0.5] as Vector2 };
    const cloned = shared.clone();
    cloned.addPoint(point);

    expect(cloned.points[0].point).toEqual([-0.5, 0.5]);
    expect(cloned.points[1].point).toEqual([0, 0.5]);
    expect(cloned.points[2].point).toEqual([0.5, 0.5]);
    expect(cloned.points[3].point).toEqual([1, 0.5]);
  });

  it('should correctly insert a new point after the last point', () => {
    const point = { point: [2, 0.5] as Vector2 };
    const cloned = shared.clone();
    cloned.addPoint(point);

    expect(cloned.points[0].point).toEqual([0, 0.5]);
    expect(cloned.points[1].point).toEqual([0.5, 0.5]);
    expect(cloned.points[2].point).toEqual([1, 0.5]);
    expect(cloned.points[3].point).toEqual([2, 0.5]);
  });

  it('should correctly remove a point at the proper index', () => {
    shared.removePoint(1);

    expect(shared.points.length).toBe(2);
  });

  it('should adjust the points to the proper boundary when moving a point', () => {
    const point: BezierPoint = { point: [0.5, 0.5], handle: [[0.45, 0.5], [0.55, 0.5]] };
    const index = shared.addPoint(point);
    expect(index).toBe(1);

    const pointToMove: BezierPoint = { point: [0.55, 0.5], handle: [[0.45, 0.5], [0.55, 0.5]] };
    const newIndex = shared.addPoint(pointToMove)!;
    expect(newIndex).toBe(2);

    shared.setPointPosition(newIndex, [0.4, 0.5]);
    expect(shared.points[2].point).toEqual([0.5, 0.5]); // Should have been adjusted to not go past the previous point
  });

  it('should allow moving the first and last points to coordinates beyond their current boundaries', () => {
    const cloned = template.clone();

    expect(cloned.points[0].point).toEqual([0, 0.5]);
    expect(cloned.points[1].point).toEqual([1, 0.5]);
  
    // Attempt to move the first and last points to their new positions
    cloned.setPointPosition(0, [-10, -10]); // Moving first point to -10, -10
    cloned.setPointPosition(1, [10, 10]); // Moving last point to 10, 10
  
    // Verify that the first and last points have been moved as expected
    expect(cloned.points[0].point).toEqual([-10, -10]); // Check first point moved correctly
    expect(cloned.points[1].point).toEqual([10, 10]); // Check last point moved correctly

    // Testing an actual regression encountered
    cloned.setPointPosition(0, [-101.86666666666666, 0.5333333333333456]);
    expect(cloned.points[0].point).toEqual([-101.86666666666666, 0.5333333333333456]);
    cloned.setPointPosition(0, [-100, 0.5333333333333456]);
    expect(cloned.points[0].point).toEqual([-100, 0.5333333333333456]);
  });

  it('should update the scale without transforming the points', () => {
    const cloned = shared.clone();
    expect(cloned.scale).toEqual([1, 1]);
    const points = cloned.points.map((point) => point.point);
    cloned.setScale([2, 2]);
    expect(cloned.scale).toEqual([2, 2]);
    expect(cloned.points.map((point) => point.point)).toEqual(points);
  });

  it('should update the scale and transform the points', () => {
    const cloned = shared.clone();
    expect(cloned.scale).toEqual([1, 1]);
    const points = cloned.points.map((point) => point.point);
    cloned.setScale([2, 2], { transformPoints: true });
    expect(cloned.scale).toEqual([2, 2]);
    cloned.points.forEach((point, index) => {
      expect(point.point).toEqual([points[index][0] * 2, points[index][1] * 2]);
    });
  });

  it('should create a curve from an encoded chain', () => {
    // scale of 3, 1
    const encoded = '21sMy-fxSK-0-0-0-0-0-fxSK-fxSK-0-fxSK-fxSK';
    const curve = encodedChainToCurve(encoded);
    const editable = bezierCurve(curve, { inputs: { isScaled: false, isOffset: false } });

    expect(editable.scale).toEqual([3, 1]);
    expect(editable.offset).toEqual([0, 0]);

    expect(editable.points[0].point).toEqual([0, 0]);
    expect(editable.points[0].handle[1]).toEqual([0, 1]);
    expect(editable.points[1].point).toEqual([1, 1]);
    expect(editable.points[1].handle[0]).toEqual([1, 0]);
    

    const scaledPoints = editable.getScaledPoints();
    expect(scaledPoints[0].point).toEqual([0, 0]);
    expect(scaledPoints[0].handle[1]).toEqual([0, 1]);
    expect(scaledPoints[1].point).toEqual([3, 1]);
    expect(scaledPoints[1].handle[0]).toEqual([3, 0]);

    const reencoded = curveToEncodedChain(curve);
    expect(reencoded).toBe(encoded);
  });

  it('should update a curve from an encoded chain', () => {
    const encoded = '21sMy-fxSK-0-0-0-0-0-fxSK-fxSK-0-fxSK-fxSK';
    const cloned = template.clone();
    expect(cloned.scale).toEqual(template.scale);
    expect(cloned.offset).toEqual(template.offset);

    expect(cloned.scale).toEqual([1, 1]);
    expect(cloned.points[0].point).toEqual([0, 0.5]);
    expect(cloned.points[1].point).toEqual([1, 0.5]);

    cloned.fromEncodedChain(encoded);

    expect(cloned.scale).toEqual([3, 1]);
    expect(cloned.offset).toEqual([0, 0]);

    expect(cloned.points[0].point).toEqual([0, 0]);
    expect(cloned.points[0].handle[1]).toEqual([0, 1]);
    expect(cloned.points[1].point).toEqual([1, 1]);
    expect(cloned.points[1].handle[0]).toEqual([1, 0]);

    const scaledPoints = cloned.getScaledPoints();
    expect(scaledPoints[0].point).toEqual([0, 0]);
    expect(scaledPoints[0].handle[1]).toEqual([0, 1]);
    expect(scaledPoints[1].point).toEqual([3, 1]);
    expect(scaledPoints[1].handle[0]).toEqual([3, 0]);

    const reencoded = curveToEncodedChain(cloned.curve);
    expect(reencoded).toBe(encoded);
  });

  it('should create a curve from an encoded chain with an offset', () => {
    // scale of 3, 1, offset of -1, 1 (remember, offset is not scaled)
    const encoded = '21sMy-fxSK--fxSK-fxSK-0-0-0-fxSK-fxSK-0-fxSK-fxSK';
    const curve = encodedChainToCurve(encoded);
    const editable = bezierCurve(curve, { inputs: { isScaled: false, isOffset: false } });

    expect(curve.scale).toEqual([3, 1]);
    expect(curve.offset).toEqual([-1, 1]);

    expect(editable.points[0].point).toEqual([0, 0]);
    expect(editable.points[0].handle[1]).toEqual([0, 1]);
    expect(editable.points[1].point).toEqual([1, 1]);
    expect(editable.points[1].handle[0]).toEqual([1, 0]);

    const scaledPoints = editable.getScaledPoints();
    expect(scaledPoints[0].point).toEqual([-3, 1]); // offset point is -1, 1, scaled by 3, 1
    expect(scaledPoints[0].handle[1]).toEqual([-3, 2]); // offset handle is -1, 2, scaled by 3, 1
    expect(scaledPoints[1].point).toEqual([0, 2]); // offset point is 0, 2, scaled by 3, 1
    expect(scaledPoints[1].handle[0]).toEqual([0, 1]); // offset handle is 0, 1, scaled by 3, 1

    const reencoded = curveToEncodedChain(curve);
    expect(reencoded).toBe(encoded);
  });

  it('should be able to encode negative values', () => {
    const encoded = '-fxSK--fxSK-0-0-0-0-fxSK-fxSK-0-0-fxSK-fxSK';
    const curve = bezierCurve(
      {
        points: [
          {
            point: [0, 0],
            handle: [
              [0, 0],
              [1, 1],
            ],
          },
          {
            point: [1, 1],
            handle: [
              [0, 0],
              [1, 1],
            ],
          },
        ],
        scale: [-1, -1],
        offset: [0, 0],
      },
      { inputs: { isScaled: false, isOffset: false } },
    );

    const result = curveToEncodedChain(curve);

    expect(result).toBe(encoded);
  });
});
