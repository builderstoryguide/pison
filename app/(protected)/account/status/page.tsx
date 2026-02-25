import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import AccountStatusContent from '../../accounts/[id]/status/components/account-status-content';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export const metadata: Metadata = {
  title: 'My Account Status',
  description: 'View your account status and details',
};

async function getMyAccountData(userId: string) {
  // First update to check Client
  const client = await prisma.client.findUnique({
    where: { userId },
    select: { accountId: true },
  });

  let accountId = client?.accountId;

  if (!accountId) {
    const agent = await prisma.agent.findUnique({
      where: { userId },
      select: { accountId: true },
    });
    accountId = agent?.accountId;
  }

  if (!accountId) return null;

  return await prisma.financialAccount.findUnique({
    where: { id: accountId },
    include: {
      client: { select: { fullName: true, phone: true } },
      agent: { select: { fullName: true, phone: true } },
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

export default async function MyAccountStatusPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return <div>Unauthorized</div>;
  }

  const rawAccount = await getMyAccountData(session.user.id);

  if (!rawAccount) {
    return (
       <div className="flex flex-col items-center justify-center p-8 text-center min-h-[50vh]">
         <h2 className="text-xl font-semibold mb-2">No Account Found</h2>
         <p className="text-muted-foreground">There is no financial account associated with your profile.</p>
       </div>
    );
  }

  // Serialize Prisma Decimal fields to plain numbers so Next.js can pass
  // this data from the Server Component to the Client Component.
  const account = {
    ...rawAccount,
    balance: Number(rawAccount.balance),
    availableBalance: Number(rawAccount.availableBalance),
    transactions: rawAccount.transactions.map((txn) => ({
      ...txn,
      amount: Number(txn.amount),
    })),
    loans: rawAccount.loans.map((loan) => ({
      ...loan,
      principalAmount: Number(loan.principalAmount),
      remainingBalance: Number(loan.remainingBalance),
    })),
  };

  const ownerName = account.client?.fullName || account.agent?.fullName || '';
  const ownerType = account.client ? 'client' : account.agent ? 'agent' : 'systemAccount';

  const myBreadcrumbs = (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/account/profile">My Account</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Status</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );

  return (
    <AccountStatusContent
      account={account}
      ownerName={ownerName}
      ownerType={ownerType}
      breadcrumbs={myBreadcrumbs}
    />
  );
}
