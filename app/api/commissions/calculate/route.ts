import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { requirePermission } from '@/lib/auth';
import { calculateMonthlyCommissions } from '@/lib/jobs/commission-calculation';
import { z } from 'zod';

const calculateSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, 'Invalid period format. Use YYYY-MM'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const forbidden = await requirePermission(session, 'commissions.calculate');
    if (forbidden) return forbidden;

    const body = await request.json();
    const validatedData = calculateSchema.parse(body);

    await calculateMonthlyCommissions(validatedData.period, session.user?.id);

    return NextResponse.json({
      success: true,
      message: `Commission calculation started for ${validatedData.period}`,
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

    console.error('Error triggering commission calculation:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CALCULATION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to trigger commission calculation',
        },
      },
      { status: 500 }
    );
  }
}
