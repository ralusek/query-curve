import { useEffect, useRef } from 'react';
import p5 from 'p5';

import useGetContainerDimensions from '@src/hooks/useGetContainerDimensions';
import useRefState from '@src/hooks/useRefState';
import useDebounce from '@src/hooks/useDebounce';

const disallowedKeys = new Set(['setup', 'remove']);



export default function useP5<C extends any>(
  sketch: (p: p5, context: C) => {
    setup: (p: p5) => void,
    onResize?: (width: number, height: number) => void,
  },
  {
    containerRef,
    onResize,
    cleanup,
  }: {
    // Note that passing in a ref is optional, as the hook will create one if it's not provided.
    // It is actually recommended to not pass in a ref unless you are confident that a rerender
    // will occur after the ref is set, as p5 won't be able to attach to the canvas until it's
    // been assigned to an element.
    containerRef?: React.MutableRefObject<HTMLDivElement | null>,
    onResize?: (width: number, height: number) => void,
    cleanup?: (instance: p5, context: C) => void,
  } = {},
  dependencies: any[] = [],
) {
  containerRef = containerRef || (useRefState<HTMLDivElement | null>(null)).ref;

  const instances = useRef<Set<p5>>(new Set());
  const instanceResizeListeners = useRef<WeakMap<p5, (width: number, height: number) => void>>(new WeakMap());
  const instanceContext = useRef<WeakMap<p5, C>>(new WeakMap());

  const debouncedOnResize = useRef(useDebounce(
    (width: number, height: number) => {
      instances.current.forEach((instance) => {
        instance.resizeCanvas(width, height);
        const listener = instanceResizeListeners.current.get(instance);
        if (listener) listener(width, height);
      });
      if (onResize) onResize(width, height);
    },
    { wait: 250, maxWait: 500 }
  ));

  const { width, height } = useGetContainerDimensions(
    containerRef,
    {
      onResize: debouncedOnResize.current,
    },
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!containerRef?.current) return;

    let instance: p5;

    const p5Promise = (async () => {
      const { default: p5 } = (await import('p5'))

      new p5((p) => {
        instance = p;
        instances.current.add(p);
        const context = {} as C;
        instanceContext.current.set(p, context);
        const proxy = new Proxy(p, {
          get(target, prop, receiver) {
            if (disallowedKeys.has(String(prop))) {
              throw new Error(`Cannot get property '${String(prop)}' from p5 instance.`);
            }
            return Reflect.get(target, prop, receiver);
          },
          set(target, prop, value, receiver) {
            if (disallowedKeys.has(String(prop))) {
              throw new Error(`Cannot set property '${String(prop)}' on p5 instance.`);
            }
            return Reflect.set(target, prop, value, receiver);
          },
        });

        const { setup, onResize } = sketch(proxy, context);
        if (onResize) instanceResizeListeners.current.set(p, onResize);

        p.setup = () => {
          p.createCanvas(width.current!, height.current!);

          setup(proxy);
        };
      }, containerRef.current!);
    })();

    return () => {
      (async () => {
        await p5Promise;
        instance?.remove();
        instances.current.delete(instance);
        cleanup?.(instance, instanceContext.current.get(instance)!);
      })();
    };
  }, [containerRef.current, ...dependencies]);

  return {
    container: containerRef,
    width,
    height,
  };
}
