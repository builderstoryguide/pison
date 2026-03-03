/**
 * Agent Hooks
 * React Query hooks for agent data fetching and mutations
 * Includes optimistic updates for instant UI feedback
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { agentKeys } from './query-keys';

// Types
export interface Agent {
  id: string;
  agentCode: string;
  userId: string;
  fullName: string;
  nationalId?: string;
  phone?: string;
  email?: string;
  address?: string;
  hireDate?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  account?: {
    id: string;
    accountNumber: string;
    balance: string;
  };
  areas?: Array<{
    id: string;
    code: string;
    name: string;
  }>;
  _count?: {
    transactions: number;
    clients: number;
  };
}

export interface AgentFilters {
  status?: string;
  areaId?: string;
}

export interface CreateAgentInput {
  fullName: string;
  nationalId?: string;
  phone?: string;
  email?: string;
  address?: string;
  hireDate?: string;
  areaIds?: string[];
}

export interface UpdateAgentInput extends Partial<CreateAgentInput> {
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

// Fetchers
async function fetchAgents(filters: AgentFilters = {}): Promise<Agent[]> {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== 'all') {
    params.append('status', filters.status);
  }
  if (filters.areaId && filters.areaId !== 'all') {
    params.append('areaId', filters.areaId);
  }

  const response = await apiFetch(`/api/agents?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch agents');
  }
  const result = await response.json();
  return result.data || [];
}

async function fetchAgent(id: string): Promise<Agent> {
  const response = await apiFetch(`/api/agents/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch agent');
  }
  const result = await response.json();
  return result.data;
}

// Query Hooks
export function useAgents(filters: AgentFilters = {}) {
  return useQuery({
    queryKey: agentKeys.list({
      status: filters.status,
      areaId: filters.areaId,
    }),
    queryFn: () => fetchAgents(filters),
  });
}

export function useAgent(id: string, enabled = true) {
  return useQuery({
    queryKey: agentKeys.detail(id),
    queryFn: () => fetchAgent(id),
    enabled: !!id && enabled,
  });
}

// Mutation Hooks with Optimistic Updates
export function useCreateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAgentInput) => {
      const response = await apiFetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create agent');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.lists() });
    },
  });
}

export function useUpdateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAgentInput }) => {
      const response = await apiFetch(`/api/agents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update agent');
      }

      return response.json();
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: agentKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: agentKeys.lists() });

      const previousAgent = queryClient.getQueryData<Agent>(agentKeys.detail(id));

      if (previousAgent) {
        queryClient.setQueryData<Agent>(agentKeys.detail(id), {
          ...previousAgent,
          ...data,
        });
      }

      queryClient.setQueriesData<Agent[]>(
        { queryKey: agentKeys.lists() },
        (old) =>
          old?.map((agent) =>
            agent.id === id ? { ...agent, ...data } : agent
          )
      );

      return { previousAgent };
    },
    onError: (_err, { id }, context) => {
      if (context?.previousAgent) {
        queryClient.setQueryData(agentKeys.detail(id), context.previousAgent);
      }
      queryClient.invalidateQueries({ queryKey: agentKeys.lists() });
    },
    onSettled: (_data, _error, { id }) => {
      queryClient.invalidateQueries({ queryKey: agentKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: agentKeys.lists() });
    },
  });
}

export function useDeleteAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiFetch(`/api/agents/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to delete agent');
      }

      return response.json();
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: agentKeys.lists() });

      const previousLists: Array<{
        queryKey: readonly unknown[];
        data: Agent[] | undefined;
      }> = [];

      queryClient.getQueriesData<Agent[]>({ queryKey: agentKeys.lists() }).forEach(
        ([queryKey, data]) => {
          previousLists.push({ queryKey, data });
        }
      );

      queryClient.setQueriesData<Agent[]>(
        { queryKey: agentKeys.lists() },
        (old) => old?.filter((agent) => agent.id !== id)
      );

      return { previousLists };
    },
    onError: (_err, _id, context) => {
      context?.previousLists.forEach(({ queryKey, data }) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.lists() });
    },
  });
}

// Prefetch Hook
export function usePrefetchAgent() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: agentKeys.detail(id),
      queryFn: () => fetchAgent(id),
      staleTime: 5 * 60 * 1000,
    });
  };
}
