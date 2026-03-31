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
  useReactTable,
} from '@tanstack/react-table';
import { FileText, User } from 'lucide-react';
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
import { formatDateTime, formatCurrency } from '@/lib/helpers';
import { getTransactionTypeLabel } from '@/lib/i18n/transaction-labels';

interface ClientStatementRow {
  transactionNumber: string;
  date: string;
  type: string;
  description: string | null;
  debit: number;
  credit: number;
  balance: number;
}

interface ClientInfo {
  id: string;
  clientNumber: string;
  fullName: string;
  accountNumber: string;
  currentBalance: number;
  area: { code: string; name: string };
}

interface ClientOption {
  id: string;
  clientNumber: string;
  fullName: string;
}

function getDefaultDates() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: now.toISOString().slice(0, 10),
  };
}

export default function ClientStatementReport() {
  const { t } = useTranslation();
  const defaults = getDefaultDates();
  const [clientId, setClientId] = useState<string>('');
  const [clientSearch] = useState('');
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });

  // Fetch client list
  const { data: clients } = useQuery<ClientOption[]>({
    queryKey: ['clients-list', clientSearch],
    queryFn: async () => {
      const url = buildUrl('/api/clients', { search: clientSearch || undefined, status: 'ACTIVE' });
      const res = await apiFetch(url);
      const json = await res.json();
      return (json.data ?? []).map((c: { id: string; clientNumber?: string; fullName?: string }) => ({
        id: c.id,
        clientNumber: c.clientNumber,
        fullName: c.fullName,
      }));
    },
    staleTime: 1000 * 60 * 5,
    refetchInterval: false,
  });

  // Fetch statement
  const { data: statement, isLoading } = useQuery<{
    client: ClientInfo;
    rows: ClientStatementRow[];
  }>({
    queryKey: ['report-client-statement', clientId, startDate, endDate],
    queryFn: async () => {
      const url = buildUrl('/api/reports/client-statement', {
        clientId,
        startDate,
        endDate,
      });
      const res = await apiFetch(url);
      const json = await res.json();
      return json.data;
    },
    enabled: !!clientId && !!startDate && !!endDate,
    staleTime: 1000 * 60 * 5,
    refetchInterval: false,
  });

  const rows = statement?.rows ?? [];
  const client = statement?.client;

  const totals = useMemo(() => {
    return {
      totalDebit: rows.reduce((s, r) => s + r.debit, 0),
      totalCredit: rows.reduce((s, r) => s + r.credit, 0),
    };
  }, [rows]);

  const columns = useMemo<ColumnDef<ClientStatementRow>[]>(
    () => {
      const h = {
        date: t('pages.reports.clientStatementReport.columns.date'),
        reference: t('pages.reports.clientStatementReport.columns.reference'),
        type: t('pages.reports.clientStatementReport.columns.type'),
        description: t('pages.reports.clientStatementReport.columns.description'),
        debit: t('pages.reports.clientStatementReport.columns.debit'),
        credit: t('pages.reports.clientStatementReport.columns.credit'),
        balance: t('pages.reports.clientStatementReport.columns.balance'),
      };
      return [
      {
        accessorKey: 'date',
        id: 'date',
        header: ({ column }) => (
          <DataGridColumnHeader title={h.date} visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-sm">{formatDateTime(row.original.date)}</span>
        ),
        size: 190,
        meta: { headerTitle: h.date, skeleton: <Skeleton className="w-32 h-5" /> },
      },
      {
        accessorKey: 'transactionNumber',
        id: 'transactionNumber',
        header: ({ column }) => (
          <DataGridColumnHeader title={h.reference} visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.transactionNumber}</span>
        ),
        size: 160,
        meta: { headerTitle: h.reference, skeleton: <Skeleton className="w-28 h-5" /> },
      },
      {
        accessorKey: 'type',
        id: 'type',
        header: ({ column }) => (
          <DataGridColumnHeader title={h.type} visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-sm">
            {getTransactionTypeLabel(row.original.type, t)}
          </span>
        ),
        size: 140,
        meta: { headerTitle: h.type, skeleton: <Skeleton className="w-24 h-5" /> },
      },
      {
        accessorKey: 'description',
        id: 'description',
        header: ({ column }) => (
          <DataGridColumnHeader title={h.description} visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground truncate">
            {row.original.description || '-'}
          </span>
        ),
        size: 200,
        meta: { headerTitle: h.description, skeleton: <Skeleton className="w-32 h-5" /> },
      },
      {
        accessorKey: 'debit',
        id: 'debit',
        header: ({ column }) => (
          <DataGridColumnHeader title={h.debit} visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm text-red-600 text-right block">
            {row.original.debit > 0 ? formatCurrency(row.original.debit) : '-'}
          </span>
        ),
        size: 130,
        meta: { headerTitle: h.debit, skeleton: <Skeleton className="w-20 h-5" /> },
      },
      {
        accessorKey: 'credit',
        id: 'credit',
        header: ({ column }) => (
          <DataGridColumnHeader title={h.credit} visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm text-green-600 text-right block">
            {row.original.credit > 0 ? formatCurrency(row.original.credit) : '-'}
          </span>
        ),
        size: 130,
        meta: { headerTitle: h.credit, skeleton: <Skeleton className="w-20 h-5" /> },
      },
      {
        accessorKey: 'balance',
        id: 'balance',
        header: ({ column }) => (
          <DataGridColumnHeader title={h.balance} visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm font-semibold text-right block">
            {formatCurrency(row.original.balance)}
          </span>
        ),
        size: 140,
        meta: { headerTitle: h.balance, skeleton: <Skeleton className="w-24 h-5" /> },
      },
    ];
    },
    [t],
  );

  const [columnOrder, setColumnOrder] = useState<string[]>(
    columns.map((c) => c.id as string),
  );

  const table = useReactTable({
    columns,
    data: rows,
    pageCount: Math.ceil(rows.length / pagination.pageSize),
    getRowId: (row) => row.transactionNumber,
    state: { pagination, columnOrder },
    columnResizeMode: 'onChange',
    onColumnOrderChange: setColumnOrder,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: false,
  });

  return (
    <div className="space-y-5">
      {/* Filter toolbar */}
      <Card>
        <CardHeader className="pb-3">
          <h3 className="text-sm font-medium">
            {t('pages.reports.clientStatementReport.filterTitle')}
          </h3>
        </CardHeader>
        <CardContent className="pb-5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-muted-foreground mb-1.5 block">
                {t('pages.reports.clientStatementReport.clientLabel')}
              </label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('pages.reports.selectClient')} />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.clientNumber} - {c.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                {t('pages.reports.clientStatementReport.startDate')}
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full sm:w-40"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                {t('pages.reports.clientStatementReport.endDate')}
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full sm:w-40"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client info card */}
      {client && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center size-12 rounded-full bg-primary/10">
                <User className="size-6 text-primary" />
              </div>
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t('pages.reports.clientStatementReport.clientLabel')}
                  </p>
                  <p className="text-sm font-medium">{client.fullName}</p>
                  <p className="text-xs text-muted-foreground">{client.clientNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t('common.labels.account')}
                  </p>
                  <p className="text-sm font-mono">{client.accountNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t('pages.reports.clientStatementReport.area')}
                  </p>
                  <p className="text-sm">{client.area.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t('pages.reports.clientStatementReport.currentBalance')}
                  </p>
                  <p className="text-sm font-mono font-semibold">
                    {formatCurrency(client.currentBalance)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Totals */}
      {rows.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">
                {t('pages.reports.clientStatementReport.totalCredit')}
              </p>
              <p className="text-lg font-semibold font-mono text-green-600">
                {formatCurrency(totals.totalCredit)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">
                {t('pages.reports.clientStatementReport.totalDebit')}
              </p>
              <p className="text-lg font-semibold font-mono text-red-600">
                {formatCurrency(totals.totalDebit)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">
                {t('pages.reports.clientStatementReport.transactionCount')}
              </p>
              <p className="text-lg font-semibold font-mono">{rows.length}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* No client selected message */}
      {!clientId && (
        <Card>
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            <FileText className="size-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">
              {t('pages.reports.clientStatementReport.emptyHint')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Data grid */}
      {clientId && (
        <DataGrid
          table={table}
          recordCount={rows.length}
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
      )}
    </div>
  );
}
