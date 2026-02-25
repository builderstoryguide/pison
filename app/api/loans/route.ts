/**
 * Loans API
 * GET /api/loans - List all loans
 * POST /api/loans - Create loan request (Accountant/Admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { requirePermission } from '@/lib/auth';
import { loanService } from '@/lib/services';
import { parseFieldsParam } from '@/lib/utils/field-select';
import { cachedJson } from '@/lib/api';
import { z } from 'zod';

const LOAN_FIELDS_ALLOWLIST = [
  'id',
  'loanNumber',
  'principalAmount',
  'totalAmount',
  'remainingBalance',
  'status',
  'maturityDate',
  'disbursedAt',
  'createdAt',
  'account',
  'client',
  'creator',
  'approver',
];

const LOAN_RELATION_SELECTS: Record<string, Record<string, unknown>> = {
  account: { select: { id: true, accountNumber: true, balance: true, status: true } },
  client: {
    select: {
      id: true,
      clientNumber: true,
      fullName: true,
      area: { select: { id: true, code: true, name: true } },
    },
  },
  creator: { select: { name: true } },
  approver: { select: { name: true } },
};

const createLoanSchema = z.object({
  accountId: z.string().uuid(),
  clientId: z.string().uuid(),
  principalAmount: z.number().positive(),
  interestRate: z.number().min(0).max(1),
  purpose: z.string().optional(),
  maturityDate: z.string().datetime().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const forbidden = await requirePermission(session, 'loans.view');
    if (forbidden) return forbidden;

    const searchParams = request.nextUrl.searchParams;
    const statusParam = searchParams.get('status');
    // Support "active" as shorthand for DISBURSED,ACTIVE (loans that can receive repayments)
    const status =
      statusParam === 'active' ? undefined : statusParam;
    const statusIn =
      statusParam === 'active' ? ['DISBURSED', 'ACTIVE'] : undefined;
    const clientId = searchParams.get('clientId');
    const accountId = searchParams.get('accountId');
    const search = searchParams.get('search');
    const fieldsParam = searchParams.get('fields');
    const select = parseFieldsParam(
      fieldsParam,
      LOAN_FIELDS_ALLOWLIST,
      LOAN_RELATION_SELECTS
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

    const roleName = (session?.user?.roleName || '').toLowerCase();
    let areaIds: string[] | undefined;

    if (roleName.includes('agent') || roleName.includes('collector')) {
      const { agentService } = await import('@/lib/services/agent-service');
      const agent = await agentService.getAgentByUserId(session?.user?.id || '');
      if (!agent) {
        const emptyPagination: Record<string, unknown> = { total: 0, limit };
        if (useCursor) {
          emptyPagination.nextCursor = undefined;
          emptyPagination.hasMore = false;
        } else {
          emptyPagination.offset = offset;
        }
        return NextResponse.json({
          success: true,
          data: [],
          pagination: emptyPagination,
        });
      }

      const agentAreas = await agentService.getAgentAreas(agent.id);
      areaIds = agentAreas.map((a) => a.id);

      if (areaIds.length === 0) {
        const emptyPagination: Record<string, unknown> = { total: 0, limit };
        if (useCursor) {
          emptyPagination.nextCursor = undefined;
          emptyPagination.hasMore = false;
        } else {
          emptyPagination.offset = offset;
        }
        return NextResponse.json({
          success: true,
          data: [],
          pagination: emptyPagination,
        });
      }
    }

    const sort = searchParams.get('sort') || undefined;
    const dir = (searchParams.get('dir') || 'desc') as 'asc' | 'desc';

    const result = await loanService.getAllLoans({
      status: status || undefined,
      statusIn,
      clientId: clientId || undefined,
      accountId: accountId || undefined,
      areaIds,
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
      data: result.loans,
      pagination,
      meta: {
        total: result.total,
        page,
        limit,
        total_pages: totalPages,
        has_more: hasMore,
      },
    }, 30);
  } catch (error: any) {
    console.error('Error fetching loans:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error.message || 'Failed to fetch loans',
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const forbidden = await requirePermission(session, 'loans.create');
    if (forbidden) return forbidden;

    const body = await request.json();
    const validatedData = createLoanSchema.parse(body);

    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const loanData = {
      ...validatedData,
      maturityDate: validatedData.maturityDate ? new Date(validatedData.maturityDate) : undefined,
    };

    const loan = await loanService.createLoanRequest(loanData, userId);

    return NextResponse.json(
      {
        success: true,
        data: loan,
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

    console.error('Error creating loan:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: error.message || 'Failed to create loan',
        },
      },
      { status: 500 }
    );
  }
}
