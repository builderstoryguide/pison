'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { apiFetch } from '@/lib/api';
import { buildUrl } from '@/lib/hooks/use-api';
import { formatDateTime, formatCurrency } from '@/lib/helpers';

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
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'calculatedAt', desc: true },
  ]);

  // Fetch commissions and summary by client
  const { data, isLoading } = useQuery<{
    data: CommissionReportRow[];
    summaryByClient: CommissionSummaryByClientRow[];
  }>({
    queryKey: ['report-commissions', period],
    queryFn: async () => {
      const url = buildUrl('/api/reports/commissions', { period: period || undefined });
      const res = await apiFetch(url);
      const json = await res.json();
      return {
        data: json.data ?? [],
        summaryByClient: json.summaryByClient ?? [],
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  const rows = data?.data ?? [];
  const rawSummaryByClient = data?.summaryByClient ?? [];

  // When search filters rows, derive summary from filtered rows so summary matches
  const summaryByClient = useMemo(() => {
    if (!searchQuery) return rawSummaryByClient;
    const byClient = new Map<
      string,
      { clientNumber: string; clientName: string; withdrawalCount: number; totalWithdrawal: number; totalCommission: number }
    >();
    for (const r of filteredRows) {
      const key = `${r.clientNumber}-${r.clientName}`;
      const existing = byClient.get(key);
      if (existing) {
        existing.withdrawalCount += 1;
        existing.totalWithdrawal += r.withdrawalAmount;
        existing.totalCommission += r.commissionAmount;
      } else {
        byClient.set(key, {
          clientNumber: r.clientNumber,
          clientName: r.clientName,
          withdrawalCount: 1,
          totalWithdrawal: r.withdrawalAmount,
          totalCommission: r.commissionAmount,
        });
      }
    }
    return Array.from(byClient.entries()).map(([, agg]) => ({
      clientId: agg.clientNumber,
      clientNumber: agg.clientNumber,
      clientName: agg.clientName,
      withdrawalCount: agg.withdrawalCount,
      totalWithdrawalAmount: agg.totalWithdrawal,
      totalCommission: agg.totalCommission,
    }));
  }, [searchQuery, filteredRows, rawSummaryByClient]);

  // Calculate commissions mutation
  const calculateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch('/api/reports/commissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message || 'Calculation failed');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Commissions calculated successfully');
      queryClient.invalidateQueries({ queryKey: ['report-commissions'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const filteredRows = useMemo(() => {
    if (!rows) return [];
    if (!searchQuery) return rows;
    const q = searchQuery.toLowerCase();
    return rows.filter(
      (r) =>
        r.clientName.toLowerCase().includes(q) ||
        r.clientNumber.toLowerCase().includes(q) ||
        r.transactionNumber.toLowerCase().includes(q),
    );
  }, [rows, searchQuery]);

  const totalCommission = useMemo(
    () => filteredRows.reduce((s, r) => s + r.commissionAmount, 0),
    [filteredRows],
  );

  const totalWithdrawals = useMemo(
    () => filteredRows.reduce((s, r) => s + r.withdrawalAmount, 0),
    [filteredRows],
  );

  const columns = useMemo<ColumnDef<CommissionReportRow>[]>(
    () => [
      {
        accessorKey: 'clientNumber',
        id: 'clientNumber',
        header: ({ column }) => (
          <DataGridColumnHeader title="Client #" visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.clientNumber}</span>
        ),
        size: 100,
        meta: { headerTitle: 'Client #', skeleton: <Skeleton className="w-16 h-5" /> },
        enableSorting: true,
      },
      {
        accessorKey: 'clientName',
        id: 'clientName',
        header: ({ column }) => (
          <DataGridColumnHeader title="Client" visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <span className="font-medium text-sm">{row.original.clientName}</span>
        ),
        size: 180,
        meta: { headerTitle: 'Client', skeleton: <Skeleton className="w-28 h-5" /> },
        enableSorting: true,
      },
      {
        accessorKey: 'transactionNumber',
        id: 'transactionNumber',
        header: ({ column }) => (
          <DataGridColumnHeader title="Transaction" visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.transactionNumber}</span>
        ),
        size: 160,
        meta: { headerTitle: 'Transaction', skeleton: <Skeleton className="w-24 h-5" /> },
        enableSorting: true,
      },
      {
        accessorKey: 'withdrawalAmount',
        id: 'withdrawalAmount',
        header: ({ column }) => (
          <DataGridColumnHeader title="Withdrawal" visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm text-right block">
            {formatCurrency(row.original.withdrawalAmount)}
          </span>
        ),
        size: 140,
        meta: { headerTitle: 'Withdrawal', skeleton: <Skeleton className="w-20 h-5" /> },
        enableSorting: true,
      },
      {
        accessorKey: 'commissionRate',
        id: 'commissionRate',
        header: ({ column }) => (
          <DataGridColumnHeader title="Rate" visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-right block">
            {(row.original.commissionRate * 100).toFixed(1)}%
          </span>
        ),
        size: 80,
        meta: { headerTitle: 'Rate', skeleton: <Skeleton className="w-10 h-5" /> },
        enableSorting: true,
      },
      {
        accessorKey: 'commissionAmount',
        id: 'commissionAmount',
        header: ({ column }) => (
          <DataGridColumnHeader title="Commission" visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm font-medium text-orange-600 text-right block">
            {formatCurrency(row.original.commissionAmount)}
          </span>
        ),
        size: 130,
        meta: { headerTitle: 'Commission', skeleton: <Skeleton className="w-20 h-5" /> },
        enableSorting: true,
      },
      {
        accessorKey: 'period',
        id: 'period',
        header: ({ column }) => (
          <DataGridColumnHeader title="Period" visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-sm">{row.original.period}</span>
        ),
        size: 90,
        meta: { headerTitle: 'Period', skeleton: <Skeleton className="w-16 h-5" /> },
        enableSorting: true,
      },
      {
        accessorKey: 'calculatedAt',
        id: 'calculatedAt',
        header: ({ column }) => (
          <DataGridColumnHeader title="Calculated" visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDateTime(row.original.calculatedAt)}
          </span>
        ),
        size: 180,
        meta: { headerTitle: 'Calculated', skeleton: <Skeleton className="w-28 h-5" /> },
        enableSorting: true,
      },
    ],
    [],
  );

  const [columnOrder, setColumnOrder] = useState<string[]>(
    columns.map((c) => c.id as string),
  );

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

  const DataGridToolbar = () => {
    const [inputValue, setInputValue] = useState(searchQuery);

    return (
      <CardHeader className="flex-col flex-wrap sm:flex-row items-stretch sm:items-center py-5 gap-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-wrap">
          {/* Period picker */}
          <Input
            type="month"
            value={period}
            onChange={(e) => {
              setPeriod(e.target.value);
              setPagination({ ...pagination, pageIndex: 0 });
            }}
            className="w-full sm:w-44"
          />

          {/* Search */}
          <div className="relative">
            <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder={t('pages.reports.searchClient')}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setSearchQuery(inputValue);
                  setPagination({ ...pagination, pageIndex: 0 });
                }
              }}
              className="ps-9 w-full sm:w-48"
            />
            {searchQuery && (
              <Button
                mode="icon"
                variant="dim"
                className="absolute end-1.5 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => {
                  setSearchQuery('');
                  setInputValue('');
                }}
              >
                <X />
              </Button>
            )}
          </div>

          {/* Calculate commissions button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Play className="size-3.5" />
                Calculate Commissions
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Calculate Commissions</AlertDialogTitle>
                <AlertDialogDescription>
                  This will calculate commissions for all completed withdrawal transactions
                  in the period <strong>{period}</strong> and create commission records.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.buttons.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => calculateMutation.mutate()}
                  disabled={calculateMutation.isPending}
                >
                  {calculateMutation.isPending ? 'Calculating...' : 'Calculate'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
    );
  };

  const [summaryExpanded, setSummaryExpanded] = useState(true);

  return (
    <div className="space-y-5">
      {/* Summary */}
      {filteredRows.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Withdrawals</p>
              <p className="text-lg font-semibold font-mono">{formatCurrency(totalWithdrawals)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Commissions</p>
              <p className="text-lg font-semibold font-mono text-orange-600">
                {formatCurrency(totalCommission)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Records</p>
              <p className="text-lg font-semibold font-mono">{filteredRows.length}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Summary by Client */}
      {summaryByClient.length > 0 && (
        <Card>
          <CardHeader
            className="cursor-pointer select-none py-4"
            onClick={() => setSummaryExpanded(!summaryExpanded)}
          >
            <div className="flex items-center gap-2">
              {summaryExpanded ? (
                <ChevronDown className="size-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="size-4 text-muted-foreground" />
              )}
              <Users className="size-4 text-muted-foreground" />
              <span className="font-medium">Summary by Client</span>
              <span className="text-sm text-muted-foreground">
                ({summaryByClient.length} client{summaryByClient.length !== 1 ? 's' : ''})
              </span>
            </div>
          </CardHeader>
          {summaryExpanded && (
            <CardContent className="pt-0">
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left font-medium px-4 py-2">Client #</th>
                      <th className="text-left font-medium px-4 py-2">Client</th>
                      <th className="text-right font-medium px-4 py-2">Withdrawals</th>
                      <th className="text-right font-medium px-4 py-2">Total Withdrawal</th>
                      <th className="text-right font-medium px-4 py-2">Total Commission</th>
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
                        <td className="px-4 py-2 text-right font-mono text-orange-600 font-medium">
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
          <DataGridToolbar />
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
