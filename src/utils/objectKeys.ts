/**
 * Object.keys that actually preserves keys as types.
 * @param obj The object whose keys should be returned.
 * @returns The objects keys.
 */
export default <T extends {}>(obj: T): Array<keyof T> => <Array<keyof T>>Object.keys(obj);
