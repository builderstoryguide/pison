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
import { BarChart3, FileText } from 'lucide-react';

export default function FinancialAnalyticsPage() {
  const { t } = useTranslation();

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{t('menu.financialSummary')}</ToolbarTitle>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">{t('common.breadcrumbs.home')}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/analytics">{t('menu.analytics')}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{t('menu.financialSummary')}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
          <ToolbarActions />
        </Toolbar>
      </Container>

      <Container>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="size-5" />
              {t('menu.financialSummary')}
            </CardTitle>
            <CardDescription>
              {t('pages.analytics.financialDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('pages.analytics.useReports', 'Use the reports below for detailed financial analytics.')}
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/reports/monthly-balance">
                <Button variant="outline" size="sm" className="gap-2">
                  <FileText className="size-4" />
                  {t('pages.reports.monthlyBalance')}
                </Button>
              </Link>
              <Link href="/reports/client-statement">
                <Button variant="outline" size="sm" className="gap-2">
                  <FileText className="size-4" />
                  {t('pages.reports.clientStatement')}
                </Button>
              </Link>
              <Link href="/reports/surplus-shortage">
                <Button variant="outline" size="sm" className="gap-2">
                  <FileText className="size-4" />
                  {t('pages.reports.surplusShortage')}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </Container>
    </>
  );
}
