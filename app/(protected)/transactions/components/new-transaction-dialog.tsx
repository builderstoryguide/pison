'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@/hooks/useTranslation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useCreateTransaction,
  useCreateTransfer,
} from '@/hooks/queries/use-transactions';
import { transactionKeys } from '@/hooks/queries/query-keys';
import { apiFetch } from '@/lib/api';
import { formatCurrency } from '@/lib/helpers';
import { useSessionStatus } from '@/hooks/use-session-status';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { Loader2, Plus, Lock } from 'lucide-react';

interface ClientWithAccount {
  id: string;
  fullName: string;
  clientNumber: string;
  account?: { id: string; accountNumber: string; balance: string; availableBalance: string };
}

const depositSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive'),
  description: z.string().optional(),
});

const withdrawalSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive'),
  description: z.string().optional(),
});

const transferSchema = z.object({
  destinationAccountId: z.string().uuid('Please select a destination account'),
  amount: z.coerce.number().positive('Amount must be positive'),
  description: z.string().optional(),
});

type DepositFormData = z.infer<typeof depositSchema>;
type WithdrawalFormData = z.infer<typeof withdrawalSchema>;
type TransferFormData = z.infer<typeof transferSchema>;

interface NewTransactionDialogProps {
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER';
  triggerLabel?: string;
}

export default function NewTransactionDialog({
  type,
  triggerLabel,
}: NewTransactionDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientWithAccount | null>(null);

  const createTransaction = useCreateTransaction();
  const createTransfer = useCreateTransfer();

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-active-accounts'],
    queryFn: async () => {
      const response = await apiFetch('/api/clients?status=ACTIVE');
      if (!response.ok) return [];
      const result = await response.json();
      return (result.data || []) as ClientWithAccount[];
    },
    enabled: open,
  });

  const clientsWithAccounts = clients.filter((c) => c.account?.id);

  const depositForm = useForm<DepositFormData>({
    resolver: zodResolver(depositSchema),
    defaultValues: { amount: 0, description: '' },
  });

  const withdrawalForm = useForm<WithdrawalFormData>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: { amount: 0, description: '' },
  });

  const transferForm = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: { destinationAccountId: '', amount: 0, description: '' },
  });

  const handleClientSelect = (clientId: string) => {
    const client = clientsWithAccounts.find((c) => c.id === clientId);
    setSelectedClient(client || null);
    depositForm.reset();
    withdrawalForm.reset();
    transferForm.reset();
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedClient(null);
    depositForm.reset();
    withdrawalForm.reset();
    transferForm.reset();
  };

  const onDepositSubmit = (data: DepositFormData) => {
    if (!selectedClient?.account) return;
    createTransaction.mutate(
      {
        accountId: selectedClient.account.id,
        type: 'DEPOSIT',
        amount: data.amount,
        description: data.description || undefined,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: transactionKeys.all });
          queryClient.invalidateQueries({ queryKey: ['client', selectedClient.id] });
          toast.success(t('pages.clientDetails.depositSuccess'));
          handleClose();
        },
        onError: (error: Error) => {
          toast.error(error.message || t('pages.clientDetails.depositError'));
        },
      }
    );
  };

  const onWithdrawalSubmit = (data: WithdrawalFormData) => {
    if (!selectedClient?.account) return;
    createTransaction.mutate(
      {
        accountId: selectedClient.account.id,
        type: 'WITHDRAWAL',
        amount: data.amount,
        description: data.description || undefined,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: transactionKeys.all });
          queryClient.invalidateQueries({ queryKey: ['client', selectedClient.id] });
          toast.success(t('pages.clientDetails.withdrawalSuccess'));
          handleClose();
        },
        onError: (error: Error) => {
          toast.error(error.message || t('pages.clientDetails.withdrawalError'));
        },
      }
    );
  };

  const onTransferSubmit = (data: TransferFormData) => {
    if (!selectedClient?.account) return;
    createTransfer.mutate(
      {
        sourceAccountId: selectedClient.account.id,
        destinationAccountId: data.destinationAccountId,
        amount: data.amount,
        description: data.description || undefined,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: transactionKeys.all });
          queryClient.invalidateQueries({ queryKey: ['client', selectedClient.id] });
          toast.success(t('pages.clientDetails.transferSuccess'));
          handleClose();
        },
        onError: (error: Error) => {
          toast.error(error.message || t('pages.clientDetails.transferError'));
        },
      }
    );
  };

  const destinationOptions = clientsWithAccounts.filter(
    (c) => c.id !== selectedClient?.id && c.account?.id !== selectedClient?.account?.id
  );

  const getTitleKey = () => {
    switch (type) {
      case 'DEPOSIT':
        return 'pages.transactions.typeDeposit';
      case 'WITHDRAWAL':
        return 'pages.transactions.typeWithdrawal';
      case 'TRANSFER':
        return 'pages.transactions.typeTransfer';
    }
  };

  const { data: sessionStatus, isLoading: isSessionLoading } = useSessionStatus();
  const isSessionClosed = !isSessionLoading && sessionStatus && !sessionStatus.isOpen;

  const isPending =
    createTransaction.isPending || createTransfer.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : handleClose())}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Plus className="size-4" />
          {triggerLabel ?? t(getTitleKey())}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t(getTitleKey())}</DialogTitle>
          <DialogDescription asChild>
            <div>
              {!selectedClient ? (
                t('pages.loans.selectClient')
              ) : type === 'TRANSFER' ? (
                t('pages.clientDetails.transferDesc', {
                  name: selectedClient.fullName,
                  account: selectedClient.account?.accountNumber ?? '',
                })
              ) : type === 'WITHDRAWAL' ? (
                <>
                  {t('pages.clientDetails.withdrawalDesc', {
                    name: selectedClient.fullName,
                    account: selectedClient.account?.accountNumber ?? '',
                  })}
                  <span className="mt-2 block font-medium text-foreground">
                    {t('pages.clientDetails.availableBalance')}:{' '}
                    {formatCurrency(
                      parseFloat(selectedClient.account?.availableBalance ?? '0')
                    )}
                  </span>
                </>
              ) : (
                t('pages.clientDetails.depositDesc', {
                  name: selectedClient.fullName,
                  account: selectedClient.account?.accountNumber ?? '',
                })
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        {isSessionClosed ? (
          <div className="py-4">
            <Alert variant="destructive">
              <Lock className="h-4 w-4" />
              <AlertTitle>{t('pages.transactions.sessionClosed')}</AlertTitle>
              <AlertDescription>
                {t('pages.transactions.sessionClosedDesc')}
              </AlertDescription>
            </Alert>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={handleClose}>
                {t('common.buttons.close')}
              </Button>
            </DialogFooter>
          </div>
        ) : !selectedClient ? (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('pages.loans.selectClient')}</label>
              <Select onValueChange={handleClientSelect}>
                <SelectTrigger>
                  <SelectValue placeholder={t('common.placeholders.selectClient')} />
                </SelectTrigger>
                <SelectContent>
                  {clientsWithAccounts.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.fullName} ({client.account?.accountNumber})
                    </SelectItem>
                  ))}
                  {clientsWithAccounts.length === 0 && (
                    <div className="px-2 py-4 text-sm text-muted-foreground">
                      {t('pages.transactions.noClientsWithActiveAccounts')}
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                {t('common.buttons.cancel')}
              </Button>
            </DialogFooter>
          </div>
        ) : type === 'DEPOSIT' ? (
          <Form {...depositForm}>
            <form onSubmit={depositForm.handleSubmit(onDepositSubmit)} className="space-y-4">
              <FormField
                control={depositForm.control}
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
                control={depositForm.control}
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
                  onClick={() => setSelectedClient(null)}
                  disabled={isPending}
                >
                  {t('common.buttons.back')}
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                  {t('pages.clientDetails.createRequest')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : type === 'WITHDRAWAL' ? (
          <Form {...withdrawalForm}>
            <form
              onSubmit={withdrawalForm.handleSubmit(onWithdrawalSubmit)}
              className="space-y-4"
            >
              <FormField
                control={withdrawalForm.control}
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
                control={withdrawalForm.control}
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
                  onClick={() => setSelectedClient(null)}
                  disabled={isPending}
                >
                  {t('common.buttons.back')}
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                  {t('pages.clientDetails.createRequest')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <Form {...transferForm}>
            <form
              onSubmit={transferForm.handleSubmit(onTransferSubmit)}
              className="space-y-4"
            >
              <FormField
                control={transferForm.control}
                name="destinationAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('pages.clientDetails.transferTo')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isPending}
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
                            disabled={client.account!.id === selectedClient?.account?.id}
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
                control={transferForm.control}
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
                control={transferForm.control}
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
                  onClick={() => setSelectedClient(null)}
                  disabled={isPending}
                >
                  {t('common.buttons.back')}
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                  {t('pages.clientDetails.createRequest')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
