# Vercel Setup Guide

## Automatic PR Deployments

Vercel automatically creates preview deployments for every PR to `main`. No additional configuration needed!

### How it works:
1. Open a PR to `main` → Vercel deploys to a preview URL
2. Merge PR to `main` → Vercel deploys to production URL
3. Each PR commit → Vercel redeploys the preview

## Environment Variable Configuration

Go to your Vercel project: **Settings → Environment Variables**

### Step 1: Add Staging MongoDB (Preview only)

```
Variable Name: MONGODB_URI
Value: mongodb+srv://username:password@staging-cluster.mongodb.net/?retryWrites=true&w=majority
Environment: Preview ✓ (only Preview checked)
```

This database is used for all PR deployments (staging).

### Step 2: Add Production MongoDB (Production only)

```
Variable Name: MONGODB_URI
Value: mongodb+srv://username:password@production-cluster.mongodb.net/?retryWrites=true&w=majority
Environment: Production ✓ (only Production checked)
```

This database is used for the main branch deployment (production).

### Step 3: Add Shared Redis URL (Preview + Production)

```
Variable Name: REDIS_URL
Value: rediss://default:your-password@your-redis-endpoint:6379
Environment: Preview ✓, Production ✓ (both checked)
```

Same Redis instance for both staging and production (session continuity).

### Step 4: Add Shared JWT Secret (Preview + Production)

```
Variable Name: JWT_SECRET
Value: your-secure-random-secret-key-minimum-32-characters
Environment: Preview ✓, Production ✓ (both checked)
```

Same JWT secret for both environments (auth token continuity).

### Step 5: Add MongoDB Database Name (Preview + Production)

```
Variable Name: MONGODB_DB_NAME
Value: psz-sketch
Environment: Preview ✓, Production ✓ (both checked)
```

Database name can be the same (different clusters/connection strings).

## Visual Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    VERCEL ENVIRONMENTS                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  PREVIEW (PRs to main)                                      │
│  ├─ MONGODB_URI → staging-cluster.mongodb.net              │
│  ├─ REDIS_URL → your-redis-endpoint (shared)               │
│  └─ JWT_SECRET → shared-secret                             │
│                                                              │
│  PRODUCTION (main branch)                                   │
│  ├─ MONGODB_URI → production-cluster.mongodb.net           │
│  ├─ REDIS_URL → your-redis-endpoint (same)                 │
│  └─ JWT_SECRET → shared-secret (same)                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Workflow

### Opening a PR
1. Push branch to GitHub
2. Open PR to `main`
3. Vercel comment appears with preview URL
4. Preview uses **staging** MongoDB + **shared** Redis/JWT

### After Merge
1. PR merged to `main`
2. Vercel deploys to production URL
3. Production uses **production** MongoDB + **shared** Redis/JWT

## Testing Your Setup

### Test Preview Deployment
1. Open PR #15 (already created)
2. Wait for Vercel to deploy (check PR comments)
3. Visit preview URL
4. Check authentication works
5. Check `/api/db-stats` shows staging database

### Test Production Deployment
1. Merge PR #15 to main
2. Wait for Vercel production deployment
3. Visit production URL
4. Check authentication works
5. Check `/api/db-stats` shows production database

## Branch Protection (Recommended)

In GitHub repository settings, enable branch protection for `main`:

**Settings → Branches → Add branch protection rule**

```
Branch name pattern: main
✓ Require status checks to pass before merging
  ✓ Require branches to be up to date before merging
  ✓ Vercel (select from list after first deployment)
✓ Require pull request reviews before merging
  Required approving reviews: 1
```

This ensures:
- All changes go through PR review
- Vercel preview must deploy successfully
- No direct pushes to production

## Vercel Project Settings

### Recommended Settings

**General:**
- Framework Preset: `Astro`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

**Git:**
- Production Branch: `main`
- ✓ Automatic deployments from GitHub enabled

**Build & Development:**
- Node.js Version: `20.x` (or latest LTS)

## Troubleshooting

### Preview deployment fails with "Cannot connect to database"

**Check:** Environment variables are set with "Preview" scope
- Go to Settings → Environment Variables
- Verify `MONGODB_URI` has Preview checked
- Click the environment variable, edit it, save again to trigger re-deploy

### Production shows staging data

**Check:** `MONGODB_URI` scoping is incorrect
- Staging `MONGODB_URI` should ONLY have "Preview" checked
- Production `MONGODB_URI` should ONLY have "Production" checked
- They should have different connection strings

### Authentication fails on preview but works locally

**Check:** All required environment variables are set
- `JWT_SECRET` → Preview + Production
- `REDIS_URL` → Preview + Production
- `MONGODB_URI` → Preview OR Production (separate)

### "Module not found" or build errors

**Check:** All dependencies are in `dependencies`, not `devDependencies`
- Vercel installs only `dependencies` in production
- Run `npm install --production` locally to test

## Monitoring Deployments

### View Deployment Status
- **Vercel Dashboard**: https://vercel.com/your-username/psz-sketch
- **PR Comments**: Vercel bot posts deployment URLs
- **GitHub Actions**: Status checks appear on PRs

### View Deployment Logs
1. Go to Vercel Dashboard
2. Click on deployment
3. View "Build Logs" and "Function Logs"
4. Check for errors during build or runtime

### View Environment Variables (Debug)
Create an API endpoint to verify (remove after testing):

```typescript
// src/pages/api/env-check.ts (DELETE AFTER TESTING)
export const GET = () => {
  return new Response(JSON.stringify({
    hasMongoUri: !!process.env.MONGODB_URI,
    hasRedisUrl: !!process.env.REDIS_URL,
    hasJwtSecret: !!process.env.JWT_SECRET,
    mongoDbName: process.env.MONGODB_DB_NAME,
    // DO NOT log actual values
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
```

## Next Steps

1. ✅ Set up environment variables in Vercel (follow steps above)
2. ✅ Open PR #15 and verify preview deployment works
3. ✅ Test authentication on preview URL
4. ✅ Merge PR #15 after testing
5. ✅ Verify production deployment works
6. ✅ Set up branch protection rules
7. ✅ Set up MongoDB Atlas IP allowlist (allow Vercel IPs: 0.0.0.0/0 for serverless)

## Additional Resources

- [Vercel Environment Variables Docs](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel Preview Deployments](https://vercel.com/docs/concepts/deployments/preview-deployments)
- [MongoDB Atlas IP Access List](https://www.mongodb.com/docs/atlas/security/ip-access-list/)
