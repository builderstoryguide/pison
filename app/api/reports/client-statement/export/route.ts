import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { reportService, clientService, agentService } from '@/lib/services';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Agents can only export statements for clients in their assigned zones
    const roleName = (session.user?.roleName || '').toLowerCase();
    if (roleName.includes('agent') || roleName.includes('collector')) {
      const client = await clientService.getClientById(clientId);
      if (!client) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }
      const agent = await agentService.getAgentByUserId(session.user?.id || '');
      if (!agent) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      const hasAccess = await agentService.validateAgentAreaAccess(agent.id, client.areaId);
      if (!hasAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
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
