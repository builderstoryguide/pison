'use client';

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Wallet,
  TrendingUp,
  CreditCard,
  FileText,
  AlertTriangle,
  DollarSign,
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

export default function ClientDashboard() {
  const { data: session } = useSession();

  // Mock data - Replace with actual API calls
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['client-dashboard'],
    queryFn: async () => {
      // TODO: Replace with actual API endpoint
      return {
        accountBalance: 250000,
        loanBalance: 0,
        availableBalance: 250000,
        recentTransactions: [
          {
            id: '1',
            type: 'deposit' as const,
            description: 'Collection deposit',
            user: 'Agent: Marie Martin',
            time: '2 days ago',
            amount: 50000,
          },
          {
            id: '2',
            type: 'withdrawal' as const,
            description: 'Cash withdrawal',
            user: 'Office',
            time: '5 days ago',
            amount: -30000,
          },
          {
            id: '3',
            type: 'deposit' as const,
            description: 'Collection deposit',
            user: 'Agent: Marie Martin',
            time: '1 week ago',
            amount: 75000,
          },
        ],
        loanStatus: null, // or { amount: 100000, remaining: 50000, nextPayment: '2025-02-15' }
      };
    },
  });

  if (isLoading) {
    return <ContentLoader className="mt-[30%]" />;
  }

  const stats = dashboardData || {
    accountBalance: 0,
    loanBalance: 0,
    availableBalance: 0,
    recentTransactions: [],
    loanStatus: null,
  };

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>My Account</ToolbarTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Welcome back, {session?.user?.name || 'Client'}
            </p>
          </ToolbarHeading>
          <ToolbarActions>
            <Link href="/account/status">
              <Button variant="outline">
                <FileText className="mr-2 w-4 h-4" />
                View Statement
              </Button>
            </Link>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container>
        <div className="grid gap-5 lg:gap-7.5">
          {/* Account Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <StatCard
              title="Account Balance"
              value={new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'XOF',
                minimumFractionDigits: 0,
              }).format(stats.accountBalance)}
              description="Current balance"
              icon={Wallet}
              className="border-green-200 dark:border-green-800 lg:col-span-1"
            />
            <StatCard
              title="Available Balance"
              value={new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'XOF',
                minimumFractionDigits: 0,
              }).format(stats.availableBalance)}
              description="After loan deduction"
              icon={TrendingUp}
              className="lg:col-span-1"
            />
            <StatCard
              title="Loan Balance"
              value={new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'XOF',
                minimumFractionDigits: 0,
              }).format(stats.loanBalance)}
              description={stats.loanBalance > 0 ? 'Remaining loan' : 'No active loan'}
              icon={CreditCard}
              className={stats.loanBalance > 0 ? 'border-orange-200 dark:border-orange-800' : ''}
            />
          </div>

          {/* Loan Status Card */}
          {stats.loanStatus && (
            <Card className="border-orange-200 dark:border-orange-800">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  Active Loan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Loan Amount</p>
                    <p className="text-lg font-semibold">
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'XOF',
                        minimumFractionDigits: 0,
                      }).format((stats.loanStatus as any).amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Remaining</p>
                    <p className="text-lg font-semibold">
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'XOF',
                        minimumFractionDigits: 0,
                      }).format((stats.loanStatus as any).remaining)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Next Payment</p>
                    <p className="text-lg font-semibold">
                      {new Date((stats.loanStatus as any).nextPayment).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <Link href="/loans">
                  <Button variant="outline" className="w-full mt-4">
                    View Loan Details
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Recent Transactions */}
          <div className="grid lg:grid-cols-1 gap-5">
            <RecentActivityCard
              activities={stats.recentTransactions.map((t: any) => ({
                ...t,
                amount: Math.abs(t.amount),
              }))}
              title="Recent Transactions"
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Link href="/transactions/deposits">
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingUp className="mr-2 w-4 h-4" />
                    Request Deposit
                  </Button>
                </Link>
                <Link href="/transactions/withdrawals">
                  <Button variant="outline" className="w-full justify-start">
                    <CreditCard className="mr-2 w-4 h-4" />
                    Request Withdrawal
                  </Button>
                </Link>
                <Link href="/loans/requests">
                  <Button variant="outline" className="w-full justify-start">
                    <DollarSign className="mr-2 w-4 h-4" />
                    Request Loan
                  </Button>
                </Link>
                <Link href="/reports/client-statement">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="mr-2 w-4 h-4" />
                    Download Statement
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </>
  );
}
