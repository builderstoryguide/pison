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
import { MapPin, TrendingUp, Users } from 'lucide-react';
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

interface AreaStatisticsRow {
  areaId: string;
  areaCode: string;
  areaName: string;
  clientCount: number;
  agentCount: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalCollections: number;
  transactionCount: number;
  netBalance: number;
}

interface Area {
  id: string;
  code: string;
  name: string;
}

function getDefaultDates() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: now.toISOString().slice(0, 10),
  };
}

export default function AreaStatisticsReport() {
  const { t } = useTranslation();
  const defaults = getDefaultDates();
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [areaId, setAreaId] = useState<string>('all');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'areaName', desc: false },
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
    refetchInterval: false,
  });

  // Fetch report
  const { data: rows, isLoading } = useQuery<AreaStatisticsRow[]>({
    queryKey: ['report-area-statistics', startDate, endDate, areaId],
    queryFn: async () => {
      const url = buildUrl('/api/reports/area-statistics', {
        startDate,
        endDate,
        areaId: areaId === 'all' ? undefined : areaId,
      });
      const res = await apiFetch(url);
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: !!startDate && !!endDate,
    staleTime: 1000 * 60 * 5,
    refetchInterval: false,
  });

  const allRows = rows ?? [];

  // Grand totals
  const grandTotals = useMemo(() => {
    return {
      totalClients: allRows.reduce((s, r) => s + r.clientCount, 0),
      totalAgents: allRows.reduce((s, r) => s + r.agentCount, 0),
      totalCollections: allRows.reduce((s, r) => s + r.totalCollections, 0),
      totalDeposits: allRows.reduce((s, r) => s + r.totalDeposits, 0),
      totalWithdrawals: allRows.reduce((s, r) => s + r.totalWithdrawals, 0),
      totalTransactions: allRows.reduce((s, r) => s + r.transactionCount, 0),
      totalNet: allRows.reduce((s, r) => s + r.netBalance, 0),
    };
  }, [allRows]);

  const columns = useMemo<ColumnDef<AreaStatisticsRow>[]>(
    () => [
      {
        accessorKey: 'areaCode',
        id: 'areaCode',
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('pages.reports.areaStatisticsReport.columns.code')}
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm font-medium">{row.original.areaCode}</span>
        ),
        size: 90,
        meta: {
          headerTitle: t('pages.reports.areaStatisticsReport.columns.code'),
          skeleton: <Skeleton className="w-12 h-5" />,
        },
        enableSorting: true,
      },
      {
        accessorKey: 'areaName',
        id: 'areaName',
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('pages.reports.areaStatisticsReport.columns.area')}
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-muted-foreground" />
            <span className="font-medium text-sm">{row.original.areaName}</span>
          </div>
        ),
        size: 180,
        meta: {
          headerTitle: t('pages.reports.areaStatisticsReport.columns.area'),
          skeleton: <Skeleton className="w-28 h-5" />,
        },
        enableSorting: true,
      },
      {
        accessorKey: 'clientCount',
        id: 'clientCount',
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('pages.reports.areaStatisticsReport.columns.clients')}
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-right block">{row.original.clientCount}</span>
        ),
        size: 80,
        meta: {
          headerTitle: t('pages.reports.areaStatisticsReport.columns.clients'),
          skeleton: <Skeleton className="w-8 h-5" />,
        },
        enableSorting: true,
      },
      {
        accessorKey: 'agentCount',
        id: 'agentCount',
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('pages.reports.areaStatisticsReport.columns.agents')}
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-right block">{row.original.agentCount}</span>
        ),
        size: 80,
        meta: {
          headerTitle: t('pages.reports.areaStatisticsReport.columns.agents'),
          skeleton: <Skeleton className="w-8 h-5" />,
        },
        enableSorting: true,
      },
      {
        accessorKey: 'totalCollections',
        id: 'totalCollections',
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('pages.reports.areaStatisticsReport.columns.collections')}
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm text-emerald-600 text-right block">
            {formatCurrency(row.original.totalCollections)}
          </span>
        ),
        size: 140,
        meta: {
          headerTitle: t('pages.reports.areaStatisticsReport.columns.collections'),
          skeleton: <Skeleton className="w-20 h-5" />,
        },
        enableSorting: true,
      },
      {
        accessorKey: 'totalDeposits',
        id: 'totalDeposits',
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('pages.reports.areaStatisticsReport.columns.deposits')}
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm text-green-600 text-right block">
            {formatCurrency(row.original.totalDeposits)}
          </span>
        ),
        size: 130,
        meta: {
          headerTitle: t('pages.reports.areaStatisticsReport.columns.deposits'),
          skeleton: <Skeleton className="w-20 h-5" />,
        },
        enableSorting: true,
      },
      {
        accessorKey: 'totalWithdrawals',
        id: 'totalWithdrawals',
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('pages.reports.areaStatisticsReport.columns.withdrawals')}
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm text-red-600 text-right block">
            {formatCurrency(row.original.totalWithdrawals)}
          </span>
        ),
        size: 130,
        meta: {
          headerTitle: t('pages.reports.areaStatisticsReport.columns.withdrawals'),
          skeleton: <Skeleton className="w-20 h-5" />,
        },
        enableSorting: true,
      },
      {
        accessorKey: 'transactionCount',
        id: 'transactionCount',
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('pages.reports.areaStatisticsReport.columns.transactions')}
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-right block">{row.original.transactionCount}</span>
        ),
        size: 70,
        meta: {
          headerTitle: t('pages.reports.areaStatisticsReport.columns.transactions'),
          skeleton: <Skeleton className="w-8 h-5" />,
        },
        enableSorting: true,
      },
      {
        accessorKey: 'netBalance',
        id: 'netBalance',
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('pages.reports.areaStatisticsReport.columns.netBalance')}
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => {
          const net = row.original.netBalance;
          return (
            <span
              className={`font-mono text-sm font-semibold text-right block ${
                net >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {net >= 0 ? '+' : ''}{formatCurrency(net)}
            </span>
          );
        },
        size: 140,
        meta: {
          headerTitle: t('pages.reports.areaStatisticsReport.columns.netBalance'),
          skeleton: <Skeleton className="w-24 h-5" />,
        },
        enableSorting: true,
      },
    ],
    [t],
  );

  const [columnOrder, setColumnOrder] = useState<string[]>(
    columns.map((c) => c.id as string),
  );

  const table = useReactTable({
    columns,
    data: allRows,
    pageCount: Math.ceil(allRows.length / pagination.pageSize),
    getRowId: (row) => row.areaId,
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
      {/* Summary row */}
      {allRows.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard
            icon={MapPin}
            label="Areas"
            value={String(allRows.length)}
          />
          <SummaryCard
            icon={Users}
            label="Total Clients"
            value={String(grandTotals.totalClients)}
          />
          <SummaryCard
            icon={TrendingUp}
            label="Total Collections"
            value={formatCurrency(grandTotals.totalCollections)}
            className="text-emerald-600"
          />
          <SummaryCard
            icon={TrendingUp}
            label="Net Balance"
            value={formatCurrency(grandTotals.totalNet)}
            className={grandTotals.totalNet >= 0 ? 'text-green-600' : 'text-red-600'}
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
              <Select
                value={areaId}
                onValueChange={setAreaId}
              >
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder={t('pages.reports.allAreas')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t('pages.collectionAreas.allAreas')}
                  </SelectItem>
                  {areas?.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <Icon className="size-5 text-muted-foreground" />
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={`text-lg font-semibold font-mono ${className ?? ''}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
