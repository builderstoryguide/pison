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
import { UserCheck, MapPin } from 'lucide-react';

export default function AgentPerformancePage() {
  const { t } = useTranslation();

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{t('menu.agentPerformance')}</ToolbarTitle>
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
                  <BreadcrumbPage>{t('menu.agentPerformance')}</BreadcrumbPage>
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
              <UserCheck className="size-5" />
              {t('menu.agentPerformance')}
            </CardTitle>
            <CardDescription>
              {t('pages.analytics.agentsDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('pages.analytics.useReports')}
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/reports/area-statistics">
                <Button variant="outline" size="sm" className="gap-2">
                  <MapPin className="size-4" />
                  {t('pages.reports.areaStatistics')}
                </Button>
              </Link>
              <Link href="/reports/collection-journal">
                <Button variant="outline" size="sm" className="gap-2">
                  {t('pages.reports.collectionJournal')}
                </Button>
              </Link>
              <Link href="/agents">
                <Button variant="outline" size="sm" className="gap-2">
                  {t('menu.allAgents')}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </Container>
    </>
  );
}
