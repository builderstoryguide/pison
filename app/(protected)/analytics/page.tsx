'use client';

import Link from 'next/link';
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
import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, UserCheck } from 'lucide-react';

const analyticsLinks = [
  {
    title: 'menu.financialSummary',
    description: 'pages.analytics.financialDesc',
    href: '/analytics/financial',
    icon: BarChart3,
  },
  {
    title: 'menu.transactionTrends',
    description: 'pages.analytics.transactionsDesc',
    href: '/analytics/transactions',
    icon: TrendingUp,
  },
  {
    title: 'menu.agentPerformance',
    description: 'pages.analytics.agentsDesc',
    href: '/analytics/agents',
    icon: UserCheck,
  },
];

export default function AnalyticsPage() {
  const { t } = useTranslation();

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{t('menu.analytics')}</ToolbarTitle>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">{t('common.breadcrumbs.home')}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{t('menu.overview')}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
          <ToolbarActions />
        </Toolbar>
      </Container>

      <Container>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {analyticsLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.href} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10">
                      <Icon className="size-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">{t(item.title)}</CardTitle>
                  </div>
                  <CardDescription>{t(item.description)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={item.href}>
                    <Button variant="outline" size="sm">
                      {t('common.buttons.view')}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </Container>
    </>
  );
}
