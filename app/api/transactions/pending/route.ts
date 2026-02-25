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
    const limitRaw = searchParams.get('limit');
    const limit = limitRaw ? parseInt(limitRaw, 10) : 50;
    const offsetRaw = searchParams.get('offset');
    const offset = offsetRaw ? parseInt(offsetRaw, 10) : 0;

    if (!Number.isFinite(limit) || !Number.isInteger(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid limit (must be 1-100)' },
        },
        { status: 400 }
      );
    }
    if (!Number.isFinite(offset) || !Number.isInteger(offset) || offset < 0) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid offset' },
        },
        { status: 400 }
      );
    }

    const transactions = await transactionService.getPendingTransactions({
      type: type || undefined,
      areaId: areaId || undefined,
      agentId: agentId || undefined,
      accountId: accountId || undefined,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: { limit, offset },
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
