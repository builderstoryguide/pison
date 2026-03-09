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
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';
import { useTranslation } from '@/hooks/useTranslation';
import { hasPermission } from '@/lib/auth-client';
import { toast } from 'sonner';
import ClientForm from '../components/client-form';

export default function Page() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated' || !session) return;
    if (!hasPermission(session, 'clients.create')) {
      toast.error(t('pages.clients.accessDenied'));
      router.replace('/clients');
    }
  }, [session, status, router, t]);

  if (status === 'loading') {
    return null;
  }
  if (status === 'unauthenticated' || !session) {
    return null;
  }
  if (!hasPermission(session, 'clients.create')) {
    return null;
  }

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{t('pages.clientDetails.newClient')}</ToolbarTitle>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">{t('common.breadcrumbs.home')}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/clients">{t('menu.clients')}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{t('common.breadcrumbs.new')}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
        </Toolbar>
      </Container>

      <Container>
        <ClientForm />
      </Container>
    </>
  );
}
