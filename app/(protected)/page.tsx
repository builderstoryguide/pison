import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { getDashboardStats } from '@/lib/services/dashboard-service';
import AdminDashboard from './dashboard/admin/page';
import AccountantDashboard from './dashboard/accountant/page';
import AgentDashboard from './dashboard/agent/page';

/**
 * Main protected page - routes users to their appropriate dashboard based on role.
 * Server-renders dashboard stats for faster initial load.
 *
 * IMPORTANT: Per PRD Special Notation #1, Clients do NOT have direct access to their account.
 * All client operations must be performed through Agents or Accountants.
 * Clients should not be able to log in or access any interface.
 */
export default async function Page() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/signin');
  }

  // Fetch dashboard stats on the server for faster initial paint
  const initialStats = await getDashboardStats(session);

  const roleName = (session.user.roleName || '').toLowerCase();

  // Narrow stats by role: getDashboardStats returns AdminDashboardStats for admin/accountant,
  // AgentDashboardStats for agent/collector. Use type assertions after role checks.
  if (roleName.includes('accountant')) {
    return (
      <AccountantDashboard
        initialStats={
          initialStats && 'activeClients' in initialStats ? initialStats : null
        }
      />
    );
  }
  if (roleName.includes('agent') || roleName.includes('collector')) {
    return (
      <AgentDashboard
        initialStats={
          initialStats && 'assignedClientsCount' in initialStats
            ? initialStats
            : null
        }
      />
    );
  }
  // NOTE: Client role is intentionally excluded - clients cannot access the system directly
  // All client operations must be performed through Agents or Accountants per PRD Special Notation #1

  // Default: show admin dashboard (covers admin role + demo/no-session)
  return (
    <AdminDashboard
      initialStats={
        initialStats && 'activeClients' in initialStats ? initialStats : null
      }
    />
  );
}
