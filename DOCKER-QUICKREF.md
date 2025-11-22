# 🐳 Docker Quick Reference

## Start/Stop

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart a service
docker-compose restart app
```

## View Logs

```bash
# Follow all logs
docker-compose logs -f

# Follow specific service
docker-compose logs -f app
```

## Rebuild

```bash
# Rebuild and restart
docker-compose up -d --build

# Rebuild specific service
docker-compose build app
```

## Common Tasks

```bash
# Install npm package
docker-compose exec app npm install package-name

# Run migrations
docker-compose exec db psql -U pison_user -d pison_db -f /docker-entrypoint-initdb.d/migration.sql

# Access app shell
docker-compose exec app sh

# Access database
docker-compose exec db psql -U pison_user -d pison_db
```

## URLs

- **App**: http://localhost:3000
- **pgAdmin**: http://localhost:5050
- **Database**: localhost:5432

## Database Credentials

- User: `pison_user`
- Password: `pison_dev_password`
- Database: `pison_db`
