/**
 * Daily Session API
 * GET /api/operations/session - Get current session status
 * POST /api/operations/session/open - Open new session (Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { requirePermission } from '@/lib/auth';
import { sessionService } from '@/lib/services';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const forbidden = await requirePermission(session, 'dashboard.view');
    if (forbidden) return forbidden;

    const currentSession = await sessionService.getCurrentSession();
    const isOpen = await sessionService.isSessionOpen();
    const systemBalance = await sessionService.calculateSystemBalance();

    return NextResponse.json({
      success: true,
      data: {
        session: currentSession,
        isOpen,
        systemBalance,
      },
    });
  } catch (error: any) {
    console.error('Error fetching session status:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error.message || 'Failed to fetch session status',
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
  } catch (error: any) {
    console.error('Error opening session:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'OPEN_ERROR',
          message: error.message || 'Failed to open session',
        },
      },
      { status: 500 }
    );
  }
}
