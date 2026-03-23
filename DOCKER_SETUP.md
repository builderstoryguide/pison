# Docker Setup & Commands

## Quick Start

### 1. Configure environment variables
Edit `.env.docker` with your actual values. Required:
- `NEXTAUTH_SECRET` – generate with: `openssl rand -base64 32`
- `POSTGRES_PASSWORD` – database password (default: postgres)

### 2. Build and start services
```bash
docker compose up -d
```

This will:
- Build the Next.js application container
- Start PostgreSQL database
- Start Redis cache
- Run database migrations automatically on app startup
- Start the Next.js app on http://localhost:3001

### 3. Seed database (required for login)
Login credentials (admin@dcm.local, accountant@dcm.local, agent1@dcm.local) only exist after seeding. Run:
```bash
docker compose exec app npm run seed:microfinance
docker compose exec app npm run seed:account-natures
```

## Useful Commands

### View logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f app
docker compose logs -f db
docker compose logs -f redis
```

### Database access
```bash
# PostgreSQL CLI
docker compose exec db psql -U postgres -d dcm_db

# Prisma Studio
docker compose exec app npx prisma studio
```

### Container management
```bash
# Stop all services
docker compose down

# Stop and remove volumes (careful! deletes data)
docker compose down -v

# Restart services
docker compose restart

# Rebuild without cache
docker compose build --no-cache
```

### Development with hot reload
Uncomment the volumes section in docker-compose.yml under the `app` service:
```yaml
volumes:
  - ./:/app
  - /app/node_modules
  - /app/.next
```

Then use: `docker compose up`

Your code changes will reflect immediately in the running container.

### Production considerations
- Remove volume mounts from docker-compose.yml before deploying to production
- Set environment variables securely (use secrets management, not .env files)
- Configure proper logging driver
- Use a reverse proxy (nginx, Traefik) for SSL termination
- Consider using Docker Swarm or Kubernetes for orchestration

## Image Details

**Dockerfile Multi-Stage Build:**
- **Stage 1 (builder):** Node.js 20 Alpine with build dependencies (Python, C compiler)
  - Installs all npm packages (including devDependencies for build)
  - Builds Next.js application

- **Stage 2 (runtime):** Node.js 20 Alpine (minimal, ~150MB)
  - Non-root user (nextjs) for security
  - Health checks for container orchestration
  - dumb-init for proper signal handling
  - Entrypoint runs `prisma migrate deploy` before starting the app

**Image Size:** ~400-450 MB (optimized with Alpine)

## Environment Variables

See `.env.docker` for full configuration template. Key variables:

- `NEXTAUTH_SECRET`: Generate with: `openssl rand -base64 32`
- `VAPID_PRIVATE_KEY`: Generate with: `npx web-push generate-vapid-keys`
- `POSTGRES_PASSWORD`: Change for production
- `ENABLE_COMMISSION_CRON`: Set to `1` with `CRON_SECRET` to enable monthly cron

## Troubleshooting

### Database connection failed
```bash
# Check if db service is healthy
docker compose ps

# Check db logs
docker compose logs db

# Wait for db to be ready
docker compose exec app npm run db:test:push
```

### Out of memory
Increase Docker resource limits in Docker Desktop settings.

### Build failures
```bash
# Clean rebuild
docker compose down -v
docker compose build --no-cache
docker compose up
```

## Security Best Practices

✅ Implemented:
- Non-root user in container
- Minimal Alpine base image
- Multi-stage build (no build tools in runtime)
- Health checks
- Private network (dcm-network) for service communication

⚠️ To improve:
- Use managed secrets for environment variables
- Add container image scanning (Docker Scout)
- Enable content trust for image verification
- Set resource limits in docker-compose.yml
- Use read-only filesystem where possible
