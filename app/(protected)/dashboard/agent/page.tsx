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
import { Users, Wallet, MapPin, PlusCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/helpers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AgentDashboard() {
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
            <ToolbarTitle>{t('pages.dashboard.agentTitle')}</ToolbarTitle>
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
            <Link href="/collections/daily">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Collection
              </Button>
            </Link>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                My Clients
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
                Assigned clients
              </p>
            </CardContent>
          </Card>

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
                Collected today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                My Zones
              </CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-7 w-20" />
              ) : (
                <div className="text-2xl font-bold">{stats?.activeAreas || 0}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Assigned collection areas
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Recent Collections</CardTitle>
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
                  {stats?.recentTransactions?.filter((t: any) => t.type === 'COLLECTION').length > 0 ? (
                    stats.recentTransactions
                      .filter((t: any) => t.type === 'COLLECTION')
                      .map((txn: any) => (
                      <div key={txn.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">{txn.reference}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(txn.date)}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant={txn.status === 'COMPLETED' ? 'success' : 'secondary'}>
                            {txn.status}
                          </Badge>
                          <div className="font-medium text-green-600">
                            +{formatCurrency(txn.amount)}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No recent collections
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
              <Link href="/collections/daily">
                <Button className="w-full justify-start" variant="outline">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Start Daily Collection
                </Button>
              </Link>
              <Link href="/clients">
                <Button className="w-full justify-start" variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  View Clients
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </Container>
    </>
  );
}
