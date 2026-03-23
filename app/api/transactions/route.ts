/**
 * Transactions API
 * GET /api/transactions - List transactions (with filters)
 * POST /api/transactions - Create a transaction (Deposit or Withdrawal)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { isAgentOrCollectorRole, requirePermission } from '@/lib/auth';
import { transactionService } from '@/lib/services';
import { parseFieldsParam } from '@/lib/utils/field-select';
import { cachedJson } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const TRANSACTION_FIELDS_ALLOWLIST = [
  'id',
  'transactionNumber',
  'type',
  'amount',
  'balanceBefore',
  'balanceAfter',
  'status',
  'description',
  'reference',
  'createdAt',
  'approvedAt',
  'account',
  'creator',
];

const TRANSACTION_RELATION_SELECTS: Record<string, Record<string, unknown>> = {
  account: {
    select: {
      id: true,
      accountNumber: true,
      client: { select: { id: true, clientNumber: true, fullName: true } },
    },
  },
  creator: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
};

const createTransactionSchema = z.object({
  accountId: z.string().uuid(),
  type: z.enum(['DEPOSIT', 'WITHDRAWAL']),
  amount: z.coerce.number().positive('Amount must be positive'),
  description: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const forbidden = await requirePermission(session, 'transactions.view');
    if (forbidden) return forbidden;

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || undefined;
    if (isAgentOrCollectorRole(session?.user?.roleName) && type !== 'DEPOSIT') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Agent role can only access deposits in transactions',
          },
        },
        { status: 403 }
      );
    }

    const status = searchParams.get('status') || undefined;
    const accountId = searchParams.get('accountId') || undefined;
    const areaId = searchParams.get('areaId') || undefined;
    const agentId = searchParams.get('agentId') || undefined;
    const createdById = searchParams.get('createdById') || undefined;
    const search = searchParams.get('search') || undefined;
    const sort = searchParams.get('sort') || undefined;
    const dir = (searchParams.get('dir') || 'desc') as 'asc' | 'desc';
    const fieldsParam = searchParams.get('fields');
    const select = parseFieldsParam(
      fieldsParam,
      TRANSACTION_FIELDS_ALLOWLIST,
      TRANSACTION_RELATION_SELECTS
    );

    let startDate: Date | undefined;
    const startDateParam = searchParams.get('startDate');
    if (startDateParam) {
      const parsed = new Date(startDateParam);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid startDate' },
          },
          { status: 400 }
        );
      }
      startDate = parsed;
    }

    let endDate: Date | undefined;
    const endDateParam = searchParams.get('endDate');
    if (endDateParam) {
      const parsed = new Date(endDateParam);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid endDate' },
          },
          { status: 400 }
        );
      }
      endDate = parsed;
    }

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

    const result = await transactionService.getTransactions({
      type,
      status,
      accountId,
      areaId,
      agentId,
      createdById,
      search,
      sort,
      dir,
      startDate,
      endDate,
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
      data: result.transactions,
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
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch transactions',
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const forbidden = await requirePermission(session, 'transactions.create');
    if (forbidden) return forbidden;

    const userId = session?.user?.id;
    if (!session || !session.user || !userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createTransactionSchema.parse(body);

    if (
      isAgentOrCollectorRole(session?.user?.roleName) &&
      validatedData.type !== 'DEPOSIT'
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Agent role can only create deposits',
          },
        },
        { status: 403 }
      );
    }

    let agentId: string | undefined = undefined;
    if (isAgentOrCollectorRole(session?.user?.roleName)) {
      const agent = await prisma.agent.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (agent) {
        agentId = agent.id;
      }
    }

    const transaction = await transactionService.createTransaction(
      {
        accountId: validatedData.accountId,
        type: validatedData.type,
        amount: validatedData.amount,
        description: validatedData.description,
        agentId,
      },
      userId
    );

    return NextResponse.json(
      {
        success: true,
        data: transaction,
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

    console.error('Error creating transaction:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create transaction',
        },
      },
      { status: 500 }
    );
  }
}
