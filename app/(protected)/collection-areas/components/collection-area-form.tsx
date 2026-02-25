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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const collectionAreaSchema = z.object({
  code: z.string().min(1, 'Code is required').max(20, 'Code must be 20 characters or less'),
  name: z.string().min(1, 'Name is required').max(255, 'Name must be 255 characters or less'),
  description: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

type CollectionAreaFormData = z.infer<typeof collectionAreaSchema>;

interface CollectionAreaFormProps {
  areaId?: string;
}

export default function CollectionAreaForm({ areaId }: CollectionAreaFormProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditMode = !!areaId;

  // Fetch area data if editing
  const { data: areaData, isLoading: isLoadingArea } = useQuery({
    queryKey: ['collection-area', areaId],
    queryFn: async () => {
      const response = await apiFetch(`/api/collection-areas/${areaId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch collection area');
      }
      const result = await response.json();
      return result.data;
    },
    enabled: isEditMode,
  });

  const form = useForm<CollectionAreaFormData>({
    resolver: zodResolver(collectionAreaSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      city: '',
      region: '',
      status: 'ACTIVE',
    },
  });

  // Populate form when area data is loaded
  useEffect(() => {
    if (areaData) {
      form.reset({
        code: areaData.code,
        name: areaData.name,
        description: areaData.description || '',
        city: areaData.city || '',
        region: areaData.region || '',
        status: areaData.status,
      });
    }
  }, [areaData, form]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: CollectionAreaFormData) => {
      const response = await apiFetch('/api/collection-areas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const err = body?.error;
        const msg = err?.message || 'Failed to create collection area';
        const code = err?.code;
        throw new Error(code ? `[${code}] ${msg}` : msg);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection-areas'] });
      toast.success('Collection area created successfully');
      router.push('/collection-areas');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create collection area');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: CollectionAreaFormData) => {
      const response = await apiFetch(`/api/collection-areas/${areaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const err = body?.error;
        const msg = err?.message || 'Failed to update collection area';
        const code = err?.code;
        throw new Error(code ? `[${code}] ${msg}` : msg);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection-areas'] });
      queryClient.invalidateQueries({ queryKey: ['collection-area', areaId] });
      toast.success('Collection area updated successfully');
      router.push('/collection-areas');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update collection area');
    },
  });

  const onSubmit = (data: CollectionAreaFormData) => {
    if (isEditMode) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  if (isEditMode && isLoadingArea) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditMode ? t('pages.collectionAreas.editCollectionArea') : t('pages.collectionAreas.createNewArea')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('pages.collectionAreas.code')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('common.placeholders.areaCode')}
                        {...field}
                        disabled={isEditMode || isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      {t('pages.collectionAreas.codeDesc')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('pages.collectionAreas.name')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('common.placeholders.areaName')}
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      {t('pages.collectionAreas.nameDesc')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pages.collectionAreas.description')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('common.placeholders.areaDescription')}
                      {...field}
                      disabled={isLoading}
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('pages.collectionAreas.descriptionDesc')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-6 md:grid-cols-2">
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

              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('common.labels.region')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('common.placeholders.region')}
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {t('pages.collectionAreas.statusDesc')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
                {isEditMode ? t('pages.collectionAreas.updateArea') : t('pages.collectionAreas.createArea')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
