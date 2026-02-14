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
import { z } from 'zod';

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
      statusParam === 'active'
        ? undefined
        : statusParam;
    const statusIn =
      statusParam === 'active' ? ['DISBURSED', 'ACTIVE'] : undefined;
    const clientId = searchParams.get('clientId');
    const accountId = searchParams.get('accountId');

    const roleName = (session?.user?.roleName || '').toLowerCase();
    let areaIds: string[] | undefined;

    if (roleName.includes('agent') || roleName.includes('collector')) {
      const { agentService } = await import('@/lib/services');
      const agent = await agentService.getAgentByUserId(session?.user?.id || '');
      
      if (!agent) {
        return NextResponse.json({ success: true, data: [] });
      }

      const agentAreas = await agentService.getAgentAreas(agent.id);
      areaIds = agentAreas.map((a) => a.id);
      
      if (areaIds.length === 0) {
        return NextResponse.json({ success: true, data: [] });
      }
    }

    const loans = await loanService.getAllLoans({
      status: status || undefined,
      statusIn,
      clientId: clientId || undefined,
      accountId: accountId || undefined,
      areaIds,
    });

    return NextResponse.json({
      success: true,
      data: loans,
    });
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
