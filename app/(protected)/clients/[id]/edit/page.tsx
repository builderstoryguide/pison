'use client';

import { useParams, useRouter } from 'next/navigation';
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
import ClientForm from '../../components/client-form';

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const id = params.id as string;

  // Protect page from Agents and Collectors
  const roleName = (session?.user?.roleName || '').toLowerCase();
  const isAgentOrCollector = roleName.includes('agent') || roleName.includes('collector');

  if (status === 'authenticated' && isAgentOrCollector) {
    router.replace(`/clients/${id}`);
    return null;
  }

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{t('pages.clientDetails.editClient')}</ToolbarTitle>
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
                  <BreadcrumbPage>{t('common.breadcrumbs.edit')}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
        </Toolbar>
      </Container>

      <Container>
        <ClientForm clientId={id} />
      </Container>
    </>
  );
}
