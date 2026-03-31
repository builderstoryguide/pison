/**
 * POST /api/treasury/issue — Manager-only: credit operating account (treasury issuance)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { denyAgentAccess, requirePermission } from '@/lib/auth';
import { transactionService } from '@/lib/services';
import { z } from 'zod';

const issueSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive'),
  description: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const roleBlock = denyAgentAccess(session, 'Treasury issuance is not available for this role');
    if (roleBlock) return roleBlock;

    const forbidden = await requirePermission(session, 'treasury.issue');
    if (forbidden) return forbidden;

    const body = await request.json();
    const data = issueSchema.parse(body);

    const userId = session!.user!.id;
    const txn = await transactionService.issueTreasuryLiquidity(
      userId,
      data.amount,
      data.description,
    );

    return NextResponse.json({ success: true, data: txn }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: error.errors,
          },
        },
        { status: 400 },
      );
    }

    const message = error instanceof Error ? error.message : 'Failed to issue liquidity';
    if (message.includes('Only managers can')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message } },
        { status: 403 },
      );
    }
    if (message.includes('no operating account')) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_OPERATING_ACCOUNT', message } },
        { status: 422 },
      );
    }

    console.error('Treasury issue error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'ISSUE_ERROR', message } },
      { status: 500 },
    );
  }
}
