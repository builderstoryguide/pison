'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@/hooks/useTranslation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useCreateTransaction,
  isTransactionApiError,
} from '@/hooks/queries/use-transactions';
import { MinBalanceConfirmDialog } from '@/components/min-balance-confirm-dialog';
import { transactionKeys } from '@/hooks/queries/query-keys';
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

type PendingWithdrawal = { amount: number; description?: string };

interface WithdrawalDialogProps {
  agentId: string;
  accountId: string;
  accountNumber: string;
  agentName: string;
  availableBalance: number;
}

export default function WithdrawalDialog({
  agentId,
  accountId,
  accountNumber,
  agentName,
  availableBalance,
}: WithdrawalDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [minBalOpen, setMinBalOpen] = useState(false);
  const [minBalMessage, setMinBalMessage] = useState('');
  const [pendingData, setPendingData] = useState<PendingWithdrawal | null>(null);
  const createTransaction = useCreateTransaction();

  const withdrawalSchema = useMemo(
    () =>
      z.object({
        amount: z
          .number({
            required_error: t('common.validation.amountPositive', 'Amount must be positive'),
            invalid_type_error: t('common.validation.amountPositive', 'Amount must be positive'),
          })
          .positive(t('common.validation.amountPositive', 'Amount must be positive'))
          .max(
            availableBalance,
            t('common.validation.amountExceedsBalance', 'Amount exceeds available balance')
          ),
        description: z.string().optional(),
      }),
    [availableBalance, t]
  );

  type WithdrawalFormData = z.infer<typeof withdrawalSchema>;

  const form = useForm<WithdrawalFormData>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: undefined,
      description: '',
    } as WithdrawalFormData,
  });

  useEffect(() => {
    form.trigger('amount');
    // form is stable from useForm; we only want to re-validate when availableBalance changes
  }, [availableBalance, form]);

  const runSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
    queryClient.invalidateQueries({ queryKey: ['agents'] });
    queryClient.invalidateQueries({ queryKey: transactionKeys.all });
    toast.success(t('pages.clientDetails.withdrawalSuccess'));
    setOpen(false);
    setMinBalOpen(false);
    setPendingData(null);
    form.reset();
  };

  const onSubmit = async (data: WithdrawalFormData) => {
    try {
      await createTransaction.mutateAsync({
        accountId,
        type: 'WITHDRAWAL',
        amount: data.amount,
        description: data.description || undefined,
      });
      runSuccess();
    } catch (e: unknown) {
      if (isTransactionApiError(e) && e.errorCode === 'MIN_BALANCE_WARNING') {
        setPendingData(data);
        setMinBalMessage(e.message);
        setMinBalOpen(true);
        return;
      }
      toast.error(e instanceof Error ? e.message : t('pages.clientDetails.withdrawalError'));
    }
  };

  const confirmMinBalance = async () => {
    if (!pendingData) return;
    try {
      await createTransaction.mutateAsync({
        accountId,
        type: 'WITHDRAWAL',
        amount: pendingData.amount,
        description: pendingData.description || undefined,
        acknowledgeMinBalanceViolation: true,
      });
      runSuccess();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : t('pages.clientDetails.withdrawalError'));
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <TrendingDown className="size-4" />
          {t('pages.agents.withdrawAccount')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('pages.agents.withdrawAccount')}</DialogTitle>
          <DialogDescription>
            {t('pages.agents.withdrawAgentAccountDesc', {
              name: agentName,
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
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const raw = e.target.value;
                        field.onChange(raw === '' ? undefined : Number(raw));
                      }}
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

    <MinBalanceConfirmDialog
      open={minBalOpen}
      onOpenChange={setMinBalOpen}
      message={minBalMessage}
      onConfirm={confirmMinBalance}
      isPending={createTransaction.isPending}
    />
    </>
  );
}
