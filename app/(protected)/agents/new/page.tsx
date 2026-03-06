'use client';

import { useState } from 'react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CreateAgentForm from '../components/create-agent-form';
import LinkAgentForm from '../components/link-agent-form';
import { UserPlus, Link2 } from 'lucide-react';

type CreationFlow = 'choice' | 'create' | 'link';

export default function Page() {
  const { t } = useTranslation();
  const [flow, setFlow] = useState<CreationFlow>('choice');

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{t('pages.agents.createAgent')}</ToolbarTitle>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">{t('common.breadcrumbs.home')}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/agents">{t('menu.agents')}</BreadcrumbLink>
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

      <Container>
        {flow === 'choice' && (
          <div className="grid gap-6 md:grid-cols-2 max-w-2xl">
            <Card
              className="cursor-pointer transition-colors hover:bg-accent/50"
              onClick={() => setFlow('create')}
            >
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-2">
                  <UserPlus className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{t('pages.agents.createNewAccount')}</CardTitle>
                <CardDescription>
                  {t('pages.agents.createNewAccountChoiceDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  {t('pages.agents.createNewAccount')}
                </Button>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer transition-colors hover:bg-accent/50"
              onClick={() => setFlow('link')}
            >
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-2">
                  <Link2 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{t('pages.agents.linkExistingUser')}</CardTitle>
                <CardDescription>
                  {t('pages.agents.linkExistingUserChoiceDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  {t('pages.agents.linkExistingUser')}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {flow === 'create' && (
          <div className="space-y-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFlow('choice')}
            >
              ← {t('common.buttons.back')}
            </Button>
            <CreateAgentForm />
          </div>
        )}

        {flow === 'link' && (
          <div className="space-y-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFlow('choice')}
            >
              ← {t('common.buttons.back')}
            </Button>
            <LinkAgentForm />
          </div>
        )}
      </Container>
    </>
  );
}
