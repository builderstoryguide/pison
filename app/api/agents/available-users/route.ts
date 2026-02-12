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

    const roleName = (session.user?.roleName || '').toLowerCase();
    if (!roleName.includes('admin') && !roleName.includes('accountant')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Find users with 'agent' role who don't have an agent profile
    const users = await prisma.user.findMany({
      where: {
        role: {
          slug: 'agent',
        },
        agent: null,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error: any) {
    console.error('Error fetching available users:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error.message || 'Failed to fetch available users',
        },
      },
      { status: 500 }
    );
  }
}
