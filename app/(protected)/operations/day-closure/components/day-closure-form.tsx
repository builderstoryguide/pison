'use client';

import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

const closureSchema = z.object({
  physicalCash: z.string().min(1, 'Physical cash amount is required'),
  notes: z.string().optional(),
});

type ClosureFormData = z.infer<typeof closureSchema>;

export default function DayClosureForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch current session
  const { data: currentSession, isLoading: isLoadingSession } = useQuery({
    queryKey: ['current-session'],
    queryFn: async () => {
      const response = await apiFetch('/api/operations/session');
      if (!response.ok) {
        throw new Error('Failed to fetch session status');
      }
      const result = await response.json();
      return result.data;
    },
  });

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
        throw new Error(error.error?.message || 'Failed to close session');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-session'] });
      toast.success('Session closed successfully');
      router.push('/operations/session');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to close session');
    },
  });

  const onSubmit = (data: ClosureFormData) => {
    const physicalCash = parseFloat(data.physicalCash);
    if (isNaN(physicalCash) || physicalCash < 0) {
      toast.error('Please enter a valid cash amount');
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

  const sessionData = currentSession || null;
  const isOpen = sessionData?.status === 'OPEN';

  if (!sessionData) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertTriangle className="size-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Active Session</h3>
          <p className="text-muted-foreground mb-4">
            There is no open session to close.
          </p>
          <Button variant="outline" onClick={() => router.push('/operations/session')}>
            View Session Status
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
          <h3 className="text-lg font-semibold mb-2">Session Already Closed</h3>
          <p className="text-muted-foreground mb-4">
            The session for {formatDate(new Date(sessionData.sessionDate))} has already been closed.
          </p>
          <Button variant="outline" onClick={() => router.push('/operations/session')}>
            View Session Status
          </Button>
        </CardContent>
      </Card>
    );
  }

  const watchPhysicalCash = form.watch('physicalCash');
  const physicalCashValue = parseFloat(watchPhysicalCash) || 0;
  
  const systemBalance = sessionData?.systemBalance || 0;
  const surplusShortage = physicalCashValue - systemBalance;

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Session Information</CardTitle>
          <CardDescription>
            Session for {formatDate(new Date(sessionData.sessionDate))}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3 p-4 rounded-lg border">
              <DollarSign className="size-8 text-primary" />
              <div>
                <div className="text-sm text-muted-foreground">System Balance</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(systemBalance)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg border">
              <Calculator className="size-8 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Surplus/Shortage</div>
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
          <CardTitle>Close Daily Session</CardTitle>
          <CardDescription>
            Enter the physical cash count and close the session. This will lock all
            transactions for today.
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
                    <FormLabel>Physical Cash Amount *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          className="pl-10"
                          disabled={closeMutation.isPending}
                          step="0.01"
                          min="0"
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Enter the total physical cash count
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchPhysicalCash && !isNaN(parseFloat(watchPhysicalCash)) && (
                <div className="p-4 rounded-lg border bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">System Balance</span>
                    <span className="font-mono">
                      {formatCurrency(systemBalance)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Physical Cash</span>
                    <span className="font-mono">
                      {formatCurrency(physicalCashValue)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm font-medium">Difference</span>
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
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any notes about the closure..."
                        {...field}
                        disabled={closeMutation.isPending}
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional notes about the day closure
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center gap-2 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                <AlertTriangle className="size-5 text-yellow-600 dark:text-yellow-500" />
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Warning:</strong> Closing the session will lock all transactions
                  for today. This action cannot be undone.
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={closeMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={closeMutation.isPending}
                  variant="destructive"
                >
                  {closeMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Closing...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 size-4" />
                      Close Session
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
