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
import { useTranslation } from '@/hooks/useTranslation';

type ReportCardId =
  | 'monthlyBalance'
  | 'collectionJournal'
  | 'clientStatement'
  | 'areaStatistics'
  | 'commissions'
  | 'surplusShortage';

const reports: {
  id: ReportCardId;
  href: string;
  icon: typeof BarChart3;
  color: string;
  bg: string;
}[] = [
  {
    id: 'monthlyBalance',
    href: '/reports/monthly-balance',
    icon: BarChart3,
    color: 'text-primary',
    bg: 'bg-primary/10 dark:bg-primary/30',
  },
  {
    id: 'collectionJournal',
    href: '/reports/collection-journal',
    icon: BookOpen,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
  {
    id: 'clientStatement',
    href: '/reports/client-statement',
    icon: FileText,
    color: 'text-primary',
    bg: 'bg-primary/10 dark:bg-primary/30',
  },
  {
    id: 'areaStatistics',
    href: '/reports/area-statistics',
    icon: MapPin,
    color: 'text-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
  },
  {
    id: 'commissions',
    href: '/reports/commissions',
    icon: Calculator,
    color: 'text-rose-600',
    bg: 'bg-rose-50 dark:bg-rose-950/30',
  },
  {
    id: 'surplusShortage',
    href: '/reports/surplus-shortage',
    icon: TrendingUp,
    color: 'text-primary',
    bg: 'bg-primary/10 dark:bg-primary/30',
  },
];

export default function ReportsDashboard() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {reports.map((report) => {
        const Icon = report.icon;
        const title = t(`pages.reports.dashboard.${report.id}.title`);
        const description = t(`pages.reports.dashboard.${report.id}.description`);
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
                  {title}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
