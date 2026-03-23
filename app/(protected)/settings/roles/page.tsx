'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
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
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';
import { ContentLoader } from '@/components/common/content-loader';
import { useTranslation } from '@/hooks/useTranslation';
import RoleList from '@/app/(protected)/user-management/roles/components/role-list';
import { hasPermission } from '@/lib/auth-client';

export default function SettingsRolesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation();
  const [accessChecked, setAccessChecked] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/signin');
      return;
    }
    if (status === 'authenticated' && session) {
      const allowed = hasPermission(session, 'roles.manage');
      setAccessChecked(true);
      if (!allowed) {
        router.replace('/');
      }
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return <ContentLoader className="mt-[30%]" />;
  }

  if (status === 'authenticated' && (!accessChecked || !hasPermission(session, 'roles.manage'))) {
    return <ContentLoader className="mt-[30%]" />;
  }

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{t('pages.userManagement.roles')}</ToolbarTitle>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">{t('common.breadcrumbs.home')}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/settings">{t('menu.settings')}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{t('pages.userManagement.roles')}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
        </Toolbar>
      </Container>
      <Container>
        <RoleList />
      </Container>
    </>
  );
}
