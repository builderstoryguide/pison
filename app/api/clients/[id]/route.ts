/**
 * Client API (Single)
 * GET /api/clients/[id] - Get client details
 * PUT /api/clients/[id] - Update client (Accountant/Admin)
 * DELETE /api/clients/[id] - Deactivate client (Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { isManagerRole, requirePermission } from '@/lib/auth';
import { clientService } from '@/lib/services';
import { z } from 'zod';

const updateClientSchema = z.object({
  fullName: z.string().min(1).max(255).optional(),
  nationalId: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  areaId: z.string().uuid().optional(),
  agentId: z.string().uuid().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'CLOSED']).optional(),
  isCommissionExempt: z.boolean().optional(),
  commissionRatePercent: z.number().min(0).max(100).nullable().optional(),
});

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    const forbidden = await requirePermission(session, 'clients.view');
    if (forbidden) return forbidden;

    // Fetch the client once; reuse for both the access check and the response
    const client = await clientService.getClientById(params.id);

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // For agents/collectors: verify client is in an area assigned to this agent
    const roleName = (session?.user?.roleName || '').toLowerCase();
    if (roleName.includes('agent') || roleName.includes('collector')) {
      const { agentService } = await import('@/lib/services');
      const agent = await agentService.getAgentByUserId(session?.user?.id || '');
      if (!agent) {
        return NextResponse.json({ error: 'Agent record not found' }, { status: 403 });
      }
      const hasAreaAccess = await agentService.validateAgentAreaAccess(agent.id, client.areaId);
      if (!hasAreaAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json({
      success: true,
      data: client,
    });
  } catch (error: any) {
    console.error('Error fetching client:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error.message || 'Failed to fetch client',
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
    const forbidden = await requirePermission(session, 'clients.edit');
    if (forbidden) return forbidden;

    const body = await request.json();
    const validatedData = updateClientSchema.parse(body);

    const client = await clientService.getClientById(params.id);
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Prevent Agents and Collectors from updating client details
    const roleName = (session?.user?.roleName || '').toLowerCase();
    if (roleName.includes('agent') || roleName.includes('collector')) {
      return NextResponse.json(
        { error: 'Agents and Collectors are not allowed to edit client details' },
        { status: 403 }
      );
    }

    if (validatedData.commissionRatePercent !== undefined && !isManagerRole(session)) {
      return NextResponse.json(
        { error: 'Only managers and administrators can set per-client commission rates' },
        { status: 403 }
      );
    }

    const commissionRateOverride =
      validatedData.commissionRatePercent === undefined
        ? undefined
        : validatedData.commissionRatePercent === null
          ? null
          : Number((validatedData.commissionRatePercent / 100).toFixed(4));

    const { commissionRatePercent, ...baseValidatedData } = validatedData;

    const updatedClient = await clientService.updateClient(
      params.id,
      {
        ...baseValidatedData,
        commissionRateOverride,
      },
      session?.user?.id || ''
    );

    return NextResponse.json({
      success: true,
      data: updatedClient,
    });
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

    console.error('Error updating client:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: error?.message || 'Failed to update client',
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    const forbidden = await requirePermission(session, 'clients.delete');
    if (forbidden) return forbidden;

    // Prevent Agents and Collectors from deactivating clients
    const roleName = (session?.user?.roleName || '').toLowerCase();
    if (roleName.includes('agent') || roleName.includes('collector')) {
      return NextResponse.json(
        { error: 'Agents and Collectors are not allowed to deactivate clients' },
        { status: 403 }
      );
    }

    const client = await clientService.deactivateClient(
      params.id,
      session?.user?.id || ''
    );

    return NextResponse.json({
      success: true,
      data: client,
    });
  } catch (error: any) {
    console.error('Error deactivating client:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: error?.message || 'Failed to deactivate client',
        },
      },
      { status: 500 }
    );
  }
}
