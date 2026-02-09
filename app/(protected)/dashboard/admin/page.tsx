'use client';

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2,
  DollarSign,
  Users,
  TrendingUp,
  AlertTriangle,
  FileText,
  CalendarCheck,
  CreditCard,
} from 'lucide-react';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';
import { StatCard } from '../components/stat-card';
import { PendingTransactionsCard } from '../components/pending-transactions-card';
import { RecentActivityCard } from '../components/recent-activity-card';
import { ContentLoader } from '@/components/common/content-loader';

export default function AdminDashboard() {
  const { data: session } = useSession();

  // Mock data - Replace with actual API calls
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      // TODO: Replace with actual API endpoint
      // const response = await apiFetch('/api/dashboard/admin');
      // return response.json();
      
      // Mock data for now
      return {
        pendingValidations: 12,
        totalCollections: 2450000,
        totalWithdrawals: 1800000,
        activeClients: 156,
        activeAgents: 8,
        todayCollections: 125000,
        pendingTransactions: [
          {
            id: '1',
            type: 'collection' as const,
            amount: 50000,
            clientName: 'Jean Dupont',
            agentName: 'Marie Martin',
            date: 'Today, 10:30 AM',
            status: 'pending' as const,
          },
          {
            id: '2',
            type: 'withdrawal' as const,
            amount: 25000,
            clientName: 'Sophie Laurent',
            agentName: 'Pierre Dubois',
            date: 'Today, 09:15 AM',
            status: 'pending' as const,
          },
          {
            id: '3',
            type: 'deposit' as const,
            amount: 75000,
            clientName: 'Paul Bernard',
            date: 'Today, 08:45 AM',
            status: 'pending' as const,
          },
        ],
        recentActivity: [
          {
            id: '1',
            type: 'validation' as const,
            description: 'Validated 5 transactions',
            user: 'You',
            time: '2 minutes ago',
          },
          {
            id: '2',
            type: 'collection' as const,
            description: 'New collection from Area A',
            user: 'Marie Martin',
            time: '15 minutes ago',
            amount: 50000,
          },
          {
            id: '3',
            type: 'transaction' as const,
            description: 'Withdrawal processed',
            user: 'Sophie Laurent',
            time: '1 hour ago',
            amount: 25000,
          },
        ],
      };
    },
  });

  if (isLoading) {
    return <ContentLoader className="mt-[30%]" />;
  }

  const stats = dashboardData || {
    pendingValidations: 0,
    totalCollections: 0,
    totalWithdrawals: 0,
    activeClients: 0,
    activeAgents: 0,
    todayCollections: 0,
    pendingTransactions: [],
    recentActivity: [],
  };

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>Administrator Dashboard</ToolbarTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Welcome back, {session?.user?.name || 'Administrator'}
            </p>
          </ToolbarHeading>
        </Toolbar>
      </Container>

      <Container>
        <div className="grid gap-5 lg:gap-7.5">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Pending Validations"
              value={stats.pendingValidations}
              description="Require your approval"
              icon={CheckCircle2}
              className="border-orange-200 dark:border-orange-800"
              onClick={() => window.location.href = '/validation/pending'}
            />
            <StatCard
              title="Today's Collections"
              value={new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'XOF',
                minimumFractionDigits: 0,
              }).format(stats.todayCollections)}
              description="Total collected today"
              icon={DollarSign}
              trend={{ value: 12.5, isPositive: true }}
            />
            <StatCard
              title="Active Clients"
              value={stats.activeClients}
              description="Total active accounts"
              icon={Users}
              trend={{ value: 5.2, isPositive: true }}
            />
            <StatCard
              title="Active Agents"
              value={stats.activeAgents}
              description="Collection agents"
              icon={Users}
            />
          </div>

          {/* Financial Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <StatCard
              title="Total Collections"
              value={new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'XOF',
                minimumFractionDigits: 0,
              }).format(stats.totalCollections)}
              description="This month"
              icon={TrendingUp}
              className="lg:col-span-1"
            />
            <StatCard
              title="Total Withdrawals"
              value={new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'XOF',
                minimumFractionDigits: 0,
              }).format(stats.totalWithdrawals)}
              description="This month"
              icon={CreditCard}
              className="lg:col-span-1"
            />
            <StatCard
              title="Net Balance"
              value={new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'XOF',
                minimumFractionDigits: 0,
              }).format(stats.totalCollections - stats.totalWithdrawals)}
              description="Collections - Withdrawals"
              icon={FileText}
              className="lg:col-span-1"
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-2 gap-5 lg:gap-7.5">
            <PendingTransactionsCard
              transactions={stats.pendingTransactions}
              viewAllPath="/validation/pending"
            />
            <RecentActivityCard
              activities={stats.recentActivity}
              title="Recent System Activity"
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <StatCard
              title="Session Status"
              value="Open"
              description="Daily session is active"
              icon={CalendarCheck}
              className="border-green-200 dark:border-green-800"
            />
            <StatCard
              title="Surplus/Shortage"
              value="0 XOF"
              description="No discrepancies"
              icon={AlertTriangle}
              className="border-blue-200 dark:border-blue-800"
            />
            <StatCard
              title="Reports Generated"
              value="24"
              description="This month"
              icon={FileText}
            />
          </div>
        </div>
      </Container>
    </>
  );
}
