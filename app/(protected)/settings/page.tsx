import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { hasPermission, isAgentOrCollectorRole } from '@/lib/auth';

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/signin');
  }

  if (isAgentOrCollectorRole(session.user?.roleName)) {
    redirect('/');
  }

  // Redirect to roles if user has roles.manage, otherwise to first available settings page
  if (hasPermission(session, 'roles.manage')) {
    redirect('/settings/roles');
  }
  if (hasPermission(session, 'users.manage')) {
    redirect('/user-management/users');
  }
  if (hasPermission(session, 'collection_areas.view')) {
    redirect('/collection-areas');
  }
  if (hasPermission(session, 'reports.view')) {
    redirect('/reports/commissions');
  }
  if (hasPermission(session, 'settings.manage')) {
    redirect('/user-management/settings');
  }

  redirect('/');
}
