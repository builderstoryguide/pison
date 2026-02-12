/**
 * Pending Transactions API
 * GET /api/transactions/pending - List pending transactions (Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { requirePermission } from '@/lib/auth';
import { transactionService } from '@/lib/services';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const forbidden = await requirePermission(session, 'transactions.approve');
    if (forbidden) return forbidden;

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
