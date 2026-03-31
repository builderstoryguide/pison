/**
 * GET /api/collection-areas/assignment-occupancy
 * Map of collection areas to their assigned agent (for assignment UI).
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { requirePermission } from '@/lib/auth';
import { agentService } from '@/lib/services';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const forbidden = await requirePermission(session, 'collection_areas.manage');
    if (forbidden) return forbidden;

    const data = await agentService.getAreaAssignmentOccupancy();
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load occupancy';
    return NextResponse.json(
      { success: false, error: { code: 'FETCH_ERROR', message } },
      { status: 500 }
    );
  }
}
