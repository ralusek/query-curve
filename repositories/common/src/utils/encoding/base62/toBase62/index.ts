import { BASE_62_CHAR_SET } from '../constants';

/**
 * Convert a number to a base62 string
 * @param num The number to convert
 * @returns The base62 representation of the number
 */
export default function toBase62(num: number): string {
  if (num === 0) return BASE_62_CHAR_SET[0];
  let result = '';
  while (num > 0) {
    result = BASE_62_CHAR_SET[num % 62] + result;
    num = Math.floor(num / 62);
  }
  return result;
}
