
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = changePasswordSchema.safeParse(body);

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

    const { currentPassword, newPassword } = validation.data;
    const userId = session.user.id;

    // Fetch user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'User not found' } },
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

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_PASSWORD', message: 'Incorrect current password' } },
        { status: 400 }
      );
    }

    // Prevent reusing the same password
    const isReuse = await bcrypt.compare(newPassword, user.password);
    if (isReuse) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PASSWORD_REUSE',
            message: 'New password must be different from current password',
          },
        },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    // Log the event
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CHANGE_PASSWORD',
        entityType: 'USER',
        entityId: userId,
        description: 'User changed their password',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error: unknown) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update password',
        },
      },
      { status: 500 }
    );
  }
}
