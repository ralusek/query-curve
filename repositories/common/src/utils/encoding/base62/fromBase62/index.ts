import { BASE_62_CHAR_SET } from '../constants';

export default function fromBase62(str: string): number {
  return str.split('').reverse().reduce((prev, curr, i) => {
    return prev + BASE_62_CHAR_SET.indexOf(curr) * Math.pow(62, i);
  }, 0);
}
