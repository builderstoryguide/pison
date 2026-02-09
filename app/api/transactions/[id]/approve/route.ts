/**
 * Approve Transaction API
 * POST /api/transactions/[id]/approve - Approve transaction (Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { transactionService } from '@/lib/services';
import { z } from 'zod';

const approveSchema = z.object({
  notes: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only Admin can approve transactions
    const roleName = (session.user?.roleName || '').toLowerCase();
    if (!roleName.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const validatedData = approveSchema.parse(body);

    const transaction = await transactionService.approveTransaction(
      params.id,
      session.user?.id || '',
      validatedData.notes
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

    console.error('Error approving transaction:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'APPROVE_ERROR',
          message: error.message || 'Failed to approve transaction',
        },
      },
      { status: 500 }
    );
  }
}
