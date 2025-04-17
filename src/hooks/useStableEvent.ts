import { useRef, useCallback } from "react";

// useEventっぽいものを自作する
export function useStableEvent<T extends (...args: unknown[]) => unknown>(fn: T): T {
  const ref = useRef(fn);
  ref.current = fn;

  return useCallback(((...args: unknown[]) => {
    return ref.current(...args);
  }) as T, []);
}