import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';

const changeUsernameSchema = z.object({
  newUsername: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be at most 50 characters')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username can only contain letters, numbers, and underscores'
    )
    .transform((val) => val.trim()),
  currentPassword: z.string().min(1, 'Current password is required'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = changeUsernameSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: validation.error.format(),
          },
        },
        { status: 400 }
      );
    }

    const { newUsername, currentPassword } = validation.data;
    const userId = session.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'User not found' },
        },
        { status: 404 }
      );
    }

    if (!user.password) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ACCOUNT_TYPE',
            message: 'This account uses an external provider login',
          },
        },
        { status: 400 }
      );
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PASSWORD',
            message: 'Incorrect current password',
          },
        },
        { status: 400 }
      );
    }

    // Check username is different from current
    if (user.username?.toLowerCase() === newUsername.toLowerCase()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SAME_USERNAME',
            message: 'New username must be different from current username',
          },
        },
        { status: 400 }
      );
    }

    // Check username is unique (case-insensitive)
    const existing = await prisma.user.findFirst({
      where: {
        username: { equals: newUsername, mode: 'insensitive' },
        id: { not: userId },
      },
    });
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'USERNAME_TAKEN',
            message: 'This username is already in use',
          },
        },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: { username: newUsername },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CHANGE_USERNAME',
        entityType: 'USER',
        entityId: userId,
        description: 'User changed their username',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Username updated successfully',
      data: { username: newUsername },
    });
  } catch (error: unknown) {
    console.error('Error changing username:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update username',
        },
      },
      { status: 500 }
    );
  }
}
