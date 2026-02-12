/**
 * Clients API
 * GET /api/clients - List all clients
 * POST /api/clients - Create new client (Accountant/Admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { requirePermission } from '@/lib/auth';
import { clientService } from '@/lib/services';
import { z } from 'zod';

const createClientSchema = z.object({
  fullName: z.string().min(1).max(255),
  nationalId: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  areaId: z.string().uuid(),
  isCommissionExempt: z.boolean().optional().default(false),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const forbidden = await requirePermission(session, 'clients.view');
    if (forbidden) return forbidden;

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as
      | 'ACTIVE'
      | 'INACTIVE'
      | 'SUSPENDED'
      | 'CLOSED'
      | null;
    const areaId = searchParams.get('areaId');
    const search = searchParams.get('search');

    // Check role and filter by agent's areas if agent
    const roleName = (session.user?.roleName || '').toLowerCase();
    let filteredAreaId = areaId;

    if (roleName.includes('agent') || roleName.includes('collector')) {
      // Agents can only see clients in their assigned areas
      const { agentService } = await import('@/lib/services');
      const agent = await agentService.getAgentByUserId(session.user?.id || '');
      if (!agent) {
        return NextResponse.json({ error: 'Agent record not found' }, { status: 404 });
      }

      const agentAreas = await agentService.getAgentAreas(agent.id);
      const agentAreaIds = agentAreas.map((a) => a.id);

      if (agentAreaIds.length === 0) {
        return NextResponse.json({ success: true, data: [] });
      }

      // If areaId specified, validate agent has access
      if (areaId && !agentAreaIds.includes(areaId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Filter by agent's areas
      filteredAreaId = areaId || undefined;
      // Note: We'll filter in the service if no areaId specified
    }

    const clients = await clientService.getAllClients({
      status: status || undefined,
      areaId: filteredAreaId,
      search: search || undefined,
    });

    // If agent and no areaId specified, filter by agent's areas
    if ((roleName.includes('agent') || roleName.includes('collector')) && !areaId) {
      const { agentService } = await import('@/lib/services');
      const agent = await agentService.getAgentByUserId(session.user?.id || '');
      if (agent) {
        const agentAreas = await agentService.getAgentAreas(agent.id);
        const agentAreaIds = agentAreas.map((a) => a.id);
        const filtered = clients.filter((c) => agentAreaIds.includes(c.areaId));
        return NextResponse.json({ success: true, data: filtered });
      }
    }

    return NextResponse.json({
      success: true,
      data: clients,
    });
  } catch (error: any) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error.message || 'Failed to fetch clients',
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const forbidden = await requirePermission(session, 'clients.create');
    if (forbidden) return forbidden;

    const body = await request.json();
    const validatedData = createClientSchema.parse(body);

    const client = await clientService.createClient(validatedData, session.user?.id || '');

    return NextResponse.json(
      {
        success: true,
        data: client,
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

    console.error('Error creating client:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: error.message || 'Failed to create client',
        },
      },
      { status: 500 }
    );
  }
}
