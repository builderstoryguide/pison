/**
 * PATCH /api/operations/session/planned-closure
 * Set or clear today's planned closure override (managers only).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { requireManagerRole } from '@/lib/auth';
import { sessionService } from '@/lib/services';
import { z } from 'zod';

const bodySchema = z.object({
  plannedClosureAt: z.string().datetime().nullable(),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const forbidden = requireManagerRole(session);
    if (forbidden) return forbidden;

    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const json = await request.json();
    const parsed = bodySchema.parse(json);
    const at = parsed.plannedClosureAt ? new Date(parsed.plannedClosureAt) : null;

    const updated = await sessionService.setPlannedClosure(at, userId);

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.errors },
        },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : 'Failed to update planned closure';
    return NextResponse.json(
      { success: false, error: { code: 'UPDATE_ERROR', message } },
      { status: 400 }
    );
  }
}
