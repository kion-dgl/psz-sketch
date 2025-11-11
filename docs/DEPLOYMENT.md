# Deployment Guide

This guide covers deploying the Density Dwarf application to Vercel with Redis (Upstash) for session management and MongoDB Atlas for persistent storage.

## Table of Contents

- [Prerequisites](#prerequisites)
- [MongoDB Atlas Setup](#mongodb-atlas-setup)
- [Redis Setup (Upstash)](#redis-setup-upstash)
- [Environment Variables](#environment-variables)
- [Deployment Process](#deployment-process)
- [CI/CD Workflows](#cicd-workflows)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- [Vercel Account](https://vercel.com/signup)
- [MongoDB Atlas Account](https://www.mongodb.com/cloud/atlas/register)
- [Upstash Account](https://upstash.com/) for Redis
- [Vercel CLI](https://vercel.com/docs/cli) installed (optional but recommended)

```bash
npm install -g vercel
```

## MongoDB Atlas Setup

### 1. Create a MongoDB Atlas Cluster

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Click "Create" to create a new cluster
3. Choose the **FREE** M0 tier (or upgrade as needed)
4. Select your preferred cloud provider and region (recommend same region as Vercel deployment)
5. Click "Create Cluster"

### 2. Configure Database Access

1. Navigate to **Database Access** in the left sidebar
2. Click "Add New Database User"
3. Choose **Password** authentication
4. Set username and password (save these securely!)
5. Grant **Read and write to any database** privilege
6. Click "Add User"

### 3. Configure Network Access

1. Navigate to **Network Access** in the left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
   - This is required for Vercel deployments
   - Your database is still protected by authentication
4. Click "Confirm"

### 4. Get Connection String

1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string (looks like: `mongodb+srv://username:<password>@cluster.mongodb.net/?retryWrites=true&w=majority`)
4. Replace `<password>` with your actual database user password
5. Save this for environment variables

## Redis Setup (Upstash)

Upstash provides serverless Redis that's perfect for Vercel deployments.

### 1. Create Upstash Redis Database

1. Log in to [Upstash Console](https://console.upstash.com/)
2. Click "Create Database"
3. Configure your database:
   - **Name**: `psz-sketch-sessions` (or your preferred name)
   - **Type**: Select **Regional** (cheaper) or **Global** (faster worldwide)
   - **Region**: Choose same region as your Vercel deployment (e.g., `us-east-1`)
   - **TLS**: Enable (recommended for security)
4. Click "Create"

### 2. Get Redis Connection URL

1. After creation, you'll see your database dashboard
2. Scroll to **REST API** section
3. Copy the **UPSTASH_REDIS_REST_URL** - this is your `REDIS_URL`
4. The format will be: `rediss://default:your-password@your-endpoint.upstash.io:6379`
5. Save this for environment variables

### 3. Optional: Vercel Integration

Upstash offers a Vercel integration for easier setup:

1. Go to [Vercel Marketplace](https://vercel.com/integrations)
2. Search for "Upstash"
3. Click "Add Integration"
4. Follow the prompts to link your Upstash account
5. This will automatically set `REDIS_URL` in your Vercel project

**Or manually set the environment variable** (see next section)

## Environment Variables

### Required Variables

Configure these in your Vercel project settings (**Settings → Environment Variables**):

| Variable | Environments | Description |
|----------|--------------|-------------|
| `JWT_SECRET` | ✅ Production ✅ Preview | **Shared** - Same secret for staging + production |
| `REDIS_URL` | ✅ Production ✅ Preview | **Shared** - Same Upstash Redis for staging + production |
| `MONGODB_URI` (Staging) | ✅ Preview only | **Separate** - Staging MongoDB Atlas URL |
| `MONGODB_URI` (Production) | ✅ Production only | **Separate** - Production MongoDB Atlas URL |
| `MONGODB_DB_NAME` | ✅ Production ✅ Preview | Database name (can be same or different) |

**Environment Strategy:**
- **Shared**: JWT_SECRET and REDIS_URL work across staging + production
- **Separate**: MongoDB databases are isolated for safe testing

See [ENVIRONMENT_STRATEGY.md](ENVIRONMENT_STRATEGY.md) for complete explanation.

### Setting Environment Variables

#### Via Vercel Dashboard

1. Go to your project in Vercel
2. Navigate to **Settings → Environment Variables**

**Add JWT_SECRET (Shared):**
- Key: `JWT_SECRET`
- Value: (generate with `openssl rand -base64 32`)
- Environments: ✅ Production ✅ Preview
- Click "Save"

**Add REDIS_URL (Shared):**
- Key: `REDIS_URL`
- Value: Your Upstash Redis URL (`rediss://...`)
- Environments: ✅ Production ✅ Preview
- Click "Save"

**Add MONGODB_URI for Staging:**
- Key: `MONGODB_URI`
- Value: Staging MongoDB Atlas URL
- Environments: ✅ Preview **only**
- Click "Save"

**Add MONGODB_URI for Production:**
- Key: `MONGODB_URI`
- Value: Production MongoDB Atlas URL
- Environments: ✅ Production **only**
- Click "Save"

**Add MONGODB_DB_NAME:**
- Key: `MONGODB_DB_NAME`
- Value: `psz-sketch`
- Environments: ✅ Production ✅ Preview
- Click "Save"

**Important:** Notice that `MONGODB_URI` is added **twice** with different environment scopes!

#### Via Vercel CLI

```bash
# Set production environment variable
vercel env add MONGODB_URI production

# Set for all environments
vercel env add JWT_SECRET production preview development
```

### Local Development

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Fill in your values in `.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=psz-sketch
JWT_SECRET=your-local-secret-key
REDIS_URL=redis://localhost:6379
```

**Note**: For local development, you can either:
- Install Redis locally: `brew install redis` (macOS) or use Docker
- Use Upstash and point to your development database
- Leave `REDIS_URL` unset to use in-memory session storage (fallback)

3. Pull Vercel environment variables (optional):
```bash
vercel env pull .env.local
```

## Deployment Process

### Automatic Deployment (Recommended)

The project is configured for automatic deployments:

1. **Production Deployment**
   - Automatically deploys when code is merged to `main` branch
   - Uses production environment variables
   - URL: Your custom domain or `*.vercel.app`

2. **Preview Deployment**
   - Automatically deploys for each pull request
   - Uses preview environment variables
   - URL: Unique preview URL per PR

### Manual Deployment

#### First-time Setup

```bash
# Link to Vercel project
vercel link

# Deploy to production
vercel --prod
```

#### Deploy Updates

```bash
# Deploy preview
vercel

# Deploy to production
vercel --prod
```

## CI/CD Workflows

### GitHub Integration

The project automatically integrates with GitHub when connected to Vercel:

1. **Pull Request Checks**
   - Every PR triggers a preview deployment
   - Comments added to PR with preview URL
   - Build errors prevent merging

2. **Production Deployment**
   - Merging to `main` triggers production deployment
   - Zero-downtime deployment
   - Automatic rollback on failure

3. **Environment Variables**
   - Production variables used for `main` branch
   - Preview variables used for PR deployments

### Branch Configuration

In your Vercel project settings (**Settings → Git**):

- **Production Branch**: `main`
- **Preview Branches**: All branches (PRs)
- **Ignored Build Step**: None (build all commits)

## Architecture Overview

### Session Storage (Redis/Upstash)

- **Purpose**: Server-side session management for authenticated pages
- **Technology**: Redis via Upstash (serverless Redis)
- **Usage**: Stores user sessions after JWT authentication
- **Expiration**: 1 hour (configurable in `sessionManager.ts`)

### Database (MongoDB Atlas)

- **Purpose**: Persistent storage for users and challenges
- **Collections**:
  - `users`: User registration data (fingerprint, public key)
  - `challenges`: Authentication challenges (temporary, 2-minute expiry)

### Authentication Flow

```mermaid
graph LR
    A[User] -->|1. Request Challenge| B[API: /api/challenge]
    B -->|2. Store in MongoDB| C[Challenges Collection]
    B -->|3. Return Challenge| A
    A -->|4. Sign Challenge| D[Client Crypto]
    D -->|5. Submit Signature| E[API: /api/authenticate]
    E -->|6. Verify & Create Session| F[Redis/Upstash]
    E -->|7. Return JWT| A
    A -->|8. Access Protected Page| G[Server validates session]
    G -->|9. Check Session| F
```

## Troubleshooting

### MongoDB Connection Issues

**Error**: `MongoServerError: Authentication failed`

**Solution**:
1. Verify username and password in `MONGODB_URI`
2. Check that database user has correct permissions
3. Ensure IP address (0.0.0.0/0) is whitelisted

**Error**: `MongooseServerSelectionError: connect ETIMEDOUT`

**Solution**:
1. Check Network Access settings in Atlas
2. Verify cluster is running (not paused)
3. Check connection string format

### Redis Connection Issues

**Error**: `Session driver 'redis' not configured`

**Solution**:
1. Ensure `REDIS_URL` environment variable is set in Vercel
2. Check Upstash Redis database is running and accessible
3. Verify connection string format: `rediss://default:password@host.upstash.io:6379`
4. Redeploy after setting environment variable

### Build Failures

**Error**: `Module not found: Can't resolve 'mongodb'`

**Solution**:
```bash
npm install mongodb
git add package.json package-lock.json
git commit -m "Add MongoDB dependency"
git push
```

**Error**: TypeScript errors

**Solution**:
```bash
# Check types locally
npm run astro check

# Install missing type definitions
npm install --save-dev @types/node
```

### Environment Variable Issues

**Error**: Variables not available in build

**Solution**:
1. Set variables for correct environment (Production, Preview, Development)
2. Redeploy after adding variables
3. Use Vercel CLI to verify: `vercel env ls`

### Session Expiry

If sessions expire too quickly:

1. Edit `src/mod/sessionManager.ts`
2. Adjust `expiresInSeconds` parameter in `createUserSession()`
3. Default is 3600 seconds (1 hour)

## Monitoring and Logs

### View Deployment Logs

```bash
# View logs for latest deployment
vercel logs

# Follow logs in real-time
vercel logs --follow

# View logs for specific deployment
vercel logs [deployment-url]
```

### Check MongoDB Metrics

1. Go to MongoDB Atlas dashboard
2. Click on your cluster
3. Navigate to **Metrics** tab
4. Monitor connections, operations, and storage

### Vercel Analytics

Enable in Vercel project settings (**Analytics**):
- Real-time traffic
- Performance metrics
- Error tracking

## Security Best Practices

1. **Never commit `.env` files** - Use `.env.example` instead
2. **Rotate secrets regularly** - Especially `JWT_SECRET`
3. **Use strong passwords** - For MongoDB users
4. **Monitor access logs** - Check for suspicious activity
5. **Enable 2FA** - On Vercel and MongoDB Atlas accounts
6. **Limit database permissions** - Use least privilege principle
7. **Regular backups** - Enable automated backups in MongoDB Atlas

## Production Checklist

Before going live:

### Database Setup
- [ ] MongoDB Atlas **staging** cluster created
- [ ] MongoDB Atlas **production** cluster created (separate!)
- [ ] Upstash Redis database created (shared for staging + production)
- [ ] Database backups enabled in Atlas for both clusters

### Vercel Configuration
- [ ] `JWT_SECRET` set for Production + Preview (shared)
- [ ] `REDIS_URL` set for Production + Preview (shared)
- [ ] `MONGODB_URI` set for **Preview** (staging database)
- [ ] `MONGODB_URI` set for **Production** (production database)
- [ ] `MONGODB_DB_NAME` set for Production + Preview
- [ ] Verify variables with `vercel env ls`

### Deployment
- [ ] Custom domain configured (optional)
- [ ] SSL/TLS enabled (automatic with Vercel)
- [ ] Test staging deployment (create a PR)
- [ ] Verify staging uses staging database
- [ ] Test authentication flow in staging
- [ ] Test database operations in staging
- [ ] Merge to main → production deployment
- [ ] Verify production uses production database

### Security
- [ ] JWT_SECRET is production-grade (32+ bytes, not dev secret)
- [ ] MongoDB Atlas IP whitelist configured
- [ ] Error monitoring configured
- [ ] Review security settings
- [ ] Rotate secrets regularly

## Support

- **Vercel Documentation**: https://vercel.com/docs
- **MongoDB Atlas Documentation**: https://docs.atlas.mongodb.com/
- **Astro Documentation**: https://docs.astro.build/
- **Project Issues**: https://github.com/kion-dgl/psz-sketch/issues
