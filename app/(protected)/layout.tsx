'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Demo1Layout } from '../components/layouts/demo1/layout';
import { ScreenLoader } from '@/components/common/screen-loader';
import { SessionEnforcer } from './components/session-enforcer';
import { ClosureCountdownAlerts } from './components/closure-countdown-alerts';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Redirect to sign-in if not authenticated (client-side fallback)
    if (status === 'unauthenticated') {
      router.replace('/signin');
    }
  }, [status, router]);

  // Show nothing while loading session
  if (status === 'loading') {
    return <ScreenLoader />;
  }

  // Don't render protected content if unauthenticated
  if (status === 'unauthenticated' || !session) {
    return null;
  }

  return (
    <Demo1Layout>
      <ClosureCountdownAlerts />
      <SessionEnforcer>{children}</SessionEnforcer>
    </Demo1Layout>
  );
}
