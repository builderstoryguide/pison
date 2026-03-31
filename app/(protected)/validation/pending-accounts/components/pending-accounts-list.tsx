'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { pendingAccountKeys, clientKeys, agentKeys } from '@/hooks/queries/query-keys';
import { formatCurrency, formatDateTime } from '@/lib/helpers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  UserCircle,
  Users,
  CreditCard,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/hooks/useTranslation';

interface PendingClient {
  id: string;
  clientNumber: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  createdAt: string;
  area?: { id: string; code: string; name: string };
  account?: { id: string; accountNumber: string; balance: string; availableBalance: string };
  creator?: { id: string; name: string | null; email: string | null };
}

interface PendingAgent {
  id: string;
  agentCode: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  createdAt: string;
  user?: { id: string; name: string | null; email: string | null };
  account?: { id: string; accountNumber: string; balance: string; availableBalance: string };
  areaAssignments?: { area: { id: string; code: string; name: string } }[];
  creator?: { id: string; name: string | null; email: string | null };
}

interface PendingAccountsData {
  clients: PendingClient[];
  agents: PendingAgent[];
  total: number;
}

export default function PendingAccountsList() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    type: 'client' | 'agent';
    id: string;
    name: string;
    number: string;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: pendingAccountKeys.all,
    queryFn: async () => {
      const response = await apiFetch('/api/accounts/pending');
      if (!response.ok) {
        throw new Error(t('pages.pendingAccounts.fetchFailed'));
      }
      const result = await response.json();
      return result.data as PendingAccountsData;
    },
    refetchInterval: 30000,
  });

  const approveMutation = useMutation({
    mutationFn: async (data: { type: 'client' | 'agent'; id: string }) => {
      const endpoint =
        data.type === 'client'
          ? `/api/clients/${data.id}/approve`
          : `/api/agents/${data.id}/approve`;
      const response = await apiFetch(endpoint, { method: 'POST' });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || t('pages.pendingAccounts.approveFailed'));
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pendingAccountKeys.all });
      queryClient.invalidateQueries({ queryKey: clientKeys.all });
      queryClient.invalidateQueries({ queryKey: agentKeys.all });
      toast.success(t('pages.pendingAccounts.approveSuccess'));
      setApproveDialogOpen(false);
      setSelectedItem(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || t('pages.pendingAccounts.approveFailed'));
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (data: { type: 'client' | 'agent'; id: string; reason?: string }) => {
      const endpoint =
        data.type === 'client'
          ? `/api/clients/${data.id}/reject`
          : `/api/agents/${data.id}/reject`;
      const response = await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: data.reason }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || t('pages.pendingAccounts.rejectFailed'));
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pendingAccountKeys.all });
      queryClient.invalidateQueries({ queryKey: clientKeys.all });
      queryClient.invalidateQueries({ queryKey: agentKeys.all });
      toast.success(t('pages.pendingAccounts.rejectSuccess'));
      setRejectDialogOpen(false);
      setSelectedItem(null);
      setRejectReason('');
    },
    onError: (error: Error) => {
      toast.error(error.message || t('pages.pendingAccounts.rejectFailed'));
    },
  });

  const handleApprove = (type: 'client' | 'agent', item: PendingClient | PendingAgent) => {
    const name = item.fullName;
    const number = type === 'client' ? (item as PendingClient).clientNumber : (item as PendingAgent).agentCode;
    setSelectedItem({ type, id: item.id, name, number });
    setApproveDialogOpen(true);
  };

  const handleReject = (type: 'client' | 'agent', item: PendingClient | PendingAgent) => {
    const name = item.fullName;
    const number = type === 'client' ? (item as PendingClient).clientNumber : (item as PendingAgent).agentCode;
    setSelectedItem({ type, id: item.id, name, number });
    setRejectDialogOpen(true);
  };

  const handleApproveConfirm = () => {
    if (selectedItem) {
      approveMutation.mutate({ type: selectedItem.type, id: selectedItem.id });
    }
  };

  const handleRejectConfirm = () => {
    if (selectedItem) {
      rejectMutation.mutate({
        type: selectedItem.type,
        id: selectedItem.id,
        reason: rejectReason || undefined,
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="space-y-4 py-8">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const pendingClients = data?.clients ?? [];
  const pendingAgents = data?.agents ?? [];
  const total = pendingClients.length + pendingAgents.length;

  if (total === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="size-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('pages.validation.noPendingAccounts')}</h3>
          <p className="text-muted-foreground">{t('pages.validation.allAccountsReviewed')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {pendingClients.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <UserCircle className="size-5" />
              {t('pages.pendingAccounts.sectionClients', { count: pendingClients.length })}
            </h2>
            <div className="space-y-4">
              {pendingClients.map((client) => (
                <Card key={`client-${client.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{client.fullName}</CardTitle>
                        <div className="text-sm text-muted-foreground mt-1">
                          {client.clientNumber} • {client.account?.accountNumber}
                        </div>
                      </div>
                      <Badge variant="warning">{t('pages.validation.pendingApproval')}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        {client.area && (
                          <div className="flex items-center gap-2">
                            <Users className="size-4 text-muted-foreground" />
                            <div>
                              <div className="text-sm text-muted-foreground">
                                {t('pages.clients.columnArea')}
                              </div>
                              <div className="font-medium">
                                {client.area.name} ({client.area.code})
                              </div>
                            </div>
                          </div>
                        )}
                        {client.creator && (
                          <div>
                            <div className="text-sm text-muted-foreground">{t('pages.validation.createdBy')}</div>
                            <div className="text-sm">{client.creator.name || client.creator.email}</div>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div>
                          <div className="text-sm text-muted-foreground">
                            {t('pages.clients.columnCreated')}
                          </div>
                          <div className="text-sm">{formatDateTime(new Date(client.createdAt))}</div>
                        </div>
                        {client.account && (
                          <div>
                            <div className="text-sm text-muted-foreground">
                              {t('pages.pendingAccounts.labelBalance')}
                            </div>
                            <div className="font-medium">{formatCurrency(client.account.balance)}</div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => handleReject('client', client)}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                      >
                        <XCircle className="mr-2 size-4" />
                        {t('pages.validation.rejectAccount')}
                      </Button>
                      <Button
                        onClick={() => handleApprove('client', client)}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                      >
                        <CheckCircle2 className="mr-2 size-4" />
                        {t('pages.validation.approveAccount')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {pendingAgents.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <CreditCard className="size-5" />
              {t('pages.pendingAccounts.sectionAgents', { count: pendingAgents.length })}
            </h2>
            <div className="space-y-4">
              {pendingAgents.map((agent) => (
                <Card key={`agent-${agent.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{agent.fullName}</CardTitle>
                        <div className="text-sm text-muted-foreground mt-1">
                          {agent.agentCode} • {agent.account?.accountNumber}
                        </div>
                      </div>
                      <Badge variant="warning">{t('pages.validation.pendingApproval')}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        {agent.user && (
                          <div>
                            <div className="text-sm text-muted-foreground">
                              {t('pages.pendingAccounts.labelUser')}
                            </div>
                            <div className="text-sm">{agent.user.email}</div>
                          </div>
                        )}
                        {agent.areaAssignments && agent.areaAssignments.length > 0 && (
                          <div>
                            <div className="text-sm text-muted-foreground">
                              {t('pages.pendingAccounts.labelAreas')}
                            </div>
                            <div className="text-sm">
                              {agent.areaAssignments.map((a) => a.area.name).join(', ')}
                            </div>
                          </div>
                        )}
                        {agent.creator && (
                          <div>
                            <div className="text-sm text-muted-foreground">{t('pages.validation.createdBy')}</div>
                            <div className="text-sm">{agent.creator.name || agent.creator.email}</div>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div>
                          <div className="text-sm text-muted-foreground">
                            {t('pages.clients.columnCreated')}
                          </div>
                          <div className="text-sm">{formatDateTime(new Date(agent.createdAt))}</div>
                        </div>
                        {agent.account && (
                          <div>
                            <div className="text-sm text-muted-foreground">
                              {t('pages.pendingAccounts.labelBalance')}
                            </div>
                            <div className="font-medium">{formatCurrency(agent.account.balance)}</div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => handleReject('agent', agent)}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                      >
                        <XCircle className="mr-2 size-4" />
                        {t('pages.validation.rejectAccount')}
                      </Button>
                      <Button
                        onClick={() => handleApprove('agent', agent)}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                      >
                        <CheckCircle2 className="mr-2 size-4" />
                        {t('pages.validation.approveAccount')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('pages.validation.approveAccount')}</DialogTitle>
            <DialogDescription>{t('pages.validation.approveAccountConfirm')}</DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="py-2">
              <div className="font-medium">{selectedItem.name}</div>
              <div className="text-sm text-muted-foreground">{selectedItem.number}</div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApproveDialogOpen(false)}
              disabled={approveMutation.isPending}
            >
              {t('common.buttons.cancel')}
            </Button>
            <Button onClick={handleApproveConfirm} disabled={approveMutation.isPending}>
              {approveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {t('pages.pendingAccounts.approving')}
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 size-4" />
                  {t('pages.validation.approveAccount')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('pages.validation.rejectAccount')}</DialogTitle>
            <DialogDescription>{t('pages.validation.rejectAccountConfirm')}</DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="py-2">
              <div className="font-medium">{selectedItem.name}</div>
              <div className="text-sm text-muted-foreground">{selectedItem.number}</div>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-reason">{t('pages.pendingAccounts.reasonOptionalShort')}</Label>
              <Textarea
                id="reject-reason"
                placeholder={t('common.placeholders.reasonRejectionAccount')}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectReason('');
              }}
              disabled={rejectMutation.isPending}
            >
              {t('common.buttons.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {t('pages.pendingAccounts.rejecting')}
                </>
              ) : (
                <>
                  <XCircle className="mr-2 size-4" />
                  {t('pages.validation.rejectAccount')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
