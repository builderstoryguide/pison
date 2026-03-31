'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { apiFetch } from '@/lib/api';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Container } from '@/components/common/container';
import { ContentLoader } from '@/components/common/content-loader';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';
import { SettingsProvider } from './components/settings-context';
import { isAgentOrCollectorRole } from '@/lib/auth-client';
import { useTranslation } from '@/hooks/useTranslation';

type NavRoutes = Record<
  string,
  {
    titleKey: string;
    path: string;
  }
>;

export default function Layout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const fetchSettings = async () => {
    const response = await apiFetch('/api/user-management/settings');
    if (!response.ok) {
      throw new Error(t('pages.userManagement.systemSettingsLayout.fetchFailed'));
    }
    return response.json();
  };

  const { data = { settings: null, roles: [] }, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: fetchSettings,
    staleTime: Infinity,
    refetchInterval: false,
    gcTime: 1000 * 60 * 60, // 60 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  const { settings, roles } = data;

  const navRoutes = useMemo<NavRoutes>(
    () => ({
      general: {
        titleKey: 'pages.userManagement.systemSettingsLayout.tabs.general',
        path: '/user-management/settings',
      },
      notifications: {
        titleKey: 'pages.userManagement.systemSettingsLayout.tabs.notifications',
        path: '/user-management/settings/notifications',
      },
    }),
    [],
  );

  const [activeTab, setActiveTab] = useState<string>('');

  useEffect(() => {
    const found = Object.keys(navRoutes).find(
      (key) => pathname === navRoutes[key].path,
    );
    if (found) {
      setActiveTab(found);
    } else {
      setActiveTab('general');
    }
  }, [navRoutes, pathname]);

  const handleTabClick = (key: string, path: string) => {
    setActiveTab(key);
    router.push(path);
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/signin');
      return;
    }
    if (
      status === 'authenticated' &&
      isAgentOrCollectorRole(session?.user?.roleName)
    ) {
      router.replace('/');
    }
  }, [router, session?.user?.roleName, status]);

  if (
    status === 'loading' ||
    status === 'unauthenticated' ||
    (status === 'authenticated' &&
      isAgentOrCollectorRole(session?.user?.roleName))
  ) {
    return null;
  }

  if (isLoading) {
    return <ContentLoader className="mt-[30%]" />;
  }

  return (
    <SettingsProvider settings={settings} roles={roles ?? []}>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{t('pages.userManagement.systemSettingsLayout.toolbarTitle')}</ToolbarTitle>
          </ToolbarHeading>
          <ToolbarActions />
        </Toolbar>
      </Container>
      <Container>
        <Tabs defaultValue={activeTab} value={activeTab} className="space-y-5">
          <TabsList variant="line">
            {Object.entries(navRoutes).map(([key, { titleKey, path }]) => (
              <TabsTrigger
                key={key}
                value={key}
                disabled={isLoading}
                onClick={() => handleTabClick(key, path)}
                className="justify-start"
              >
                {t(titleKey)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="grow mt-5">{children}</div>
      </Container>
    </SettingsProvider>
  );
}
