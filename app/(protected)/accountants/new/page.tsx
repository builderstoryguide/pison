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
    ToolbarHeading,
    ToolbarTitle,
} from '@/components/common/toolbar';
import { useTranslation } from '@/hooks/useTranslation';
import CreateAccountantForm from './components/create-accountant-form';

export default function NewAccountantPage() {
    const { t } = useTranslation();

    return (
        <>
            <Container>
                <Toolbar>
                    <ToolbarHeading>
                        <ToolbarTitle>{t('menu.addAccountant')}</ToolbarTitle>
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/">{t('common.breadcrumbs.home')}</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/accountants">{t('menu.accountants')}</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>{t('common.breadcrumbs.new')}</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </ToolbarHeading>
                </Toolbar>
            </Container>

            <Container className="pt-8">
                <CreateAccountantForm />
            </Container>
        </>
    );
}
