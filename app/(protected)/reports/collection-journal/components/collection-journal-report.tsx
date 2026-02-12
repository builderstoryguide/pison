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
import { Badge, BadgeDot } from '@/components/ui/badge';
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
import { formatCurrency, formatDateTime } from '@/lib/helpers';

interface CollectionJournalRow {
  transactionNumber: string;
  date: string;
  clientNumber: string;
  clientName: string;
  agentCode: string;
  agentName: string;
  areaCode: string;
  areaName: string;
  amount: number;
  status: string;
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

export default function CollectionJournalReport() {
  const { t } = useTranslation();
  const defaults = getDefaultDates();
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [areaId, setAreaId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'date', desc: true },
  ]);

  // Fetch areas
  const { data: areas } = useQuery<Area[]>({
    queryKey: ['collection-areas-active'],
    queryFn: async () => {
      const res = await apiFetch('/api/collection-areas?status=ACTIVE');
      const json = await res.json();
      return json.data ?? [];
    },
    staleTime: 1000 * 60 * 10,
  });

  // Fetch report
  const { data: rows, isLoading } = useQuery<CollectionJournalRow[]>({
    queryKey: ['report-collection-journal', startDate, endDate, areaId],
    queryFn: async () => {
      const url = buildUrl('/api/reports/collection-journal', {
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
  });

  const filteredRows = useMemo(() => {
    if (!rows) return [];
    if (!searchQuery) return rows;
    const q = searchQuery.toLowerCase();
    return rows.filter(
      (r) =>
        r.clientName.toLowerCase().includes(q) ||
        r.clientNumber.toLowerCase().includes(q) ||
        r.agentName.toLowerCase().includes(q) ||
        r.transactionNumber.toLowerCase().includes(q),
    );
  }, [rows, searchQuery]);

  const totalAmount = useMemo(
    () => filteredRows.reduce((s, r) => s + r.amount, 0),
    [filteredRows],
  );

  const statusVariant = (status: string) => {
    const map: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
      COMPLETED: 'success',
      APPROVED: 'success',
      PENDING_APPROVAL: 'warning',
      REJECTED: 'destructive',
    };
    return map[status] || 'secondary';
  };

  const columns = useMemo<ColumnDef<CollectionJournalRow>[]>(
    () => [
      {
        accessorKey: 'transactionNumber',
        id: 'transactionNumber',
        header: ({ column }) => (
          <DataGridColumnHeader title="Transaction #" visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.transactionNumber}</span>
        ),
        size: 150,
        meta: { headerTitle: 'Transaction #', skeleton: <Skeleton className="w-28 h-5" /> },
        enableSorting: true,
      },
      {
        accessorKey: 'date',
        id: 'date',
        header: ({ column }) => (
          <DataGridColumnHeader title="Date" visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-sm">{formatDateTime(row.original.date)}</span>
        ),
        size: 180,
        meta: { headerTitle: 'Date', skeleton: <Skeleton className="w-32 h-5" /> },
        enableSorting: true,
      },
      {
        accessorKey: 'clientName',
        id: 'clientName',
        header: ({ column }) => (
          <DataGridColumnHeader title="Client" visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <div className="space-y-px">
            <div className="font-medium text-sm">{row.original.clientName}</div>
            <div className="text-muted-foreground text-xs">{row.original.clientNumber}</div>
          </div>
        ),
        size: 180,
        meta: { headerTitle: 'Client', skeleton: <Skeleton className="w-28 h-5" /> },
        enableSorting: true,
      },
      {
        accessorKey: 'agentName',
        id: 'agentName',
        header: ({ column }) => (
          <DataGridColumnHeader title="Agent" visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <div className="space-y-px">
            <div className="text-sm">{row.original.agentName}</div>
            <div className="text-muted-foreground text-xs">{row.original.agentCode}</div>
          </div>
        ),
        size: 160,
        meta: { headerTitle: 'Agent', skeleton: <Skeleton className="w-24 h-5" /> },
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
        accessorKey: 'amount',
        id: 'amount',
        header: ({ column }) => (
          <DataGridColumnHeader title="Amount" visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm font-medium text-green-600 text-right block">
            {formatCurrency(row.original.amount)}
          </span>
        ),
        size: 130,
        meta: { headerTitle: 'Amount', skeleton: <Skeleton className="w-20 h-5" /> },
        enableSorting: true,
      },
      {
        accessorKey: 'status',
        id: 'status',
        header: ({ column }) => (
          <DataGridColumnHeader title="Status" visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <Badge variant={statusVariant(row.original.status)} appearance="ghost">
            <BadgeDot />
            {row.original.status.replace(/_/g, ' ')}
          </Badge>
        ),
        size: 140,
        meta: { headerTitle: 'Status', skeleton: <Skeleton className="w-20 h-5" /> },
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
    getRowId: (row) => row.transactionNumber,
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
          {/* Date range */}
          <Input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPagination({ ...pagination, pageIndex: 0 });
            }}
            className="w-full sm:w-40"
          />
          <span className="text-muted-foreground text-sm self-center hidden sm:inline">to</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPagination({ ...pagination, pageIndex: 0 });
            }}
            className="w-full sm:w-40"
          />

          {/* Area filter */}
          <Select
            value={areaId}
            onValueChange={(val) => {
              setAreaId(val);
              setPagination({ ...pagination, pageIndex: 0 });
            }}
          >
            <SelectTrigger className="w-full sm:w-40">
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
              placeholder={t('pages.reports.search')}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setSearchQuery(inputValue);
                  setPagination({ ...pagination, pageIndex: 0 });
                }
              }}
              className="ps-9 w-full sm:w-44"
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
      {/* Total card */}
      {filteredRows.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Collections</p>
              <p className="text-xl font-semibold font-mono text-green-600">
                {formatCurrency(totalAmount)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Entries</p>
              <p className="text-xl font-semibold font-mono">{filteredRows.length}</p>
            </CardContent>
          </Card>
        </div>
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
