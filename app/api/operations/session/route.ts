/**
 * Daily Session API
 * GET /api/operations/session - Get current session status
 * POST /api/operations/session/open - Open new session (Admin only)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { requirePermission } from '@/lib/auth';
import { sessionService } from '@/lib/services';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const forbidden = await requirePermission(session, 'dashboard.view');
    if (forbidden) return forbidden;

    const data = await sessionService.getSessionStatus();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch session status';
    console.error('[Session API] Error fetching session status:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message,
        },
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    const forbidden = await requirePermission(session, 'session.manage');
    if (forbidden) return forbidden;

    const newSession = await sessionService.openSession(session.user?.id || '');

    return NextResponse.json(
      {
        success: true,
        data: newSession,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error opening session:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'OPEN_ERROR',
          message: error instanceof Error ? error.message : 'Failed to open session',
        },
      },
      { status: 500 }
    );
  }
}
