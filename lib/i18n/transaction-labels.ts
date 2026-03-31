import type { TFunction } from 'i18next';
import { getTransactionStatusPresentation } from '@/lib/status/presenters';

const TX_TYPE_KEYS: Record<string, string> = {
  COLLECTION: 'pages.transactions.typeCollection',
  DEPOSIT: 'pages.transactions.typeDeposit',
  WITHDRAWAL: 'pages.transactions.typeWithdrawal',
  TRANSFER: 'pages.transactions.typeTransfer',
  LOAN_REPAYMENT: 'pages.transactions.typeLoanRepayment',
  LOAN_DISBURSEMENT: 'pages.transactions.typeLoanDisbursement',
  COMMISSION: 'pages.transactions.typeCommission',
  ADJUSTMENT: 'pages.transactions.typeAdjustment',
  TREASURY_ISSUANCE: 'pages.transactions.typeTreasuryIssuance',
};

export function getTransactionTypeLabel(
  type: string,
  t: TFunction,
  options?: { reference?: string | null },
): string {
  if (options?.reference?.startsWith('transfer-')) {
    return t('pages.transactions.typeTransfer');
  }
  const key = TX_TYPE_KEYS[type];
  if (key) return t(key);
  return type.replace(/_/g, ' ');
}

export function getTransactionStatusLabel(status: string, t: TFunction): string {
  const { labelKey } = getTransactionStatusPresentation(status);
  return t(labelKey);
}
