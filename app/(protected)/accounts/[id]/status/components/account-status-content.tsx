'use client';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Container } from '@/components/common/container';
import { Toolbar, ToolbarHeading, ToolbarTitle } from '@/components/common/toolbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/hooks/useTranslation';
import { formatCurrency, formatDate } from '@/lib/helpers';
import { getTransactionTypeLabel } from '@/lib/i18n/transaction-labels';
import { getFinancialAccountStatusPresentation, getLoanStatusPresentation } from '@/lib/status/presenters';
import type { StatusBadgeVariant } from '@/lib/status/presenters';
import { Wallet, Activity, CreditCard, ArrowRightLeft } from 'lucide-react';

interface AccountStatusContentProps {
  account: {
    accountNumber: string;
    status: string;
    balance: string | number;
    availableBalance: string | number;
    openedAt: Date;
    client?: { fullName: string; phone?: string | null } | null;
    agent?: { fullName: string; phone?: string | null } | null;
    _count: { transactions: number };
    transactions: Array<{
      id: string;
      type: string;
      reference?: string | null;
      transactionNumber: string;
      amount: string | number;
      description?: string | null;
      createdAt: Date;
    }>;
    loans: Array<{
      id: string;
      loanNumber: string;
      status: string;
      principalAmount: string | number;
      remainingBalance: string | number;
      maturityDate: Date | null;
    }>;
  };
  ownerName: string;
  ownerType: string;
}

export default function AccountStatusContent({
  account,
  ownerName,
  ownerType,
  breadcrumbs,
}: AccountStatusContentProps & { breadcrumbs?: React.ReactNode }) {
  const { t } = useTranslation();
  const ownerTypeLabel = t(`pages.accounts.${ownerType}`);
  const accountStatus = getFinancialAccountStatusPresentation(account.status);

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{t('pages.accounts.accountStatus')}</ToolbarTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant={accountStatus.variant as StatusBadgeVariant}>{t(accountStatus.labelKey)}</Badge>
              <span>{account.accountNumber}</span>
              <span>•</span>
              <span>{ownerName ? `${ownerName} (${ownerTypeLabel})` : ownerTypeLabel}</span>
            </div>
            {breadcrumbs ? (
              breadcrumbs
            ) : (
              <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">{t('common.breadcrumbs.home')}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/accounts">{t('pages.accounts.accounts')}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{account.accountNumber}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            )}
          </ToolbarHeading>
        </Toolbar>
      </Container>

      <Container>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardContent className="p-6 flex items-center justify-between space-y-0">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{t('pages.accounts.currentBalance')}</p>
                <p className="text-2xl font-bold">{formatCurrency(Number(account.balance))}</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-full">
                <Wallet className="size-5 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center justify-between space-y-0">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{t('pages.accounts.availableBalance')}</p>
                <p className="text-2xl font-bold">{formatCurrency(Number(account.availableBalance))}</p>
              </div>
              <div className="p-2 bg-green-500/10 rounded-full">
                <CreditCard className="size-5 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center justify-between space-y-0">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{t('pages.accounts.totalTransactions')}</p>
                <p className="text-2xl font-bold">{account._count.transactions}</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-full">
                <ArrowRightLeft className="size-5 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center justify-between space-y-0">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{t('pages.accounts.activeLoans')}</p>
                <p className="text-2xl font-bold">{account.loans.length}</p>
              </div>
              <div className="p-2 bg-orange-500/10 rounded-full">
                <Activity className="size-5 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>{t('pages.accounts.recentTransactions')}</CardTitle>
            </CardHeader>
            <CardContent>
              {account.transactions.length > 0 ? (
                <div className="space-y-4">
                  {account.transactions.map((txn) => (
                    <div key={txn.id} className="flex justify-between items-center border-b pb-3 last:border-0 last:pb-0">
                      <div className="space-y-1">
                        <div className="font-medium flex items-center gap-2">
                          {getTransactionTypeLabel(txn.type, t, { reference: txn.reference })}
                          <span className="text-xs text-muted-foreground font-normal">{txn.transactionNumber}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">{formatDate(txn.createdAt)}</div>
                        {txn.description && <div className="text-xs text-muted-foreground italic">{txn.description}</div>}
                      </div>
                      <div className={`font-semibold ${
                        ['DEPOSIT', 'COLLECTION', 'LOAN_DISBURSEMENT'].includes(txn.type)
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {['DEPOSIT', 'COLLECTION', 'LOAN_DISBURSEMENT'].includes(txn.type) ? '+' : '-'}
                        {formatCurrency(Number(txn.amount))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">{t('pages.accounts.noRecentTransactions')}</div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('pages.accounts.accountDetails')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">{t('pages.accounts.accountNumber')}</h4>
                  <p>{account.accountNumber}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">{t('pages.accounts.openedDate')}</h4>
                  <p>{formatDate(account.openedAt)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">{t('pages.accounts.owner')}</h4>
                  <p>{ownerName}</p>
                  <p className="text-sm text-muted-foreground">{account.client?.phone || account.agent?.phone}</p>
                </div>
              </CardContent>
            </Card>

            {account.loans.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('pages.accounts.activeLoans')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {account.loans.map((loan) => (
                    <div key={loan.id} className="p-3 border rounded-lg space-y-2">
                      <div className="flex justify-between font-medium">
                        <span>{loan.loanNumber}</span>
                        <Badge variant="outline">
                          {t(getLoanStatusPresentation(loan.status).labelKey)}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('pages.loans.principal')}:</span>
                        <span>{formatCurrency(Number(loan.principalAmount))}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('pages.loans.remainingBalance')}:</span>
                        <span className="font-semibold text-destructive">{formatCurrency(Number(loan.remainingBalance))}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="text-xs text-muted-foreground text-right">
                        {t('pages.accounts.matures')}: {loan.maturityDate ? formatDate(loan.maturityDate) : 'N/A'}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </Container>
    </>
  );
}
