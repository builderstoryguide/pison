/**
 * Client Hooks
 * React Query hooks for client data fetching and mutations
 * Includes optimistic updates for instant UI feedback
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { clientKeys } from './query-keys';

// Types
export interface Client {
  id: string;
  clientNumber: string;
  fullName: string;
  nationalId?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  areaId: string;
  area?: {
    id: string;
    code: string;
    name: string;
  };
  account?: {
    id: string;
    accountNumber: string;
    balance: string;
    availableBalance: string;
    status: string;
  };
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'CLOSED';
  isCommissionExempt: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    transactions: number;
    loans: number;
  };
}

export interface ClientFilters {
  status?: string;
  areaId?: string;
  search?: string;
}

export interface CreateClientInput {
  fullName: string;
  nationalId?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  areaId: string;
  isCommissionExempt?: boolean;
}

export interface UpdateClientInput extends Partial<CreateClientInput> {
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'CLOSED';
}

// Fetchers
async function fetchClients(filters: ClientFilters = {}): Promise<Client[]> {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== 'all') {
    params.append('status', filters.status);
  }
  if (filters.areaId && filters.areaId !== 'all') {
    params.append('areaId', filters.areaId);
  }
  if (filters.search) {
    params.append('search', filters.search);
  }

  const response = await apiFetch(`/api/clients?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch clients');
  }
  const result = await response.json();
  return result.data || [];
}

async function fetchClient(id: string): Promise<Client> {
  const response = await apiFetch(`/api/clients/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch client');
  }
  const result = await response.json();
  return result.data;
}

// Query Hooks
export function useClients(filters: ClientFilters = {}) {
  return useQuery({
    queryKey: clientKeys.list({
      status: filters.status,
      areaId: filters.areaId,
      search: filters.search,
    }),
    queryFn: () => fetchClients(filters),
  });
}

export function useClient(id: string, enabled = true) {
  return useQuery({
    queryKey: clientKeys.detail(id),
    queryFn: () => fetchClient(id),
    enabled: !!id && enabled,
  });
}

// Mutation Hooks with Optimistic Updates
export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateClientInput) => {
      const response = await apiFetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create client');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch clients list
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateClientInput }) => {
      const response = await apiFetch(`/api/clients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update client');
      }

      return response.json();
    },
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: clientKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: clientKeys.lists() });

      // Snapshot previous value
      const previousClient = queryClient.getQueryData<Client>(clientKeys.detail(id));

      // Optimistically update the detail cache
      if (previousClient) {
        queryClient.setQueryData<Client>(clientKeys.detail(id), {
          ...previousClient,
          ...data,
        });
      }

      // Optimistically update any lists containing this client
      queryClient.setQueriesData<Client[]>(
        { queryKey: clientKeys.lists() },
        (old) =>
          old?.map((client) =>
            client.id === id ? { ...client, ...data } : client
          )
      );

      return { previousClient };
    },
    onError: (_err, { id }, context) => {
      // Rollback on error
      if (context?.previousClient) {
        queryClient.setQueryData(clientKeys.detail(id), context.previousClient);
      }
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
    },
    onSettled: (_data, _error, { id }) => {
      // Refetch to ensure fresh data
      queryClient.invalidateQueries({ queryKey: clientKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiFetch(`/api/clients/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to delete client');
      }

      return response.json();
    },
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: clientKeys.lists() });

      // Snapshot all list queries
      const previousLists: Array<{
        queryKey: readonly unknown[];
        data: Client[] | undefined;
      }> = [];

      queryClient.getQueriesData<Client[]>({ queryKey: clientKeys.lists() }).forEach(
        ([queryKey, data]) => {
          previousLists.push({ queryKey, data });
        }
      );

      // Optimistically remove client from all lists
      queryClient.setQueriesData<Client[]>(
        { queryKey: clientKeys.lists() },
        (old) => old?.filter((client) => client.id !== id)
      );

      return { previousLists };
    },
    onError: (_err, _id, context) => {
      // Rollback on error
      context?.previousLists.forEach(({ queryKey, data }) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      // Refetch to ensure fresh data
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
    },
  });
}

// Prefetch Hook
export function usePrefetchClient() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: clientKeys.detail(id),
      queryFn: () => fetchClient(id),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };
}
