'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { useDebouncedSearch } from '@/hooks/use-debounced-search';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { toast } from 'sonner';
import { Loader2, ChevronsUpDown, UserPlus } from 'lucide-react';

const linkAgentSchema = z.object({
  userId: z.string().uuid('Select a user to link'),
  fullName: z.string().min(1),
  nationalId: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  hireDate: z.string().optional(),
  areaIds: z.array(z.string().uuid()).default([]),
});

type LinkAgentFormData = z.infer<typeof linkAgentSchema>;

interface AvailableUser {
  id: string;
  name: string | null;
  email: string;
  username?: string | null;
}

export default function LinkAgentForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchValue] = useDebouncedSearch('', 300);
  const [pickerOpen, setPickerOpen] = useState(false);

  const { data: areasData } = useQuery({
    queryKey: ['collection-areas'],
    queryFn: async () => {
      const response = await apiFetch('/api/collection-areas?status=ACTIVE');
      if (!response.ok) return [];
      const result = await response.json();
      return result.data || [];
    },
  });

  const { data: availableUsersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['agents-available-users', searchQuery],
    queryFn: async () => {
      const url = searchQuery
        ? `/api/agents/available-users?q=${encodeURIComponent(searchQuery)}`
        : '/api/agents/available-users';
      const response = await apiFetch(url);
      if (!response.ok) return [];
      const result = await response.json();
      return (result.data || []) as AvailableUser[];
    },
    enabled: pickerOpen,
  });

  const availableUsers = availableUsersData ?? [];

  const form = useForm<LinkAgentFormData>({
    resolver: zodResolver(linkAgentSchema),
    defaultValues: {
      userId: '',
      fullName: '',
      nationalId: '',
      phone: '',
      email: '',
      address: '',
      hireDate: '',
      areaIds: [],
    },
  });

  const selectedUserId = form.watch('userId');
  const selectedUser = availableUsers.find((u) => u.id === selectedUserId);

  const handleUserSelect = useCallback(
    (user: AvailableUser) => {
      form.setValue('userId', user.id);
      form.setValue('fullName', user.name || user.email);
      form.setValue('email', user.email);
      setPickerOpen(false);
    },
    [form]
  );

  const createMutation = useMutation({
    mutationFn: async (data: LinkAgentFormData) => {
      const payload = {
        userId: data.userId,
        fullName: data.fullName,
        nationalId: data.nationalId || undefined,
        phone: data.phone || undefined,
        email: data.email || undefined,
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
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to link agent');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['agents-available-users'] });
      toast.success(t('pages.agents.agentLinkedSuccess'));
      router.push('/agents');
    },
    onError: (error: Error) => {
      toast.error(error.message || t('pages.agents.createFailed'));
    },
  });

  const onSubmit = (data: LinkAgentFormData) => {
    createMutation.mutate(data);
  };

  const isLoading = createMutation.isPending;
  const areas = areasData || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('pages.agents.linkExistingUser')}</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          {t('pages.agents.selectUserDesc')}
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="userId"
              render={({ field: _ }) => (
                <FormItem>
                  <FormLabel>{t('pages.agents.selectExistingUser')} *</FormLabel>
                  <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={pickerOpen}
                          disabled={isLoading}
                          className="w-full justify-between font-normal"
                        >
                          {selectedUser ? (
                            <span>
                              {selectedUser.name || selectedUser.email}{' '}
                              <span className="text-muted-foreground">
                                ({selectedUser.email})
                              </span>
                            </span>
                          ) : (
                            t('pages.agents.selectExistingUser')
                          )}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder={t('pages.agents.searchUserPlaceholder')}
                          onValueChange={setSearchValue}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {isLoadingUsers ? (
                              <div className="flex items-center justify-center py-6">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                              </div>
                            ) : (
                              t('pages.agents.noUsersMatchSearch')
                            )}
                          </CommandEmpty>
                          <CommandGroup>
                            {availableUsers.map((user) => (
                              <CommandItem
                                key={user.id}
                                value={user.id}
                                onSelect={() => handleUserSelect(user)}
                              >
                                {user.name || user.email} ({user.email})
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!selectedUserId && availableUsers.length === 0 && !isLoadingUsers && pickerOpen && (
              <div className="rounded-lg border border-dashed p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  {t('pages.agents.noUsersAvailable')}
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/user-management/users">
                    <UserPlus className="mr-2 h-4 w-4" />
                    {t('pages.agents.createUserFirst')}
                  </Link>
                </Button>
              </div>
            )}

            {selectedUserId && (
              <>
                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('common.labels.fullName')} *</FormLabel>
                        <FormControl>
                          <Input {...field} disabled readOnly className="bg-muted" />
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
                          <Input {...field} disabled readOnly className="bg-muted" />
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
              </>
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
              <Button
                type="submit"
                disabled={isLoading || !selectedUserId}
              >
                {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                {t('pages.agents.linkAgent')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
