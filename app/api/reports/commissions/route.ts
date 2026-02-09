/**
 * Commission Report API
 * GET  /api/reports/commissions?period=YYYY-MM&clientId=
 * POST /api/reports/commissions (trigger calculation for a period)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { reportService, commissionService } from '@/lib/services';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const roleName = (session.user?.roleName || '').toLowerCase();
    if (!roleName.includes('admin') && !roleName.includes('accountant')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sp = request.nextUrl.searchParams;
    const period = sp.get('period') || undefined;
    const clientId = sp.get('clientId') || undefined;

    const data = await reportService.generateCommissionReport({ period, clientId });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Commission report error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'REPORT_ERROR', message: error.message || 'Report generation failed' } },
      { status: 500 },
    );
  }
}

const calcSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, 'Period must be YYYY-MM'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const roleName = (session.user?.roleName || '').toLowerCase();
    if (!roleName.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { period } = calcSchema.parse(body);

    const commissions = await commissionService.createCommissionsForPeriod(
      period,
      session.user?.id || '',
    );

    return NextResponse.json({ success: true, data: commissions }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.errors } },
        { status: 400 },
      );
    }
    console.error('Commission calculation error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'CALC_ERROR', message: error.message || 'Commission calculation failed' } },
      { status: 500 },
    );
  }
}
