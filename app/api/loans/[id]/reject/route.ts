import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { requirePermission } from '@/lib/auth';
import { loanService } from '@/lib/services';
import { z } from 'zod';

const rejectSchema = z.object({
  reason: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    const forbidden = await requirePermission(session, 'loans.approve');
    if (forbidden) return forbidden;

    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required. User identity is missing.',
          },
        },
        { status: 401 }
      );
    }

    let reason: string | undefined;
    try {
      const body = await request.json();
      const validated = rejectSchema.parse(body);
      reason = validated.reason;
    } catch {
      // No body or invalid - reason stays undefined
    }

    const loan = await loanService.rejectLoan(params.id, userId, reason);

    return NextResponse.json({
      success: true,
      data: loan,
    });
  } catch (error: any) {
    console.error('Error rejecting loan:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'REJECT_ERROR',
          message: error.message || 'Failed to reject loan',
        },
      },
      { status: 500 }
    );
  }
}
