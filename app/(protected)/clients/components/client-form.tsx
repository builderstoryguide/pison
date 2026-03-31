'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { formatNumber } from '@/lib/helpers';
import { isManagerRole } from '@/lib/auth-client';

const clientSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(255),
  nationalId: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  areaId: z.string().uuid('Please select a collection area'),
  agentId: z.union([z.string().uuid(), z.literal(''), z.literal('none')]).optional(),
  isCommissionExempt: z.boolean().default(false),
  accountNatureId: z.string().uuid('Please select an account type').optional(),
  documentChecklist: z.record(z.string(), z.boolean()).optional().default({}),
  openingAmount: z.number().min(0).optional(),
  customInterestRate: z.number().min(0).max(1).optional(),
  commissionRatePercent: z.number().min(0).max(100).nullable().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormProps {
  clientId?: string;
}

export default function ClientForm({ clientId }: ClientFormProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const isEditMode = !!clientId;
  const canEditCommissionFields = isManagerRole(session ?? null);

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

  // Fetch agents for assignment
  const { data: agentsData } = useQuery({
    queryKey: ['agents', 'ACTIVE'],
    queryFn: async () => {
      const response = await apiFetch('/api/agents?status=ACTIVE');
      if (!response.ok) return [];
      const result = await response.json();
      return result.data || [];
    },
  });

  // Fetch account natures (for create only)
  const { data: accountNaturesData } = useQuery({
    queryKey: ['account-natures'],
    queryFn: async () => {
      const response = await apiFetch('/api/account-natures');
      if (!response.ok) return [];
      const result = await response.json();
      return result.data || [];
    },
    enabled: !isEditMode,
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
      agentId: '',
      isCommissionExempt: false,
      accountNatureId: '',
      documentChecklist: {} as Record<string, boolean>,
      openingAmount: undefined,
      customInterestRate: undefined,
      commissionRatePercent: null,
    },
  });

  const selectedNatureId = form.watch('accountNatureId');

  // Fetch selected account nature details (for required documents)
  const { data: accountNatureDetails } = useQuery({
    queryKey: ['account-nature', selectedNatureId],
    queryFn: async () => {
      if (!selectedNatureId) return null;
      const response = await apiFetch(`/api/account-natures/${selectedNatureId}`);
      if (!response.ok) return null;
      const result = await response.json();
      return result.data;
    },
    enabled: !!selectedNatureId && !isEditMode,
  });

  const requiredDocs = useMemo(
    () => accountNatureDetails?.requiredDocuments?.map((rd: { documentType: unknown }) => rd.documentType) ?? [],
    [accountNatureDetails]
  );

  const minOpening = useMemo(() => {
    if (!accountNatureDetails) return 0;
    const min = accountNatureDetails.minOpeningContribution ?? accountNatureDetails.minBalance;
    return min ? Number(min) : 0;
  }, [accountNatureDetails]);

  const needsCustomInterest = accountNatureDetails?.interestRateNegotiable ?? false;

  // Fetch client data if editing
  const { data: clientData, isLoading: isLoadingClient } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const response = await apiFetch(`/api/clients/${clientId}`);
      if (!response.ok) {
          throw new Error(t('pages.clients.fetchFailed'));
      }
      const result = await response.json();
      return result.data;
    },
    enabled: isEditMode,
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
        agentId: clientData.assignedAgent?.id || '',
        isCommissionExempt: clientData.isCommissionExempt || false,
        commissionRatePercent:
          clientData.commissionRateOverride === null ||
          clientData.commissionRateOverride === undefined
            ? null
            : Number(clientData.commissionRateOverride) * 100,
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
        const body = await response.json().catch(() => ({}));
        const err = new Error(
          body.error?.message || t('pages.clients.createFailed')
        ) as Error & { details?: Array<{ field: string; message: string }> };
        err.details = body.error?.details;
        throw err;
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success(t('pages.clients.clientCreatedSuccess'));
      router.push('/clients');
    },
    onError: (error: Error) => {
      const details = (error as Error & { details?: Array<{ field: string; message: string }> })
        .details;
      if (Array.isArray(details) && details.length > 0) {
        for (const d of details) {
          toast.error(d.message);
        }
        return;
      }
      toast.error(error.message || t('pages.clients.createFailed'));
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
        throw new Error(error.error?.message || t('pages.clients.updateFailed'));
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client', clientId] });
      toast.success(t('pages.clients.clientUpdatedSuccess'));
      router.push('/clients');
    },
    onError: (error: Error) => {
      toast.error(error.message || t('pages.clients.updateFailed'));
    },
  });

  const onSubmit = (data: ClientFormData) => {
    if (isEditMode) {
      const payload = { ...data };
      if (!payload.agentId || payload.agentId === 'none') delete payload.agentId;
      delete payload.accountNatureId;
      delete payload.documentChecklist;
      delete payload.openingAmount;
      delete payload.customInterestRate;
      updateMutation.mutate(payload);
    } else {
      if (!data.accountNatureId) {
        toast.error(t('pages.clients.selectAccountTypeError'));
        return;
      }
      const payload = {
        ...data,
        accountNatureId: data.accountNatureId,
        documentChecklist: data.documentChecklist ?? {},
        openingAmount: data.openingAmount,
        customInterestRate: data.customInterestRate,
      };
      delete payload.commissionRatePercent;
      if (!payload.agentId || payload.agentId === 'none') delete payload.agentId;
      createMutation.mutate(payload);
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
  const agents = agentsData || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditMode ? t('pages.clients.editClient') : t('pages.clients.createNewClient')}
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
                      {areas.map((area: { id: string; name?: string; code?: string }) => (
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

            {!isEditMode && (
              <>
                <FormField
                  control={form.control}
                  name="accountNatureId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('pages.clients.accountType')} *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('pages.clients.selectAccountType')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(accountNaturesData || []).map((n: { id: string; name: string }) => (
                            <SelectItem key={n.id} value={n.id}>
                              {n.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {t('pages.clients.accountTypeDesc')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {requiredDocs.length > 0 && (
                  <FormField
                    control={form.control}
                    name="documentChecklist"
                    render={() => (
                      <FormItem>
                        <FormLabel>{t('pages.clients.requiredDocuments')}</FormLabel>
                        <FormDescription>
                          {t('pages.clients.requiredDocumentsDesc')}
                        </FormDescription>
                        <div className="space-y-2 rounded-lg border p-4">
                          {requiredDocs.map((doc: { code: string; name: string }) => (
                            <FormField
                              key={doc.code}
                              control={form.control}
                              name={`documentChecklist.${doc.code}`}
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={!!field.value}
                                      onCheckedChange={(checked) => field.onChange(!!checked)}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">{doc.name}</FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {minOpening > 0 && (
                  <FormField
                    control={form.control}
                    name="openingAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('pages.clients.openingAmountXof')} *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={minOpening}
                            step="1"
                            placeholder={t('pages.clients.minimumXof', { amount: minOpening })}
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => {
                              const v = e.target.value ? Number(e.target.value) : undefined;
                              field.onChange(v);
                            }}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormDescription>
                          {t('pages.clients.minimumOpeningAmount', { amount: formatNumber(minOpening) })}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {needsCustomInterest && (
                  <FormField
                    control={form.control}
                    name="customInterestRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('pages.clients.interestRateNegotiated')} *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            max={1}
                            step="0.01"
                            placeholder={t('pages.clients.interestRateExample')}
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => {
                              const v = e.target.value ? Number(e.target.value) : undefined;
                              field.onChange(v);
                            }}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormDescription>
                          {t('pages.clients.interestRateNegotiatedDesc')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </>
            )}

            <FormField
              control={form.control}
              name="agentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.labels.agent')}</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}
                    value={field.value || 'none'}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('common.placeholders.selectAgent')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">
                        {t('common.labels.none')}
                      </SelectItem>
                      {agents.map((agent: { id: string; fullName: string }) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t('pages.clients.agentDesc')}
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

            {isEditMode && canEditCommissionFields && (
              <FormField
                control={form.control}
                name="commissionRatePercent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('pages.clients.commissionRatePercent')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        placeholder={t('pages.clients.commissionRatePercentPlaceholder')}
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === '' ? null : Number(value));
                        }}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      {t('pages.clients.commissionRatePercentDescription')}
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
                {isEditMode ? t('pages.clients.updateClient') : t('pages.clients.createClient')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
