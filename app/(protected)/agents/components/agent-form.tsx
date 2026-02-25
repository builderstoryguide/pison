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
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const agentSchema = z.object({
  userId: z.string().uuid().optional(), // Required only for creation
  fullName: z.string().min(1, 'Full name is required').max(255),
  nationalId: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().optional(),
  hireDate: z.string().datetime().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).default('ACTIVE'),
  areaIds: z.array(z.string().uuid()).default([]),
});

type AgentFormData = z.infer<typeof agentSchema>;

interface AgentFormProps {
  agentId?: string;
}

export default function AgentForm({ agentId }: AgentFormProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditMode = !!agentId;

  // Fetch collection areas
  const { data: areasData } = useQuery({
    queryKey: ['collection-areas'],
    queryFn: async () => {
      const response = await apiFetch('/api/collection-areas?status=ACTIVE');
      if (!response.ok) return [];
      const result = await response.json();
      return result.data || [];
    },
  });

  // Fetch available users (only for creation)
  const { data: usersData } = useQuery({
    queryKey: ['available-users'],
    queryFn: async () => {
      const response = await apiFetch('/api/agents/available-users');
      if (!response.ok) return [];
      const result = await response.json();
      return result.data || [];
    },
    enabled: !isEditMode,
  });

  // Fetch agent data if editing
  const { data: agentData, isLoading: isLoadingAgent } = useQuery({
    queryKey: ['agent', agentId],
    queryFn: async () => {
      const response = await apiFetch(`/api/agents/${agentId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch agent');
      }
      const result = await response.json();
      return result.data;
    },
    enabled: isEditMode,
  });

  const form = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      userId: '',
      fullName: '',
      nationalId: '',
      phone: '',
      email: '',
      address: '',
      hireDate: new Date().toISOString(),
      status: 'ACTIVE',
      areaIds: [],
    },
  });

  // Populate form when agent data is loaded
  useEffect(() => {
    if (agentData) {
      form.reset({
        userId: agentData.userId,
        fullName: agentData.fullName,
        nationalId: agentData.nationalId || '',
        phone: agentData.phone || '',
        email: agentData.email || '',
        address: agentData.address || '',
        hireDate: agentData.hireDate ? new Date(agentData.hireDate).toISOString() : new Date().toISOString(),
        status: agentData.status,
        areaIds: agentData.areaAssignments?.map((a: { area: { id: string } }) => a.area.id) || [],
      });
    }
  }, [agentData, form]);

  // Handle user selection to prefill data
  const handleUserChange = (userId: string) => {
    const user = usersData?.find((u: { id: string }) => u.id === userId);
    if (user) {
      form.setValue('userId', userId);
      form.setValue('fullName', user.name || '');
      form.setValue('email', user.email || '');
    }
  };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: AgentFormData) => {
      if (!data.userId) {
        throw new Error('Please select a user');
      }
      const response = await apiFetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create agent');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast.success('Agent created successfully');
      router.push('/agents');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create agent');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: AgentFormData) => {
      const response = await apiFetch(`/api/agents/${agentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
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
      toast.success('Agent updated successfully');
      router.push('/agents');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update agent');
    },
  });

  const onSubmit = (data: AgentFormData) => {
    if (isEditMode) {
      // Remove userId from update payload as it cannot be changed
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- intentionally excluded from update payload
      const { userId, ...updateData } = data;
      updateMutation.mutate(updateData as AgentFormData);
    } else {
      createMutation.mutate(data);
    }
  };

  if (isEditMode && isLoadingAgent) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const areas = areasData || [];
  const users = usersData || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditMode ? t('pages.agents.editAgent') : t('pages.agents.createNewAgent')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {!isEditMode && (
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('pages.agents.selectUser')}</FormLabel>
                    <Select
                      onValueChange={handleUserChange}
                      defaultValue={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('common.placeholders.selectUser')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.map((user: { id: string; name?: string; email?: string }) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {t('pages.agents.selectUserDesc')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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

            {isEditMode && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('common.labels.status')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
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
            )}

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
                      {areas.map((area: { id: string }) => (
                        <FormField
                          key={area.id}
                          control={form.control}
                          name="areaIds"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={area.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(area.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, area.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== area.id
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">
                                  {area.name} ({area.code})
                                </FormLabel>
                              </FormItem>
                            );
                          }}
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
                {isEditMode ? t('pages.agents.updateAgent') : t('pages.agents.createAgent')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
