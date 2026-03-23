'use client';

import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import { CardNotification } from '@/partials/cards';
import {
  CalendarClock,
  ClipboardCheck,
  DollarSign,
  FileText,
  MessageCircle,
  Tablet,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  IChannelsItem,
  IChannelsItems,
} from '@/app/(protected)/account/notifications/components/channels';

const OtherNotifications = () => {
  const { t } = useTranslation();
  const items: IChannelsItems = [
    {
      icon: Tablet,
      title: t('pages.account.notifications.other.taskAlert'),
      description: t('pages.account.notifications.other.taskAlertDesc'),
      actions: <Switch id="size-sm" size="sm" defaultChecked />,
    },
    {
      icon: DollarSign,
      title: t('pages.account.notifications.other.budgetWarning'),
      description: t('pages.account.notifications.other.budgetWarningDesc'),
      actions: <Switch id="size-sm" size="sm" defaultChecked />,
    },
    {
      icon: FileText,
      title: t('pages.account.notifications.other.invoiceAlert'),
      description: t('pages.account.notifications.other.invoiceAlertDesc'),
      actions: (
        <Button variant="outline">
          <Link href="#">{t('pages.account.notifications.other.viewInvoices')}</Link>
        </Button>
      ),
    },
    {
      icon: MessageCircle,
      title: t('pages.account.notifications.other.feedbackAlert'),
      description: t('pages.account.notifications.other.feedbackAlertDesc'),
      actions: <Switch id="size-sm" size="sm" defaultChecked />,
    },
    {
      icon: Users,
      title: t('pages.account.notifications.other.collaborationRequest'),
      description: t('pages.account.notifications.other.collaborationRequestDesc'),
      actions: <Switch id="size-sm" size="sm" defaultChecked />,
    },
    {
      icon: CalendarClock,
      title: t('pages.account.notifications.other.meetingReminder'),
      description: t('pages.account.notifications.other.meetingReminderDesc'),
      actions: (
        <Button variant="outline">
          <Link href="#">{t('pages.account.notifications.other.showMeetings')}</Link>
        </Button>
      ),
    },
    {
      icon: ClipboardCheck,
      title: t('pages.account.notifications.other.statusChange'),
      description: t('pages.account.notifications.other.statusChangeDesc'),
      actions: <Switch id="size-sm" size="sm" defaultChecked />,
    },
  ];

  const renderItem = (item: IChannelsItem, index: number) => {
    return (
      <CardNotification
        icon={item.icon}
        title={item.title}
        description={item.description}
        button={item.button}
        actions={item.actions}
        key={index}
      />
    );
  };

  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle>{t('pages.account.notifications.other.title')}</CardTitle>
        <div className="flex items-center gap-2">
          <Label htmlFor="size-sm" className="text-sm">
            {t('pages.account.notifications.channels.teamWideAlerts')}
          </Label>
          <Switch id="size-sm" size="sm" />
        </div>
      </CardHeader>
      <div id="notifications_cards">
        {items.map((item, index) => {
          return renderItem(item, index);
        })}
      </div>
    </Card>
  );
};

export { OtherNotifications };
