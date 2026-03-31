/**
 * GET /api/loans/maturity-alerts
 * Active/disbursed loans with balance due within N days (for manager notifications sheet).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { denyAgentAccess, requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const roleForbidden = denyAgentAccess(session, 'Loans are not available for Agent role');
    if (roleForbidden) return roleForbidden;

    const forbidden = await requirePermission(session, 'loans.approve');
    if (forbidden) return forbidden;

    const daysRaw = request.nextUrl.searchParams.get('days');
    const days = daysRaw ? Math.min(90, Math.max(1, parseInt(daysRaw, 10))) : 14;
    if (!Number.isFinite(days)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid days' } },
        { status: 400 }
      );
    }

    const now = new Date();
    const todayStartUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const windowEndUtc = new Date(todayStartUtc);
    windowEndUtc.setUTCDate(windowEndUtc.getUTCDate() + days);

    const loans = await prisma.loan.findMany({
      where: {
        status: { in: ['DISBURSED', 'ACTIVE'] },
        maturityDate: {
          gte: todayStartUtc,
          lte: windowEndUtc,
        },
        remainingBalance: { gt: 0 },
      },
      select: {
        id: true,
        loanNumber: true,
        remainingBalance: true,
        maturityDate: true,
        client: { select: { fullName: true, id: true } },
      },
      orderBy: [{ maturityDate: 'asc' }, { loanNumber: 'asc' }],
      take: 50,
    });

    const data = loans.map((l) => ({
      id: l.id,
      loanNumber: l.loanNumber,
      remainingBalance: l.remainingBalance.toFixed(2),
      maturityDate: l.maturityDate?.toISOString() ?? null,
      clientName: l.client.fullName,
      clientId: l.client.id,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load maturity alerts';
    return NextResponse.json(
      { success: false, error: { code: 'FETCH_ERROR', message } },
      { status: 500 }
    );
  }
}
