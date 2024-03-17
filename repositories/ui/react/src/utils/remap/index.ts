import inverseLerp from '@src/utils/inverseLerp';
import lerp from '@src/utils/lerp';

/**
 * Maps a value from one range to another.
 * @param value The value within the fromRange to map to the toRange.
 * @param fromRange The range to map from.
 * @param toRange The range to map to.
 * @returns The value mapped to the toRange.
 */
export default function remap(
  value: number,
  fromRange: [number, number],
  toRange: [number, number],
) {
  const position = inverseLerp(value, fromRange);
  return lerp(position, toRange);
}
