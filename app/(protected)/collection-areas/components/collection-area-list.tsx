'use client';

import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronRight, Plus, Search, X, MapPin, Edit, Trash2 } from 'lucide-react';
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
import { hasPermission } from '@/lib/auth-client';
import { CAMEROON_REGIONS } from '@/lib/constants/cameroon-regions';
import { getAreaStatusPresentation } from '@/lib/status/presenters';

interface CollectionArea {
  id: string;
  code: string;
  name: string;
  description?: string;
  city?: string;
  region?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  _count?: {
    clients: number;
    agentAssignments: number;
    transactions: number;
  };
}

const CollectionAreaList = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const canManage = hasPermission(session, 'collection_areas.manage');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>('all');
  const [selectedRegion, setSelectedRegion] = useState<string | null>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [areaToDelete, setAreaToDelete] = useState<CollectionArea | null>(null);

  // Fetch collection areas
  const fetchAreas = async (): Promise<CollectionArea[]> => {
    const params = new URLSearchParams();
    if (selectedStatus && selectedStatus !== 'all') {
      params.append('status', selectedStatus);
    }
    if (selectedRegion && selectedRegion !== 'all') {
      params.append('region', selectedRegion);
    }
    if (searchQuery.trim()) {
      params.append('search', searchQuery.trim());
    }

    const response = await apiFetch(
      `/api/collection-areas?${params.toString()}`,
    );

    if (!response.ok) {
      throw new Error(t('pages.collectionAreas.fetchAreasFailed'));
    }

    const result = await response.json();
    return result.data || [];
  };

  // Areas query
  const { data: areas, isLoading } = useQuery({
    queryKey: ['collection-areas', selectedStatus, selectedRegion, searchQuery],
    queryFn: fetchAreas,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiFetch(`/api/collection-areas/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error?.message || t('pages.collectionAreas.areaDeactivateFailed'),
        );
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection-areas'] });
      toast.success(t('pages.collectionAreas.areaDeactivatedSuccess'));
      setDeleteDialogOpen(false);
      setAreaToDelete(null);
    },
    onError: (error: Error) => {
      toast.error(
        error.message || t('pages.collectionAreas.areaDeactivateFailed'),
      );
    },
  });

  const displayAreas = areas ?? [];

  const handleStatusSelection = (status: string) => {
    setSelectedStatus(status);
    setPagination({ ...pagination, pageIndex: 0 });
  };

  const handleRegionSelection = (region: string) => {
    setSelectedRegion(region);
    setPagination({ ...pagination, pageIndex: 0 });
  };

  const handleRowClick = (row: CollectionArea) => {
    router.push(`/collection-areas/${row.id}`);
  };

  const handleDeleteClick = (e: React.MouseEvent, area: CollectionArea) => {
    e.stopPropagation();
    setAreaToDelete(area);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (areaToDelete) {
      deleteMutation.mutate(areaToDelete.id);
    }
  };

  const formatRegionLabel = useCallback(
    (region?: string) => {
      if (!region) return t('common.labels.none');
      const found = CAMEROON_REGIONS.find((x) => x.value === region);
      return found ? t(`common.regions.${found.i18nKey}`) : region;
    },
    [t],
  );

  const columns = useMemo<ColumnDef<CollectionArea>[]>(
    () => [
      {
        accessorKey: 'code',
        id: 'code',
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('pages.collectionAreas.columns.code')}
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => {
          const area = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-8 rounded-md bg-primary/10">
                <MapPin className="size-4 text-primary" />
              </div>
              <div className="space-y-px">
                <div className="font-medium text-sm">{area.code}</div>
                <div className="text-muted-foreground text-xs">
                  {area.name}
                </div>
              </div>
            </div>
          );
        },
        size: 250,
        meta: {
          headerTitle: t('pages.collectionAreas.columns.code'),
          skeleton: (
            <div className="flex items-center gap-3">
              <Skeleton className="size-8 rounded-md" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ),
        },
        enableSorting: true,
        enableHiding: false,
      },
      {
        accessorKey: 'city',
        id: 'city',
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('pages.collectionAreas.columns.city')}
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => row.original.city || t('common.labels.none'),
        size: 150,
        meta: {
          headerTitle: t('pages.collectionAreas.columns.city'),
          skeleton: <Skeleton className="w-20 h-7" />,
        },
        enableSorting: true,
        enableHiding: true,
      },
      {
        accessorKey: 'region',
        id: 'region',
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('pages.collectionAreas.columns.region')}
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => formatRegionLabel(row.original.region),
        size: 150,
        meta: {
          headerTitle: t('pages.collectionAreas.columns.region'),
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
            title={t('pages.collectionAreas.columns.status')}
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => {
          const status = row.original.status;
          const { labelKey, variant } = getAreaStatusPresentation(status);
          return (
            <Badge variant={variant} appearance="ghost">
              <BadgeDot />
              {t(labelKey)}
            </Badge>
          );
        },
        size: 125,
        meta: {
          headerTitle: t('pages.collectionAreas.columns.status'),
          skeleton: <Skeleton className="w-14 h-7" />,
        },
        enableSorting: true,
        enableHiding: true,
      },
      {
        accessorKey: '_count',
        id: 'clients',
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('pages.collectionAreas.columns.clients')}
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => row.original._count?.clients || 0,
        size: 100,
        meta: {
          headerTitle: t('pages.collectionAreas.columns.clients'),
          skeleton: <Skeleton className="w-12 h-7" />,
        },
        enableSorting: false,
        enableHiding: true,
      },
      {
        accessorKey: 'createdAt',
        id: 'createdAt',
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('pages.collectionAreas.columns.created')}
            visibility={true}
            column={column}
          />
        ),
        cell: (info) => formatDate(new Date(info.getValue() as string)),
        size: 150,
        meta: {
          headerTitle: t('pages.collectionAreas.columns.created'),
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
                    router.push(`/collection-areas/${row.original.id}/edit`);
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
        size: 120,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
      },
    ],
    [router, canManage, t, formatRegionLabel],
  );

  const [columnOrder, setColumnOrder] = useState<string[]>(
    columns.map((column) => column.id as string),
  );

  const table = useReactTable({
    columns,
    data: displayAreas,
    pageCount: Math.ceil(displayAreas.length / pagination.pageSize),
    getRowId: (row: CollectionArea) => row.id,
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
              placeholder={t('pages.collectionAreas.searchPlaceholder')}
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
              <SelectValue placeholder={t('pages.collectionAreas.filterByStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t('pages.collectionAreas.allAreas')}
              </SelectItem>
              <SelectItem value="ACTIVE">
                {t('status.area.ACTIVE')}
              </SelectItem>
              <SelectItem value="INACTIVE">
                {t('status.area.INACTIVE')}
              </SelectItem>
            </SelectContent>
          </Select>
          <Select
            onValueChange={handleRegionSelection}
            value={selectedRegion || 'all'}
            defaultValue="all"
            disabled={isLoading}
          >
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder={t('pages.collectionAreas.filterByRegion')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('pages.collectionAreas.allRegions')}</SelectItem>
              {CAMEROON_REGIONS.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {t(`common.regions.${r.i18nKey}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {canManage && (
          <div className="flex items-center justify-end">
            <Link href="/collection-areas/new">
              <Button disabled={isLoading}>
                <Plus />
                {t('pages.collectionAreas.addArea')}
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
        recordCount={displayAreas.length}
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
            <AlertDialogTitle>
              {t('pages.collectionAreas.deactivateAreaTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('pages.collectionAreas.deactivateAreaDescription', {
                name: areaToDelete?.name ?? '',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.buttons.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending
                ? t('pages.collectionAreas.deactivatingArea')
                : t('pages.collectionAreas.deactivateArea')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CollectionAreaList;
