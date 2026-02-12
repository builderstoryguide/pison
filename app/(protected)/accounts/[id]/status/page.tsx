import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import AccountStatusContent from './components/account-status-content';

interface PageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: 'Account Status',
    description: 'View account status and details',
  };
}

async function getAccountData(id: string) {
  return await prisma.financialAccount.findUnique({
    where: { id },
    include: {
      client: true,
      agent: true,
      _count: {
        select: {
          transactions: true,
          loans: true,
        },
      },
      transactions: {
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
      loans: {
        where: { status: { in: ['ACTIVE', 'DISBURSED'] } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const account = await getAccountData(id);

  if (!account) {
    notFound();
  }

  const ownerName = account.client?.fullName || account.agent?.fullName || '';
  const ownerTypeKey = account.client ? 'client' : account.agent ? 'agent' : 'systemAccount';

  return (
    <AccountStatusContent
      account={account}
      ownerName={ownerName}
      ownerType={ownerTypeKey}
    />
  );
}
