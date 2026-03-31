'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import { ExternalLink, Loader2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { useDebouncedSearch } from '@/hooks/use-debounced-search';
import { useTranslation } from '@/hooks/useTranslation';
import { hasPermission, isManagerRole } from '@/lib/auth-client';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardFooter, CardHeader, CardTable } from '@/components/ui/card';

type CommissionClientRow = {
  id: string;
  clientNumber: string;
  fullName: string;
  isCommissionExempt: boolean;
  commissionRatePercent: number | null;
};

type ListResponse = {
  success: boolean;
  data?: {
    items: CommissionClientRow[];
    pagination: { page: number; pageSize: number; totalCount: number; totalPages: number };
  };
  error?: { message?: string };
};

export default function CommissionClientsPage() {
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const allowed =
    status === 'authenticated' &&
    hasPermission(session, 'settings.manage') &&
    isManagerRole(session);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });
  const [filter, setFilter] = useState<'customized' | 'all'>('customized');
  const [debouncedSearch, setSearchValue, immediateSearch] = useDebouncedSearch('', 300);

  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [debouncedSearch]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CommissionClientRow | null>(null);
  const [draftExempt, setDraftExempt] = useState(false);
  const [draftRate, setDraftRate] = useState('');

  const page = pagination.pageIndex + 1;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['commission-clients', page, pagination.pageSize, filter, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pagination.pageSize),
        filter,
        search: debouncedSearch,
      });
      const response = await apiFetch(`/api/commissions/clients?${params.toString()}`);
      const body = (await response.json()) as ListResponse;
      if (!response.ok) {
        throw new Error(body.error?.message || t('pages.commissions.loadFailed'));
      }
      return body.data!;
    },
    enabled: allowed,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: {
      clientId: string;
      commissionRatePercent: number | null;
      isCommissionExempt: boolean;
    }) => {
      const response = await apiFetch(`/api/clients/${payload.clientId}/commission-rate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commissionRatePercent: payload.commissionRatePercent,
          isCommissionExempt: payload.isCommissionExempt,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body?.error?.message || t('pages.commissions.updateFailed'));
      }
      return body;
    },
    onSuccess: () => {
      toast.success(t('pages.commissions.updateSuccess'));
      queryClient.invalidateQueries({ queryKey: ['commission-clients'] });
      setDialogOpen(false);
      setEditing(null);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const openEdit = useCallback((row: CommissionClientRow) => {
    setEditing(row);
    setDraftExempt(row.isCommissionExempt);
    setDraftRate(row.commissionRatePercent === null ? '' : String(row.commissionRatePercent));
    setDialogOpen(true);
  }, []);

  const handleSave = () => {
    if (!editing) return;
    const trimmed = draftRate.trim();
    let commissionRatePercent: number | null;
    if (trimmed === '') {
      commissionRatePercent = null;
    } else {
      const n = Number(trimmed);
      if (Number.isNaN(n) || n < 0 || n > 100) {
        toast.error(t('pages.settings.commissionRateInvalid'));
        return;
      }
      commissionRatePercent = n;
    }
    saveMutation.mutate({
      clientId: editing.id,
      commissionRatePercent,
      isCommissionExempt: draftExempt,
    });
  };

  const handleClearOverride = () => {
    if (!editing) return;
    saveMutation.mutate({
      clientId: editing.id,
      commissionRatePercent: null,
      isCommissionExempt: draftExempt,
    });
  };

  const columns = useMemo<ColumnDef<CommissionClientRow>[]>(
    () => [
      {
        accessorKey: 'fullName',
        id: 'fullName',
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('pages.commissions.columnClient')}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.fullName}</span>
            <Link
              href={`/clients/${row.original.id}`}
              className="text-xs text-primary inline-flex items-center gap-1 hover:underline"
            >
              {t('pages.commissions.columnClientNumber')}: {row.original.clientNumber}
              <ExternalLink className="size-3" aria-hidden />
            </Link>
          </div>
        ),
        meta: { cellClassName: 'min-w-[200px]' },
      },
      {
        accessorKey: 'isCommissionExempt',
        id: 'exempt',
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('pages.commissions.columnExempt')}
            column={column}
          />
        ),
        cell: ({ row }) =>
          row.original.isCommissionExempt ? t('pages.commissions.yes') : t('pages.commissions.no'),
      },
      {
        accessorKey: 'commissionRatePercent',
        id: 'override',
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('pages.commissions.columnOverride')}
            column={column}
          />
        ),
        cell: ({ row }) =>
          row.original.commissionRatePercent === null
            ? t('pages.commissions.defaultRate')
            : `${row.original.commissionRatePercent}%`,
      },
      {
        id: 'actions',
        header: t('pages.commissions.columnActions'),
        cell: ({ row }) => (
          <Button type="button" variant="outline" size="sm" onClick={() => openEdit(row.original)}>
            <Pencil className="size-3.5 me-1" aria-hidden />
            {t('pages.commissions.editCommission')}
          </Button>
        ),
        enableSorting: false,
      },
    ],
    [t, openEdit],
  );

  const table = useReactTable({
    data: data?.items ?? [],
    columns,
    pageCount: data?.pagination.totalPages ?? 0,
    state: { pagination },
    onPaginationChange: setPagination,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{t('pages.commissions.clientsTitle')}</ToolbarTitle>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">{t('common.breadcrumbs.home')}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/commissions/settings">{t('menu.commissions')}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{t('pages.commissions.clientsTitle')}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
          <ToolbarActions />
        </Toolbar>
      </Container>

      <Container className="space-y-6">
        <p className="text-muted-foreground text-sm max-w-2xl">
          {t('pages.commissions.clientsDescription')}
        </p>

        {!allowed && status === 'authenticated' ? (
          <Alert variant="destructive">
            <AlertTitle>{t('pages.commissions.forbidden')}</AlertTitle>
            <AlertDescription>{t('pages.commissions.forbidden')}</AlertDescription>
          </Alert>
        ) : null}

        {allowed ? (
          <DataGrid
            table={table}
            recordCount={data?.pagination.totalCount ?? 0}
            isLoading={isLoading}
            tableLayout={{
              dense: true,
              columnsPinnable: false,
              columnsResizable: false,
              columnsMovable: false,
              columnsVisibility: false,
            }}
          >
            <Card>
              <CardHeader className="gap-4 flex flex-col sm:flex-row sm:items-end sm:justify-between border-b border-border py-4">
                <div className="flex flex-col sm:flex-row gap-3 flex-1">
                  <div className="flex-1 max-w-md">
                    <Label className="sr-only" htmlFor="commission-client-search">
                      {t('common.buttons.search')}
                    </Label>
                    <Input
                      id="commission-client-search"
                      placeholder={t('pages.commissions.searchPlaceholder')}
                      value={immediateSearch}
                      onChange={(e) => setSearchValue(e.target.value)}
                    />
                  </div>
                  <Select
                    value={filter}
                    onValueChange={(v) => {
                      setFilter(v as 'customized' | 'all');
                      setPagination((p) => ({ ...p, pageIndex: 0 }));
                    }}
                  >
                    <SelectTrigger className="w-[220px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customized">{t('pages.commissions.filterCustomized')}</SelectItem>
                      <SelectItem value="all">{t('pages.commissions.filterAll')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardTable>
                {isError ? (
                  <div className="p-8 text-destructive text-sm">{t('pages.commissions.loadFailed')}</div>
                ) : (
                  <ScrollArea>
                    <DataGridTable />
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                )}
              </CardTable>
              <CardFooter className="border-t border-border py-4">
                <DataGridPagination className="w-full" sizes={[10, 25, 50, 100]} />
              </CardFooter>
            </Card>
          </DataGrid>
        ) : null}
      </Container>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('pages.commissions.editCommission')}</DialogTitle>
          </DialogHeader>
          {editing ? (
            <div className="space-y-4 py-2">
              <p className="text-sm font-medium">{editing.fullName}</p>
              <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
                <div>
                  <Label htmlFor="draft-exempt">{t('pages.commissions.columnExempt')}</Label>
                  <p className="text-xs text-muted-foreground">{t('pages.clients.commissionExemptDesc')}</p>
                </div>
                <Switch
                  id="draft-exempt"
                  checked={draftExempt}
                  onCheckedChange={setDraftExempt}
                  disabled={saveMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="draft-rate">{t('pages.clients.commissionRatePercent')}</Label>
                <Input
                  id="draft-rate"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  placeholder={t('pages.clients.commissionRatePercentPlaceholder')}
                  value={draftRate}
                  onChange={(e) => setDraftRate(e.target.value)}
                  disabled={saveMutation.isPending}
                />
                <p className="text-xs text-muted-foreground">
                  {t('pages.clients.commissionRatePercentDescription')}
                </p>
              </div>
            </div>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={handleClearOverride}
              disabled={saveMutation.isPending || !editing}
            >
              {saveMutation.isPending ? <Loader2 className="animate-spin size-4" /> : null}
              {t('pages.commissions.clearOverride')}
            </Button>
            <Button type="button" onClick={handleSave} disabled={saveMutation.isPending || !editing}>
              {saveMutation.isPending ? <Loader2 className="animate-spin size-4 me-2" /> : null}
              {t('pages.commissions.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
