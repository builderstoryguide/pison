'use client';

import { Fragment } from 'react';
import {
  Toolbar,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/partials/common/toolbar';
import { useSettings } from '@/providers/settings-provider';
import { Container } from '@/components/common/container';
import { PageNavbar } from '@/app/(protected)/account/page-navbar';
import { ProfileInfo } from './components/profile-info';
import { useTranslation } from '@/hooks/useTranslation';

export default function AccountProfilePage() {
  const { settings } = useSettings();
  const { t } = useTranslation();

  return (
    <Fragment>
      <PageNavbar />
      {settings?.layout === 'demo1' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>
                {t('pages.profile.toolbarDescription')}
              </ToolbarDescription>
            </ToolbarHeading>
          </Toolbar>
        </Container>
      )}
      <Container>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 lg:gap-7.5">
          <div className="col-span-1">
            <div className="grid gap-5 lg:gap-7.5">
              <ProfileInfo />
            </div>
          </div>
        </div>
      </Container>
    </Fragment>
  );
}
