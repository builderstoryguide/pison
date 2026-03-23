'use client';

import { useRouter } from 'next/navigation';
import {
  BarChart3,
  BookOpen,
  Calculator,
  FileText,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const reports = [
  {
    title: 'Monthly Balance',
    description: 'Client account balances with deposits, withdrawals, collections, and commissions for a given month.',
    href: '/reports/monthly-balance',
    icon: BarChart3,
    color: 'text-primary',
    bg: 'bg-primary/10 dark:bg-primary/30',
  },
  {
    title: 'Collection Journal',
    description: 'Detailed log of all daily collection transactions by agent and area within a date range.',
    href: '/reports/collection-journal',
    icon: BookOpen,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
  {
    title: 'Client Statement',
    description: 'Full account statement for a specific client showing all debits, credits, and running balance.',
    href: '/reports/client-statement',
    icon: FileText,
    color: 'text-primary',
    bg: 'bg-primary/10 dark:bg-primary/30',
  },
  {
    title: 'Area Statistics',
    description: 'Performance metrics by collection area: transaction volume, net balance, client and agent counts.',
    href: '/reports/area-statistics',
    icon: MapPin,
    color: 'text-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
  },
  {
    title: 'Commission Report',
    description: 'Commission charges on withdrawal transactions: amounts, rates, and totals per client or period.',
    href: '/reports/commissions',
    icon: Calculator,
    color: 'text-rose-600',
    bg: 'bg-rose-50 dark:bg-rose-950/30',
  },
  {
    title: 'Surplus / Shortage',
    description: 'Daily reconciliation of physical cash versus system balance. Identifies discrepancies.',
    href: '/reports/surplus-shortage',
    icon: TrendingUp,
    color: 'text-primary',
    bg: 'bg-primary/10 dark:bg-primary/30',
  },
];

export default function ReportsDashboard() {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {reports.map((report) => {
        const Icon = report.icon;
        return (
          <Card
            key={report.href}
            className="cursor-pointer hover:shadow-md transition-shadow group"
            onClick={() => router.push(report.href)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center size-10 rounded-lg ${report.bg}`}>
                  <Icon className={`size-5 ${report.color}`} />
                </div>
                <CardTitle className="text-base group-hover:text-primary transition-colors">
                  {report.title}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {report.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
