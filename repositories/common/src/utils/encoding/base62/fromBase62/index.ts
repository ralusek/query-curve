import { BASE_62_CHAR_SET } from '../constants';

/**
 * Convert a base62 string to a number
 * @param str The base62 string to convert
 * @returns The number representation of the base62 string
 */
export default function fromBase62(str: string): number {
  return str.split('').reverse().reduce((prev, curr, i) => {
    return prev + BASE_62_CHAR_SET.indexOf(curr) * Math.pow(62, i);
  }, 0);
}
