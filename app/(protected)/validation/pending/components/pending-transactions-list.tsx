'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { formatDate, formatDateTime } from '@/lib/helpers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  const queryClient = useQueryClient();
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [approveNotes, setApproveNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  // Fetch pending transactions
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['pending-transactions'],
    queryFn: async () => {
      const response = await apiFetch('/api/transactions/pending');
      if (!response.ok) {
        throw new Error('Failed to fetch pending transactions');
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
        throw new Error(error.error?.message || 'Failed to approve transaction');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Transaction approved successfully');
      setApproveDialogOpen(false);
      setSelectedTransaction(null);
      setApproveNotes('');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to approve transaction');
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
        throw new Error(error.error?.message || 'Failed to reject transaction');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Transaction rejected');
      setRejectDialogOpen(false);
      setSelectedTransaction(null);
      setRejectReason('');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reject transaction');
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
      toast.error('Please provide a reason for rejection');
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'COLLECTION':
      case 'DEPOSIT':
        return <ArrowDown className="size-5 text-green-600" />;
      case 'WITHDRAWAL':
        return <ArrowUp className="size-5 text-red-600" />;
      case 'LOAN_DISBURSEMENT':
        return <DollarSign className="size-5 text-blue-600" />;
      case 'LOAN_REPAYMENT':
        return <CreditCard className="size-5 text-purple-600" />;
      default:
        return <Receipt className="size-5 text-gray-600" />;
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

  if (pendingTransactions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="size-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Pending Transactions</h3>
          <p className="text-muted-foreground">
            All transactions have been reviewed and processed.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {pendingTransactions.map((transaction) => {
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
                        {getTransactionTypeLabel(transaction.type)}
                      </CardTitle>
                      <div className="text-sm text-muted-foreground mt-1">
                        {transaction.transactionNumber}
                      </div>
                    </div>
                  </div>
                  <Badge variant="warning">Pending Approval</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    {transaction.client && (
                      <div className="flex items-center gap-2">
                        <Users className="size-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm text-muted-foreground">Client</div>
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
                          <div className="text-sm text-muted-foreground">Agent</div>
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
                          <div className="text-sm text-muted-foreground">Area</div>
                          <div className="font-medium">
                            {transaction.area.name} ({transaction.area.code})
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div>
                      <div className="text-sm text-muted-foreground">Amount</div>
                      <div
                        className={`text-2xl font-bold ${
                          isCredit ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {isCredit ? '+' : '-'}
                        {new Intl.NumberFormat('fr-FR', {
                          style: 'currency',
                          currency: 'XOF',
                          minimumFractionDigits: 0,
                        }).format(Math.abs(amount))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Balance Before</div>
                        <div className="font-medium">
                          {new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: 'XOF',
                            minimumFractionDigits: 0,
                          }).format(parseFloat(transaction.balanceBefore))}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Balance After</div>
                        <div className="font-medium">
                          {new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: 'XOF',
                            minimumFractionDigits: 0,
                          }).format(parseFloat(transaction.balanceAfter))}
                        </div>
                      </div>
                    </div>

                    {transaction.description && (
                      <div>
                        <div className="text-sm text-muted-foreground">Description</div>
                        <div className="text-sm">{transaction.description}</div>
                      </div>
                    )}

                    <div>
                      <div className="text-sm text-muted-foreground">Created</div>
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
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleApprove(transaction)}
                    disabled={
                      approveMutation.isPending || rejectMutation.isPending
                    }
                  >
                    <CheckCircle2 className="mr-2 size-4" />
                    Approve
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
            <DialogTitle>Approve Transaction</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this transaction? This will update
              the account balance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this approval..."
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
              Cancel
            </Button>
            <Button
              onClick={handleApproveConfirm}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 size-4" />
                  Approve
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
            <DialogTitle>Reject Transaction</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this transaction.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Reason *</Label>
              <Textarea
                id="reason"
                placeholder="Enter the reason for rejection..."
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
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={rejectMutation.isPending || !rejectReason.trim()}
            >
              {rejectMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 size-4" />
                  Reject
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
