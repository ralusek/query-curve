/**
 * Interpolate linearly bewteen two values by a given amount.
 * @param amount The amount to interpolate between the two values of the range. 0 = begining, 1 = end.
 * @returns The interpolated value.
 */
export default function lerp(
  // The amount to interpolate between the two values of the range. 0 = begining, 1 = end.
  amount: number,
  range: [
    // Beginning of the range on which to interpolate.
    number,
    // End of the range on which to interpolate.
    number
  ],
): number {
  const rangeLength = range[1] - range[0];
  const position = amount * rangeLength; // Calculate the position in the range.
  return range[0] + position; // Offset the range by the start value
}
