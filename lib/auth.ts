/**
 * Permission-check helpers for API route authorization.
 * Enforces role-based permissions from the UserRolePermission table.
 */

import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { prisma } from '@/lib/prisma';

/** Permission slugs used across the API - matches seed-microfinance */
export const PERMISSIONS = {
  DASHBOARD_VIEW: 'dashboard.view',
  CLIENTS_VIEW: 'clients.view',
  CLIENTS_CREATE: 'clients.create',
  CLIENTS_EDIT: 'clients.edit',
  CLIENTS_DELETE: 'clients.delete',
  AGENTS_VIEW: 'agents.view',
  AGENTS_CREATE: 'agents.create',
  AGENTS_EDIT: 'agents.edit',
  COLLECTION_AREAS_VIEW: 'collection_areas.view',
  COLLECTION_AREAS_MANAGE: 'collection_areas.manage',
  COLLECTIONS_CREATE: 'collections.create',
  TRANSACTIONS_VIEW: 'transactions.view',
  TRANSACTIONS_APPROVE: 'transactions.approve',
  LOANS_VIEW: 'loans.view',
  LOANS_CREATE: 'loans.create',
  LOANS_REPAYMENT: 'loans.repayment',
  LOANS_APPROVE: 'loans.approve',
  REPORTS_VIEW: 'reports.view',
  REPORTS_EXPORT: 'reports.export',
  SESSION_MANAGE: 'session.manage',
  DAY_CLOSURE_MANAGE: 'day_closure.manage',
  USERS_MANAGE: 'users.manage',
  ROLES_MANAGE: 'roles.manage',
  SETTINGS_MANAGE: 'settings.manage',
} as const;

/**
 * Check if the user has a specific permission.
 * Manager bypass: always returns true (Manager has full access).
 * Other roles: checks session.user.permissions (no DB lookup).
 */
export function hasPermission(
  session: Session | null,
  permissionSlug: string
): boolean {
  if (!session?.user?.roleId) {
    return false;
  }

  const roleName = (session.user?.roleName || '').toLowerCase();
  if (roleName === 'manager') {
    return true;
  }

  const permissions = session.user?.permissions ?? [];
  return permissions.some((p) => p === permissionSlug);
}

/**
 * Check if the user has any of the given permissions.
 */
export async function hasAnyPermission(
  session: Session | null,
  permissionSlugs: string[]
): Promise<boolean> {
  if (!session?.user?.roleId) {
    return false;
  }

  const roleName = (session.user?.roleName || '').toLowerCase();
  if (roleName.includes('manager')) {
    return true;
  }

  const role = await prisma.userRole.findUnique({
    where: { id: session.user.roleId },
    include: {
      permissions: {
        include: { permission: true },
      },
    },
  });

  if (!role) return false;

  const rolePermissionSlugs = role.permissions.map((rp) => rp.permission?.slug).filter(Boolean);

  return permissionSlugs.some((slug) => rolePermissionSlugs.includes(slug));
}

/**
 * Require a permission for API routes.
 * Returns null if authorized, or a NextResponse (401/403) to return.
 */
export async function requirePermission(
  session: Session | null,
  permissionSlug: string
): Promise<NextResponse | null> {
  if (!session) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  const allowed = hasPermission(session, permissionSlug);
  if (!allowed) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Permission '${permissionSlug}' required`,
        },
      },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Require any of the given permissions for API routes.
 * Returns null if authorized, or a NextResponse (401/403) to return.
 */
export async function requireAnyPermission(
  session: Session | null,
  permissionSlugs: string[]
): Promise<NextResponse | null> {
  if (!session) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  const allowed = await hasAnyPermission(session, permissionSlugs);
  if (!allowed) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `One of permissions [${permissionSlugs.join(', ')}] required`,
        },
      },
      { status: 403 }
    );
  }

  return null;
}
