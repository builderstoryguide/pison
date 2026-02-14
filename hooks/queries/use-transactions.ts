/**
 * Transaction Hooks
 * React Query hooks for transaction data fetching and mutations
 * Includes optimistic updates for approval/rejection flows
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { transactionKeys, clientKeys } from './query-keys';

// Types
export interface Transaction {
  id: string;
  transactionNumber: string;
  accountId: string;
  type:
    | 'DEPOSIT'
    | 'WITHDRAWAL'
    | 'COLLECTION'
    | 'LOAN_DISBURSEMENT'
    | 'LOAN_REPAYMENT'
    | 'TRANSFER'
    | 'COMMISSION'
    | 'ADJUSTMENT';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
  description?: string;
  reference?: string;
  rejectedReason?: string;
  areaId?: string;
  agentId?: string;
  createdAt: string;
  approvedAt?: string;
  createdBy: string;
  approvedBy?: string;
  account?: {
    id: string;
    accountNumber: string;
    balance: string;
    client?: {
      id: string;
      clientNumber: string;
      fullName: string;
    };
    agent?: {
      id: string;
      agentCode: string;
      fullName: string;
    };
  };
  area?: {
    id: string;
    code: string;
    name: string;
  };
  agent?: {
    id: string;
    agentCode: string;
    fullName: string;
  };
  creator?: {
    id: string;
    name: string;
    email: string;
  };
  approver?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface TransactionFilters {
  type?: string;
  areaId?: string;
  agentId?: string;
  accountId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface CreateTransactionInput {
  accountId: string;
  type: Transaction['type'];
  amount: number;
  description?: string;
  reference?: string;
  areaId?: string;
  agentId?: string;
}

// Fetchers
async function fetchPendingTransactions(
  filters: TransactionFilters = {}
): Promise<Transaction[]> {
  const params = new URLSearchParams();
  if (filters.type) params.append('type', filters.type);
  if (filters.areaId) params.append('areaId', filters.areaId);
  if (filters.agentId) params.append('agentId', filters.agentId);
  if (filters.accountId) params.append('accountId', filters.accountId);

  const response = await apiFetch(`/api/transactions/pending?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch pending transactions');
  }
  const result = await response.json();
  return result.data || [];
}

async function fetchTransaction(id: string): Promise<Transaction> {
  const response = await apiFetch(`/api/transactions/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch transaction');
  }
  const result = await response.json();
  return result.data;
}

async function fetchAllTransactions(
  filters: TransactionFilters = {}
): Promise<Transaction[]> {
  const params = new URLSearchParams();
  if (filters.type) params.append('type', filters.type);
  if (filters.status) params.append('status', filters.status);
  if (filters.accountId) params.append('accountId', filters.accountId);
  if (filters.areaId) params.append('areaId', filters.areaId);
  if (filters.agentId) params.append('agentId', filters.agentId);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  params.append('limit', '100');

  const response = await apiFetch(`/api/transactions?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch transactions');
  }
  const result = await response.json();
  return result.data || [];
}

async function fetchTransactionsByAccount(
  accountId: string,
  filters: TransactionFilters = {}
): Promise<Transaction[]> {
  return fetchAllTransactions({ ...filters, accountId });
}

// Query Hooks
export function usePendingTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: transactionKeys.pendingFiltered({
      type: filters.type,
      areaId: filters.areaId,
      agentId: filters.agentId,
      accountId: filters.accountId,
    }),
    queryFn: () => fetchPendingTransactions(filters),
  });
}

export function useTransaction(id: string, enabled = true) {
  return useQuery({
    queryKey: transactionKeys.detail(id),
    queryFn: () => fetchTransaction(id),
    enabled: !!id && enabled,
  });
}

export function useTransactions(
  filters: TransactionFilters = {},
  enabled = true
) {
  return useQuery({
    queryKey: transactionKeys.list({
      type: filters.type,
      status: filters.status,
      accountId: filters.accountId,
      areaId: filters.areaId,
      agentId: filters.agentId,
      startDate: filters.startDate,
      endDate: filters.endDate,
    }),
    queryFn: () => fetchAllTransactions(filters),
    enabled,
  });
}

export function useTransactionsByAccount(
  accountId: string,
  filters: TransactionFilters = {},
  enabled = true
) {
  return useQuery({
    queryKey: transactionKeys.byAccountFiltered(accountId, {
      type: filters.type,
      status: filters.status,
      startDate: filters.startDate,
      endDate: filters.endDate,
    }),
    queryFn: () => fetchTransactionsByAccount(accountId, filters),
    enabled: !!accountId && enabled,
  });
}

// Mutation Hooks with Optimistic Updates
export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTransactionInput) => {
      const response = await apiFetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create transaction');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.pending() });
      if (variables.accountId) {
        queryClient.invalidateQueries({
          queryKey: transactionKeys.byAccount(variables.accountId),
        });
      }
    },
  });
}

export interface CreateTransferInput {
  sourceAccountId: string;
  destinationAccountId: string;
  amount: number;
  description?: string;
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTransferInput) => {
      const response = await apiFetch('/api/transactions/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create transfer');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.pending() });
      queryClient.invalidateQueries({
        queryKey: transactionKeys.byAccount(variables.sourceAccountId),
      });
      queryClient.invalidateQueries({
        queryKey: transactionKeys.byAccount(variables.destinationAccountId),
      });
    },
  });
}

export function useApproveTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const response = await apiFetch(`/api/transactions/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to approve transaction');
      }

      return response.json();
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: transactionKeys.pending() });
      await queryClient.cancelQueries({ queryKey: transactionKeys.detail(id) });

      // Snapshot pending transactions
      const previousPending: Array<{
        queryKey: readonly unknown[];
        data: Transaction[] | undefined;
      }> = [];

      queryClient
        .getQueriesData<Transaction[]>({ queryKey: transactionKeys.pending() })
        .forEach(([queryKey, data]) => {
          previousPending.push({ queryKey, data });
        });

      // Optimistically remove from pending list (will be APPROVED)
      queryClient.setQueriesData<Transaction[]>(
        { queryKey: transactionKeys.pending() },
        (old) => old?.filter((tx) => tx.id !== id)
      );

      // Optimistically update detail status
      const previousTransaction = queryClient.getQueryData<Transaction>(
        transactionKeys.detail(id)
      );
      if (previousTransaction) {
        queryClient.setQueryData<Transaction>(transactionKeys.detail(id), {
          ...previousTransaction,
          status: 'APPROVED',
        });
      }

      return { previousPending, previousTransaction };
    },
    onError: (_err, { id }, context) => {
      // Rollback pending lists
      context?.previousPending.forEach(({ queryKey, data }) => {
        queryClient.setQueryData(queryKey, data);
      });
      // Rollback detail
      if (context?.previousTransaction) {
        queryClient.setQueryData(transactionKeys.detail(id), context.previousTransaction);
      }
    },
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.pending() });
      queryClient.invalidateQueries({ queryKey: transactionKeys.detail(id) });
      // Also invalidate client data as balances may have changed
      queryClient.invalidateQueries({ queryKey: clientKeys.all });
    },
  });
}

export function useRejectTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await apiFetch(`/api/transactions/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to reject transaction');
      }

      return response.json();
    },
    onMutate: async ({ id, reason }) => {
      await queryClient.cancelQueries({ queryKey: transactionKeys.pending() });
      await queryClient.cancelQueries({ queryKey: transactionKeys.detail(id) });

      const previousPending: Array<{
        queryKey: readonly unknown[];
        data: Transaction[] | undefined;
      }> = [];

      queryClient
        .getQueriesData<Transaction[]>({ queryKey: transactionKeys.pending() })
        .forEach(([queryKey, data]) => {
          previousPending.push({ queryKey, data });
        });

      // Optimistically remove from pending list
      queryClient.setQueriesData<Transaction[]>(
        { queryKey: transactionKeys.pending() },
        (old) => old?.filter((tx) => tx.id !== id)
      );

      const previousTransaction = queryClient.getQueryData<Transaction>(
        transactionKeys.detail(id)
      );
      if (previousTransaction) {
        queryClient.setQueryData<Transaction>(transactionKeys.detail(id), {
          ...previousTransaction,
          status: 'REJECTED',
          rejectedReason: reason,
        });
      }

      return { previousPending, previousTransaction };
    },
    onError: (_err, { id }, context) => {
      context?.previousPending.forEach(({ queryKey, data }) => {
        queryClient.setQueryData(queryKey, data);
      });
      if (context?.previousTransaction) {
        queryClient.setQueryData(transactionKeys.detail(id), context.previousTransaction);
      }
    },
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.pending() });
      queryClient.invalidateQueries({ queryKey: transactionKeys.detail(id) });
    },
  });
}

// Prefetch Hook
export function usePrefetchTransaction() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: transactionKeys.detail(id),
      queryFn: () => fetchTransaction(id),
      staleTime: 2 * 60 * 1000, // 2 minutes for transactions (more time-sensitive)
    });
  };
}
