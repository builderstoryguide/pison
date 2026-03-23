'use client';

import { ArrowDown, ArrowUp, type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  onClick,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        'relative overflow-hidden',
        onClick && 'hover:shadow-md transition-shadow cursor-pointer',
        className,
      )}
      onClick={onClick}
    >
      {/* Grid pattern background in upper section */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
          height: '66.666%',
        }}
      />
      
      <CardContent className="p-6 relative z-10">
        <div className="flex flex-col">
          {/* Icon and title in top section */}
          {Icon && (
            <div className="flex items-center gap-2.5 mb-4">
              <Icon className="w-8 h-8 text-foreground shrink-0" />
              <p className="text-sm font-medium text-muted-foreground">
                {title}
              </p>
            </div>
          )}
          
          {/* Show title if no icon */}
          {!Icon && title && (
            <p className="text-sm font-medium text-muted-foreground mb-4">
              {title}
            </p>
          )}
          
          {/* Large bold statistic */}
          <p className="text-3xl font-semibold text-mono mb-2 leading-none">
            {value}
          </p>
          
          {/* Descriptive text - show description if available */}
          {description && (
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          )}
          
          {/* Trend indicator */}
          {trend && (
            <div className="flex items-center gap-1.5 mt-3">
              <Badge
                size="sm"
                variant={trend.isPositive ? 'success' : 'destructive'}
                appearance="light"
              >
                {trend.isPositive ? (
                  <ArrowUp className="size-3 mr-0.5" />
                ) : (
                  <ArrowDown className="size-3 mr-0.5" />
                )}
                {Math.abs(trend.value)}%
              </Badge>
              <span className="text-xs text-muted-foreground">vs last period</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
