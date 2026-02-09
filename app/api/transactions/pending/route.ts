/**
 * Pending Transactions API
 * GET /api/transactions/pending - List pending transactions (Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { transactionService } from '@/lib/services';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only Admin can view pending transactions
    const roleName = (session.user?.roleName || '').toLowerCase();
    if (!roleName.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const areaId = searchParams.get('areaId');
    const agentId = searchParams.get('agentId');
    const accountId = searchParams.get('accountId');

    const transactions = await transactionService.getPendingTransactions({
      type: type || undefined,
      areaId: areaId || undefined,
      agentId: agentId || undefined,
      accountId: accountId || undefined,
    });

    return NextResponse.json({
      success: true,
      data: transactions,
    });
  } catch (error: any) {
    console.error('Error fetching pending transactions:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error.message || 'Failed to fetch pending transactions',
        },
      },
      { status: 500 }
    );
  }
}
