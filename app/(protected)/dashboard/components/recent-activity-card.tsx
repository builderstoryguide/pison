'use client';

import {
  CalendarCheck,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Receipt,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/helpers';

interface ActivityItem {
  id: string;
  type: 'transaction' | 'collection' | 'loan' | 'validation' | 'deposit' | 'withdrawal';
  description: string;
  user: string;
  time: string;
  amount?: number;
}

interface RecentActivityCardProps {
  activities: ActivityItem[];
  title?: string;
}

export function RecentActivityCard({
  activities,
  title = 'Recent Activity',
}: RecentActivityCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getActivityIcon = (type: ActivityItem['type']): LucideIcon => {
    switch (type) {
      case 'transaction':
        return CreditCard;
      case 'collection':
        return Receipt;
      case 'loan':
        return DollarSign;
      case 'validation':
        return CheckCircle2;
      case 'deposit':
        return Receipt;
      case 'withdrawal':
        return CreditCard;
      default:
        return CalendarCheck;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CalendarCheck className="w-12 h-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No recent activity</p>
            </div>
          ) : (
            activities.map((activity) => {
              const ActivityIcon = getActivityIcon(activity.type);
              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getInitials(activity.user)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <ActivityIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                      <p className="text-sm font-medium truncate">
                        {activity.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">{activity.user}</p>
                      {activity.amount && (
                        <p className="text-xs font-semibold">
                          {formatCurrency(activity.amount)}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
