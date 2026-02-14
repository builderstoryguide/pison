/**
 * Transactions API
 * GET /api/transactions - List transactions (with filters)
 * POST /api/transactions - Create a transaction (Deposit or Withdrawal)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { requirePermission } from '@/lib/auth';
import { transactionService } from '@/lib/services';
import { z } from 'zod';

const createTransactionSchema = z.object({
  accountId: z.string().uuid(),
  type: z.enum(['DEPOSIT', 'WITHDRAWAL']),
  amount: z.coerce.number().positive('Amount must be positive'),
  description: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const forbidden = await requirePermission(session, 'transactions.view');
    if (forbidden) return forbidden;

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || undefined;
    const status = searchParams.get('status') || undefined;
    const accountId = searchParams.get('accountId') || undefined;
    const areaId = searchParams.get('areaId') || undefined;
    const agentId = searchParams.get('agentId') || undefined;
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : undefined;
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : undefined;
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!, 10)
      : 50;
    const offset = searchParams.get('offset')
      ? parseInt(searchParams.get('offset')!, 10)
      : 0;

    const { transactions, total } = await transactionService.getTransactions({
      type,
      status,
      accountId,
      areaId,
      agentId,
      startDate,
      endDate,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: {
        total,
        limit,
        offset,
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch transactions',
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const forbidden = await requirePermission(session, 'transactions.create');
    if (forbidden) return forbidden;

    const userId = session?.user?.id;
    if (!session || !session.user || !userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createTransactionSchema.parse(body);

    const transaction = await transactionService.createTransaction(
      {
        accountId: validatedData.accountId,
        type: validatedData.type,
        amount: validatedData.amount,
        description: validatedData.description,
      },
      userId
    );

    return NextResponse.json(
      {
        success: true,
        data: transaction,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    console.error('Error creating transaction:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create transaction',
        },
      },
      { status: 500 }
    );
  }
}
