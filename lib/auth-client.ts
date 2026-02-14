/**
 * Client-safe permission checks using session data only.
 * Use this in client components ('use client') instead of lib/auth.ts.
 *
 * lib/auth.ts uses Prisma and cannot be imported in client components
 * (causes "Module not found: Can't resolve 'fs'" build error).
 */

import type { Session } from 'next-auth';

/** Permission slugs - matches lib/auth.ts PERMISSIONS */
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
  TRANSACTIONS_CREATE: 'transactions.create',
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
 * Check if the role has full access (bypasses permission checks).
 * Uses substring matching for manager roles (matches "Manager", "Branch Manager", etc.)
 * and "administrator" for legacy role names. Matches server semantics in lib/auth.ts.
 */
function hasFullAccessByRole(roleName: string): boolean {
  const r = roleName.toLowerCase();
  return r.includes('manager') || r.includes('administrator');
}

/**
 * Check if the user has a specific permission (client-side).
 * Uses session.permissions from JWT - no database access.
 * Manager bypass: always returns true (substring match for manager roles).
 */
export function hasPermission(
  session: Session | null,
  permissionSlug: string
): boolean {
  if (!session?.user?.roleId) {
    return false;
  }

  const roleName = session.user?.roleName ?? '';
  if (hasFullAccessByRole(roleName)) {
    return true;
  }

  const permissions = session.user?.permissions ?? [];
  return permissions.includes(permissionSlug);
}

/**
 * Check if the user has any of the given permissions (client-side).
 */
export function hasAnyPermission(
  session: Session | null,
  permissionSlugs: string[]
): boolean {
  if (!session?.user?.roleId) {
    return false;
  }

  const roleName = session.user?.roleName ?? '';
  if (hasFullAccessByRole(roleName)) {
    return true;
  }

  const permissions = session.user?.permissions ?? [];
  return permissionSlugs.some((slug) => permissions.includes(slug));
}
