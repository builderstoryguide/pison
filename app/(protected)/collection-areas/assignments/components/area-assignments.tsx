'use client';

import { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, MapPin, UserCheck, Save } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getAreaStatusPresentation } from '@/lib/status/presenters';

interface Agent {
  id: string;
  agentCode: string;
  fullName: string;
  status: string;
}

interface CollectionArea {
  id: string;
  code: string;
  name: string;
  status: string;
}

export default function AreaAssignments() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [selectedAreaIds, setSelectedAreaIds] = useState<Set<string>>(new Set());

  // Fetch agents
  const { data: agentsData, isLoading: isLoadingAgents } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const response = await apiFetch('/api/agents');
      if (!response.ok) {
        throw new Error(t('pages.collectionAreas.fetchAgentsFailed'));
      }
      const result = await response.json();
      return result.data || [];
    },
  });

  // Fetch collection areas
  const { data: areasData, isLoading: isLoadingAreas } = useQuery({
    queryKey: ['collection-areas'],
    queryFn: async () => {
      const response = await apiFetch('/api/collection-areas?status=ACTIVE');
      if (!response.ok) {
        throw new Error(t('pages.collectionAreas.fetchAreasFailed'));
      }
      const result = await response.json();
      return result.data || [];
    },
  });

  const { data: occupancy = [] } = useQuery({
    queryKey: ['collection-area-occupancy'],
    queryFn: async () => {
      const response = await apiFetch('/api/collection-areas/assignment-occupancy');
      if (!response.ok) return [];
      const result = await response.json();
      return (result.data || []) as Array<{
        areaId: string;
        agentId: string;
        agentFullName: string;
        agentCode: string;
      }>;
    },
  });

  const occupancyByArea = new Map(occupancy.map((o) => [o.areaId, o]));

  // Fetch agent's current assignments
  const { data: agentAreas, isLoading: isLoadingAssignments } = useQuery({
    queryKey: ['agent-areas', selectedAgentId],
    queryFn: async () => {
      if (!selectedAgentId) return [];
      const response = await apiFetch(
        `/api/collection-areas/assignments?agentId=${selectedAgentId}`,
      );
      if (!response.ok) {
        throw new Error(t('pages.collectionAreas.fetchAgentAssignmentsFailed'));
      }
      const result = await response.json();
      return result.data || [];
    },
    enabled: !!selectedAgentId,
  });

  // Update selected areas when agent areas are loaded
  useState(() => {
    if (agentAreas) {
      setSelectedAreaIds(new Set(agentAreas.map((area: CollectionArea) => area.id)));
    }
  });

  // Assign areas mutation
  const assignMutation = useMutation({
    mutationFn: async (data: { agentId: string; areaIds: string[] }) => {
      const response = await apiFetch('/api/collection-areas/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const e = new Error(
          error.error?.message || t('pages.collectionAreas.assignAreasFailed')
        ) as Error & { details?: unknown };
        e.details = error.error?.details;
        throw e;
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-areas', selectedAgentId] });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['collection-area-occupancy'] });
      toast.success(t('pages.collectionAreas.assignAreasSuccess'));
    },
    onError: (error: Error) => {
      const details = (error as Error & { details?: Array<{ areaName: string; agentFullName: string }> })
        .details;
      if (Array.isArray(details) && details.length > 0) {
        for (const d of details) {
          toast.error(
            t('pages.collectionAreas.areaTakenBy', {
              defaultValue: '{{area}} is already assigned to {{agent}}.',
              area: d.areaName,
              agent: d.agentFullName,
            })
          );
        }
        return;
      }
      toast.error(error.message || t('pages.collectionAreas.assignAreasFailed'));
    },
  });

  const handleAgentSelect = (agentId: string) => {
    setSelectedAgentId(agentId);
    setSelectedAreaIds(new Set());
  };

  const handleAreaToggle = (areaId: string) => {
    const newSelected = new Set(selectedAreaIds);
    if (newSelected.has(areaId)) {
      newSelected.delete(areaId);
    } else {
      newSelected.add(areaId);
    }
    setSelectedAreaIds(newSelected);
  };

  const handleSave = () => {
    if (!selectedAgentId) {
      toast.error(t('pages.collectionAreas.selectAgentFirst'));
      return;
    }

    assignMutation.mutate({
      agentId: selectedAgentId,
      areaIds: Array.from(selectedAreaIds),
    });
  };

  const agents: Agent[] = agentsData || [];
  const areas: CollectionArea[] = areasData || [];
  const currentAssignments: CollectionArea[] = agentAreas || [];

  useEffect(() => {
    if (!selectedAgentId || !agentAreas) return;
    setSelectedAreaIds(new Set(agentAreas.map((area: CollectionArea) => area.id)));
  }, [selectedAgentId, agentAreas]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{t('pages.collectionAreas.selectAgent')}</CardTitle>
          <CardDescription>
            {t('pages.collectionAreas.selectAgentDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingAgents ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select
              value={selectedAgentId}
              onValueChange={handleAgentSelect}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('pages.collectionAreas.selectAgentPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    <div className="flex items-center gap-2">
                      <UserCheck className="size-4" />
                      <span>{agent.fullName}</span>
                      <Badge variant="secondary" className="ml-2">
                        {agent.agentCode}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {selectedAgentId && (
            <div className="space-y-2">
              <div className="text-sm font-medium">{t('pages.collectionAreas.currentAssignments')}</div>
              {isLoadingAssignments ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : currentAssignments.length > 0 ? (
                <div className="space-y-2">
                  {currentAssignments.map((area) => (
                    <div
                      key={area.id}
                      className="flex items-center gap-2 p-2 rounded-md border"
                    >
                      <MapPin className="size-4 text-primary" />
                      <span className="text-sm">{area.name}</span>
                      <Badge variant="outline" className="ml-auto">
                        {area.code}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  {t('pages.collectionAreas.noAreasAssigned')}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('pages.collectionAreas.assignCollectionAreas')}</CardTitle>
          <CardDescription>
            {t('pages.collectionAreas.assignCollectionAreasDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selectedAgentId ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('pages.collectionAreas.selectAgentFirst')}
            </div>
          ) : isLoadingAreas ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : areas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('pages.collectionAreas.noActiveAreasAvailable')}
            </div>
          ) : (
            <>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {areas.map((area) => {
                    const occ = occupancyByArea.get(area.id);
                    const takenByOther =
                      occ && selectedAgentId && occ.agentId !== selectedAgentId;
                    return (
                    <div
                      key={area.id}
                      className={`flex items-center space-x-3 p-3 rounded-md border transition-colors ${
                        takenByOther ? 'bg-muted/40' : 'hover:bg-accent/50'
                      }`}
                    >
                      <Checkbox
                        id={area.id}
                        checked={selectedAreaIds.has(area.id)}
                        disabled={!!takenByOther}
                        onCheckedChange={() => handleAreaToggle(area.id)}
                      />
                      <label
                        htmlFor={area.id}
                        className={`flex-1 ${takenByOther ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="font-medium text-sm">
                              {area.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {area.code}
                            </div>
                            {takenByOther && (
                              <div className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                                {t('pages.collectionAreas.assignedToCollector', {
                                  defaultValue: 'Assigned to {{name}} ({{code}})',
                                  name: occ.agentFullName,
                                  code: occ.agentCode,
                                })}
                              </div>
                            )}
                          </div>
                          <Badge variant="outline">
                            {t(getAreaStatusPresentation(area.status).labelKey)}
                          </Badge>
                        </div>
                      </label>
                    </div>
                  )})}
                </div>
              </ScrollArea>
              <Separator />
              <div className="flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={assignMutation.isPending || !selectedAgentId}
                >
                  {assignMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      {t('pages.collectionAreas.saving')}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 size-4" />
                      {t('pages.collectionAreas.saveAssignments')}
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
