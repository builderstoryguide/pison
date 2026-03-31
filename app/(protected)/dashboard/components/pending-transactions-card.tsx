'use client';

import Link from 'next/link';
import { CalendarCheck, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/useTranslation';
import { getTransactionTypeLabel } from '@/lib/i18n/transaction-labels';

interface PendingTransaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'collection';
  amount: number;
  clientName: string;
  agentName?: string;
  date: string;
  status: 'pending';
}

interface PendingTransactionsCardProps {
  transactions: PendingTransaction[];
  viewAllPath: string;
}

const PENDING_TYPE_TO_ENUM: Record<
  PendingTransaction['type'],
  'DEPOSIT' | 'WITHDRAWAL' | 'COLLECTION'
> = {
  deposit: 'DEPOSIT',
  withdrawal: 'WITHDRAWAL',
  collection: 'COLLECTION',
};

export function PendingTransactionsCard({
  transactions,
  viewAllPath,
}: PendingTransactionsCardProps) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base font-semibold">
          {t('pages.dashboard.pendingValidationsTitle')}
        </CardTitle>
        <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
          {transactions.length}
        </Badge>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CalendarCheck className="w-12 h-12 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {t('pages.dashboard.pendingValidationsEmpty')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.slice(0, 5).map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">
                      {transaction.clientName}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-xs"
                    >
                      {getTransactionTypeLabel(
                        PENDING_TYPE_TO_ENUM[transaction.type],
                        t,
                      )}
                    </Badge>
                  </div>
                  {transaction.agentName && (
                    <p className="text-xs text-muted-foreground">
                      {t('pages.dashboard.pendingValidationsAgent', {
                        name: transaction.agentName,
                      })}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">{transaction.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {formatCurrency(transaction.amount)}
                  </p>
                </div>
              </div>
            ))}
            {transactions.length > 5 && (
              <Link href={viewAllPath}>
                <Button variant="ghost" className="w-full">
                  {t('pages.dashboard.pendingValidationsViewAll', {
                    count: transactions.length,
                  })}
                  <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
