import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { requirePermission } from '@/lib/auth';
import { loanService } from '@/lib/services';

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    const forbidden = await requirePermission(session, 'loans.approve');
    if (forbidden) return forbidden;

    const loan = await loanService.approveLoan(
      params.id,
      session.user?.id || ''
    );

    return NextResponse.json({
      success: true,
      data: loan,
    });
  } catch (error: any) {
    console.error('Error approving loan:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'APPROVE_ERROR',
          message: error.message || 'Failed to approve loan',
        },
      },
      { status: 500 }
    );
  }
}
