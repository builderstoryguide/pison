/**
 * Day Closure API
 * POST /api/operations/day-closure - Close daily session (Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { sessionService } from '@/lib/services';
import { z } from 'zod';

const closureSchema = z.object({
  physicalCash: z.number().nonnegative(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only Admin can close sessions
    const roleName = (session.user?.roleName || '').toLowerCase();
    if (!roleName.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = closureSchema.parse(body);

    const closure = await sessionService.closeSession(
      validatedData,
      session.user?.id || ''
    );

    return NextResponse.json(
      {
        success: true,
        data: closure,
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

    console.error('Error closing session:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CLOSURE_ERROR',
          message: error.message || 'Failed to close session',
        },
      },
      { status: 500 }
    );
  }
}
