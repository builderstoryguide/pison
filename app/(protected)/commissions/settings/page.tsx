'use client';

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
import { useSession } from 'next-auth/react';
import { hasPermission, isManagerRole } from '@/lib/auth-client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SystemCommissionRateForm } from '../components/system-commission-rate-form';

export default function CommissionSettingsPage() {
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const allowed =
    status === 'authenticated' &&
    hasPermission(session, 'settings.manage') &&
    isManagerRole(session);

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{t('pages.commissions.settingsTitle')}</ToolbarTitle>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">{t('common.breadcrumbs.home')}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{t('menu.commissions')}</BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{t('pages.commissions.settingsTitle')}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
          <ToolbarActions />
        </Toolbar>
      </Container>

      <Container className="space-y-6">
        <p className="text-muted-foreground text-sm max-w-2xl">
          {t('pages.commissions.settingsDescription')}
        </p>
        {!allowed && status === 'authenticated' ? (
          <Alert variant="destructive">
            <AlertTitle>{t('pages.commissions.forbidden')}</AlertTitle>
            <AlertDescription>{t('pages.commissions.forbidden')}</AlertDescription>
          </Alert>
        ) : null}
        {allowed ? <SystemCommissionRateForm /> : null}
      </Container>
    </>
  );
}
