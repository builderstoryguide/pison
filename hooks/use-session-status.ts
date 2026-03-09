import { useQuery } from '@tanstack/react-query';
import { useSession, signOut } from 'next-auth/react';
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

/** Parse API error response for a user-friendly message */
async function parseApiError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    const msg = body?.error?.message;
    if (typeof msg === 'string' && msg.trim()) return msg;
  } catch {
    // Response body may not be JSON
  }
  if (response.status === 401) return 'Your session has expired. Please sign in again.';
  if (response.status === 403) return 'You do not have permission to view session status.';
  return 'Failed to fetch session status. Please try again.';
}

export function useSessionStatus() {
  const { data: session, status } = useSession();

  return useQuery({
    queryKey: ['session-status'],
    queryFn: async () => {
      const response = await apiFetch('/api/operations/session');
      if (!response.ok) {
        const message = await parseApiError(response);
        if (response.status === 401) {
          await signOut({ callbackUrl: '/auth/signin' });
        }
        throw new Error(message);
      }
      const result = await response.json();
      return result.data as SessionStatusData;
    },
    // Only run when user is authenticated (prevents 401 from ever firing)
    enabled: status === 'authenticated' && !!session,
    // Refetch every minute to keep status fresh
    refetchInterval: 60000,
    staleTime: 30000,
    // Don't retry auth errors (401/403) - they won't resolve
    retry: (failureCount, error) => {
      const msg = error?.message || '';
      if (msg.includes('session has expired') || msg.includes('Authentication required') || msg.includes('permission')) {
        return false;
      }
      return failureCount < 2;
    },
  });
}
