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
  ACCOUNTANTS_VIEW: 'accountants.view',
  ACCOUNTANTS_CREATE: 'accountants.create',
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
  REPORTS_SURPLUS_SHORTAGE: 'reports.surplus_shortage',
  SESSION_MANAGE: 'session.manage',
  DAY_CLOSURE_MANAGE: 'day_closure.manage',
  USERS_MANAGE: 'users.manage',
  ROLES_MANAGE: 'roles.manage',
  SETTINGS_MANAGE: 'settings.manage',
} as const;

/**
 * Agent role matcher used for feature restrictions.
 * Substring matching supports role labels like "Senior Agent" or "Collector".
 */
export function isAgentOrCollectorRole(roleName: string | null | undefined): boolean {
  const normalizedRole = (roleName || '').toLowerCase();
  return normalizedRole.includes('agent') || normalizedRole.includes('collector');
}

/**
 * Check if the role has full access (bypasses permission checks).
 * Uses role slug (manager, administrator) for reliable matching, with role name as fallback.
 * Matches server semantics in lib/auth.ts.
 * Returns true when roleSlug is manager/admin even if roleName is empty.
 */
function hasFullAccessByRole(
  roleName: string,
  roleSlug?: string | null
): boolean {
  const slug = (roleSlug ?? '').toLowerCase();
  if (slug === 'manager' || slug === 'administrator' || slug === 'admin') {
    return true;
  }
  const r = (roleName ?? '').toLowerCase();
  return r.includes('manager') || r.includes('administrator');
}

/**
 * Check if the user has the Manager role (for session open/close restrictions).
 * Only Manager can open and close daily sessions; Accountant and Agent cannot.
 */
export function isManagerRole(session: Session | null): boolean {
  if (!session?.user?.roleId) return false;
  const roleName = session.user?.roleName ?? '';
  const roleSlug = session.user?.roleSlug ?? null;
  return hasFullAccessByRole(roleName, roleSlug);
}

/**
 * Check if the user has a specific permission (client-side).
 * Uses session.permissions from JWT - no database access.
 * Manager bypass: always returns true (substring match for manager roles).
 * Grace period: when roleId exists but roleName/roleSlug are missing (session hydrating),
 * allow access to avoid flash of empty menu until full session loads.
 */
export function hasPermission(
  session: Session | null,
  permissionSlug: string
): boolean {
  if (!session?.user?.roleId) {
    return false;
  }

  const roleName = session.user?.roleName ?? '';
  const roleSlug = session.user?.roleSlug ?? null;

  if (hasFullAccessByRole(roleName, roleSlug)) {
    return true;
  }

  // Grace period: roleId exists but role metadata not yet hydrated (e.g. during refetch)
  if (!roleName && !roleSlug) {
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
  const roleSlug = session.user?.roleSlug ?? null;

  if (hasFullAccessByRole(roleName, roleSlug)) {
    return true;
  }

  // Grace period: roleId exists but role metadata not yet hydrated
  if (!roleName && !roleSlug) {
    return true;
  }

  const permissions = session.user?.permissions ?? [];
  return permissionSlugs.some((slug) => permissions.includes(slug));
}
