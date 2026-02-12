import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { loanService } from '@/lib/services';
import { z } from 'zod';

const updateLoanSchema = z.object({
  principalAmount: z.number().positive().optional(),
  interestRate: z.number().min(0).max(1).optional(),
  purpose: z.string().optional(),
  maturityDate: z.string().datetime().optional(),
  status: z.enum(['PENDING', 'CANCELLED']).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const loan = await loanService.getLoanById(params.id);

    if (!loan) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: loan,
    });
  } catch (error: any) {
    console.error('Error fetching loan:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error.message || 'Failed to fetch loan',
        },
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Accountant and Admin can update loans
    // Accountant and Admin can update loans
    const allowedRoles = ['admin', 'accountant'];
    const roleName = (session.user?.roleName || '').toLowerCase();
    if (!allowedRoles.includes(roleName)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateLoanSchema.parse(body);

    const loanData = {
      ...validatedData,
      maturityDate: validatedData.maturityDate ? new Date(validatedData.maturityDate) : undefined,
    };

    // Validate user ID exists to prevent invalid user references
    if (!session.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_SESSION',
            message: 'User ID not found in session',
          },
        },
        { status: 401 }
      );
    }

    const loan = await loanService.updateLoan(
      params.id,
      loanData,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      data: loan,
    });
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

    console.error('Error updating loan:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: error.message || 'Failed to update loan',
        },
      },
      { status: 500 }
    );
  }
}
