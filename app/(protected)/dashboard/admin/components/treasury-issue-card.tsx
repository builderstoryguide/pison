'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@/hooks/useTranslation';
import { apiFetch } from '@/lib/api';
import { formatCurrency } from '@/lib/helpers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Landmark } from 'lucide-react';
import { toast } from 'sonner';

export function TreasuryIssueCard() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const { data: opData } = useQuery({
    queryKey: ['me-operating-account'],
    queryFn: async () => {
      const res = await apiFetch('/api/me/operating-account');
      if (!res.ok) return null;
      const json = await res.json();
      return json.data as {
        availableBalance: string;
        accountNumber: string;
      } | null;
    },
  });

  const issueMutation = useMutation({
    mutationFn: async (payload: { amount: number; description?: string }) => {
      const res = await apiFetch('/api/treasury/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error?.message || 'Issue failed');
      }
      return json;
    },
    onSuccess: () => {
      toast.success(t('pages.treasury.issueSuccess'));
      setAmount('');
      setDescription('');
      queryClient.invalidateQueries({ queryKey: ['me-operating-account'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const available = opData?.availableBalance ? parseFloat(opData.availableBalance) : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base font-medium">{t('pages.treasury.title')}</CardTitle>
          <CardDescription>{t('pages.treasury.description')}</CardDescription>
        </div>
        <Landmark className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        {opData ? (
          <p className="text-sm text-muted-foreground">
            {t('pages.treasury.currentFloat')}:{' '}
            <span className="font-semibold text-foreground">
              {formatCurrency(Number.isFinite(available) ? available : 0)}
            </span>
            {opData.accountNumber ? (
              <span className="block text-xs mt-1 font-mono">{opData.accountNumber}</span>
            ) : null}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">{t('pages.treasury.noOperatingAccount')}</p>
        )}
        <div className="grid gap-2">
          <Label htmlFor="treasury-amount">{t('pages.treasury.amount')}</Label>
          <Input
            id="treasury-amount"
            type="number"
            min={0}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="treasury-desc">{t('pages.treasury.noteOptional')}</Label>
          <Textarea
            id="treasury-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder={t('pages.treasury.notePlaceholder')}
          />
        </div>
        <Button
          type="button"
          disabled={
            issueMutation.isPending ||
            !amount ||
            parseFloat(amount) <= 0 ||
            !Number.isFinite(parseFloat(amount))
          }
          onClick={() => {
            const n = parseFloat(amount);
            issueMutation.mutate({
              amount: n,
              description: description.trim() || undefined,
            });
          }}
        >
          {issueMutation.isPending && <Loader2 className="size-4 animate-spin mr-2" />}
          {t('pages.treasury.issueCta')}
        </Button>
      </CardContent>
    </Card>
  );
}
