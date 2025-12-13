import { useRef } from 'react';
import useClosureEscape from '../useClosureEscape';

export default function useDebounce<
  A extends any[],
  T extends any
>(
  fn: (...args: A) => T,
  {
    wait,
    maxWait,
  }: {
    wait: number;
    maxWait?: number;
  },
) {
  const timeout = useRef<NodeJS.Timeout | null>(null);
  const firstCall = useRef<number | undefined>(undefined);

  return useClosureEscape((...args: A) => {
    if (timeout.current) {
      clearTimeout(timeout.current);
      timeout.current = null;
    }

    const now = Date.now();
    if (!firstCall.current) firstCall.current = now;

    const invokeByMaxWait = firstCall.current + (maxWait || Infinity);
    const invokeBy = Math.min(invokeByMaxWait, now + wait);
    const invokeIn = invokeBy - now;

    timeout.current = setTimeout(() => {
      firstCall.current = undefined;
      fn(...args);
    }, invokeIn);
  });
}
