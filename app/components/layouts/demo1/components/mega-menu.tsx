'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MENU_MEGA } from '@/config/menu.config';
import { cn } from '@/lib/utils';
import { useMenu } from '@/hooks/use-menu';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { MenuConfig } from '@/config/types';

export function MegaMenu() {
  const pathname = usePathname();
  const { isActive, hasActiveChild } = useMenu(pathname);

  const linkClass = `
    text-sm text-secondary-foreground font-medium 
    hover:text-primary hover:bg-transparent 
    focus:text-primary focus:bg-transparent 
    data-[active=true]:text-primary data-[active=true]:bg-transparent 
    data-[state=open]:text-primary data-[state=open]:bg-transparent
  `;

  const renderMenuItems = (items: MenuConfig) => {
    return items
      .filter((item) => item.title) // Filter out headings/separators
      .map((item, index) => {
        // If item has children, render as dropdown
        if (item.children && item.children.length > 0) {
          // Check if any child has nested children (for multi-column layout)
          const hasNestedChildren = item.children.some(
            (child) => child.children && child.children.length > 0,
          );

          return (
            <NavigationMenuItem key={index}>
              <NavigationMenuTrigger
                className={cn(linkClass)}
                data-active={
                  hasActiveChild(item.children || []) || undefined
                }
              >
                {item.title}
              </NavigationMenuTrigger>
              <NavigationMenuContent className="p-4">
                <div
                  className={cn(
                    'grid gap-3',
                    hasNestedChildren
                      ? 'w-[600px] grid-cols-2'
                      : 'w-[400px] grid-cols-1',
                  )}
                >
                  {item.children.map((child, childIndex) => {
                    // Handle nested children structure (for multi-column layout)
                    if (child.children && child.children.length > 0) {
                      return (
                        <div key={childIndex} className="space-y-2">
                          {child.title && (
                            <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                              {child.title}
                            </div>
                          )}
                          {child.children.map((subChild, subIndex) => {
                            if (!subChild.title) return null;
                            return (
                              <Link
                                key={subIndex}
                                href={subChild.path || '#'}
                                className={cn(
                                  'flex items-center gap-2 text-sm hover:text-primary transition-colors py-1',
                                  isActive(subChild.path) &&
                                    'text-primary font-medium',
                                )}
                              >
                                {subChild.icon && (
                                  <subChild.icon className="w-4 h-4 shrink-0" />
                                )}
                                <span>{subChild.title}</span>
                              </Link>
                            );
                          })}
                        </div>
                      );
                    }
                    // Regular child item
                    if (!child.title) return null;
                    return (
                      <Link
                        key={childIndex}
                        href={child.path || '#'}
                        className={cn(
                          'flex items-center gap-2 text-sm hover:text-primary transition-colors py-1',
                          isActive(child.path) && 'text-primary font-medium',
                        )}
                      >
                        {child.icon && (
                          <child.icon className="w-4 h-4 shrink-0" />
                        )}
                        <span>{child.title}</span>
                      </Link>
                    );
                  })}
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          );
        }

        // Regular menu item without children
        return (
          <NavigationMenuItem key={index}>
            <NavigationMenuLink asChild>
              <Link
                href={item.path || '#'}
                className={cn(linkClass)}
                data-active={isActive(item.path) || undefined}
              >
                {item.title}
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        );
      });
  };

  return (
    <NavigationMenu>
      <NavigationMenuList className="gap-0">
        {renderMenuItems(MENU_MEGA)}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
