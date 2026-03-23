import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { denyAgentAccess } from '@/lib/auth';
import { reportService } from '@/lib/services';
import { sanitizeFilenameSegment } from '@/lib/utils/filename';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const roleForbidden = denyAgentAccess(
      session,
      'Reports are not available for Agent role'
    );
    if (roleForbidden) return roleForbidden;

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const areaId = searchParams.get('areaId');
    const agentId = searchParams.get('agentId');
    const format = searchParams.get('format') as 'csv' | 'excel' | 'pdf';

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Date range is required' }, { status: 400 });
    }

    if (!['csv', 'excel', 'pdf'].includes(format)) {
      return NextResponse.json({ error: 'Invalid format. Use csv, excel or pdf' }, { status: 400 });
    }

    const data = await reportService.generateCollectionJournal({
      startDate,
      endDate,
      areaId: areaId || undefined,
      agentId: agentId || undefined,
    });

    const buffer = await reportService.exportReport(data, format, 'Collection Journal');

    const headers = new Headers();
    const ext = format === 'csv' ? 'csv' : format === 'pdf' ? 'pdf' : 'xlsx';
    const mime =
      format === 'csv'
        ? 'text/csv'
        : format === 'pdf'
          ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    headers.set('Content-Type', mime);
    const sanitizedStart = sanitizeFilenameSegment(startDate);
    const sanitizedEnd = sanitizeFilenameSegment(endDate);
    headers.set('Content-Disposition', `attachment; filename=collection-journal-${sanitizedStart}-to-${sanitizedEnd}.${ext}`);

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
