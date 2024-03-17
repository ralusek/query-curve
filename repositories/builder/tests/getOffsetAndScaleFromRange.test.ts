import { getOffsetAndScaleFromRange } from '../dist';

describe('@query-curve/builder getOffsetAndScaleFromRange', () => {
  it('calculate the scale and offset to be set for a curve based off of a range', () => {
    [
      // Note: Offsets are internal/non-scaled
      { from: 0, to: 1, scale: 1, offset: 0 },
      { from: 0, to: 0.5, scale: 0.5, offset: 0 },
      { from: 0.5, to: 1, scale: 0.5, offset: 1 },
      { from: -1, to: 1, scale: 2, offset: -0.5 },
      { from: -10, to: 10, scale: 20, offset: -0.5 },
    ].forEach((item) => {
      const { scale, offset } = getOffsetAndScaleFromRange(item.from, item.to);
      expect(scale).toBe(item.scale);
      expect(offset).toBe(item.offset);
    });
  });

});
