import { clientService } from '@/lib/services';
import ClientsPageClient from './clients-page-client';

async function fetchInitialClients() {
  try {
    const result = await clientService.getAllClients({
      limit: 10,
      offset: 0,
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
