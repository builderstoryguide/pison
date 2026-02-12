import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { reportService } from '@/lib/services';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month');
    const clientId = searchParams.get('clientId');
    const areaId = searchParams.get('areaId');
    const format = searchParams.get('format') as 'csv' | 'excel';

    if (!month) {
      return NextResponse.json({ error: 'Month is required' }, { status: 400 });
    }

    if (!['csv', 'excel'].includes(format)) {
      return NextResponse.json({ error: 'Invalid format. Use csv or excel' }, { status: 400 });
    }

    const data = await reportService.generateMonthlyBalance({
      month,
      clientId: clientId || undefined,
      areaId: areaId || undefined,
    });

    const buffer = await reportService.exportReport(data, format, 'Monthly Balance');

    const headers = new Headers();
    headers.set('Content-Type', format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    headers.set('Content-Disposition', `attachment; filename=monthly-balance-${month}.${format === 'csv' ? 'csv' : 'xlsx'}`);

    return new NextResponse(buffer, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error('Error exporting report:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'EXPORT_ERROR',
          message: error.message || 'Failed to export report',
        },
      },
      { status: 500 }
    );
  }
}
