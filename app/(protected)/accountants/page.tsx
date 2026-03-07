'use client';

import { useEffect } from 'react';
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
  ToolbarActions,
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';
import { useTranslation } from '@/hooks/useTranslation';
import AccountantList from './components/accountant-list';

export default function Page() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/signin');
    } else if (status === 'authenticated' && session?.user?.roleName?.toLowerCase() !== 'manager') {
      router.replace('/');
    }
  }, [session, status, router]);

  if (status === 'loading' || (status === 'authenticated' && session?.user?.roleName?.toLowerCase() !== 'manager')) {
    return null;
  }

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{t('menu.accountants')}</ToolbarTitle>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">{t('common.breadcrumbs.home')}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{t('menu.accountants')}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
          <ToolbarActions></ToolbarActions>
        </Toolbar>
      </Container>

      <Container>
        <AccountantList />
      </Container>
    </>
  );
}
