'use client';

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
import { useTranslation } from '@/hooks/useTranslation';
import { useSession } from 'next-auth/react';
import { hasPermission } from '@/lib/auth-client';
import TransactionList from '../components/transaction-list';
import NewTransactionDialog from '../components/new-transaction-dialog';

export default function Page() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const canCreateTransaction = hasPermission(session, 'transactions.create');

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{t('pages.transactions.withdrawals')}</ToolbarTitle>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">{t('common.breadcrumbs.home')}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/transactions">{t('menu.transactions')}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{t('pages.transactions.typeWithdrawal')}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
          <ToolbarActions>
            {canCreateTransaction && (
              <NewTransactionDialog type="WITHDRAWAL" />
            )}
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container>
        <TransactionList defaultType="WITHDRAWAL" />
      </Container>
    </>
  );
}
