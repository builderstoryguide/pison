import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { requirePermission } from '@/lib/auth';
import { agentService } from '@/lib/services';
import { z } from 'zod';

const refillSchema = z.object({
  amount: z.number().positive(),
});

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    const forbidden = await requirePermission(session, 'agents.edit');
    if (forbidden) return forbidden;

    const body = await request.json();
    const validatedData = refillSchema.parse(body);

    const transaction = await agentService.refillAgentAccount(
      params.id,
      validatedData.amount,
      session.user?.id || ''
    );

    return NextResponse.json({
      success: true,
      data: transaction,
    });
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

    if (error instanceof Error && error.message?.includes('Daily session is closed')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SESSION_CLOSED',
            message:
              'Daily session is closed. Open the session from Operations > Session Status before refilling agent accounts.',
          },
        },
        { status: 422 }
      );
    }

    console.error('Error refilling agent account:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'REFILL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to refill agent account',
        },
      },
      { status: 500 }
    );
  }
}
