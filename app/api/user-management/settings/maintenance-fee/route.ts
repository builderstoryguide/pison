import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { getOrCreateSystemSetting } from '@/lib/db';
import { prisma } from '@/lib/prisma';
import { requireManagerRole } from '@/lib/auth';

const updateSchema = z.object({
  maintenanceFeeBillingDay: z.coerce.number().int().min(1).max(28),
  maintenanceFeeAutomationEnabled: z.boolean(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const forbidden = requireManagerRole(session);
    if (forbidden) return forbidden;

    const settings = await getOrCreateSystemSetting();

    return NextResponse.json({
      success: true,
      data: {
        maintenanceFeeBillingDay: settings.maintenanceFeeBillingDay,
        maintenanceFeeAutomationEnabled: settings.maintenanceFeeAutomationEnabled,
        timezone: settings.timezone,
      },
    });
  } catch (error) {
    console.error('Error fetching maintenance fee settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'FETCH_ERROR', message: 'Failed to fetch maintenance fee settings' },
      },
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
    const parsed = updateSchema.parse(body);

    const settings = await getOrCreateSystemSetting();

    const updated = await prisma.systemSetting.update({
      where: { id: settings.id },
      data: {
        maintenanceFeeBillingDay: parsed.maintenanceFeeBillingDay,
        maintenanceFeeAutomationEnabled: parsed.maintenanceFeeAutomationEnabled,
      },
      select: {
        maintenanceFeeBillingDay: true,
        maintenanceFeeAutomationEnabled: true,
        timezone: true,
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
            message: 'Billing day must be between 1 and 28',
            details: error.errors,
          },
        },
        { status: 400 },
      );
    }

    console.error('Error updating maintenance fee settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'UPDATE_ERROR', message: 'Failed to update maintenance fee settings' },
      },
      { status: 500 },
    );
  }
}
