import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export interface SessionStatusData {
  session: {
    id: string;
    sessionDate: string;
    status: 'OPEN' | 'CLOSED' | 'LOCKED';
    openedAt: string;
    closedAt?: string;
    openedBy?: {
      name: string;
    };
    closedBy?: {
      name: string;
    };
  } | null;
  isOpen: boolean;
  systemBalance: number;
}

export function useSessionStatus() {
  return useQuery({
    queryKey: ['session-status'],
    queryFn: async () => {
      const response = await apiFetch('/api/operations/session');
      if (!response.ok) {
        throw new Error('Failed to fetch session status');
      }
      const result = await response.json();
      return result.data as SessionStatusData;
    },
    // Refetch every minute to keep status fresh
    refetchInterval: 60000, 
    staleTime: 30000,
  });
}
