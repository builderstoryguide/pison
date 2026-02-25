'use client';

import { useParams } from 'next/navigation';
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
  ToolbarActions,
} from '@/components/common/toolbar';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { Edit } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import ClientDetails from './components/client-details';

export default function Page() {
  const params = useParams();
  const { t } = useTranslation();
  const { data: session } = useSession();
  const id = params.id as string;

  const roleName = (session?.user?.roleName || '').toLowerCase();
  const isAgentOrCollector = roleName.includes('agent') || roleName.includes('collector');
  const canEdit = !isAgentOrCollector;

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{t('pages.clientDetails.title')}</ToolbarTitle>
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
                  <BreadcrumbPage>{t('common.breadcrumbs.details')}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
          <ToolbarActions>
            {canEdit && (
              <Link href={`/clients/${id}/edit`}>
                <Button variant="outline">
                  <Edit className="mr-2 size-4" />
                  {t('common.buttons.edit')}
                </Button>
              </Link>
            )}
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container>
        <ClientDetails clientId={id} />
      </Container>
    </>
  );
}
