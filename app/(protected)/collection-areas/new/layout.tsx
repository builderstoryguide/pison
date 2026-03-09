import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { hasPermission } from '@/lib/auth';

export default async function NewCollectionAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session, 'collection_areas.manage')) {
    redirect('/collection-areas');
  }
  return <>{children}</>;
}
