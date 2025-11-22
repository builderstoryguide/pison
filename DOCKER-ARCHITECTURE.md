# 🐳 Docker Environment Architecture

## Overview

Your Docker development environment consists of 3 main services working together to provide a complete development experience.

```
┌─────────────────────────────────────────────────────────────────┐
│                    DOCKER DEVELOPMENT ENVIRONMENT                │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│   Next.js App    │      │   PostgreSQL     │      │     pgAdmin      │
│                  │      │                  │      │                  │
│  Port: 3000      │◄────►│  Port: 5432      │◄────►│  Port: 5050      │
│  Hot Reload: ✓   │      │  User: pison_user│      │  Web UI for DB   │
│  Volume: ./      │      │  DB: pison_db    │      │  Management      │
└──────────────────┘      └──────────────────┘      └──────────────────┘
         │                         │                         │
         └─────────────────────────┼─────────────────────────┘
                                   │
                        ┌──────────▼──────────┐
                        │   Docker Network    │
                        │   pison-network     │
                        └─────────────────────┘
                                   │
                        ┌──────────▼──────────┐
                        │  Persistent Volumes │
                        │  • postgres_data    │
                        │  • pgadmin_data     │
                        └─────────────────────┘
                                   │
                        ┌──────────▼──────────┐
                        │ Your Local Machine  │
                        │   Windows/Mac/Linux │
                        └─────────────────────┘
```

## Service Details

### 🚀 Next.js Application (app)

**Purpose**: Your main web application  
**Access**: http://localhost:3000  
**Features**:

- Hot module replacement (automatic reload on code changes)
- Volume-mounted source code (`./` → `/app`)
- Development mode with full debugging
- Connects to PostgreSQL or Supabase

**Key Technologies**:

- Next.js 15.2.4
- React 19
- TypeScript 5
- Tailwind CSS

### 🗄️ PostgreSQL Database (db)

**Purpose**: Local development database  
**Access**: `localhost:5432`  
**Credentials**:

- Username: `pison_user`
- Password: `pison_dev_password`
- Database: `pison_db`

**Features**:

- PostgreSQL 16 (Alpine Linux)
- Persistent data storage
- Health checks enabled
- Migration-ready

**Use Cases**:

- Testing database migrations
- Local development without internet
- Integration testing
- Learning SQL queries

### 🖥️ pgAdmin (pgadmin)

**Purpose**: Visual database management tool  
**Access**: http://localhost:5050  
**Credentials**:

- Email: `admin@pison.local`
- Password: `admin`

**Features**:

- Visual query builder
- Table browser
- Schema visualization
- Query history
- Export/import data

## Data Flow

```
User Browser
     │
     │ HTTP Request (port 3000)
     ▼
Next.js App Container
     │
     ├─► Supabase Cloud (if using cloud)
     │   └─► Your Production Database
     │
     └─► PostgreSQL Container (if using local)
         └─► postgres_data Volume
```

## File Structure

```
pison/
├── Dockerfile                    # Multi-stage build config
├── docker-compose.yml            # Service orchestration
├── .dockerignore                 # Build optimization
├── env.docker.example            # Environment template
├── DOCKER-README.md              # Complete guide
├── DOCKER-QUICKREF.md            # Quick reference
│
├── app/                          # Next.js pages
├── components/                   # React components
├── lib/                          # Utilities
├── scripts/                      # Database migrations
│   └── *.sql                     # Auto-loaded on DB init
└── ...
```

## Environment Variables

### Required for Docker

In `.env.docker` or `docker-compose.yml`:

```env
# Database (Local PostgreSQL)
DATABASE_URL=postgresql://pison_user:pison_dev_password@db:5432/pison_db

# Supabase (Cloud or Local)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Next.js
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
```

## Volume Mounts

### Application Volume

```yaml
volumes:
  - .:/app # Your source code
  - /app/node_modules # Prevent overwrite
  - /app/.next # Prevent overwrite
```

**Effect**: Hot reload works! Changes to your code instantly reflect in the browser.

### Database Volumes

```yaml
volumes:
  postgres_data: # Database files persist
  pgadmin_data: # pgAdmin settings persist
```

**Effect**: Your database data survives container restarts.

## Network Architecture

```
Docker Network: pison-network (Bridge)
  │
  ├─► app (Next.js)
  │   └─► Accessible as: http://app:3000 (internal)
  │   └─► Exposed as: http://localhost:3000 (external)
  │
  ├─► db (PostgreSQL)
  │   └─► Accessible as: postgresql://db:5432 (internal)
  │   └─► Exposed as: localhost:5432 (external)
  │
  └─► pgadmin
      └─► Accessible as: http://pgadmin:80 (internal)
      └─► Exposed as: http://localhost:5050 (external)
```

**Key Point**: Services communicate using service names (e.g., `db` not `localhost`) because they're in the same Docker network.

## Development Workflow

### Starting Your Day

```bash
# 1. Start all services
docker-compose up -d

# 2. Check everything is running
docker-compose ps

# 3. View logs if needed
docker-compose logs -f app
```

### During Development

```bash
# Make code changes → Automatically reload ✓

# Install new package
docker-compose exec app npm install new-package

# Run migration
docker-compose exec db psql -U pison_user -d pison_db -f /docker-entrypoint-initdb.d/migration.sql

# Check app logs
docker-compose logs -f app
```

### Ending Your Day

```bash
# Stop all services (data persists)
docker-compose down

# Or stop and remove volumes (fresh start next time)
docker-compose down -v
```

## Comparison: Docker vs Traditional Setup

| Aspect                    | Traditional       | Docker         |
| ------------------------- | ----------------- | -------------- |
| **Setup Time**            | 30-60 minutes     | 5 minutes      |
| **Consistency**           | Varies by machine | 100% identical |
| **Database Setup**        | Manual install    | One command    |
| **Team Onboarding**       | Hours of setup    | Minutes        |
| **Environment Conflicts** | Common            | Never          |
| **Cleanup**               | Manual uninstall  | One command    |
| **Production Parity**     | Low               | High           |

## Production Deployment

### Building Production Image

```bash
# Build optimized production image
docker build -t pison-app:latest --target runner .

# Image size: ~150MB (thanks to multi-stage build)
```

### Running in Production

```bash
docker run -d \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=$PROD_DATABASE_URL \
  -e NEXT_PUBLIC_SUPABASE_URL=$PROD_SUPABASE_URL \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=$PROD_ANON_KEY \
  --name pison-app \
  pison-app:latest
```

## Resource Usage

Typical resource consumption on a development machine:

| Service     | RAM        | CPU       | Disk       |
| ----------- | ---------- | --------- | ---------- |
| Next.js App | ~300MB     | 5-15%     | 500MB      |
| PostgreSQL  | ~50MB      | 2-5%      | 200MB      |
| pgAdmin     | ~100MB     | 1-2%      | 100MB      |
| **Total**   | **~450MB** | **8-22%** | **~800MB** |

Very lightweight! ⚡

## Security Considerations

### Development

✅ **Safe**:

- Hardcoded credentials are fine for local dev
- Exposed ports only accessible on localhost
- No production data

### Production

🔒 **Important**:

- Use environment variables for secrets
- Never commit `.env.docker` to Git
- Use secrets management (AWS Secrets Manager, etc.)
- Run containers as non-root user (already configured)
- Enable HTTPS/TLS
- Regular security updates

## Troubleshooting

### Port Conflicts

**Symptom**: `Port 3000 already in use`

**Solution**:

```bash
# Stop your local npm dev server
# OR change ports in docker-compose.yml
ports:
  - "3001:3000"  # Use 3001 instead
```

### Database Connection Issues

**Symptom**: `Connection refused to db:5432`

**Solution**:

```bash
# Check if db is healthy
docker-compose ps

# View db logs
docker-compose logs db

# Wait for health check
# The app will retry automatically
```

### Hot Reload Not Working

**Symptom**: Code changes don't reflect

**Solution**:

1. Enable WSL 2 in Docker Desktop (Windows)
2. Restart app container:
   ```bash
   docker-compose restart app
   ```

## Next Steps

1. ✅ **Set up environment**: Copy `env.docker.example` → `.env.docker`
2. ✅ **Add credentials**: Fill in your Supabase keys
3. ✅ **Start services**: `docker-compose up -d`
4. ✅ **Run migrations**: Upload your SQL scripts
5. ✅ **Start coding**: Changes auto-reload!

## Resources

- 📘 [Complete Docker Guide](./DOCKER-README.md)
- ⚡ [Quick Reference](./DOCKER-QUICKREF.md)
- 🐳 [Docker Documentation](https://docs.docker.com/)
- 🚀 [Next.js Docker Docs](https://nextjs.org/docs/deployment#docker-image)

---

**Last Updated**: November 2025  
**Docker Compose Version**: 3.8  
**Node Version**: 20 (Alpine)  
**PostgreSQL Version**: 16 (Alpine)
