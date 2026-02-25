/**
 * Debounced search hook for throttling API requests.
 * Delays updates by 300ms to reduce rapid-fire requests.
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Returns debounced value, setter, and immediate value.
 * Use debouncedValue for API query keys; use setSearchValue for input onChange.
 *
 * @param initialValue - Initial search string
 * @param delay - Debounce delay in ms (default 300)
 */
export function useDebouncedSearch(
  initialValue = '',
  delay = 300
): [string, (value: string) => void, string] {
  const [immediateValue, setImmediateValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(immediateValue);
    }, delay);

    return () => clearTimeout(timer);
  }, [immediateValue, delay]);

  const setSearchValue = useCallback((value: string) => {
    setImmediateValue(value);
  }, []);

  return [debouncedValue, setSearchValue, immediateValue];
}
