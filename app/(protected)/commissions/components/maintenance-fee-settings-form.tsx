'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { useTranslation } from '@/hooks/useTranslation';
import { isManagerRole } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoaderCircleIcon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useState, useEffect } from 'react';

export function MaintenanceFeeSettingsForm() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const canManage = isManagerRole(session ?? null);
  const [billingDay, setBillingDay] = useState('1');
  const [automationEnabled, setAutomationEnabled] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['system-maintenance-fee-settings'],
    queryFn: async () => {
      const response = await apiFetch('/api/user-management/settings/maintenance-fee');
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error?.message || 'Failed to load settings');
      }
      const payload = await response.json();
      return payload?.data as {
        maintenanceFeeBillingDay: number;
        maintenanceFeeAutomationEnabled: boolean;
        timezone: string;
      };
    },
    enabled: canManage,
  });

  useEffect(() => {
    if (!canManage) {
      setBillingDay('1');
      setAutomationEnabled(false);
      return;
    }
    if (data) {
      setBillingDay(String(data.maintenanceFeeBillingDay ?? 1));
      setAutomationEnabled(Boolean(data.maintenanceFeeAutomationEnabled));
    }
  }, [canManage, data]);

  const mutation = useMutation({
    mutationFn: async () => {
      const day = parseInt(billingDay, 10);
      if (!Number.isFinite(day) || day < 1 || day > 28) {
        throw new Error(t('pages.settings.maintenanceFeeBillingDayInvalid'));
      }
      const response = await apiFetch('/api/user-management/settings/maintenance-fee', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maintenanceFeeBillingDay: day,
          maintenanceFeeAutomationEnabled: automationEnabled,
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error?.message || t('pages.settings.maintenanceFeeUpdateFailed'));
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success(t('pages.settings.maintenanceFeeUpdateSuccess'));
      queryClient.invalidateQueries({ queryKey: ['system-maintenance-fee-settings'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || t('pages.settings.maintenanceFeeUpdateFailed'));
    },
  });

  if (!canManage) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <CardTitle>{t('pages.settings.maintenanceFeeTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="py-6">
        <div className="space-y-6 lg:max-w-[600px]">
          <div className="flex items-center justify-between rounded-lg bg-accent/60 p-4">
            <div className="space-y-0.5">
              <Label htmlFor="maintenanceFeeAutomation">
                {t('pages.settings.maintenanceFeeAutomationLabel')}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('pages.settings.maintenanceFeeAutomationDesc')}
              </p>
            </div>
            <Switch
              id="maintenanceFeeAutomation"
              checked={automationEnabled}
              onCheckedChange={setAutomationEnabled}
              disabled={isLoading || mutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maintenanceFeeBillingDay">
              {t('pages.settings.maintenanceFeeBillingDayLabel')}
            </Label>
            <Input
              id="maintenanceFeeBillingDay"
              type="number"
              min={1}
              max={28}
              value={billingDay}
              onChange={(e) => setBillingDay(e.target.value)}
              disabled={isLoading || mutation.isPending}
            />
            <p className="text-sm text-muted-foreground">
              {t('pages.settings.maintenanceFeeBillingDayDesc')}
            </p>
          </div>

          <p className="text-sm text-muted-foreground">
            {t('pages.settings.maintenanceFeeTimezoneHint')}
          </p>

          <div className="flex justify-end">
            <Button
              type="button"
              disabled={mutation.isPending || isLoading}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending && (
                <LoaderCircleIcon className="animate-spin me-2 size-4" aria-hidden />
              )}
              {t('pages.settings.saveMaintenanceFeeSettings')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
