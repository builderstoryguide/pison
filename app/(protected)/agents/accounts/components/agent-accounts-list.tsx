'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { useQuery } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronRight, Search, UserCheck, Wallet, X } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatCurrency } from '@/lib/helpers';
import { Badge, BadgeDot } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

interface AgentAccountRow {
  id: string;
  agentCode: string;
  fullName: string;
  account?: {
    id: string;
    accountNumber: string;
    balance: string;
    availableBalance?: string;
    status: string;
  };
  status: string;
  areaAssignments?: Array<{ area: { code: string; name: string } }>;
}

export default function AgentAccountsList() {
  const router = useRouter();
  const { t } = useTranslation();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>('all');

  const { data: agentsData, isLoading } = useQuery({
    queryKey: ['agents-accounts', selectedStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedStatus && selectedStatus !== 'all') params.append('status', selectedStatus);
      const res = await apiFetch(`/api/agents?${params.toString()}`);
      if (!res.ok) {
        const body = await res.text();
        const msg = body ? (() => { try { return JSON.parse(body).error?.message || body; } catch { return body; } })() : res.statusText;
        throw new Error(`Failed to fetch agents (${res.status}): ${msg}`);
      }
      const json = await res.json();
      return (json.data || []) as AgentAccountRow[];
    },
    staleTime: 1000 * 60 * 2,
  });

  const agents = agentsData || [];
  const filteredAgents = useMemo(() => {
    if (!searchQuery) return agents;
    const q = searchQuery.toLowerCase();
    return agents.filter(
      (a) =>
        a.agentCode.toLowerCase().includes(q) ||
        a.fullName.toLowerCase().includes(q)
    );
  }, [agents, searchQuery]);

  const handleRowClick = (row: AgentAccountRow) => {
    router.push(`/agents/${row.id}`);
  };

  const statusColors: Record<string, 'success' | 'secondary' | 'warning'> = {
    ACTIVE: 'success',
    INACTIVE: 'secondary',
    SUSPENDED: 'warning',
  };

  const columns = useMemo<ColumnDef<AgentAccountRow>[]>(
    () => [
      {
        accessorKey: 'fullName',
        id: 'agent',
        header: ({ column }) => (
          <DataGridColumnHeader title={t('common.labels.agent')} visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const a = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-8 rounded-md bg-primary/10">
                <UserCheck className="size-4 text-primary" />
              </div>
              <div className="space-y-px">
                <div className="font-medium text-sm">{a.fullName}</div>
                <div className="text-muted-foreground text-xs">{a.agentCode}</div>
              </div>
            </div>
          );
        },
        size: 220,
        meta: { headerTitle: t('common.labels.agent'), skeleton: <Skeleton className="h-8 w-40" /> },
      },
      {
        accessorKey: 'account.accountNumber',
        id: 'accountNumber',
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('pages.accounts.accountNumber')}
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => row.original.account?.accountNumber ?? '-',
        size: 140,
        meta: { headerTitle: t('pages.accounts.accountNumber'), skeleton: <Skeleton className="h-6 w-24" /> },
      },
      {
        accessorKey: 'account.balance',
        id: 'balance',
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('pages.accounts.currentBalance')}
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => {
          const account = row.original.account;
          if (!account) return '-';
          const parsed = parseFloat(account.balance);
          const balance = Number.isFinite(parsed) ? parsed : 0;
          return (
            <div className="flex items-center gap-2">
              <Wallet className="size-4 text-muted-foreground" />
              <span className="font-medium">{formatCurrency(balance)}</span>
            </div>
          );
        },
        size: 140,
        meta: { headerTitle: t('pages.accounts.currentBalance'), skeleton: <Skeleton className="h-6 w-20" /> },
      },
      {
        accessorKey: 'account.availableBalance',
        id: 'availableBalance',
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('pages.accounts.availableBalance')}
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => {
          const account = row.original.account;
          if (!account) return '-';
          const parsed = parseFloat(
            String(account.availableBalance ?? account.balance ?? 0)
          );
          const avail = Number.isFinite(parsed) ? parsed : 0;
          return formatCurrency(avail);
        },
        size: 140,
        meta: {
          headerTitle: t('pages.accounts.availableBalance'),
          skeleton: <Skeleton className="h-6 w-20" />,
        },
      },
      {
        accessorKey: 'areaAssignments',
        id: 'areas',
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('menu.collectionAreas')}
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => {
          const areas = row.original.areaAssignments;
          if (!areas?.length) return '-';
          return areas.map((a) => a.area.name || a.area.code).join(', ');
        },
        size: 180,
        meta: {
          headerTitle: t('menu.collectionAreas'),
          skeleton: <Skeleton className="h-6 w-24" />,
        },
      },
      {
        accessorKey: 'status',
        id: 'status',
        header: ({ column }) => (
          <DataGridColumnHeader title={t('common.labels.status')} visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const status = row.original.status;
          const variant = statusColors[status] || 'secondary';
          return (
            <Badge variant={variant} appearance="ghost">
              <BadgeDot />
              {status}
            </Badge>
          );
        },
        size: 110,
        meta: { headerTitle: t('common.labels.status'), skeleton: <Skeleton className="h-6 w-16" /> },
      },
      {
        accessorKey: 'actions',
        header: '',
        cell: () => <ChevronRight className="text-muted-foreground/70 size-3.5" />,
        meta: { skeleton: <Skeleton className="size-4" /> },
        size: 40,
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [t],
  );

  const table = useReactTable({
    columns,
    data: filteredAgents,
    pageCount: Math.ceil(filteredAgents.length / pagination.pageSize) || 1,
    getRowId: (row) => row.id,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: false,
  });

  const toolbarContent = (
    <CardHeader className="flex-col flex-wrap sm:flex-row items-stretch sm:items-center py-5">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-40 md:w-64">
            <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder={t('pages.agents.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9 w-full"
            />
            {searchQuery.length > 0 && (
              <Button
                mode="icon"
                variant="dim"
                className="absolute end-1.5 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => setSearchQuery('')}
              >
                <X />
              </Button>
            )}
          </div>
          <Select
            value={selectedStatus || 'all'}
            onValueChange={(v) => {
              setSelectedStatus(v === 'all' ? null : v);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={t('common.labels.status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.labels.status')}: All</SelectItem>
              <SelectItem value="ACTIVE">ACTIVE</SelectItem>
              <SelectItem value="INACTIVE">INACTIVE</SelectItem>
              <SelectItem value="SUSPENDED">SUSPENDED</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </CardHeader>
  );

  return (
    <DataGrid
      table={table}
      recordCount={filteredAgents.length}
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
        {toolbarContent}
        <CardTable>
          <ScrollArea>
            <DataGridTable table={table} />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardTable>
        <CardFooter className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 py-4">
          <DataGridPagination table={table} />
        </CardFooter>
      </Card>
    </DataGrid>
  );
}
