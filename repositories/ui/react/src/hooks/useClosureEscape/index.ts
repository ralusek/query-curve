import { useRef } from 'react';

const useClosureEscape = <A extends any[], R extends any>(fn: (...args: A) => R) => {
  const ref = useRef(fn);
  ref.current = fn;
  return (...args: A) => {
    return ref.current(...args);
  };
};

export default useClosureEscape;
