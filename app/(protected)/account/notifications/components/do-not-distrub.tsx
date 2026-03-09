'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface IDoNotDistrubProps {
  title?: string;
  icon?: ReactNode;
  text?: string;
}

const DoNotDistrub = ({ title, icon, text }: IDoNotDistrubProps) => {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || t('pages.account.notifications.doNotDisturb.title')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        <p className="text-sm text-secondary-foreground">
          {t('pages.account.notifications.doNotDisturb.description')}
        </p>
        <div>
          <Button mode="link" underlined="dashed">
            <Link href="#">{t('pages.account.notifications.doNotDisturb.learnMore')}</Link>
          </Button>
        </div>
      </CardContent>
      <CardFooter className="justify-center">
        <Button variant="outline">
          <Link href="#" className="flex items-center gap-1.5">
            <div>{icon || <Bell size={16} />}</div>
            {text || t('pages.account.notifications.doNotDisturb.pauseNotifications')}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export { DoNotDistrub, type IDoNotDistrubProps };
