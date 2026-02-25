/**
 * Approve Agent API
 * POST /api/agents/[id]/approve - Approve pending agent (Manager only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { requirePermission } from '@/lib/auth';
import { agentService } from '@/lib/services';

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    const forbidden = await requirePermission(session, 'agents.approve');
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

    const agent = await agentService.approveAgent(
      params.id,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      data: agent,
    });
  } catch (error: unknown) {
    console.error('Error approving agent:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'APPROVE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to approve agent',
        },
      },
      { status: 500 }
    );
  }
}
