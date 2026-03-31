'use client';

import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';
import { useTranslation } from '@/hooks/useTranslation';
import { useTransaction } from '@/hooks/queries/use-transactions';
import { hasPermission } from '@/lib/auth-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDateTime } from '@/lib/helpers';
import { Loader2 } from 'lucide-react';
import { TransactionApprovalActions } from './components/transaction-approval-actions';
import {
  getTransactionStatusLabel,
  getTransactionTypeLabel,
} from '@/lib/i18n/transaction-labels';

export default function Page() {
  const params = useParams();
  const { t } = useTranslation();
  const { data: session } = useSession();
  const id = params.id as string;
  const { data: transaction, isLoading } = useTransaction(id);

  const canApprove =
    session && hasPermission(session, 'transactions.approve');
  const showApprovalActions =
    transaction?.status === 'PENDING_APPROVAL' && canApprove;

  if (isLoading) {
    return (
      <Container>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (!transaction) {
    return (
      <Container>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t('pages.transactions.notFound')}
          </CardContent>
        </Card>
      </Container>
    );
  }

  const amount = Number(transaction.amount);
  const isCredit = ['DEPOSIT', 'COLLECTION', 'LOAN_REPAYMENT'].includes(transaction.type);
  const statusVariant = {
    COMPLETED: 'success',
    APPROVED: 'success',
    PENDING_APPROVAL: 'warning',
    REJECTED: 'destructive',
    REVERSED: 'secondary',
  }[transaction.status] || 'secondary';

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{transaction.transactionNumber}</ToolbarTitle>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">{t('common.breadcrumbs.home')}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/transactions">{t('menu.transactions')}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{transaction.transactionNumber}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
          {showApprovalActions && (
            <ToolbarActions>
              <TransactionApprovalActions transactionId={transaction.id} />
            </ToolbarActions>
          )}
        </Toolbar>
      </Container>

      <Container>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {getTransactionTypeLabel(transaction.type, t, {
                  reference: transaction.reference,
                })}
              </CardTitle>
              <Badge variant={statusVariant as 'success' | 'warning' | 'destructive' | 'secondary'}>
                {getTransactionStatusLabel(transaction.status, t)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm text-muted-foreground">
                  {t('pages.transactions.detailAmount')}
                </div>
                <div className={`text-2xl font-bold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                  {isCredit ? '+' : '-'}{formatCurrency(Math.abs(amount))}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">
                  {t('pages.transactions.columnDate')}
                </div>
                <div className="font-medium">{formatDateTime(transaction.createdAt)}</div>
              </div>
              {transaction.account && (
                <div>
                  <div className="text-sm text-muted-foreground">
                    {t('common.labels.account')}
                  </div>
                  <div className="font-medium">
                    {transaction.account.accountNumber}
                    {transaction.account.client && (
                      <span className="text-muted-foreground ml-2">
                        ({transaction.account.client.fullName})
                      </span>
                    )}
                  </div>
                </div>
              )}
              <div>
                <div className="text-sm text-muted-foreground">
                  {t('pages.transactions.balanceBeforeAfter')}
                </div>
                <div className="font-medium">
                  {formatCurrency(Number(transaction.balanceBefore))} →{' '}
                  {formatCurrency(Number(transaction.balanceAfter))}
                </div>
              </div>
            </div>
            {transaction.description && (
              <div>
                <div className="text-sm text-muted-foreground">
                  {t('common.labels.description')}
                </div>
                <div className="font-medium">{transaction.description}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </Container>
    </>
  );
}
