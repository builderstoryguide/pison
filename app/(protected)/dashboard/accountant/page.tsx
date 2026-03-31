'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { apiFetch } from '@/lib/api';
import { useTranslation } from '@/hooks/useTranslation';
import { hasPermission, hasAnyPermission } from '@/lib/auth-client';
import type { AdminDashboardStats } from '@/lib/services/dashboard-service';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarHeading,
} from '@/components/common/toolbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Wallet, FileText, Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/helpers';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  getTransactionStatusLabel,
  getTransactionTypeLabel,
} from '@/lib/i18n/transaction-labels';

interface Transaction {
  id: string;
  type: string;
  reference: string;
  date: string;
  status: string;
  amount: number;
}

interface AccountantDashboardProps {
  initialStats?: AdminDashboardStats | null;
}

export default function AccountantDashboard({ initialStats }: AccountantDashboardProps) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await apiFetch('/api/dashboard/stats');
      if (!response.ok) return null;
      const result = await response.json();
      return result.data;
    },
    initialData: initialStats,
  });

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading
            title={t('pages.dashboard.accountantTitle')}
          />
        </Toolbar>
      </Container>

      <Container>
        {(hasAnyPermission(session, ['transactions.view', 'collections.create']) ||
          hasPermission(session, 'loans.view') ||
          hasPermission(session, 'clients.view')) && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
          {hasAnyPermission(session, ['transactions.view', 'collections.create']) && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('pages.dashboard.todayCollections')}
                </CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-7 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{formatCurrency(stats?.dailyCollections || 0)}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {t('pages.dashboard.todayCollectionsVerified')}
                </p>
              </CardContent>
            </Card>
          )}

          {hasPermission(session, 'loans.view') && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('pages.dashboard.activeLoans')}
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-7 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{stats?.totalLoans || 0}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {t('pages.dashboard.pendingApprovalCount', { count: stats?.pendingLoans || 0 })}
                </p>
              </CardContent>
            </Card>
          )}

          {hasPermission(session, 'clients.view') && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('pages.dashboard.activeClients')}
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-7 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{stats?.activeClients || 0}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {t('pages.dashboard.managedAccounts')}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
        )}

        {hasPermission(session, 'reports.surplus_shortage') && stats?.surplusShortageSummary && (
        <Card className={`mb-6 ${stats.surplusShortageSummary.shortageDays > 0 ? 'border-destructive/50' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('pages.dashboard.surplusShortage')}
            </CardTitle>
            {stats.surplusShortageSummary.shortageDays > 0 ? (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              {t('pages.dashboard.surplusShortageLast30Days')}
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">{t('pages.dashboard.shortageDays')}: </span>
                <span className={stats.surplusShortageSummary.shortageDays > 0 ? 'font-semibold text-destructive' : 'font-medium'}>
                  {stats.surplusShortageSummary.shortageDays}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">{t('pages.dashboard.totalShortage')}: </span>
                <span className="font-medium">{formatCurrency(stats.surplusShortageSummary.totalShortage)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t('pages.dashboard.surplusDays')}: </span>
                <span className="font-medium text-green-600">{stats.surplusShortageSummary.surplusDays}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t('pages.dashboard.totalSurplus')}: </span>
                <span className="font-medium text-green-600">{formatCurrency(stats.surplusShortageSummary.totalSurplus)}</span>
              </div>
            </div>
            <Link
              href="/reports/surplus-shortage"
              className="inline-flex items-center text-sm font-medium text-primary hover:underline mt-3"
            >
              {t('pages.dashboard.viewSurplusShortageReport')} →
            </Link>
          </CardContent>
        </Card>
        )}

        {(hasPermission(session, 'transactions.view') ||
          hasPermission(session, 'clients.create') ||
          hasPermission(session, 'loans.create') ||
          hasPermission(session, 'reports.view')) && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          {hasPermission(session, 'transactions.view') && (
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>{t('pages.dashboard.recentTransactions')}</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stats?.recentTransactions?.length > 0 ? (
                      stats.recentTransactions.map((txn: Transaction) => (
                        <div key={txn.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">
                              {getTransactionTypeLabel(txn.type, t, { reference: txn.reference })}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {txn.reference} • {formatDate(txn.date)}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge
                              variant={
                                {
                                  COMPLETED: 'success',
                                  APPROVED: 'success',
                                  PENDING_APPROVAL: 'warning',
                                  REJECTED: 'destructive',
                                  REVERSED: 'secondary',
                                }[txn.status] || 'secondary'
                              }
                            >
                              {getTransactionStatusLabel(txn.status, t)}
                            </Badge>
                            <div className={`font-medium ${
                              ['DEPOSIT', 'COLLECTION'].includes(txn.type) 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {['DEPOSIT', 'COLLECTION'].includes(txn.type) ? '+' : '-'}
                              {formatCurrency(txn.amount)}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        {t('pages.dashboard.noRecentTransactions')}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {(hasPermission(session, 'clients.create') ||
            hasPermission(session, 'loans.create') ||
            hasPermission(session, 'reports.view')) && (
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>{t('pages.dashboard.quickActions')}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                {hasPermission(session, 'clients.create') && (
                  <Link href="/clients/new" className="flex items-center p-4 border rounded-lg hover:bg-accent transition-colors">
                    <Users className="h-5 w-5 mr-3 text-primary" />
                    <div className="space-y-1">
                      <p className="font-medium">{t('pages.dashboard.newClient')}</p>
                      <p className="text-xs text-muted-foreground">{t('pages.dashboard.registerNewAccount')}</p>
                    </div>
                  </Link>
                )}
                {hasPermission(session, 'loans.create') && (
                  <Link href="/loans/new" className="flex items-center p-4 border rounded-lg hover:bg-accent transition-colors">
                    <Wallet className="h-5 w-5 mr-3 text-primary" />
                    <div className="space-y-1">
                      <p className="font-medium">{t('pages.dashboard.newLoanRequest')}</p>
                      <p className="text-xs text-muted-foreground">{t('pages.dashboard.createLoanForClient')}</p>
                    </div>
                  </Link>
                )}
                {hasPermission(session, 'reports.view') && (
                  <Link href="/reports/monthly-balance" className="flex items-center p-4 border rounded-lg hover:bg-accent transition-colors">
                    <FileText className="h-5 w-5 mr-3 text-primary" />
                    <div className="space-y-1">
                      <p className="font-medium">{t('pages.dashboard.reports')}</p>
                      <p className="text-xs text-muted-foreground">{t('pages.dashboard.viewFinancialReports')}</p>
                    </div>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}
        </div>
        )}
      </Container>
    </>
  );
}
