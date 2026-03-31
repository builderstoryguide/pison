import { $Enums } from '@prisma/client';
import type { UserStatus } from '@/app/models/user';

/** Badge variant used by UI status chips (aligns with Badge component variants). */
export type StatusBadgeVariant = 'success' | 'warning' | 'destructive' | 'secondary';

const UNKNOWN: { labelKey: string; variant: StatusBadgeVariant } = {
  labelKey: 'status.unknown',
  variant: 'secondary',
};

/** Ordered user statuses for filters and forms (DB enum order independent). */
export const USER_STATUS_VALUES: UserStatus[] = [
  $Enums.UserStatus.ACTIVE,
  $Enums.UserStatus.INACTIVE,
  $Enums.UserStatus.BLOCKED,
];

const USER_STATUS_MAP: Record<
  $Enums.UserStatus,
  { labelKey: string; variant: StatusBadgeVariant }
> = {
  [$Enums.UserStatus.ACTIVE]: {
    labelKey: 'status.user.ACTIVE',
    variant: 'success',
  },
  [$Enums.UserStatus.INACTIVE]: {
    labelKey: 'status.user.INACTIVE',
    variant: 'warning',
  },
  [$Enums.UserStatus.BLOCKED]: {
    labelKey: 'status.user.BLOCKED',
    variant: 'destructive',
  },
};

export function getUserStatusPresentation(status: string): {
  labelKey: string;
  variant: StatusBadgeVariant;
} {
  const s = status as $Enums.UserStatus;
  return USER_STATUS_MAP[s] ?? UNKNOWN;
}

/** @deprecated Use getUserStatusPresentation — alias for incremental migration */
export const getUserStatusProps = getUserStatusPresentation;

const ACCOUNT_STATUS_MAP: Record<
  $Enums.AccountStatus,
  { labelKey: string; variant: StatusBadgeVariant }
> = {
  [$Enums.AccountStatus.ACTIVE]: {
    labelKey: 'status.account.ACTIVE',
    variant: 'success',
  },
  [$Enums.AccountStatus.FROZEN]: {
    labelKey: 'status.account.FROZEN',
    variant: 'warning',
  },
  [$Enums.AccountStatus.CLOSED]: {
    labelKey: 'status.account.CLOSED',
    variant: 'destructive',
  },
};

export function getFinancialAccountStatusPresentation(status: string): {
  labelKey: string;
  variant: StatusBadgeVariant;
} {
  const s = status as $Enums.AccountStatus;
  return ACCOUNT_STATUS_MAP[s] ?? UNKNOWN;
}

const TRANSACTION_STATUS_MAP: Record<
  $Enums.TransactionStatus,
  { labelKey: string; variant: StatusBadgeVariant }
> = {
  [$Enums.TransactionStatus.PENDING_APPROVAL]: {
    labelKey: 'status.transaction.PENDING_APPROVAL',
    variant: 'warning',
  },
  [$Enums.TransactionStatus.APPROVED]: {
    labelKey: 'status.transaction.APPROVED',
    variant: 'secondary',
  },
  [$Enums.TransactionStatus.REJECTED]: {
    labelKey: 'status.transaction.REJECTED',
    variant: 'destructive',
  },
  [$Enums.TransactionStatus.COMPLETED]: {
    labelKey: 'status.transaction.COMPLETED',
    variant: 'success',
  },
  [$Enums.TransactionStatus.REVERSED]: {
    labelKey: 'status.transaction.REVERSED',
    variant: 'secondary',
  },
};

export function getTransactionStatusPresentation(status: string): {
  labelKey: string;
  variant: StatusBadgeVariant;
} {
  const s = status as $Enums.TransactionStatus;
  return TRANSACTION_STATUS_MAP[s] ?? UNKNOWN;
}

const LOAN_STATUS_MAP: Record<
  $Enums.LoanStatus,
  { labelKey: string; variant: StatusBadgeVariant }
> = {
  [$Enums.LoanStatus.PENDING]: {
    labelKey: 'status.loan.PENDING',
    variant: 'warning',
  },
  [$Enums.LoanStatus.APPROVED]: {
    labelKey: 'status.loan.APPROVED',
    variant: 'secondary',
  },
  [$Enums.LoanStatus.DISBURSED]: {
    labelKey: 'status.loan.DISBURSED',
    variant: 'success',
  },
  [$Enums.LoanStatus.ACTIVE]: {
    labelKey: 'status.loan.ACTIVE',
    variant: 'success',
  },
  [$Enums.LoanStatus.PAID_OFF]: {
    labelKey: 'status.loan.PAID_OFF',
    variant: 'success',
  },
  [$Enums.LoanStatus.DEFAULTED]: {
    labelKey: 'status.loan.DEFAULTED',
    variant: 'destructive',
  },
  [$Enums.LoanStatus.CANCELLED]: {
    labelKey: 'status.loan.CANCELLED',
    variant: 'secondary',
  },
};

export function getLoanStatusPresentation(status: string): {
  labelKey: string;
  variant: StatusBadgeVariant;
} {
  const s = status as $Enums.LoanStatus;
  return LOAN_STATUS_MAP[s] ?? UNKNOWN;
}

const AREA_STATUS_MAP: Record<
  $Enums.AreaStatus,
  { labelKey: string; variant: StatusBadgeVariant }
> = {
  [$Enums.AreaStatus.ACTIVE]: {
    labelKey: 'status.area.ACTIVE',
    variant: 'success',
  },
  [$Enums.AreaStatus.INACTIVE]: {
    labelKey: 'status.area.INACTIVE',
    variant: 'secondary',
  },
};

export function getAreaStatusPresentation(status: string): {
  labelKey: string;
  variant: StatusBadgeVariant;
} {
  const s = status as $Enums.AreaStatus;
  return AREA_STATUS_MAP[s] ?? UNKNOWN;
}

const CLIENT_STATUS_MAP: Record<
  $Enums.ClientStatus,
  { labelKey: string; variant: StatusBadgeVariant }
> = {
  [$Enums.ClientStatus.ACTIVE]: {
    labelKey: 'status.client.ACTIVE',
    variant: 'success',
  },
  [$Enums.ClientStatus.INACTIVE]: {
    labelKey: 'status.client.INACTIVE',
    variant: 'warning',
  },
  [$Enums.ClientStatus.SUSPENDED]: {
    labelKey: 'status.client.SUSPENDED',
    variant: 'warning',
  },
  [$Enums.ClientStatus.CLOSED]: {
    labelKey: 'status.client.CLOSED',
    variant: 'secondary',
  },
};

export function getClientStatusPresentation(status: string): {
  labelKey: string;
  variant: StatusBadgeVariant;
} {
  const s = status as $Enums.ClientStatus;
  return CLIENT_STATUS_MAP[s] ?? UNKNOWN;
}

const AGENT_STATUS_MAP: Record<
  $Enums.AgentStatus,
  { labelKey: string; variant: StatusBadgeVariant }
> = {
  [$Enums.AgentStatus.ACTIVE]: {
    labelKey: 'status.agent.ACTIVE',
    variant: 'success',
  },
  [$Enums.AgentStatus.INACTIVE]: {
    labelKey: 'status.agent.INACTIVE',
    variant: 'secondary',
  },
  [$Enums.AgentStatus.SUSPENDED]: {
    labelKey: 'status.agent.SUSPENDED',
    variant: 'warning',
  },
};

export function getAgentStatusPresentation(status: string): {
  labelKey: string;
  variant: StatusBadgeVariant;
} {
  const s = status as $Enums.AgentStatus;
  return AGENT_STATUS_MAP[s] ?? UNKNOWN;
}
