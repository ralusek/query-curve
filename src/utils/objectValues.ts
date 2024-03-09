import objectKeys from './objectKeys';

/**
 * Object.values that actually preserves values as types.
 * @param obj The object whose values should be returned.
 * @returns The objects values.
 */
export default <T extends {}, K extends keyof T>(obj: T): Array<T[K]> => {
  return objectKeys(obj).map((key) => obj[key]) as Array<T[K]>;
};
