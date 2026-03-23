import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const forbidden = await requirePermission(session, 'agents.create');
    if (forbidden) return forbidden;

    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q')?.trim() || '';

    const users = await prisma.user.findMany({
      where: {
        role: { slug: { equals: 'agent', mode: 'insensitive' } },
        agent: null,
        status: 'ACTIVE',
        ...(q && {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
          ],
        }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error: unknown) {
    console.error('Error fetching available users:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch available users',
        },
      },
      { status: 500 }
    );
  }
}
