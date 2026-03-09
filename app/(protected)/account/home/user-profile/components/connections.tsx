'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import { DropdownMenu4 } from '@/partials/dropdown-menu/dropdown-menu-4';
import { DropdownMenu5 } from '@/partials/dropdown-menu/dropdown-menu-5';
import { Check, EllipsisVertical, Plus } from 'lucide-react';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

interface IConnectionsItem {
  avatar: string;
  name: string;
  connections: number;
  jointLinks: number | string;
  connected: boolean;
}
type IConnectionsItems = Array<IConnectionsItem>;

interface IConnectionsProps {
  url: string;
}

const Connections = ({ url }: IConnectionsProps) => {
  const { t } = useTranslation();
  const [items, setItems] = useState<IConnectionsItems>([
    {
      avatar: '300-3.png',
      name: 'Tyler Hero',
      connections: 26,
      jointLinks: 6,
      connected: true,
    },
    {
      avatar: '300-1.png',
      name: 'Esther Howard',
      connections: 639,
      jointLinks: 'none',
      connected: false,
    },
    {
      avatar: '300-11.png',
      name: 'Jacob Jones',
      connections: 125,
      jointLinks: 19,
      connected: false,
    },
    {
      avatar: '300-2.png',
      name: 'Cody Fisher',
      connections: 81,
      jointLinks: 'none',
      connected: true,
    },
    {
      avatar: '300-5.png',
      name: 'Leslie Alexander',
      connections: 1203,
      jointLinks: 2,
      connected: false,
    },
    {
      avatar: '300-9.png',
      name: 'Guy Hawkins',
      connections: 2,
      jointLinks: 'none',
      connected: true,
    },
  ]);

  const toggleConnection = (index: number) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, connected: !item.connected } : item,
      ),
    );
  };

  const renderItem = (item: IConnectionsItem, index: number) => (
    <TableRow key={index}>
      <TableCell>
        <div className="flex items-center grow gap-2.5">
          <img
            src={toAbsoluteUrl(`/media/avatars/${item.avatar}`)}
            className="rounded-full size-9 shrink-0"
            alt={item.name}
          />
          <div className="flex flex-col gap-1">
            <Link
              href="/public-profile/profiles/creator"
              className="text-sm font-medium text-mono hover:text-primary-active mb-px"
            >
              {item.name}
            </Link>
            <span className="text-xs font-normal text-secondary-foreground leading-3">
              {item.connections} connections
            </span>
          </div>
        </div>
      </TableCell>
      <TableCell className="py-2 text-end">{item.jointLinks}</TableCell>
      <TableCell className="py-2 text-end">
        <Button
          className={`rounded-full ${
            item.connected
              ? 'bg-primary/10 text-white'
              : 'bg-primary/10 border border-primary/30 text-primary hover:text-white hover:bg-primary/10'
          }`}
          size="sm"
          mode="icon"
          variant={item.connected ? 'primary' : 'outline'}
          onClick={() => toggleConnection(index)}
        >
          {item.connected ? <Check size={18} /> : <Plus size={18} />}
        </Button>
      </TableCell>
      <TableCell className="text-end">
        <DropdownMenu5
          trigger={
            <Button variant="ghost" mode="icon">
              <EllipsisVertical />
            </Button>
          }
        />
      </TableCell>
    </TableRow>
  );

  return (
    <Card className="min-w-full">
      <CardHeader>
        <CardTitle>{t('pages.profile.connections')}</CardTitle>
        <DropdownMenu4
          trigger={
            <Button variant="ghost" mode="icon">
              <EllipsisVertical />
            </Button>
          }
        />
      </CardHeader>
      <CardContent className="kt-scrollable-x-auto p-0">
        <div className="kt-scrollable-auto">
          <Table className="align-middle text-sm text-secondary-foreground">
            <TableBody>
              <TableRow className="bg-accent/60">
                <TableCell className="text-start font-normal min-w-48 py-2.5">
                  {t('common.labels.name')}
                </TableCell>
                <TableCell className="text-end font-medium min-w-20 py-2.5">
                  {t('pages.profile.jointLinks')}
                </TableCell>
                <TableCell className="text-end font-medium min-w-20 py-2.5">
                  {t('common.labels.status')}
                </TableCell>
                <TableCell className="min-w-16" />
              </TableRow>
              {items.map(renderItem)}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="justify-center">
        <Button mode="link" underlined="dashed" asChild>
          <Link href={url}>{t('pages.profile.viewMore', { count: 64 })}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export {
  Connections,
  type IConnectionsItem,
  type IConnectionsItems,
  type IConnectionsProps,
};
