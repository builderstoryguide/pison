/**
 * Agent API (Single)
 * GET /api/agents/[id] - Get agent details
 * PUT /api/agents/[id] - Update agent
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { requirePermission } from '@/lib/auth';
import { agentService, AreaAlreadyAssignedError } from '@/lib/services';
import { z } from 'zod';

const updateAgentSchema = z.object({
  fullName: z.string().min(1).max(255).optional(),
  nationalId: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  areaIds: z.array(z.string().uuid()).optional(),
});

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    const forbidden = await requirePermission(session, 'agents.view');
    if (forbidden) return forbidden;

    const agent = await agentService.getAgentById(params.id);

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: agent,
    });
  } catch (error: unknown) {
    console.error('Error fetching agent:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch agent',
        },
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    const forbidden = await requirePermission(session, 'agents.edit');
    if (forbidden) return forbidden;

    const body = await request.json();
    const validatedData = updateAgentSchema.parse(body);

    // updateAgent now handles both agent data and area assignments in a single transaction
    const updatedAgent = await agentService.updateAgent(
      params.id,
      validatedData,
      session.user?.id || ''
    );

    return NextResponse.json({
      success: true,
      data: updatedAgent,
    });
  } catch (error: unknown) {
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

    if (error instanceof AreaAlreadyAssignedError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AREA_ALREADY_ASSIGNED',
            message: error.message,
            details: error.details,
          },
        },
        { status: 409 }
      );
    }

    console.error('Error updating agent:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update agent',
        },
      },
      { status: 500 }
    );
  }
}
