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
import { TrendingUp, BookOpen } from 'lucide-react';

export default function TransactionTrendsPage() {
  const { t } = useTranslation();

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{t('menu.transactionTrends')}</ToolbarTitle>
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
                  <BreadcrumbPage>{t('menu.transactionTrends')}</BreadcrumbPage>
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
              <TrendingUp className="size-5" />
              {t('menu.transactionTrends')}
            </CardTitle>
            <CardDescription>
              {t('pages.analytics.transactionsDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('pages.analytics.useReports', 'Use the reports below for transaction analytics.')}
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/reports/collection-journal">
                <Button variant="outline" size="sm" className="gap-2">
                  <BookOpen className="size-4" />
                  {t('pages.reports.collectionJournal')}
                </Button>
              </Link>
              <Link href="/transactions">
                <Button variant="outline" size="sm" className="gap-2">
                  {t('menu.allTransactions')}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </Container>
    </>
  );
}
