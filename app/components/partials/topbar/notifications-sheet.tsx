'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { hasPermission } from '@/lib/auth-client';
import { apiFetch } from '@/lib/api';
import { usePendingTransactions } from '@/hooks/queries/use-transactions';
import { usePendingAccounts } from '@/hooks/queries/use-pending-accounts';
import { loanKeys } from '@/hooks/queries/query-keys';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { useTranslation } from '@/hooks/useTranslation';
import { formatCurrency, formatDateTime } from '@/lib/helpers';
import {
  ArrowDown,
  ArrowUp,
  Bell,
  BellRing,
  CheckCircle2,
  DollarSign,
  Receipt,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { getTransactionTypeLabel } from '@/lib/i18n/transaction-labels';
import { TransactionApprovalActions } from '@/app/(protected)/transactions/[id]/components/transaction-approval-actions';

function getTransactionIcon(type: string) {
  switch (type) {
    case 'COLLECTION':
    case 'DEPOSIT':
      return <ArrowDown className="size-5 text-green-600 shrink-0" />;
    case 'WITHDRAWAL':
    case 'TRANSFER':
      return <ArrowUp className="size-5 text-red-600 shrink-0" />;
    case 'LOAN_DISBURSEMENT':
      return <DollarSign className="size-5 text-primary shrink-0" />;
    case 'LOAN_REPAYMENT':
      return <Receipt className="size-5 text-primary shrink-0" />;
    default:
      return <Receipt className="size-5 text-muted-foreground shrink-0" />;
  }
}

export function NotificationsSheet({ trigger }: { trigger: ReactNode }) {
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const canApprove = status === 'authenticated' && hasPermission(session, 'transactions.approve');
  const canApproveLoans = status === 'authenticated' && hasPermission(session, 'loans.approve');
  const canSeeNotifications = canApprove || canApproveLoans;
  const {
    isSupported: pushSupported,
    permission: pushPermission,
    isSubscribing,
    error: pushError,
    subscribe,
  } = usePushNotifications();

  const { data: transactions = [], isLoading } = usePendingTransactions(
    {},
    canApprove,
    { refetchInterval: canApprove ? 30000 : false }
  );

  const { data: pendingAccountsData } = usePendingAccounts(canApprove, {
    refetchInterval: canApprove ? 30000 : false,
  });

  const { data: pendingLoans = [] } = useQuery({
    queryKey: loanKeys.pending(),
    queryFn: async () => {
      const response = await apiFetch('/api/loans?status=PENDING&limit=50');
      if (!response.ok) return [];
      const result = await response.json();
      return result.data || [];
    },
    enabled: canApproveLoans,
    refetchInterval: canApproveLoans ? 30000 : false,
  });

  const { data: maturityAlerts = [], isLoading: maturityLoading } = useQuery({
    queryKey: ['loans-maturity-alerts'],
    queryFn: async () => {
      const response = await apiFetch('/api/loans/maturity-alerts?days=14');
      if (!response.ok) return [];
      const result = await response.json();
      return result.data || [];
    },
    enabled: canApproveLoans,
    refetchInterval: canApproveLoans ? 30000 : false,
  });

  // Deduplicate transfers (show one notification per transfer pair)
  const isTransferRef = (ref: string | null) => ref?.startsWith('transfer-');
  const transferRefsSeen = new Set<string>();
  const displayTransactions = transactions.filter((tx: { reference?: string | null }) => {
    if (isTransferRef(tx.reference)) {
      if (transferRefsSeen.has(tx.reference!)) return false;
      transferRefsSeen.add(tx.reference!);
    }
    return true;
  });

  const pendingTransactionsCount = displayTransactions.length;
  const pendingAccountsCount = pendingAccountsData?.total ?? 0;
  const pendingLoansCount = pendingLoans.length;
  const maturityCount = maturityAlerts.length;
  const pendingCount =
    pendingTransactionsCount + pendingAccountsCount + pendingLoansCount + maturityCount;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <div className="relative inline-flex">
          {trigger}
          {canSeeNotifications && pendingCount > 0 && (
            <span className="absolute -top-0.5 -end-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {pendingCount > 9 ? '9+' : pendingCount}
            </span>
          )}
        </div>
      </SheetTrigger>
      <SheetContent className="p-0 gap-0 sm:w-[500px] sm:max-w-none inset-5 start-auto h-auto rounded-lg [&_[data-slot=sheet-close]]:top-4.5 [&_[data-slot=sheet-close]]:end-5">
        <SheetHeader className="mb-0">
          <SheetTitle className="p-3">{t('pages.topbar.notifications.title')}</SheetTitle>
        </SheetHeader>
        <SheetBody className="p-0">
          <ScrollArea className="h-[calc(100vh-10.5rem)]">
            <div className="p-4 space-y-4">
              {canSeeNotifications && pushSupported && pushPermission === 'default' && (
                <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {t('pages.topbar.notifications.description')}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => subscribe()}
                    disabled={isSubscribing}
                    className="w-full"
                  >
                    <BellRing className="size-4 me-2" />
                    {isSubscribing
                      ? t('pages.topbar.notifications.enabling')
                      : t('pages.topbar.notifications.enablePush')}
                  </Button>
                  {pushError && (
                    <p className="text-xs text-destructive">{pushError}</p>
                  )}
                </div>
              )}
              {!canSeeNotifications ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  <Bell className="size-12 mx-auto mb-3 opacity-50" />
                  <p>{t('pages.topbar.notifications.none')}</p>
                </div>
              ) : isLoading || maturityLoading ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  {t('pages.topbar.notifications.loading')}
                </div>
              ) : displayTransactions.length === 0 &&
                pendingAccountsCount === 0 &&
                pendingLoansCount === 0 &&
                maturityCount === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  <CheckCircle2 className="size-12 mx-auto mb-3 text-green-500" />
                  <p className="font-medium">{t('pages.topbar.notifications.allCaughtUp')}</p>
                  <p>{t('pages.topbar.notifications.allCaughtUpDesc')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {canApproveLoans && maturityAlerts.length > 0 && (
                    <div className="space-y-2 pb-2 border-b border-border">
                      <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400 px-1">
                        {t('pages.topbar.notifications.maturityLoans', {
                          defaultValue: 'Loans approaching maturity ({{count}})',
                          count: maturityAlerts.length,
                        })}
                      </h3>
                      {maturityAlerts.map(
                        (loan: {
                          id: string;
                          loanNumber: string;
                          clientName: string;
                          remainingBalance: string;
                          maturityDate: string | null;
                        }) => (
                          <Link
                            key={loan.id}
                            href={`/loans/${loan.id}`}
                            className="block rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 hover:bg-amber-500/10 transition-colors"
                          >
                            <div className="font-medium text-sm">{loan.loanNumber}</div>
                            <div className="text-xs text-muted-foreground">
                              {loan.clientName}
                            </div>
                            <div className="mt-1 flex justify-between text-sm">
                              <span className="font-medium">
                                {formatCurrency(Number(loan.remainingBalance))}
                              </span>
                              {loan.maturityDate && (
                                <span className="text-muted-foreground">
                                  {t('pages.loans.maturityDate')}:{' '}
                                  {formatDateTime(new Date(loan.maturityDate))}
                                </span>
                              )}
                            </div>
                          </Link>
                        )
                      )}
                      <Link
                        href="/loans"
                        className="block text-center py-2 text-sm font-medium text-primary hover:underline"
                      >
                        {t('pages.topbar.notifications.viewLoans', { defaultValue: 'View all loans' })}
                      </Link>
                    </div>
                  )}
                  <h3 className="text-sm font-semibold text-muted-foreground px-1">
                    {t('pages.topbar.notifications.pendingApproval', {
                      transactions: displayTransactions.length,
                      accounts:
                        pendingAccountsCount > 0
                          ? t('pages.topbar.notifications.accountsSuffix', {
                              count: pendingAccountsCount,
                            })
                          : '',
                      loans:
                        pendingLoansCount > 0
                          ? t('pages.topbar.notifications.loansSuffix', {
                              count: pendingLoansCount,
                            })
                          : '',
                    })}
                  </h3>
                  {displayTransactions.map((tx: {
                    id: string;
                    transactionNumber: string;
                    type: string;
                    amount: string | number;
                    reference?: string | null;
                    createdAt: string;
                    account?: { client?: { fullName: string } };
                  }) => {
                    const amount = Number(tx.amount);
                    const isCredit = ['COLLECTION', 'DEPOSIT', 'LOAN_REPAYMENT'].includes(tx.type);
                    return (
                      <div
                        key={tx.id}
                        className="rounded-lg border border-border overflow-hidden"
                      >
                        <Link
                          href={`/transactions/${tx.id}`}
                          className="block p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex gap-3">
                            {getTransactionIcon(tx.type)}
                            <div className="min-w-0 flex-1">
                              <div className="font-medium">
                                {getTransactionTypeLabel(tx.type, t, {
                                  reference: tx.reference,
                                })}
                              </div>
                              <div className="text-sm text-muted-foreground truncate">
                                {tx.transactionNumber}
                                {tx.account?.client && (
                                  <> · {tx.account.client.fullName}</>
                                )}
                              </div>
                              <div className="mt-1 flex items-center justify-between text-sm">
                                <span
                                  className={
                                    isCredit
                                      ? 'text-green-600 font-medium'
                                      : 'text-red-600 font-medium'
                                  }
                                >
                                  {isCredit ? '+' : '-'}
                                  {formatCurrency(Math.abs(amount))}
                                </span>
                                <span className="text-muted-foreground">
                                  {formatDateTime(tx.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {t('pages.topbar.notifications.openTxHint')}
                          </p>
                        </Link>
                        <div className="border-t border-border bg-muted/20 px-3 py-2">
                          <TransactionApprovalActions
                            transactionId={tx.id}
                            variant="compact"
                            refreshRouterOnSuccess={false}
                          />
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex flex-col gap-1">
                    <Link
                      href="/validation/pending"
                      className="block text-center py-2 text-sm font-medium text-primary hover:underline"
                    >
                      {t('pages.topbar.notifications.viewPendingTransactions')}
                    </Link>
                    {pendingAccountsCount > 0 && (
                      <Link
                        href="/validation/pending-accounts"
                        className="block text-center py-2 text-sm font-medium text-primary hover:underline"
                      >
                        {t('pages.topbar.notifications.viewPendingAccounts')}
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
