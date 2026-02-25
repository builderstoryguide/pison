/**
 * Pending Accounts API
 * GET /api/accounts/pending - List pending clients and agents (Manager only)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { requirePermission } from '@/lib/auth';
import { clientService, agentService } from '@/lib/services';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const forbidden = await requirePermission(session, 'transactions.approve');
    if (forbidden) return forbidden;

    const [pendingClients, pendingAgents] = await Promise.all([
      clientService.getPendingClients(),
      agentService.getPendingAgents(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        clients: pendingClients,
        agents: pendingAgents,
        total: pendingClients.length + pendingAgents.length,
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching pending accounts:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch pending accounts',
        },
      },
      { status: 500 }
    );
  }
}
