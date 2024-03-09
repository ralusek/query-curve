/**
 * Creates an object that is typed with its actual literal values rather than just
 * the generic type. Can be used to get enum values.
 * @example
 *   const x = asEnum({
 *     NAME: 'NAME',
 *     AGE: 'AGE',
 *   });
 *   type XType = typeof x;
 *   type XValues = XType[keyof XType]; // will be 'NAME' | 'AGE', rather than string
 * https://github.com/microsoft/TypeScript/issues/3192#issuecomment-261720275
 */
export default function asEnum<T extends {[index in string]: U}, U extends string>(x: T) { return x; }
