'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  MapPin,
  Users,
  UserCheck,
  Activity,
  Building,
  Globe,
  FileText,
  Calendar,
} from 'lucide-react';
import { formatDate } from '@/lib/helpers';
import { useTranslation } from '@/hooks/useTranslation';
import Link from 'next/link';

interface CollectionAreaDetailsProps {
  areaId: string;
}

interface Client {
  id: string;
  clientNumber: string;
  fullName: string;
  status: string;
}

interface AgentAssignment {
  agent: {
    id: string;
    agentCode: string;
    fullName: string;
    status: string;
  };
}

interface CollectionArea {
  id: string;
  code: string;
  name: string;
  description: string | null;
  city: string | null;
  region: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  clients: Client[];
  agentAssignments: AgentAssignment[];
  _count: {
    clients: number;
    agentAssignments: number;
    transactions: number;
  };
}

export default function CollectionAreaDetails({ areaId }: CollectionAreaDetailsProps) {
  const { t } = useTranslation();

  const { data: area, isLoading } = useQuery<CollectionArea>({
    queryKey: ['collection-area', areaId],
    queryFn: async () => {
      const response = await apiFetch(`/api/collection-areas/${areaId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch collection area');
      }
      const result = await response.json();
      return result.data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!area) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          {t('messages.data_not_found')}
        </CardContent>
      </Card>
    );
  }

  const statusColors: Record<string, 'success' | 'secondary' | 'destructive' | 'warning'> = {
    ACTIVE: 'success',
    INACTIVE: 'secondary',
  };

  return (
    <div className="grid gap-6">
      {/* Area Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('pages.collectionAreas.areaInformation')}</CardTitle>
            <Badge variant={statusColors[area.status] || 'secondary'}>
              {t(`status.${area.status.toLowerCase()}`)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="size-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">{t('pages.collectionAreas.code')?.replace(' *', '')}</div>
                  <div className="font-medium">{area.code}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="size-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">{t('pages.collectionAreas.name')?.replace(' *', '')}</div>
                  <div className="font-medium">{area.name}</div>
                </div>
              </div>

              {area.description && (
                <div className="flex items-start gap-3">
                  <FileText className="size-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">{t('pages.collectionAreas.description')}</div>
                    <div className="font-medium">{area.description}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {area.city && (
                <div className="flex items-start gap-3">
                  <Building className="size-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">{t('common.labels.city')}</div>
                    <div className="font-medium">{area.city}</div>
                  </div>
                </div>
              )}

              {area.region && (
                <div className="flex items-start gap-3">
                  <Globe className="size-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">{t('common.labels.region')}</div>
                    <div className="font-medium">{area.region}</div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Calendar className="size-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">Created</div>
                  <div className="font-medium">{formatDate(area.createdAt)}</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center size-12 rounded-lg bg-primary/10">
                <Users className="size-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{area._count.clients}</div>
                <div className="text-sm text-muted-foreground">{t('pages.collectionAreas.assignedClients')}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center size-12 rounded-lg bg-green-500/10">
                <UserCheck className="size-6 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{area._count.agentAssignments}</div>
                <div className="text-sm text-muted-foreground">{t('pages.collectionAreas.assignedAgents')}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center size-12 rounded-lg bg-blue-500/10">
                <Activity className="size-6 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{area._count.transactions}</div>
                <div className="text-sm text-muted-foreground">{t('pages.collectionAreas.totalTransactions')}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clients List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5" />
            {t('pages.collectionAreas.assignedClients')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {area.clients.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {t('pages.collectionAreas.noClients')}
            </div>
          ) : (
            <div className="divide-y">
              {area.clients.map((client) => (
                <Link
                  key={client.id}
                  href={`/clients/${client.id}`}
                  className="flex items-center justify-between py-3 hover:bg-muted/50 -mx-4 px-4 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center size-8 rounded-full bg-primary/10">
                      <Users className="size-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{client.fullName}</div>
                      <div className="text-sm text-muted-foreground">{client.clientNumber}</div>
                    </div>
                  </div>
                  <Badge variant={statusColors[client.status] || 'secondary'}>
                    {t(`status.${client.status.toLowerCase()}`)}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agents List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="size-5" />
            {t('pages.collectionAreas.assignedAgents')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {area.agentAssignments.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {t('pages.collectionAreas.noAgents')}
            </div>
          ) : (
            <div className="divide-y">
              {area.agentAssignments.map((assignment) => (
                <Link
                  key={assignment.agent.id}
                  href={`/agents/${assignment.agent.id}`}
                  className="flex items-center justify-between py-3 hover:bg-muted/50 -mx-4 px-4 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center size-8 rounded-full bg-green-500/10">
                      <UserCheck className="size-4 text-green-500" />
                    </div>
                    <div>
                      <div className="font-medium">{assignment.agent.fullName}</div>
                      <div className="text-sm text-muted-foreground">{assignment.agent.agentCode}</div>
                    </div>
                  </div>
                  <Badge variant={statusColors[assignment.agent.status] || 'secondary'}>
                    {t(`status.${assignment.agent.status.toLowerCase()}`)}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
