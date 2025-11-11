# Environment Variables Quick Reference

## TL;DR

**Shared across staging + production:**
- `JWT_SECRET` - Same secret everywhere
- `REDIS_URL` - Same Redis instance

**Separate per environment:**
- `MONGODB_URI` - Different database for staging vs production

**Why?** Test database changes in staging without affecting production data.

## Setup Checklist

### MongoDB Atlas (2 databases)

- [ ] Create staging cluster: `psz-sketch-staging`
- [ ] Create production cluster: `psz-sketch-production`
- [ ] Copy both connection strings

### Redis (1 database - shared)

- [ ] Create Redis database (any provider)
- [ ] Copy connection URL
- [ ] Use for both staging and production

### Vercel Environment Variables

Set in: **Vercel Dashboard → Settings → Environment Variables**

| Variable | Value | Environments |
|----------|-------|--------------|
| `JWT_SECRET` | `openssl rand -base64 32` | ✅ Production ✅ Preview |
| `REDIS_URL` | Your Redis URL | ✅ Production ✅ Preview |
| `MONGODB_URI` | **Staging** MongoDB URL | ✅ Preview **only** |
| `MONGODB_URI` | **Production** MongoDB URL | ✅ Production **only** |
| `MONGODB_DB_NAME` | `psz-sketch` | ✅ Production ✅ Preview |

**Note:** `MONGODB_URI` is set twice with different scopes!

## Local Development

Already configured in `.env.local`:
```env
JWT_SECRET=dev-secret-change-in-production-12345678
REDIS_URL=redis://localhost:6379
MONGODB_URI=mongodb://psz_user:psz_password@localhost:27017/psz-sketch?authSource=admin
```

Run: `docker-compose up -d && npm run dev`

## Verification

Check environment is loaded:
```bash
npm run check-env
```

## Full Documentation

See [docs/ENVIRONMENT_STRATEGY.md](docs/ENVIRONMENT_STRATEGY.md) for complete explanation and diagrams.
