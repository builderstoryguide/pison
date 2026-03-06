/**
 * Transfer API
 * POST /api/transactions/transfer - Create a dual-entry transfer (Accountant/Manager)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { denyAgentAccess, requirePermission } from '@/lib/auth';
import { transactionService } from '@/lib/services';
import { z } from 'zod';

const transferSchema = z
  .object({
    sourceAccountId: z.string().uuid(),
    destinationAccountId: z.string().uuid(),
    amount: z.coerce.number().positive('Amount must be positive'),
    description: z.string().optional(),
  })
  .refine((data) => data.sourceAccountId !== data.destinationAccountId, {
    message: 'Source and destination must differ',
    path: ['destinationAccountId'],
  });

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const roleForbidden = denyAgentAccess(
      session,
      'Transfers are not available for Agent role'
    );
    if (roleForbidden) return roleForbidden;

    const forbidden = await requirePermission(session, 'transactions.create');
    if (forbidden) return forbidden;

    // requirePermission returns 401 for null session, so session is guaranteed here
    const userId = session!.user!.id;
    const body = await request.json();
    const validatedData = transferSchema.parse(body);

    const result = await transactionService.createTransfer(
      validatedData,
      userId
    );

    return NextResponse.json(
      {
        success: true,
        data: result,
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

    console.error('Error creating transfer:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create transfer',
        },
      },
      { status: 500 }
    );
  }
}
