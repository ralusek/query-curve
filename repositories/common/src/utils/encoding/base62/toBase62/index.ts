import { BASE_62_CHAR_SET } from '../constants';

export default function toBase62(num: number): string {
  if (num === 0) return BASE_62_CHAR_SET[0];
  let result = '';
  while (num > 0) {
    result = BASE_62_CHAR_SET[num % 62] + result;
    num = Math.floor(num / 62);
  }
  return result;
}
