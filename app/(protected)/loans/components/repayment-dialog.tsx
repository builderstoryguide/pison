'use client';

import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, PlusCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/helpers';

const repaymentSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive'),
});

type RepaymentFormData = z.infer<typeof repaymentSchema>;

interface RepaymentDialogProps {
  loanId: string;
  loanNumber: string;
  remainingBalance: number;
}

export default function RepaymentDialog({ loanId, loanNumber, remainingBalance }: RepaymentDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<RepaymentFormData>({
    resolver: zodResolver(repaymentSchema),
    defaultValues: {
      amount: 0,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: RepaymentFormData) => {
      const response = await apiFetch(`/api/loans/${loanId}/repayments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to record repayment');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan', loanId] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast.success('Repayment recorded successfully');
      setOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to record repayment');
    },
  });

  const onSubmit = (data: RepaymentFormData) => {
    if (data.amount > remainingBalance) {
      form.setError('amount', {
        type: 'manual',
        message: `Amount cannot exceed remaining balance (${formatCurrency(remainingBalance)})`,
      });
      return;
    }
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <PlusCircle className="size-4" />
          {t('pages.loans.recordRepayment')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('pages.loans.recordRepayment')}</DialogTitle>
          <DialogDescription>
            {t('pages.loans.recordRepaymentDesc', { loanNumber, balance: formatCurrency(remainingBalance) })}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pages.loans.amountXof')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder={t('common.placeholders.amount')}
                      min="0"
                      max={remainingBalance}
                      step="100"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={mutation.isPending}
              >
                {t('common.buttons.cancel')}
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                {t('pages.loans.recordRepayment')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
