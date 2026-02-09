'use client';

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import {
  DollarSign,
  Users,
  TrendingUp,
  CreditCard,
  FileText,
  CalendarCheck,
  UserCheck,
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

export default function AccountantDashboard() {
  const { data: session } = useSession();

  // Mock data - Replace with actual API calls
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['accountant-dashboard'],
    queryFn: async () => {
      // TODO: Replace with actual API endpoint
      return {
        pendingTransactions: 8,
        todayDeposits: 85000,
        todayWithdrawals: 45000,
        totalClients: 156,
        totalAgents: 8,
        officeTransactions: 3,
        pendingTransactionsList: [
          {
            id: '1',
            type: 'deposit' as const,
            amount: 50000,
            clientName: 'Jean Dupont',
            date: 'Today, 10:30 AM',
            status: 'pending' as const,
          },
          {
            id: '2',
            type: 'withdrawal' as const,
            amount: 25000,
            clientName: 'Sophie Laurent',
            date: 'Today, 09:15 AM',
            status: 'pending' as const,
          },
        ],
        recentActivity: [
          {
            id: '1',
            type: 'transaction' as const,
            description: 'Processed deposit for client',
            user: 'You',
            time: '5 minutes ago',
            amount: 50000,
          },
          {
            id: '2',
            type: 'collection' as const,
            description: 'Agent collection received',
            user: 'Marie Martin',
            time: '30 minutes ago',
            amount: 75000,
          },
          {
            id: '3',
            type: 'transaction' as const,
            description: 'Withdrawal processed',
            user: 'You',
            time: '1 hour ago',
            amount: 30000,
          },
        ],
      };
    },
  });

  if (isLoading) {
    return <ContentLoader className="mt-[30%]" />;
  }

  const stats = dashboardData || {
    pendingTransactions: 0,
    todayDeposits: 0,
    todayWithdrawals: 0,
    totalClients: 0,
    totalAgents: 0,
    officeTransactions: 0,
    pendingTransactionsList: [],
    recentActivity: [],
  };

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>Accountant Dashboard</ToolbarTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Welcome back, {session?.user?.name || 'Accountant'}
            </p>
          </ToolbarHeading>
        </Toolbar>
      </Container>

      <Container>
        <div className="grid gap-5 lg:gap-7.5">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Pending Transactions"
              value={stats.pendingTransactions}
              description="Awaiting validation"
              icon={CalendarCheck}
              className="border-orange-200 dark:border-orange-800"
              onClick={() => window.location.href = '/transactions/pending'}
            />
            <StatCard
              title="Today's Deposits"
              value={new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'XOF',
                minimumFractionDigits: 0,
              }).format(stats.todayDeposits)}
              description="Office deposits"
              icon={TrendingUp}
              trend={{ value: 8.3, isPositive: true }}
            />
            <StatCard
              title="Today's Withdrawals"
              value={new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'XOF',
                minimumFractionDigits: 0,
              }).format(stats.todayWithdrawals)}
              description="Office withdrawals"
              icon={CreditCard}
            />
            <StatCard
              title="Office Transactions"
              value={stats.officeTransactions}
              description="Processed today"
              icon={FileText}
            />
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <StatCard
              title="Total Clients"
              value={stats.totalClients}
              description="Active client accounts"
              icon={Users}
            />
            <StatCard
              title="Total Agents"
              value={stats.totalAgents}
              description="Active collection agents"
              icon={UserCheck}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-2 gap-5 lg:gap-7.5">
            <PendingTransactionsCard
              transactions={stats.pendingTransactionsList}
              viewAllPath="/transactions/pending"
            />
            <RecentActivityCard
              activities={stats.recentActivity}
              title="Recent Transactions"
            />
          </div>
        </div>
      </Container>
    </>
  );
}
