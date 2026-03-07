'use client';

import { useSession } from 'next-auth/react';
import { useSessionStatus } from '@/hooks/use-session-status';
import { hasPermission } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { signOut } from 'next-auth/react';
import { Lock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface SessionEnforcerProps {
  children: React.ReactNode;
}

export function SessionEnforcer({ children }: SessionEnforcerProps) {
  const { data: session } = useSession();
  const { data: sessionStatus, isLoading: isSessionLoading, isError, error, refetch } = useSessionStatus();

  // Allow managers to bypass the check entirely (no wait)
  const canManageSession = hasPermission(session, 'session.manage');
  if (canManageSession) {
    return <>{children}</>;
  }

  // Show retry UI when session status fetch fails (e.g. network, server error)
  if (isError && !sessionStatus) {
    return (
      <div className="flex min-h-[60vh] w-full flex-col items-center justify-center p-4 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
          <Lock className="h-10 w-10 text-amber-600" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          Unable to Load Session Status
        </h1>
        <p className="mb-6 max-w-md text-muted-foreground">
          {error?.message || 'Failed to fetch session status. Please check your connection and try again.'}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => refetch()}>
            Try Again
          </Button>
          <Button variant="outline" onClick={() => signOut({ callbackUrl: '/signin' })}>
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  if (isSessionLoading) {
    return (
      <div className="w-full mx-auto px-4 lg:px-6 max-w-[1320px] py-6 space-y-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-5 lg:gap-7.5 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  const isSessionClosed = sessionStatus && !sessionStatus.isOpen;

  // If session is closed and user cannot manage session, block access
  if (isSessionClosed) {
    const wasClosed =
      sessionStatus.session?.status === 'CLOSED' ||
      sessionStatus.session?.status === 'LOCKED';
    const message = wasClosed
      ? 'The daily session has been closed. Please wait for a manager to open a new session before you can access the system.'
      : 'The daily session has not been opened yet. Please wait for a manager to open the session before you can access the system.';

    return (
      <div className="flex min-h-[60vh] w-full flex-col items-center justify-center p-4 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
          <Lock className="h-10 w-10 text-red-600" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          System Locked
        </h1>
        <p className="mb-8 max-w-md text-foreground">
          {message}
        </p>
        <Button
          variant="outline"
          onClick={() => signOut({ callbackUrl: '/auth/signin' })}
        >
          Sign Out
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
