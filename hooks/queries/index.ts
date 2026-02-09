/**
 * Query Hooks - Central Export
 * Re-exports all query hooks and keys for easy imports
 */

// Query Keys
export * from './query-keys';

// Client Hooks
export {
  useClients,
  useClient,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
  usePrefetchClient,
  type Client,
  type ClientFilters,
  type CreateClientInput,
  type UpdateClientInput,
} from './use-clients';

// Agent Hooks
export {
  useAgents,
  useAgent,
  useCreateAgent,
  useUpdateAgent,
  useDeleteAgent,
  usePrefetchAgent,
  type Agent,
  type AgentFilters,
  type CreateAgentInput,
  type UpdateAgentInput,
} from './use-agents';

// Collection Area Hooks
export {
  useCollectionAreas,
  useCollectionArea,
  useCreateCollectionArea,
  useUpdateCollectionArea,
  useDeleteCollectionArea,
  usePrefetchCollectionArea,
  type CollectionArea,
  type CollectionAreaFilters,
  type CreateCollectionAreaInput,
  type UpdateCollectionAreaInput,
} from './use-collection-areas';

// Transaction Hooks
export {
  usePendingTransactions,
  useTransaction,
  useTransactionsByAccount,
  useCreateTransaction,
  useApproveTransaction,
  useRejectTransaction,
  usePrefetchTransaction,
  type Transaction,
  type TransactionFilters,
  type CreateTransactionInput,
} from './use-transactions';

// Loan Hooks
export {
  useLoans,
  useLoan,
  useLoansByClient,
  useCreateLoan,
  useApproveLoan,
  useDisburseLoan,
  usePrefetchLoan,
  type Loan,
  type LoanFilters,
  type CreateLoanInput,
} from './use-loans';

// Prefetch Utility
export { usePrefetchOnHover } from './use-prefetch';
