import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { requireManagerRole } from '@/lib/auth';

const updateClientCommissionRateSchema = z
  .object({
    commissionRatePercent: z.union([z.number().min(0).max(100), z.null()]).optional(),
    isCommissionExempt: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.commissionRatePercent !== undefined || data.isCommissionExempt !== undefined,
    { message: 'At least one of commissionRatePercent or isCommissionExempt is required' },
  );

function percentToDecimal(ratePercent: number): number {
  return Number((ratePercent / 100).toFixed(4));
}

function decimalToPercent(rateDecimal: number): number {
  return Number((rateDecimal * 100).toFixed(2));
}

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    const forbidden = requireManagerRole(session);
    if (forbidden) return forbidden;

    const client = await prisma.client.findUnique({
      where: { id: params.id },
      select: { id: true, commissionRateOverride: true, isCommissionExempt: true },
    });

    if (!client) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Client not found' } },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        clientId: client.id,
        commissionRatePercent:
          client.commissionRateOverride === null
            ? null
            : decimalToPercent(client.commissionRateOverride.toNumber()),
        isCommissionExempt: client.isCommissionExempt,
      },
    });
  } catch (error) {
    console.error('Error fetching client commission rate:', error);
    return NextResponse.json(
      { success: false, error: { code: 'FETCH_ERROR', message: 'Failed to fetch client commission rate' } },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    const forbidden = requireManagerRole(session);
    if (forbidden) return forbidden;

    const body = await request.json();
    const parsed = updateClientCommissionRateSchema.parse(body);

    const data: {
      commissionRateOverride?: number | null;
      isCommissionExempt?: boolean;
    } = {};

    if (parsed.commissionRatePercent !== undefined) {
      data.commissionRateOverride =
        parsed.commissionRatePercent === null
          ? null
          : percentToDecimal(parsed.commissionRatePercent);
    }
    if (parsed.isCommissionExempt !== undefined) {
      data.isCommissionExempt = parsed.isCommissionExempt;
    }

    const updated = await prisma.client.update({
      where: { id: params.id },
      data,
      select: { id: true, commissionRateOverride: true, isCommissionExempt: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        clientId: updated.id,
        commissionRatePercent:
          updated.commissionRateOverride === null
            ? null
            : decimalToPercent(updated.commissionRateOverride.toNumber()),
        isCommissionExempt: updated.isCommissionExempt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid commission payload',
            details: error.errors,
          },
        },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Client not found' } },
        { status: 404 },
      );
    }

    console.error('Error updating client commission rate:', error);
    return NextResponse.json(
      { success: false, error: { code: 'UPDATE_ERROR', message: 'Failed to update client commission rate' } },
      { status: 500 },
    );
  }
}
