/**
 * Custom Next.js server with gzip compression
 * Use for self-hosted deployments. Vercel handles compression automatically.
 *
 * Run: npm run start (or node server.js)
 *
 * Scheduled jobs (self-hosted only):
 * - Commission calculation: runs at 00:05 on the 1st of each month for the previous month.
 *   Set ENABLE_COMMISSION_CRON=1 to enable. Disabled in development by default.
 * - Monthly account maintenance fees: daily POST to /api/cron/maintenance-fees (billing day is enforced server-side).
 *   Set ENABLE_MAINTENANCE_FEE_CRON=1 and CRON_SECRET to enable.
 */

const { createServer } = require('http');
const next = require('next');
const compression = require('compression');
const cron = require('node-cron');

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const compress = compression({ level: 6, threshold: 1024 });

function scheduleCommissionCron() {
  const enabled = process.env.ENABLE_COMMISSION_CRON === '1' || (!dev && !process.env.DISABLE_COMMISSION_CRON);
  const secret = process.env.CRON_SECRET;
  if (!enabled || !secret) {
    if (enabled && !secret) {
      console.warn('[Cron] ENABLE_COMMISSION_CRON=1 but CRON_SECRET not set. Commission cron disabled.');
    }
    return;
  }

  const baseUrl = process.env.NEXTAUTH_URL || `http://localhost:${port}`;
  // Run at 00:05 on the 1st of each month
  cron.schedule('5 0 1 * *', async () => {
    try {
      const now = new Date();
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const period = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
      const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/cron/commission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Cron-Secret': secret },
        body: JSON.stringify({ period }),
      });
      if (res.ok) {
        console.log(`[Cron] Commission calculation completed for ${period}`);
      } else {
        const text = await res.text();
        console.error(`[Cron] Commission calculation failed for ${period}:`, res.status, text);
      }
    } catch (err) {
      console.error('[Cron] Commission calculation failed:', err);
    }
  });
  console.log('[Cron] Commission calculation scheduled (1st of each month at 00:05)');
}

function scheduleLoanReminderCron() {
  const enabled = process.env.ENABLE_LOAN_REMINDER_CRON === '1' || (!dev && !process.env.DISABLE_LOAN_REMINDER_CRON);
  const secret = process.env.CRON_SECRET;
  if (!enabled || !secret) {
    if (enabled && !secret) {
      console.warn('[Cron] Loan reminder cron enabled but CRON_SECRET not set. Loan reminder cron disabled.');
    }
    return;
  }

  const baseUrl = process.env.NEXTAUTH_URL || `http://localhost:${port}`;
  // Run every day at 08:00
  cron.schedule('0 8 * * *', async () => {
    try {
      const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/cron/loan-reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Cron-Secret': secret },
      });
      if (res.ok) {
        console.log('[Cron] Loan maturity reminders completed');
      } else {
        const text = await res.text();
        console.error('[Cron] Loan maturity reminders failed:', res.status, text);
      }
    } catch (err) {
      console.error('[Cron] Loan maturity reminders failed:', err);
    }
  });
  console.log('[Cron] Loan maturity reminders scheduled (daily at 08:00)');
}

function scheduleMaintenanceFeeCron() {
  const enabled =
    process.env.ENABLE_MAINTENANCE_FEE_CRON === '1' ||
    (!dev && !process.env.DISABLE_MAINTENANCE_FEE_CRON);
  const secret = process.env.CRON_SECRET;
  if (!enabled || !secret) {
    if (enabled && !secret) {
      console.warn('[Cron] ENABLE_MAINTENANCE_FEE_CRON=1 but CRON_SECRET not set. Maintenance fee cron disabled.');
    }
    return;
  }

  const baseUrl = process.env.NEXTAUTH_URL || `http://localhost:${port}`;
  // Daily: server decides whether today is the configured billing day in institution timezone
  cron.schedule('5 1 * * *', async () => {
    try {
      const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/cron/maintenance-fees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Cron-Secret': secret },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const j = await res.json().catch(() => ({}));
        if (j.skipped) {
          console.log('[Cron] Maintenance fees skipped:', j.reason || j.message || 'skipped');
        } else {
          console.log('[Cron] Maintenance fees run completed:', j.data || j.message);
        }
      } else {
        const text = await res.text();
        console.error('[Cron] Maintenance fees failed:', res.status, text);
      }
    } catch (err) {
      console.error('[Cron] Maintenance fees failed:', err);
    }
  });
  console.log('[Cron] Maintenance fees scheduled (daily at 01:05 server local time)');
}

app.prepare().then(() => {
  const server = createServer((req, res) => {
    compress(req, res, () => {
      handle(req, res);
    });
  });

  server.on('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(
      `> Server listening at http://localhost:${port} as ${dev ? 'development' : 'production'}`
    );
    scheduleCommissionCron();
    scheduleLoanReminderCron();
    scheduleMaintenanceFeeCron();
  });
});
