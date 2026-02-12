import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch counts
    const [
      activeClients,
      activeAgents,
      totalLoans,
      pendingLoans,
      dailyCollections,
      activeAreas
    ] = await Promise.all([
      prisma.client.count({ where: { status: 'ACTIVE' } }),
      prisma.agent.count({ where: { status: 'ACTIVE' } }),
      prisma.loan.count({ where: { status: { in: ['ACTIVE', 'DISBURSED'] } } }),
      prisma.loan.count({ where: { status: 'PENDING' } }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          type: 'COLLECTION',
          status: 'COMPLETED',
          createdAt: { gte: today, lt: tomorrow },
        },
      }),
      prisma.collectionArea.count({ where: { status: 'ACTIVE' } }),
    ]);

    // Fetch recent transactions
    const recentTransactions = await prisma.transaction.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        account: {
          include: {
            client: true,
            agent: true,
          },
        },
      },
    });

    // Determine role-specific data
    // (For now, returning global stats, but could filter by agent's area if needed)

    return NextResponse.json({
      success: true,
      data: {
        activeClients,
        activeAgents,
        totalLoans,
        pendingLoans,
        dailyCollections: dailyCollections._sum.amount?.toNumber() || 0,
        activeAreas,
        recentTransactions: recentTransactions.map(t => ({
          id: t.id,
          type: t.type,
          amount: t.amount.toNumber(),
          status: t.status,
          date: t.createdAt,
          description: t.description,
          reference: t.account.client?.fullName || t.account.agent?.fullName || 'System',
        })),
      },
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error.message || 'Failed to fetch dashboard stats',
        },
      },
      { status: 500 }
    );
  }
}
