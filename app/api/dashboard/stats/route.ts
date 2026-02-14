import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { agentService } from '@/lib/services';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const forbidden = await requirePermission(session, 'dashboard.view');
    if (forbidden) return forbidden;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const roleName = (session?.user?.roleName ?? '').toLowerCase();
    const isAgent = roleName.includes('agent') || roleName.includes('collector');

    if (isAgent && session?.user?.id) {
      // Agent-specific stats: only data relevant to their assigned areas
      const agent = await agentService.getAgentByUserId(session.user.id);
      if (!agent) {
        return NextResponse.json({
          success: true,
          data: {
            assignedClientsCount: 0,
            assignedAreasCount: 0,
            dailyCollections: 0,
            recentTransactions: [],
          },
        });
      }

      const agentAreaIds = agent.areaAssignments?.map((a) => a.areaId) ?? [];

      const [
        assignedClientsCount,
        assignedAreasCount,
        dailyCollectionsAgg,
        recentCollectionTxns,
      ] = await Promise.all([
        agentAreaIds.length > 0
          ? prisma.client.count({
              where: {
                status: 'ACTIVE',
                areaId: { in: agentAreaIds },
              },
            })
          : 0,
        prisma.agentAreaAssignment.count({ where: { agentId: agent.id } }),
        prisma.transaction.aggregate({
          _sum: { amount: true },
          where: {
            type: 'COLLECTION',
            status: 'COMPLETED',
            agentId: agent.id,
            createdAt: { gte: today, lt: tomorrow },
          },
        }),
        prisma.transaction.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          where: {
            type: 'COLLECTION',
            agentId: agent.id,
          },
          include: {
            account: {
              include: {
                client: true,
                agent: true,
              },
            },
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          assignedClientsCount,
          assignedAreasCount,
          dailyCollections: dailyCollectionsAgg._sum.amount?.toNumber() || 0,
          recentTransactions: recentCollectionTxns.map((t) => ({
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
    }

    // Accountant / Manager: global stats
    const [
      activeClients,
      activeAgents,
      totalLoans,
      pendingLoans,
      dailyCollections,
      activeAreas,
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

    return NextResponse.json({
      success: true,
      data: {
        activeClients,
        activeAgents,
        totalLoans,
        pendingLoans,
        dailyCollections: dailyCollections._sum.amount?.toNumber() || 0,
        activeAreas,
        recentTransactions: recentTransactions.map((t) => ({
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
