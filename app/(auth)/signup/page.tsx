'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Signup is disabled for public access.
 * Only administrators can create accounts via User Management.
 * This page redirects unauthenticated visitors to the sign-in page.
 */
export default function Page() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/signin');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <p className="text-sm text-muted-foreground text-center">
        Account creation is managed by an administrator.
      </p>
      <p className="text-sm text-muted-foreground text-center">
        Redirecting to sign in...
      </p>
    </div>
  );
}
