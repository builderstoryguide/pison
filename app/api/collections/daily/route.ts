/**
 * Daily Collections API (Ventilation)
 * POST /api/collections/daily - Create collection entries (Agent only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { transactionService } from '@/lib/services';
import { agentService } from '@/lib/services';
import { z } from 'zod';

const createCollectionSchema = z.object({
  areaId: z.string().uuid(),
  agentId: z.string().uuid(),
  entries: z.array(
    z.object({
      clientId: z.string().uuid(),
      amount: z.number().positive(),
      description: z.string().optional(),
    })
  ).min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only Agents can create collections
    const roleName = (session.user?.roleName || '').toLowerCase();
    if (!roleName.includes('agent') && !roleName.includes('collector')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify agent ID matches session user
    const agent = await agentService.getAgentByUserId(session.user?.id || '');
    if (!agent) {
      return NextResponse.json({ error: 'Agent record not found' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = createCollectionSchema.parse(body);

    // Verify agent ID matches
    if (validatedData.agentId !== agent.id) {
      return NextResponse.json(
        { error: 'Agent ID does not match authenticated user' },
        { status: 403 }
      );
    }

    const transactions = await transactionService.createCollectionEntries(
      validatedData,
      session.user?.id || ''
    );

    return NextResponse.json(
      {
        success: true,
        data: transactions,
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

    console.error('Error creating collection entries:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: error.message || 'Failed to create collection entries',
        },
      },
      { status: 500 }
    );
  }
}
