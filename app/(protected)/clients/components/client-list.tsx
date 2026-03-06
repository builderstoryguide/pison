'use client';

import { useMemo, useState } from 'react';
import { useDebouncedSearch } from '@/hooks/use-debounced-search';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronRight, Plus, Search, X, Users, Edit, Trash2, Wallet } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/helpers';
import { Badge, BadgeDot } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTable } from '@/components/ui/card';
import {
  DataGrid,
} from '@/components/ui/data-grid';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import {
  useClients,
  useDeleteClient,
  useCollectionAreas,
  type Client,
  type ClientsResponse,
} from '@/hooks/queries';

interface ClientListProps {
  initialData?: ClientsResponse | null;
}

const ClientList = ({ initialData }: ClientListProps) => {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: session } = useSession();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [debouncedSearch, setSearchValue, immediateSearch] = useDebouncedSearch('', 300);
  const [selectedStatus, setSelectedStatus] = useState<string | null>('all');
  const [selectedArea, setSelectedArea] = useState<string | null>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  // Fetch collection areas for filter
  // Agents see only their assigned areas; others see all active areas
  const roleName = (session?.user?.roleName || '').toLowerCase();
  const isAgent = roleName.includes('agent') || roleName.includes('collector');

  const { data: agentData } = useQuery({
    queryKey: ['me-agent', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const response = await apiFetch('/api/me/agent');
      if (!response.ok) return null;
      const result = await response.json();
      return result.data || null;
    },
    enabled: isAgent && !!session?.user?.id,
  });

  const { data: agentAreasData } = useQuery({
    queryKey: ['agent-areas', agentData?.id],
    queryFn: async () => {
      if (!agentData?.id) return [];
      const response = await apiFetch(
        `/api/collection-areas/assignments?agentId=${agentData.id}`,
      );
      if (!response.ok) return [];
      const result = await response.json();
      return result.data || [];
    },
    enabled: isAgent && !!agentData?.id,
  });

  const { data: allAreasData } = useCollectionAreas({ status: 'ACTIVE' });

  const areasData = isAgent ? agentAreasData : allAreasData;

  // Fetch clients using centralized hook with server-side pagination
  const statusParam = selectedStatus === 'all' || !selectedStatus ? undefined : selectedStatus;
  const areaParam = selectedArea === 'all' || !selectedArea ? undefined : selectedArea;

  const { data: clientsResponse, isLoading } = useClients(
    {
      status: statusParam,
      areaId: areaParam,
      search: debouncedSearch || undefined,
      limit: pagination.pageSize,
      offset: pagination.pageIndex * pagination.pageSize,
    },
    {
      initialData:
        initialData &&
        pagination.pageIndex === 0 &&
        statusParam === undefined &&
        areaParam === undefined &&
        !debouncedSearch
          ? initialData
          : undefined,
    }
  );

  const clients = clientsResponse?.data ?? [];
  const totalCount = clientsResponse?.pagination?.total ?? 0;

  // Delete mutation with optimistic updates
  const deleteMutation = useDeleteClient();

  const handleStatusSelection = (status: string) => {
    setSelectedStatus(status);
    setPagination({ ...pagination, pageIndex: 0 });
  };

  const handleAreaSelection = (areaId: string) => {
    setSelectedArea(areaId);
    setPagination({ ...pagination, pageIndex: 0 });
  };

  const handleRowClick = (row: Client) => {
    router.push(`/clients/${row.id}`);
  };

  const handleDeleteClick = (e: React.MouseEvent, client: Client) => {
    e.stopPropagation();
    setClientToDelete(client);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (clientToDelete) {
      deleteMutation.mutate(clientToDelete.id, {
        onSuccess: () => {
          toast.success(t('pages.clients.clientDeactivatedSuccess'));
          setDeleteDialogOpen(false);
          setClientToDelete(null);
        },
      });
    }
  };

  // Check if user can manage clients (create, edit, delete)
  const canManage = roleName.includes('manager') || roleName.includes('accountant') || roleName.includes('administrator');
  const canCreate = canManage; // Alias for toolbar "Add" button (matches agent-list pattern)

  const columns = useMemo<ColumnDef<Client>[]>(
    () => [
      {
        accessorKey: 'clientNumber',
        id: 'clientNumber',
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('pages.clients.columnClient')}
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => {
          const client = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-8 rounded-md bg-primary/10">
                <Users className="size-4 text-primary" />
              </div>
              <div className="space-y-px">
                <div className="font-medium text-sm">{client.fullName}</div>
                <div className="text-muted-foreground text-xs">
                  {client.clientNumber}
                </div>
              </div>
            </div>
          );
        },
        size: 250,
        meta: {
          headerTitle: t('pages.clients.columnClient'),
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
        accessorKey: 'area',
        id: 'area',
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('pages.clients.columnArea')}
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => {
          const area = row.original.area;
          return area ? (
            <div>
              <div className="text-sm">{area.name}</div>
              <div className="text-xs text-muted-foreground">{area.code}</div>
            </div>
          ) : (
            '-'
          );
        },
        size: 150,
        meta: {
          headerTitle: t('pages.clients.columnArea'),
          skeleton: <Skeleton className="w-20 h-7" />,
        },
        enableSorting: false,
        enableHiding: true,
      },
      {
        accessorKey: 'account',
        id: 'balance',
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('pages.clients.columnBalance')}
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => {
          const account = row.original.account;
          if (!account) return '-';
          return (
            <div className="flex items-center gap-2">
              <Wallet className="size-4 text-muted-foreground" />
              <span className="font-medium">
                {formatCurrency(account.balance)}
              </span>
            </div>
          );
        },
        size: 150,
        meta: {
          headerTitle: t('pages.clients.columnBalance'),
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
            title={t('pages.clients.columnPhone')}
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => row.original.phone || '-',
        size: 150,
        meta: {
          headerTitle: t('pages.clients.columnPhone'),
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
            title={t('pages.clients.columnStatus')}
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => {
          const status = row.original.status;
          const variantMap: Record<string, 'success' | 'secondary' | 'destructive' | 'warning'> = {
            ACTIVE: 'success',
            INACTIVE: 'secondary',
            SUSPENDED: 'warning',
            CLOSED: 'destructive',
          };
          const variant = variantMap[status] || 'secondary';
          const statusLabels: Record<string, string> = {
            ACTIVE: t('status.active'),
            INACTIVE: t('status.inactive'),
            SUSPENDED: t('status.suspended'),
            CLOSED: t('status.closed'),
          };
          return (
            <Badge variant={variant} appearance="ghost">
              <BadgeDot />
              {statusLabels[status] ?? status}
            </Badge>
          );
        },
        size: 125,
        meta: {
          headerTitle: t('pages.clients.columnStatus'),
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
            title={t('pages.clients.columnCreated')}
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
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {canManage && (
              <>
                <Button
                  mode="icon"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/clients/${row.original.id}/edit`);
                  }}
                >
                  <Edit className="size-4" />
                </Button>
                <Button
                  mode="icon"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleDeleteClick(e, row.original)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </>
            )}
            <ChevronRight className="text-muted-foreground/70 size-3.5" />
          </div>
        ),
        meta: {
          skeleton: <Skeleton className="size-4" />,
        },
        size: canManage ? 120 : 40,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
      },
    ],
    [router, canManage, t],
  );

  const [columnOrder, setColumnOrder] = useState<string[]>(
    columns.map((column) => column.id as string),
  );

  const table = useReactTable({
    columns,
    data: clients,
    pageCount: Math.ceil(totalCount / pagination.pageSize) || 1,
    getRowId: (row: Client) => row.id,
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
              placeholder={t('pages.clients.searchPlaceholder')}
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
              <SelectValue placeholder={t('pages.clients.filterByStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('pages.clients.allStatuses')}</SelectItem>
              <SelectItem value="ACTIVE">{t('status.active')}</SelectItem>
              <SelectItem value="INACTIVE">{t('status.inactive')}</SelectItem>
              <SelectItem value="SUSPENDED">{t('status.suspended')}</SelectItem>
              <SelectItem value="CLOSED">{t('status.closed')}</SelectItem>
            </SelectContent>
          </Select>
          {areasData && areasData.length > 0 && (
            <Select
              onValueChange={handleAreaSelection}
              value={selectedArea || 'all'}
              defaultValue="all"
              disabled={isLoading}
            >
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder={t('pages.clients.filterByArea')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('pages.clients.allAreas')}</SelectItem>
                {areasData.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        {canCreate && (
          <div className="flex items-center justify-end">
            <Link href="/clients/new">
              <Button disabled={isLoading}>
                <Plus />
                {t('pages.clients.addClient')}
              </Button>
            </Link>
          </div>
        )}
      </CardHeader>
    );
  };

  return (
    <>
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('pages.clients.deactivateClient')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('pages.clients.deactivateConfirm', { name: clientToDelete?.fullName ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.buttons.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t('pages.clients.deactivating') : t('pages.clients.deactivate')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ClientList;
