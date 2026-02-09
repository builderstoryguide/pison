'use client';

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  MapPin,
  DollarSign,
  Users,
  TrendingUp,
  Receipt,
  CalendarCheck,
} from 'lucide-react';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarActions,
} from '@/components/common/toolbar';
import { Button } from '@/components/ui/button';
import { StatCard } from '../components/stat-card';
import { RecentActivityCard } from '../components/recent-activity-card';
import { ContentLoader } from '@/components/common/content-loader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AgentDashboard() {
  const { data: session } = useSession();

  // Mock data - Replace with actual API calls
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['agent-dashboard'],
    queryFn: async () => {
      // TODO: Replace with actual API endpoint
      return {
        assignedAreas: ['Area A', 'Area B'],
        todayCollections: 125000,
        todayClients: 15,
        totalClients: 45,
        pendingEntries: 3,
        recentCollections: [
          {
            id: '1',
            type: 'collection' as const,
            description: 'Collection from Area A',
            user: 'Jean Dupont',
            time: '30 minutes ago',
            amount: 50000,
          },
          {
            id: '2',
            type: 'collection' as const,
            description: 'Collection from Area B',
            user: 'Sophie Laurent',
            time: '1 hour ago',
            amount: 30000,
          },
          {
            id: '3',
            type: 'collection' as const,
            description: 'Collection from Area A',
            user: 'Paul Bernard',
            time: '2 hours ago',
            amount: 45000,
          },
        ],
        clientList: [
          { id: '1', name: 'Jean Dupont', area: 'Area A', balance: 150000 },
          { id: '2', name: 'Sophie Laurent', area: 'Area B', balance: 85000 },
          { id: '3', name: 'Paul Bernard', area: 'Area A', balance: 200000 },
        ],
      };
    },
  });

  if (isLoading) {
    return <ContentLoader className="mt-[30%]" />;
  }

  const stats = dashboardData || {
    assignedAreas: [],
    todayCollections: 0,
    todayClients: 0,
    totalClients: 0,
    pendingEntries: 0,
    recentCollections: [],
    clientList: [],
  };

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>Agent Dashboard</ToolbarTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Welcome back, {session?.user?.name || 'Agent'}
            </p>
          </ToolbarHeading>
          <ToolbarActions>
            <Link href="/collections/daily">
              <Button>
                <Receipt className="mr-2 w-4 h-4" />
                Enter Collections
              </Button>
            </Link>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container>
        <div className="grid gap-5 lg:gap-7.5">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Today's Collections"
              value={new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'XOF',
                minimumFractionDigits: 0,
              }).format(stats.todayCollections)}
              description="Total collected today"
              icon={DollarSign}
              trend={{ value: 15.2, isPositive: true }}
            />
            <StatCard
              title="Clients Served"
              value={stats.todayClients}
              description="Today"
              icon={Users}
            />
            <StatCard
              title="Total Clients"
              value={stats.totalClients}
              description="In your areas"
              icon={Users}
            />
            <StatCard
              title="Pending Entries"
              value={stats.pendingEntries}
              description="Awaiting validation"
              icon={Receipt}
              className="border-orange-200 dark:border-orange-800"
            />
          </div>

          {/* Assigned Areas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Assigned Collection Areas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {stats.assignedAreas.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No areas assigned
                  </p>
                ) : (
                  stats.assignedAreas.map((area: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-sm py-1.5 px-3">
                      {area}
                    </Badge>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-2 gap-5 lg:gap-7.5">
            <RecentActivityCard
              activities={stats.recentCollections}
              title="Recent Collections"
            />
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  My Clients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.clientList.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No clients assigned
                    </p>
                  ) : (
                    <>
                      {stats.clientList.slice(0, 5).map((client: any) => (
                        <div
                          key={client.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                        >
                          <div>
                            <p className="text-sm font-medium">{client.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {client.area}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">
                              {new Intl.NumberFormat('fr-FR', {
                                style: 'currency',
                                currency: 'XOF',
                                minimumFractionDigits: 0,
                              }).format(client.balance)}
                            </p>
                          </div>
                        </div>
                      ))}
                      <Link href="/clients">
                        <Button variant="ghost" className="w-full">
                          View All Clients
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </>
  );
}
