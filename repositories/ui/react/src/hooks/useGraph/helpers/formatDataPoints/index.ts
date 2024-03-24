// Types
import { Vector2 } from '@query-curve/builder/dist/@common/types';

 // The reason we preserve index is so that we can preserve the position and keep
// colors consistent when showing/hiding data points
export default function formatDataPoints(
  dataPointInputs: { points: string; show: boolean; }[],
) {
  return dataPointInputs.map(({ show, points: input }, i) => {
    if (!show) return null;
    const dataPoints: Vector2[] | null = (() => {
      if (input.match(/x|y/)) {
        const dataPoints: Vector2[] = [];
        const re = /(?:(x|y)[^xy0-9-]*(-?[0-9]+(?:\.[0-9]+)?))/g;
        const matches = Array.from(input.matchAll(re));
        let current: { x: number | null; y: number | null; } = {x: null, y: null};
        let count = 0;
        // Only using .find to allow for early return on invalid input
        const isInvalid = matches.find((match) => {
          const [_, key, value] = match as unknown as [string, 'x' | 'y', string];
          if (current[key] !== null) return true; // Invalid input
          current[key] = parseFloat(value);
          if (count++ === 1) {
            dataPoints.push([current.x!, current.y!]);
            count = 0;
            current = {x: null, y: null};
          }
        });
        if (isInvalid) return null;
        return dataPoints;
      }

      const re = /(?:(-?[0-9]+(?:\.[0-9]+)?)[^xy0-9-]+(-?[0-9]+(?:\.[0-9]+)?))/g;
      const matches = Array.from(input.matchAll(re));
      return matches.map((match) => {
        const [_, x, y] = match as unknown as [string, string, string];
        return [parseFloat(x), parseFloat(y)] as Vector2;
      });
    })();

    if (!dataPoints) return null;

    return { points: dataPoints, index: i };
  });
}
