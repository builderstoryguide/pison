import type { MenuConfig, MenuItem } from '@/config/types';
import { hasPermission } from '@/lib/auth-client';

export type SessionForMenu = {
  user?: { permissions?: string[]; roleName?: string };
} | null | undefined;

/**
 * Recursively filter menu items by user permissions.
 * Items without a permission are shown to all authenticated users.
 * Parent items are hidden when all children are filtered out.
 * Headings with no visible items below them (until the next heading) are removed.
 */
export function filterMenuByPermission(
  items: MenuConfig,
  session: SessionForMenu
): MenuConfig {
  if (session === null || !session?.user) return [];
  const filtered = items
    .map((item) => {
      if (item.heading) return item;
      if (item.permission && !hasPermission(session, item.permission)) return null;
      if (item.children) {
        const filteredChildren = filterMenuByPermission(item.children, session);
        if (filteredChildren.length === 0) return null;
        return { ...item, children: filteredChildren };
      }
      return item;
    })
    .filter((item): item is MenuItem => item !== null);

  // Remove orphan headings: headings with no visible items between them and the next heading
  return filtered.filter((item, index) => {
    if (!item.heading) return true;
    for (let i = index + 1; i < filtered.length; i++) {
      if (filtered[i].heading) return false; // Next heading reached with no items between
      return true; // Found a non-heading item before the next heading
    }
    return false; // End of array reached with no items after this heading
  });
}
