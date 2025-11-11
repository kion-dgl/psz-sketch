# Local Development Guide

This guide covers setting up a local development environment for Density Dwarf using Docker Compose.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Docker Services](#docker-services)
- [Environment Variables](#environment-variables)
- [Development Workflow](#development-workflow)
- [Accessing Services](#accessing-services)
- [Troubleshooting](#troubleshooting)
- [Alternative Setup](#alternative-setup)

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed
- [Docker Compose](https://docs.docker.com/compose/install/) installed (included with Docker Desktop)
- [Node.js](https://nodejs.org/) v18 or later
- [npm](https://www.npmjs.com/) v9 or later

## Quick Start

1. **Clone the repository**:
```bash
git clone https://github.com/kion-dgl/psz-sketch.git
cd psz-sketch
```

2. **Install dependencies**:
```bash
npm install
```

3. **Start Docker services**:
```bash
docker-compose up -d
```

4. **Verify services are running**:
```bash
docker-compose ps
```

You should see:
- `psz-mongodb` - Running on port 27017
- `psz-redis` - Running on port 6379
- `psz-mongo-express` - Running on port 8082
- `psz-redis-commander` - Running on port 8081

5. **Start the development server**:
```bash
npm run dev
```

6. **Open your browser**:
- **Application**: http://localhost:4321
- **MongoDB UI**: http://localhost:8082
- **Redis UI**: http://localhost:8081

## Docker Services

The `docker-compose.yml` file includes the following services:

### MongoDB (Required)

- **Image**: `mongo:7`
- **Port**: `27017`
- **Username**: `psz_user`
- **Password**: `psz_password`
- **Database**: `psz-sketch`
- **Volume**: `mongodb_data` (persistent storage)

### Redis (Required)

- **Image**: `redis:7-alpine`
- **Port**: `6379`
- **Volume**: `redis_data` (persistent storage with AOF)
- **Purpose**: Session storage

### Mongo Express (Optional)

- **Image**: `mongo-express:latest`
- **Port**: `8082`
- **Purpose**: Web UI for MongoDB
- **Access**: http://localhost:8082

Features:
- View and edit collections
- Run queries
- View database statistics
- No authentication required (local only)

### Redis Commander (Optional)

- **Image**: `rediscommander/redis-commander:latest`
- **Port**: `8081`
- **Purpose**: Web UI for Redis
- **Access**: http://localhost:8081

Features:
- View keys and values
- Edit stored data
- Monitor sessions
- View TTL (time to live) for keys

## Environment Variables

The `.env.local` file is **already committed** to the repository and pre-configured to work with Docker services:

**Why is it committed?** It's safe because:
- Contains only local Docker credentials
- Credentials are hardcoded in `docker-compose.yml` (already public)
- Only works on localhost
- Not used in production

You don't need to create or modify this file - it works out of the box!

### How It Works

Astro uses **Vite's environment variable system**, which automatically loads `.env.local` when you run `npm run dev`. The loading order is:

1. `.env` - Loaded in all modes
2. `.env.local` - Loaded in all modes (this is our file!)
3. `.env.[mode]` - Only loaded in specific mode (e.g., `.env.development`)
4. `.env.[mode].local` - Only loaded in specific mode

### Verify Environment

To check that `.env.local` is loaded correctly:

```bash
npm run check-env
```

This will show all environment variables and their values.

### Current Configuration

```env
# MongoDB (Docker)
MONGODB_URI=mongodb://psz_user:psz_password@localhost:27017/psz-sketch?authSource=admin
MONGODB_DB_NAME=psz-sketch

# Redis (Docker)
REDIS_URL=redis://localhost:6379

# JWT Secret (Development)
JWT_SECRET=dev-secret-change-in-production-12345678
```

### Using Cloud Services Instead

If you prefer to use cloud services for development:

**For Upstash Redis:**
```env
REDIS_URL=rediss://default:your-password@your-endpoint.upstash.io:6379
```

**For MongoDB Atlas:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
```

## Development Workflow

### Starting Services

```bash
# Start all services in background
docker-compose up -d

# Start services with logs visible
docker-compose up

# Start only specific services
docker-compose up mongodb redis -d
```

### Stopping Services

```bash
# Stop all services (keeps data)
docker-compose stop

# Stop and remove containers (keeps data)
docker-compose down

# Stop, remove containers, and delete all data
docker-compose down -v
```

### Viewing Logs

```bash
# View all logs
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# View logs for specific service
docker-compose logs -f mongodb
```

### Restarting Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart redis
```

## Accessing Services

### MongoDB CLI

Connect to MongoDB shell:
```bash
docker exec -it psz-mongodb mongosh -u psz_user -p psz_password --authenticationDatabase admin
```

Example commands:
```javascript
// Switch to database
use psz-sketch

// View collections
show collections

// Query users
db.users.find()

// Query challenges
db.challenges.find()

// Count documents
db.users.countDocuments()

// Clear challenges
db.challenges.deleteMany({})
```

### Redis CLI

Connect to Redis shell:
```bash
docker exec -it psz-redis redis-cli
```

Example commands:
```redis
# View all keys
KEYS *

# Get session data
GET sess:your-session-id

# View all sessions
KEYS sess:*

# Clear all sessions
FLUSHDB

# Check Redis info
INFO
```

### MongoDB UI (Mongo Express)

1. Open http://localhost:8082
2. Click on `psz-sketch` database
3. View collections:
   - `users` - User registration data
   - `challenges` - Authentication challenges

### Redis UI (Redis Commander)

1. Open http://localhost:8081
2. Browse keys in the left sidebar
3. Click on any key to view/edit value
4. Session keys are prefixed with `sess:`

## Troubleshooting

### Port Already in Use

**Error**: `Bind for 0.0.0.0:27017 failed: port is already allocated`

**Solution**:
```bash
# Check what's using the port
lsof -i :27017  # macOS/Linux
netstat -ano | findstr :27017  # Windows

# Either stop the conflicting service or change ports in docker-compose.yml
```

### Cannot Connect to MongoDB

**Error**: `MongoServerError: Authentication failed`

**Solution**:
1. Check `.env.local` credentials match `docker-compose.yml`
2. Ensure `authSource=admin` is in connection string
3. Restart MongoDB container:
```bash
docker-compose restart mongodb
```

### Cannot Connect to Redis

**Error**: `Error connecting to Redis`

**Solution**:
1. Check Redis is running: `docker-compose ps redis`
2. Test connection: `docker exec -it psz-redis redis-cli PING`
3. Should return `PONG`
4. Restart if needed: `docker-compose restart redis`

### Data Persistence Issues

If you lose data after restart:

1. Check volumes exist:
```bash
docker volume ls | grep psz
```

You should see:
- `psz-sketch_mongodb_data`
- `psz-sketch_redis_data`

2. If volumes are missing, recreate with:
```bash
docker-compose down
docker-compose up -d
```

### Clean Slate Reset

To completely reset the development environment:

```bash
# Stop and remove everything
docker-compose down -v

# Remove volumes explicitly
docker volume rm psz-sketch_mongodb_data psz-sketch_redis_data

# Rebuild and start
docker-compose up -d

# Verify services started
docker-compose ps
```

### Container Won't Start

Check logs for errors:
```bash
docker-compose logs mongodb
docker-compose logs redis
```

Common issues:
- Port conflicts (change ports in docker-compose.yml)
- Insufficient disk space (check with `df -h`)
- Docker daemon not running (restart Docker Desktop)

## Alternative Setup

### Without Docker

If you prefer not to use Docker:

#### Local MongoDB

**macOS**:
```bash
brew install mongodb-community
brew services start mongodb-community
```

**Ubuntu/Debian**:
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
```

**Windows**: Download from https://www.mongodb.com/try/download/community

Connection string: `mongodb://localhost:27017`

#### Local Redis

**macOS**:
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian**:
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

**Windows**: Download from https://redis.io/download or use WSL

Connection string: `redis://localhost:6379`

### Cloud Services (Upstash + MongoDB Atlas)

You can also develop entirely with cloud services:

1. **Sign up for MongoDB Atlas**: https://www.mongodb.com/cloud/atlas/register
2. **Sign up for Upstash**: https://console.upstash.com/
3. **Get connection strings** from both dashboards
4. **Update `.env.local`** with cloud credentials

Advantages:
- No local setup required
- Matches production environment
- Access from anywhere

Disadvantages:
- Requires internet connection
- May have latency
- Free tier limits apply

## Development Tips

### Hot Reload

The Astro dev server supports hot reload. Changes to:
- `.astro` files - Full page reload
- `.ts` files - Module reload
- `.tsx` files - React Fast Refresh

### Clearing Sessions

If you need to clear all sessions during development:

**Via Redis CLI**:
```bash
docker exec -it psz-redis redis-cli FLUSHDB
```

**Via Redis Commander**:
1. Open http://localhost:8081
2. Click "Delete" on each session key

**Via Code** (add temporary API endpoint):
```typescript
// src/pages/api/clear-sessions.ts (dev only!)
export const GET = async ({ session }) => {
  await session.destroy();
  return new Response('Session cleared');
};
```

### Database Seeding

To seed the database with test data, create a seed script:

```bash
# Create script
touch scripts/seed.ts
```

```typescript
// scripts/seed.ts
import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb://psz_user:psz_password@localhost:27017/psz-sketch?authSource=admin';

async function seed() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();

  const db = client.db('psz-sketch');

  // Insert test users
  await db.collection('users').insertMany([
    {
      fingerprint: 'test123',
      publicKey: 'test-key',
      createdAt: new Date().toISOString()
    }
  ]);

  console.log('Database seeded!');
  await client.close();
}

seed();
```

Run with:
```bash
npx tsx scripts/seed.ts
```

## Resources

- **Docker Documentation**: https://docs.docker.com/
- **Docker Compose**: https://docs.docker.com/compose/
- **MongoDB Documentation**: https://docs.mongodb.com/
- **Redis Documentation**: https://redis.io/documentation
- **Astro Documentation**: https://docs.astro.build/
