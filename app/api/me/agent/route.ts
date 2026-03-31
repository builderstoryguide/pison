/**
 * Current User's Agent Record
 * GET /api/me/agent - Get the authenticated user's agent record (for collection ventilation)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { agentService } from '@/lib/services';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const agent = await agentService.getAgentByUserId(session.user.id);
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent record not found' },
        { status: 404 }
      );
    }

    const acc = agent.account;
    return NextResponse.json({
      success: true,
      data: {
        id: agent.id,
        agentCode: agent.agentCode,
        fullName: agent.fullName,
        userId: agent.userId,
        status: agent.status,
        account: acc
          ? {
              id: acc.id,
              accountNumber: acc.accountNumber,
              balance: acc.balance?.toString?.() ?? String(acc.balance),
              availableBalance: acc.availableBalance?.toString?.() ?? String(acc.availableBalance),
            }
          : null,
      },
    });
  } catch (error: any) {
    console.error('Error fetching agent:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error.message || 'Failed to fetch agent',
        },
      },
      { status: 500 }
    );
  }
}
