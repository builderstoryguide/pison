'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { useDebouncedSearch } from '@/hooks/use-debounced-search';
import { useTransactions } from '@/hooks/queries/use-transactions';
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
import { ChevronRight, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge, BadgeDot } from '@/components/ui/badge';
import { Card, CardFooter, CardHeader, CardTable } from '@/components/ui/card';
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
import { formatCurrency, formatDateTime } from '@/lib/helpers';
import { getTransactionStatusLabel } from '@/lib/i18n/transaction-labels';

interface Transaction {
  id: string;
  transactionNumber: string;
  amount: number | string;
  status: string;
  createdAt: string;
  account?: {
    client?: { clientNumber: string; fullName: string };
  };
  agent?: { agentCode: string; fullName: string };
  area?: { code: string; name: string };
}

interface Agent {
  id: string;
  agentCode: string;
  fullName: string;
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

export default function CollectionRecordsList() {
  const router = useRouter();
  const { t } = useTranslation();
  const defaults = getDefaultDates();
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [agentId, setAgentId] = useState<string>('all');
  const [areaId, setAreaId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [debouncedSearch, setSearchValue, immediateSearch] = useDebouncedSearch('', 300);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'createdAt', desc: true },
  ]);

  const { data: transactionsResponse, isLoading } = useTransactions({
    type: 'COLLECTION',
    status: selectedStatus !== 'all' ? selectedStatus : undefined,
    agentId: agentId !== 'all' ? agentId : undefined,
    areaId: areaId !== 'all' ? areaId : undefined,
    search: debouncedSearch || undefined,
    startDate,
    endDate,
    limit: pagination.pageSize,
    offset: pagination.pageIndex * pagination.pageSize,
  });

  const transactions = transactionsResponse?.data ?? [];
  const totalCount = transactionsResponse?.pagination?.total ?? 0;

  const { data: agents } = useQuery<Agent[]>({
    queryKey: ['agents-active'],
    queryFn: async () => {
      const res = await apiFetch('/api/agents?status=ACTIVE');
      const json = await res.json();
      return json.data ?? [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: areas } = useQuery<Area[]>({
    queryKey: ['collection-areas-active'],
    queryFn: async () => {
      const res = await apiFetch('/api/collection-areas?status=ACTIVE');
      const json = await res.json();
      return json.data ?? [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const handleRowClick = (row: Transaction) => {
    router.push(`/transactions/${row.id}`);
  };

  const statusVariant = (status: string) => {
    const map: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
      COMPLETED: 'success',
      APPROVED: 'success',
      PENDING_APPROVAL: 'warning',
      REJECTED: 'destructive',
      REVERSED: 'secondary',
    };
    return map[status] || 'secondary';
  };

  const columns = useMemo<ColumnDef<Transaction>[]>(
    () => [
      {
        accessorKey: 'transactionNumber',
        id: 'transactionNumber',
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('pages.transactions.columnTransaction')}
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.transactionNumber}</span>
        ),
        size: 150,
        meta: { headerTitle: t('pages.transactions.columnTransaction'), skeleton: <Skeleton className="w-28 h-5" /> },
        enableSorting: true,
      },
      {
        accessorKey: 'createdAt',
        id: 'createdAt',
        header: ({ column }) => (
          <DataGridColumnHeader title={t('pages.transactions.columnDate')} visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-sm">{formatDateTime(row.original.createdAt)}</span>
        ),
        size: 180,
        meta: { headerTitle: t('pages.transactions.columnDate'), skeleton: <Skeleton className="w-32 h-5" /> },
        enableSorting: true,
      },
      {
        accessorKey: 'clientName',
        id: 'clientName',
        header: ({ column }) => (
          <DataGridColumnHeader title={t('common.labels.client')} visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const client = row.original.account?.client;
          return (
            <div className="space-y-px">
              <div className="font-medium text-sm">{client?.fullName ?? '-'}</div>
              <div className="text-muted-foreground text-xs">{client?.clientNumber ?? ''}</div>
            </div>
          );
        },
        size: 180,
        meta: { headerTitle: t('common.labels.client'), skeleton: <Skeleton className="w-28 h-5" /> },
        enableSorting: false,
      },
      {
        accessorKey: 'agentName',
        id: 'agentName',
        header: ({ column }) => (
          <DataGridColumnHeader title={t('common.labels.agent')} visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const agent = row.original.agent;
          return (
            <div className="space-y-px">
              <div className="text-sm">{agent?.fullName ?? '-'}</div>
              <div className="text-muted-foreground text-xs">{agent?.agentCode ?? ''}</div>
            </div>
          );
        },
        size: 160,
        meta: { headerTitle: t('common.labels.agent'), skeleton: <Skeleton className="w-24 h-5" /> },
        enableSorting: false,
      },
      {
        accessorKey: 'areaName',
        id: 'areaName',
        header: ({ column }) => (
          <DataGridColumnHeader title={t('common.labels.collectionArea')} visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.area?.name ?? '-'}
          </span>
        ),
        size: 130,
        meta: { headerTitle: t('common.labels.collectionArea'), skeleton: <Skeleton className="w-20 h-5" /> },
        enableSorting: false,
      },
      {
        accessorKey: 'amount',
        id: 'amount',
        header: ({ column }) => (
          <DataGridColumnHeader title={t('pages.transactions.columnAmount')} visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const rawAmount = row.original.amount;
          const amount = typeof rawAmount === 'string' ? parseFloat(rawAmount) : rawAmount;
          return (
            <span className="font-mono text-sm font-medium text-green-600 text-right block">
              {formatCurrency(amount)}
            </span>
          );
        },
        size: 130,
        meta: { headerTitle: t('pages.transactions.columnAmount'), skeleton: <Skeleton className="w-20 h-5" /> },
        enableSorting: true,
      },
      {
        accessorKey: 'status',
        id: 'status',
        header: ({ column }) => (
          <DataGridColumnHeader title={t('pages.transactions.columnStatus')} visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge variant={statusVariant(status)} appearance="ghost">
              <BadgeDot />
              {getTransactionStatusLabel(status, t)}
            </Badge>
          );
        },
        size: 140,
        meta: { headerTitle: t('pages.transactions.columnStatus'), skeleton: <Skeleton className="w-20 h-5" /> },
        enableSorting: true,
      },
      {
        accessorKey: 'actions',
        header: '',
        cell: () => (
          <ChevronRight className="text-muted-foreground/70 size-3.5" />
        ),
        meta: { skeleton: <Skeleton className="size-4" /> },
        size: 40,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
      },
    ],
    [t],
  );

  const [columnOrder, setColumnOrder] = useState<string[]>(
    columns.map((c) => c.id as string),
  );

  const table = useReactTable({
    columns,
    data: transactions,
    pageCount: Math.ceil(totalCount / pagination.pageSize) || 1,
    getRowId: (row: Transaction) => row.id,
    state: { pagination, sorting, columnOrder },
    columnResizeMode: 'onChange',
    onColumnOrderChange: setColumnOrder,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualSorting: false,
    manualFiltering: false,
  });

  const DataGridToolbar = () => (
    <CardHeader className="flex-col flex-wrap sm:flex-row items-stretch sm:items-center py-5 gap-2.5">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-wrap">
        <Input
          type="date"
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
          className="w-full sm:w-40"
        />
        <span className="text-muted-foreground text-sm self-center hidden sm:inline">to</span>
        <Input
          type="date"
          value={endDate}
          onChange={(e) => {
            setEndDate(e.target.value);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
          className="w-full sm:w-40"
        />
        <Select
          value={agentId}
          onValueChange={(val) => {
            setAgentId(val);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder={t('common.labels.agent')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('pages.collections.allAgents')}</SelectItem>
            {agents?.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.fullName} ({a.agentCode})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={areaId}
          onValueChange={(val) => {
            setAreaId(val);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder={t('pages.reports.allAreas')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('pages.reports.allAreas')}</SelectItem>
            {areas?.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={selectedStatus}
          onValueChange={(val) => {
            setSelectedStatus(val);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
        >
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder={t('pages.transactions.filterByStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('pages.transactions.allStatuses')}</SelectItem>
            <SelectItem value="PENDING_APPROVAL">{t('pages.transactions.statusPending')}</SelectItem>
            <SelectItem value="APPROVED">{t('pages.transactions.statusApproved')}</SelectItem>
            <SelectItem value="COMPLETED">{t('pages.transactions.statusCompleted')}</SelectItem>
            <SelectItem value="REJECTED">{t('pages.transactions.statusRejected')}</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative">
          <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder={t('pages.transactions.searchPlaceholder')}
            value={immediateSearch}
            onChange={(e) => {
              setSearchValue(e.target.value);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
            disabled={isLoading}
            className="ps-9 w-full sm:w-44"
          />
          {immediateSearch.length > 0 && (
            <Button
              mode="icon"
              variant="dim"
              className="absolute end-1.5 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={() => {
                setSearchValue('');
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
            >
              <X />
            </Button>
          )}
        </div>
      </div>
    </CardHeader>
  );

  return (
    <DataGrid
      table={table}
      recordCount={totalCount}
      isLoading={isLoading}
      onRowClick={handleRowClick}
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
  );
}
