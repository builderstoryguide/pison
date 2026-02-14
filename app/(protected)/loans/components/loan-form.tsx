'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/helpers';
import { useTranslation } from '@/hooks/useTranslation';

const loanSchema = z.object({
  clientId: z.string().uuid('Please select a client'),
  principalAmount: z.coerce.number().positive('Amount must be positive'),
  interestRate: z.coerce.number().min(0).max(1, 'Rate must be between 0 and 1'),
  purpose: z.string().optional(),
  maturityDate: z.string().datetime().optional(),
});

type LoanFormData = z.infer<typeof loanSchema>;

interface LoanFormProps {
  loanId?: string;
}

export default function LoanForm({ loanId }: LoanFormProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isEditMode = !!loanId;

  // Fetch clients
  const { data: clientsData } = useQuery({
    queryKey: ['clients-active'],
    queryFn: async () => {
      const response = await apiFetch('/api/clients?status=ACTIVE');
      if (!response.ok) return [];
      const result = await response.json();
      return result.data || [];
    },
  });

  // Fetch loan data if editing
  const { data: loanData, isLoading: isLoadingLoan } = useQuery({
    queryKey: ['loan', loanId],
    queryFn: async () => {
      const response = await apiFetch(`/api/loans/${loanId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch loan');
      }
      const result = await response.json();
      return result.data;
    },
    enabled: isEditMode,
  });

  const form = useForm<LoanFormData>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      clientId: '',
      principalAmount: 0,
      interestRate: 0.15, // Default 15%
      purpose: '',
      maturityDate: undefined,
    },
  });

  // Populate form when loan data is loaded
  useEffect(() => {
    if (loanData) {
      form.reset({
        clientId: loanData.clientId,
        principalAmount: Number(loanData.principalAmount),
        interestRate: Number(loanData.interestRate),
        purpose: loanData.purpose || '',
        maturityDate: loanData.maturityDate ? new Date(loanData.maturityDate).toISOString() : undefined,
      });
    }
  }, [loanData, form]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: LoanFormData) => {
      // Find client to get accountId (Prisma returns accountId; fallback to account.id)
      const client = clientsData?.find((c: any) => c.id === data.clientId);
      if (!client) throw new Error('Client not found');

      const accountId = client.accountId ?? client.account?.id;
      if (!accountId) throw new Error('Client has no account');

      const payload = {
        ...data,
        accountId,
      };

      const response = await apiFetch('/api/loans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create loan request');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast.success('Loan request created successfully');
      router.push('/loans');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create loan request');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: LoanFormData) => {
      const response = await apiFetch(`/api/loans/${loanId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update loan request');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loan', loanId] });
      toast.success('Loan request updated successfully');
      router.push('/loans');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update loan request');
    },
  });

  const onSubmit = (data: LoanFormData) => {
    if (isEditMode) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  if (isEditMode && isLoadingLoan) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // If loan is not pending, show read-only view or message
  if (isEditMode && loanData && loanData.status !== 'PENDING') {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            Only pending loans can be edited. This loan is {loanData.status.toLowerCase()}.
          </p>
          <Button className="mt-4" onClick={() => router.push('/loans')}>
            Back to Loans
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const clients = clientsData || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditMode ? t('pages.loans.editLoanRequest') : t('pages.loans.newLoanRequest')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.labels.client')} *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoading || isEditMode}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('common.placeholders.selectClient')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map((client: any) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.fullName} ({client.clientNumber})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="principalAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('pages.loans.principalAmount')} *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={t('common.placeholders.amount')}
                        min="0"
                        step="100"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="interestRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('pages.loans.interestRate')} *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={t('common.placeholders.interestRate')}
                        min="0"
                        max="1"
                        step="0.01"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                        {field.value ? `${(Number(field.value) * 100).toFixed(1)}%` : '0%'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pages.loans.purpose')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('common.placeholders.reason')}
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                {t('common.buttons.cancel')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                {isEditMode ? t('pages.loans.updateRequest') : t('pages.loans.createRequest')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
