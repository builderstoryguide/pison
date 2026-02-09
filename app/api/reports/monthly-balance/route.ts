/**
 * Monthly Balance Report API
 * GET /api/reports/monthly-balance?month=YYYY-MM&clientId=&areaId=
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { reportService } from '@/lib/services';
import { z } from 'zod';

const querySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be YYYY-MM'),
  clientId: z.string().uuid().optional(),
  areaId: z.string().uuid().optional(),
});

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
    const params = querySchema.parse({
      month: sp.get('month') || '',
      clientId: sp.get('clientId') || undefined,
      areaId: sp.get('areaId') || undefined,
    });

    const data = await reportService.generateMonthlyBalance(params);

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid parameters', details: error.errors } },
        { status: 400 },
      );
    }
    console.error('Monthly balance report error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'REPORT_ERROR', message: error.message || 'Report generation failed' } },
      { status: 500 },
    );
  }
}
