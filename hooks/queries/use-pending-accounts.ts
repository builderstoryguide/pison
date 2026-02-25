/**
 * Pending Accounts Hook
 * Fetches count of clients and agents pending manager approval
 */

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { pendingAccountKeys } from './query-keys';

export function usePendingAccounts(enabled = true, options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: pendingAccountKeys.all,
    queryFn: async () => {
      const response = await apiFetch('/api/accounts/pending');
      if (!response.ok) {
        throw new Error('Failed to fetch pending accounts');
      }
      const result = await response.json();
      return result.data as { clients: unknown[]; agents: unknown[]; total: number };
    },
    enabled,
    refetchInterval: options?.refetchInterval,
  });
}
