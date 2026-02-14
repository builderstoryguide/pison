'use client';

import { useParams } from 'next/navigation';
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
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';
import { useTranslation } from '@/hooks/useTranslation';
import { useTransaction } from '@/hooks/queries/use-transactions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDateTime } from '@/lib/helpers';
import { Loader2 } from 'lucide-react';

export default function Page() {
  const params = useParams();
  const { t } = useTranslation();
  const id = params.id as string;
  const { data: transaction, isLoading } = useTransaction(id);

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
            Transaction not found
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

  const typeLabels: Record<string, string> = {
    DEPOSIT: t('pages.transactions.typeDeposit'),
    WITHDRAWAL: t('pages.transactions.typeWithdrawal'),
    TRANSFER: t('pages.transactions.typeTransfer'),
    COLLECTION: t('pages.transactions.typeCollection'),
    LOAN_DISBURSEMENT: t('pages.transactions.typeLoanDisbursement'),
    LOAN_REPAYMENT: t('pages.transactions.typeLoanRepayment'),
    COMMISSION: 'Commission',
    ADJUSTMENT: 'Adjustment',
  };

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
        </Toolbar>
      </Container>

      <Container>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{typeLabels[transaction.type] || transaction.type}</CardTitle>
              <Badge variant={statusVariant as 'success' | 'warning' | 'destructive' | 'secondary'}>
                {transaction.status.replace(/_/g, ' ')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm text-muted-foreground">Amount</div>
                <div className={`text-2xl font-bold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                  {isCredit ? '+' : '-'}{formatCurrency(Math.abs(amount))}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Date</div>
                <div className="font-medium">{formatDateTime(transaction.createdAt)}</div>
              </div>
              {transaction.account && (
                <div>
                  <div className="text-sm text-muted-foreground">Account</div>
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
                <div className="text-sm text-muted-foreground">Balance Before / After</div>
                <div className="font-medium">
                  {formatCurrency(Number(transaction.balanceBefore))} →{' '}
                  {formatCurrency(Number(transaction.balanceAfter))}
                </div>
              </div>
            </div>
            {transaction.description && (
              <div>
                <div className="text-sm text-muted-foreground">Description</div>
                <div className="font-medium">{transaction.description}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </Container>
    </>
  );
}
