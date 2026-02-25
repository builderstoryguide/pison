/**
 * Client Statement Report API
 * GET /api/reports/client-statement?clientId=&startDate=&endDate=
 * Agents can only generate statements for clients in their assigned zones.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { reportService, clientService, agentService } from '@/lib/services';
import { z } from 'zod';

const querySchema = z.object({
  clientId: z.string().uuid('Client ID is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sp = request.nextUrl.searchParams;
    const params = querySchema.parse({
      clientId: sp.get('clientId') || '',
      startDate: sp.get('startDate') || '',
      endDate: sp.get('endDate') || '',
    });

    // Agents can only access statements for clients in their assigned zones
    const roleName = (session.user?.roleName || '').toLowerCase();
    if (roleName.includes('agent') || roleName.includes('collector')) {
      const client = await clientService.getClientById(params.clientId);
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

    const data = await reportService.generateClientStatement(params);

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid parameters', details: error.errors } },
        { status: 400 },
      );
    }
    console.error('Client statement report error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'REPORT_ERROR', message: error instanceof Error ? error.message : 'Report generation failed' } },
      { status: 500 },
    );
  }
}
