import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { requirePermission } from '@/lib/auth';
import { loanService } from '@/lib/services';
import { z } from 'zod';

const repaymentSchema = z.object({
  amount: z.number().positive(),
});

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    const forbidden = await requirePermission(session, 'loans.repayment');
    if (forbidden) return forbidden;

    const body = await request.json();
    const validatedData = repaymentSchema.parse(body);

    const repayment = await loanService.recordRepayment(
      params.id,
      validatedData.amount,
      session.user?.id || ''
    );

    return NextResponse.json({
      success: true,
      data: repayment,
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

    console.error('Error recording repayment:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'REPAYMENT_ERROR',
          message: error.message || 'Failed to record repayment',
        },
      },
      { status: 500 }
    );
  }
}
