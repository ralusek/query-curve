import clamp from '@src/utils/clamp';

// If max is negative, it will be treated as the minimum
export default function signedClamp(value: number, min: number = 0, max: number = 1) {
  if (max < 0) return clamp(value, max, min);
  return clamp(value, min, max);
}
