'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { apiFetch } from '@/lib/api';
import { useTranslation } from '@/hooks/useTranslation';
import { hasPermission } from '@/lib/auth-client';
import type { AgentDashboardStats } from '@/lib/services/dashboard-service';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
} from '@/components/common/toolbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Wallet, MapPin, PlusCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/helpers';
import { Badge } from '@/components/ui/badge';
import { getTransactionStatusPresentation } from '@/lib/status/presenters';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Transaction {
  id: string;
  type: string;
  reference: string;
  date: string;
  status: string;
  amount: number;
}

interface AgentDashboardProps {
  initialStats?: AgentDashboardStats | null;
}

export default function AgentDashboard({ initialStats }: AgentDashboardProps) {
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
            title={t('pages.dashboard.agentTitle')}
          />
          <ToolbarActions>
            {hasPermission(session, 'collections.create') && (
              <Link href="/collections/daily">
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {t('pages.dashboard.startDailyCollection')}
                </Button>
              </Link>
            )}
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container>
        {(hasPermission(session, 'clients.view') ||
          hasPermission(session, 'collections.create') ||
          hasPermission(session, 'collection_areas.view')) && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
          {hasPermission(session, 'clients.view') && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('pages.dashboard.myClients')}
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-7 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{stats?.assignedClientsCount ?? stats?.activeClients ?? 0}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {t('pages.dashboard.assignedClients')}
                </p>
              </CardContent>
            </Card>
          )}

          {hasPermission(session, 'collections.create') && (
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
          )}

          {hasPermission(session, 'collection_areas.view') && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('pages.dashboard.myZones')}
                </CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-7 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{stats?.assignedAreasCount ?? stats?.activeAreas ?? 0}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {t('pages.dashboard.assignedCollectionAreas')}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
        )}

        {(hasPermission(session, 'transactions.view') ||
          hasPermission(session, 'collections.create') ||
          hasPermission(session, 'clients.view')) && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          {hasPermission(session, 'transactions.view') && (
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>{t('pages.dashboard.recentCollections')}</CardTitle>
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
                    {(() => {
                      const recentCollections = stats?.recentTransactions?.filter((txn: Transaction) => txn.type === 'COLLECTION') ?? [];
                      return recentCollections.length > 0 ? (
                        recentCollections.map((txn: Transaction) => {
                          const txnStatus = getTransactionStatusPresentation(
                            txn.status,
                          );
                          return (
                          <div key={txn.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                            <div className="space-y-1">
                              <p className="text-sm font-medium leading-none">{txn.reference}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(txn.date)}
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              <Badge variant={txnStatus.variant}>
                                {t(txnStatus.labelKey)}
                              </Badge>
                              <div className="font-medium text-green-600">
                                +{formatCurrency(txn.amount)}
                              </div>
                            </div>
                          </div>
                        );
                        })
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          {t('pages.dashboard.noRecentCollections')}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {(hasPermission(session, 'collections.create') || hasPermission(session, 'clients.view')) && (
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>{t('pages.dashboard.quickActions')}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                {hasPermission(session, 'collections.create') && (
                  <Link href="/collections/daily">
                    <Button className="w-full justify-start" variant="outline">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      {t('pages.dashboard.startDailyCollection')}
                    </Button>
                  </Link>
                )}
                {hasPermission(session, 'clients.view') && (
                  <Link href="/clients">
                    <Button className="w-full justify-start" variant="outline">
                      <Users className="mr-2 h-4 w-4" />
                      {t('pages.dashboard.viewClients')}
                    </Button>
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
