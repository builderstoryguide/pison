## Containerization Summary

### Files Generated

1. **Dockerfile** - Multi-stage build (builder + runtime)
2. **docker-compose.yml** - Complete stack with app, PostgreSQL, Redis
3. **.dockerignore** - Excludes unnecessary files from build context
4. **.env.docker** - Environment variable template
5. **DOCKER_SETUP.md** - Detailed setup & troubleshooting guide

### Key Features

#### Dockerfile (Best Practices)
✅ **Multi-stage build** - Reduces final image size (~450MB)
  - Stage 1: Compiles app with build dependencies
  - Stage 2: Runtime-only image with minimal footprint

✅ **Security**
  - Non-root user (nextjs:1001) - containers run unprivileged
  - Minimal Alpine base image - smaller attack surface
  - No build tools in runtime image

✅ **Operations**
  - Health checks for container orchestration
  - dumb-init for proper signal handling (graceful shutdown)
  - Proper exit code handling via server.js

✅ **Optimization**
  - npm ci (deterministic builds) vs npm install
  - Layer caching strategy (package files copied first)
  - Excludes 44MB+ of dev files via .dockerignore

#### docker-compose.yml (Full Stack)
**Services:**
- **app** (Next.js) - Runs on http://localhost:3000
- **db** (PostgreSQL 16) - Database on port 5432
- **redis** (Redis 7) - Cache on port 6379

**Features:**
- Private network (dcm-network) for service communication
- Health checks on all services
- Named volumes for persistent data (postgres_data, redis_data)
- Environment variable templating with defaults
- Service dependencies (app waits for db & redis to be healthy)
- Automatic restart policies

### Quick Start

```bash
# 1. Configure environment
cp .env.docker .env.local
# Edit .env.local with your secrets

# 2. Start services
docker compose up -d

# 3. Run migrations
docker compose exec app npx prisma migrate deploy

# 4. Seed data (optional)
docker compose exec app npm run seed:microfinance
docker compose exec app npm run seed:account-natures

# 5. Access app
# Browser: http://localhost:3000
# Database: localhost:5432 (psql or pgAdmin)
# Redis: localhost:6379 (redis-cli)
```

### Development Mode

Uncomment volumes in docker-compose.yml for hot-reload:
```yaml
volumes:
  - ./:/app
  - /app/node_modules
  - /app/.next
```

Your code changes will reflect instantly without rebuilding.

### Production Deployment

For production, use Dockerfile directly:
```bash
docker build -t myapp:latest .
docker run -d \
  --name myapp \
  -p 3000:3000 \
  -e NEXTAUTH_SECRET="your-secret" \
  -e DATABASE_URL="your-db-url" \
  -e REDIS_URL="your-redis-url" \
  myapp:latest
```

Or deploy with orchestration (Docker Swarm / Kubernetes) using docker-compose.yml as reference.

### Environment Variables

**Required (set in .env.local):**
- NEXTAUTH_SECRET
- NEXTAUTH_URL
- DATABASE_URL / DIRECT_URL
- REDIS_URL

**Optional but recommended:**
- GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET (OAuth)
- STORAGE_* (S3/DigitalOcean Spaces)
- SMTP_* (Email notifications)
- RECAPTCHA_* (Bot protection)
- VAPID_* (Web push notifications)

**Database:**
- POSTGRES_PASSWORD (change for production)

**Cron Jobs (self-hosted only):**
- ENABLE_COMMISSION_CRON=1
- CRON_SECRET (required if cron enabled)

See `.env.docker` for all available options.

### Optimization Notes

**Build Time:** First build ~8-15 minutes (npm install bottleneck)
- Subsequent builds use layer caching (much faster)
- Use `--pull always` flag to get latest base images

**Image Size:**
- Runtime image: ~450MB (node:20-alpine with app)
- Single-stage would be ~2GB (includes build tools)
- Multi-stage saves ~1.5GB

**Network:**
- Services communicate via private network (dcm-network)
- Database queries use internal DNS: db:5432
- Redis queries use internal DNS: redis:6379
- No need to expose all ports (only app:3000 to host)

### Common Issues & Solutions

**Container exits immediately:**
```bash
docker compose logs app
# Check for database connection errors, missing env vars
```

**Database won't connect:**
```bash
docker compose logs db
# Verify postgres service is healthy: docker compose ps
# Wait 10-15 seconds for database initialization
```

**Out of memory during build:**
- Increase Docker Desktop memory limits (Settings → Resources)
- Use `docker compose build --progress=plain` for detailed progress

**Port already in use:**
```bash
# Change port in docker-compose.yml:
ports:
  - "3001:3000"  # Access via http://localhost:3001
```

### Monitoring

```bash
# View all containers
docker compose ps

# View logs
docker compose logs -f              # all services
docker compose logs -f app          # specific service
docker compose logs -f app --tail=50  # last 50 lines

# Resource usage
docker stats

# Shell into container
docker compose exec app sh
docker compose exec db psql -U postgres -d dcm_db
docker compose exec redis redis-cli

# Database GUI (install pgAdmin)
docker run -d --name pgadmin \
  --network dcm-network \
  -e PGADMIN_DEFAULT_EMAIL=admin@example.com \
  -e PGADMIN_DEFAULT_PASSWORD=admin \
  -p 5050:80 \
  dpage/pgadmin4
# Access: http://localhost:5050
```

### Security Checklist

- [ ] Change POSTGRES_PASSWORD in production
- [ ] Generate unique NEXTAUTH_SECRET: `openssl rand -base64 32`
- [ ] Use managed secrets service (AWS Secrets Manager, Vault)
- [ ] Enable image scanning: `docker scout cves dcm:latest`
- [ ] Limit container resources: add `deploy: resources: limits/reservations`
- [ ] Use read-only root filesystem (advanced)
- [ ] Run Trivy scan: `trivy image dcm:latest`

### Next Steps

1. **Update .env.local** with your configuration
2. **Run docker compose up** to start services
3. **Run migrations** with prisma
4. **Test locally** before pushing to registry
5. **Configure CI/CD** to build & push images to Docker Hub / private registry
