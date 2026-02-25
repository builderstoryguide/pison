'use client';

import { useEffect, useMemo, useState } from 'react';
import { useDebouncedSearch } from '@/hooks/use-debounced-search';
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
import { ChevronRight, DollarSign, Search, X } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/helpers';
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

interface Loan {
  id: string;
  loanNumber: string;
  principalAmount: string;
  totalAmount: string;
  remainingBalance: string;
  status: string;
  client?: {
    fullName: string;
    clientNumber: string;
  };
  createdAt: string;
  maturityDate?: string;
}

interface LoanListProps {
  /** Default status filter: "PENDING" for requests, "active" for repayments, "all" for all */
  defaultStatus?: string | null;
}

const LoanList = ({ defaultStatus = 'all' }: LoanListProps) => {
  const router = useRouter();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [debouncedSearch, setSearchValue, immediateSearch] = useDebouncedSearch('', 300);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(defaultStatus);

  useEffect(() => {
    setSelectedStatus(defaultStatus);
  }, [defaultStatus]);

  // Fetch loans with server-side pagination and search
  const fetchLoans = async (): Promise<{ data: Loan[]; pagination: { total: number } }> => {
    const params = new URLSearchParams();
    if (selectedStatus && selectedStatus !== 'all') {
      params.append('status', selectedStatus);
    }
    params.append('limit', String(pagination.pageSize));
    params.append('offset', String(pagination.pageIndex * pagination.pageSize));
    if (debouncedSearch) {
      params.append('search', debouncedSearch);
    }

    const response = await apiFetch(`/api/loans?${params.toString()}`);

    if (!response.ok) {
      throw new Error('Failed to fetch loans');
    }

    const result = await response.json();
    return {
      data: result.data || [],
      pagination: result.pagination || { total: 0 },
    };
  };

  // Loans query
  const { data: loansResponse, isLoading } = useQuery({
    queryKey: [
      'loans',
      selectedStatus,
      pagination.pageIndex,
      pagination.pageSize,
      debouncedSearch,
    ],
    queryFn: fetchLoans,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const loans = loansResponse?.data ?? [];
  const totalCount = loansResponse?.pagination?.total ?? 0;

  const handleStatusSelection = (status: string) => {
    setSelectedStatus(status);
    setPagination({ ...pagination, pageIndex: 0 });
  };

  const handleRowClick = (row: Loan) => {
    router.push(`/loans/${row.id}`);
  };

  const columns = useMemo<ColumnDef<Loan>[]>(
    () => [
      {
        accessorKey: 'loanNumber',
        id: 'loanNumber',
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Loan"
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => {
          const loan = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-8 rounded-md bg-primary/10">
                <DollarSign className="size-4 text-primary" />
              </div>
              <div className="space-y-px">
                <div className="font-medium text-sm">{loan.loanNumber}</div>
                {loan.client && (
                  <div className="text-muted-foreground text-xs">
                    {loan.client.fullName}
                  </div>
                )}
              </div>
            </div>
          );
        },
        size: 250,
        meta: {
          headerTitle: 'Loan',
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
        accessorKey: 'principalAmount',
        id: 'principalAmount',
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Principal"
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="font-medium">
            {formatCurrency(row.original.principalAmount)}
          </span>
        ),
        size: 150,
        meta: {
          headerTitle: 'Principal',
          skeleton: <Skeleton className="w-20 h-7" />,
        },
        enableSorting: true,
        enableHiding: true,
      },
      {
        accessorKey: 'remainingBalance',
        id: 'remainingBalance',
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Remaining"
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="font-medium">
            {formatCurrency(row.original.remainingBalance)}
          </span>
        ),
        size: 150,
        meta: {
          headerTitle: 'Remaining',
          skeleton: <Skeleton className="w-20 h-7" />,
        },
        enableSorting: true,
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
          const variantMap: Record<string, 'success' | 'secondary' | 'warning' | 'destructive'> = {
            ACTIVE: 'success',
            PENDING: 'warning',
            APPROVED: 'secondary',
            DISBURSED: 'success',
            PAID_OFF: 'success',
            DEFAULTED: 'destructive',
            CANCELLED: 'secondary',
          };
          const variant = variantMap[status] || 'secondary';
          return (
            <Badge variant={variant} appearance="ghost">
              <BadgeDot />
              {status.replace(/_/g, ' ')}
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
    data: loans,
    pageCount: Math.ceil(totalCount / pagination.pageSize) || 1,
    getRowId: (row: Loan) => row.id,
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
    manualPagination: true,
    manualSorting: false,
    manualFiltering: false,
  });

  const DataGridToolbar = () => {
    return (
      <CardHeader className="flex-col flex-wrap sm:flex-row items-stretch sm:items-center py-5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="relative">
            <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search loans..."
              value={immediateSearch}
              onChange={(e) => {
                setSearchValue(e.target.value);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
              onKeyDown={(e) => e.key === 'Enter' && setPagination((p) => ({ ...p, pageIndex: 0 }))}
              disabled={isLoading}
              className="ps-9 w-full sm:w-40 md:w-64"
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
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="active">Active (Disbursed/Active)</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="DISBURSED">Disbursed</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="PAID_OFF">Paid Off</SelectItem>
              <SelectItem value="DEFAULTED">Defaulted</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
    );
  };

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

export default LoanList;
