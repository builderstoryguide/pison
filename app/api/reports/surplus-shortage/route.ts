/**
 * Surplus / Shortage Report API
 * GET /api/reports/surplus-shortage?startDate=&endDate=
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { requirePermission } from '@/lib/auth';
import { reportService } from '@/lib/services';
import { z } from 'zod';

const querySchema = z.object({
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const forbidden = await requirePermission(session, 'reports.view');
    if (forbidden) return forbidden;

    const sp = request.nextUrl.searchParams;
    const params = querySchema.parse({
      startDate: sp.get('startDate') || '',
      endDate: sp.get('endDate') || '',
    });

    const data = await reportService.generateSurplusShortageReport(params);

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid parameters', details: error.errors } },
        { status: 400 },
      );
    }
    console.error('Surplus/shortage report error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'REPORT_ERROR', message: error.message || 'Report generation failed' } },
      { status: 500 },
    );
  }
}
