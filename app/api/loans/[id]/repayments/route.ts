import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { loanService } from '@/lib/services';
import { z } from 'zod';

const repaymentSchema = z.object({
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

    // Accountant and Admin can record repayments
    const roleName = (session.user?.roleName || '').toLowerCase();
    if (!roleName.includes('admin') && !roleName.includes('accountant')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
