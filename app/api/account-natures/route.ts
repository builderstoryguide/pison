/**
 * Account Natures API
 * GET /api/account-natures - List active account natures (for dropdown)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { requirePermission } from '@/lib/auth';
import { accountNatureService } from '@/lib/services';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const forbidden = await requirePermission(session, 'clients.view');
    if (forbidden) return forbidden;

    const natures = await accountNatureService.getAllActive();

    return NextResponse.json({
      success: true,
      data: natures,
    });
  } catch (error: unknown) {
    console.error('Error fetching account natures:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch account natures',
        },
      },
      { status: 500 }
    );
  }
}
