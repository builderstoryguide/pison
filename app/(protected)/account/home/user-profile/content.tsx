'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { RecentUploads } from '@/app/(protected)/public-profile/profiles/default/components/recent-uploads';
import {
  BasicSettings,
  CalendarAccounts,
  CommunityBadges,
  Connections,
  PersonalInfo,
  StartNow,
  Work,
} from './components';

export function AccountUserProfileContent() {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 lg:gap-7.5">
      <div className="col-span-1">
        <div className="grid gap-5 lg:gap-7.5">
          <PersonalInfo />
          <BasicSettings title={t('pages.profile.basicSettings')} />
          <Work />
          <CommunityBadges />
        </div>
      </div>
      <div className="col-span-1">
        <div className="grid gap-5 lg:gap-7.5">
          <StartNow />
          <CalendarAccounts />
          <Connections url="#" />
          <RecentUploads title={t('pages.profile.myFiles')} />
        </div>
      </div>
    </div>
  );
}
