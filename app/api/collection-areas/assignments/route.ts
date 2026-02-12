/**
 * Agent Area Assignments API
 * GET /api/collection-areas/assignments?agentId=xxx - Get agent's assigned areas
 * POST /api/collection-areas/assignments - Assign area to agent (Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { requirePermission, hasPermission } from '@/lib/auth';
import { agentService } from '@/lib/services';
import { z } from 'zod';

const assignAreasSchema = z.object({
  agentId: z.string().uuid(),
  areaIds: z.array(z.string().uuid()).min(1),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const forbidden = await requirePermission(session, 'collection_areas.view');
    if (forbidden) return forbidden;

    const searchParams = request.nextUrl.searchParams;
    const agentId = searchParams.get('agentId');

    if (!agentId) {
      return NextResponse.json(
        { error: 'agentId parameter is required' },
        { status: 400 }
      );
    }

    // Agents can only view their own assignments; Manager can view any
    const canManage = hasPermission(session, 'collection_areas.manage');
    if (!canManage) {
      // Agents can only view their own assignments
      const agent = await agentService.getAgentByUserId(session.user?.id || '');
      if (!agent || agent.id !== agentId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const areas = await agentService.getAgentAreas(agentId);

    return NextResponse.json({
      success: true,
      data: areas,
    });
  } catch (error: any) {
    console.error('Error fetching agent areas:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error.message || 'Failed to fetch agent areas',
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const forbidden = await requirePermission(session, 'collection_areas.manage');
    if (forbidden) return forbidden;

    const body = await request.json();
    const validatedData = assignAreasSchema.parse(body);

    const agent = await agentService.assignAreas(
      validatedData.agentId,
      validatedData.areaIds,
      session.user?.id || ''
    );

    return NextResponse.json(
      {
        success: true,
        data: agent,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    console.error('Error assigning areas to agent:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'ASSIGN_ERROR',
          message: error.message || 'Failed to assign areas to agent',
        },
      },
      { status: 500 }
    );
  }
}
