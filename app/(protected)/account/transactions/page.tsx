import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import TransactionList from '@/app/(protected)/transactions/components/transaction-list';
import { Container } from '@/components/common/container';
import { Toolbar, ToolbarHeading, ToolbarTitle } from '@/components/common/toolbar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Transaction History',
};

export default async function TransactionHistoryPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user) {
    redirect('/signin');
  }

  let accountId: string | undefined;

  // Check if user is an agent
  const agent = await prisma.agent.findUnique({
    where: { userId: user.id },
    select: { accountId: true },
  });

  if (agent) {
    accountId = agent.accountId;
  } else {
    // Check if user is a client
    const client = await prisma.client.findUnique({
      where: { userId: user.id },
      select: { accountId: true },
    });
    if (client) {
      accountId = client.accountId;
    }
  }

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>Transaction History</ToolbarTitle>
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
                  <BreadcrumbPage>Transactions</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
        </Toolbar>
      </Container>
      <Container>
        {accountId ? (
          <TransactionList accountId={accountId} />
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-card text-card-foreground">
             <p className="text-muted-foreground">No financial account found associated with your profile.</p>
          </div>
        )}
      </Container>
    </>
  );
}
