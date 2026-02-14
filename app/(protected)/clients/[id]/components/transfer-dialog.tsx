'use client';

import { useState } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useTranslation } from '@/hooks/useTranslation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateTransfer } from '@/hooks/queries/use-transactions';
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
  amount: z.coerce.number().positive('Amount must be positive'),
  description: z.string().optional(),
});

type TransferFormData = z.infer<typeof transferSchema>;

interface TransferDialogProps {
  sourceAccountId: string;
  sourceAccountNumber: string;
  clientName: string;
  availableBalance: number;
  clientId: string;
}

interface ClientWithAccount {
  id: string;
  fullName: string;
  clientNumber: string;
  account?: { id: string; accountNumber: string };
}

export default function TransferDialog({
  sourceAccountId,
  sourceAccountNumber,
  clientName,
  availableBalance,
  clientId,
}: TransferDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const createTransfer = useCreateTransfer();

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-active-transfer', clientId],
    queryFn: async () => {
      const response = await apiFetch('/api/clients?status=ACTIVE');
      if (!response.ok) return [];
      const result = await response.json();
      return (result.data || []) as ClientWithAccount[];
    },
    enabled: open,
  });

  const destinationOptions = clients.filter(
    (c) => c.id !== clientId && c.account?.id && c.account.id !== sourceAccountId
  );

  const form = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      destinationAccountId: '',
      amount: 0,
      description: '',
    },
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
          queryClient.invalidateQueries({ queryKey: ['client', clientId] });
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
          {t('pages.clientDetails.transfer')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('pages.clientDetails.transfer')}</DialogTitle>
          <DialogDescription>
            {t('pages.clientDetails.transferDesc', {
              name: clientName,
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
                      {destinationOptions.map((client) => (
                        <SelectItem
                          key={client.id}
                          value={client.account!.id}
                          disabled={client.account!.id === sourceAccountId}
                        >
                          {client.fullName} ({client.account!.accountNumber})
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
