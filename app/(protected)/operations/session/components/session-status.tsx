'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { formatDate, formatDateTime } from '@/lib/helpers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useTranslation } from '@/hooks/useTranslation';
import type { TFunction } from 'i18next';

function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface DailySession {
  id: string;
  sessionDate: string;
  status: 'OPEN' | 'CLOSED' | 'LOCKED';
  openedAt: string;
  closedAt?: string;
  plannedClosureAt?: string | null;
  openedBy?: {
    name: string;
  };
  closedBy?: {
    name: string;
  };
}

function translateSessionStatus(status: DailySession['status'], t: TFunction): string {
  switch (status) {
    case 'OPEN':
      return t('pages.operations.sessionStatus.statusOPEN');
    case 'CLOSED':
      return t('pages.operations.sessionStatus.statusCLOSED');
    case 'LOCKED':
      return t('pages.operations.sessionStatus.statusLOCKED');
    default:
      return status;
  }
}

export default function SessionStatus() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { data: sessionStatusData, isLoading, isError, error, refetch } = useSessionStatus();
  const currentSession = sessionStatusData?.session ?? null;
  const effectiveClosureAt = sessionStatusData?.effectiveClosureAt ?? null;
  const topPlannedClosureAt = sessionStatusData?.plannedClosureAt ?? null;
  const defaultDailyClosureTime = sessionStatusData?.defaultDailyClosureTime ?? '18:00';
  const settingsTimezone = sessionStatusData?.timezone ?? 'UTC';

  const [plannedLocal, setPlannedLocal] = useState('');

  useEffect(() => {
    if (topPlannedClosureAt) {
      setPlannedLocal(toDatetimeLocalValue(new Date(topPlannedClosureAt)));
    } else {
      setPlannedLocal('');
    }
  }, [topPlannedClosureAt]);

  const openSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiFetch('/api/operations/session', {
        method: 'POST',
      });

      if (!response.ok) {
        const errBody = await response.json();
        throw new Error(errBody.error?.message || t('pages.operations.sessionOpenFailed'));
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-status'] });
      toast.success(t('pages.operations.sessionOpenedSuccess'));
    },
    onError: (err: Error) => {
      toast.error(err.message || t('pages.operations.sessionOpenFailed'));
    },
  });

  const plannedClosureMutation = useMutation({
    mutationFn: async (plannedClosureAt: string | null) => {
      const response = await apiFetch('/api/operations/session/planned-closure', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plannedClosureAt }),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body?.error?.message || t('pages.operations.plannedClosureSaveFailed'));
      }
      return body;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-status'] });
      toast.success(t('pages.operations.plannedClosureUpdated'));
    },
    onError: (err: Error) => {
      toast.error(err.message || t('pages.operations.plannedClosureSaveFailed'));
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
          <h3 className="text-lg font-semibold mb-2">{t('pages.sessionGate.unableToLoadTitle')}</h3>
          <p className="text-muted-foreground mb-4">
            {error?.message || t('pages.sessionGate.unableToLoadDesc')}
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            {t('pages.operations.sessionStatus.tryAgain')}
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
                <CardTitle>{t('pages.operations.sessionStatus.currentSessionTitle')}</CardTitle>
                {isOpen ? (
                  <Badge variant="success" className="gap-1 px-2">
                    <Unlock className="size-3" />
                    {t('pages.operations.sessionStatus.badgeOpen')}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1 px-2">
                    <Lock className="size-3" />
                    {sessionData?.status
                      ? translateSessionStatus(sessionData.status, t)
                      : t('pages.operations.sessionStatus.noSession')}
                  </Badge>
                )}
              </div>
              <CardDescription>
                {t('pages.operations.sessionStatus.cardDescription')}
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              {canManageSession &&
                (isOpen ? (
                  <Link href="/operations/day-closure">
                    <Button size="sm" variant="destructive">
                      <Lock className="mr-2 size-4" />
                      {t('pages.operations.sessionStatus.closeSession')}
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
                        {t('pages.operations.sessionStatus.opening')}
                      </>
                    ) : (
                      <>
                        <Unlock className="mr-2 size-4" />
                        {t('pages.operations.sessionStatus.openTodaysSession')}
                      </>
                    )}
                  </Button>
                ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sessionData ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-sm text-muted-foreground">
                    {t('pages.operations.sessionStatus.sessionDate')}
                  </div>
                  <div className="font-medium text-lg">
                    {formatDate(new Date(sessionData.sessionDate))}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground">
                    {t('pages.operations.sessionStatus.statusLabel')}
                  </div>
                  <div className="font-medium text-lg">
                    {translateSessionStatus(sessionData.status, t)}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground">
                    {t('pages.operations.sessionStatus.openedAt')}
                  </div>
                  <div className="font-medium">
                    {formatDateTime(new Date(sessionData.openedAt))}
                  </div>
                  {sessionData.openedBy && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {t('pages.operations.sessionStatus.byUser', {
                        name: sessionData.openedBy.name,
                      })}
                    </div>
                  )}
                </div>

                {sessionData.closedAt && (
                  <div>
                    <div className="text-sm text-muted-foreground">
                      {t('pages.operations.sessionStatus.closedAt')}
                    </div>
                    <div className="font-medium">
                      {formatDateTime(new Date(sessionData.closedAt))}
                    </div>
                    {sessionData.closedBy && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {t('pages.operations.sessionStatus.byUser', {
                          name: sessionData.closedBy.name,
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <CalendarCheck className="size-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {t('pages.operations.sessionStatus.noActiveSessionTitle')}
              </h3>
              <p className="text-muted-foreground mb-4">
                {t('pages.operations.sessionStatus.noActiveSessionBody')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {isOpen && sessionData && (
        <Card>
          <CardHeader>
            <CardTitle>{t('pages.operations.sessionStatus.sessionInformationTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-green-600" />
                <span>{t('pages.operations.sessionStatus.sessionOpenTransactionsAllowed')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-muted-foreground" />
                <span>
                  {t('pages.operations.sessionStatus.sessionOpenedAtLine', {
                    time: formatDateTime(new Date(sessionData.openedAt)),
                  })}
                </span>
              </div>
              {effectiveClosureAt && (
                <div className="flex flex-col gap-1 pt-2">
                  <div className="text-sm text-muted-foreground">
                    {t('pages.operations.sessionStatus.effectiveClosureToday')}
                  </div>
                  <div className="font-medium">
                    {formatDateTime(new Date(effectiveClosureAt))}
                  </div>
                  {!topPlannedClosureAt && (
                    <div className="text-xs text-muted-foreground">
                      {t('pages.operations.sessionStatus.defaultClosureTimeLine', {
                        time: defaultDailyClosureTime,
                        timezone: settingsTimezone,
                      })}
                    </div>
                  )}
                </div>
              )}
              {canManageSession && (
                <div className="pt-4 border-t mt-4 space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="planned-closure-local">
                      {t('pages.operations.sessionStatus.plannedClosureOverride')}
                    </Label>
                    <Input
                      id="planned-closure-local"
                      type="datetime-local"
                      value={plannedLocal}
                      onChange={(e) => setPlannedLocal(e.target.value)}
                      disabled={plannedClosureMutation.isPending}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('pages.operations.sessionStatus.plannedClosureOverrideHint')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={plannedClosureMutation.isPending || !plannedLocal}
                        onClick={() => {
                          const iso = new Date(plannedLocal).toISOString();
                          plannedClosureMutation.mutate(iso);
                        }}
                      >
                        {plannedClosureMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            {t('pages.operations.sessionStatus.savingPlannedClosure')}
                          </>
                        ) : (
                          t('pages.operations.sessionStatus.savePlannedClosure')
                        )}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={plannedClosureMutation.isPending || !topPlannedClosureAt}
                        onClick={() => {
                          setPlannedLocal('');
                          plannedClosureMutation.mutate(null);
                        }}
                      >
                        {t('pages.operations.sessionStatus.clearPlannedClosure')}
                      </Button>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {t('pages.operations.sessionStatus.managerCloseHint')}
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
