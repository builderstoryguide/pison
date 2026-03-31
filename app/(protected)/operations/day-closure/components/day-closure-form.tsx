'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiFetch } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/helpers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Loader2,
  Lock,
  DollarSign,
  AlertTriangle,
  Calculator,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useSessionStatus } from '@/hooks/use-session-status';
import { isManagerRole } from '@/lib/auth-client';
import { useTranslation } from '@/hooks/useTranslation';

export default function DayClosureForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { data: sessionStatusData, isLoading: isLoadingSession } = useSessionStatus();
  const sessionData = sessionStatusData?.session ?? null;
  const systemBalance = sessionStatusData?.systemBalance ?? 0;

  const closureSchema = useMemo(
    () =>
      z.object({
        physicalCash: z.string().min(1, t('pages.dayClosure.validationPhysicalCashRequired')),
        notes: z.string().optional(),
      }),
    [t],
  );

  type ClosureFormData = z.infer<typeof closureSchema>;

  const form = useForm<ClosureFormData>({
    resolver: zodResolver(closureSchema),
    defaultValues: {
      physicalCash: '',
      notes: '',
    },
  });

  // Close session mutation
  const closeMutation = useMutation({
    mutationFn: async (data: { physicalCash: number; notes?: string }) => {
      const response = await apiFetch('/api/operations/day-closure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || t('pages.dayClosure.toastCloseFailed'));
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-status'] });
      toast.success(t('pages.dayClosure.toastClosed'));
      router.push('/operations/session');
    },
    onError: (error: Error) => {
      toast.error(error.message || t('pages.dayClosure.toastCloseFailed'));
    },
  });

  const onSubmit = (data: ClosureFormData) => {
    const physicalCash = parseFloat(data.physicalCash);
    if (isNaN(physicalCash) || physicalCash < 0) {
      toast.error(t('pages.dayClosure.toastInvalidCash'));
      return;
    }

    closeMutation.mutate({
      physicalCash,
      notes: data.notes || undefined,
    });
  };

  if (isLoadingSession) {
    return (
      <Card>
        <CardContent className="space-y-4 py-8">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!isManagerRole(session)) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertTriangle className="size-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('pages.dayClosure.accessDeniedTitle')}</h3>
          <p className="text-muted-foreground mb-4">
            {t('pages.dayClosure.accessDeniedDesc')}
          </p>
          <Button variant="outline" onClick={() => router.push('/')}>
            {t('common.buttons.returnToDashboard')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isOpen = sessionStatusData?.isOpen ?? false;

  if (!sessionData) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertTriangle className="size-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('pages.dayClosure.noActiveSessionTitle')}</h3>
          <p className="text-muted-foreground mb-4">
            {t('pages.dayClosure.noActiveSessionDesc')}
          </p>
          <Button variant="outline" onClick={() => router.push('/operations/session')}>
            {t('common.buttons.viewSessionStatus')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!isOpen) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Lock className="size-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('pages.dayClosure.alreadyClosedTitle')}</h3>
          <p className="text-muted-foreground mb-4">
            {t('pages.dayClosure.alreadyClosedDesc', {
              date: formatDate(new Date(sessionData.sessionDate)),
            })}
          </p>
          <Button variant="outline" onClick={() => router.push('/operations/session')}>
            {t('common.buttons.viewSessionStatus')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const watchPhysicalCash = form.watch('physicalCash');
  const physicalCashValue = parseFloat(watchPhysicalCash) || 0;
  const surplusShortage = physicalCashValue - systemBalance;

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('pages.dayClosure.sessionInfoTitle')}</CardTitle>
          <CardDescription>
            {t('pages.dayClosure.sessionFor', {
              date: formatDate(new Date(sessionData.sessionDate)),
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3 p-4 rounded-lg border">
              <DollarSign className="size-8 text-primary" />
              <div>
                <div className="text-sm text-muted-foreground">
                  {t('pages.dayClosure.systemBalance')}
                </div>
                <div className="text-2xl font-bold">
                  {formatCurrency(systemBalance)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg border">
              <Calculator className="size-8 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">
                  {t('pages.dayClosure.surplusShortage')}
                </div>
                <div
                  className={`text-2xl font-bold ${
                    surplusShortage >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {surplusShortage >= 0 ? '+' : ''}
                  {formatCurrency(surplusShortage)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('pages.dayClosure.closeCardTitle')}</CardTitle>
          <CardDescription>
            {t('pages.dayClosure.closeCardDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="physicalCash"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('pages.dayClosure.physicalCashLabel')}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                          type="number"
                          placeholder={t('common.placeholders.amountZero')}
                          {...field}
                          className="pl-10"
                          disabled={closeMutation.isPending}
                          step="0.01"
                          min="0"
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      {t('pages.dayClosure.physicalCashHint')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchPhysicalCash && !isNaN(parseFloat(watchPhysicalCash)) && (
                <div className="p-4 rounded-lg border bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      {t('pages.dayClosure.summarySystemBalance')}
                    </span>
                    <span className="font-mono">
                      {formatCurrency(systemBalance)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      {t('pages.dayClosure.summaryPhysicalCash')}
                    </span>
                    <span className="font-mono">
                      {formatCurrency(physicalCashValue)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm font-medium">
                      {t('pages.dayClosure.summaryDifference')}
                    </span>
                    <Badge
                      variant={surplusShortage >= 0 ? 'success' : 'destructive'}
                      className="font-mono"
                    >
                      {surplusShortage >= 0 ? '+' : ''}
                      {formatCurrency(surplusShortage)}
                    </Badge>
                  </div>
                </div>
              )}

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('pages.dayClosure.notesLabel')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('pages.dayClosure.notesPlaceholder')}
                        {...field}
                        disabled={closeMutation.isPending}
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>
                      {t('pages.dayClosure.notesHint')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center gap-2 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                <AlertTriangle className="size-5 text-yellow-600 dark:text-yellow-500" />
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>{t('pages.dayClosure.warningLead')}</strong>{' '}
                  {t('pages.dayClosure.warningHtml')}
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={closeMutation.isPending}
                >
                  {t('common.buttons.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={closeMutation.isPending}
                  variant="destructive"
                >
                  {closeMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      {t('pages.dayClosure.closing')}
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 size-4" />
                      {t('pages.dayClosure.closeSession')}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
