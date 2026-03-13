'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/partials/common/toolbar';
import { useTranslation } from '@/hooks/useTranslation';
import { useSettings } from '@/providers/settings-provider';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/common/container';
import { AccountUserProfileContent } from '@/app/(protected)/account/home/user-profile/content';
import { PageNavbar } from '@/app/(protected)/account/page-navbar';

export default function AccountUserProfilePage() {
  const { t } = useTranslation();
  const { settings } = useSettings();

  return (
    <Fragment>
      <PageNavbar />
      {settings?.layout === 'demo1' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>
                {t('pages.profile.centralHubDescription')}
              </ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <Button variant="outline" asChild>
                <Link href="/public-profile/profiles/default">{t('menu.publicProfile')}</Link>
              </Button>
              <Button>
                <Link href="#">{t('pages.account.title')}</Link>
              </Button>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}
      <Container>
        <AccountUserProfileContent />
      </Container>
    </Fragment>
  );
}
