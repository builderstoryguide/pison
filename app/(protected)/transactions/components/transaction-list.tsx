'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { useDebouncedSearch } from '@/hooks/use-debounced-search';
import { useTransactions } from '@/hooks/queries/use-transactions';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronRight, Search, X, ArrowDown, ArrowUp, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useSessionStatus } from '@/hooks/use-session-status';
import { formatCurrency, formatDateTime } from '@/lib/helpers';
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

interface Transaction {
  id: string;
  transactionNumber: string;
  type: string;
  amount: string;
  status: string;
  createdAt: string;
  client?: {
    fullName: string;
  };
  account?: {
    accountNumber: string;
  };
}

interface TransactionListProps {
  defaultType?: string;
  accountId?: string;
}

const TransactionList = ({ defaultType, accountId }: TransactionListProps) => {
  const router = useRouter();
  const { t } = useTranslation();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'createdAt', desc: true },
  ]);
  const [debouncedSearch, setSearchValue, immediateSearch] = useDebouncedSearch('', 300);
  const [selectedStatus, setSelectedStatus] = useState<string | null>('all');
  const [selectedType, setSelectedType] = useState<string | null>(
    defaultType || 'all'
  );

  // Transactions query with server-side pagination
  const { data: transactionsResponse, isLoading } = useTransactions({
    type: selectedType && selectedType !== 'all' ? selectedType : undefined,
    status: selectedStatus && selectedStatus !== 'all' ? selectedStatus : undefined,
    accountId,
    search: debouncedSearch || undefined,
    limit: pagination.pageSize,
    offset: pagination.pageIndex * pagination.pageSize,
  });

  const transactions = transactionsResponse?.data ?? [];
  const totalCount = transactionsResponse?.pagination?.total ?? 0;

  const handleStatusSelection = (status: string) => {
    setSelectedStatus(status);
    setPagination({ ...pagination, pageIndex: 0 });
  };

  const handleTypeSelection = (type: string) => {
    setSelectedType(type);
    setPagination({ ...pagination, pageIndex: 0 });
  };

  const handleRowClick = (row: Transaction) => {
    router.push(`/transactions/${row.id}`);
  };

  const getTransactionIcon = (type: string) => {
    const isCredit = ['COLLECTION', 'DEPOSIT', 'LOAN_REPAYMENT'].includes(type);
    return isCredit ? (
      <ArrowDown className="size-4 text-green-600" />
    ) : (
      <ArrowUp className="size-4 text-red-600" />
    );
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
        cell: ({ row }) => {
          const transaction = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-8 rounded-md bg-primary/10">
                {getTransactionIcon(transaction.type)}
              </div>
              <div className="space-y-px">
                <div className="font-medium text-sm">
                  {transaction.transactionNumber}
                </div>
                <div className="text-muted-foreground text-xs">
                  {({
                    COLLECTION: t('pages.transactions.typeCollection'),
                    DEPOSIT: t('pages.transactions.typeDeposit'),
                    WITHDRAWAL: t('pages.transactions.typeWithdrawal'),
                    TRANSFER: t('pages.transactions.typeTransfer'),
                    LOAN_REPAYMENT: t('pages.transactions.typeLoanRepayment'),
                    LOAN_DISBURSEMENT: t('pages.transactions.typeLoanDisbursement'),
                  })[transaction.type] || transaction.type}
                </div>
              </div>
            </div>
          );
        },
        size: 250,
        meta: {
          headerTitle: t('pages.transactions.columnTransaction'),
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
        accessorKey: 'amount',
        id: 'amount',
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('pages.transactions.columnAmount')}
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => {
          const amount = parseFloat(row.original.amount);
          const isCredit = ['COLLECTION', 'DEPOSIT', 'LOAN_REPAYMENT'].includes(
            row.original.type,
          );
          return (
            <span
              className={`font-medium ${
                isCredit ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {isCredit ? '+' : '-'}
              {formatCurrency(Math.abs(amount))}
            </span>
          );
        },
        size: 150,
        meta: {
          headerTitle: t('pages.transactions.columnAmount'),
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
            title={t('pages.transactions.columnStatus')}
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => {
          const status = row.original.status;
          const variantMap: Record<string, 'success' | 'secondary' | 'warning' | 'destructive'> = {
            COMPLETED: 'success',
            APPROVED: 'success',
            PENDING_APPROVAL: 'warning',
            REJECTED: 'destructive',
            REVERSED: 'secondary',
          };
          const variant = variantMap[status] || 'secondary';
          const statusLabels: Record<string, string> = {
            COMPLETED: t('pages.transactions.statusCompleted'),
            APPROVED: t('pages.transactions.statusApproved'),
            PENDING_APPROVAL: t('pages.transactions.statusPending'),
            REJECTED: t('pages.transactions.statusRejected'),
          };
          return (
            <Badge variant={variant} appearance="ghost">
              <BadgeDot />
              {statusLabels[status] ?? status.replace(/_/g, ' ')}
            </Badge>
          );
        },
        size: 150,
        meta: {
          headerTitle: t('pages.transactions.columnStatus'),
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
            title={t('pages.transactions.columnDate')}
            visibility={true}
            column={column}
          />
        ),
        cell: (info) => formatDateTime(new Date(info.getValue() as string)),
        size: 175,
        meta: {
          headerTitle: t('pages.transactions.columnDate'),
          skeleton: <Skeleton className="w-24 h-7" />,
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
    [t],
  );

  const [columnOrder, setColumnOrder] = useState<string[]>(
    columns.map((column) => column.id as string),
  );

  const table = useReactTable({
    columns,
    data: transactions,
    pageCount: Math.ceil(totalCount / pagination.pageSize) || 1,
    getRowId: (row: Transaction) => row.id,
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

  const DataGridToolbar = () => (
    <CardHeader className="flex-col flex-wrap sm:flex-row items-stretch sm:items-center py-5">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
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
            onValueChange={handleTypeSelection}
            value={selectedType || 'all'}
            defaultValue="all"
            disabled={isLoading}
          >
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder={t('pages.transactions.filterByType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('pages.transactions.allTypes')}</SelectItem>
              <SelectItem value="COLLECTION">{t('pages.transactions.typeCollection')}</SelectItem>
              <SelectItem value="DEPOSIT">{t('pages.transactions.typeDeposit')}</SelectItem>
              <SelectItem value="WITHDRAWAL">{t('pages.transactions.typeWithdrawal')}</SelectItem>
              <SelectItem value="TRANSFER">{t('pages.transactions.typeTransfer')}</SelectItem>
              <SelectItem value="LOAN_DISBURSEMENT">{t('pages.transactions.typeLoanDisbursement')}</SelectItem>
              <SelectItem value="LOAN_REPAYMENT">{t('pages.transactions.typeLoanRepayment')}</SelectItem>
            </SelectContent>
          </Select>
          <Select
            onValueChange={handleStatusSelection}
            value={selectedStatus || 'all'}
            defaultValue="all"
            disabled={isLoading}
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
        </div>
      </CardHeader>
  );

  const { data: sessionStatus, isLoading: isSessionLoading } = useSessionStatus();
  const isSessionClosed = !isSessionLoading && sessionStatus && !sessionStatus.isOpen;

  return (
    <div className="space-y-4">
      {isSessionClosed && (
        <Alert variant="destructive">
          <Lock className="h-4 w-4" />
          <AlertTitle>{t('pages.transactions.sessionClosed')}</AlertTitle>
          <AlertDescription>
            {t('pages.transactions.sessionClosedDesc')}
          </AlertDescription>
        </Alert>
      )}

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
    </div>
  );
};

export default TransactionList;
