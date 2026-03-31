/**
 * GET /api/me/operating-account — Staff operating wallet (manager / accountant)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        operatingAccount: true,
        role: { select: { slug: true, name: true } },
      },
    });

    if (!user?.operatingAccount) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    const acc = user.operatingAccount;
    return NextResponse.json({
      success: true,
      data: {
        id: acc.id,
        accountNumber: acc.accountNumber,
        accountType: acc.accountType,
        balance: acc.balance?.toString?.() ?? String(acc.balance),
        availableBalance: acc.availableBalance?.toString?.() ?? String(acc.availableBalance),
        roleSlug: user.role?.slug,
      },
    });
  } catch (error: unknown) {
    console.error('operating-account GET:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to load operating account' } },
      { status: 500 },
    );
  }
}
