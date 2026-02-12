import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const account = await prisma.financialAccount.findUnique({
      where: { id },
      include: {
        client: true,
        agent: true,
        _count: {
          select: {
            transactions: true,
            loans: true,
          },
        },
        transactions: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        loans: {
          where: { status: { in: ['ACTIVE', 'DISBURSED'] } },
        },
      },
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: account,
    });
  } catch (error: any) {
    console.error('Error fetching account status:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error.message || 'Failed to fetch account status',
        },
      },
      { status: 500 }
    );
  }
}
