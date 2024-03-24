import { useEffect, useRef } from 'react';
import p5 from 'p5';
import queryCurve from '@query-curve/query';
import bezierCurve, { EditableBezierCurve, curveToEncodedChain, curveToScaledChain, encodedChainToCurve, getOffsetAndScaleFromRange, getRangeFromOffsetAndScale } from '@query-curve/builder';

// Types
import { BezierCurve, BezierPoint, EncodedScaledBezierChain, Vector2 } from '@query-curve/builder/dist/@common/types';

// Hooks
import useRefState, { useMemoRefState } from '@src/hooks/useRefState';
import useP5 from '@src/hooks/useP5';

// Utils
import remap from '@/src/utils/remap';
import clamp from '@/src/utils/clamp';
import signedClamp from '@/src/utils/signedClamp';
import formatDataPoints from './helpers/formatDataPoints';

// Constants
const CLICK_RADIUS = 10;

const DEFAULT_CURVE = '2BLnMW-2BLnMW--KyjA--KyjA-0-KyjA-CaR6-XZAG-KyjA-TN1E-KyjA-KyjA-KyjA-CaR6-TN1E-8OI4-fxSK-KyjA';

const canvasPoints = new WeakMap<BezierPoint>();

export default function useGraph(
  initialCurve: EncodedScaledBezierChain | null
) {
  if (typeof window === 'undefined') return;

  const isMouseDown = useRef(false);
  const { ref: encodedChain, setValue: setEncodedChain, ...encodedChainRest } = useRefState(null as string | null);
  const { ref: showGrid, setValue: setShowGrid, ...showGridRest } = useRefState(true);
  const { ref: showPoints, setValue: setShowPoints, ...showPointsRest } = useRefState(true);
  const { ref: showHandles, setValue: setShowHandles, ...showHandlesRest } = useRefState(true);
  const { ref: canSelectHandles, setValue: setCanSelectHandles } = useRefState(true);
  const { ref: canSelectPoints, setValue: setCanSelectPoints } = useRefState(true);
  const { ref: xFrom, setValue: setXFrom } = useRefState(0);
  const { ref: xTo, setValue: setXTo } = useRefState(1);
  const { ref: yFrom, setValue: setYFrom } = useRefState(0);
  const { ref: yTo, setValue: setYTo } = useRefState(1);
  // const { ref: xAxisScale, setValue: setXAxisScale } = useRefState(getOffsetAndScaleFromRange(xFrom.current, xTo.current).scale);
  // const { ref: yAxisScale, setValue: setYAxisScale } = useRefState(getOffsetAndScaleFromRange(yFrom.current, yTo.current).scale);
  const { ref: gridLinesV, setValue: setGridLinesV } = useRefState(10);
  const { ref: gridLinesH, setValue: setGridLinesH } = useRefState(10);

  const { ref: dataPointInputs, setValue: setDataPointInputs } = useRefState([] as { points: string; show: boolean; }[]);

  const chainHistory = useRef<EncodedScaledBezierChain[]>([]);

  const canvasWidth = useRefState(750);
  const canvasPadding = useMemoRefState(() => {
    if (canvasWidth.ref.current === null) return 0;
    if (canvasWidth.ref.current < 500) return 50;
    return 100;
  }, [canvasWidth.ref.current]);
  const gridWidth = useMemoRefState(
    () => canvasWidth.ref.current - (canvasPadding.ref.current * 2),
    [canvasWidth.ref.current, canvasPadding.ref.current],
  );
  const scale = {
    x: useMemoRefState(() => getOffsetAndScaleFromRange(xFrom.current, xTo.current).scale, [xFrom.current, xTo.current]),
    y: useMemoRefState(() => getOffsetAndScaleFromRange(yFrom.current, yTo.current).scale, [yFrom.current, yTo.current]),
  };

  const curveRef = useRef<EditableBezierCurve | null>(null);

  useEffect(() => {
    const curveConfig = initialCurve ? encodedChainToCurve(initialCurve) : encodedChainToCurve(DEFAULT_CURVE);

    curveRef.current = bezierCurve(curveConfig, {
      onPointAdd: (curve, index) => {
        // console.log('onPointAdd', index);
      },
      onPointRemove: (curve, index) => {
        // console.log('onPointRemove', index);
      },
      onPointChange: (curve, index, isNew) => {
        // console.log('onPointChange', index, curveRef.current?.getScaledPoint(index).point);
        recalculateCanvasPoint?.(curveRef.current!, index);
        // if (Math.random() < 0.05) setChain(curveToChain(curve));
        // location.search = `?curve=${curveToChain(curve).join(',')}`;
      },
      inputs: { isScaled: false, isOffset: false },
    });
    
    setEncodedChain(curveToEncodedChain(curveRef.current));
    // setXAxisScale(curveRef.current.scale[0]);
    // setYAxisScale(curveRef.current.scale[1]);
    const xRange = getRangeFromOffsetAndScale(curveRef.current.offset[0], curveRef.current.scale[0]);
    const yRange = getRangeFromOffsetAndScale(curveRef.current.offset[1], curveRef.current.scale[1]);

    setXFrom(xRange.from);
    setXTo(xRange.to);
    setYFrom(yRange.from);
    setYTo(yRange.to);
  }, []);

  useEffect(() => {
    if (!curveRef.current) return;
    const x = getOffsetAndScaleFromRange(xFrom.current, xTo.current);
    const y = getOffsetAndScaleFromRange(yFrom.current, yTo.current);
    curveRef.current.setOffset([x.offset, y.offset]);
    curveRef.current.setScale([x.scale, y.scale]);

    setEncodedChain(curveToEncodedChain(curveRef.current));
  }, [xFrom.current, xTo.current, yFrom.current, yTo.current]);

  useEffect(() => {
    // Bootstrap history
    chainHistory.current.push(encodedChain.current!);

    const unlisten = encodedChainRest.listen((value) => {
      if (!curveRef.current || !encodedChain.current) return;
      const currentChain = encodedChain.current;
      const history = chainHistory.current;
      const lastInHistory = history[history.length - 1];
      if (currentChain !== lastInHistory) {
        chainHistory.current.push(encodedChain.current);
        // Limit to 1000
        if (chainHistory.current.length > 1000) chainHistory.current.shift();
      }
      // The reason we don't simply compare the the current item in history is because if we
      // just performed an undo, the current item in history will be the same as the new value,
      // but won't be the same as the current curve.
      if (encodedChain.current === curveToEncodedChain(curveRef.current)) return;
      curveRef.current.fromEncodedChain(encodedChain.current);
      // setXAxisScale(curveRef.current.scale[0]);
      // setYAxisScale(curveRef.current.scale[1]);
      const xRange = getRangeFromOffsetAndScale(curveRef.current.offset[0], curveRef.current.scale[0]);
      const yRange = getRangeFromOffsetAndScale(curveRef.current.offset[1], curveRef.current.scale[1]);
      setXFrom(xRange.from);
      setXTo(xRange.to);
      setYFrom(yRange.from);
      setYTo(yRange.to);
    });

    return () => {
      unlisten();
    };
  }, []);

  function recalculateCanvasPoint(curve: EditableBezierCurve, index: number) {
    const point = curve.getScaledPoint(index);
    canvasPoints.set(curve.points[index], {
      point: toCanvasCoordinates(point.point),
      handle: [
        toCanvasCoordinates(point.handle[0]),
        toCanvasCoordinates(point.handle[1]),
      ],
    });
  };

  /**
   * Converts from graph space to canvas space.
   * @param vec A coordinate in the graph space.
   * @returns 
   */
  function toCanvasCoordinates(vec: Vector2): Vector2 {
    const gw = gridWidth.ref.current;
    const cp = canvasPadding.ref.current;
    
    return [
      remap(vec[0], [xFrom.current, xTo.current], [cp, cp + gw]),
      remap(vec[1], [yFrom.current, yTo.current], [cp + gw, cp]),
    ];
  }

  /**
   * Converts from canvas space to graph space.
   * @param vec A coordinate in the canvas space.
   * @returns 
   */
  function fromCanvasCoordinates(vec: Vector2): Vector2 {
    const gw = gridWidth.ref.current;
    const cp = canvasPadding.ref.current;
    
    return [
      remap(vec[0], [cp, cp + gw], [xFrom.current, xTo.current]),
      remap(vec[1], [cp + gw, cp], [yFrom.current, yTo.current]),
    ];
  }

  // TODO change this so it will snap to grid or axis, whichever is closer. Grid is often the same as axis, but not always.
  function snapToGrid(
    // Coordinates in graph space
    from: Vector2,
  ): Vector2 {
    // Snap to grid with consideration of offset and scale
    const x = remap(from[0], [xFrom.current, xTo.current], [0, 1]);
    const y = remap(from[1], [yFrom.current, yTo.current], [0, 1]);
    const snappedX = Math.round(x * gridLinesV.current) / gridLinesV.current;
    const snappedY = Math.round(y * gridLinesH.current) / gridLinesH.current;
    return [
      remap(snappedX, [0, 1], [xFrom.current, xTo.current]),
      remap(snappedY, [0, 1], [yFrom.current, yTo.current]),
    ];
  }

  // The reason we preserve index is so that we can preserve the position and keep
  // colors consistent when showing/hiding data points
  const dataPoints = useMemoRefState(() => {
    const dataPoints = formatDataPoints(dataPointInputs.current);

    // Convert to canvas coordinates
    return dataPoints.map((dataPoints) => {
      if (!dataPoints) return null;
      const converted = dataPoints.points.map((point) => {
        if (point[0] < xFrom.current || point[0] > xTo.current || point[1] < yFrom.current || point[1] > yTo.current) return null;
        return toCanvasCoordinates(point);
      }).filter(Boolean);

      return {
        ...dataPoints,
        points: converted,
      };
    }).filter(Boolean) as { points: Vector2[]; index: number; }[];
  }, [dataPointInputs.current, toCanvasCoordinates]);

  const { container, width, height } = useP5((p: p5, context: { unlisteners: (() => void)[] }) => {
    if (!curveRef.current) return p;

    context.unlisteners = [] as (() => void)[];

    const curve = curveRef.current;

    let draggingIndex: number | null = null;
    let draggingHandle: 0 | 1 | null = null;

    let pointClickPosition: p5.Vector | null = null;
    let cumulativeDragDistance: number = 0;
    let lastDragPosition: p5.Vector | null = null;
    let justAddedPoint = false;
    let isSnapping = false;

    context.unlisteners.push(showPointsRest.listen(() => draw()));
    context.unlisteners.push(showHandlesRest.listen(() => draw()));
    context.unlisteners.push(showGridRest.listen(() => draw()));
    context.unlisteners.push(encodedChainRest.listen(() => setTimeout(() => draw(), 0)));
    context.unlisteners.push(dataPoints.listen(() => draw()));

    function draw() {
      p.background(255); // Clear the background each time
      p.noFill();
      
      drawGrid();
      drawNumberedScales();
      drawDataPoints();
      drawCurve();
      drawIntersections();
    }

    function drawNumberedScales() {
      const cw = canvasWidth.ref.current;
      const gw = gridWidth.ref.current;
      const cp = canvasPadding.ref.current;
      const hSpacing = gw / gridLinesH.current;
      const vSpacing = gw / gridLinesV.current;
      p.strokeWeight(0);
      // X axis
      p.textSize(12);
      p.textAlign(p.CENTER, p.TOP);
      p.fill(0);
      const xUnit = scale.x.value / gridLinesV.current;
      const xOffset = xFrom.current;
      for (let i = 1; i <= gridLinesV.current; i++) {
        const value = (xOffset + (i * xUnit)).toFixed(2);
        p.text(value, cp + i * vSpacing, cw - cp + 10);
      }
      // Y axis
      p.textAlign(p.RIGHT, p.CENTER);
      const yUnit = scale.y.value / gridLinesH.current;
      const yOffset = yFrom.current;
      for (let i = 1; i <= gridLinesH.current; i++) {
        const value = (yOffset + (i * yUnit)).toFixed(2);
        p.text(value, cp - 10, cw - cp - i * gw / gridLinesH.current);
      }
    }

    function drawGrid() {
      if (!showGrid.current) return;
      const cw = canvasWidth.ref.current;
      const gw = gridWidth.ref.current;
      const cp = canvasPadding.ref.current;
      // Draw a cartesian grid, 1-gridLines
      p.stroke(200);
      p.strokeWeight(1);
      p.line(cp, cp, cp, cw - cp);
      p.line(cp, cw - cp, cw - cp, cw - cp);
      p.line(cp, cw - cp, cp, cp);
      p.line(cw - cp, cw - cp, cw - cp, cp);
      // Draw the scale
      p.stroke(150);
      p.strokeWeight(0.5);
      const hSpacing = gw / gridLinesH.current;
      for (let i = 0; i < gridLinesH.current; i++) {
        p.line(cp, cp + i * hSpacing, cw - cp, cp + i * hSpacing);
      }
      const vSpacing = gw / gridLinesV.current;
      for (let i = 0; i < gridLinesV.current; i++) {
        p.line(cp + i * vSpacing, cp, cp + i * vSpacing, cw - cp);
      }

      // Draw the origin
      p.stroke(0);
      p.strokeWeight(2);
      p.point(cw / 2, cw / 2);

      // Draw the axes
      p.strokeWeight(2);
      // p.line(cp, cp + gw, cw - cp, cp + gw); // x
      // p.line(cp, cp, cp, cp + gw); // y
      const xStart = toCanvasCoordinates([xFrom.current, 0]);
      const xEnd = toCanvasCoordinates([xTo.current, 0]);
      if ((xStart[1] > cp) && (xStart[1] < cp + gw)) p.line(xStart[0], xStart[1], xEnd[0], xEnd[1]);
      const yStart = toCanvasCoordinates([0, yFrom.current]);
      const yEnd = toCanvasCoordinates([0, yTo.current]);
      if ((yStart[0] > cp) && (yStart[0] < cp + gw)) p.line(yStart[0], yStart[1], yEnd[0], yEnd[1]);
    }

    function drawCurve() {
      curve.points.forEach((point, i) => {
        if (i === curve.points.length - 1) return;
        const current = canvasPoints.get(point);

        const next = canvasPoints.get(curve.points[i + 1]);

        if (showHandles.current) {
          // Draw the handles
          p.strokeWeight(6);
          // p.stroke(250, 100, 100, 100);
          p.stroke(240, 197, 41, 100);
          p.line(current.point[0], current.point[1], current.handle[1][0], current.handle[1][1]);
          p.stroke(0, 136, 124, 100);
          p.line(next.point[0], next.point[1], next.handle[0][0], next.handle[0][1]);
          // Draw the handles points
          p.strokeWeight(8);
          p.stroke(240, 197, 41, 255);
          p.point(current.handle[1][0], current.handle[1][1]);
          p.stroke(0, 136, 124, 255);
          p.point(next.handle[0][0], next.handle[0][1]);
        }

        // Draw the Bezier curve
        p.stroke(0, 0, 0, 150);
        p.strokeWeight(3);
        p.noFill();
        p.bezier(
          current.point[0],
          current.point[1],
          current.handle[1][0],
          current.handle[1][1],
          next.handle[0][0],
          next.handle[0][1],
          next.point[0],
          next.point[1],
        );

        if (showPoints.current) {
          // Draw the points
          p.stroke(0);
          p.strokeWeight(8);
          p.point(current.point[0], current.point[1]);
        }
      });

      if (showPoints.current) {
        // Draw last point
        const last = curve.points[curve.points.length - 1];
        const [x, y] = canvasPoints.get(last).point;
        p.stroke(0);
        p.strokeWeight(8);
        p.point(x, y);
      }
    }

    function drawIntersections() {
      const cp = canvasPadding.ref.current;
      const cw = canvasWidth.ref.current;
      const gw = gridWidth.ref.current;

      const mouseCanvas = [
        clamp(p.mouseX, cp, cw - cp),
        clamp(p.mouseY, cp, cw - cp),
      ] as Vector2;
      const mouse = fromCanvasCoordinates(mouseCanvas);

      const intersection = queryCurve(curveToScaledChain(curve), mouse[0]);
      const intersectionCanvas = intersection !== null ? toCanvasCoordinates([mouse[0], intersection!]) : null;

      // Draw point at intersection on curve
      if (intersection !== null) {
        p.stroke(144, 187, 67);
        p.strokeWeight(10);
        p.point(...intersectionCanvas!);
      }
  
      p.stroke(144, 187, 67);
      // Draw point on x axis
      p.strokeWeight(10);
      p.point(mouseCanvas[0], cw - cp);
      p.point(mouseCanvas[0], cp);

      // Draw vertical line from intersection
      if (intersection !== null) {
        p.strokeWeight(1);
        p.line(mouseCanvas[0], intersectionCanvas![1], mouseCanvas[0], cw - cp);
      }

      // Draw point on y axis
      p.strokeWeight(10);
      p.point(cp, mouseCanvas[1]);
      p.point(gw + cp, mouseCanvas[1]);

      // Text labels
      p.stroke(255, 255, 255, 255);
      p.strokeWeight(2);
      
      p.fill(0, 0, 0, 255)

      // Draw the label on y axis
      p.textSize(12);
      p.textAlign(p.LEFT, p.CENTER);
      p.text(mouse[1].toFixed(2), cp + gw + 15, mouseCanvas[1]);

      // Draw the label on x axis
      p.textSize(12);
      p.textAlign(p.CENTER, p.BOTTOM);
      p.text(mouse[0].toFixed(2), mouseCanvas[0], cp - 15);

      // Draw the intersection value
      p.textSize(16);
      p.textAlign(p.LEFT, p.BOTTOM);
      if (intersection !== null) {
        p.text(`(${mouse[0].toFixed(2)}, ${intersection!.toFixed(2)})`, mouseCanvas[0] + 10, intersectionCanvas![1] - 10);
      }
    }

    // Draw reference data points
    function drawDataPoints() {
      dataPoints.ref.current.forEach(({ index, points }) => {
        if (!points) return;
        if (index === 0) p.stroke(249, 65, 68, 200);
        else if (index === 1) p.stroke(87, 117, 144, 200);
        else if (index === 2) p.stroke(95, 15, 64, 200);
        else p.stroke(0, 0, 0, 200); // should never happen
        p.strokeWeight(8);
        points.forEach((point) => {
          p.point(...point);
        });
      });
    }

    p.keyPressed = () => {
      if (p.key === 'Shift') {
        isSnapping = !isSnapping;
      }
    };

    // Handle key release
    p.keyReleased = () => {
      isSnapping = false;
    };

    p.mousePressed = () => {
      isMouseDown.current = true;
      const cw = canvasWidth.ref.current;
      const gw = gridWidth.ref.current;
      const cp = canvasPadding.ref.current;
      
      pointClickPosition = p.createVector(p.mouseX, p.mouseY);

      // Handle drag start
      const wasDragTargetFound = curve.points.findIndex((point, i) => {
        // const [x, y] = toCanvasCoordinates(point.point);
        const canvasPoint = canvasPoints.get(point);

        // Handle drag point
        const [x, y] = canvasPoint.point;
        const handleCoords = canvasPoint.handle;

        // Track if we've found a drag target, independent of our immediate returns upon
        // finding a drag target that will actually be used to drag, because we still want
        // to use the presence of a drag target to prevent adding a new point.
        let found = false;
        
        if (p.dist(p.mouseX, p.mouseY, x, y) < CLICK_RADIUS) {
          found = true;
          if (canSelectPoints.current && showPoints.current) {
            draggingIndex = i;
            draggingHandle = null;
            return true; // Only return inside if statement to allow us to fall through to next check if not able to select points
          }
        }
        if (p.dist(p.mouseX, p.mouseY, handleCoords[0][0], handleCoords[0][1]) < CLICK_RADIUS) {
          if (canSelectHandles.current && showHandles.current) {
            draggingIndex = i;
            draggingHandle = 0;
          }
          // Return true outside of if statement here, because even if we're not able to select handles, the only other conditional
          // to fall through to here is also for handles
          return true;
        }
        if (p.dist(p.mouseX, p.mouseY, handleCoords[1][0], handleCoords[1][1]) < CLICK_RADIUS) {
          if (canSelectHandles.current && showHandles.current) {
            draggingIndex = i;
            draggingHandle = 1;
          }
          return true;
        }

        return found;
      });

      if (wasDragTargetFound !== -1) {
        // console.log('Dragging', draggingIndex, draggingHandle);
        lastDragPosition = p.createVector(p.mouseX, p.mouseY);
        return;
      }

      // return if off grid
      if (p.mouseX < cp || p.mouseX > cp + gw || p.mouseY < cp || p.mouseY > cp + gw) return;

      // Handle click
      const [x, y] = fromCanvasCoordinates([p.mouseX, p.mouseY]);
      const addedAt = curve.addPoint({
        point: [signedClamp(x, xFrom.current, xTo.current), signedClamp(y, yFrom.current, yTo.current)],
      });
      if (addedAt !== null) {
        justAddedPoint = true;
        // Enable dragging of added point
        draggingIndex = addedAt!;
        draggingHandle = null;
        lastDragPosition = p.createVector(p.mouseX, p.mouseY);
      }
      
      draw();
    };

    p.mouseDragged = () => {
      if (draggingIndex !== null) {
        cumulativeDragDistance += p.dist(
          lastDragPosition!.x,
          lastDragPosition!.y,
          p.mouseX,
          p.mouseY
        );
        lastDragPosition = p.createVector(p.mouseX, p.mouseY);

        const coords = fromCanvasCoordinates([p.mouseX, p.mouseY]);

        const moveTo = isSnapping
          ? snapToGrid(coords)
          : coords;
        
        const moveToClamped: Vector2 = [
          draggingHandle !== null
            // If handle, simply clamp to the x range
            ? signedClamp(moveTo[0], xFrom.current, xTo.current)
            // If point, and first or last point, don't move x value
            : draggingIndex === 0
              ? xFrom.current
              : draggingIndex === curve.points.length - 1
                ? xTo.current
                : signedClamp(moveTo[0], xFrom.current, xTo.current),
          signedClamp(moveTo[1], yFrom.current, yTo.current),
        ];

        if (draggingHandle !== null) curve.setHandlePosition(draggingIndex, draggingHandle, moveToClamped);
        else {
          curve.setPointPosition(draggingIndex, moveToClamped);
        }
      }

      draw(); // We draw out here to allow this to act as a draw trigger in mobile even if nothing is being dragged
    };

    p.mouseMoved = () => {
      draw();
    };

    p.mouseReleased = () => {
      isMouseDown.current = false;
      if (
        pointClickPosition
        && draggingIndex !== null
        && draggingIndex !== 0 // Can't remove the first point
        && draggingIndex !== curve.points.length - 1 // Can't remove the last point
        && draggingHandle === null
        && p.dist(p.mouseX, p.mouseY, pointClickPosition.x, pointClickPosition.y) < CLICK_RADIUS
        && cumulativeDragDistance < CLICK_RADIUS
        && !justAddedPoint
      ) {
        console.log('Drag distance', p.dist(p.mouseX, p.mouseY, pointClickPosition.x, pointClickPosition.y));
        curve.removePoint(draggingIndex!);
      }

      // End the dragging operation
      draggingIndex = null;
      draggingHandle = null;

      pointClickPosition = null;
      lastDragPosition = null;
      cumulativeDragDistance = 0;
      justAddedPoint = false;

      draw();
      setEncodedChain(curveToEncodedChain(curve)); // TODO ideally call this onPointChange in some debounced way
    };

    p.touchStarted = (touchEvent) => {
      p.mousePressed();
      // If inside the canvas, prevent default
      if (p.mouseX > 0 && p.mouseX < canvasWidth.ref.current! && p.mouseY > 0 && p.mouseY < canvasWidth.ref.current!) {
        return false; // Prevents from firing the mousePressed event again
      }
    }

    p.touchMoved = (touchEvent) => {
      p.mouseDragged();
      // If inside the canvas, prevent default
      if (p.mouseX > 0 && p.mouseX < canvasWidth.ref.current! && p.mouseY > 0 && p.mouseY < canvasWidth.ref.current!) {
        return false; // Prevents from firing the mousePressed event again
      }
    }

    p.touchEnded = (touchEvent) => {
      p.mouseReleased();
      // If inside the canvas, prevent default
      if (p.mouseX > 0 && p.mouseX < canvasWidth.ref.current! && p.mouseY > 0 && p.mouseY < canvasWidth.ref.current!) {
        return false; // Prevents from firing the mousePressed event again
      }
    }
    
    return {
      setup: (p) => {
        p.background(255);
        curveRef.current?.points.forEach((point, i) => {
          recalculateCanvasPoint(curve, i);
        });

        draw();
      },
      onResize: (width, height) => {
        curveRef.current?.points.forEach((point, i) => {
          recalculateCanvasPoint(curve, i);
        });
        draw();
      },
    }
  }, {
    cleanup: (p, context) => {
      context.unlisteners.forEach((unlisten) => unlisten());
    },
  }, [curveRef.current]);

  useEffect(() => {
    if (!(width.current && height.current)) return;
    const min = Math.min(width.current!, height.current!);
    canvasWidth.setValue(min);
  }, [width.current, height.current]);

  useEffect(() => {
    const canvas = container.current?.getElementsByTagName('canvas')[0];
    if (!canvas) return;
    
    // canvas.touchStarted(touchEvent => touchEvent.preventDefault());
    // canvas.touchMoved(touchEvent => touchEvent.preventDefault());
    // canvas.touchEnded(touchEvent => touchEvent.preventDefault());
  }, [container.current]);

  return {
    container,
    encodedChain: encodedChain.current,
    setEncodedChain: setEncodedChain,
    canSelectHandles: canSelectHandles.current,
    canSelectPoints: canSelectPoints.current,
    showGrid: showGrid.current,
    showHandles: showHandles.current,
    showPoints: showPoints.current,
    toggleShowGrid: () => setShowGrid((showGrid) => !showGrid),
    toggleShowHandles: () => setShowHandles((showHandles) => !showHandles),
    toggleShowPoints: () => setShowPoints((showPoints) => !showPoints),
    toggleSelectHandles: () => setCanSelectHandles((canSelectHandles) => !canSelectHandles),
    toggleSelectPoints: () => setCanSelectPoints((canSelectPoints) => !canSelectPoints),
    range: {
      x: [xFrom.current, xTo.current],
      y: [yFrom.current, yTo.current],
      setX: (from: number, to: number) => {
        const savedScrollPosition = window.scrollY;
        setXFrom(from);
        setXTo(to);
        // Extremely hacky way to scroll to back to where we were after changing the range
        // in order to prevent the jump that happens on re-render
        setTimeout(() => window.scrollTo(0, savedScrollPosition), 10);
      },
      setY: (from: number, to: number) => {
        const savedScrollPosition = window.scrollY;
        setYFrom(from);
        setYTo(to);
        // Extremely hacky way to scroll to back to where we were after changing the range
        // in order to prevent the jump that happens on re-render
        setTimeout(() => window.scrollTo(0, savedScrollPosition), 10);
      },
    },

    gridLinesH: gridLinesH.current,
    gridLinesV: gridLinesV.current,
    setGridLinesH: (value: number) => setGridLinesH(value),
    setGridLinesV: (value: number) => setGridLinesV(value),

    dataPointInputs: dataPointInputs.current,
    setDataPointInputs: setDataPointInputs,

    undo: () => {
      if (chainHistory.current.length === 1) return;
      chainHistory.current.pop();
      const last = chainHistory.current[chainHistory.current.length - 1];
      if (last) setEncodedChain(last);
    },
  };
}
