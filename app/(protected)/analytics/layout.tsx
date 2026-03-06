import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { isAgentOrCollectorRole } from '@/lib/auth';

export default async function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (isAgentOrCollectorRole(session?.user?.roleName)) {
    redirect('/');
  }

  return children;
}
