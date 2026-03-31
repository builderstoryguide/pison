'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useApproveTransaction, useRejectTransaction } from '@/hooks/queries/use-transactions';

interface TransactionApprovalActionsProps {
  transactionId: string;
  /** `compact`: smaller controls for dense surfaces (e.g. notification sheet). */
  variant?: 'toolbar' | 'compact';
  /** When false, skip `router.refresh()` on success (React Query still invalidates). */
  refreshRouterOnSuccess?: boolean;
}

export function TransactionApprovalActions({
  transactionId,
  variant = 'toolbar',
  refreshRouterOnSuccess = true,
}: TransactionApprovalActionsProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const idPrefix = useId();
  const approveNotesId = `${idPrefix}-approve-notes`;
  const rejectReasonId = `${idPrefix}-reject-reason`;
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [approveNotes, setApproveNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const approveMutation = useApproveTransaction();
  const rejectMutation = useRejectTransaction();

  const isPending = approveMutation.isPending || rejectMutation.isPending;

  const handleApprove = () => {
    approveMutation.mutate(
      { id: transactionId, notes: approveNotes || undefined },
      {
        onSuccess: () => {
          toast.success(t('pages.validation.transactionApprovedSuccess'));
          setApproveDialogOpen(false);
          setApproveNotes('');
          if (refreshRouterOnSuccess) router.refresh();
        },
        onError: (error: Error) => {
          toast.error(error.message || t('pages.validation.approveFailed'));
        },
      }
    );
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error(t('pages.validation.reasonRequired'));
      return;
    }
    rejectMutation.mutate(
      { id: transactionId, reason: rejectReason },
      {
        onSuccess: () => {
          toast.success(t('pages.validation.transactionRejected'));
          setRejectDialogOpen(false);
          setRejectReason('');
          if (refreshRouterOnSuccess) router.refresh();
        },
        onError: (error: Error) => {
          toast.error(error.message || t('pages.validation.rejectFailed'));
        },
      }
    );
  };

  const isCompact = variant === 'compact';
  const btnSize = isCompact ? 'sm' : 'default';
  const iconClass = isCompact ? 'mr-1.5 size-3.5' : 'mr-2 size-4';

  return (
    <>
      <div
        className={
          isCompact
            ? 'flex w-full flex-wrap items-center justify-end gap-2'
            : 'flex gap-2'
        }
      >
        <Button
          variant="outline"
          size={btnSize}
          onClick={() => setRejectDialogOpen(true)}
          disabled={isPending}
        >
          <XCircle className={iconClass} />
          {t('pages.validation.reject')}
        </Button>
        <Button size={btnSize} onClick={() => setApproveDialogOpen(true)} disabled={isPending}>
          <CheckCircle2 className={iconClass} />
          {t('pages.validation.approve')}
        </Button>
      </div>

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
              <Label htmlFor={approveNotesId}>{t('pages.validation.notesOptional')}</Label>
              <Textarea
                id={approveNotesId}
                placeholder={t('pages.validation.notesPlaceholder')}
                value={approveNotes}
                onChange={(e) => setApproveNotes(e.target.value)}
                rows={3}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApproveDialogOpen(false)}
              disabled={approveMutation.isPending}
            >
              {t('common.buttons.cancel')}
            </Button>
            <Button onClick={handleApprove} disabled={approveMutation.isPending}>
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
              <Label htmlFor={rejectReasonId}>{t('pages.validation.reasonRequiredLabel')}</Label>
              <Textarea
                id={rejectReasonId}
                placeholder={t('pages.validation.reasonPlaceholder')}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="mt-2"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={rejectMutation.isPending}
            >
              {t('common.buttons.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
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
