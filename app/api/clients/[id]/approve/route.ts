/**
 * Approve Client API
 * POST /api/clients/[id]/approve - Approve pending client (Manager only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { requirePermission } from '@/lib/auth';
import { clientService } from '@/lib/services';

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    const forbidden = await requirePermission(session, 'clients.approve');
    if (forbidden) return forbidden;

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Missing authenticated user ID',
          },
        },
        { status: 401 }
      );
    }

    const client = await clientService.approveClient(
      params.id,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      data: client,
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('Error approving client:', err);

    const message = err.message || 'Failed to approve client';
    const isClientNotFound = message === 'Client not found';
    const isNotPending = message.includes('not pending approval');

    if (isClientNotFound) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message,
          },
        },
        { status: 404 }
      );
    }
    if (isNotPending) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'APPROVE_ERROR',
            message,
          },
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'APPROVE_ERROR',
          message,
        },
      },
      { status: 500 }
    );
  }
}
