/**
 * Reject Client API
 * POST /api/clients/[id]/reject - Reject pending client (Manager only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { requirePermission } from '@/lib/auth';
import { clientService } from '@/lib/services';
import { z } from 'zod';

const rejectSchema = z.object({
  reason: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    const forbidden = await requirePermission(session, 'clients.reject');
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

    const body = await request.json().catch(() => ({}));
    const validatedData = rejectSchema.parse(body);

    const client = await clientService.rejectClient(
      params.id,
      session.user.id,
      validatedData.reason
    );

    return NextResponse.json({
      success: true,
      data: client,
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

    const err = error as Error & { message?: string };
    console.error('Error rejecting client:', err);

    const message = err.message || 'Failed to reject client';
    const isClientNotFound = message === 'Client not found';
    const isNotPending = message.includes('not pending approval');

    if (isClientNotFound) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message },
        },
        { status: 404 }
      );
    }
    if (isNotPending) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'REJECT_ERROR', message },
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: { code: 'REJECT_ERROR', message },
      },
      { status: 500 }
    );
  }
}
