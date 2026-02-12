import { Metadata } from 'next';
import { notFound } from 'next/navigation';
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
import AgentForm from '../components/agent-form';
import RefillDialog from '../components/refill-dialog';
import { agentService } from '@/lib/services';
import { formatCurrency } from '@/lib/helpers';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const agent = await agentService.getAgentById(id);
  if (!agent) return { title: 'Agent Not Found' };
  return {
    title: `Edit ${agent.fullName}`,
    description: `Edit details for ${agent.fullName}`,
  };
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const agent = await agentService.getAgentById(id);

  if (!agent) {
    notFound();
  }

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>Edit {agent.fullName}</ToolbarTitle>
            <div className="text-sm text-muted-foreground">
              Balance: {formatCurrency(Number(agent.account?.balance ?? 0))}
            </div>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/agents">Agents</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Edit</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
          <ToolbarActions>
            <RefillDialog
              agentId={agent.id}
              agentName={agent.fullName}
            />
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container>
        <AgentForm agentId={agent.id} />
      </Container>
    </>
  );
}
