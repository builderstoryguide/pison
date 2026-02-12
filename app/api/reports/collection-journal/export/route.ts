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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const areaId = searchParams.get('areaId');
    const agentId = searchParams.get('agentId');
    const format = searchParams.get('format') as 'csv' | 'excel';

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Date range is required' }, { status: 400 });
    }

    if (!['csv', 'excel'].includes(format)) {
      return NextResponse.json({ error: 'Invalid format. Use csv or excel' }, { status: 400 });
    }

    const data = await reportService.generateCollectionJournal({
      startDate,
      endDate,
      areaId: areaId || undefined,
      agentId: agentId || undefined,
    });

    const buffer = await reportService.exportReport(data, format, 'Collection Journal');

    const headers = new Headers();
    headers.set('Content-Type', format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    headers.set('Content-Disposition', `attachment; filename=collection-journal-${startDate}-to-${endDate}.${format === 'csv' ? 'csv' : 'xlsx'}`);

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
