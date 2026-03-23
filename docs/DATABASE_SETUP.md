# Database Setup

This document covers PostgreSQL setup for local development of the DCMS.

## Prerequisites

- PostgreSQL 14+ installed
- Database `dcm_db` created (see `.env.example` for connection string)

## Local PostgreSQL Optimization

For better performance on a dedicated local machine, apply the settings in `config/postgresql-local.conf`.

### Where to Find postgresql.conf

| Platform | Typical Location |
|----------|------------------|
| **Windows** | `C:\Program Files\PostgreSQL\<version>\data\postgresql.conf` |
| **macOS (Homebrew)** | `/opt/homebrew/var/postgresql@<version>/postgresql.conf` or `/usr/local/var/postgres/postgresql.conf` |
| **Linux (apt)** | `/etc/postgresql/<version>/main/postgresql.conf` |
| **Linux (manual)** | `$PGDATA/postgresql.conf` (often `/var/lib/postgresql/data/`) |

### How to Apply the Config

**Option A: Merge settings**

1. Open `postgresql.conf` in an editor.
2. Copy the settings from `config/postgresql-local.conf` into `postgresql.conf`.
3. Comment out or remove any existing lines that conflict (e.g., `shared_buffers`, `work_mem`).
4. Adjust `shared_buffers` and `effective_cache_size` for your RAM (see table below).

**Option B: Include directive**

1. Add this line to `postgresql.conf` (use the absolute path to the project):

   ```
   include = 'C:/path/to/dcm/config/postgresql-local.conf'
   ```

2. On Windows, use forward slashes or escaped backslashes in the path.

### RAM-Dependent Settings

PostgreSQL requires explicit values (not percentages). Use these as a guide:

| RAM | shared_buffers (25%) | effective_cache_size (75%) |
|-----|----------------------|----------------------------|
| 4GB | 1GB                  | 3GB                        |
| 8GB | 2GB                  | 6GB                        |
| 16GB| 4GB                  | 12GB                       |

Edit `config/postgresql-local.conf` or override in `postgresql.conf` to match your machine.

### Restart Required

After changing `shared_buffers` or `effective_cache_size`, restart PostgreSQL:

- **Windows:** Services → PostgreSQL → Restart
- **macOS:** `brew services restart postgresql@<version>`
- **Linux:** `sudo systemctl restart postgresql`

### Verify Settings

Connect with `psql` and run:

```sql
SHOW shared_buffers;
SHOW effective_cache_size;
SHOW work_mem;
SHOW maintenance_work_mem;
SHOW checkpoint_completion_target;
```

## Redis (Optional)

DCMS uses Redis for caching user balances, recent transactions, and placeholders. The app runs without Redis if `REDIS_URL` is unset—cache calls are no-ops.

### Local Redis with Docker

```bash
docker run -d -p 6379:6379 --name dcm-redis redis:7-alpine
```

Optional: limit memory to 1GB:

```bash
docker run -d -p 6379:6379 --name dcm-redis redis:7-alpine redis-server --maxmemory 1gb --maxmemory-policy allkeys-lru
```

### Environment Variable

- `REDIS_URL` – Redis connection string (e.g., `redis://localhost:6379`). Omit to disable caching.

## Environment Variables

Copy `.env.example` to `.env` and set:

- `DATABASE_URL` – Connection string for the app (e.g., `postgresql://user:pass@localhost:5432/dcm_db?schema=public`)
- `DIRECT_URL` – Direct connection for migrations (same as `DATABASE_URL` if not using a pooler)
- `REDIS_URL` – Optional. Redis URL for caching (omit to run without cache)

## Initial Setup

```bash
npx prisma db push
npm run seed:microfinance
npm run seed:account-natures
```

**Note:** `seed:account-natures` is required for client creation. Without it, the Add Client form will have no account types to select.
