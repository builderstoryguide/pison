'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { useTranslation } from '@/hooks/useTranslation';
import type { AdminDashboardStats } from '@/lib/services/dashboard-service';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
} from '@/components/common/toolbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Activity,
  AlertTriangle,
  Calculator,
  CheckCircle2,
  FileText,
  Loader2,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/helpers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { isManagerRole } from '@/lib/auth-client';
import {
  getTransactionStatusLabel,
  getTransactionTypeLabel,
} from '@/lib/i18n/transaction-labels';
import { TreasuryIssueCard } from '@/app/(protected)/dashboard/admin/components/treasury-issue-card';

interface Transaction {
  id: string;
  type: string;
  reference: string;
  date: string;
  status: string;
  amount: number;
}

interface AdminDashboardProps {
  initialStats?: AdminDashboardStats | null;
}

export default function AdminDashboard({ initialStats }: AdminDashboardProps) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const isManager = isManagerRole(session);
  const [isExporting, setIsExporting] = useState(false);
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

  const handleExport = async () => {
    if (!stats || isExporting) return;
    setIsExporting(true);
    try {
      const rows: string[][] = [
        [t('pages.dashboard.activeClients'), String(stats.activeClients ?? 0)],
        [t('pages.dashboard.activeAgents'), String(stats.activeAgents ?? 0)],
        [t('pages.dashboard.todayCollections'), formatCurrency(stats.dailyCollections ?? 0)],
        [t('pages.dashboard.loanRequests'), String(stats.pendingLoans ?? 0)],
        [],
        [t('pages.dashboard.recentTransactions')],
        [
          t('pages.transactions.columnType'),
          t('pages.reports.clientStatementReport.columns.reference'),
          t('pages.transactions.columnDate'),
          t('pages.transactions.columnStatus'),
          t('pages.transactions.columnAmount'),
        ],
        ...(stats.recentTransactions ?? []).map((txn: Transaction) => [
          getTransactionTypeLabel(txn.type, t, { reference: txn.reference }),
          txn.reference,
          formatDate(txn.date),
          getTransactionStatusLabel(txn.status, t),
          String(txn.amount),
        ]),
      ];
      const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-report-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading
            title={t('pages.dashboard.adminTitle')}
            description={t('pages.dashboard.overviewDescription')}
          />
          <ToolbarActions>
            <Button
              size="sm"
              onClick={handleExport}
              disabled={isLoading || !stats || isExporting}
            >
              {isExporting && <Loader2 className="size-3.5 animate-spin" />}
              {t('common.actions.export')}
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container>
        <div className="grid gap-5 lg:gap-7.5 mb-5 lg:mb-7.5">
            <div className="grid gap-5 lg:gap-7.5 md:grid-cols-2 lg:grid-cols-4">
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
                    <div className="text-2xl font-bold">
                    {stats?.activeClients || 0}
                    </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                    {t('pages.dashboard.totalRegisteredClients')}
                </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {t('pages.dashboard.activeAgents')}
                </CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                {isLoading ? (
                    <Skeleton className="h-7 w-20" />
                ) : (
                    <div className="text-2xl font-bold">
                    {stats?.activeAgents || 0}
                    </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                    {t('pages.dashboard.deployedInZones', {
                    count: stats?.activeAreas || 0,
                    })}
                </p>
                </CardContent>
            </Card>

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
                    <div className="text-2xl font-bold">
                    {formatCurrency(stats?.dailyCollections || 0)}
                    </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                    {t('pages.dashboard.collectedToday')}
                </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {t('pages.dashboard.loanRequests')}
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                {isLoading ? (
                    <Skeleton className="h-7 w-20" />
                ) : (
                    <div className="text-2xl font-bold">
                    {stats?.pendingLoans || 0}
                    </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                    {t('pages.dashboard.pendingApproval', {
                    total: stats?.totalLoans || 0,
                    })}
                </p>
                </CardContent>
            </Card>
            </div>

            {isManager ? (
              <div className="max-w-md">
                <TreasuryIssueCard />
              </div>
            ) : null}

            {stats?.surplusShortageSummary && (
            <Card className={stats.surplusShortageSummary.shortageDays > 0 ? 'border-destructive/50' : ''}>
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

            <div className="grid gap-5 lg:gap-7.5 md:grid-cols-2 lg:grid-cols-7">
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
                        <div
                            key={txn.id}
                            className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                        >
                            <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">
                                {getTransactionTypeLabel(txn.type, t, {
                                  reference: txn.reference,
                                })}
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
                            <div
                                className={`font-medium ${
                                ['DEPOSIT', 'COLLECTION'].includes(txn.type)
                                    ? 'text-green-600'
                                    : 'text-red-600'
                                }`}
                            >
                                {['DEPOSIT', 'COLLECTION'].includes(txn.type)
                                ? '+'
                                : '-'}
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

            <Card className="col-span-3">
                <CardHeader>
                <CardTitle>{t('pages.dashboard.quickActions')}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                <Link
                    href="/user-management/users"
                    className="flex items-center p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                    <Users className="h-5 w-5 mr-3 text-primary" />
                    <div className="space-y-1">
                    <p className="font-medium">{t('menu.userManagement')}</p>
                    <p className="text-xs text-muted-foreground">
                        {t('pages.dashboard.manageUsersRoles')}
                    </p>
                    </div>
                </Link>
                <Link
                    href="/accountants/new"
                    className="flex items-center p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                    <Calculator className="h-5 w-5 mr-3 text-primary" />
                    <div className="space-y-1">
                    <p className="font-medium">{t('menu.addAccountant')}</p>
                    <p className="text-xs text-muted-foreground">
                        {t('pages.dashboard.addNewAccountant')}
                    </p>
                    </div>
                </Link>
                <Link
                    href="/validation/pending"
                    className="flex items-center p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                    <FileText className="h-5 w-5 mr-3 text-primary" />
                    <div className="space-y-1">
                    <p className="font-medium">
                        {t('pages.dashboard.validateTransactions')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {t('pages.dashboard.approvePendingCollections')}
                    </p>
                    </div>
                </Link>
                <Link
                    href="/loans"
                    className="flex items-center p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                    <Wallet className="h-5 w-5 mr-3 text-primary" />
                    <div className="space-y-1">
                    <p className="font-medium">
                        {t('pages.dashboard.newLoanRequest')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {t('pages.dashboard.createLoanForClient')}
                    </p>
                    </div>
                </Link>
                {isManager && (
                <Link
                    href="/operations/day-closure"
                    className="flex items-center p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                    <Activity className="h-5 w-5 mr-3 text-primary" />
                    <div className="space-y-1">
                    <p className="font-medium">
                        {t('pages.dashboard.dayClosure')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {t('pages.dashboard.reconcileCloseSession')}
                    </p>
                    </div>
                </Link>
                )}
                </CardContent>
            </Card>
            </div>
        </div>
      </Container>
    </>
  );
}
