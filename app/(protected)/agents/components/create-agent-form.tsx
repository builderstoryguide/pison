'use client';

import React from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const createAgentSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(255),
  nationalId: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  address: z.string().optional(),
  hireDate: z.string().optional(),
  areaIds: z.array(z.string().uuid()).default([]),
});

type CreateAgentFormData = z.infer<typeof createAgentSchema>;

type CreateAgentResponse = {
  data?: {
    agent?: {
      fullName?: string;
      agentCode?: string;
      user?: { email?: string };
    };
    credentials?: { username: string; password: string };
  };
};

export default function CreateAgentForm() {
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

  const form = useForm<CreateAgentFormData>({
    resolver: zodResolver(createAgentSchema),
    defaultValues: {
      fullName: '',
      nationalId: '',
      phone: '',
      email: '',
      address: '',
      hireDate: '',
      areaIds: [],
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateAgentFormData) => {
      const payload = {
        fullName: data.fullName,
        nationalId: data.nationalId || undefined,
        phone: data.phone || undefined,
        email: data.email?.trim() || undefined,
        address: data.address || undefined,
        hireDate: data.hireDate ? new Date(data.hireDate).toISOString() : undefined,
        areaIds: data.areaIds,
      };
      const response = await apiFetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json();
        const e = new Error(err.error?.message || 'Failed to create agent') as Error & {
          code?: string;
        };
        e.code = err.error?.code;
        throw e;
      }

      return response.json() as Promise<CreateAgentResponse>;
    },
    onSuccess: (result) => {
      const credentials = result?.data?.credentials;
      const agent = result?.data?.agent;

      if (credentials) {
        const content = [
          'DCMS Agent Account Credentials',
          '-----------------------------',
          `Agent Name: ${agent?.fullName || form.getValues('fullName')}`,
          `Agent Code: ${agent?.agentCode || '-'}`,
          `Username: ${credentials.username}`,
          `Email: ${agent?.user?.email || form.getValues('email')}`,
          `Password: ${credentials.password}`,
          '',
          'You can login with either username or email and password.',
          'Important: Change this password after first login.',
        ].join('\n');

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `agent-credentials-${credentials.username}.txt`;
        link.click();
        URL.revokeObjectURL(url);
      }

      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast.success(t('pages.agents.agentCreatedSuccess'));
      if (credentials) {
        toast.success(t('pages.agents.credentialsDownloadedSuccess'));
      }
      router.push('/agents');
    },
    onError: (error: Error & { code?: string }) => {
      const msg =
        error.code === 'AGENT_ALREADY_EXISTS'
          ? t('pages.agents.agentAlreadyExists')
          : (error.message || t('pages.agents.createFailed'));
      toast.error(msg);
    },
  });

  const onSubmit = (data: CreateAgentFormData) => {
    createMutation.mutate(data);
  };

  const isLoading = createMutation.isPending;
  const areas = areasData || [];
  const availableAreas = areas.filter(
    (a: { id: string; name: string; code: string; _count?: { agentAssignments?: number } }) =>
      (a._count?.agentAssignments ?? 0) === 0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('pages.agents.createNewAccount')}</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          {t('pages.agents.createNewAccountDesc')}
        </p>
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
                    <FormLabel>{t('common.labels.email')} *</FormLabel>
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

            <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-4 text-sm text-muted-foreground">
              {t('pages.agents.autoCredentialsInfo')}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
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
                name="hireDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('pages.agents.hireDate')}</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        disabled={isLoading}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                      {availableAreas.map((area: { id: string; name: string; code: string }) => (
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
                      {areas.length > 0 && availableAreas.length === 0 && (
                        <div className="text-muted-foreground text-sm text-center py-4">
                          {t('pages.agents.allAreasAssigned')}
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
                {t('pages.agents.createAgent')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
