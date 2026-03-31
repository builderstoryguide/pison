'use client';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';

interface MinBalanceConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: string;
  onConfirm: () => void;
  isPending?: boolean;
}

export function MinBalanceConfirmDialog({
  open,
  onOpenChange,
  message,
  onConfirm,
  isPending,
}: MinBalanceConfirmDialogProps) {
  const { t } = useTranslation();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('pages.transactions.minBalanceWarningTitle', 'Below minimum balance')}
          </AlertDialogTitle>
          <AlertDialogDescription className="whitespace-pre-wrap text-foreground">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {t('common.buttons.cancel')}
          </AlertDialogCancel>
          <Button type="button" onClick={onConfirm} disabled={isPending}>
            {t('pages.transactions.confirmMinBalanceProceed', 'Proceed anyway')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
