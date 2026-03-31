/**
 * GET /api/reports/maintenance-fees?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Aggregates ACCOUNT_MAINTENANCE_FEE transactions for managers/accountants.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { requirePermission } from '@/lib/auth';
import { maintenanceFeeService } from '@/lib/services';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const forbidden = await requirePermission(session, 'reports.view');
    if (forbidden) return forbidden;

    const fromParam = request.nextUrl.searchParams.get('from');
    const toParam = request.nextUrl.searchParams.get('to');
    if (!fromParam || !toParam) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Query params from and to (YYYY-MM-DD) are required' },
        },
        { status: 400 },
      );
    }

    const from = new Date(fromParam);
    const to = new Date(toParam);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid from or to date' },
        },
        { status: 400 },
      );
    }
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);
    if (from > to) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'from must be before or equal to to' },
        },
        { status: 400 },
      );
    }

    const data = await maintenanceFeeService.getMaintenanceFeeReport({ from, to });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Maintenance fees report error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'REPORT_ERROR', message: 'Failed to generate maintenance fee report' },
      },
      { status: 500 },
    );
  }
}
