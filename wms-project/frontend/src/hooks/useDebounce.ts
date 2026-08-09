import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce fast-changing values (e.g. search input fields)
 * Prevents unnecessary re-renders and heavy filtering calculations on every keystroke.
 * @param value The input value to debounce
 * @param delay Delay in milliseconds (default 300ms)
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
