import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { denyAgentAccess, requirePermission } from '@/lib/auth';
import { reportService } from '@/lib/services';

function sanitizePeriodForFilename(period?: string): string | null {
  if (!period) return null;
  return /^\d{4}-\d{2}$/.test(period) ? period : null;
}

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

    const searchParams = request.nextUrl.searchParams;
    const rawPeriod = searchParams.get('period') || undefined;
    const period = sanitizePeriodForFilename(rawPeriod);
    if (rawPeriod && !period) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid period format. Use YYYY-MM' },
        },
        { status: 400 },
      );
    }
    const clientId = searchParams.get('clientId') || undefined;
    const format = searchParams.get('format') as 'csv' | 'excel' | 'pdf';

    if (!format || !['csv', 'excel', 'pdf'].includes(format)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid format. Use csv, excel or pdf' } },
        { status: 400 },
      );
    }

    const data = await reportService.generateCommissionReport({ period, clientId });
    const exportFileName = period
      ? `commission-report-${period}`
      : 'commission-report';
    const buffer = await reportService.exportReport(data, format, 'Commission Report');

    const extension = format === 'csv' ? 'csv' : format === 'pdf' ? 'pdf' : 'xlsx';
    const contentType =
      format === 'csv'
        ? 'text/csv'
        : format === 'pdf'
          ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${exportFileName}.${extension}"`,
      },
    });
  } catch (error: unknown) {
    console.error('Commission export error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'EXPORT_ERROR',
          message: 'An unexpected error occurred while exporting commissions',
        },
      },
      { status: 500 },
    );
  }
}
