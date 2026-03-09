'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { formatDate, formatDateTime } from '@/lib/helpers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Loader2,
  CalendarCheck,
  Lock,
  Unlock,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from 'next-auth/react';
import { isManagerRole } from '@/lib/auth-client';
import Link from 'next/link';
import { useSessionStatus } from '@/hooks/use-session-status';

interface DailySession {
  id: string;
  sessionDate: string;
  status: 'OPEN' | 'CLOSED' | 'LOCKED';
  openedAt: string;
  closedAt?: string;
  openedBy?: {
    name: string;
  };
  closedBy?: {
    name: string;
  };
}

export default function SessionStatus() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { data: sessionStatusData, isLoading, isError, error, refetch } = useSessionStatus();
  const currentSession = sessionStatusData?.session ?? null;

  // Open session mutation
  const openSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiFetch('/api/operations/session', {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to open session');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-status'] });
      toast.success('Session opened successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to open session');
    },
  });


  const canManageSession = isManagerRole(session);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="space-y-4 py-8">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError && !currentSession) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertTriangle className="size-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Unable to Load Session Status</h3>
          <p className="text-muted-foreground mb-4">
            {error?.message || 'Failed to fetch session status.'}
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const sessionData: DailySession | null = currentSession || null;
  const isOpen = sessionData?.status === 'OPEN';


  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <CardTitle>Current Session</CardTitle>
                {isOpen ? (
                    <Badge variant="success" className="gap-1 px-2">
                    <Unlock className="size-3" />
                    Open
                    </Badge>
                ) : (
                    <Badge variant="secondary" className="gap-1 px-2">
                    <Lock className="size-3" />
                    {sessionData?.status || 'No Session'}
                    </Badge>
                )}
              </div>
              <CardDescription>
                Daily session status and information
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
                {canManageSession && (
                isOpen ? (
                    <Link href="/operations/day-closure">
                    <Button size="sm" variant="destructive">
                        <Lock className="mr-2 size-4" />
                        Close Session
                    </Button>
                    </Link>
                ) : (
                    <Button
                    size="sm"
                    onClick={() => openSessionMutation.mutate()}
                    disabled={openSessionMutation.isPending}
                    >
                    {openSessionMutation.isPending ? (
                        <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Opening...
                        </>
                    ) : (
                        <>
                        <Unlock className="mr-2 size-4" />
                        Open Today's Session
                        </>
                    )}
                    </Button>
                )
                )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sessionData ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-sm text-muted-foreground">Session Date</div>
                  <div className="font-medium text-lg">
                    {formatDate(new Date(sessionData.sessionDate))}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div className="font-medium text-lg">
                    {sessionData.status}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground">Opened At</div>
                  <div className="font-medium">
                    {formatDateTime(new Date(sessionData.openedAt))}
                  </div>
                  {sessionData.openedBy && (
                    <div className="text-xs text-muted-foreground mt-1">
                      by {sessionData.openedBy.name}
                    </div>
                  )}
                </div>

                {sessionData.closedAt && (
                  <div>
                    <div className="text-sm text-muted-foreground">Closed At</div>
                    <div className="font-medium">
                      {formatDateTime(new Date(sessionData.closedAt))}
                    </div>
                    {sessionData.closedBy && (
                      <div className="text-xs text-muted-foreground mt-1">
                        by {sessionData.closedBy.name}
                      </div>
                    )}
                  </div>
                )}
              </div>




            </div>
          ) : (
            <div className="text-center py-8">
              <CalendarCheck className="size-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Active Session</h3>
              <p className="text-muted-foreground mb-4">
                A daily session needs to be opened before transactions can be created.
              </p>

            </div>
          )}
        </CardContent>
      </Card>

      {isOpen && (
        <Card>
          <CardHeader>
            <CardTitle>Session Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-green-600" />
                <span>Session is open. Transactions can be created.</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-muted-foreground" />
                <span>
                  Session opened at {formatDateTime(new Date(sessionData.openedAt))}
                </span>
              </div>
              {canManageSession && (
                <div className="pt-4 border-t mt-4">
                  <p className="text-muted-foreground text-xs">
                    As a manager, you can close this session at the end of the day
                    to lock all transactions for today.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
