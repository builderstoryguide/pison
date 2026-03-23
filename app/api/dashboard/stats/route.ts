import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { requirePermission } from '@/lib/auth';
import { getDashboardStats } from '@/lib/services/dashboard-service';
import { cachedJson } from '@/lib/api';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const forbidden = await requirePermission(session, 'dashboard.view');
    if (forbidden) return forbidden;

    const data = await getDashboardStats(session);

    return cachedJson({
      success: true,
      data,
    }, 60);
  } catch (error: unknown) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch dashboard stats',
        },
      },
      { status: 500 }
    );
  }
}
