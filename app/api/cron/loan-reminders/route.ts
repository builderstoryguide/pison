/**
 * Internal cron endpoint for loan maturity reminder emails.
 * Requires CRON_SECRET header.
 * POST /api/cron/loan-reminders
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendLoanMaturityReminders } from '@/lib/jobs/loan-maturity-reminders';

export async function POST(request: NextRequest) {
  const secret =
    request.headers.get('x-cron-secret') ||
    request.headers.get('authorization')?.replace('Bearer ', '');
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await sendLoanMaturityReminders();
    return NextResponse.json({
      success: true,
      message: 'Loan reminder notifications processed',
      data: result,
    });
  } catch (error: any) {
    console.error('[Cron] Loan reminder error:', error);
    return NextResponse.json(
      { error: error.message || 'Loan reminder job failed' },
      { status: 500 }
    );
  }
}
