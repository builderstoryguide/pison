'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create collection area');
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
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update collection area');
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
          {isEditMode ? 'Edit Collection Area' : 'Create New Collection Area'}
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
                    <FormLabel>Code *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ZONE-A"
                        {...field}
                        disabled={isEditMode || isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Unique code for the collection area (e.g., ZONE-A, ZONE-B)
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
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Zone A - Downtown"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Display name for the collection area
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Description of the collection area..."
                      {...field}
                      disabled={isLoading}
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional description of the collection area
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
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Yaoundé"
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
                    <FormLabel>Region</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Centre"
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
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Active areas can be assigned to agents and used for collections
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
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                {isEditMode ? 'Update Area' : 'Create Area'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
