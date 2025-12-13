import React, { useEffect, useRef } from 'react';

const refProxies = new WeakMap<React.RefObject<any>, React.RefObject<any>>();


/**
 * Benefits of state and ref. Has the up to date and closure-escaping properties of using a ref.
 * Has the reactivity of a state/triggers the re-render of the component when the value changes.
 * @param defaultValue 
 * @returns 
 */
export default function useRefState<
  // Exclude functions from the type, as checking if the value is a function is how
  // we determine if the SetStateAction is a function or a value.
  T extends Exclude<any, (...args: any[]) => any>
>(
  defaultValue: T,
  {
    useState = true,
    useProxy = true,
  }: {
    /**
     * Whether or not to utilize React state. Defaults to true. We always also use ref, but utilization of state is what forces a re-render. 
     * The reason we use a ref is for its immediacy, whereas state is deferred until the next render.
     */
    useState?: boolean;
    /**
     * Whether or not to use a proxy for the ref. Defaults to true. Only disable for slight performance gains
     * or if you really know what you're doing. It prevents accidentally setting properties on the ref without
     * using the setValue function, which basically defeats the purporse of this hook.
     */
    useProxy?: boolean;
  } = {},
) {
  const [, setState] = React.useState(defaultValue);
  
  const ref = useRef(defaultValue);

  const listeners = useRef<Set<(value: T) => void>>(new Set());

  function setValue(value: T | React.SetStateAction<T>) {
    const previous = ref.current;
    if (useState) setState!(value);
    ref.current = typeof value === 'function' ? (value as (prevState: T) => T)(ref.current) : value;
    if (ref.current !== previous) listeners.current.forEach((listener) => listener(ref.current));
    return ref.current;
  }

  const refProxy = getRefProxy(ref, { setValue, useProxy });

  function listen(listener: (value: T) => void) {
    listeners.current.add(listener);
    return () => listeners.current.delete(listener);
  }

  function useListen(listener: (value: T) => void, dependencies: any[] = []) {
    useEffect(() => {
      const unlisten = listen(listener);
      return () => {
        unlisten();
      };
    }, dependencies);
  }

  return {
    setValue,
    get value() { return ref.current; },
    ref: refProxy,
    listen,
    unlisten: (listener: (value: T) => void) => listeners.current.delete(listener),
    unlistenAll: () => listeners.current.clear(),
    useListen,
  };
}

export function useMemoRefState<
  T extends Exclude<any, (...args: any[]) => any>
>(
  fn: () => T,
  dependencies: React.DependencyList,
) {
  const memoized = useRefState(fn(), { useState: false }); // We don't want to trigger a re-render for a memoized value.
  useEffect(() => {
    memoized.setValue(fn());
  }, dependencies);

  return memoized;
}

const OKAY_REF_PROPERTIES = new Set([
  'current',
  'hasOwnProperty',
]);
/**
 * Generates a proxy for the ref that allows for the setting and getting of properties on the ref,
 * while still updating state for proper triggering of re-renders.
 * Adds mild protection against misusing the ref.
 */
function getRefProxy<T>(
  ref: React.RefObject<T>,
  {
    setValue,
    useProxy = true,
  }: {
    setValue: (value: T | React.SetStateAction<T>) => T;
    useProxy?: boolean;
  },
): React.RefObject<T> {
  if (!useProxy) return ref;
  if (refProxies.has(ref)) return refProxies.get(ref)!;
  const newProxy = new Proxy(ref, {
    get(target, prop, receiver) {
      if (typeof prop === 'string' && OKAY_REF_PROPERTIES.has(prop)) return Reflect.get(ref, prop, receiver);
      throw new Error(`Cannot get a property on the ref other than 'current.' Attempted to get '${String(prop)}'`);
    },
    set(target, prop, value: T, receiver) {
      if (prop === 'current') {
        setValue(value); 
        return true;
      }
      throw new Error(`Cannot set a property on the ref other than 'current'`);
    },
  });
  refProxies.set(ref, newProxy);
  return newProxy;
}
