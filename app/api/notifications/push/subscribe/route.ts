/**
 * Push Subscribe API
 * POST /api/notifications/push/subscribe - Store push subscription for current user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  userAgent: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const forbidden = await requirePermission(session, 'transactions.approve');
    if (forbidden) return forbidden;

    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = subscribeSchema.parse(body);

    await prisma.pushSubscription.upsert({
      where: {
        userId_endpoint: { userId, endpoint: validatedData.endpoint },
      },
      create: {
        userId,
        endpoint: validatedData.endpoint,
        p256dh: validatedData.keys.p256dh,
        auth: validatedData.keys.auth,
        userAgent: validatedData.userAgent ?? null,
      },
      update: {
        p256dh: validatedData.keys.p256dh,
        auth: validatedData.keys.auth,
        userAgent: validatedData.userAgent ?? undefined,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
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

    console.error('Error subscribing to push:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SUBSCRIBE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to subscribe',
        },
      },
      { status: 500 }
    );
  }
}
