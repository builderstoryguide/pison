/**
 * Client API (Single)
 * GET /api/clients/[id] - Get client details
 * PUT /api/clients/[id] - Update client (Accountant/Admin)
 * DELETE /api/clients/[id] - Deactivate client (Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { requirePermission } from '@/lib/auth';
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
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'CLOSED']).optional(),
  isCommissionExempt: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const forbidden = await requirePermission(session, 'clients.view');
    if (forbidden) return forbidden;

    // Check if agent has access to this client's area
    const roleName = (session.user?.roleName || '').toLowerCase();
    if (roleName.includes('agent') || roleName.includes('collector')) {
      const client = await clientService.getClientById(params.id);
      if (!client) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }

      const { agentService } = await import('@/lib/services');
      const agent = await agentService.getAgentByUserId(session.user?.id || '');
      if (agent) {
        const hasAccess = await agentService.validateAgentAreaAccess(agent.id, client.areaId);
        if (!hasAccess) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    }

    const client = await clientService.getClientById(params.id);

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const forbidden = await requirePermission(session, 'clients.edit');
    if (forbidden) return forbidden;

    const body = await request.json();
    const validatedData = updateClientSchema.parse(body);

    const client = await clientService.updateClient(
      params.id,
      validatedData,
      session.user?.id || ''
    );

    return NextResponse.json({
      success: true,
      data: client,
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
          message: error.message || 'Failed to update client',
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const forbidden = await requirePermission(session, 'clients.delete');
    if (forbidden) return forbidden;

    const client = await clientService.deactivateClient(
      params.id,
      session.user?.id || ''
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
          message: error.message || 'Failed to deactivate client',
        },
      },
      { status: 500 }
    );
  }
}
