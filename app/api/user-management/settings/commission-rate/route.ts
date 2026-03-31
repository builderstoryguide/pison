import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { getOrCreateSystemSetting } from '@/lib/db';
import { prisma } from '@/lib/prisma';
import { requireManagerRole } from '@/lib/auth';

const updateSystemCommissionRateSchema = z.object({
  commissionRatePercent: z.coerce.number().min(0).max(100),
});

function percentToDecimal(ratePercent: number): number {
  return Number((ratePercent / 100).toFixed(4));
}

function decimalToPercent(rateDecimal: number): number {
  return Number((rateDecimal * 100).toFixed(2));
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const forbidden = requireManagerRole(session);
    if (forbidden) return forbidden;

    const settings = await getOrCreateSystemSetting();

    return NextResponse.json({
      success: true,
      data: {
        commissionRatePercent: decimalToPercent(settings.commissionRate.toNumber()),
      },
    });
  } catch (error) {
    console.error('Error fetching system commission rate:', error);
    return NextResponse.json(
      { success: false, error: { code: 'FETCH_ERROR', message: 'Failed to fetch commission rate settings' } },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const forbidden = requireManagerRole(session);
    if (forbidden) return forbidden;

    const body = await request.json();
    const { commissionRatePercent } = updateSystemCommissionRateSchema.parse(body);

    const settings = await getOrCreateSystemSetting();

    const updated = await prisma.systemSetting.update({
      where: { id: settings.id },
      data: { commissionRate: percentToDecimal(commissionRatePercent) },
      select: { commissionRate: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        commissionRatePercent: decimalToPercent(updated.commissionRate.toNumber()),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Commission rate must be between 0 and 100',
            details: error.errors,
          },
        },
        { status: 400 },
      );
    }

    console.error('Error updating system commission rate:', error);
    return NextResponse.json(
      { success: false, error: { code: 'UPDATE_ERROR', message: 'Failed to update commission rate settings' } },
      { status: 500 },
    );
  }
}
