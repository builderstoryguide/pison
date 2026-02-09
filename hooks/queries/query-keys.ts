/**
 * Query Keys Factory
 * Centralized query key management for React Query
 * Provides type-safe, consistent cache keys across the application
 */

export const clientKeys = {
  all: ['clients'] as const,
  lists: () => [...clientKeys.all, 'list'] as const,
  list: (filters: Record<string, string | undefined>) =>
    [...clientKeys.lists(), filters] as const,
  details: () => [...clientKeys.all, 'detail'] as const,
  detail: (id: string) => [...clientKeys.details(), id] as const,
};

export const agentKeys = {
  all: ['agents'] as const,
  lists: () => [...agentKeys.all, 'list'] as const,
  list: (filters: Record<string, string | undefined>) =>
    [...agentKeys.lists(), filters] as const,
  details: () => [...agentKeys.all, 'detail'] as const,
  detail: (id: string) => [...agentKeys.details(), id] as const,
  areas: (id: string) => [...agentKeys.detail(id), 'areas'] as const,
};

export const collectionAreaKeys = {
  all: ['collection-areas'] as const,
  lists: () => [...collectionAreaKeys.all, 'list'] as const,
  list: (filters: Record<string, string | undefined>) =>
    [...collectionAreaKeys.lists(), filters] as const,
  details: () => [...collectionAreaKeys.all, 'detail'] as const,
  detail: (id: string) => [...collectionAreaKeys.details(), id] as const,
};

export const transactionKeys = {
  all: ['transactions'] as const,
  lists: () => [...transactionKeys.all, 'list'] as const,
  list: (filters: Record<string, string | undefined>) =>
    [...transactionKeys.lists(), filters] as const,
  pending: () => [...transactionKeys.all, 'pending'] as const,
  pendingFiltered: (filters: Record<string, string | undefined>) =>
    [...transactionKeys.pending(), filters] as const,
  details: () => [...transactionKeys.all, 'detail'] as const,
  detail: (id: string) => [...transactionKeys.details(), id] as const,
  byAccount: (accountId: string) =>
    [...transactionKeys.all, 'account', accountId] as const,
};

export const loanKeys = {
  all: ['loans'] as const,
  lists: () => [...loanKeys.all, 'list'] as const,
  list: (filters: Record<string, string | undefined>) =>
    [...loanKeys.lists(), filters] as const,
  details: () => [...loanKeys.all, 'detail'] as const,
  detail: (id: string) => [...loanKeys.details(), id] as const,
  byClient: (clientId: string) =>
    [...loanKeys.all, 'client', clientId] as const,
};

export const dashboardKeys = {
  admin: ['dashboard', 'admin'] as const,
  agent: ['dashboard', 'agent'] as const,
  accountant: ['dashboard', 'accountant'] as const,
  client: ['dashboard', 'client'] as const,
};

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: Record<string, string | undefined>) =>
    [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};
