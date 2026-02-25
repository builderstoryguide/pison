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
import { hasPermission } from '@/lib/auth-client';
import { Edit } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import CollectionAreaDetails from './components/collection-area-details';

export default function Page() {
  const params = useParams();
  const { t } = useTranslation();
  const { data: session } = useSession();
  const id = params.id as string;

  const canManage = hasPermission(session, 'collection_areas.manage');

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{t('pages.collectionAreas.areaDetails')}</ToolbarTitle>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">{t('common.breadcrumbs.home')}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/collection-areas">{t('menu.collectionAreas')}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{t('common.breadcrumbs.details')}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
          <ToolbarActions>
            {canManage && (
              <Link href={`/collection-areas/${id}/edit`}>
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
        <CollectionAreaDetails areaId={id} />
      </Container>
    </>
  );
}
