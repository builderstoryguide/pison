import { toDate } from 'date-fns-tz';

const HH_MM = /^([01]?\d|2[0-3]):([0-5]\d)$/;

/**
 * Effective closure instant for alerts: override wins, else session calendar date + default time in business timezone.
 */
export function computeEffectiveClosureAt(
  sessionDate: Date,
  plannedClosureAt: Date | null | undefined,
  defaultDailyClosureTime: string,
  timeZone: string
): Date | null {
  if (plannedClosureAt) {
    return plannedClosureAt;
  }
  const m = defaultDailyClosureTime.trim().match(HH_MM);
  if (!m) return null;
  const h = parseInt(m[1]!, 10);
  const mi = parseInt(m[2]!, 10);
  const y = sessionDate.getUTCFullYear();
  const mo = sessionDate.getUTCMonth() + 1;
  const d = sessionDate.getUTCDate();
  const dateStr = `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const isoLocal = `${dateStr}T${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}:00`;
  try {
    const parsed = toDate(isoLocal, { timeZone });
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    const parsed = toDate(isoLocal, { timeZone: 'UTC' });
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
}
