/**
 * Agents API
 * GET /api/agents - List all agents
 * POST /api/agents - Create new agent (Accountant/Admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { requirePermission } from '@/lib/auth';
import { agentService } from '@/lib/services';
import { parseFieldsParam } from '@/lib/utils/field-select';
import { cachedJson } from '@/lib/api';
import { z } from 'zod';

const AGENT_FIELDS_ALLOWLIST = [
  'id',
  'agentCode',
  'fullName',
  'status',
  'user',
  'account',
  'areaAssignments',
];

const AGENT_RELATION_SELECTS: Record<string, Record<string, unknown>> = {
  user: { select: { id: true, email: true, name: true } },
  account: {
    select: {
      id: true,
      accountNumber: true,
      balance: true,
      availableBalance: true,
      status: true,
    },
  },
  areaAssignments: {
    select: {
      area: { select: { id: true, code: true, name: true } },
    },
  },
};

const createAgentSchema = z.object({
  userId: z.string().uuid(),
  fullName: z.string().min(1).max(255),
  nationalId: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  hireDate: z.string().datetime().optional(),
  areaIds: z.array(z.string().uuid()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const forbidden = await requirePermission(session, 'agents.view');
    if (forbidden) return forbidden;

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | null;
    const areaId = searchParams.get('areaId');
    const sort = searchParams.get('sort') || undefined;
    const dir = (searchParams.get('dir') || 'desc') as 'asc' | 'desc';
    const fieldsParam = searchParams.get('fields');
    const select = parseFieldsParam(
      fieldsParam,
      AGENT_FIELDS_ALLOWLIST,
      AGENT_RELATION_SELECTS
    );

    const agents = await agentService.getAllAgents({
      status: status || undefined,
      areaId: areaId || undefined,
      sort,
      dir,
      select: select ?? undefined,
    });

    return cachedJson({
      success: true,
      data: agents,
    }, 60);
  } catch (error: unknown) {
    console.error('Error fetching agents:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch agents',
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const forbidden = await requirePermission(session, 'agents.create');
    if (forbidden) return forbidden;

    const body = await request.json();
    const validatedData = createAgentSchema.parse(body);

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

    const agentData = {
      ...validatedData,
      hireDate: validatedData.hireDate ? new Date(validatedData.hireDate) : undefined,
    };

    const agent = await agentService.createAgent(
      agentData,
      session.user.id,
      session.user?.roleName
    );

    return NextResponse.json(
      {
        success: true,
        data: agent,
      },
      { status: 201 }
    );
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

    console.error('Error creating agent:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create agent',
        },
      },
      { status: 500 }
    );
  }
}
