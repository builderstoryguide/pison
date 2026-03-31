'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoaderCircleIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/helpers';

function toYmd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function MaintenanceFeesReport() {
  const { t } = useTranslation();
  const defaultTo = useMemo(() => new Date(), []);
  const defaultFrom = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d;
  }, []);

  const [from, setFrom] = useState(toYmd(defaultFrom));
  const [to, setTo] = useState(toYmd(defaultTo));
  const [submitted, setSubmitted] = useState({ from: toYmd(defaultFrom), to: toYmd(defaultTo) });

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['report-maintenance-fees', submitted.from, submitted.to],
    queryFn: async () => {
      const params = new URLSearchParams({ from: submitted.from, to: submitted.to });
      const res = await apiFetch(`/api/reports/maintenance-fees?${params}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error?.message || 'Failed to load report');
      }
      return json.data as {
        monthly: { period: string; count: number; total: number }[];
        byAccountNature: { accountNatureName: string; count: number; total: number }[];
        transactionCount: number;
        grandTotal: number;
      };
    },
  });

  const handleApply = () => {
    setSubmitted({ from, to });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('pages.reports.maintenanceFeesReport.filtersTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label htmlFor="mf-from">{t('pages.reports.maintenanceFeesReport.from')}</Label>
            <Input
              id="mf-from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mf-to">{t('pages.reports.maintenanceFeesReport.to')}</Label>
            <Input id="mf-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <Button type="button" onClick={handleApply} disabled={isFetching}>
            {isFetching && <LoaderCircleIcon className="size-4 animate-spin me-2" />}
            {t('pages.reports.maintenanceFeesReport.apply')}
          </Button>
        </CardContent>
      </Card>

      {error ? (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : String(error)}
        </p>
      ) : null}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoaderCircleIcon className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : data ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t('pages.reports.maintenanceFeesReport.summaryTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                {t('pages.reports.maintenanceFeesReport.totalTransactions')}:{' '}
                <strong>{data.transactionCount}</strong>
              </p>
              <p>
                {t('pages.reports.maintenanceFeesReport.grandTotal')}:{' '}
                <strong>{formatCurrency(data.grandTotal)}</strong>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('pages.reports.maintenanceFeesReport.byMonth')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('pages.reports.maintenanceFeesReport.columnPeriod')}</TableHead>
                    <TableHead className="text-end">
                      {t('pages.reports.maintenanceFeesReport.columnCount')}
                    </TableHead>
                    <TableHead className="text-end">
                      {t('pages.reports.maintenanceFeesReport.columnTotal')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.monthly.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-muted-foreground">
                        {t('pages.reports.maintenanceFeesReport.empty')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.monthly.map((row) => (
                      <TableRow key={row.period}>
                        <TableCell>{row.period}</TableCell>
                        <TableCell className="text-end">{row.count}</TableCell>
                        <TableCell className="text-end">{formatCurrency(row.total)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('pages.reports.maintenanceFeesReport.byNature')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('pages.reports.maintenanceFeesReport.columnNature')}</TableHead>
                    <TableHead className="text-end">
                      {t('pages.reports.maintenanceFeesReport.columnCount')}
                    </TableHead>
                    <TableHead className="text-end">
                      {t('pages.reports.maintenanceFeesReport.columnTotal')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.byAccountNature.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-muted-foreground">
                        {t('pages.reports.maintenanceFeesReport.empty')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.byAccountNature.map((row) => (
                      <TableRow key={row.accountNatureName}>
                        <TableCell>{row.accountNatureName}</TableCell>
                        <TableCell className="text-end">{row.count}</TableCell>
                        <TableCell className="text-end">{formatCurrency(row.total)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <p className="text-sm text-muted-foreground">
            {t('pages.reports.maintenanceFeesReport.historyHint')}
          </p>
        </>
      ) : null}
    </div>
  );
}
