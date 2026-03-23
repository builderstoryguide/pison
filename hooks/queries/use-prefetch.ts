/**
 * Prefetch Utility Hook
 * Provides a reusable pattern for prefetching data on hover
 */

import { useCallback, useRef } from 'react';

/**
 * Creates an onMouseEnter handler that triggers a prefetch after a short delay.
 * Useful for prefetching detail pages when hovering over list items.
 *
 * @param prefetchFn - Function to call for prefetching (e.g., from usePrefetchClient)
 * @param delay - Delay in milliseconds before triggering prefetch (default: 100)
 * @returns Object with onMouseEnter and onMouseLeave handlers
 *
 * @example
 * const prefetchClient = usePrefetchClient();
 * const { onMouseEnter, onMouseLeave } = usePrefetchOnHover(
 *   () => prefetchClient(clientId),
 *   100
 * );
 *
 * return <tr onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>...</tr>
 */
export function usePrefetchOnHover(
  prefetchFn: () => void,
  delay: number = 100
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasPrefetchedRef = useRef(false);

  const onMouseEnter = useCallback(() => {
    // Only prefetch once per mount
    if (hasPrefetchedRef.current) return;

    timeoutRef.current = setTimeout(() => {
      prefetchFn();
      hasPrefetchedRef.current = true;
    }, delay);
  }, [prefetchFn, delay]);

  const onMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return { onMouseEnter, onMouseLeave };
}

/**
 * Higher-order hook for creating prefetch handlers for specific IDs.
 * Useful when you need to create handlers for multiple items in a list.
 *
 * @param prefetchFn - Prefetch function that takes an ID
 * @param delay - Delay in milliseconds before triggering prefetch
 * @returns Function that creates event handlers for a specific ID
 *
 * @example
 * const prefetchClient = usePrefetchClient();
 * const createPrefetchHandlers = useCreatePrefetchHandlers(prefetchClient);
 *
 * {clients.map(client => {
 *   const { onMouseEnter, onMouseLeave } = createPrefetchHandlers(client.id);
 *   return <tr key={client.id} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>...</tr>
 * })}
 */
export function useCreatePrefetchHandlers<TId extends string>(
  prefetchFn: (id: TId) => void,
  delay: number = 100
) {
  const prefetchedIds = useRef(new Set<TId>());
  const timeoutRefs = useRef(new Map<TId, ReturnType<typeof setTimeout>>());

  return useCallback(
    (id: TId) => {
      const onMouseEnter = () => {
        if (prefetchedIds.current.has(id)) return;

        const timeout = setTimeout(() => {
          prefetchFn(id);
          prefetchedIds.current.add(id);
        }, delay);

        timeoutRefs.current.set(id, timeout);
      };

      const onMouseLeave = () => {
        const timeout = timeoutRefs.current.get(id);
        if (timeout) {
          clearTimeout(timeout);
          timeoutRefs.current.delete(id);
        }
      };

      return { onMouseEnter, onMouseLeave };
    },
    [prefetchFn, delay]
  );
}
