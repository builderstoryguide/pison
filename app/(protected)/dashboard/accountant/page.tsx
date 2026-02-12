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

export default function AccountantDashboard() {
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
            <ToolbarTitle>{t('pages.dashboard.accountantTitle')}</ToolbarTitle>
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
        </Toolbar>
      </Container>

      <Container>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Today's Collections
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
                Verified collections
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Loans
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
                {stats?.pendingLoans || 0} pending approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Clients
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
                Managed accounts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Agents
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
                Field collectors
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
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
                      No recent transactions
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <a href="/clients/new" className="flex items-center p-4 border rounded-lg hover:bg-accent transition-colors">
                <Users className="h-5 w-5 mr-3 text-primary" />
                <div className="space-y-1">
                  <p className="font-medium">New Client</p>
                  <p className="text-xs text-muted-foreground">Register new account</p>
                </div>
              </a>
              <a href="/loans/new" className="flex items-center p-4 border rounded-lg hover:bg-accent transition-colors">
                <Wallet className="h-5 w-5 mr-3 text-primary" />
                <div className="space-y-1">
                  <p className="font-medium">New Loan Request</p>
                  <p className="text-xs text-muted-foreground">Initiate loan process</p>
                </div>
              </a>
              <a href="/reports/monthly-balance" className="flex items-center p-4 border rounded-lg hover:bg-accent transition-colors">
                <FileText className="h-5 w-5 mr-3 text-primary" />
                <div className="space-y-1">
                  <p className="font-medium">Reports</p>
                  <p className="text-xs text-muted-foreground">View financial reports</p>
                </div>
              </a>
            </CardContent>
          </Card>
        </div>
      </Container>
    </>
  );
}
