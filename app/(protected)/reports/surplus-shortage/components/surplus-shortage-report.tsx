'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { AlertTriangle, CheckCircle2, MinusCircle } from 'lucide-react';
import { Alert, AlertContent, AlertDescription, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardFooter, CardHeader, CardTable } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/api';
import { buildUrl } from '@/lib/hooks/use-api';
import { formatDate, formatCurrency } from '@/lib/helpers';
import { useTranslation } from '@/hooks/useTranslation';

interface SurplusShortageRow {
  date: string;
  totalCollections: number;
  totalDeposits: number;
  totalWithdrawals: number;
  systemBalance: number;
  physicalCash: number | null;
  surplusShortage: number;
  closedBy: string | null;
}

function getDefaultDates() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: now.toISOString().slice(0, 10),
  };
}

export default function SurplusShortageReport() {
  const { t } = useTranslation();
  const defaults = getDefaultDates();
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 31,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'date', desc: true },
  ]);

  // Fetch report
  const { data: rows, isLoading } = useQuery<SurplusShortageRow[]>({
    queryKey: ['report-surplus-shortage', startDate, endDate],
    queryFn: async () => {
      const url = buildUrl('/api/reports/surplus-shortage', { startDate, endDate });
      const res = await apiFetch(url);
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: !!startDate && !!endDate,
    staleTime: 1000 * 60 * 5,
  });

  const allRows = rows ?? [];

  // Summary
  const summary = useMemo(() => {
    if (!allRows.length) return null;
    const surplusDays = allRows.filter((r) => r.surplusShortage > 0).length;
    const shortageDays = allRows.filter((r) => r.surplusShortage < 0).length;
    const balancedDays = allRows.filter((r) => r.surplusShortage === 0).length;
    const totalSurplus = allRows
      .filter((r) => r.surplusShortage > 0)
      .reduce((s, r) => s + r.surplusShortage, 0);
    const totalShortage = allRows
      .filter((r) => r.surplusShortage < 0)
      .reduce((s, r) => s + Math.abs(r.surplusShortage), 0);
    const netDifference = allRows.reduce((s, r) => s + r.surplusShortage, 0);

    return {
      surplusDays,
      shortageDays,
      balancedDays,
      totalSurplus,
      totalShortage,
      netDifference,
    };
  }, [allRows]);

  const columns = useMemo<ColumnDef<SurplusShortageRow>[]>(
    () => [
      {
        accessorKey: 'date',
        id: 'date',
        header: ({ column }) => (
          <DataGridColumnHeader title="Date" visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-sm font-medium">{formatDate(row.original.date)}</span>
        ),
        size: 160,
        meta: { headerTitle: 'Date', skeleton: <Skeleton className="w-28 h-5" /> },
        enableSorting: true,
      },
      {
        accessorKey: 'totalCollections',
        id: 'totalCollections',
        header: ({ column }) => (
          <DataGridColumnHeader title="Collections" visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm text-right block">
            {formatCurrency(row.original.totalCollections)}
          </span>
        ),
        size: 130,
        meta: { headerTitle: 'Collections', skeleton: <Skeleton className="w-20 h-5" /> },
        enableSorting: true,
      },
      {
        accessorKey: 'totalDeposits',
        id: 'totalDeposits',
        header: ({ column }) => (
          <DataGridColumnHeader title="Deposits" visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm text-right block">
            {formatCurrency(row.original.totalDeposits)}
          </span>
        ),
        size: 130,
        meta: { headerTitle: 'Deposits', skeleton: <Skeleton className="w-20 h-5" /> },
        enableSorting: true,
      },
      {
        accessorKey: 'totalWithdrawals',
        id: 'totalWithdrawals',
        header: ({ column }) => (
          <DataGridColumnHeader title="Withdrawals" visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm text-right block">
            {formatCurrency(row.original.totalWithdrawals)}
          </span>
        ),
        size: 130,
        meta: { headerTitle: 'Withdrawals', skeleton: <Skeleton className="w-20 h-5" /> },
        enableSorting: true,
      },
      {
        accessorKey: 'systemBalance',
        id: 'systemBalance',
        header: ({ column }) => (
          <DataGridColumnHeader title="System Bal." visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm text-right block">
            {formatCurrency(row.original.systemBalance)}
          </span>
        ),
        size: 140,
        meta: { headerTitle: 'System Bal.', skeleton: <Skeleton className="w-24 h-5" /> },
        enableSorting: true,
      },
      {
        accessorKey: 'physicalCash',
        id: 'physicalCash',
        header: ({ column }) => (
          <DataGridColumnHeader title="Physical Cash" visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm text-right block">
            {row.original.physicalCash != null
              ? formatCurrency(row.original.physicalCash)
              : '-'}
          </span>
        ),
        size: 140,
        meta: { headerTitle: 'Physical Cash', skeleton: <Skeleton className="w-24 h-5" /> },
        enableSorting: true,
      },
      {
        accessorKey: 'surplusShortage',
        id: 'surplusShortage',
        header: ({ column }) => (
          <DataGridColumnHeader title="Surplus / Shortage" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const val = row.original.surplusShortage;
          let color = 'text-muted-foreground';
          let icon = <MinusCircle className="size-3.5" />;
          if (val > 0) {
            color = 'text-green-600';
            icon = <CheckCircle2 className="size-3.5" />;
          } else if (val < 0) {
            color = 'text-red-600';
            icon = <AlertTriangle className="size-3.5" />;
          }
          return (
            <div className={`flex items-center justify-end gap-1.5 ${color}`}>
              {icon}
              <span className="font-mono text-sm font-semibold">
                {val >= 0 ? '+' : ''}{formatCurrency(val)}
              </span>
            </div>
          );
        },
        size: 170,
        meta: { headerTitle: 'Surplus / Shortage', skeleton: <Skeleton className="w-28 h-5" /> },
        enableSorting: true,
      },
      {
        accessorKey: 'closedBy',
        id: 'closedBy',
        header: ({ column }) => (
          <DataGridColumnHeader title="Closed By" visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.closedBy || '-'}
          </span>
        ),
        size: 130,
        meta: { headerTitle: 'Closed By', skeleton: <Skeleton className="w-20 h-5" /> },
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
    data: allRows,
    pageCount: Math.ceil(allRows.length / pagination.pageSize),
    getRowId: (row) => row.date,
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
      {/* Shortage alert banner */}
      {summary && summary.shortageDays > 0 && (
        <Alert variant="destructive" appearance="light">
          <AlertIcon>
            <AlertTriangle />
          </AlertIcon>
          <AlertContent>
            <AlertTitle>{t('pages.reports.surplusShortageAlertTitle')}</AlertTitle>
            <AlertDescription>
              {t('pages.reports.surplusShortageAlertDescription', { count: summary.shortageDays })}
            </AlertDescription>
          </AlertContent>
        </Alert>
      )}

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <SummaryCard label="Days" value={String(allRows.length)} />
          <SummaryCard
            label="Surplus Days"
            value={String(summary.surplusDays)}
            className="text-green-600"
          />
          <SummaryCard
            label="Shortage Days"
            value={String(summary.shortageDays)}
            className="text-red-600"
          />
          <SummaryCard
            label="Balanced"
            value={String(summary.balancedDays)}
          />
          <SummaryCard
            label="Total Surplus"
            value={formatCurrency(summary.totalSurplus)}
            className="text-green-600"
          />
          <SummaryCard
            label="Total Shortage"
            value={formatCurrency(summary.totalShortage)}
            className="text-red-600"
          />
        </div>
      )}

      <DataGrid
        table={table}
        recordCount={allRows.length}
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
          <CardHeader className="flex-col flex-wrap sm:flex-row items-stretch sm:items-center py-5 gap-2.5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-wrap">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full sm:w-40"
              />
              <span className="text-muted-foreground text-sm self-center hidden sm:inline">to</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full sm:w-40"
              />
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

function SummaryCard({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className={`text-lg font-semibold font-mono ${className ?? ''}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
