/**
 * Reject Transaction API
 * POST /api/transactions/[id]/reject - Reject transaction (Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { requirePermission } from '@/lib/auth';
import { transactionService } from '@/lib/services';
import { z } from 'zod';

const rejectSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const forbidden = await requirePermission(session, 'transactions.approve');
    if (forbidden) return forbidden;

    const body = await request.json();
    const validatedData = rejectSchema.parse(body);

    const transaction = await transactionService.rejectTransaction(
      params.id,
      session.user?.id || '',
      validatedData.reason
    );

    return NextResponse.json({
      success: true,
      data: transaction,
    });
  } catch (error: any) {
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

    console.error('Error rejecting transaction:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'REJECT_ERROR',
          message: error.message || 'Failed to reject transaction',
        },
      },
      { status: 500 }
    );
  }
}
