'use client';

import { Fragment, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { MENU_SIDEBAR } from '@/config/menu.config';
import { MenuItem } from '@/config/types';
import { cn } from '@/lib/utils';
import { useMenu } from '@/hooks/use-menu';

export interface ToolbarProps {
  children?: ReactNode;
  className?: string;
}

export interface ToolbarHeadingProps {
  title?: string | ReactNode;
  description?: string | ReactNode;
  children?: ReactNode;
  className?: string;
}

export interface ToolbarTitleProps {
  children: ReactNode;
  className?: string;
}

export interface ToolbarActionsProps {
  children?: ReactNode;
  className?: string;
}

function Toolbar({ children, className }: ToolbarProps) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-5 pb-7.5", className)}>
      {children}
    </div>
  );
}

function ToolbarActions({ children, className }: ToolbarActionsProps) {
  return <div className={cn("flex items-center gap-2.5", className)}>{children}</div>;
}

function ToolbarBreadcrumbs() {
  const pathname = usePathname();
  const { getBreadcrumb, isActive } = useMenu(pathname);
  const items: MenuItem[] = getBreadcrumb(MENU_SIDEBAR);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="flex [.header_&]:below-lg:hidden items-center gap-1.25 text-xs lg:text-sm font-medium mb-2.5 lg:mb-0">
      <div className="breadcrumb flex items-center gap-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const active = item.path ? isActive(item.path) : false;

          return (
            <Fragment key={index}>
              {item.path ? (
                <Link
                  href={item.path}
                  className={cn(
                    'flex items-center gap-1',
                    active
                      ? 'text-mono'
                      : 'text-muted-foreground hover:text-primary',
                  )}
                >
                  {item.title}
                </Link>
              ) : (
                <span
                  className={cn(isLast ? 'text-mono' : 'text-muted-foreground')}
                >
                  {item.title}
                </span>
              )}
              {!isLast && (
                <ChevronRight className="size-3.5 text-muted-foreground" />
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

function ToolbarHeading({ title = '', description, children, className }: ToolbarHeadingProps) {
  const pathname = usePathname();
  const { getCurrentItem } = useMenu(pathname);
  const item = getCurrentItem(MENU_SIDEBAR);

  if (children) {
    return (
      <div className={cn('flex flex-col justify-center gap-2', className)}>
        {children}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col justify-center gap-2", className)}>
      <h1 className="text-xl font-medium leading-none text-mono">
        {title || item?.title || 'Untitled'}
      </h1>
      {description && (
        <div className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
          {description}
        </div>
      )}
    </div>
  );
}

const ToolbarTitle = ({ className, children }: ToolbarTitleProps) => {
  return (
    <h1 className={cn('text-xl font-medium leading-none text-mono', className)}>
      {children}
    </h1>
  );
};

export { Toolbar, ToolbarActions, ToolbarBreadcrumbs, ToolbarHeading, ToolbarTitle };
