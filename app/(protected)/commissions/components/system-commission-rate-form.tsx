'use client';

import { useState } from 'react';
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

export function SystemCommissionRateForm() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [commissionRatePercent, setCommissionRatePercent] = useState<string>('');
  const canManage = isManagerRole(session ?? null);

  const { isLoading: isCommissionRateLoading } = useQuery({
    queryKey: ['system-commission-rate'],
    queryFn: async () => {
      const response = await apiFetch('/api/user-management/settings/commission-rate');
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error?.message || 'Failed to load commission rate');
      }
      const payload = await response.json();
      const rawValue = payload?.data?.commissionRatePercent;
      const normalized = typeof rawValue === 'number' ? rawValue : 0;
      setCommissionRatePercent(String(normalized));
      return normalized;
    },
    enabled: canManage,
  });

  const commissionRateMutation = useMutation({
    mutationFn: async (value: string) => {
      const parsed = Number(value);
      if (Number.isNaN(parsed)) {
        throw new Error(t('pages.settings.commissionRateInvalid'));
      }

      const response = await apiFetch('/api/user-management/settings/commission-rate', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commissionRatePercent: parsed }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error?.message || t('pages.settings.commissionRateUpdateFailed'));
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success(t('pages.settings.commissionRateUpdateSuccess'));
      queryClient.invalidateQueries({ queryKey: ['system-commission-rate'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || t('pages.settings.commissionRateUpdateFailed'));
    },
  });

  if (!canManage) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <CardTitle>{t('pages.settings.commissionRateTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="py-6">
        <div className="space-y-4 lg:max-w-[600px]">
          <div className="space-y-2">
            <Label htmlFor="commissionRatePercent">
              {t('pages.settings.commissionRateLabel')}
            </Label>
            <Input
              id="commissionRatePercent"
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={commissionRatePercent}
              onChange={(e) => setCommissionRatePercent(e.target.value)}
              disabled={isCommissionRateLoading || commissionRateMutation.isPending}
            />
            <p className="text-sm text-muted-foreground">
              {t('pages.settings.commissionRateDescription')}
            </p>
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              disabled={commissionRateMutation.isPending || isCommissionRateLoading}
              onClick={() => commissionRateMutation.mutate(commissionRatePercent)}
            >
              {commissionRateMutation.isPending && (
                <LoaderCircleIcon className="animate-spin me-2 size-4" aria-hidden />
              )}
              {t('pages.settings.saveCommissionRate')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
