# Collections in Deployed Environments - TL;DR

## How It Works

```
Deploy to Vercel
  ↓
First Request → Cold Start
  ↓
Connect to MongoDB
  ↓
Initialize Collections
  ✓ Create if missing
  ✓ Update validation
  ✓ Ensure indexes
  ↓
Handle Request
```

## Is It Safe?

**Yes!** ✅

- **Idempotent** - Safe to run multiple times
- **Race-safe** - MongoDB handles concurrent creates
- **Zero-downtime** - Works during rolling deploys
- **Per-environment** - Staging and production separate

## What Happens on Deploy?

### First Deploy (Empty Database)
```
Collections don't exist
  → Create collections
  → Apply validation schemas
  → Create indexes
  → Ready to use
```

### Subsequent Deploys
```
Collections exist
  → Update validation schemas (if changed)
  → Create new indexes (if added)
  → Create new collections (if added)
  → No-op for unchanged (fast)
```

## Performance Impact

| Collection Size | Impact | Notes |
|----------------|--------|-------|
| < 1K docs | None | Instant |
| 1K - 100K docs | Low | Seconds, background indexes |
| > 100K docs | Moderate | Minutes, pre-create indexes |

## Common Scenarios

### Adding Optional Field
```typescript
// SAFE ✅
properties: {
  name: { bsonType: 'string' },
  email: { bsonType: 'string' }  // NEW, optional
}
```
Deploy → Works immediately → No backfill needed

### Adding Required Field
```typescript
// NEEDS BACKFILL ⚠️
required: ['name', 'email']  // email now required
```
Deploy → Need to backfill existing documents first

### Adding New Collection
```typescript
// SAFE ✅
COLLECTIONS = {
  users: { /* ... */ },
  characters: { /* ... */ }  // NEW
}
```
Deploy → Collection created automatically

### Adding Index
```typescript
// SAFE ✅ (if collection small)
indexes: [
  { key: { name: 1 } },
  { key: { email: 1 } }  // NEW
]
```
Deploy → Index created in background

## Staging → Production Flow

```
1. Develop Locally
   docker-compose up -d
   npm run dev
   ✓ Test in local Docker MongoDB

2. Create PR → Staging Deploy
   ✓ Staging database initialized
   ✓ Collections created in staging
   ✓ Test with staging data

3. Merge → Production Deploy
   ✓ Production database initialized
   ✓ Collections created in production
   ✓ Production data safe
```

## Monitoring

### Check Logs (Vercel)
```
✅ Connected to MongoDB
🗄️  Initializing MongoDB collections...
  ✨ Creating collection: users
  ✅ Collection ready: users
✨ All collections initialized!
```

### Check Database (API)
```bash
curl https://your-app.vercel.app/api/db-stats
```

### Check Atlas
MongoDB Atlas → Metrics → Operations
- Spike during deploy = normal
- Watch for slow queries

## Potential Issues

### Cold Start Timeout
**Problem:** Index creation takes too long
**Solution:** Pre-create large indexes manually

### Multiple Instances
**Problem:** 10 instances all initializing
**Solution:** MongoDB handles it (idempotent)

### Breaking Changes
**Problem:** New validation breaks old code
**Solution:** Test in staging first

## Best Practices

✅ **Test in staging first** - Always test deploys in staging
✅ **Make backwards-compatible changes** - Add optional fields
✅ **Monitor during deploys** - Watch logs and metrics
✅ **Pre-create large indexes** - If collection > 100K docs

❌ **Don't make required fields without backfill**
❌ **Don't change field types without migration**
❌ **Don't deploy during peak traffic** (large collections)

## When to Migrate to Proper Migrations?

Stay with code-first until:
- ❌ Production users affected by downtime
- ❌ Collections > 100K documents
- ❌ Schema changes require complex data migrations
- ❌ Need rollback capability

Then migrate to migrate-mongo or similar.

## Summary

**Current approach works great for:**
- ✅ Early development
- ✅ Small to medium collections
- ✅ Fast iteration
- ✅ Simple schema changes

**Safe in production because:**
- ✅ Idempotent operations
- ✅ MongoDB handles races
- ✅ Tested in staging first
- ✅ Zero-downtime deploys

**Full details:** [docs/COLLECTIONS_DEPLOYMENT.md](docs/COLLECTIONS_DEPLOYMENT.md)
