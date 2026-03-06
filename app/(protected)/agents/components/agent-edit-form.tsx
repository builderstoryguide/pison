'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const agentEditSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(255),
  nationalId: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
  areaIds: z.array(z.string().uuid()).default([]),
});

type AgentEditFormData = z.infer<typeof agentEditSchema>;

interface AgentEditFormProps {
  agentId: string;
}

export default function AgentEditForm({ agentId }: AgentEditFormProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: areasData } = useQuery({
    queryKey: ['collection-areas'],
    queryFn: async () => {
      const response = await apiFetch('/api/collection-areas?status=ACTIVE');
      if (!response.ok) return [];
      const result = await response.json();
      return result.data || [];
    },
  });

  const { data: agentData, isLoading: isLoadingAgent } = useQuery({
    queryKey: ['agent', agentId],
    queryFn: async () => {
      const response = await apiFetch(`/api/agents/${agentId}`);
      if (!response.ok) throw new Error('Failed to fetch agent');
      const result = await response.json();
      return result.data;
    },
    enabled: !!agentId,
  });

  const form = useForm<AgentEditFormData>({
    resolver: zodResolver(agentEditSchema),
    defaultValues: {
      fullName: '',
      nationalId: '',
      phone: '',
      email: '',
      address: '',
      status: 'ACTIVE',
      areaIds: [],
    },
  });

  useEffect(() => {
    if (agentData) {
      form.reset({
        fullName: agentData.fullName,
        nationalId: agentData.nationalId || '',
        phone: agentData.phone || '',
        email: agentData.email || '',
        address: agentData.address || '',
        status: agentData.status,
        areaIds: agentData.areaAssignments?.map((a: { area: { id: string } }) => a.area.id) || [],
      });
    }
  }, [agentData, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: AgentEditFormData) => {
      const payload = {
        ...data,
        email: data.email?.trim() || undefined,
      };
      const response = await apiFetch(`/api/agents/${agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update agent');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
      toast.success(t('pages.agents.agentUpdatedSuccess'));
      router.push('/agents');
    },
    onError: (error: Error) => {
      toast.error(error.message || t('pages.agents.updateFailed'));
    },
  });

  const onSubmit = (data: AgentEditFormData) => {
    updateMutation.mutate(data);
  };

  if (isLoadingAgent) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const isLoading = updateMutation.isPending;
  const areas = areasData || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('pages.agents.editAgent')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('common.labels.fullName')} *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('common.placeholders.fullName')}
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nationalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('common.labels.nationalId')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('common.placeholders.nationalId')}
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('common.labels.phone')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('common.placeholders.phoneNumber')}
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('common.labels.email')}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t('common.placeholders.emailAddress')}
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.labels.address')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('common.placeholders.streetAddress')}
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.labels.status')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('common.placeholders.selectStatus')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ACTIVE">{t('status.active')}</SelectItem>
                      <SelectItem value="INACTIVE">{t('status.inactive')}</SelectItem>
                      <SelectItem value="SUSPENDED">{t('status.suspended')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="areaIds"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">{t('pages.agents.assignedAreas')}</FormLabel>
                    <FormDescription>
                      {t('pages.agents.assignedAreasDesc')}
                    </FormDescription>
                  </div>
                  <ScrollArea className="h-48 rounded-md border p-4">
                    <div className="space-y-4">
                      {areas.map((area: { id: string; name: string; code: string }) => (
                        <FormField
                          key={area.id}
                          control={form.control}
                          name="areaIds"
                          render={({ field }) => (
                            <FormItem
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(area.id)}
                                  onCheckedChange={(checked) =>
                                    checked
                                      ? field.onChange([...(field.value ?? []), area.id])
                                      : field.onChange(
                                          (field.value ?? []).filter((v) => v !== area.id)
                                        )
                                  }
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                {area.name} ({area.code})
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                      {areas.length === 0 && (
                        <div className="text-muted-foreground text-sm text-center py-4">
                          {t('pages.agents.noActiveAreas')}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                {t('common.buttons.cancel')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                {t('pages.agents.updateAgent')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
