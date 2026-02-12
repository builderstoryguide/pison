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
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const clientSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(255),
  nationalId: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  areaId: z.string().uuid('Please select a collection area'),
  isCommissionExempt: z.boolean().default(false),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormProps {
  clientId?: string;
}

export default function ClientForm({ clientId }: ClientFormProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isEditMode = !!clientId;

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

  // Fetch client data if editing
  const { data: clientData, isLoading: isLoadingClient } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const response = await apiFetch(`/api/clients/${clientId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch client');
      }
      const result = await response.json();
      return result.data;
    },
    enabled: isEditMode,
  });

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      fullName: '',
      nationalId: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      areaId: '',
      isCommissionExempt: false,
    },
  });

  // Populate form when client data is loaded
  useEffect(() => {
    if (clientData) {
      form.reset({
        fullName: clientData.fullName,
        nationalId: clientData.nationalId || '',
        phone: clientData.phone || '',
        email: clientData.email || '',
        address: clientData.address || '',
        city: clientData.city || '',
        areaId: clientData.areaId,
        isCommissionExempt: clientData.isCommissionExempt || false,
      });
    }
  }, [clientData, form]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      const response = await apiFetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create client');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client created successfully');
      router.push('/clients');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create client');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      const response = await apiFetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update client');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client', clientId] });
      toast.success('Client updated successfully');
      router.push('/clients');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update client');
    },
  });

  const onSubmit = (data: ClientFormData) => {
    if (isEditMode) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  if (isEditMode && isLoadingClient) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditMode ? 'Edit Client' : 'Create New Client'}
        </CardTitle>
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
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('common.labels.city')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('common.placeholders.city')}
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
              name="areaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.labels.collectionArea')} *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('common.placeholders.selectArea')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {areas.map((area: any) => (
                        <SelectItem key={area.id} value={area.id}>
                          {area.name} ({area.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t('pages.clients.collectionAreaDesc')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isCommissionExempt"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      {t('pages.clients.commissionExempt')}
                    </FormLabel>
                    <FormDescription>
                      {t('pages.clients.commissionExemptDesc')}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
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
                {isEditMode ? t('pages.clients.updateClient') : t('pages.clients.createClient')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
