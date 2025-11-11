# Environment Variable Strategy

This document explains how environment variables are organized across different environments.

## Overview

We use **three environments**:
- **Local** - Developer machines with Docker
- **Staging** - Vercel preview deployments (PRs)
- **Production** - Vercel production deployment (main branch)

## Environment Variable Breakdown

### Local Development (Docker)

| Variable | Value | Shared? | Notes |
|----------|-------|---------|-------|
| `JWT_SECRET` | `dev-secret-change-in-production-12345678` | ❌ Local only | Safe dev value, not used elsewhere |
| `REDIS_URL` | `redis://localhost:6379` | ❌ Local only | Local Docker Redis |
| `MONGODB_URI` | `mongodb://psz_user:psz_password@localhost:27017/...` | ❌ Local only | Local Docker MongoDB |

**Source**: `.env.local` (committed to repo)

### Staging (Vercel Preview)

| Variable | Value | Shared? | Notes |
|----------|-------|---------|-------|
| `JWT_SECRET` | Production secret | ✅ Shared with Production | **Same secret** allows tokens to work across environments |
| `REDIS_URL` | Redis URL | ✅ Shared with Production | **Same Redis** - sessions work across staging/prod |
| `MONGODB_URI` | Staging MongoDB Atlas | ❌ Staging only | **Separate database** - test DB changes safely |

**Source**: Vercel Environment Variables (Preview environment)

### Production (Vercel)

| Variable | Value | Shared? | Notes |
|----------|-------|---------|-------|
| `JWT_SECRET` | Production secret | ✅ Shared with Staging | Same as staging for consistency |
| `REDIS_URL` | Redis URL | ✅ Shared with Staging | Same as staging - shared session store |
| `MONGODB_URI` | Production MongoDB Atlas | ❌ Production only | **Separate database** - protected prod data |

**Source**: Vercel Environment Variables (Production environment)

## Why This Strategy?

### Shared JWT Secret (Staging + Production)

**Benefits:**
- JWTs generated in staging are valid in production
- Easier testing of authentication flows
- No need to re-authenticate when promoting code

**Security:**
- Still secure - secret is not exposed
- Only works with Vercel deployments (not local)
- Can rotate secret across both environments simultaneously

### Shared Redis (Staging + Production)

**Benefits:**
- Single Redis instance (cost-effective)
- Sessions persist across deployments
- Simpler infrastructure

**Considerations:**
- Staging and production sessions share the same store
- Use key prefixes if isolation needed (e.g., `staging:sess:*` vs `prod:sess:*`)

**When to separate:**
- If you need complete isolation
- If staging load tests could affect production
- For large-scale applications

### Separate MongoDB (Staging vs Production)

**Benefits:**
- ✅ **Test database changes safely** - Migration testing
- ✅ **Prevent data corruption** - Staging bugs don't affect production
- ✅ **Performance testing** - Staging load doesn't impact production
- ✅ **Schema changes** - Test migrations before production

**This is the key separation** - your data is protected!

## Environment Setup

### Local Development

Already configured in `.env.local`:
```env
JWT_SECRET=dev-secret-change-in-production-12345678
REDIS_URL=redis://localhost:6379
MONGODB_URI=mongodb://psz_user:psz_password@localhost:27017/psz-sketch?authSource=admin
```

### Vercel Setup

#### 1. Create MongoDB Databases

**Staging Database:**
1. Go to MongoDB Atlas
2. Create cluster: `psz-sketch-staging`
3. Copy connection string
4. Save for Vercel config

**Production Database:**
1. Go to MongoDB Atlas
2. Create cluster: `psz-sketch-production`
3. Copy connection string
4. Save for Vercel config

#### 2. Create Redis (Shared)

1. Go to your Redis provider's console
2. Create database: `psz-sketch-redis`
3. Copy connection URL
4. This will be used for **both** staging and production

#### 3. Generate JWT Secret (Shared)

```bash
openssl rand -base64 32
```

This secret will be used for **both** staging and production.

#### 4. Set Vercel Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

**JWT_SECRET:**
- Value: Your generated secret
- Environments: ✅ Production ✅ Preview ✅ Development

**REDIS_URL:**
- Value: Your Redis URL
- Environments: ✅ Production ✅ Preview ✅ Development

**MONGODB_URI (Production):**
- Value: Production MongoDB Atlas URL
- Environments: ✅ Production only

**MONGODB_URI (Preview/Staging):**
- Value: Staging MongoDB Atlas URL
- Environments: ✅ Preview ✅ Development

## Visual Overview

```
┌─────────────────────────────────────────────────────────────┐
│ LOCAL DEVELOPMENT (Docker)                                  │
├─────────────────────────────────────────────────────────────┤
│ JWT_SECRET    → dev-secret (local only)                     │
│ REDIS_URL     → redis://localhost:6379                      │
│ MONGODB_URI   → mongodb://localhost:27017                   │
└─────────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ VERCEL STAGING (Preview Deployments)                        │
├─────────────────────────────────────────────────────────────┤
│ JWT_SECRET    → [Production Secret] ◄──┐                    │
│ REDIS_URL     → rediss://upstash... ◄──┼─ SHARED           │
│ MONGODB_URI   → mongodb+srv://staging  │                    │
└─────────────────────────────────────────┼───────────────────┘
                                          │
┌─────────────────────────────────────────┼───────────────────┐
│ VERCEL PRODUCTION (Main Branch)         │                   │
├─────────────────────────────────────────┼───────────────────┤
│ JWT_SECRET    → [Production Secret] ◄───┘                   │
│ REDIS_URL     → rediss://upstash... ◄─── SHARED            │
│ MONGODB_URI   → mongodb+srv://production                    │
└─────────────────────────────────────────────────────────────┘

Legend:
  [Same Value] = Shared across environments
  [Different]  = Unique per environment
```

## Database Migration Workflow

With separate staging/production databases, your workflow is:

1. **Develop locally** with Docker MongoDB
   ```bash
   docker-compose up -d
   npm run dev
   ```

2. **Test in staging** (automatic on PR)
   - PR triggers staging deployment
   - Uses staging MongoDB
   - Test your DB changes
   - Verify migrations work

3. **Deploy to production** (merge to main)
   - Merge PR → production deployment
   - Uses production MongoDB
   - Your tested changes go live

## Security Considerations

### What's Safe to Share?

✅ **JWT_SECRET** (across staging/prod)
- Not exposed to clients
- Vercel environment only
- Can rotate together

✅ **REDIS_URL** (across staging/prod)
- Sessions are temporary
- No sensitive data stored long-term
- Can add key prefixes for isolation

### What Must Be Separate?

❌ **MONGODB_URI** (staging vs prod)
- Contains persistent user data
- Schema changes need testing
- Production data must be protected

### What Should Never Be Committed?

❌ Production secrets (`.env`, `.env.production`)
❌ MongoDB Atlas passwords (real ones)
❌ Redis URLs (real ones)

✅ Local Docker credentials (`.env.local`)
- Already public in `docker-compose.yml`
- Only works on localhost
- Safe to commit

## Troubleshooting

### Staging Using Wrong Database

Check Vercel environment variable scopes:
- `MONGODB_URI` for Production should only have "Production" checked
- `MONGODB_URI` for Preview should only have "Preview" checked

### JWT Invalid Across Environments

Ensure `JWT_SECRET` is the same for both Production and Preview environments.

### Sessions Not Persisting

Verify `REDIS_URL` is set for both Production and Preview environments.

## Alternative: Complete Isolation

If you want **complete isolation** between staging and production:

```
Staging:
- JWT_SECRET_STAGING (different)
- REDIS_URL_STAGING (different Redis instance)
- MONGODB_URI_STAGING (different database)

Production:
- JWT_SECRET (different)
- REDIS_URL (different Redis instance)
- MONGODB_URI (different database)
```

**Trade-offs:**
- ✅ Complete isolation
- ❌ More complex setup
- ❌ Higher costs (2x Redis)
- ❌ Can't test auth flows across environments

## Summary

| Environment | JWT | Redis | MongoDB |
|------------|-----|-------|---------|
| **Local** | Dev only | Docker (local) | Docker (local) |
| **Staging** | 🔗 Shared | 🔗 Shared | ⚡ Separate |
| **Production** | 🔗 Shared | 🔗 Shared | ⚡ Separate |

**Key Point:** Separate MongoDB databases let you test DB changes safely while keeping infrastructure simple with shared JWT/Redis.
