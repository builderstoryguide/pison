/**
 * Collection Area Hooks
 * React Query hooks for collection area data fetching and mutations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { collectionAreaKeys } from './query-keys';

// Types
export interface CollectionArea {
  id: string;
  code: string;
  name: string;
  description?: string;
  city?: string;
  region?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  _count?: {
    clients: number;
    agents: number;
  };
}

export interface CollectionAreaFilters {
  status?: string;
}

export interface CreateCollectionAreaInput {
  code: string;
  name: string;
  description?: string;
  city?: string;
  region?: string;
}

export interface UpdateCollectionAreaInput extends Partial<CreateCollectionAreaInput> {
  status?: 'ACTIVE' | 'INACTIVE';
}

// Fetchers
async function fetchCollectionAreas(filters: CollectionAreaFilters = {}): Promise<CollectionArea[]> {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== 'all') {
    params.append('status', filters.status);
  }

  const response = await apiFetch(`/api/collection-areas?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch collection areas');
  }
  const result = await response.json();
  return result.data || [];
}

async function fetchCollectionArea(id: string): Promise<CollectionArea> {
  const response = await apiFetch(`/api/collection-areas/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch collection area');
  }
  const result = await response.json();
  return result.data;
}

// Query Hooks
export function useCollectionAreas(filters: CollectionAreaFilters = {}) {
  return useQuery({
    queryKey: collectionAreaKeys.list({ status: filters.status }),
    queryFn: () => fetchCollectionAreas(filters),
  });
}

export function useCollectionArea(id: string, enabled = true) {
  return useQuery({
    queryKey: collectionAreaKeys.detail(id),
    queryFn: () => fetchCollectionArea(id),
    enabled: !!id && enabled,
  });
}

// Mutation Hooks with Optimistic Updates
export function useCreateCollectionArea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCollectionAreaInput) => {
      const response = await apiFetch('/api/collection-areas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create collection area');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectionAreaKeys.lists() });
    },
  });
}

export function useUpdateCollectionArea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCollectionAreaInput }) => {
      const response = await apiFetch(`/api/collection-areas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update collection area');
      }

      return response.json();
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: collectionAreaKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: collectionAreaKeys.lists() });

      const previousArea = queryClient.getQueryData<CollectionArea>(
        collectionAreaKeys.detail(id)
      );

      if (previousArea) {
        queryClient.setQueryData<CollectionArea>(collectionAreaKeys.detail(id), {
          ...previousArea,
          ...data,
        });
      }

      queryClient.setQueriesData<CollectionArea[]>(
        { queryKey: collectionAreaKeys.lists() },
        (old) =>
          old?.map((area) => (area.id === id ? { ...area, ...data } : area))
      );

      return { previousArea };
    },
    onError: (_err, { id }, context) => {
      if (context?.previousArea) {
        queryClient.setQueryData(collectionAreaKeys.detail(id), context.previousArea);
      }
      queryClient.invalidateQueries({ queryKey: collectionAreaKeys.lists() });
    },
    onSettled: (_data, _error, { id }) => {
      queryClient.invalidateQueries({ queryKey: collectionAreaKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: collectionAreaKeys.lists() });
    },
  });
}

export function useDeleteCollectionArea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiFetch(`/api/collection-areas/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to delete collection area');
      }

      return response.json();
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: collectionAreaKeys.lists() });

      const previousLists: Array<{
        queryKey: readonly unknown[];
        data: CollectionArea[] | undefined;
      }> = [];

      queryClient
        .getQueriesData<CollectionArea[]>({ queryKey: collectionAreaKeys.lists() })
        .forEach(([queryKey, data]) => {
          previousLists.push({ queryKey, data });
        });

      queryClient.setQueriesData<CollectionArea[]>(
        { queryKey: collectionAreaKeys.lists() },
        (old) => old?.filter((area) => area.id !== id)
      );

      return { previousLists };
    },
    onError: (_err, _id, context) => {
      context?.previousLists.forEach(({ queryKey, data }) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: collectionAreaKeys.lists() });
    },
  });
}

// Prefetch Hook
export function usePrefetchCollectionArea() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: collectionAreaKeys.detail(id),
      queryFn: () => fetchCollectionArea(id),
      staleTime: 5 * 60 * 1000,
    });
  };
}
