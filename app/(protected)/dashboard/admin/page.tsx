'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { useTranslation } from '@/hooks/useTranslation';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, UserCheck, Wallet, FileText, MapPin, Activity } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/helpers';
import { Badge } from '@/components/ui/badge';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await apiFetch('/api/dashboard/stats');
      if (!response.ok) return null;
      const result = await response.json();
      return result.data;
    },
  });

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{t('pages.dashboard.adminTitle')}</ToolbarTitle>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">{t('common.breadcrumbs.home')}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{t('navigation.dashboard')}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
          <ToolbarActions>
            {/* Add action buttons here if needed */}
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
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
                <div className="text-2xl font-bold">{stats?.activeAgents || 0}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {t('pages.dashboard.deployedInZones', { count: stats?.activeAreas || 0 })}
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
                <div className="text-2xl font-bold">{formatCurrency(stats?.dailyCollections || 0)}</div>
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
                <div className="text-2xl font-bold">{stats?.pendingLoans || 0}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {t('pages.dashboard.pendingApproval', { total: stats?.totalLoans || 0 })}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
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
                    stats.recentTransactions.map((txn: any) => (
                      <div key={txn.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">{txn.type}</p>
                          <p className="text-sm text-muted-foreground">
                            {txn.reference} • {formatDate(txn.date)}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant={txn.status === 'COMPLETED' ? 'success' : 'secondary'}>
                            {txn.status}
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

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>{t('pages.dashboard.quickActions')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <a href="/user-management/users" className="flex items-center p-4 border rounded-lg hover:bg-accent transition-colors">
                <Users className="h-5 w-5 mr-3 text-primary" />
                <div className="space-y-1">
<p className="font-medium">{t('menu.userManagement')}</p>
                <p className="text-xs text-muted-foreground">{t('pages.dashboard.manageUsersRoles')}</p>
                </div>
              </a>
              <a href="/validation/pending" className="flex items-center p-4 border rounded-lg hover:bg-accent transition-colors">
                <FileText className="h-5 w-5 mr-3 text-primary" />
                <div className="space-y-1">
<p className="font-medium">{t('pages.dashboard.validateTransactions')}</p>
                <p className="text-xs text-muted-foreground">{t('pages.dashboard.approvePendingCollections')}</p>
                </div>
              </a>
              <a href="/loans/new" className="flex items-center p-4 border rounded-lg hover:bg-accent transition-colors">
                <Wallet className="h-5 w-5 mr-3 text-primary" />
                <div className="space-y-1">
<p className="font-medium">{t('pages.dashboard.newLoanRequest')}</p>
                <p className="text-xs text-muted-foreground">{t('pages.dashboard.createLoanForClient')}</p>
                </div>
              </a>
              <a href="/operations/day-closure" className="flex items-center p-4 border rounded-lg hover:bg-accent transition-colors">
                <Activity className="h-5 w-5 mr-3 text-primary" />
                <div className="space-y-1">
<p className="font-medium">{t('pages.dashboard.dayClosure')}</p>
                <p className="text-xs text-muted-foreground">{t('pages.dashboard.reconcileCloseSession')}</p>
                </div>
              </a>
            </CardContent>
          </Card>
        </div>
      </Container>
    </>
  );
}
