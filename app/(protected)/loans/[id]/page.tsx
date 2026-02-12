import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { loanService } from '@/lib/services';
import LoanDetailContent from './components/loan-detail-content';

interface PageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const loan = await loanService.getLoanById(id);
  if (!loan) return { title: 'Loan Not Found' };
  return {
    title: `Loan ${loan.loanNumber}`,
    description: `Details for loan ${loan.loanNumber}`,
  };
}
export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const loan = await loanService.getLoanById(id);

  if (!loan) {
    notFound();
  }

  const roleName = (session?.user?.roleName || '').toLowerCase();
  const isAdmin = roleName.includes('admin');
  const isPending = loan.status === 'PENDING';
  const isActive = ['DISBURSED', 'ACTIVE'].includes(loan.status);

  return (
    <LoanDetailContent
      loan={loan}
      isAdmin={isAdmin}
      isPending={isPending}
      isActive={isActive}
    />
  );
}
