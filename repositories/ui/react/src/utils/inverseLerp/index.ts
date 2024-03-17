/**
 * Returns the relative position of a value in a range.
 * @param value Value to map on the range.
 * @returns The relative position of the value in the range.
 */
export default function inverseLerp(
  // The number on which we want to determine its relative position in the range.
  value: number,
  range: [
    // Beginning of the range to interpolate from.
    number,
    // End of the range to interpolate from.
    number
  ],
): number {
  return (value - range[0]) / (range[1] - range[0]);
}
