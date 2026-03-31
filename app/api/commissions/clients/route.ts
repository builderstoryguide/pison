import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Prisma } from '@prisma/client';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { requireManagerRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function decimalToPercent(rateDecimal: number): number {
  return Number((rateDecimal * 100).toFixed(2));
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const forbidden = requireManagerRole(session);
    if (forbidden) return forbidden;

    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get('filter') === 'all' ? 'all' : 'customized';
    const search = (searchParams.get('search') || '').trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const pageSizeRaw = parseInt(searchParams.get('pageSize') || '20', 10);
    const pageSize = Math.min(100, Math.max(1, Number.isFinite(pageSizeRaw) ? pageSizeRaw : 20));

    const andConditions: Prisma.ClientWhereInput[] = [];

    if (filter === 'customized') {
      andConditions.push({
        OR: [{ isCommissionExempt: true }, { commissionRateOverride: { not: null } }],
      });
    }

    if (search.length > 0) {
      andConditions.push({
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { clientNumber: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    const where: Prisma.ClientWhereInput =
      andConditions.length > 0 ? { AND: andConditions } : {};

    const [totalCount, rows] = await Promise.all([
      prisma.client.count({ where }),
      prisma.client.findMany({
        where,
        select: {
          id: true,
          clientNumber: true,
          fullName: true,
          isCommissionExempt: true,
          commissionRateOverride: true,
        },
        orderBy: [{ fullName: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const items = rows.map((c) => ({
      id: c.id,
      clientNumber: c.clientNumber,
      fullName: c.fullName,
      isCommissionExempt: c.isCommissionExempt,
      commissionRatePercent:
        c.commissionRateOverride === null
          ? null
          : decimalToPercent(c.commissionRateOverride.toNumber()),
    }));

    return NextResponse.json({
      success: true,
      data: {
        items,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
        },
      },
    });
  } catch (error) {
    console.error('Error listing commission clients:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'FETCH_ERROR', message: 'Failed to list clients' },
      },
      { status: 500 },
    );
  }
}
