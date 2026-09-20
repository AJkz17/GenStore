// hooks/useDebouncedValue.ts
import { useEffect, useState } from 'react';

export function debouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer); // cancel if value changes before delay elapses
  }, [value, delayMs]);

  return debounced;
}