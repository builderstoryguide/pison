/**
 * Account Nature API (Single)
 * GET /api/account-natures/[id] - Get account nature with required documents
 * PUT /api/account-natures/[id] - Update config (Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { requirePermission, hasPermission } from '@/lib/auth';
import { accountNatureService } from '@/lib/services';
import { z } from 'zod';

const updateSchema = z.object({
  minBalance: z.number().min(0).optional().nullable(),
  minOpeningContribution: z.number().min(0).optional().nullable(),
  interestRateDefault: z.number().min(0).max(1).optional().nullable(),
  interestRateMin: z.number().min(0).max(1).optional().nullable(),
  interestRateMax: z.number().min(0).max(1).optional().nullable(),
  maintenanceFee: z.number().min(0).optional().nullable(),
  transactionFee: z.number().min(0).optional().nullable(),
  openingFee: z.number().min(0).optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    const forbidden = await requirePermission(session, 'clients.view');
    if (forbidden) return forbidden;

    const nature = await accountNatureService.getById(params.id);

    if (!nature) {
      return NextResponse.json({ error: 'Account nature not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: nature,
    });
  } catch (error: unknown) {
    console.error('Error fetching account nature:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch account nature',
        },
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    if (!hasPermission(session, 'settings.manage')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validated = updateSchema.parse(body);

    const { prisma } = await import('@/lib/prisma');
    const updated = await prisma.accountNature.update({
      where: { id: params.id },
      data: {
        ...(validated.minBalance !== undefined && { minBalance: validated.minBalance }),
        ...(validated.minOpeningContribution !== undefined && {
          minOpeningContribution: validated.minOpeningContribution,
        }),
        ...(validated.interestRateDefault !== undefined && {
          interestRateDefault: validated.interestRateDefault,
        }),
        ...(validated.interestRateMin !== undefined && {
          interestRateMin: validated.interestRateMin,
        }),
        ...(validated.interestRateMax !== undefined && {
          interestRateMax: validated.interestRateMax,
        }),
        ...(validated.maintenanceFee !== undefined && {
          maintenanceFee: validated.maintenanceFee,
        }),
        ...(validated.transactionFee !== undefined && {
          transactionFee: validated.transactionFee,
        }),
        ...(validated.openingFee !== undefined && { openingFee: validated.openingFee }),
        ...(validated.isActive !== undefined && { isActive: validated.isActive }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
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
    console.error('Error updating account nature:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update account nature',
        },
      },
      { status: 500 }
    );
  }
}
