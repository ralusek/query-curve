import { useEffect } from 'react';

// Hooks
import useRefState from '@src/hooks/useRefState';

export default function useGetContainerDimensions(
  containerRef?: React.MutableRefObject<HTMLDivElement | null>,
  {
    onResize,
  }: {
    onResize?: (width: number, height: number) => void,
  } = {},
) {
  containerRef = containerRef || (useRefState<HTMLDivElement | null>(null)).ref;
  const { ref: width, setValue: setWidth } = useRefState<number | null>(null);
  const { ref: height, setValue: setHeight } = useRefState<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      setWidth(entry.contentRect.width);
      setHeight(entry.contentRect.height);
      if (onResize) onResize(entry.contentRect.width, entry.contentRect.height);
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef.current]);

  return {
    width,
    height,
    ref: containerRef,
  };
}
