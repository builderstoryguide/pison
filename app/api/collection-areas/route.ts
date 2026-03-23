/**
 * Collection Areas API
 * GET /api/collection-areas - List all areas
 * POST /api/collection-areas - Create new area (Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { requirePermission } from '@/lib/auth';
import { collectionAreaService } from '@/lib/services';
import { z } from 'zod';

const createAreaSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const forbidden = await requirePermission(session, 'collection_areas.view');
    if (forbidden) return forbidden;

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as 'ACTIVE' | 'INACTIVE' | null;
    const city = searchParams.get('city');
    const region = searchParams.get('region');
    const search = searchParams.get('search');

    let areaIdsFilter: string[] | undefined;
    const roleName = (session?.user?.roleName || '').toLowerCase();
    if (roleName.includes('agent') || roleName.includes('collector')) {
      const { agentService } = await import('@/lib/services/agent-service');
      const agent = await agentService.getAgentByUserId(session?.user?.id || '');
      if (!agent) {
        return NextResponse.json(
          { success: true, data: [] },
          { status: 200 }
        );
      }
      const assignedAreas = await agentService.getAgentAreas(agent.id);
      const agentAreaIds = assignedAreas.map((a) => a.id);
      if (agentAreaIds.length === 0) {
        return NextResponse.json({ success: true, data: [] }, { status: 200 });
      }
      areaIdsFilter = agentAreaIds;
    }

    const areas = await collectionAreaService.getAllAreas({
      status: status || undefined,
      city: city || undefined,
      region: region || undefined,
      search: search || undefined,
      areaIds: areaIdsFilter,
    });

    return NextResponse.json({
      success: true,
      data: areas,
    });
  } catch (error: any) {
    console.error('Error fetching collection areas:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error.message || 'Failed to fetch collection areas',
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const forbidden = await requirePermission(session, 'collection_areas.manage');
    if (forbidden) return forbidden;

    const body = await request.json();
    const validatedData = createAreaSchema.parse(body);

    const area = await collectionAreaService.createArea(validatedData, session.user?.id || '');

    return NextResponse.json(
      {
        success: true,
        data: area,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    const isDuplicateCode =
      error?.message && String(error.message).toLowerCase().includes('already exists');
    if (isDuplicateCode) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONFLICT',
            message: error.message || 'A collection area with this code already exists.',
          },
        },
        { status: 409 }
      );
    }

    console.error('Error creating collection area:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: error.message || 'Failed to create collection area',
        },
      },
      { status: 500 }
    );
  }
}
