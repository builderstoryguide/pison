/**
 * Internal cron: monthly account maintenance debits (ACCOUNT_MAINTENANCE_FEE).
 * POST /api/cron/maintenance-fees
 * Requires X-Cron-Secret (or Authorization: Bearer) matching CRON_SECRET.
 *
 * Body (all optional):
 * - period: "YYYY-MM" — if set, uses this period and skips billing-day check unless you still want... actually ignoreBillingDay defaults false when period set? When period is set, skip billing day check (manual/targeted run).
 * - ignoreBillingDay: if true, run today even when not the configured billing day (still needs period or uses current month)
 * - ignoreAutomationDisabled: if true, run even when maintenanceFeeAutomationEnabled is false (recovery)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { maintenanceFeeService } from '@/lib/services';

const bodySchema = z.object({
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional(),
  ignoreBillingDay: z.boolean().optional(),
  ignoreAutomationDisabled: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  const secret =
    request.headers.get('x-cron-secret') ||
    request.headers.get('authorization')?.replace('Bearer ', '');
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const raw = await request.json().catch(() => ({}));
    const body = bodySchema.parse(raw);

    const settingsRow = await prisma.systemSetting.findFirst({
      select: {
        timezone: true,
        maintenanceFeeAutomationEnabled: true,
      },
    });

    const automationEnabled = settingsRow?.maintenanceFeeAutomationEnabled ?? false;
    const tz = settingsRow?.timezone || 'UTC';

    if (!automationEnabled && !body.ignoreAutomationDisabled) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: 'automation_disabled',
        message: 'Set maintenanceFeeAutomationEnabled or pass ignoreAutomationDisabled for recovery runs',
      });
    }

    const period =
      body.period ?? maintenanceFeeService.currentPeriodInTimezone(tz, new Date());

    const skipBillingDayCheck = Boolean(body.period) || body.ignoreBillingDay === true;

    if (!skipBillingDayCheck) {
      const { run } = await maintenanceFeeService.shouldRunScheduledBilling(new Date());
      if (!run) {
        return NextResponse.json({
          success: true,
          skipped: true,
          reason: 'not_billing_day',
          period,
        });
      }
    }

    const summary = await maintenanceFeeService.runMonthlyMaintenanceForPeriod(period, {
      ignoreAutomationDisabled: body.ignoreAutomationDisabled === true,
    });

    return NextResponse.json({
      success: true,
      message: `Maintenance fees processed for ${period}`,
      data: summary,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('[Cron] Maintenance fees error:', error);
    const message = error instanceof Error ? error.message : 'Maintenance fee job failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
