'use client';

import { Fragment } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { Engage } from '@/partials/common/engage';
import { Faq } from '@/partials/common/faq';
import {
  HighlightedPosts,
  HighlightedPostsItems,
} from '@/partials/common/highlighted-posts';
import { BellDot, BellRing, MessageSquareText } from 'lucide-react';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Channels, DoNotDistrub, OtherNotifications } from './components';

export function AccountNotificationsContent() {
  const { t } = useTranslation();
  const posts: HighlightedPostsItems = [
    {
      icon: BellRing,
      title: t('pages.account.notifications.posts.streamlinedAlerts'),
      summary: t('pages.account.notifications.posts.streamlinedAlertsSummary'),
      path: '#',
    },
    {
      icon: MessageSquareText,
      title: t('pages.account.notifications.posts.effectiveCommunication'),
      summary: t('pages.account.notifications.posts.effectiveCommunicationSummary'),
      path: '#',
    },
    {
      icon: BellDot,
      title: t('pages.account.notifications.posts.personalizedUpdates'),
      summary: t('pages.account.notifications.posts.personalizedUpdatesSummary'),
      path: '#',
    },
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 lg:gap-7.5">
      <div className="col-span-2">
        <div className="flex flex-col gap-5 lg:gap-7.5">
          <Channels />
          <OtherNotifications />
          <Faq />
          <Engage
            title={t('pages.account.notifications.contactSupport')}
            description={t('pages.account.notifications.contactSupportDesc')}
            image={
              <Fragment>
                <img
                  src={toAbsoluteUrl('/media/illustrations/31.svg')}
                  className="dark:hidden max-h-[150px]"
                  alt="image"
                />
                <img
                  src={toAbsoluteUrl('/media/illustrations/31-dark.svg')}
                  className="light:hidden max-h-[150px]"
                  alt="image"
                />
              </Fragment>
            }
            more={{
              title: t('pages.account.notifications.contactSupport'),
              url: '',
            }}
          />
        </div>
      </div>
      <div className="col-span-1">
        <div className="flex flex-col gap-5 lg:gap-7.5">
          <DoNotDistrub />
          <HighlightedPosts posts={posts} />
        </div>
      </div>
    </div>
  );
}
