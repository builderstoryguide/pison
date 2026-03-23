'use client';

import { useSession } from 'next-auth/react';
import { hasPermission } from '@/lib/auth-client';
import RefillDialog from './refill-dialog';
import WithdrawalDialog from './withdrawal-dialog';
import TransferDialog from './transfer-dialog';

interface AgentAccountActionsProps {
  agentId: string;
  agentName: string;
  accountId: string;
  accountNumber: string;
  availableBalance: number;
}

export default function AgentAccountActions({
  agentId,
  agentName,
  accountId,
  accountNumber,
  availableBalance,
}: AgentAccountActionsProps) {
  const { data: session } = useSession();
  const canManageAccount =
    hasPermission(session, 'agents.edit') ||
    hasPermission(session, 'transactions.create');

  if (!canManageAccount) {
    return null;
  }

  return (
    <div className="flex gap-2">
      <RefillDialog agentId={agentId} agentName={agentName} />
      <WithdrawalDialog
        agentId={agentId}
        accountId={accountId}
        accountNumber={accountNumber}
        agentName={agentName}
        availableBalance={availableBalance}
      />
      <TransferDialog
        agentId={agentId}
        sourceAccountId={accountId}
        sourceAccountNumber={accountNumber}
        agentName={agentName}
        availableBalance={availableBalance}
      />
    </div>
  );
}
