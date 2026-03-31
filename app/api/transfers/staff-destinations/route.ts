/**
 * GET /api/transfers/staff-destinations — Destination accounts for operating-account transfers (manager / accountant)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { denyAgentAccess, requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const blocked = denyAgentAccess(session, 'Not available for agents');
    if (blocked) return blocked;
    const forbidden = await requirePermission(session, 'transactions.create');
    if (forbidden) return forbidden;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: { select: { slug: true } } },
    });
    const slug = (user?.role?.slug || '').toLowerCase();

    let accountTypes: ('AGENT' | 'ACCOUNTANT')[] = [];
    if (slug === 'manager') {
      accountTypes = ['AGENT', 'ACCOUNTANT'];
    } else if (slug === 'accountant') {
      accountTypes = ['AGENT'];
    } else {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const accounts = await prisma.financialAccount.findMany({
      where: {
        status: 'ACTIVE',
        accountType: { in: accountTypes },
      },
      include: {
        agent: { select: { id: true, fullName: true, agentCode: true } },
        operatingUser: { select: { id: true, name: true, email: true } },
      },
      orderBy: { accountNumber: 'asc' },
    });

    const data = accounts.map((acc) => {
      let label = acc.accountNumber;
      if (acc.agent) {
        label = `${acc.agent.fullName} (${acc.agent.agentCode}) — ${acc.accountNumber}`;
      } else if (acc.operatingUser) {
        const n = acc.operatingUser.name || acc.operatingUser.email || 'Staff';
        label = `${n} — ${acc.accountNumber}`;
      }
      return {
        accountId: acc.id,
        accountNumber: acc.accountNumber,
        accountType: acc.accountType,
        label,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error('staff-destinations:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to load destinations' } },
      { status: 500 },
    );
  }
}
