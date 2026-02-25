'use client';

import { useRef } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/helpers';
import { Printer, Download } from 'lucide-react';

export interface VentilationReceiptData {
  date: string;
  areaName: string;
  areaCode: string;
  agentName: string;
  agentCode: string;
  entries: Array<{
    clientNumber: string;
    clientName: string;
    amount: number;
  }>;
  totalAmount: number;
  transactionCount: number;
}

interface VentilationReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: VentilationReceiptData | null;
}

export function VentilationReceiptDialog({
  open,
  onOpenChange,
  data,
}: VentilationReceiptDialogProps) {
  const { t } = useTranslation();
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!printRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${t('pages.collections.receiptTitle', 'Collection Receipt')}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; }
            h1 { font-size: 18px; margin-bottom: 8px; }
            .meta { color: #666; font-size: 12px; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f5f5f5; }
            .total { font-weight: bold; font-size: 14px; margin-top: 16px; }
            .footer { margin-top: 24px; font-size: 11px; color: #888; }
          </style>
        </head>
        <body>
          ${printRef.current.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  const handleDownload = () => {
    if (!data || !printRef.current) return;
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${t('pages.collections.receiptTitle', 'Collection Receipt')} - ${data.date}</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; }
    h1 { font-size: 18px; margin-bottom: 8px; }
    .meta { color: #666; font-size: 12px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f5f5f5; }
    .total { font-weight: bold; font-size: 14px; margin-top: 16px; }
    .footer { margin-top: 24px; font-size: 11px; color: #888; }
  </style>
</head>
<body>
  ${printRef.current.innerHTML}
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeDate = /^\d{4}-\d{2}-\d{2}/.exec(data.date)?.[0]?.replace(/-/g, '') ?? 'unknown';
    a.download = `collection-receipt-${safeDate}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{t('pages.collections.receiptTitle', 'Collection Receipt')}</DialogTitle>
          <DialogDescription>
            {t('pages.collections.receiptDesc', 'Confirmation receipt for your daily collection submission. You can print or save this for your records.')}
          </DialogDescription>
        </DialogHeader>

        <div ref={printRef} className="space-y-4 text-sm">
          <div>
            <h2 className="font-semibold text-base">
              {t('pages.collections.receiptTitle', 'Collection Receipt')}
            </h2>
            <div className="text-muted-foreground text-xs mt-1 space-y-0.5">
              <p>{t('pages.collections.receiptDate', 'Date')}: {new Date(data.date).toLocaleString()}</p>
              <p>{t('pages.collections.receiptArea', 'Area')}: {data.areaName} ({data.areaCode})</p>
              <p>{t('pages.collections.receiptAgent', 'Agent')}: {data.agentName} ({data.agentCode})</p>
            </div>
          </div>

          <table className="w-full border-collapse border border-border text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="border border-border px-3 py-2 text-left font-medium">
                  {t('pages.collections.receiptClient', 'Client')}
                </th>
                <th className="border border-border px-3 py-2 text-right font-medium">
                  {t('pages.collections.receiptAmount', 'Amount')}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.entries.map((entry, i) => (
                <tr key={i}>
                  <td className="border border-border px-3 py-2">
                    <span className="font-mono text-xs text-muted-foreground">{entry.clientNumber}</span>
                    <span className="ml-2">{entry.clientName}</span>
                  </td>
                  <td className="border border-border px-3 py-2 text-right font-mono">
                    {formatCurrency(entry.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="total flex justify-between items-center pt-2 border-t">
            <span>{t('pages.collections.totalAmount')}</span>
            <span className="font-mono font-semibold">{formatCurrency(data.totalAmount)}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {t('pages.collections.receiptPending', 'These transactions are pending manager approval.')}
          </p>
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={handlePrint} className="gap-2">
            <Printer className="size-4" />
            {t('pages.collections.printReceipt', 'Print')}
          </Button>
          <Button variant="outline" onClick={handleDownload} className="gap-2">
            <Download className="size-4" />
            {t('pages.collections.downloadReceipt', 'Download')}
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            {t('common.buttons.close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
