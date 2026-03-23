'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronDown, ChevronRight, Play, Search, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTable } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import ExportButton from '@/components/common/export-button';
import { apiFetch } from '@/lib/api';
import { buildUrl } from '@/lib/hooks/use-api';
import { formatCurrency, formatDateTime } from '@/lib/helpers';

interface CommissionReportRow {
  commissionId: string;
  clientNumber: string;
  clientName: string;
  transactionNumber: string;
  withdrawalAmount: number;
  commissionRate: number;
  commissionAmount: number;
  period: string;
  calculatedAt: string;
}

interface CommissionSummaryByClientRow {
  clientId: string;
  clientNumber: string;
  clientName: string;
  withdrawalCount: number;
  totalWithdrawalAmount: number;
  totalCommission: number;
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function CommissionReport() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [period, setPeriod] = useState(getCurrentMonth());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [summaryExpanded, setSummaryExpanded] = useState(true);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [sorting, setSorting] = useState<SortingState>([{ id: 'calculatedAt', desc: true }]);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<{
    data: CommissionReportRow[];
    summaryByClient: CommissionSummaryByClientRow[];
  }>({
    queryKey: ['report-commissions', period],
    queryFn: async () => {
      const url = buildUrl('/api/reports/commissions', { period: period || undefined });
      const res = await apiFetch(url);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || t('pages.reports.commissionReport.fetchError'));
      }

      return {
        data: json.data ?? [],
        summaryByClient: json.summaryByClient ?? [],
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  const rows = data?.data ?? [];
  const rawSummaryByClient = data?.summaryByClient ?? [];

  const memoizedData = useMemo(() => {
    const filtered = !searchQuery
      ? rows
      : rows.filter((row) => {
          const q = searchQuery.toLowerCase();
          return (
            row.clientName.toLowerCase().includes(q) ||
            row.clientNumber.toLowerCase().includes(q) ||
            row.transactionNumber.toLowerCase().includes(q)
          );
        });

    const summary = !searchQuery
      ? rawSummaryByClient
      : Array.from(
          filtered.reduce((acc, row) => {
            const key = row.clientNumber;
            const existing = acc.get(key);
            if (existing) {
              existing.withdrawalCount += 1;
              existing.totalWithdrawalAmount += row.withdrawalAmount;
              existing.totalCommission += row.commissionAmount;
            } else {
              acc.set(key, {
                clientId: key,
                clientNumber: row.clientNumber,
                clientName: row.clientName,
                withdrawalCount: 1,
                totalWithdrawalAmount: row.withdrawalAmount,
                totalCommission: row.commissionAmount,
              });
            }
            return acc;
          }, new Map<string, CommissionSummaryByClientRow>()),
        ).map(([, value]) => value);

    const totalCommission = filtered.reduce((sum, row) => sum + row.commissionAmount, 0);
    const totalWithdrawals = filtered.reduce((sum, row) => sum + row.withdrawalAmount, 0);

    return { filteredRows: filtered, summaryByClient: summary, totalCommission, totalWithdrawals };
  }, [rows, searchQuery, rawSummaryByClient]);

  const { filteredRows, summaryByClient, totalCommission, totalWithdrawals } = memoizedData;

  const calculateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch('/api/reports/commissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(
          json.error?.message || t('pages.reports.commissionReport.calculationFailed'),
        );
      }
      return json;
    },
    onSuccess: () => {
      toast.success(t('pages.reports.commissionReport.calculatedSuccess'));
      queryClient.invalidateQueries({ queryKey: ['report-commissions'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const columns = useMemo<ColumnDef<CommissionReportRow>[]>(
    () => [
      {
        accessorKey: 'clientNumber',
        id: 'clientNumber',
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('pages.reports.commissionReport.columns.clientNumber')}
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => <span className="font-mono text-sm">{row.original.clientNumber}</span>,
        size: 110,
        meta: {
          headerTitle: t('pages.reports.commissionReport.columns.clientNumber'),
          skeleton: <Skeleton className="h-5 w-16" />,
        },
        enableSorting: true,
      },
      {
        accessorKey: 'clientName',
        id: 'clientName',
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('pages.reports.commissionReport.columns.clientName')}
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => <span className="text-sm font-medium">{row.original.clientName}</span>,
        size: 190,
        meta: {
          headerTitle: t('pages.reports.commissionReport.columns.clientName'),
          skeleton: <Skeleton className="h-5 w-24" />,
        },
        enableSorting: true,
      },
      {
        accessorKey: 'transactionNumber',
        id: 'transactionNumber',
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('pages.reports.commissionReport.columns.transactionNumber')}
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.transactionNumber}</span>
        ),
        size: 160,
        meta: {
          headerTitle: t('pages.reports.commissionReport.columns.transactionNumber'),
          skeleton: <Skeleton className="h-5 w-24" />,
        },
        enableSorting: true,
      },
      {
        accessorKey: 'withdrawalAmount',
        id: 'withdrawalAmount',
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('pages.reports.commissionReport.columns.withdrawalAmount')}
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="block text-right font-mono text-sm">
            {formatCurrency(row.original.withdrawalAmount)}
          </span>
        ),
        size: 140,
        meta: {
          headerTitle: t('pages.reports.commissionReport.columns.withdrawalAmount'),
          skeleton: <Skeleton className="h-5 w-20" />,
        },
        enableSorting: true,
      },
      {
        accessorKey: 'commissionRate',
        id: 'commissionRate',
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('pages.reports.commissionReport.columns.commissionRate')}
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="block text-right text-sm">
            {(row.original.commissionRate * 100).toFixed(2)}%
          </span>
        ),
        size: 100,
        meta: {
          headerTitle: t('pages.reports.commissionReport.columns.commissionRate'),
          skeleton: <Skeleton className="h-5 w-12" />,
        },
        enableSorting: true,
      },
      {
        accessorKey: 'commissionAmount',
        id: 'commissionAmount',
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('pages.reports.commissionReport.columns.commissionAmount')}
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="block text-right font-mono text-sm font-medium text-orange-600">
            {formatCurrency(row.original.commissionAmount)}
          </span>
        ),
        size: 140,
        meta: {
          headerTitle: t('pages.reports.commissionReport.columns.commissionAmount'),
          skeleton: <Skeleton className="h-5 w-20" />,
        },
        enableSorting: true,
      },
      {
        accessorKey: 'period',
        id: 'period',
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('pages.reports.commissionReport.columns.period')}
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => <span className="text-sm">{row.original.period}</span>,
        size: 100,
        meta: {
          headerTitle: t('pages.reports.commissionReport.columns.period'),
          skeleton: <Skeleton className="h-5 w-16" />,
        },
        enableSorting: true,
      },
      {
        accessorKey: 'calculatedAt',
        id: 'calculatedAt',
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('pages.reports.commissionReport.columns.calculatedAt')}
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDateTime(row.original.calculatedAt)}
          </span>
        ),
        size: 190,
        meta: {
          headerTitle: t('pages.reports.commissionReport.columns.calculatedAt'),
          skeleton: <Skeleton className="h-5 w-28" />,
        },
        enableSorting: true,
      },
    ],
    [t],
  );

  const [columnOrder, setColumnOrder] = useState<string[]>(columns.map((column) => column.id as string));

  const table = useReactTable({
    columns,
    data: filteredRows,
    pageCount: Math.ceil(filteredRows.length / pagination.pageSize),
    getRowId: (row) => row.commissionId,
    state: { pagination, sorting, columnOrder },
    columnResizeMode: 'onChange',
    onColumnOrderChange: setColumnOrder,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: false,
    manualSorting: false,
  });

  return (
    <div className="space-y-5">
      {isError && (
        <Card>
          <CardContent className="py-6">
            <p className="font-medium text-destructive">
              {t('pages.reports.commissionReport.fetchError')}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {error instanceof Error ? error.message : t('common.messages.error')}
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
              {t('pages.reports.commissionReport.retry')}
            </Button>
          </CardContent>
        </Card>
      )}

      {filteredRows.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <p className="mb-1 text-xs text-muted-foreground">
                {t('pages.reports.commissionReport.summary.totalWithdrawals')}
              </p>
              <p className="font-mono text-lg font-semibold">{formatCurrency(totalWithdrawals)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="mb-1 text-xs text-muted-foreground">
                {t('pages.reports.commissionReport.summary.totalCommissions')}
              </p>
              <p className="font-mono text-lg font-semibold text-orange-600">
                {formatCurrency(totalCommission)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="mb-1 text-xs text-muted-foreground">
                {t('pages.reports.commissionReport.summary.records')}
              </p>
              <p className="font-mono text-lg font-semibold">{filteredRows.length}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {summaryByClient.length > 0 && (
        <Card>
          <CardHeader
            className="cursor-pointer select-none py-4"
            onClick={() => setSummaryExpanded((prev) => !prev)}
          >
            <div className="flex items-center gap-2">
              {summaryExpanded ? (
                <ChevronDown className="size-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="size-4 text-muted-foreground" />
              )}
              <Users className="size-4 text-muted-foreground" />
              <span className="font-medium">
                {t('pages.reports.commissionReport.summaryByClient.title')}
              </span>
              <span className="text-sm text-muted-foreground">
                (
                {t('pages.reports.commissionReport.summaryByClient.clientsCount', {
                  count: summaryByClient.length,
                })}
                )
              </span>
            </div>
          </CardHeader>
          {summaryExpanded && (
            <CardContent className="pt-0">
              <div className="overflow-hidden rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-4 py-2 text-left font-medium">
                        {t('pages.reports.commissionReport.summaryByClient.columns.clientNumber')}
                      </th>
                      <th className="px-4 py-2 text-left font-medium">
                        {t('pages.reports.commissionReport.summaryByClient.columns.clientName')}
                      </th>
                      <th className="px-4 py-2 text-right font-medium">
                        {t('pages.reports.commissionReport.summaryByClient.columns.withdrawalCount')}
                      </th>
                      <th className="px-4 py-2 text-right font-medium">
                        {t(
                          'pages.reports.commissionReport.summaryByClient.columns.totalWithdrawalAmount',
                        )}
                      </th>
                      <th className="px-4 py-2 text-right font-medium">
                        {t(
                          'pages.reports.commissionReport.summaryByClient.columns.totalCommission',
                        )}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryByClient.map((row) => (
                      <tr key={row.clientId} className="border-t">
                        <td className="px-4 py-2 font-mono">{row.clientNumber}</td>
                        <td className="px-4 py-2 font-medium">{row.clientName}</td>
                        <td className="px-4 py-2 text-right font-mono">{row.withdrawalCount}</td>
                        <td className="px-4 py-2 text-right font-mono">
                          {formatCurrency(row.totalWithdrawalAmount)}
                        </td>
                        <td className="px-4 py-2 text-right font-mono font-medium text-orange-600">
                          {formatCurrency(row.totalCommission)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {!isLoading && !isError && filteredRows.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="font-medium">{t('pages.reports.commissionReport.emptyTitle')}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('pages.reports.commissionReport.emptyDescription')}
            </p>
          </CardContent>
        </Card>
      )}

      <DataGrid
        table={table}
        recordCount={filteredRows.length}
        isLoading={isLoading}
        tableLayout={{
          columnsResizable: true,
          columnsPinnable: true,
          columnsMovable: true,
          columnsVisibility: true,
        }}
        tableClassNames={{ edgeCell: 'px-5' }}
      >
        <Card>
          <CardHeader className="flex-col flex-wrap items-stretch gap-2.5 py-5 sm:flex-row sm:items-center">
            <div className="flex flex-1 flex-col flex-wrap items-stretch gap-2.5 sm:flex-row sm:items-center">
              <Input
                type="month"
                value={period}
                onChange={(event) => {
                  setPeriod(event.target.value);
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                }}
                className="w-full sm:w-44"
              />

              <div className="relative">
                <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('pages.reports.searchClient')}
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      setSearchQuery(searchInput);
                      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                    }
                  }}
                  className="w-full ps-9 sm:w-56"
                />
                {searchQuery && (
                  <Button
                    mode="icon"
                    variant="dim"
                    className="absolute end-1.5 top-1/2 h-6 w-6 -translate-y-1/2"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchInput('');
                    }}
                  >
                    <X />
                  </Button>
                )}
              </div>

              <ExportButton
                reportType="commissions"
                params={{ period }}
                labelPrefix={t('pages.reports.commissionReport.export')}
              />

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Play className="size-3.5" />
                    {t('pages.reports.commissionReport.calculate')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t('pages.reports.commissionReport.calculateDialog.title')}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('pages.reports.commissionReport.calculateDialog.description', { period })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.buttons.cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => calculateMutation.mutate()}
                      disabled={calculateMutation.isPending}
                    >
                      {calculateMutation.isPending
                        ? t('pages.reports.commissionReport.calculating')
                        : t('pages.reports.commissionReport.calculateConfirm')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardHeader>
          <CardTable>
            <ScrollArea>
              <DataGridTable />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardTable>
          <CardFooter>
            <DataGridPagination />
          </CardFooter>
        </Card>
      </DataGrid>
    </div>
  );
}
