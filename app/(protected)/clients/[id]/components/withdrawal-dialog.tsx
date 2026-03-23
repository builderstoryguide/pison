'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@/hooks/useTranslation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateTransaction } from '@/hooks/queries/use-transactions';
import { formatCurrency } from '@/lib/helpers';
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, TrendingDown } from 'lucide-react';

const withdrawalSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive'),
  description: z.string().optional(),
});

type WithdrawalFormData = z.infer<typeof withdrawalSchema>;

interface WithdrawalDialogProps {
  accountId: string;
  accountNumber: string;
  clientName: string;
  availableBalance: number;
  clientId?: string;
}

export default function WithdrawalDialog({
  accountId,
  accountNumber,
  clientName,
  availableBalance,
  clientId,
}: WithdrawalDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const createTransaction = useCreateTransaction();

  const form = useForm<WithdrawalFormData>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: 0,
      description: '',
    },
  });

  const onSubmit = (data: WithdrawalFormData) => {
    createTransaction.mutate(
      {
        accountId,
        type: 'WITHDRAWAL',
        amount: data.amount,
        description: data.description || undefined,
      },
      {
        onSuccess: () => {
          if (clientId) {
            queryClient.invalidateQueries({ queryKey: ['client', clientId] });
          }
          toast.success(t('pages.clientDetails.withdrawalSuccess'));
          setOpen(false);
          form.reset();
        },
        onError: (error: Error) => {
          toast.error(error.message || t('pages.clientDetails.withdrawalError'));
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <TrendingDown className="size-4" />
          {t('pages.clientDetails.withdrawal')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('pages.clientDetails.withdrawal')}</DialogTitle>
          <DialogDescription>
            {t('pages.clientDetails.withdrawalDesc', {
              name: clientName,
              account: accountNumber,
            })}
            <span className="mt-2 block font-medium text-foreground">
              {t('pages.clientDetails.availableBalance')}:{' '}
              {formatCurrency(availableBalance)}
            </span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pages.agents.amountXof')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder={t('common.placeholders.amount')}
                      min="0"
                      step="100"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.labels.description')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('pages.clientDetails.descriptionOptional')}
                      className="resize-none"
                      rows={2}
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
                disabled={createTransaction.isPending}
              >
                {t('common.buttons.cancel')}
              </Button>
              <Button type="submit" disabled={createTransaction.isPending}>
                {createTransaction.isPending && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                {t('pages.clientDetails.createRequest')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
