# Collection Initialization in Deployed Environments

This document explains how the code-first collection approach works when deployed to Vercel.

## How It Works in Production

### First Deployment

When you first deploy to Vercel (staging or production):

```
Deploy to Vercel
  ↓
First Request Arrives
  ↓
Serverless Function Starts (Cold Start)
  ↓
Connect to MongoDB
  ↓
Initialize Collections
  ✓ Create collections (don't exist yet)
  ✓ Apply validation schemas
  ✓ Create indexes
  ↓
Handle Request
```

**Timeline:**
- Happens once per environment (staging, production)
- Each environment has separate database
- Collections created on first request to that environment

### Subsequent Deployments

On every new deployment:

```
New Deployment
  ↓
Old Functions Still Running (Zero-downtime)
  ↓
New Functions Start Receiving Traffic
  ↓
Each New Instance:
  - Connects to MongoDB
  - Runs initializeCollections()
  - Collections already exist → updates validation
  - Indexes already exist → no-op (idempotent)
  - New collections → creates them
```

**Key Points:**
- ✅ Validation schemas updated immediately
- ✅ New indexes created automatically
- ✅ New collections created on deploy
- ✅ Existing data preserved

## Vercel Serverless Behavior

### Multiple Instances

Vercel runs multiple serverless function instances:

```
Request 1 → Instance A (cold start → init collections)
Request 2 → Instance B (cold start → init collections)
Request 3 → Instance A (warm → uses cached connection)
Request 4 → Instance C (cold start → init collections)
```

**Each instance:**
- Has its own cached MongoDB connection
- Runs initialization on first connection
- Initialization is idempotent (safe to run multiple times)

### Race Conditions

Multiple instances might initialize simultaneously:

```
Instance A: db.createCollection('users')
Instance B: db.createCollection('users')  ← Already exists, no problem
```

**MongoDB handles this gracefully:**
- `createCollection()` returns error if exists (we handle it)
- `createIndex()` is idempotent (creates if missing, no-op if exists)
- `collMod` (validation update) is atomic

**Result:** Safe, no corruption, some redundant operations.

## Schema Changes

### Adding a Field (Non-Required)

```typescript
// Before
properties: {
  fingerprint: { bsonType: 'string' },
  publicKey: { bsonType: 'string' },
}

// After - add optional field
properties: {
  fingerprint: { bsonType: 'string' },
  publicKey: { bsonType: 'string' },
  displayName: { bsonType: 'string' },  // NEW
}
```

**On Deploy:**
1. New validation schema applied
2. Existing documents unchanged (validationLevel: 'moderate')
3. New documents can have displayName
4. Old documents without displayName still valid

**Safe:** ✅ Yes, no backfill needed

### Adding a Required Field

```typescript
// After - add required field
required: ['fingerprint', 'publicKey', 'displayName'],  // displayName now required
```

**On Deploy:**
1. New validation schema applied
2. New inserts MUST have displayName
3. Existing documents still valid (not re-validated)
4. Updates to existing documents will fail validation

**Safe:** ⚠️ Requires backfill or data migration

**Solution:**
```typescript
// In a migration script or startup hook
const db = await connectToDatabase();
await db.collection('users').updateMany(
  { displayName: { $exists: false } },
  { $set: { displayName: 'Anonymous' } }
);
```

### Removing a Field

```typescript
// Before
properties: {
  fingerprint: { bsonType: 'string' },
  publicKey: { bsonType: 'string' },
  deprecated: { bsonType: 'string' },
}

// After - remove field
properties: {
  fingerprint: { bsonType: 'string' },
  publicKey: { bsonType: 'string' },
  // deprecated removed
}
```

**On Deploy:**
1. New validation doesn't mention field
2. Existing documents keep the field (data not deleted)
3. New documents won't have the field

**Safe:** ✅ Yes, old data remains but ignored

**Cleanup (optional):**
```typescript
await db.collection('users').updateMany(
  { deprecated: { $exists: true } },
  { $unset: { deprecated: '' } }
);
```

### Changing Field Type

```typescript
// Before
level: { bsonType: 'int' }

// After
level: { bsonType: 'string' }  // Changed type!
```

**On Deploy:**
1. New validation expects string
2. Existing documents have int (validation fails!)
3. Updates to existing documents fail

**Safe:** ❌ No, requires data migration

**Solution:**
```typescript
// Must migrate data before deploying schema change
const docs = await db.collection('characters').find({ level: { $type: 'int' } });
for (const doc of docs) {
  await db.collection('characters').updateOne(
    { _id: doc._id },
    { $set: { level: doc.level.toString() } }
  );
}
```

## Index Creation Performance

### Small Collections (<1000 docs)

**Impact:** Negligible
- Indexes created in milliseconds
- No noticeable delay

### Medium Collections (1K-100K docs)

**Impact:** Moderate
- Index creation takes seconds
- Happens in background (MongoDB 4.2+)
- First requests to new instances may be slow

**Mitigation:**
- Indexes created in background by default
- App remains responsive
- Some cold starts may take longer

### Large Collections (>100K docs)

**Impact:** Significant
- Index creation takes minutes
- Multiple instances creating same index
- Could cause load on database

**Mitigation:**

1. **Pre-create indexes manually:**
```bash
# Before deploying, create indexes manually in Atlas
db.users.createIndex({ fingerprint: 1 }, { unique: true, background: true })
```

2. **Deploy during low-traffic:**
- Schedule deploys during off-peak hours
- Staging can absorb the load first

3. **Use migration scripts:**
- Create indexes via migration before deploy
- Mark them as "managed" so init skips them

## Staging vs Production

### Separate Databases

Each environment has its own database:

```
Local:    mongodb://localhost:27017/psz-sketch
Staging:  mongodb+srv://...staging.../psz-sketch
Production: mongodb+srv://...production.../psz-sketch
```

**Initialization happens independently:**
- Staging PR → Staging database initialized
- Production deploy → Production database initialized
- Changes tested in staging first

### Testing Flow

```
1. Develop locally (Docker MongoDB)
   - Add new collection
   - Test locally

2. Create PR → Deploy to Staging
   - Staging database initialized
   - New collection created in staging
   - Test with staging data

3. Merge PR → Deploy to Production
   - Production database initialized
   - New collection created in production
   - Production data safe
```

## Potential Issues

### Issue 1: Cold Start Timeout

**Problem:**
- Index creation takes too long
- Serverless function times out (10s default)
- Request fails

**Solution:**
```typescript
// Skip index creation if taking too long
const INIT_TIMEOUT = 8000; // 8 seconds

export async function initializeCollections(db: Db): Promise<void> {
  const startTime = Date.now();

  for (const [key, definition] of Object.entries(COLLECTIONS)) {
    if (Date.now() - startTime > INIT_TIMEOUT) {
      console.warn('⚠️  Initialization timeout, skipping remaining collections');
      break;
    }
    // ... rest of initialization
  }
}
```

### Issue 2: Multiple Instances Race

**Problem:**
- 10 instances all try to create same index
- Unnecessary database load

**Solution:**
- MongoDB handles it (idempotent)
- Or use distributed lock:

```typescript
// Use Redis lock to coordinate
const lock = await redis.set('init-lock', '1', 'EX', 60, 'NX');
if (lock) {
  await initializeCollections(db);
  await redis.del('init-lock');
}
```

### Issue 3: Schema Validation Breaks Existing Code

**Problem:**
- Deploy new validation
- Old instances still running
- Old code violates new validation

**Solution:**
- Make validation changes backwards-compatible
- Use `validationLevel: 'moderate'` (default)
- Test in staging first

### Issue 4: Index Creation Blocks Database

**Problem:**
- Foreground index creation locks collection
- Other operations blocked

**Solution:**
- MongoDB 4.2+ uses background indexes by default
- Explicit: `{ background: true }`
- Already handled in our code

## Best Practices

### ✅ DO

1. **Test in Staging First**
   - Create PR → deploys to staging
   - Verify collections initialized
   - Check staging database in Atlas

2. **Make Backwards-Compatible Changes**
   - Add optional fields (not required)
   - Add new indexes (doesn't affect data)
   - Add new collections (isolated)

3. **Use validationLevel: 'moderate'**
   - Don't validate existing documents on update
   - Only validate new inserts
   - Safe for gradual rollouts

4. **Monitor Initialization**
   - Check Vercel logs for initialization messages
   - Watch MongoDB Atlas metrics during deploy
   - Set up alerts for slow queries

5. **Pre-create Large Indexes**
   - If collection has >100K documents
   - Create index manually in Atlas first
   - Then deploy code

### ❌ DON'T

1. **Don't Make Breaking Schema Changes**
   - Changing field types without migration
   - Making fields required without backfill
   - Removing required fields

2. **Don't Deploy During Peak Traffic**
   - Index creation adds load
   - Cold starts are slower
   - Wait for low-traffic period

3. **Don't Rely on Initialization Order**
   - Collections initialized in parallel
   - Don't assume users exists before challenges
   - Each collection is independent

4. **Don't Use validationLevel: 'strict'**
   - Validates all operations (slow)
   - Can break during rolling deploys
   - Use 'moderate' instead

## Monitoring

### Check Initialization Logs

**Vercel Dashboard → Functions → Logs:**
```
✅ Connected to MongoDB
🗄️  Initializing MongoDB collections...
  ✨ Creating collection: users
  📇 Ensuring index: users.fingerprint_unique
  ✅ Collection ready: users
✨ All collections initialized!
```

**Look for:**
- ✅ Success messages
- ⚠️ Warnings (timeouts, skips)
- ❌ Errors (failed to create)

### MongoDB Atlas Metrics

**Cluster → Metrics:**
- **Operations** - Spike during deploy (createIndex)
- **Connections** - New connections from Vercel
- **Query Performance** - Slow queries during init

**Set Alerts:**
- Slow query threshold (>1s)
- Connection spike
- CPU/memory usage

### Application Monitoring

```typescript
// Add to src/mod/mongodb.ts
export async function connectToDatabase(): Promise<Db> {
  const startTime = Date.now();

  // ... connection code ...

  if (!collectionsInitialized) {
    try {
      await initializeCollections(db);
      const duration = Date.now() - startTime;
      console.log(`✨ Collections initialized in ${duration}ms`);

      // Send to monitoring service
      // await analytics.track('collections_initialized', { duration });
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      // Alert team
    }
  }

  return db;
}
```

## Migration to Production Migrations

When you're ready for proper migrations:

### 1. Choose Migration Tool

- [migrate-mongo](https://github.com/seppevs/migrate-mongo)
- [node-mongodb-migrations](https://github.com/mycodeself/node-mongodb-migrations)
- Custom solution

### 2. Create Migration Scripts

```javascript
// migrations/001-create-users.js
module.exports = {
  async up(db) {
    await db.createCollection('users', {
      validator: { /* schema */ }
    });
    await db.collection('users').createIndex({ fingerprint: 1 }, { unique: true });
  },

  async down(db) {
    await db.dropCollection('users');
  }
};
```

### 3. Track Applied Migrations

```javascript
// migrations collection stores applied migrations
{
  version: 1,
  name: '001-create-users',
  appliedAt: '2025-01-11T10:00:00.000Z'
}
```

### 4. Run Migrations Before Deploy

```bash
# CI/CD pipeline
npm run migrate:up

# Then deploy
vercel deploy --prod
```

### 5. Disable Auto-initialization

```typescript
// src/mod/mongodb.ts
const AUTO_INIT = process.env.AUTO_INIT_COLLECTIONS === 'true';

if (!collectionsInitialized && AUTO_INIT) {
  await initializeCollections(db);
}
```

## Summary

### Current Approach (Code-First)

**Pros:**
- ✅ Fast iteration during development
- ✅ Everything in source control
- ✅ No migration tooling needed
- ✅ Automatic and idempotent
- ✅ Works in all environments

**Cons:**
- ⚠️ Index creation on every deploy
- ⚠️ Cold start overhead
- ⚠️ No rollback capability
- ⚠️ Breaking changes harder to manage

**Best For:**
- Early development
- Small teams
- Rapid prototyping
- Collections < 100K documents

### Migration Approach (Future)

**Pros:**
- ✅ Explicit version tracking
- ✅ Rollback capability
- ✅ Coordination with deploys
- ✅ Better for large collections

**Cons:**
- ❌ Requires migration tooling
- ❌ Slower iteration
- ❌ More ceremony

**Best For:**
- Production with users
- Large collections
- Multiple developers
- Stable schemas

## Conclusion

The code-first approach works well in deployed environments:

1. **Safe** - Idempotent operations, MongoDB handles races
2. **Automatic** - Collections created on deploy
3. **Tested** - Staging environment catches issues
4. **Evolves** - Can migrate to proper migrations later

**Recommendation:** Use code-first until you have:
- Production users
- Collections > 100K documents
- Stable schemas
- Need for rollbacks

Then migrate to proper migration tooling.
