import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { clientService, agentService } from '@/lib/services';
import ClientsPageClient from './clients-page-client';

async function fetchInitialClients() {
  try {
    const session = await getServerSession(authOptions);
    const roleName = (session?.user?.roleName || '').toLowerCase();
    const isAgent = roleName.includes('agent') || roleName.includes('collector');

    let areaIds: string[] | undefined;
    if (isAgent && session?.user?.id) {
      const agent = await agentService.getAgentByUserId(session.user.id);
      if (!agent) {
        return { data: [], pagination: { total: 0, limit: 10, offset: 0 } };
      }
      const assignedAreas = await agentService.getAgentAreas(agent.id);
      const ids = assignedAreas.map((a) => a.id);
      if (ids.length === 0) {
        return { data: [], pagination: { total: 0, limit: 10, offset: 0 } };
      }
      areaIds = ids;
    }

    const result = await clientService.getAllClients({
      limit: 10,
      offset: 0,
      areaIds,
    });
    return {
      data: result.clients.map(client => ({
        ...client,
        account: client.account ? {
          ...client.account,
          balance: Number(client.account.balance),
          availableBalance: Number(client.account.availableBalance),
        } : null
      })),
      pagination: { total: result.total, limit: 10, offset: 0 },
    };
  } catch {
    return null;
  }
}

export default async function ClientsPage() {
  const initialData = await fetchInitialClients();
  return <ClientsPageClient initialData={initialData} />;
}
