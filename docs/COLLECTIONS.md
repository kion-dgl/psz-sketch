# MongoDB Collection Management

This document explains how MongoDB collections are defined and managed in this project.

## Philosophy

We use a **pragmatic, code-first approach** for early development:

1. ✅ **Define in code** - All schemas tracked in source control
2. ✅ **Lazy initialization** - Collections created automatically on startup
3. ✅ **Fast iteration** - Change schemas without migration scripts
4. ✅ **Eventually stable** - Can evolve to proper migrations when needed

## How It Works

### Automatic Initialization

Collections are defined in `src/mod/collections.ts` and automatically created when the app starts:

**Local Development:**

```typescript
// On first database connection:
connectToDatabase()
  → initializeCollections()
    → Creates missing collections
    → Updates validation schemas
    → Ensures indexes exist
```

**Deployed Environments (Vercel):**
- Collections initialized on first request (cold start)
- Safe across multiple serverless instances
- Idempotent operations (safe to run multiple times)
- Staging and Production databases initialized independently

See [COLLECTIONS_DEPLOYMENT.md](COLLECTIONS_DEPLOYMENT.md) for complete deployment details.

### Collection Definitions

Each collection is defined with:
- **Document interface** (TypeScript types)
- **Validation schema** (MongoDB JSON Schema)
- **Indexes** (including TTL indexes)

Example:
```typescript
export interface UserDocument {
  fingerprint: string;
  publicKey: string;
  createdAt: string;
}

const UsersCollectionSchema = {
  validator: { $jsonSchema: { /* ... */ } }
};

const UsersIndexes = [
  { key: { fingerprint: 1 }, unique: true }
];
```

## Current Collections

### `users`

Stores registered users with their ECDSA public keys.

**Schema:**
```typescript
{
  fingerprint: string;    // SHA-256 hash of public key (40 chars)
  publicKey: string;      // Full ECDSA P-256 public key (base64)
  createdAt: string;      // ISO 8601 timestamp
}
```

**Indexes:**
- `fingerprint` (unique) - Fast user lookup
- `createdAt` - Sort by registration date

### `challenges`

Stores authentication challenges (temporary, auto-expires).

**Schema:**
```typescript
{
  fingerprint: string;    // User fingerprint
  challenge: string;      // Random challenge (base64)
  timestamp: number;      // Unix timestamp (ms)
  expiresIn: number;      // TTL in milliseconds
}
```

**Indexes:**
- `fingerprint` (unique) - One challenge per user
- `timestamp` (TTL: 5 minutes) - Auto-delete old challenges

## Adding New Collections

When you need a new collection:

### 1. Define the Interface

Add to `src/mod/collections.ts`:
```typescript
export interface CharacterDocument {
  id: string;
  userId: string;
  name: string;
  level: number;
  createdAt: string;
}
```

### 2. Define the Schema

```typescript
const CharactersCollectionSchema = {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['id', 'userId', 'name', 'level', 'createdAt'],
      properties: {
        id: { bsonType: 'string' },
        userId: { bsonType: 'string' },
        name: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 20,
        },
        level: {
          bsonType: 'int',
          minimum: 1,
          maximum: 200,
        },
        createdAt: { bsonType: 'string' },
      },
    },
  },
  validationAction: 'error',
  validationLevel: 'moderate',
};
```

### 3. Define Indexes

```typescript
const CharactersIndexes = [
  {
    key: { id: 1 },
    unique: true,
    name: 'id_unique',
  },
  {
    key: { userId: 1 },
    name: 'user_id_idx',
  },
  {
    key: { name: 1 },
    name: 'name_idx',
  },
];
```

### 4. Add to COLLECTIONS

```typescript
export const COLLECTIONS = {
  users: { /* ... */ },
  challenges: { /* ... */ },
  characters: {  // NEW
    name: 'characters',
    schema: CharactersCollectionSchema,
    indexes: CharactersIndexes,
  },
} as const;
```

### 5. Deploy

That's it! Next time the app starts:
- Collection is created automatically
- Schema validation is applied
- Indexes are created

## Monitoring Collections

### View Statistics

```bash
# Check collection stats
curl http://localhost:4321/api/db-stats
```

Returns:
```json
{
  "database": "psz-sketch",
  "collections": {
    "users": {
      "documentCount": 42,
      "indexes": [
        { "name": "_id_", "keys": { "_id": 1 } },
        { "name": "fingerprint_unique", "keys": { "fingerprint": 1 } }
      ]
    },
    "challenges": {
      "documentCount": 3,
      "indexes": [...]
    }
  },
  "timestamp": "2025-01-11T10:30:00.000Z"
}
```

### MongoDB Compass

Connect with MongoDB Compass to visually inspect:
```
mongodb://psz_user:psz_password@localhost:27017/?authSource=admin
```

### Mongo Express

If using Docker:
```
http://localhost:8082
```

## Schema Changes

### During Development

Just update the schema in `collections.ts` and restart:

```typescript
// Add new field
properties: {
  fingerprint: { bsonType: 'string' },
  publicKey: { bsonType: 'string' },
  createdAt: { bsonType: 'string' },
  lastLoginAt: { bsonType: 'string' },  // NEW
}
```

On restart:
- Validation schema is updated
- Existing documents are **not** validated (validationLevel: 'moderate')
- New documents must match schema

### Adding Required Fields

If you add a required field to existing collection:

**Option 1: Backfill (recommended)**
```typescript
// Run once to backfill missing fields
const db = await connectToDatabase();
await db.collection('users').updateMany(
  { lastLoginAt: { $exists: false } },
  { $set: { lastLoginAt: null } }
);
```

**Option 2: Make Optional**
```typescript
// Remove from 'required' array temporarily
required: ['fingerprint', 'publicKey', 'createdAt'],
// lastLoginAt is optional
```

## Migration to Production

When your schema stabilizes, you should migrate to proper migration scripts.

### Why Migrations?

- ✅ Explicit version tracking
- ✅ Rollback capability
- ✅ Safe for production
- ✅ Coordinate with deploys

### Recommended Tools

**For Node.js:**
- [migrate-mongo](https://github.com/seppevs/migrate-mongo)
- [node-mongodb-migrations](https://github.com/mycodeself/node-mongodb-migrations)

**Manual approach:**
- Create `migrations/` folder
- Write migration scripts
- Track applied migrations in database

### When to Migrate?

You should switch to migrations when:
- ❌ Schema is stable (few changes)
- ❌ You have production users
- ❌ Need to backfill data
- ❌ Need rollback capability
- ❌ Multiple developers on team

Until then, code-first is fine!

## Best Practices

### ✅ DO

- Define all schemas in `collections.ts`
- Use TypeScript interfaces for type safety
- Add indexes for frequently queried fields
- Use TTL indexes for temporary data
- Set validation to 'moderate' (don't validate existing docs)
- Test schema changes locally first

### ❌ DON'T

- Don't manually create collections in MongoDB
- Don't add indexes manually (define in code)
- Don't set validationLevel to 'strict' in development
- Don't add required fields without backfilling
- Don't change field types without migration plan

## Validation Levels

**strict** (not recommended for development):
- Validates all inserts AND updates
- Existing documents must match schema
- Use in production when stable

**moderate** (recommended):
- Validates inserts and updates to existing fields
- Doesn't validate updates to other fields
- Existing documents can be invalid
- Use during development

**off**:
- No validation
- Not recommended

## Index Management

### Automatic Creation

Indexes are created/updated on startup. MongoDB's `createIndex()` is idempotent:
- If index exists with same spec → no-op
- If index exists with different spec → recreate
- If index doesn't exist → create

### Monitoring Indexes

Check which indexes are actually used:
```javascript
// In MongoDB shell
db.users.aggregate([
  { $indexStats: {} }
])
```

### Removing Old Indexes

If you remove an index from code, it's **not** automatically dropped.

To drop manually:
```javascript
db.users.dropIndex('old_index_name')
```

Or reset everything:
```bash
# Drop all collections (WARNING: deletes data!)
curl -X POST http://localhost:4321/api/db-reset
```

## Troubleshooting

### Collection Not Created

Check logs:
```
✅ Connected to MongoDB
🗄️  Initializing MongoDB collections...
  ✨ Creating collection: users
  📇 Ensuring index: users.fingerprint_unique
  ✅ Collection ready: users
```

If missing, check:
1. MongoDB connection is working
2. No errors in console
3. `initializeCollections()` is called

### Validation Errors

If inserts fail with validation errors:

1. Check the document matches schema
2. Verify required fields are present
3. Check field types match
4. Look for typos in field names

Example error:
```
Document failed validation
Additional properties not allowed: lastName
```

Fix: Add `lastName` to schema or remove from document.

### Index Creation Failed

Common issues:

**Duplicate key error:**
```
E11000 duplicate key error
```
→ Data violates unique constraint. Clean up duplicates first.

**Index already exists with different spec:**
```
Index with name X already exists with different options
```
→ Drop old index: `db.collection.dropIndex('X')`

## Example: Adding Characters

Complete example of adding a new collection:

```typescript
// src/mod/collections.ts

// 1. Interface
export interface CharacterDocument {
  characterId: string;
  userFingerprint: string;
  name: string;
  class: 'HUmar' | 'HUnewearl' | 'RAmar' | 'RAcast' | 'FOmarl' | 'FOnewm';
  level: number;
  experience: number;
  stats: {
    hp: number;
    tp: number;
    atp: number;
    dfp: number;
  };
  createdAt: string;
  lastPlayedAt: string;
}

// 2. Schema
const CharactersCollectionSchema = {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['characterId', 'userFingerprint', 'name', 'class', 'level'],
      properties: {
        characterId: { bsonType: 'string' },
        userFingerprint: { bsonType: 'string' },
        name: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 12,
        },
        class: {
          enum: ['HUmar', 'HUnewearl', 'RAmar', 'RAcast', 'FOmarl', 'FOnewm'],
        },
        level: {
          bsonType: 'int',
          minimum: 1,
          maximum: 200,
        },
        // ... other fields
      },
    },
  },
  validationAction: 'error',
  validationLevel: 'moderate',
};

// 3. Indexes
const CharactersIndexes = [
  { key: { characterId: 1 }, unique: true, name: 'character_id_unique' },
  { key: { userFingerprint: 1 }, name: 'user_fingerprint_idx' },
  { key: { name: 1 }, name: 'name_idx' },
  { key: { level: -1 }, name: 'level_desc_idx' },
];

// 4. Add to COLLECTIONS
export const COLLECTIONS = {
  users: { /* ... */ },
  challenges: { /* ... */ },
  characters: {
    name: 'characters',
    schema: CharactersCollectionSchema,
    indexes: CharactersIndexes,
  },
} as const;
```

Restart the app, and the collection is ready to use!

## Resources

- [MongoDB Schema Validation](https://docs.mongodb.com/manual/core/schema-validation/)
- [MongoDB Indexes](https://docs.mongodb.com/manual/indexes/)
- [JSON Schema](https://json-schema.org/)
- [TTL Indexes](https://docs.mongodb.com/manual/core/index-ttl/)
