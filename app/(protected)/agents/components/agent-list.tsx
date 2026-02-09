'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { ChevronRight, Plus, Search, X, UserCheck, Wallet } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatDate } from '@/lib/helpers';
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
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface Agent {
  id: string;
  agentCode: string;
  fullName: string;
  phone?: string;
  email?: string;
  account?: {
    balance: string;
    accountNumber: string;
  };
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  areaAssignments?: Array<{ area: { code: string; name: string } }>;
}

const AgentList = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>('all');

  // Fetch agents
  const fetchAgents = async (): Promise<Agent[]> => {
    const params = new URLSearchParams();
    if (selectedStatus && selectedStatus !== 'all') {
      params.append('status', selectedStatus);
    }

    const response = await apiFetch(`/api/agents?${params.toString()}`);

    if (!response.ok) {
      throw new Error('Failed to fetch agents');
    }

    const result = await response.json();
    return result.data || [];
  };

  // Agents query
  const { data: agents, isLoading } = useQuery({
    queryKey: ['agents', selectedStatus],
    queryFn: fetchAgents,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Filter agents based on search query
  const filteredAgents = useMemo(() => {
    if (!agents) return [];
    if (!searchQuery) return agents;

    const query = searchQuery.toLowerCase();
    return agents.filter(
      (agent) =>
        agent.agentCode.toLowerCase().includes(query) ||
        agent.fullName.toLowerCase().includes(query) ||
        agent.phone?.toLowerCase().includes(query) ||
        agent.email?.toLowerCase().includes(query),
    );
  }, [agents, searchQuery]);

  const handleStatusSelection = (status: string) => {
    setSelectedStatus(status);
    setPagination({ ...pagination, pageIndex: 0 });
  };

  const handleRowClick = (row: Agent) => {
    router.push(`/agents/${row.id}`);
  };

  // Check if user can create agents
  const roleName = (session?.user?.roleName || '').toLowerCase();
  const canCreate = roleName.includes('admin') || roleName.includes('accountant');

  const columns = useMemo<ColumnDef<Agent>[]>(
    () => [
      {
        accessorKey: 'agentCode',
        id: 'agentCode',
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Agent"
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => {
          const agent = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-8 rounded-md bg-primary/10">
                <UserCheck className="size-4 text-primary" />
              </div>
              <div className="space-y-px">
                <div className="font-medium text-sm">{agent.fullName}</div>
                <div className="text-muted-foreground text-xs">
                  {agent.agentCode}
                </div>
              </div>
            </div>
          );
        },
        size: 250,
        meta: {
          headerTitle: 'Agent',
          skeleton: (
            <div className="flex items-center gap-3">
              <Skeleton className="size-8 rounded-md" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ),
        },
        enableSorting: true,
        enableHiding: false,
      },
      {
        accessorKey: 'account',
        id: 'balance',
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Balance"
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => {
          const account = row.original.account;
          if (!account) return '-';
          const balance = parseFloat(account.balance);
          return (
            <div className="flex items-center gap-2">
              <Wallet className="size-4 text-muted-foreground" />
              <span className="font-medium">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'XOF',
                  minimumFractionDigits: 0,
                }).format(balance)}
              </span>
            </div>
          );
        },
        size: 150,
        meta: {
          headerTitle: 'Balance',
          skeleton: <Skeleton className="w-20 h-7" />,
        },
        enableSorting: false,
        enableHiding: true,
      },
      {
        accessorKey: 'phone',
        id: 'phone',
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Phone"
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => row.original.phone || '-',
        size: 150,
        meta: {
          headerTitle: 'Phone',
          skeleton: <Skeleton className="w-20 h-7" />,
        },
        enableSorting: false,
        enableHiding: true,
      },
      {
        accessorKey: 'status',
        id: 'status',
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Status"
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => {
          const status = row.original.status;
          const variantMap: Record<string, 'success' | 'secondary' | 'warning'> = {
            ACTIVE: 'success',
            INACTIVE: 'secondary',
            SUSPENDED: 'warning',
          };
          const variant = variantMap[status] || 'secondary';
          return (
            <Badge variant={variant} appearance="ghost">
              <BadgeDot />
              {status}
            </Badge>
          );
        },
        size: 125,
        meta: {
          headerTitle: 'Status',
          skeleton: <Skeleton className="w-14 h-7" />,
        },
        enableSorting: true,
        enableHiding: true,
      },
      {
        accessorKey: 'createdAt',
        id: 'createdAt',
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Created"
            visibility={true}
            column={column}
          />
        ),
        cell: (info) => formatDate(new Date(info.getValue() as string)),
        size: 150,
        meta: {
          headerTitle: 'Created',
          skeleton: <Skeleton className="w-20 h-7" />,
        },
        enableSorting: true,
        enableHiding: true,
      },
      {
        accessorKey: 'actions',
        header: '',
        cell: () => (
          <ChevronRight className="text-muted-foreground/70 size-3.5" />
        ),
        meta: {
          skeleton: <Skeleton className="size-4" />,
        },
        size: 40,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
      },
    ],
    [],
  );

  const [columnOrder, setColumnOrder] = useState<string[]>(
    columns.map((column) => column.id as string),
  );

  const table = useReactTable({
    columns,
    data: filteredAgents,
    pageCount: Math.ceil(filteredAgents.length / pagination.pageSize),
    getRowId: (row: Agent) => row.id,
    state: {
      pagination,
      sorting,
      columnOrder,
    },
    columnResizeMode: 'onChange',
    onColumnOrderChange: setColumnOrder,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: false,
    manualSorting: false,
    manualFiltering: false,
  });

  const DataGridToolbar = () => {
    const [inputValue, setInputValue] = useState(searchQuery);

    const handleSearch = () => {
      setSearchQuery(inputValue);
      setPagination({ ...pagination, pageIndex: 0 });
    };

    return (
      <CardHeader className="flex-col flex-wrap sm:flex-row items-stretch sm:items-center py-5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="relative">
            <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search agents..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              disabled={isLoading}
              className="ps-9 w-full sm:w-40 md:w-64"
            />
            {searchQuery.length > 0 && (
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
          <Select
            onValueChange={handleStatusSelection}
            value={selectedStatus || 'all'}
            defaultValue="all"
            disabled={isLoading}
          >
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {canCreate && (
          <div className="flex items-center justify-end">
            <Link href="/agents/new">
              <Button disabled={isLoading}>
                <Plus />
                Add Agent
              </Button>
            </Link>
          </div>
        )}
      </CardHeader>
    );
  };

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
      tableClassNames={{
        edgeCell: 'px-5',
      }}
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
};

export default AgentList;
