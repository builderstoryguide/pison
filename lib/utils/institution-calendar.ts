/**
 * Calendar date parts in an IANA timezone (e.g. SystemSetting.timezone).
 */

export function getZonedYmd(date: Date, timeZone: string): { y: number; m: number; d: number } {
  const s = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  const [y, m, d] = s.split('-').map((x) => parseInt(x, 10));
  return { y, m, d };
}

export function periodFromZonedYmd(y: number, m: number): string {
  return `${y}-${String(m).padStart(2, '0')}`;
}

/** Last calendar day of month `month` (1–12). */
export function lastDayOfCalendarMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Clamp configured billing day to a valid day in that month (e.g. 31 → 28 in February). */
export function effectiveBillingDayOfMonth(
  billingDay: number,
  year: number,
  month: number,
): number {
  const last = lastDayOfCalendarMonth(year, month);
  return Math.min(Math.max(1, billingDay), last);
}

export function isMaintenanceBillingDay(
  date: Date,
  timeZone: string,
  configuredDay: number,
): boolean {
  const { y, m, d } = getZonedYmd(date, timeZone);
  const target = effectiveBillingDayOfMonth(configuredDay, y, m);
  return d === target;
}
