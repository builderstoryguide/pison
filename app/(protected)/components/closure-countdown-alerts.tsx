'use client';

import { useEffect, useRef } from 'react';
import { useSessionStatus } from '@/hooks/use-session-status';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function ClosureCountdownAlerts() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useSessionStatus();
  const firedRef = useRef({ m30: false, m15: false, m5: false });

  useEffect(() => {
    firedRef.current = { m30: false, m15: false, m5: false };
  }, [data?.effectiveClosureAt, data?.session?.sessionDate]);

  useEffect(() => {
    if (isLoading || isError || !data?.effectiveClosureAt || !data.isOpen) return;

    const target = new Date(data.effectiveClosureAt).getTime();
    const check = () => {
      const now = Date.now();
      const remainingMs = target - now;
      if (remainingMs <= 0) return;

      const remainingMin = remainingMs / 60000;
      const d = new Date();
      const dk = dayKey(d);
      const s30 = `closureAlert30-${dk}`;
      const s15 = `closureAlert15-${dk}`;
      const s5 = `closureAlert5-${dk}`;

      if (remainingMin <= 30 && remainingMin > 15 && !sessionStorage.getItem(s30)) {
        sessionStorage.setItem(s30, '1');
        firedRef.current.m30 = true;
        const timeStr = new Date(target).toLocaleTimeString(undefined, { timeStyle: 'short' });
        toast.warning(
          t('pages.closureAlert.minutes30', {
            defaultValue: 'Daily closure is in about 30 minutes ({{time}}).',
            time: timeStr,
          }),
          { duration: 15000 }
        );
      }
      if (remainingMin <= 15 && remainingMin > 5 && !sessionStorage.getItem(s15)) {
        sessionStorage.setItem(s15, '1');
        firedRef.current.m15 = true;
        const timeStr = new Date(target).toLocaleTimeString(undefined, { timeStyle: 'short' });
        toast.warning(
          t('pages.closureAlert.minutes15', {
            defaultValue: 'Daily closure is in about 15 minutes ({{time}}).',
            time: timeStr,
          }),
          { duration: 15000 }
        );
      }
      if (remainingMin <= 5 && remainingMin > 0 && !sessionStorage.getItem(s5)) {
        sessionStorage.setItem(s5, '1');
        firedRef.current.m5 = true;
        const timeStr = new Date(target).toLocaleTimeString(undefined, { timeStyle: 'short' });
        toast.warning(
          t('pages.closureAlert.minutes5', {
            defaultValue: 'Daily closure is in about 5 minutes ({{time}}).',
            time: timeStr,
          }),
          { duration: 20000 }
        );
      }
    };

    check();
    const id = window.setInterval(check, 30000);
    return () => window.clearInterval(id);
  }, [data?.effectiveClosureAt, data?.isOpen, isLoading, isError, t]);

  return null;
}
