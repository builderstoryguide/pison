/**
 * Internal cron endpoint for automatic commission calculation.
 * Called by server.js scheduler. Requires CRON_SECRET header.
 * POST /api/cron/commission
 * Body: { period: "YYYY-MM" }
 */

import { NextRequest, NextResponse } from 'next/server';
import { calculateMonthlyCommissions } from '@/lib/jobs/commission-calculation';
import { getSystemUserId } from '@/lib/system-user';
import { z } from 'zod';

const schema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, 'Invalid period. Use YYYY-MM'),
});

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret') || request.headers.get('authorization')?.replace('Bearer ', '');
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { period } = schema.parse(body);
    const systemUserId = await getSystemUserId();
    await calculateMonthlyCommissions(period, systemUserId);
    return NextResponse.json({ success: true, message: `Commissions calculated for ${period}` });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('[Cron] Commission calculation error:', error);
    return NextResponse.json(
      { error: error.message || 'Commission calculation failed' },
      { status: 500 }
    );
  }
}
