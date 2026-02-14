'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, MapPin, Users, DollarSign, Save, Plus, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from 'next-auth/react';
import { Badge } from '@/components/ui/badge';

interface CollectionArea {
  id: string;
  code: string;
  name: string;
}

interface Client {
  id: string;
  clientNumber: string;
  fullName: string;
  account?: {
    balance: string;
  };
}

interface CollectionEntry {
  clientId: string;
  amount: string;
}

export default function DailyCollectionForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [selectedAreaId, setSelectedAreaId] = useState<string>('');
  const [entries, setEntries] = useState<CollectionEntry[]>([]);

  // Fetch current user's agent record (for collection ventilation)
  const { data: agentData } = useQuery({
    queryKey: ['me-agent', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const response = await apiFetch('/api/me/agent');
      if (!response.ok) return null;
      const result = await response.json();
      return result.data || null;
    },
    enabled: !!session?.user?.id,
  });

  const agentId = agentData?.id;

  // Fetch agent's areas
  const { data: areasData, isLoading: isLoadingAreas } = useQuery({
    queryKey: ['agent-areas', agentId],
    queryFn: async () => {
      if (!agentId) return [];
      const response = await apiFetch(
        `/api/collection-areas/assignments?agentId=${agentId}`,
      );
      if (!response.ok) return [];
      const result = await response.json();
      return result.data || [];
    },
    enabled: !!agentId,
  });

  // Fetch clients for selected area
  const { data: clientsData, isLoading: isLoadingClients } = useQuery({
    queryKey: ['clients-by-area', selectedAreaId],
    queryFn: async () => {
      if (!selectedAreaId) return [];
      const response = await apiFetch(
        `/api/clients?areaId=${selectedAreaId}&status=ACTIVE`,
      );
      if (!response.ok) return [];
      const result = await response.json();
      return result.data || [];
    },
    enabled: !!selectedAreaId,
  });

  // Submit collections mutation
  const submitMutation = useMutation({
    mutationFn: async (data: { areaId: string; entries: Array<{ clientId: string; amount: number }> }) => {
      const response = await apiFetch('/api/collections/daily', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to submit collections');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['pending-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Collections submitted successfully. Awaiting approval.');
      setEntries([]);
      setSelectedAreaId('');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit collections');
    },
  });

  const handleAreaSelect = (areaId: string) => {
    setSelectedAreaId(areaId);
    setEntries([]);
  };

  const handleAmountChange = (clientId: string, amount: string) => {
    const numAmount = parseFloat(amount) || 0;
    if (numAmount < 0) return;

    setEntries((prev) => {
      const existing = prev.findIndex((e) => e.clientId === clientId);
      if (existing >= 0) {
        if (numAmount === 0) {
          return prev.filter((e) => e.clientId !== clientId);
        }
        const updated = [...prev];
        updated[existing] = { clientId, amount };
        return updated;
      } else if (numAmount > 0) {
        return [...prev, { clientId, amount }];
      }
      return prev;
    });
  };

  const handleAddAll = () => {
    if (!clientsData) return;
    const newEntries = clientsData.map((client: Client) => ({
      clientId: client.id,
      amount: '0',
    }));
    setEntries(newEntries);
  };

  const handleSubmit = () => {
    if (!selectedAreaId) {
      toast.error('Please select a collection area');
      return;
    }

    const validEntries = entries
      .map((e) => ({
        clientId: e.clientId,
        amount: parseFloat(e.amount) || 0,
      }))
      .filter((e) => e.amount > 0);

    if (validEntries.length === 0) {
      toast.error('Please enter at least one collection amount');
      return;
    }

    if (!agentId) {
      toast.error('Agent ID not found');
      return;
    }

    submitMutation.mutate({
      areaId: selectedAreaId,
      agentId: agentId,
      entries: validEntries,
    });
  };

  const areas: CollectionArea[] = areasData || [];
  const clients: Client[] = clientsData || [];
  const totalAmount = entries.reduce(
    (sum, e) => sum + (parseFloat(e.amount) || 0),
    0,
  );

  if (!agentId) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          {t('pages.collections.agentNotFound')}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('pages.collections.selectCollectionArea')}</CardTitle>
          <CardDescription>
            {t('pages.collections.selectCollectionAreaDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingAreas ? (
            <Skeleton className="h-10 w-full" />
          ) : areas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('pages.collections.noAreasAssigned')}
            </div>
          ) : (
            <Select value={selectedAreaId} onValueChange={handleAreaSelect}>
              <SelectTrigger>
                <SelectValue placeholder={t('pages.collections.selectArea')} />
              </SelectTrigger>
              <SelectContent>
                {areas.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    <div className="flex items-center gap-2">
                      <MapPin className="size-4" />
                      <span>{area.name}</span>
                      <Badge variant="outline">{area.code}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {selectedAreaId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('pages.collections.enterCollectionAmounts')}</CardTitle>
                <CardDescription>
                  {t('pages.collections.enterCollectionAmountsDesc')}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddAll}
                disabled={isLoadingClients || clients.length === 0}
              >
                <Plus className="mr-2 size-4" />
                {t('pages.collections.addAllClients')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingClients ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : clients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('pages.collections.noActiveClientsInArea')}
              </div>
            ) : (
              <>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {clients.map((client) => {
                      const entry = entries.find((e) => e.clientId === client.id);
                      const amount = entry?.amount || '0';
                      const balance = client.account
                        ? parseFloat(client.account.balance)
                        : 0;

                      return (
                        <div
                          key={client.id}
                          data-testid={`collection-row-${client.id}`}
                          className="flex items-center gap-4 p-4 rounded-lg border"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Users className="size-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{client.fullName}</div>
                                <div className="text-sm text-muted-foreground">
                                  {client.clientNumber}
                                </div>
                              </div>
                            </div>
                            <div className="mt-2 text-sm text-muted-foreground">
                              {t('pages.collections.currentBalance')}:{' '}
                              {new Intl.NumberFormat('fr-FR', {
                                style: 'currency',
                                currency: 'XOF',
                                minimumFractionDigits: 0,
                              }).format(balance)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-32">
                              <Input
                                type="number"
                                placeholder="0"
                                value={amount}
                                onChange={(e) =>
                                  handleAmountChange(client.id, e.target.value)
                                }
                                min="0"
                                step="0.01"
                              />
                            </div>
                            <span className="text-sm text-muted-foreground">
                              XOF
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
                <Separator className="my-4" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="size-5 text-primary" />
                    <div>
                      <div className="text-sm text-muted-foreground">
                        {t('pages.collections.totalAmount')}
                      </div>
                      <div className="text-2xl font-bold">
                        {new Intl.NumberFormat('fr-FR', {
                          style: 'currency',
                          currency: 'XOF',
                          minimumFractionDigits: 0,
                        }).format(totalAmount)}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={handleSubmit}
                    disabled={
                      submitMutation.isPending ||
                      entries.filter((e) => parseFloat(e.amount) > 0).length ===
                        0
                    }
                    size="lg"
                  >
                    {submitMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        {t('pages.collections.submitting')}
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 size-4" />
                        {t('pages.collections.submitCollections')}
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
