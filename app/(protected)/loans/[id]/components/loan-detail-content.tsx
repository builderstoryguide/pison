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
import { Toolbar, ToolbarActions, ToolbarHeading, ToolbarTitle } from '@/components/common/toolbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/hooks/useTranslation';
import { formatCurrency, formatDate } from '@/lib/helpers';
import LoanForm from '../../components/loan-form';
import RepaymentDialog from '../../components/repayment-dialog';
import ApproveButton from '../../components/approve-button';
import RejectButton from '../../components/reject-button';

interface LoanDetailContentProps {
  loan: {
    id: string;
    loanNumber: string;
    status: string;
    principalAmount: string | number;
    interestRate: string | number;
    totalAmount: string | number;
    remainingBalance: string | number;
    maturityDate: string | Date | null;
    purpose: string | null;
    client: {
      fullName: string;
      clientNumber: string;
      phone: string | null;
      email: string | null;
      area?: { name: string } | null;
    };
    repayments: Array<{
      id: string;
      amount: string | number;
      repaidAt: string | Date;
      principal: string | number;
      interest: string | number;
    }>;
  };
  isManager: boolean;
  isPending: boolean;
  isActive: boolean;
  canRecordRepayment: boolean;
}

function getStatusVariant(status: string) {
  switch (status) {
    case 'APPROVED':
    case 'DISBURSED':
    case 'ACTIVE':
    case 'PAID_OFF':
      return 'success';
    case 'PENDING':
      return 'warning';
    case 'DEFAULTED':
    case 'CANCELLED':
      return 'destructive';
    default:
      return 'secondary';
  }
}

export default function LoanDetailContent({
  loan,
  isManager,
  isPending,
  isActive,
  canRecordRepayment,
}: LoanDetailContentProps) {
  const { t } = useTranslation();

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{loan.loanNumber}</ToolbarTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant={getStatusVariant(loan.status)}>{loan.status}</Badge>
              <span>{loan.client.fullName}</span>
            </div>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">{t('common.breadcrumbs.home')}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/loans">{t('pages.loans.title')}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{loan.loanNumber}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
          <ToolbarActions>
            {isPending && isManager && (
              <>
                <ApproveButton loanId={loan.id} />
                <RejectButton loanId={loan.id} />
              </>
            )}
            {isActive && canRecordRepayment && (
              <RepaymentDialog
                loanId={loan.id}
                loanNumber={loan.loanNumber}
                remainingBalance={Number(loan.remainingBalance)}
              />
            )}
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container>
        {isPending ? (
          <LoanForm loanId={loan.id} />
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>{t('pages.loans.loanDetails')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">{t('pages.loans.principalAmount')}</h4>
                    <p className="text-lg font-semibold">{formatCurrency(Number(loan.principalAmount))}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">{t('pages.loans.interestRate')}</h4>
                    <p className="text-lg font-semibold">{(Number(loan.interestRate) * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">{t('pages.loans.totalAmount')}</h4>
                    <p className="text-lg font-semibold">{formatCurrency(Number(loan.totalAmount))}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">{t('pages.loans.remainingBalance')}</h4>
                    <p className="text-lg font-semibold text-primary">{formatCurrency(Number(loan.remainingBalance))}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">{t('pages.loans.maturityDate')}</h4>
                    <p>{loan.maturityDate ? formatDate(new Date(loan.maturityDate)) : 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">{t('pages.loans.purpose')}</h4>
                    <p>{loan.purpose || 'N/A'}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-4">{t('pages.loans.repaymentHistory')}</h4>
                  {loan.repayments.length > 0 ? (
                    <div className="space-y-4">
                      {loan.repayments.map((repayment) => (
                        <div key={repayment.id} className="flex justify-between items-center border-b pb-2 last:border-0">
                          <div>
                            <p className="font-medium">{formatCurrency(Number(repayment.amount))}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(new Date(repayment.repaidAt))}</p>
                          </div>
                          <div className="text-right text-sm">
                            <p>{t('pages.loans.principal')}: {formatCurrency(Number(repayment.principal))}</p>
                            <p>{t('pages.loans.interest')}: {formatCurrency(Number(repayment.interest))}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">{t('pages.loans.noRepayments')}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('pages.loans.clientInformation')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">{t('common.labels.fullName')}</h4>
                  <p>{loan.client.fullName}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">{t('pages.loans.clientNumber')}</h4>
                  <p>{loan.client.clientNumber}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">{t('pages.loans.contact')}</h4>
                  <p>{loan.client.phone || 'N/A'}</p>
                  <p className="text-sm">{loan.client.email || ''}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">{t('pages.loans.area')}</h4>
                  <p>{loan.client.area?.name || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </Container>
    </>
  );
}
