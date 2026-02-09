'use client';

import { useState } from 'react';
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
  const queryClient = useQueryClient();
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [selectedAreaIds, setSelectedAreaIds] = useState<Set<string>>(new Set());

  // Fetch agents
  const { data: agentsData, isLoading: isLoadingAgents } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const response = await apiFetch('/api/agents');
      if (!response.ok) {
        throw new Error('Failed to fetch agents');
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
        throw new Error('Failed to fetch collection areas');
      }
      const result = await response.json();
      return result.data || [];
    },
  });

  // Fetch agent's current assignments
  const { data: agentAreas, isLoading: isLoadingAssignments } = useQuery({
    queryKey: ['agent-areas', selectedAgentId],
    queryFn: async () => {
      if (!selectedAgentId) return [];
      const response = await apiFetch(
        `/api/collection-areas/assignments?agentId=${selectedAgentId}`,
      );
      if (!response.ok) {
        throw new Error('Failed to fetch agent areas');
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
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to assign areas');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-areas', selectedAgentId] });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast.success('Areas assigned successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to assign areas');
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
      toast.error('Please select an agent');
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

  // Update selected areas when assignments load
  if (currentAssignments.length > 0 && selectedAreaIds.size === 0) {
    setSelectedAreaIds(new Set(currentAssignments.map((area) => area.id)));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Select Agent</CardTitle>
          <CardDescription>
            Choose an agent to manage their area assignments
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
                <SelectValue placeholder="Select an agent" />
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
              <div className="text-sm font-medium">Current Assignments</div>
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
                  No areas assigned
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assign Collection Areas</CardTitle>
          <CardDescription>
            Select the areas this agent should have access to
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selectedAgentId ? (
            <div className="text-center py-8 text-muted-foreground">
              Please select an agent first
            </div>
          ) : isLoadingAreas ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : areas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No active collection areas available
            </div>
          ) : (
            <>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {areas.map((area) => (
                    <div
                      key={area.id}
                      className="flex items-center space-x-3 p-3 rounded-md border hover:bg-accent/50 transition-colors"
                    >
                      <Checkbox
                        id={area.id}
                        checked={selectedAreaIds.has(area.id)}
                        onCheckedChange={() => handleAreaToggle(area.id)}
                      />
                      <label
                        htmlFor={area.id}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">
                              {area.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {area.code}
                            </div>
                          </div>
                          <Badge variant="outline">{area.status}</Badge>
                        </div>
                      </label>
                    </div>
                  ))}
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
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 size-4" />
                      Save Assignments
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
