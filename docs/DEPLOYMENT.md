# Deployment

## Automatic Commission Calculation (Self-hosted)

The custom server (`server.js`) can run a scheduled job to calculate monthly commissions automatically at the end of each month.

**To enable:**
1. Set `ENABLE_COMMISSION_CRON=1` in your environment.
2. Set `CRON_SECRET` to a secure random string (e.g. `openssl rand -hex 32`).
3. Ensure `NEXTAUTH_URL` is set to your app's base URL (required for the cron to call the internal API).

The job runs at **00:05 on the 1st of each month** and calculates commissions for the previous month.

**Note:** In development (`npm run dev`), the cron is disabled by default. Use `ENABLE_COMMISSION_CRON=1` to test. On Vercel or serverless, use an external cron service (e.g. cron-job.org) to call `POST /api/cron/commission` with `X-Cron-Secret` header and body `{ "period": "YYYY-MM" }`.

---

## Response Compression

### Self-hosted (custom server)

When running `npm run start`, the app uses a custom Node.js server (`server.js`) that applies gzip compression to responses:

- **Level**: 6 (balance of speed and compression)
- **Threshold**: 1KB (responses smaller than 1KB are not compressed)
- **Skipped**: Images and already-compressed formats (handled by the `compression` package defaults)

This reduces bandwidth for API responses and improves performance over slow networks.

### Vercel

Vercel handles response compression automatically. No additional configuration is required.

### Reverse proxy (nginx, Caddy)

If you run Next.js behind nginx or Caddy, you can disable the built-in compression and let the proxy handle it:

1. Set `compress: false` in `next.config.mjs` if using the custom server, or use `next start` (which has built-in gzip).
2. Configure gzip in your proxy for `/api/*` and static assets.

Example nginx:

```nginx
gzip on;
gzip_types application/json text/plain text/css application/javascript;
gzip_min_length 1024;
```

---

## Clock sync (NTP) for database and application hosts

Financial timestamps and daily session boundaries use **PostgreSQL** as the source of truth for “now” and calendar-day truncation (`SELECT NOW()`, `date_trunc('day', CURRENT_TIMESTAMP)`). Operational reporting ties new transactions to `DailySession` where possible.

**Production expectations:**

1. Run **NTP** (or your platform’s time sync) on every host that runs **PostgreSQL** and every host that runs the **Next.js / Node** application so wall clocks stay aligned.
2. Set PostgreSQL’s session **TimeZone** deliberately (e.g. to your institution’s business timezone) so `date_trunc('day', …)` matches how you open and close daily sessions.
3. Avoid manual large clock steps on production servers. If you restore or copy data, preserve original `createdAt` / `approvedAt` values—do not “fix” history by rewriting transaction timestamps.

Misaligned clocks between app and DB are less of an issue for new writes because approval times and session-day logic consult the database clock; remaining app-only `new Date()` uses are mostly non-financial or display-related.
