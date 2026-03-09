'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';

interface DropdownAppsItem {
  logo: string;
  title: string;
  description: string;
  checkbox: boolean;
}

export function AppsDropdownMenu({ trigger }: { trigger: ReactNode }) {
  const { t } = useTranslation();
  const items: DropdownAppsItem[] = [
    {
      logo: 'jira.svg',
      title: 'Jira',
      description: t('pages.topbar.apps.items.jira'),
      checkbox: false,
    },
    {
      logo: 'inferno.svg',
      title: 'Inferno',
      description: t('pages.topbar.apps.items.inferno'),
      checkbox: true,
    },
    {
      logo: 'evernote.svg',
      title: 'Evernote',
      description: t('pages.topbar.apps.items.evernote'),
      checkbox: true,
    },
    {
      logo: 'gitlab.svg',
      title: 'Gitlab',
      description: t('pages.topbar.apps.items.gitlab'),
      checkbox: false,
    },
    {
      logo: 'google-webdev.svg',
      title: 'Google webdev',
      description: t('pages.topbar.apps.items.googleWebdev'),
      checkbox: true,
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent className="w-[325px] p-0" side="bottom" align="end">
        <div className="flex items-center justify-between gap-2.5 text-xs text-secondary-foreground font-medium px-5 py-3 border-b border-b-border">
          <span>{t('pages.topbar.apps.title')}</span>
          <span>{t('pages.topbar.apps.enabled')}</span>
        </div>
        <div className="flex flex-col scrollable-y-auto max-h-[400px] divide-y divide-border">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between flex-wrap gap-2 px-5 py-3.5"
            >
              <div className="flex items-center flex-wrap gap-2">
                <div className="flex items-center justify-center shrink-0 rounded-full bg-accent/60 border border-border size-10">
                  <img
                    src={toAbsoluteUrl(`/media/brand-logos/${item.logo}`)}
                    className="size-6"
                    alt={item.title}
                  />
                </div>

                <div className="flex flex-col">
                  <a
                    href="#"
                    className="text-sm font-semibold text-mono hover:text-primary-active"
                  >
                    {item.title}
                  </a>
                  <span className="text-xs font-medium text-secondary-foreground">
                    {item.description}
                  </span>
                </div>
              </div>
              <Switch defaultChecked={item.checkbox} size="sm"></Switch>
            </div>
          ))}
        </div>
        <div className="grid p-5 border-t border-t-border">
          <Button asChild variant="outline" size="sm">
            <Link href="/account/api-keys">{t('pages.topbar.apps.goToApps')}</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
