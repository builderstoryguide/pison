/**
 * Audit Logs Hook
 * React Query hook for fetching audit logs (manager view)
 */

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { auditLogKeys } from './query-keys';

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  transactionId: string | null;
  changes: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  description: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string | null;
    email: string | null;
  };
  transaction?: {
    id: string;
    transactionNumber: string;
    type: string;
    amount: string;
    status: string;
  } | null;
}

export interface AuditLogFilters {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  userId?: string;
  entityType?: string;
  action?: string;
  entityId?: string;
}

export interface AuditLogsResponse {
  success: boolean;
  data: AuditLog[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

export function useAuditLogs(filters: AuditLogFilters = {}) {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  if (filters.userId) params.set('userId', filters.userId);
  if (filters.entityType) params.set('entityType', filters.entityType);
  if (filters.action) params.set('action', filters.action);
  if (filters.entityId) params.set('entityId', filters.entityId);

  const queryString = params.toString();
  const url = `/api/audit-logs${queryString ? `?${queryString}` : ''}`;

  return useQuery({
    queryKey: auditLogKeys.list(filters),
    queryFn: async ({ signal }) => {
      const res = await apiFetch(url, { signal });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || 'Failed to fetch audit logs');
      }
      return res.json() as Promise<AuditLogsResponse>;
    },
  });
}
