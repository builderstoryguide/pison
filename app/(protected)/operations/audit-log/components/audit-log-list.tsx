'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuditLogs, type AuditLog } from '@/hooks/queries';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardFooter, CardHeader, CardTable } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { formatDateTime } from '@/lib/helpers';

const ENTITY_TYPES = ['TRANSACTION', 'CLIENT', 'AGENT', 'LOAN', 'DAILY_SESSION', 'USER'] as const;
const ACTIONS = ['CREATE', 'APPROVE', 'REJECT', 'REFILL', 'OPEN_SESSION', 'CLOSE_SESSION', 'USER_CREATED'] as const;

function getDefaultDates() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 30);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: now.toISOString().slice(0, 10),
  };
}

export default function AuditLogList() {
  const { t } = useTranslation();
  const defaults = getDefaultDates();
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [entityType, setEntityType] = useState<string>('all');
  const [action, setAction] = useState<string>('all');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });

  const { data: response, isLoading } = useAuditLogs({
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    startDate: startDate ? `${startDate}T00:00:00.000Z` : undefined,
    endDate: endDate ? `${endDate}T23:59:59.999Z` : undefined,
    entityType: entityType === 'all' ? undefined : entityType,
    action: action === 'all' ? undefined : action,
  });

  const logs = response?.data ?? [];
  const totalCount = response?.pagination?.totalCount ?? 0;

  const getActionLabel = (a: string) => {
    const map: Record<string, string> = {
      CREATE: t('pages.auditLog.actionCreate'),
      APPROVE: t('pages.auditLog.actionApprove'),
      REJECT: t('pages.auditLog.actionReject'),
      REFILL: t('pages.auditLog.actionRefill'),
      OPEN_SESSION: t('pages.auditLog.actionOpenSession'),
      CLOSE_SESSION: t('pages.auditLog.actionCloseSession'),
      USER_CREATED: t('pages.auditLog.actionUserCreated'),
    };
    return map[a] ?? a;
  };

  const getEntityTypeLabel = (e: string) => {
    const map: Record<string, string> = {
      TRANSACTION: t('pages.auditLog.entityTransaction'),
      CLIENT: t('pages.auditLog.entityClient'),
      AGENT: t('pages.auditLog.entityAgent'),
      LOAN: t('pages.auditLog.entityLoan'),
      DAILY_SESSION: t('pages.auditLog.entityDailySession'),
      USER: t('pages.auditLog.entityUser'),
    };
    return map[e] ?? e;
  };

  const columns = useMemo<ColumnDef<AuditLog>[]>(
    () => [
      {
        accessorKey: 'createdAt',
        id: 'createdAt',
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('pages.auditLog.columnDate')}
            visibility={true}
            column={column}
          />
        ),
        cell: (info) => formatDateTime(info.getValue() as string),
        size: 180,
        meta: {
          headerTitle: t('pages.auditLog.columnDate'),
          skeleton: <Skeleton className="w-32 h-7" />,
        },
      },
      {
        accessorKey: 'user',
        id: 'user',
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('pages.auditLog.columnUser')}
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => {
          const user = row.original.user;
          return (
            <div className="font-medium text-sm">
              {user?.name || user?.email || row.original.userId}
            </div>
          );
        },
        size: 180,
        meta: {
          headerTitle: t('pages.auditLog.columnUser'),
          skeleton: <Skeleton className="w-24 h-7" />,
        },
      },
      {
        accessorKey: 'action',
        id: 'action',
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('pages.auditLog.columnAction')}
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => {
          const a = row.original.action;
          const variant =
            a === 'APPROVE'
              ? 'success'
              : a === 'REJECT'
                ? 'destructive'
                : 'secondary';
          return (
            <Badge variant={variant} appearance="ghost">
              {getActionLabel(a)}
            </Badge>
          );
        },
        size: 120,
        meta: {
          headerTitle: t('pages.auditLog.columnAction'),
          skeleton: <Skeleton className="w-16 h-7" />,
        },
      },
      {
        accessorKey: 'entityType',
        id: 'entityType',
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('pages.auditLog.columnEntityType')}
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => getEntityTypeLabel(row.original.entityType),
        size: 140,
        meta: {
          headerTitle: t('pages.auditLog.columnEntityType'),
          skeleton: <Skeleton className="w-20 h-7" />,
        },
      },
      {
        accessorKey: 'description',
        id: 'description',
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('pages.auditLog.columnDescription')}
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <div className="max-w-[280px] truncate text-muted-foreground text-sm">
            {row.original.description || '-'}
          </div>
        ),
        size: 300,
        meta: {
          headerTitle: t('pages.auditLog.columnDescription'),
          skeleton: <Skeleton className="w-40 h-7" />,
        },
      },
      {
        accessorKey: 'transaction',
        id: 'transaction',
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('pages.auditLog.columnTransaction')}
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => {
          const transaction = row.original.transaction;
          if (!transaction) return <span className="text-muted-foreground">-</span>;
          return (
            <Link
              href={`/transactions/${transaction.id}`}
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              {transaction.transactionNumber}
              <ChevronRight className="size-3.5" />
            </Link>
          );
        },
        size: 160,
        meta: {
          headerTitle: t('pages.auditLog.columnTransaction'),
          skeleton: <Skeleton className="w-24 h-7" />,
        },
      },
    ],
    [t],
  );

  const table = useReactTable({
    columns,
    data: logs,
    pageCount: Math.ceil(totalCount / pagination.pageSize) || 1,
    getRowId: (row: AuditLog) => row.id,
    state: {
      pagination,
    },
    onPaginationChange: (updater) => {
      const newPagination =
        typeof updater === 'function' ? updater(pagination) : updater;
      setPagination(newPagination);
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
  });

  const DataGridToolbar = () => (
    <CardHeader className="flex-col flex-wrap sm:flex-row items-stretch sm:items-center gap-4 py-5">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Label htmlFor="startDate" className="text-muted-foreground text-xs whitespace-nowrap">
            {t('pages.auditLog.filterByDate')}
          </Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
            disabled={isLoading}
            className="w-36"
          />
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
            disabled={isLoading}
            className="w-36"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={entityType}
            onValueChange={(v) => {
              setEntityType(v);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
            disabled={isLoading}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t('pages.auditLog.filterByEntityType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('pages.auditLog.allEntityTypes')}</SelectItem>
              {ENTITY_TYPES.map((e) => (
                <SelectItem key={e} value={e}>
                  {getEntityTypeLabel(e)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={action}
            onValueChange={(v) => {
              setAction(v);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
            disabled={isLoading}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t('pages.auditLog.filterByAction')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('pages.auditLog.allActions')}</SelectItem>
              {ACTIONS.map((a) => (
                <SelectItem key={a} value={a}>
                  {getActionLabel(a)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </CardHeader>
  );

  return (
    <DataGrid
      table={table}
      recordCount={totalCount}
      isLoading={isLoading}
      emptyMessage={t('pages.auditLog.noLogs')}
      tableLayout={{
        columnsResizable: true,
        columnsVisibility: true,
      }}
      tableClassNames={{
        edgeCell: 'px-5',
      }}
    >
      <Card>
        <DataGridToolbar />
        <ScrollArea className="w-full">
          <CardTable>
            <DataGridTable />
          </CardTable>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        <CardFooter className="flex items-center justify-between border-t px-5 py-4">
          <DataGridPagination />
        </CardFooter>
      </Card>
    </DataGrid>
  );
}
