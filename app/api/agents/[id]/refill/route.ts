/**
 * Agent Account Refill API
 * POST /api/agents/[id]/refill - Refill agent account (Accountant/Admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { agentService } from '@/lib/services';
import { z } from 'zod';

const refillSchema = z.object({
  amount: z.number().positive(),
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

    // Accountant and Admin can refill agent accounts
    const roleName = (session.user?.roleName || '').toLowerCase();
    if (!roleName.includes('admin') && !roleName.includes('accountant')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = refillSchema.parse(body);

    const transaction = await agentService.refillAgentAccount(
      params.id,
      validatedData.amount,
      session.user?.id || ''
    );

    return NextResponse.json(
      {
        success: true,
        data: transaction,
      },
      { status: 201 }
    );
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

    console.error('Error refilling agent account:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'REFILL_ERROR',
          message: error.message || 'Failed to refill agent account',
        },
      },
      { status: 500 }
    );
  }
}
