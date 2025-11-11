# Docker Compose Quick Reference

> **Ready to Go!** The `.env.local` file is already committed and configured.
> Just run `docker-compose up -d` and start coding!

## Services Overview

| Service | Port | Purpose | UI |
|---------|------|---------|-----|
| **MongoDB** | 27017 | Database | http://localhost:8082 |
| **Redis** | 6379 | Sessions | http://localhost:8081 |
| **Mongo Express** | 8082 | MongoDB UI | ✓ |
| **Redis Commander** | 8081 | Redis UI | ✓ |

## Environment Loading

Astro automatically loads `.env.local` through Vite when you run `npm run dev`. To verify:

```bash
npm run check-env
```

## Quick Commands

```bash
# Start all services
docker-compose up -d

# View status
docker-compose ps

# View logs
docker-compose logs -f

# Stop services (keep data)
docker-compose stop

# Stop and remove containers (keep data)
docker-compose down

# Reset everything (delete data)
docker-compose down -v

# Restart a service
docker-compose restart mongodb
```

## Connection Details

### MongoDB
- **Host**: `localhost:27017`
- **Username**: `psz_user`
- **Password**: `psz_password`
- **Database**: `psz-sketch`
- **Connection String**:
  ```
  mongodb://psz_user:psz_password@localhost:27017/psz-sketch?authSource=admin
  ```

### Redis
- **Host**: `localhost:6379`
- **No password** (local development)
- **Connection String**:
  ```
  redis://localhost:6379
  ```

## Access Web UIs

### MongoDB Management (Mongo Express)
- URL: http://localhost:8082
- View collections: `users`, `challenges`
- Run queries and manage data

### Redis Management (Redis Commander)
- URL: http://localhost:8081
- View sessions (keys prefixed with `sess:`)
- Monitor active sessions

## Troubleshooting

### Port conflicts
Change ports in `docker-compose.yml` if needed:
```yaml
ports:
  - "27018:27017"  # MongoDB on 27018 instead
  - "6380:6379"    # Redis on 6380 instead
```

Then update `.env.local`:
```env
MONGODB_URI=mongodb://psz_user:psz_password@localhost:27018/psz-sketch?authSource=admin
REDIS_URL=redis://localhost:6380
```

### Clear all data
```bash
docker-compose down -v
docker-compose up -d
```

### Connect to CLI

**MongoDB**:
```bash
docker exec -it psz-mongodb mongosh -u psz_user -p psz_password --authenticationDatabase admin
```

**Redis**:
```bash
docker exec -it psz-redis redis-cli
```

## Full Documentation

See [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md) for complete setup guide.
