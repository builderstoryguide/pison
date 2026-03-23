/**
 * Clients API
 * GET /api/clients - List all clients
 * POST /api/clients - Create new client (Accountant/Admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { requirePermission } from '@/lib/auth';
import { clientService } from '@/lib/services';
import { parseFieldsParam } from '@/lib/utils/field-select';
import { cachedJson } from '@/lib/api';
import { z } from 'zod';

const CLIENT_FIELDS_ALLOWLIST = [
  'id',
  'clientNumber',
  'fullName',
  'nationalId',
  'phone',
  'email',
  'address',
  'city',
  'areaId',
  'area',
  'account',
  'status',
  'isCommissionExempt',
  'createdAt',
  'updatedAt',
  'assignedAgent',
];

const CLIENT_RELATION_SELECTS: Record<string, Record<string, unknown>> = {
  area: { select: { id: true, code: true, name: true } },
  account: { select: { id: true, accountNumber: true, balance: true, availableBalance: true, status: true } },
  assignedAgent: { select: { id: true, fullName: true, agentCode: true } },
};

const createClientSchema = z.object({
  fullName: z.string().min(1).max(255),
  nationalId: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  areaId: z.string().uuid(),
  agentId: z.string().uuid().optional(),
  isCommissionExempt: z.boolean().optional().default(false),
  accountNatureId: z.string().uuid(),
  documentChecklist: z.record(z.string(), z.boolean()).optional().default({}),
  openingAmount: z.number().min(0).optional(),
  customInterestRate: z.number().min(0).max(1).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const forbidden = await requirePermission(session, 'clients.view');
    if (forbidden) return forbidden;

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as
      | 'ACTIVE'
      | 'INACTIVE'
      | 'SUSPENDED'
      | 'CLOSED'
      | null;
    const areaId = searchParams.get('areaId');
    const search = searchParams.get('search');
    const fieldsParam = searchParams.get('fields');
    const select = parseFieldsParam(
      fieldsParam,
      CLIENT_FIELDS_ALLOWLIST,
      CLIENT_RELATION_SELECTS
    );

    const limitRaw = searchParams.get('limit');
    const limit = limitRaw ? parseInt(limitRaw, 10) : 50;
    if (!Number.isFinite(limit) || !Number.isInteger(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid limit (must be 1-100)' },
        },
        { status: 400 }
      );
    }

    const cursor = searchParams.get('cursor') || undefined;
    const useCursor = !!cursor;
    const pageParam = searchParams.get('page');

    let offset = 0;
    if (!useCursor) {
      if (pageParam) {
        const page = parseInt(pageParam, 10);
        if (!Number.isFinite(page) || page < 1) {
          return NextResponse.json(
            {
              success: false,
              error: { code: 'VALIDATION_ERROR', message: 'Invalid page (must be >= 1)' },
            },
            { status: 400 }
          );
        }
        offset = (page - 1) * limit;
      } else {
        const offsetRaw = searchParams.get('offset');
        offset = offsetRaw ? parseInt(offsetRaw, 10) : 0;
        if (!Number.isFinite(offset) || !Number.isInteger(offset) || offset < 0) {
          return NextResponse.json(
            {
              success: false,
              error: { code: 'VALIDATION_ERROR', message: 'Invalid offset' },
            },
            { status: 400 }
          );
        }
      }
    }

    const sort = searchParams.get('sort') || undefined;
    const dir = (searchParams.get('dir') || 'desc') as 'asc' | 'desc';

    // Check role and filter by agent's assigned areas if agent/collector
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const roleName = (session.user.roleName || '').toLowerCase();
    let areaIdsFilter: string[] | undefined;
    let areaIdFilter: string | undefined = areaId || undefined;

    if (roleName.includes('agent') || roleName.includes('collector')) {
      const { agentService } = await import('@/lib/services/agent-service');
      const agent = await agentService.getAgentByUserId(session.user.id || '');
      if (!agent) {
        return NextResponse.json({ error: 'Agent record not found' }, { status: 404 });
      }

      const assignedAreas = await agentService.getAgentAreas(agent.id);
      const agentAreaIds = assignedAreas.map((a) => a.id);

      if (agentAreaIds.length === 0) {
        return cachedJson({
          success: true,
          data: [],
          pagination: { total: 0, limit, page: 1, total_pages: 1, has_more: false, offset: 0 },
          meta: { total: 0, page: 1, limit, total_pages: 1, has_more: false },
        }, 30);
      }

      // If areaId was specified in query, validate it is in the agent's assigned areas
      if (areaId) {
        if (!agentAreaIds.includes(areaId)) {
          return NextResponse.json({ error: 'Forbidden: area not assigned to you' }, { status: 403 });
        }
        areaIdFilter = areaId;
      } else {
        areaIdsFilter = agentAreaIds;
      }
    }

    const result = await clientService.getAllClients({
      status: status || undefined,
      areaId: areaIdsFilter ? undefined : areaIdFilter,
      areaIds: areaIdsFilter,
      search: search || undefined,
      sort,
      dir,
      limit,
      offset: useCursor ? undefined : offset,
      cursor,
      select: select ?? undefined,
    });

    const page = useCursor ? 1 : Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(result.total / limit) || 1;
    const hasMore = useCursor
      ? (result.hasMore ?? false)
      : page < totalPages;

    const pagination: Record<string, unknown> = {
      total: result.total,
      limit,
      page,
      total_pages: totalPages,
      has_more: hasMore,
    };
    if (useCursor) {
      pagination.nextCursor = result.nextCursor ?? undefined;
    } else {
      pagination.offset = offset;
    }

    return cachedJson({
      success: true,
      data: result.clients,
      pagination,
      meta: {
        total: result.total,
        page,
        limit,
        total_pages: totalPages,
        has_more: hasMore,
      },
    }, 30);
  } catch (error: unknown) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch clients',
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const forbidden = await requirePermission(session, 'clients.create');
    if (forbidden) return forbidden;

    const body = await request.json();
    const validatedData = createClientSchema.parse(body);

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

    const client = await clientService.createClient(
      validatedData,
      session.user.id,
      session.user?.roleName ?? undefined
    );

    return NextResponse.json(
      {
        success: true,
        data: client,
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

    console.error('Error creating client:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create client',
        },
      },
      { status: 500 }
    );
  }
}
