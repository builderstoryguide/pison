/**
 * Collection Area API (Single)
 * GET /api/collection-areas/[id] - Get area details
 * PUT /api/collection-areas/[id] - Update area (Admin only)
 * DELETE /api/collection-areas/[id] - Deactivate area (Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { requirePermission } from '@/lib/auth';
import { collectionAreaService } from '@/lib/services';
import { z } from 'zod';

const updateAreaSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    const forbidden = await requirePermission(session, 'collection_areas.view');
    if (forbidden) return forbidden;

    const area = await collectionAreaService.getAreaById(params.id);

    if (!area) {
      return NextResponse.json({ error: 'Collection area not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: area,
    });
  } catch (error: any) {
    console.error('Error fetching collection area:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error.message || 'Failed to fetch collection area',
        },
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    const forbidden = await requirePermission(session, 'collection_areas.manage');
    if (forbidden) return forbidden;

    const body = await request.json();
    const validatedData = updateAreaSchema.parse(body);

    const area = await collectionAreaService.updateArea(
      params.id,
      validatedData,
      session.user?.id || ''
    );

    return NextResponse.json({
      success: true,
      data: area,
    });
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

    console.error('Error updating collection area:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: error.message || 'Failed to update collection area',
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    const forbidden = await requirePermission(session, 'collection_areas.manage');
    if (forbidden) return forbidden;

    const area = await collectionAreaService.deactivateArea(
      params.id,
      session.user?.id || ''
    );

    return NextResponse.json({
      success: true,
      data: area,
    });
  } catch (error: any) {
    console.error('Error deactivating collection area:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: error.message || 'Failed to deactivate collection area',
        },
      },
      { status: 500 }
    );
  }
}
