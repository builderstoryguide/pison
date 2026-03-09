/**
 * Client Statement Report API
 * GET /api/reports/client-statement?clientId=&startDate=&endDate=
 * Agents can only generate statements for clients in their assigned zones.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { denyAgentAccess } from '@/lib/auth';
import { reportService } from '@/lib/services';
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
    const roleForbidden = denyAgentAccess(
      session,
      'Reports are not available for Agent role'
    );
    if (roleForbidden) return roleForbidden;

    const sp = request.nextUrl.searchParams;
    const params = querySchema.parse({
      clientId: sp.get('clientId') || '',
      startDate: sp.get('startDate') || '',
      endDate: sp.get('endDate') || '',
    });

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
