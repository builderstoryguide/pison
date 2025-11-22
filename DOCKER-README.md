# 🐳 Docker Setup Guide for Pison

This guide will help you set up and run the Pison application using Docker for development.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Available Services](#available-services)
- [Common Commands](#common-commands)
- [Troubleshooting](#troubleshooting)
- [Production Deployment](#production-deployment)

---

## 🎯 Prerequisites

Before you begin, ensure you have the following installed:

1. **Docker Desktop** (Windows/Mac) or **Docker Engine** (Linux)

   - Download: https://www.docker.com/products/docker-desktop
   - Verify installation: `docker --version`

2. **Docker Compose** (usually included with Docker Desktop)
   - Verify installation: `docker-compose --version`

**Minimum System Requirements:**

- 4GB RAM (8GB recommended)
- 10GB free disk space
- Windows 10/11 Pro, macOS 10.15+, or Linux

---

## 🚀 Quick Start

### Step 1: Clone and Navigate

```bash
cd c:\Users\Cyrille Kuete\Documents\GitHub\pison
```

### Step 2: Configure Environment Variables

Copy the example environment file:

```bash
# Windows PowerShell
Copy-Item env.docker.example .env.docker

# Or manually create .env.docker and copy the contents
```

Edit `.env.docker` and update with your actual values:

- Replace `your-project-id` with your Supabase project ID
- Replace `your-anon-key-here` with your Supabase anon key
- Replace `your-service-role-key-here` with your Supabase service role key

💡 **Tip:** You can find these values in your Supabase project settings.

### Step 3: Build and Start Services

```bash
# Build and start all services
docker-compose up -d

# Or build first, then start
docker-compose build
docker-compose up -d
```

### Step 4: Verify Everything is Running

```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f app
```

### Step 5: Access the Application

- **Next.js App**: http://localhost:3000
- **pgAdmin (Database UI)**: http://localhost:5050
  - Email: `admin@pison.local`
  - Password: `admin`
- **PostgreSQL Database**: `localhost:5432`
  - User: `pison_user`
  - Password: `pison_dev_password`
  - Database: `pison_db`

---

## ⚙️ Configuration

### Using Supabase Cloud (Recommended for Development)

If you're using Supabase cloud (which you likely are), update `.env.docker`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-actual-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key
```

The local PostgreSQL database (`db` service) can be used for:

- Testing migrations
- Local development without internet
- Running integration tests

### Using Local PostgreSQL

If you want to use the local PostgreSQL database instead:

1. Update your Supabase client configuration in your code to use:

   ```env
   DATABASE_URL=postgresql://pison_user:pison_dev_password@db:5432/pison_db
   ```

2. Run your database migrations:
   ```bash
   docker-compose exec app npm run migrate
   # Or run your migration scripts
   docker-compose exec db psql -U pison_user -d pison_db -f /docker-entrypoint-initdb.d/2025-11-13_030_employee_management_schema.sql
   ```

### Environment Variables

Update `docker-compose.yml` to add more environment variables under `app.environment`:

```yaml
app:
  environment:
    # Your existing variables...
    MY_CUSTOM_VAR: value
    ANOTHER_VAR: another-value
```

Or create a `.env` file in the root and Docker Compose will automatically load it.

---

## 🔧 Available Services

### 1. **app** - Next.js Application

- **Port**: 3000
- **Purpose**: Your main application with hot reload
- **Logs**: `docker-compose logs -f app`

### 2. **db** - PostgreSQL Database

- **Port**: 5432
- **Purpose**: Local PostgreSQL database for development
- **Access**: `psql -h localhost -U pison_user -d pison_db`
- **Logs**: `docker-compose logs -f db`

### 3. **pgAdmin** - Database Management UI

- **Port**: 5050
- **Purpose**: Visual database administration
- **Web Interface**: http://localhost:5050

#### Setting Up Database Connection in pgAdmin:

1. Open http://localhost:5050
2. Login with:
   - Email: `admin@pison.local`
   - Password: `admin`
3. Right-click "Servers" → "Register" → "Server"
4. General tab:
   - Name: `Pison Local DB`
5. Connection tab:
   - Host: `db` (the service name)
   - Port: `5432`
   - Database: `pison_db`
   - Username: `pison_user`
   - Password: `pison_dev_password`
6. Click "Save"

---

## 💻 Common Commands

### Starting and Stopping

```bash
# Start all services
docker-compose up -d

# Start with logs visible
docker-compose up

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes database data)
docker-compose down -v
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f db

# Last 100 lines
docker-compose logs --tail=100 app
```

### Rebuilding

```bash
# Rebuild app after dependency changes
docker-compose build app

# Rebuild and restart
docker-compose up -d --build app

# Force rebuild (no cache)
docker-compose build --no-cache app
```

### Executing Commands Inside Containers

```bash
# Run npm commands in app container
docker-compose exec app npm install some-package
docker-compose exec app npm run lint
docker-compose exec app npm test

# Access app container shell
docker-compose exec app sh

# Access database
docker-compose exec db psql -U pison_user -d pison_db

# Run database migrations
docker-compose exec db psql -U pison_user -d pison_db -f /docker-entrypoint-initdb.d/your-migration.sql
```

### Database Operations

```bash
# Create database backup
docker-compose exec db pg_dump -U pison_user pison_db > backup.sql

# Restore database backup
docker-compose exec -T db psql -U pison_user -d pison_db < backup.sql

# View database tables
docker-compose exec db psql -U pison_user -d pison_db -c "\dt"
```

### Cleaning Up

```bash
# Remove stopped containers
docker-compose rm

# Remove all containers, networks, volumes
docker-compose down -v

# Remove all unused Docker resources
docker system prune -a
```

---

## 🔍 Troubleshooting

### Port Already in Use

**Problem**: Port 3000, 5432, or 5050 already in use.

**Solution**:

1. Stop the conflicting service (e.g., your local `npm run dev`)
2. Or change ports in `docker-compose.yml`:
   ```yaml
   ports:
     - "3001:3000" # Use port 3001 instead
   ```

### Cannot Connect to Database

**Problem**: App cannot connect to database.

**Solution**:

1. Check if database is healthy:
   ```bash
   docker-compose ps
   ```
2. Wait for database to be ready (health check):
   ```bash
   docker-compose logs db
   ```
3. Verify connection string in `.env.docker`

### Hot Reload Not Working

**Problem**: Code changes don't reflect in the app.

**Solution**:

1. Ensure volumes are correctly mounted in `docker-compose.yml`
2. Restart the app container:
   ```bash
   docker-compose restart app
   ```
3. On Windows, enable "Use the WSL 2 based engine" in Docker Desktop settings

### Build Fails

**Problem**: `docker-compose build` fails.

**Solution**:

1. Check Docker daemon is running
2. Clear build cache:
   ```bash
   docker-compose build --no-cache
   ```
3. Remove old images:
   ```bash
   docker image prune -a
   ```

### Out of Memory

**Problem**: Docker containers crashing due to memory.

**Solution**:

1. Increase Docker Desktop memory limit:
   - Settings → Resources → Memory → Increase to 4GB+
2. Restart Docker Desktop

### Database Data Persists After `docker-compose down`

**Problem**: Want to reset database to fresh state.

**Solution**:

```bash
# Remove volumes to delete data
docker-compose down -v

# Start fresh
docker-compose up -d
```

---

## 🚢 Production Deployment

### Building for Production

```bash
# Build production image
docker build -t pison-app:latest --target runner .

# Run production container
docker run -p 3000:3000 \
  -e DATABASE_URL=your-production-db-url \
  -e NEXT_PUBLIC_SUPABASE_URL=your-production-supabase-url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key \
  pison-app:latest
```

### Docker Compose for Production

Create `docker-compose.prod.yml`:

```yaml
version: "3.8"

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: runner
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL}
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}
    restart: always
```

Run with:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Deploying to Cloud Platforms

#### AWS ECS / Azure Container Instances / GCP Cloud Run

1. Build and push image to registry:

   ```bash
   docker build -t your-registry/pison-app:latest .
   docker push your-registry/pison-app:latest
   ```

2. Deploy using platform-specific CLI or console

#### Kubernetes

Create deployment and service manifests based on the Dockerfile.

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Docker Documentation](https://nextjs.org/docs/deployment#docker-image)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [Supabase Documentation](https://supabase.com/docs)

---

## 🎯 Next Steps

After setting up Docker:

1. **Run Database Migrations**

   ```bash
   docker-compose exec db psql -U pison_user -d pison_db -f /docker-entrypoint-initdb.d/2025-11-13_030_employee_management_schema.sql
   ```

2. **Install Additional Dependencies**

   ```bash
   docker-compose exec app npm install
   ```

3. **Run Tests**

   ```bash
   docker-compose exec app npm test
   ```

4. **Set up CI/CD** to automatically build and deploy Docker images

---

## 💡 Tips

- **Use Docker for consistency**: Same environment across all team members
- **Keep images small**: Use multi-stage builds (already configured)
- **Use volumes for development**: Fast hot-reload (already configured)
- **Don't commit .env.docker**: Keep your secrets safe
- **Regular cleanup**: Run `docker system prune` weekly to free space
- **Monitor resources**: Check Docker Desktop dashboard regularly

---

## ✅ Checklist

Before pushing to production:

- [ ] Environment variables configured correctly
- [ ] Database migrations run successfully
- [ ] All tests passing
- [ ] Build succeeds without errors
- [ ] No sensitive data in Docker images
- [ ] Health checks configured
- [ ] Resource limits set appropriately
- [ ] Logging configured
- [ ] Monitoring set up

---

**Created**: November 2025  
**Version**: 1.0.0  
**Maintainer**: Pison Development Team

Need help? Check the [Troubleshooting](#troubleshooting) section or open an issue!
