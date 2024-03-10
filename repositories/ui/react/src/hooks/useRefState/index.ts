import React, { useEffect, useRef } from 'react';

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
  }: { useState?: boolean } = {},
) {
  let setState: React.Dispatch<React.SetStateAction<T>> | undefined;
  if (useState) {
    const [state, setStateDirect] = React.useState(defaultValue);
    setState = setStateDirect;
  }
  
  const ref = useRef(defaultValue);

  const listeners = useRef<Set<(value: T) => void>>(new Set());

  function setValue(value: T | React.SetStateAction<T>) {
    const previous = ref.current;
    if (useState) setState!(value);
    ref.current = typeof value === 'function' ? (value as (prevState: T) => T)(ref.current) : value;
    if (ref.current !== previous) listeners.current.forEach((listener) => listener(ref.current));
    return ref.current;
  }

  const refProxy = useRef(
    new Proxy(ref, {
      get(target, prop, receiver) {
        const okay = new Set(['current', 'hasOwnProperty']);
        if (typeof prop === 'string' && okay.has(prop)) return Reflect.get(ref, prop, receiver);
        throw new Error(`Cannot get a property on the ref other than 'current.' Attempted to get '${String(prop)}'`);
      },
      set(target, prop, value: T, receiver) {
        if (prop === 'current') {
          setValue(value); 
          return true;
        }
        throw new Error(`Cannot set a property on the ref other than 'current'`);
      },
    })
  );

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
    ref: refProxy.current,
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
