'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';
import { useTranslation } from '@/hooks/useTranslation';
import { hasPermission, isAgentOrCollectorRole } from '@/lib/auth-client';

type NavItem = {
  key: string;
  title: string;
  path: string;
  permission?: string;
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const [navItems, setNavItems] = useState<NavItem[]>([]);

  const allNavItems = useMemo<NavItem[]>(
    () => [
      { key: 'system', title: t('menu.systemSettings'), path: '/user-management/settings', permission: 'settings.manage' },
      { key: 'commissions', title: t('menu.commissionSettings'), path: '/commissions/settings', permission: 'settings.manage' },
      { key: 'areas', title: t('menu.collectionAreas'), path: '/collection-areas', permission: 'collection_areas.view' },
      { key: 'users', title: t('menu.userManagement'), path: '/user-management/users', permission: 'users.manage' },
      { key: 'roles', title: t('menu.roles'), path: '/settings/roles', permission: 'roles.manage' },
      { key: 'permissions', title: t('menu.permissions'), path: '/settings/permissions', permission: 'roles.manage' },
    ],
    [t],
  );

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    if (isAgentOrCollectorRole(session?.user?.roleName)) {
      router.replace('/');
    }
  }, [router, session?.user?.roleName, status]);

  useEffect(() => {
    if (status !== 'authenticated' || !session) {
      setNavItems([]);
      return;
    }

    const filtered = allNavItems.filter(
      (item) =>
        !item.permission || hasPermission(session, item.permission)
    );
    setNavItems(filtered);
  }, [session, status, allNavItems]);

  const displayItems = navItems;
  const activeTab = useMemo(() => {
    const found = displayItems.find(
      (item) => pathname === item.path || pathname.startsWith(item.path + '/'),
    );
    return found?.key ?? displayItems[0]?.key;
  }, [pathname, displayItems]);

  const handleTabClick = (path: string) => {
    router.push(path);
  };

  if (
    status === 'loading' ||
    status === 'unauthenticated' ||
    (status === 'authenticated' &&
      isAgentOrCollectorRole(session?.user?.roleName))
  ) {
    return null;
  }

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{t('menu.settings')}</ToolbarTitle>
          </ToolbarHeading>
        </Toolbar>
      </Container>
      <Container>
        <Tabs value={activeTab} className="space-y-5">
          <TabsList variant="line" className="flex-wrap">
            {displayItems.map(({ key, title, path }) => (
              <TabsTrigger
                key={key}
                value={key}
                onClick={() => handleTabClick(path)}
              >
                {title}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="grow mt-5">{children}</div>
        </Tabs>
      </Container>
    </>
  );
}
