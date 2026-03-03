'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { transactionKeys } from '@/hooks/queries/query-keys';
import { useTranslation } from '@/hooks/useTranslation';
import { formatCurrency, formatDateTime } from '@/lib/helpers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  DollarSign,
  CreditCard,
  Receipt,
  ArrowDown,
  ArrowUp,
  Users,
  Calendar,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Transaction {
  id: string;
  transactionNumber: string;
  type: string;
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  status: string;
  description?: string;
  reference?: string | null;
  createdAt: string;
  account?: {
    accountNumber: string;
  };
  client?: {
    fullName: string;
    clientNumber: string;
  };
  agent?: {
    fullName: string;
    agentCode: string;
  };
  area?: {
    name: string;
    code: string;
  };
  creator?: {
    name: string;
  };
}

export default function PendingTransactionsList() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [approveNotes, setApproveNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  // Fetch pending transactions
  const { data: transactions, isLoading } = useQuery({
    queryKey: transactionKeys.pending(),
    queryFn: async () => {
      const response = await apiFetch('/api/transactions/pending');
      if (!response.ok) {
        throw new Error(t('pages.validation.fetchPendingFailed'));
      }
      const result = await response.json();
      return result.data || [];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (data: { id: string; notes?: string }) => {
      const response = await apiFetch(`/api/transactions/${data.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: data.notes }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || t('pages.validation.approveFailed'));
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.pending() });
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      toast.success(t('pages.validation.transactionApprovedSuccess'));
      setApproveDialogOpen(false);
      setSelectedTransaction(null);
      setApproveNotes('');
    },
    onError: (error: Error) => {
      toast.error(error.message || t('pages.validation.approveFailed'));
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async (data: { id: string; reason: string }) => {
      const response = await apiFetch(`/api/transactions/${data.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: data.reason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || t('pages.validation.rejectFailed'));
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.pending() });
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      toast.success(t('pages.validation.transactionRejected'));
      setRejectDialogOpen(false);
      setSelectedTransaction(null);
      setRejectReason('');
    },
    onError: (error: Error) => {
      toast.error(error.message || t('pages.validation.rejectFailed'));
    },
  });

  const handleApprove = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setApproveDialogOpen(true);
  };

  const handleReject = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setRejectDialogOpen(true);
  };

  const handleApproveConfirm = () => {
    if (selectedTransaction) {
      approveMutation.mutate({
        id: selectedTransaction.id,
        notes: approveNotes || undefined,
      });
    }
  };

  const handleRejectConfirm = () => {
    if (selectedTransaction && rejectReason.trim()) {
      rejectMutation.mutate({
        id: selectedTransaction.id,
        reason: rejectReason,
      });
    } else {
      toast.error(t('pages.validation.reasonRequired'));
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'COLLECTION':
      case 'DEPOSIT':
        return <ArrowDown className="size-5 text-green-600" />;
      case 'WITHDRAWAL':
      case 'TRANSFER':
        return <ArrowUp className="size-5 text-red-600" />;
      case 'LOAN_DISBURSEMENT':
        return <DollarSign className="size-5 text-primary" />;
      case 'LOAN_REPAYMENT':
        return <CreditCard className="size-5 text-primary" />;
      default:
        return <Receipt className="size-5 text-foreground" />;
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="space-y-4 py-8">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const pendingTransactions: Transaction[] = transactions || [];

  // Group transfer pairs - show one card per transfer (approving one approves both)
  const isTransferRef = (ref: string | null) => ref?.startsWith('transfer-');
  const transferRefsSeen = new Set<string>();
  const displayTransactions = pendingTransactions.filter((tx) => {
    if (isTransferRef(tx.reference)) {
      if (transferRefsSeen.has(tx.reference!)) return false;
      transferRefsSeen.add(tx.reference!);
    }
    return true;
  });

  if (displayTransactions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="size-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {t('pages.validation.noPendingTransactions')}
          </h3>
          <p className="text-muted-foreground">
            {t('pages.validation.allTransactionsProcessed')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {displayTransactions.map((transaction) => {
          const amount = parseFloat(transaction.amount);
          const isCredit = ['COLLECTION', 'DEPOSIT', 'LOAN_REPAYMENT'].includes(
            transaction.type,
          );

          return (
            <Card key={transaction.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {getTransactionIcon(transaction.type)}
                    <div>
                      <CardTitle className="text-lg">
                        {isTransferRef(transaction.reference)
                          ? t('pages.transactions.typeTransfer')
                          : getTransactionTypeLabel(transaction.type)}
                      </CardTitle>
                      <div className="text-sm text-muted-foreground mt-1">
                        {transaction.transactionNumber}
                      </div>
                    </div>
                  </div>
                  <Badge variant="warning">{t('pages.validation.pendingApproval')}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    {transaction.client && (
                      <div className="flex items-center gap-2">
                        <Users className="size-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm text-muted-foreground">
                            {t('common.labels.client')}
                          </div>
                          <div className="font-medium">
                            {transaction.client.fullName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {transaction.client.clientNumber}
                          </div>
                        </div>
                      </div>
                    )}

                    {transaction.agent && (
                      <div className="flex items-center gap-2">
                        <Users className="size-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm text-muted-foreground">
                            {t('common.labels.agent')}
                          </div>
                          <div className="font-medium">
                            {transaction.agent.fullName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {transaction.agent.agentCode}
                          </div>
                        </div>
                      </div>
                    )}

                    {transaction.area && (
                      <div className="flex items-center gap-2">
                        <Calendar className="size-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm text-muted-foreground">
                            {t('pages.clients.columnArea')}
                          </div>
                          <div className="font-medium">
                            {transaction.area.name} ({transaction.area.code})
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div>
                      <div className="text-sm text-muted-foreground">
                        {t('pages.transactions.columnAmount')}
                      </div>
                      <div
                        className={`text-2xl font-bold ${
                          isCredit ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {isCredit ? '+' : '-'}
                        {formatCurrency(Math.abs(amount))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">
                          {t('pages.validation.balanceBefore')}
                        </div>
                        <div className="font-medium">
                          {formatCurrency(transaction.balanceBefore)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">
                          {t('pages.validation.balanceAfter')}
                        </div>
                        <div className="font-medium">
                          {formatCurrency(transaction.balanceAfter)}
                        </div>
                      </div>
                    </div>

                    {transaction.description && (
                      <div>
                        <div className="text-sm text-muted-foreground">
                          {t('common.labels.description')}
                        </div>
                        <div className="text-sm">{transaction.description}</div>
                      </div>
                    )}

                    <div>
                      <div className="text-sm text-muted-foreground">
                        {t('pages.clients.columnCreated')}
                      </div>
                      <div className="text-sm">
                        {formatDateTime(new Date(transaction.createdAt))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => handleReject(transaction)}
                    disabled={
                      approveMutation.isPending || rejectMutation.isPending
                    }
                  >
                    <XCircle className="mr-2 size-4" />
                    {t('pages.validation.reject')}
                  </Button>
                  <Button
                    onClick={() => handleApprove(transaction)}
                    disabled={
                      approveMutation.isPending || rejectMutation.isPending
                    }
                  >
                    <CheckCircle2 className="mr-2 size-4" />
                    {t('pages.validation.approve')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('pages.validation.approveTransaction')}</DialogTitle>
            <DialogDescription>
              {t('pages.validation.approveConfirm')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">{t('pages.validation.notesOptional')}</Label>
              <Textarea
                id="notes"
                placeholder={t('pages.validation.notesPlaceholder')}
                value={approveNotes}
                onChange={(e) => setApproveNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setApproveDialogOpen(false);
                setApproveNotes('');
              }}
              disabled={approveMutation.isPending}
            >
              {t('common.buttons.cancel')}
            </Button>
            <Button
              onClick={handleApproveConfirm}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {t('pages.validation.approving')}
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 size-4" />
                  {t('pages.validation.approve')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('pages.validation.rejectTransaction')}</DialogTitle>
            <DialogDescription>
              {t('pages.validation.rejectConfirm')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">{t('pages.validation.reasonRequiredLabel')}</Label>
              <Textarea
                id="reason"
                placeholder={t('pages.validation.reasonPlaceholder')}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectReason('');
              }}
              disabled={rejectMutation.isPending}
            >
              {t('common.buttons.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={rejectMutation.isPending || !rejectReason.trim()}
            >
              {rejectMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {t('pages.validation.rejecting')}
                </>
              ) : (
                <>
                  <XCircle className="mr-2 size-4" />
                  {t('pages.validation.reject')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
