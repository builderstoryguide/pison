import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { getServerSession } from 'next-auth/next';
import { getClientIP } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { systemLog } from '@/services/system-log';
import {
  UserAddSchema,
  UserAddSchemaType,
} from '@/app/(protected)/user-management/users/forms/user-add-schema';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { requirePermission } from '@/lib/auth';
import { UserStatus } from '@/app/models/user';

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

/** Derive a clean seed string from a display name */
function normalizeUsernameSeed(name: string): string {
  const base = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  return base.slice(0, 16) || 'user';
}

/** Generate a unique username by appending a random hex suffix */
async function generateUniqueUsername(
  tx: Prisma.TransactionClient,
  name: string,
): Promise<string> {
  const seed = normalizeUsernameSeed(name);
  for (let attempt = 0; attempt < 10; attempt++) {
    const suffix = crypto.randomBytes(3).toString('hex');
    const candidate = `${seed}${suffix}`;
    const exists = await tx.user.findUnique({
      where: { username: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
  }
  throw new Error('Unable to generate a unique username. Please try again.');
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limitRaw = parseInt(searchParams.get('limit') || '50', 10);
  const limit = Math.min(Math.max(1, limitRaw), 100);
  const query = searchParams.get('query') || '';
  const sortField = searchParams.get('sort') || 'name';
  const sortDirection = searchParams.get('dir') === 'desc' ? 'desc' : 'asc';
  const status = searchParams.get('status') || null;
  const roleId = searchParams.get('roleId') || null;

  try {
    // Validate user session
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized request' },
        { status: 401 },
      );
    }

    const forbidden = await requirePermission(session, 'users.manage');
    if (forbidden) return forbidden;

    // Map status query to enum type, fallback to null if invalid
    const statusFilter =
      status && status !== 'all' ? (status as UserStatus) : undefined;

    // Count total users with filters
    const totalCount = await prisma.user.count({
      where: {
        AND: [
          ...(statusFilter ? [{ status: statusFilter }] : []),
          ...(roleId && roleId !== 'all' ? [{ roleId }] : []),
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
            ],
          },
        ],
      },
    });

    // Set order logic
    const sortMap: Record<string, Prisma.UserOrderByWithRelationInput> = {
      name: { name: sortDirection as Prisma.SortOrder },
      role_name: { role: { name: sortDirection as Prisma.SortOrder } },
      status: { status: sortDirection as Prisma.SortOrder },
      createdAt: { createdAt: sortDirection as Prisma.SortOrder },
      lastSignInAt: { lastSignInAt: sortDirection as Prisma.SortOrder },
    };

    const orderBy = sortMap[sortField] || {
      createdAt: sortDirection as Prisma.SortOrder,
    };

    // Fetch users with filters
    const users = await prisma.user.findMany({
      where: {
        AND: [
          ...(statusFilter ? [{ status: statusFilter }] : []),
          ...(roleId && roleId !== 'all' ? [{ roleId }] : []),
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
            ],
          },
        ],
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy,
      select: {
        id: true,
        isTrashed: true,
        avatar: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
        lastSignInAt: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      data: users,
      pagination: {
        total: totalCount,
        page,
        limit,
      },
    });
  } catch {
    return NextResponse.json(
      { message: 'Oops! Something went wrong. Please try again in a moment.' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate user session
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized request' },
        { status: 401 },
      );
    }

    // Only administrators can create user accounts
    const forbidden = await requirePermission(session, 'users.manage');
    if (forbidden) return forbidden;

    const clientIp = getClientIP(request);
    const body = await request.json();
    const parsedData = UserAddSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json(
        { error: 'Invalid input.', details: parsedData.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { name, email, username: providedUsername, password, roleId }: UserAddSchemaType = parsedData.data;

    // Validate provided username format if given
    if (providedUsername && !USERNAME_REGEX.test(providedUsername)) {
      return NextResponse.json(
        { message: 'Username must be 3-30 characters, letters, numbers, and underscores only.' },
        { status: 400 },
      );
    }

    // Check if the email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Email is already registered.' },
        { status: 409 },
      );
    }

    // Check if provided username is already taken
    if (providedUsername) {
      const existingUsername = await prisma.user.findUnique({
        where: { username: providedUsername },
        select: { id: true },
      });
      if (existingUsername) {
        return NextResponse.json(
          { message: 'Username is already in use. Please choose a different one.' },
          { status: 409 },
        );
      }
    }

    // Check if the role exists
    const existingRole = await prisma.userRole.findUnique({
      where: { id: roleId },
    });

    if (!existingRole) {
      return NextResponse.json(
        {
          message:
            'Selected role does not exist. Someone might have deleted it already.',
        },
        { status: 404 },
      );
    }

    // Prevent assigning the "client" role (clients cannot access the system)
    if (existingRole.slug?.toLowerCase() === 'client') {
      return NextResponse.json(
        { message: 'Cannot create user accounts with the Client role. Clients do not have system access.' },
        { status: 422 },
      );
    }

    // Hash the password with bcrypt (cost factor 12)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Use a transaction to insert multiple records atomically
    const result = await prisma.$transaction(async (tx) => {
      // Resolve final username — use provided one or auto-generate from name
      const username = providedUsername || await generateUniqueUsername(tx, name);

      // Create the user with hashed password
      const user = await tx.user.create({
        data: {
          name,
          email,
          username,
          password: hashedPassword,
          status: UserStatus.ACTIVE,
          roleId,
        },
      });

      // System log for internal tracking
      await systemLog(
        {
          event: 'create',
          userId: session.user.id,
          entityId: user.id,
          entityType: 'user',
          description: `User account created by manager (role: ${existingRole.name}).`,
          ipAddress: clientIp,
        },
        tx,
      );

      // Audit log for financial compliance
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'USER_CREATED',
          entityType: 'USER',
          entityId: user.id,
          description: `Manager created user account (id: ${user.id}) with role ${existingRole.name}.`,
        },
      });

      return user;
    });

    return NextResponse.json(
      {
        message: 'User successfully added.',
        user: {
          id: result.id,
          name: result.name,
          email: result.email,
          username: result.username,
          status: result.status,
        },
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { message: 'Oops! Something went wrong. Please try again in a moment.' },
      { status: 500 },
    );
  }
}
