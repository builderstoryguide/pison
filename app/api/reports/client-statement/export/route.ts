import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { denyAgentAccess } from '@/lib/auth';
import { reportService } from '@/lib/services';

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
    const clientId = searchParams.get('clientId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const format = searchParams.get('format') as 'csv' | 'excel' | 'pdf';

    if (!clientId || !startDate || !endDate) {
      return NextResponse.json({ error: 'Client and date range are required' }, { status: 400 });
    }

    if (!['csv', 'excel', 'pdf'].includes(format)) {
      return NextResponse.json({ error: 'Invalid format. Use csv, excel or pdf' }, { status: 400 });
    }

    const data = await reportService.generateClientStatement({
      clientId,
      startDate,
      endDate,
    });

    const buffer = await reportService.exportReport(data.rows, format, 'Client Statement');

    const headers = new Headers();
    const ext = format === 'csv' ? 'csv' : format === 'pdf' ? 'pdf' : 'xlsx';
    const mime =
      format === 'csv'
        ? 'text/csv'
        : format === 'pdf'
          ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    headers.set('Content-Type', mime);
    const safeFilename = data.client.fullName.replace(/[^a-zA-Z0-9-_]/g, '_');
    headers.set('Content-Disposition', `attachment; filename=client-statement-${safeFilename}.${ext}`);

    return new NextResponse(buffer, {
      status: 200,
      headers,
    });
  } catch (error: unknown) {
    console.error('Error exporting report:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'EXPORT_ERROR',
          message: error instanceof Error ? error.message : 'Failed to export report',
        },
      },
      { status: 500 }
    );
  }
}
