import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { hasPermission } from '@/lib/auth';
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
  const isManager = roleName.includes('manager');
  const isPending = loan.status === 'PENDING';
  const isActive = ['DISBURSED', 'ACTIVE'].includes(loan.status);
  const canRecordRepayment = hasPermission(session, 'loans.repayment');

  return (
    <LoanDetailContent
      loan={loan}
      isManager={isManager}
      isPending={isPending}
      isActive={isActive}
      canRecordRepayment={canRecordRepayment}
    />
  );
}
