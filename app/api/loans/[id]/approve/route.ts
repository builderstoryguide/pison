/**
 * Approve Loan API
 * POST /api/loans/[id]/approve - Approve and disburse loan (Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { loanService } from '@/lib/services';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only Admin can approve loans
    const roleName = (session.user?.roleName || '').toLowerCase();
    if (!roleName.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const loan = await loanService.approveLoan(params.id, session.user?.id || '');

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
