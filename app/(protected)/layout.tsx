'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Demo1Layout } from '../components/layouts/demo1/layout';

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
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render protected content if unauthenticated
  if (status === 'unauthenticated' || !session) {
    return null;
  }

  return <Demo1Layout>{children}</Demo1Layout>;
}
