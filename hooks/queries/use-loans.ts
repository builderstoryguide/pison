/**
 * Loan Hooks
 * React Query hooks for loan data fetching and mutations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { loanKeys, clientKeys } from './query-keys';

// Types
export interface Loan {
  id: string;
  loanNumber: string;
  clientId: string;
  principal: number;
  interestRate: number;
  term: number;
  termUnit: 'DAYS' | 'WEEKS' | 'MONTHS';
  totalInterest: number;
  totalAmount: number;
  amountPaid: number;
  amountRemaining: number;
  status:
    | 'PENDING'
    | 'APPROVED'
    | 'DISBURSED'
    | 'ACTIVE'
    | 'COMPLETED'
    | 'DEFAULTED'
    | 'CANCELLED';
  disbursementDate?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: string;
    clientNumber: string;
    fullName: string;
    area?: {
      id: string;
      name: string;
    };
  };
  approver?: {
    id: string;
    name: string;
  };
}

export interface LoanFilters {
  status?: string;
  clientId?: string;
}

export interface CreateLoanInput {
  clientId: string;
  principal: number;
  interestRate: number;
  term: number;
  termUnit: 'DAYS' | 'WEEKS' | 'MONTHS';
  purpose?: string;
}

// Fetchers
async function fetchLoans(
  filters: LoanFilters = {},
  signal?: AbortSignal
): Promise<Loan[]> {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== 'all') {
    params.append('status', filters.status);
  }
  if (filters.clientId) {
    params.append('clientId', filters.clientId);
  }

  const response = await apiFetch(`/api/loans?${params.toString()}`, { signal });
  if (!response.ok) {
    throw new Error('Failed to fetch loans');
  }
  const result = await response.json();
  return result.data || [];
}

async function fetchLoan(id: string): Promise<Loan> {
  const response = await apiFetch(`/api/loans/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch loan');
  }
  const result = await response.json();
  return result.data;
}

async function fetchLoansByClient(clientId: string): Promise<Loan[]> {
  const response = await apiFetch(`/api/loans?clientId=${clientId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch client loans');
  }
  const result = await response.json();
  return result.data || [];
}

// Query Hooks
export function useLoans(filters: LoanFilters = {}) {
  return useQuery({
    queryKey: loanKeys.list({
      status: filters.status,
      clientId: filters.clientId,
    }),
    queryFn: ({ signal }) => fetchLoans(filters, signal),
  });
}

export function useLoan(id: string, enabled = true) {
  return useQuery({
    queryKey: loanKeys.detail(id),
    queryFn: () => fetchLoan(id),
    enabled: !!id && enabled,
  });
}

export function useLoansByClient(clientId: string, enabled = true) {
  return useQuery({
    queryKey: loanKeys.byClient(clientId),
    queryFn: () => fetchLoansByClient(clientId),
    enabled: !!clientId && enabled,
  });
}

// Mutation Hooks
export function useCreateLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateLoanInput) => {
      const response = await apiFetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create loan');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: loanKeys.lists() });
      if (variables.clientId) {
        queryClient.invalidateQueries({
          queryKey: loanKeys.byClient(variables.clientId),
        });
        // Also invalidate client detail as loan count may change
        queryClient.invalidateQueries({
          queryKey: clientKeys.detail(variables.clientId),
        });
      }
    },
  });
}

export function useApproveLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const response = await apiFetch(`/api/loans/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to approve loan');
      }

      return response.json();
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: loanKeys.detail(id) });

      const previousLoan = queryClient.getQueryData<Loan>(loanKeys.detail(id));

      if (previousLoan) {
        queryClient.setQueryData<Loan>(loanKeys.detail(id), {
          ...previousLoan,
          status: 'APPROVED',
        });
      }

      return { previousLoan };
    },
    onError: (_err, { id }, context) => {
      if (context?.previousLoan) {
        queryClient.setQueryData(loanKeys.detail(id), context.previousLoan);
      }
    },
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: loanKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: loanKeys.lists() });
    },
  });
}

export function useDisburseLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const response = await apiFetch(`/api/loans/${id}/disburse`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to disburse loan');
      }

      return response.json();
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: loanKeys.detail(id) });

      const previousLoan = queryClient.getQueryData<Loan>(loanKeys.detail(id));

      if (previousLoan) {
        queryClient.setQueryData<Loan>(loanKeys.detail(id), {
          ...previousLoan,
          status: 'DISBURSED',
        });
      }

      return { previousLoan };
    },
    onError: (_err, { id }, context) => {
      if (context?.previousLoan) {
        queryClient.setQueryData(loanKeys.detail(id), context.previousLoan);
      }
    },
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: loanKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: loanKeys.lists() });
      // Invalidate client data as balance may have changed
      queryClient.invalidateQueries({ queryKey: clientKeys.all });
    },
  });
}

// Prefetch Hook
export function usePrefetchLoan() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: loanKeys.detail(id),
      queryFn: () => fetchLoan(id),
      staleTime: 5 * 60 * 1000,
    });
  };
}
