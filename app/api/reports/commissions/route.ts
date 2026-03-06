/**
 * Commission Report API
 * GET  /api/reports/commissions?period=YYYY-MM&clientId=
 * POST /api/reports/commissions (trigger calculation for a period)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { denyAgentAccess, requirePermission } from '@/lib/auth';
import { reportService, commissionService } from '@/lib/services';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const roleForbidden = denyAgentAccess(
      session,
      'Reports are not available for Agent role'
    );
    if (roleForbidden) return roleForbidden;

    const forbidden = await requirePermission(session, 'reports.view');
    if (forbidden) return forbidden;

    const sp = request.nextUrl.searchParams;
    const period = sp.get('period') || undefined;
    const clientId = sp.get('clientId') || undefined;

    const [data, summaryByClient] = await Promise.all([
      reportService.generateCommissionReport({ period, clientId }),
      reportService.generateCommissionSummaryByClient({ period, clientId }),
    ]);

    return NextResponse.json({ success: true, data, summaryByClient });
  } catch (error: unknown) {
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
    const roleForbidden = denyAgentAccess(
      session,
      'Reports are not available for Agent role'
    );
    if (roleForbidden) return roleForbidden;

    const forbidden = await requirePermission(session, 'commissions.calculate');
    if (forbidden) return forbidden;

    const body = await request.json();
    const { period } = calcSchema.parse(body);

    const commissions = await commissionService.createCommissionsForPeriod(
      period,
      session.user?.id || '',
    );

    return NextResponse.json({ success: true, data: commissions }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.errors } },
        { status: 400 },
      );
    }
    console.error('Commission calculation error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'CALC_ERROR', message: error instanceof Error ? error.message : 'Commission calculation failed' } },
      { status: 500 },
    );
  }
}
