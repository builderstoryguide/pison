/**
 * Agents API
 * GET /api/agents - List all agents
 * POST /api/agents - Create new agent (Accountant/Admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { requirePermission } from '@/lib/auth';
import { agentService, AreaAlreadyAssignedError } from '@/lib/services';
import { prisma } from '@/lib/prisma';
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
  user: { select: { id: true, email: true, username: true, name: true } },
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
  userId: z.string().uuid().optional(),
  fullName: z.string().min(1).max(255),
  nationalId: z.string().optional(),
  phone: z.string().optional(),
  email: z
    .union([z.string().email(), z.literal('')])
    .optional()
    .transform((value) => (value ? value : undefined)),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username can only contain letters, numbers, and underscores',
    )
    .optional()
    .or(z.literal(''))
    .transform((v) => (v && v.trim() ? v.trim() : undefined)),
  password: z
    .string()
    .optional()
    .refine((v) => !v || v.length >= 8, {
      message: 'Password must be at least 8 characters when provided',
    })
    .transform((v) => (v && v.length >= 8 ? v : undefined)),
  address: z.string().optional(),
  hireDate: z
    .union([z.string().datetime(), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)])
    .optional(),
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
    const includePendingParam = searchParams.get('includePendingApproval');
    const fieldsParam = searchParams.get('fields');
    const select = parseFieldsParam(
      fieldsParam,
      AGENT_FIELDS_ALLOWLIST,
      AGENT_RELATION_SELECTS
    );
    const roleName = (session?.user?.roleName || '').toLowerCase();
    const hasFullAccess = roleName.includes('manager') || roleName.includes('administrator');
    const includePendingApproval =
      includePendingParam === 'true' ? true : hasFullAccess;

    const agents = await agentService.getAllAgents({
      status: status || undefined,
      areaId: areaId || undefined,
      sort,
      dir,
      select: select ?? undefined,
      includePendingApproval,
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

    if (!validatedData.userId) {
      if (!agentData.email?.trim()) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Email is required when creating a new agent account',
            },
          },
          { status: 400 }
        );
      }
    }

    if (validatedData.userId) {
      const user = await prisma.user.findUnique({
        where: { id: validatedData.userId },
        include: { role: true, agent: true },
      });
      if (!user) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'User not found' } },
          { status: 400 }
        );
      }
      if (user.agent) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'User already has an agent record' } },
          { status: 400 }
        );
      }
      if (user.role?.slug?.toLowerCase() !== 'agent') {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'User must have Agent role' } },
          { status: 400 }
        );
      }
      if (user.status !== 'ACTIVE') {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'User must be active' } },
          { status: 400 }
        );
      }

      const agent = await agentService.createAgent(
        {
          userId: validatedData.userId,
          fullName: agentData.fullName,
          nationalId: agentData.nationalId,
          phone: agentData.phone,
          email: agentData.email,
          address: agentData.address,
          hireDate: agentData.hireDate,
          areaIds: agentData.areaIds,
        },
        session.user.id,
        session.user?.roleName
      );

      return NextResponse.json(
        { success: true, data: { agent } },
        { status: 201 }
      );
    }

    const result = await agentService.createAgentWithAutoCredentials(
      agentData,
      session.user.id,
      session.user?.roleName
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          agent: result.agent,
          credentials: result.credentials,
        },
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

    if (error instanceof AreaAlreadyAssignedError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AREA_ALREADY_ASSIGNED',
            message: error.message,
            details: error.details,
          },
        },
        { status: 409 }
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
