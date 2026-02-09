/**
 * Loans API
 * GET /api/loans - List all loans
 * POST /api/loans - Create loan request (Accountant/Admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
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

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');
    const accountId = searchParams.get('accountId');

    const loans = await loanService.getAllLoans({
      status: status || undefined,
      clientId: clientId || undefined,
      accountId: accountId || undefined,
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

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Accountant and Admin can create loans
    const roleName = (session.user?.roleName || '').toLowerCase();
    if (!roleName.includes('admin') && !roleName.includes('accountant')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createLoanSchema.parse(body);

    const loanData = {
      ...validatedData,
      maturityDate: validatedData.maturityDate ? new Date(validatedData.maturityDate) : undefined,
    };

    const loan = await loanService.createLoanRequest(loanData, session.user?.id || '');

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
