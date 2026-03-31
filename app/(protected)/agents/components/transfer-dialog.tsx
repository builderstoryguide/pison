'use client';

import { useState } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useTranslation } from '@/hooks/useTranslation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateTransfer } from '@/hooks/queries/use-transactions';
import { transactionKeys } from '@/hooks/queries/query-keys';
import { apiFetch } from '@/lib/api';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, ArrowRightLeft } from 'lucide-react';

const transferSchema = z.object({
  destinationAccountId: z.string().uuid('Please select a destination account'),
  amount: z
    .number({
      required_error: 'Amount must be positive',
      invalid_type_error: 'Amount must be positive',
    })
    .positive('Amount must be positive'),
  description: z.string().optional(),
});

type TransferFormData = z.infer<typeof transferSchema>;

interface TransferDialogProps {
  agentId: string;
  sourceAccountId: string;
  sourceAccountNumber: string;
  agentName: string;
  availableBalance: number;
}

interface ClientWithAccount {
  id: string;
  fullName: string;
  account?: { id: string; accountNumber: string };
}

interface AgentWithAccount {
  id: string;
  fullName: string;
  agentCode?: string;
  account?: { id: string; accountNumber: string };
}

interface DestinationOption {
  accountId: string;
  label: string;
  type: 'client' | 'collector';
}

export default function TransferDialog({
  agentId,
  sourceAccountId,
  sourceAccountNumber,
  agentName,
  availableBalance,
}: TransferDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const createTransfer = useCreateTransfer();

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-active-transfer-agent', agentId],
    queryFn: async () => {
      const response = await apiFetch('/api/clients?status=ACTIVE');
      if (!response.ok) return [];
      const result = await response.json();
      return (result.data || []) as ClientWithAccount[];
    },
    enabled: open,
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents-active-transfer', agentId],
    queryFn: async () => {
      const response = await apiFetch('/api/agents?status=ACTIVE');
      if (!response.ok) return [];
      const result = await response.json();
      return (result.data || []) as AgentWithAccount[];
    },
    enabled: open,
  });

  const destinationOptions: DestinationOption[] = [
    ...clients
      .filter((c) => c.account?.id && c.account.id !== sourceAccountId)
      .map((c) => ({
        accountId: c.account!.id,
        label: `${t('pages.accounts.client')}: ${c.fullName} (${c.account!.accountNumber})`,
        type: 'client' as const,
      })),
    ...agents
      .filter((a) => a.id !== agentId && a.account?.id && a.account.id !== sourceAccountId)
      .map((a) => ({
        accountId: a.account!.id,
        label: `${t('pages.agents.collectorLabel')}: ${a.fullName} (${a.account!.accountNumber})`,
        type: 'collector' as const,
      })),
  ];

  const form = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      destinationAccountId: '',
      amount: undefined,
      description: '',
    } as TransferFormData,
  });

  const onSubmit = (data: TransferFormData) => {
    createTransfer.mutate(
      {
        sourceAccountId,
        destinationAccountId: data.destinationAccountId,
        amount: data.amount,
        description: data.description || undefined,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
          queryClient.invalidateQueries({ queryKey: ['agents'] });
          queryClient.invalidateQueries({ queryKey: transactionKeys.all });
          toast.success(t('pages.clientDetails.transferSuccess'));
          setOpen(false);
          form.reset();
        },
        onError: (error: Error) => {
          toast.error(error.message || t('pages.clientDetails.transferError'));
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <ArrowRightLeft className="size-4" />
          {t('pages.agents.transferFromAccount')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('pages.agents.transferFromAccount')}</DialogTitle>
          <DialogDescription>
            {t('pages.agents.transferFromAgentDesc', {
              name: agentName,
              account: sourceAccountNumber,
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
              name="destinationAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pages.clientDetails.transferTo')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={createTransfer.isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t('pages.clientDetails.selectDestinationAccount')}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {destinationOptions.map((opt) => (
                        <SelectItem
                          key={opt.accountId}
                          value={opt.accountId}
                          disabled={opt.accountId === sourceAccountId}
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                      {destinationOptions.length === 0 && (
                        <div className="px-2 py-4 text-sm text-muted-foreground">
                          {t('pages.clientDetails.noOtherAccounts')}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                disabled={createTransfer.isPending}
              >
                {t('common.buttons.cancel')}
              </Button>
              <Button type="submit" disabled={createTransfer.isPending}>
                {createTransfer.isPending && (
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
