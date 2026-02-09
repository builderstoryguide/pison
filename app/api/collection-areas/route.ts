/**
 * Collection Areas API
 * GET /api/collection-areas - List all areas
 * POST /api/collection-areas - Create new area (Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
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

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check role - Admin and Accountant can view
    const roleName = (session.user?.roleName || '').toLowerCase();
    if (!roleName.includes('admin') && !roleName.includes('accountant')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as 'ACTIVE' | 'INACTIVE' | null;
    const city = searchParams.get('city');
    const region = searchParams.get('region');

    const areas = await collectionAreaService.getAllAreas({
      status: status || undefined,
      city: city || undefined,
      region: region || undefined,
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

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only Admin can create areas
    const roleName = (session.user?.roleName || '').toLowerCase();
    if (!roleName.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
