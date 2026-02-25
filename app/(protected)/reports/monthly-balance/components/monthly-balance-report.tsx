'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
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
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTable } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/api';
import { buildUrl } from '@/lib/hooks/use-api';
import { formatCurrency } from '@/lib/helpers';

interface MonthlyBalanceRow {
  clientId: string;
  clientNumber: string;
  fullName: string;
  areaCode: string;
  areaName: string;
  openingBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalCollections: number;
  totalCommissions: number;
  closingBalance: number;
}

interface Area {
  id: string;
  code: string;
  name: string;
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function MonthlyBalanceReport() {
  const { t } = useTranslation();
  const [month, setMonth] = useState(getCurrentMonth());
  const [areaId, setAreaId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'fullName', desc: false },
  ]);

  // Fetch areas for filter
  const { data: areas } = useQuery<Area[]>({
    queryKey: ['collection-areas-active'],
    queryFn: async () => {
      const res = await apiFetch('/api/collection-areas?status=ACTIVE');
      const json = await res.json();
      return json.data ?? [];
    },
    staleTime: 1000 * 60 * 10,
  });

  // Fetch report data
  const { data: rows, isLoading } = useQuery<MonthlyBalanceRow[]>({
    queryKey: ['report-monthly-balance', month, areaId],
    queryFn: async () => {
      const url = buildUrl('/api/reports/monthly-balance', {
        month,
        areaId: areaId === 'all' ? undefined : areaId,
      });
      const res = await apiFetch(url);
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: !!month,
    staleTime: 1000 * 60 * 5,
  });

  // Filter by search locally
  const filteredRows = useMemo(() => {
    if (!rows) return [];
    if (!searchQuery) return rows;
    const q = searchQuery.toLowerCase();
    return rows.filter(
      (r) =>
        r.fullName.toLowerCase().includes(q) ||
        r.clientNumber.toLowerCase().includes(q) ||
        r.areaName.toLowerCase().includes(q),
    );
  }, [rows, searchQuery]);

  // Summary calculations
  const totals = useMemo(() => {
    if (!filteredRows.length) return null;
    return {
      deposits: filteredRows.reduce((s, r) => s + r.totalDeposits, 0),
      withdrawals: filteredRows.reduce((s, r) => s + r.totalWithdrawals, 0),
      collections: filteredRows.reduce((s, r) => s + r.totalCollections, 0),
      commissions: filteredRows.reduce((s, r) => s + r.totalCommissions, 0),
      closingBalance: filteredRows.reduce((s, r) => s + r.closingBalance, 0),
    };
  }, [filteredRows]);

  const columns = useMemo<ColumnDef<MonthlyBalanceRow>[]>(
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
        accessorKey: 'fullName',
        id: 'fullName',
        header: ({ column }) => (
          <DataGridColumnHeader title="Name" visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <span className="font-medium text-sm">{row.original.fullName}</span>
        ),
        size: 180,
        meta: { headerTitle: 'Name', skeleton: <Skeleton className="w-28 h-5" /> },
        enableSorting: true,
      },
      {
        accessorKey: 'areaName',
        id: 'areaName',
        header: ({ column }) => (
          <DataGridColumnHeader title="Area" visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.areaName}</span>
        ),
        size: 130,
        meta: { headerTitle: 'Area', skeleton: <Skeleton className="w-20 h-5" /> },
        enableSorting: true,
      },
      {
        accessorKey: 'openingBalance',
        id: 'openingBalance',
        header: ({ column }) => (
          <DataGridColumnHeader title="Opening Bal." visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm text-right block">
            {formatCurrency(row.original.openingBalance)}
          </span>
        ),
        size: 140,
        meta: { headerTitle: 'Opening Bal.', skeleton: <Skeleton className="w-20 h-5" /> },
        enableSorting: true,
      },
      {
        accessorKey: 'totalDeposits',
        id: 'totalDeposits',
        header: ({ column }) => (
          <DataGridColumnHeader title="Deposits" visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm text-green-600 text-right block">
            {row.original.totalDeposits > 0
              ? `+${formatCurrency(row.original.totalDeposits)}`
              : '-'}
          </span>
        ),
        size: 130,
        meta: { headerTitle: 'Deposits', skeleton: <Skeleton className="w-20 h-5" /> },
        enableSorting: true,
      },
      {
        accessorKey: 'totalCollections',
        id: 'totalCollections',
        header: ({ column }) => (
          <DataGridColumnHeader title="Collections" visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm text-emerald-600 text-right block">
            {row.original.totalCollections > 0
              ? `+${formatCurrency(row.original.totalCollections)}`
              : '-'}
          </span>
        ),
        size: 130,
        meta: { headerTitle: 'Collections', skeleton: <Skeleton className="w-20 h-5" /> },
        enableSorting: true,
      },
      {
        accessorKey: 'totalWithdrawals',
        id: 'totalWithdrawals',
        header: ({ column }) => (
          <DataGridColumnHeader title="Withdrawals" visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm text-red-600 text-right block">
            {row.original.totalWithdrawals > 0
              ? `-${formatCurrency(row.original.totalWithdrawals)}`
              : '-'}
          </span>
        ),
        size: 130,
        meta: { headerTitle: 'Withdrawals', skeleton: <Skeleton className="w-20 h-5" /> },
        enableSorting: true,
      },
      {
        accessorKey: 'totalCommissions',
        id: 'totalCommissions',
        header: ({ column }) => (
          <DataGridColumnHeader title="Commissions" visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm text-orange-600 text-right block">
            {row.original.totalCommissions > 0
              ? `-${formatCurrency(row.original.totalCommissions)}`
              : '-'}
          </span>
        ),
        size: 130,
        meta: { headerTitle: 'Commissions', skeleton: <Skeleton className="w-20 h-5" /> },
        enableSorting: true,
      },
      {
        accessorKey: 'closingBalance',
        id: 'closingBalance',
        header: ({ column }) => (
          <DataGridColumnHeader title="Closing Bal." visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm font-semibold text-right block">
            {formatCurrency(row.original.closingBalance)}
          </span>
        ),
        size: 140,
        meta: { headerTitle: 'Closing Bal.', skeleton: <Skeleton className="w-24 h-5" /> },
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
    getRowId: (row) => row.clientId,
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
          {/* Month picker */}
          <Input
            type="month"
            value={month}
            onChange={(e) => {
              setMonth(e.target.value);
              setPagination({ ...pagination, pageIndex: 0 });
            }}
            className="w-full sm:w-44"
          />

          {/* Area filter */}
          <Select
            value={areaId}
            onValueChange={(val) => {
              setAreaId(val);
              setPagination({ ...pagination, pageIndex: 0 });
            }}
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder={t('pages.reports.allAreas')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All areas</SelectItem>
              {areas?.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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
              className="ps-9 w-full sm:w-52"
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
        </div>
      </CardHeader>
    );
  };

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      {totals && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <SummaryCard label="Total Deposits" value={formatCurrency(totals.deposits)} className="text-green-600" />
          <SummaryCard label="Total Collections" value={formatCurrency(totals.collections)} className="text-emerald-600" />
          <SummaryCard label="Total Withdrawals" value={formatCurrency(totals.withdrawals)} className="text-red-600" />
          <SummaryCard label="Total Commissions" value={formatCurrency(totals.commissions)} className="text-orange-600" />
          <SummaryCard label="Net Balance" value={formatCurrency(totals.closingBalance)} className="text-primary font-bold" />
        </div>
      )}

      {/* Data Grid */}
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
