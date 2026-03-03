'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { hasPermission } from '@/lib/auth-client';
import { usePendingTransactions } from '@/hooks/queries/use-transactions';
import { usePendingAccounts } from '@/hooks/queries/use-pending-accounts';
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

function getTransactionIcon(type: string) {
  switch (type) {
    case 'COLLECTION':
    case 'DEPOSIT':
      return <ArrowDown className="size-5 text-green-600 shrink-0" />;
    case 'WITHDRAWAL':
    case 'TRANSFER':
      return <ArrowUp className="size-5 text-red-600 shrink-0" />;
    case 'LOAN_DISBURSEMENT':
      return <DollarSign className="size-5 text-blue-600 shrink-0" />;
    case 'LOAN_REPAYMENT':
      return <Receipt className="size-5 text-purple-600 shrink-0" />;
    default:
      return <Receipt className="size-5 text-muted-foreground shrink-0" />;
  }
}

function getTransactionTypeLabel(type: string, reference?: string | null) {
  if (reference?.startsWith('transfer-')) return 'Transfer';
  return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export function NotificationsSheet({ trigger }: { trigger: ReactNode }) {
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const canApprove = status === 'authenticated' && hasPermission(session, 'transactions.approve');
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
  const pendingCount = pendingTransactionsCount + pendingAccountsCount;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <div className="relative inline-flex">
          {trigger}
          {canApprove && pendingCount > 0 && (
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
              {canApprove && pushSupported && pushPermission === 'default' && (
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
              {!canApprove ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  <Bell className="size-12 mx-auto mb-3 opacity-50" />
                  <p>{t('pages.topbar.notifications.none')}</p>
                </div>
              ) : isLoading ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  {t('pages.topbar.notifications.loading')}
                </div>
              ) : displayTransactions.length === 0 && pendingAccountsCount === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  <CheckCircle2 className="size-12 mx-auto mb-3 text-green-500" />
                  <p className="font-medium">{t('pages.topbar.notifications.allCaughtUp')}</p>
                  <p>{t('pages.topbar.notifications.allCaughtUpDesc')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground px-1">
                    {t('pages.topbar.notifications.pendingApproval', {
                      transactions: displayTransactions.length,
                      accounts:
                        pendingAccountsCount > 0
                          ? t('pages.topbar.notifications.accountsSuffix', {
                              count: pendingAccountsCount,
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
                      <Link
                        key={tx.id}
                        href={`/transactions/${tx.id}`}
                        className="block rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex gap-3">
                          {getTransactionIcon(tx.type)}
                          <div className="min-w-0 flex-1">
                            <div className="font-medium">
                              {tx.reference?.startsWith('transfer-')
                                ? t('pages.transactions.typeTransfer')
                                : t(`pages.transactions.type${tx.type
                                    .toLowerCase()
                                    .replace(/(^|_)(\w)/g, (_, __, c) =>
                                      c.toUpperCase(),
                                    )}`, {
                                    defaultValue: getTransactionTypeLabel(
                                      tx.type,
                                      tx.reference,
                                    ),
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
                                  isCredit ? 'text-green-600 font-medium' : 'text-red-600 font-medium'
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
