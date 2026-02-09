'use client';

import { useSession } from 'next-auth/react';
import { ContentLoader } from '@/components/common/content-loader';
import AdminDashboard from './dashboard/admin/page';
import AccountantDashboard from './dashboard/accountant/page';
import AgentDashboard from './dashboard/agent/page';

/**
 * Main protected page - routes users to their appropriate dashboard based on role.
 * 
 * IMPORTANT: Per PRD Special Notation #1, Clients do NOT have direct access to their account.
 * All client operations must be performed through Agents or Accountants.
 * Clients should not be able to log in or access any interface.
 */
export default function Page() {
  const { data: session, status } = useSession();

  // Show loader while session is loading
  if (status === 'loading') {
    return <ContentLoader className="mt-[30%]" />;
  }

  // Route to appropriate dashboard based on user role
  const roleName = (session?.user?.roleName || '').toLowerCase();

  if (roleName.includes('accountant')) {
    return <AccountantDashboard />;
  } else if (roleName.includes('agent') || roleName.includes('collector')) {
    return <AgentDashboard />;
  }
  // NOTE: Client role is intentionally excluded - clients cannot access the system directly
  // All client operations must be performed through Agents or Accountants per PRD Special Notation #1

  // Default: show admin dashboard (covers admin role + demo/no-session)
  return <AdminDashboard />;
}
