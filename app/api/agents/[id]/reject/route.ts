/**
 * Reject Agent API
 * POST /api/agents/[id]/reject - Reject pending agent (Manager only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { requirePermission } from '@/lib/auth';
import { agentService } from '@/lib/services';
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
    const forbidden = await requirePermission(session, 'agents.reject');
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

    const agent = await agentService.rejectAgent(
      params.id,
      session.user.id,
      validatedData.reason
    );

    return NextResponse.json({
      success: true,
      data: agent,
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

    console.error('Error rejecting agent:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'REJECT_ERROR',
          message: error instanceof Error ? error.message : 'Failed to reject agent',
        },
      },
      { status: 500 }
    );
  }
}
