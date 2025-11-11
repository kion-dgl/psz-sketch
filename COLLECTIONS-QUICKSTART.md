# MongoDB Collections - Quick Start

## Overview

Collections are **automatically created** when you start the app. Everything is defined in code and tracked in source control.

## Current Collections

| Collection | Purpose | Auto-Expires |
|-----------|---------|--------------|
| `users` | User registration data | No |
| `challenges` | Auth challenges | Yes (5 min) |

## How It Works

```
npm run dev
  ↓
Connect to MongoDB
  ↓
Initialize Collections
  ✓ Create missing collections
  ✓ Update validation schemas
  ✓ Ensure indexes exist
  ↓
App Ready!
```

## View Statistics

```bash
# Check collection stats
curl http://localhost:4321/api/db-stats

# Or visit in browser
open http://localhost:4321/api/db-stats
```

Returns:
```json
{
  "database": "psz-sketch",
  "collections": {
    "users": {
      "documentCount": 5,
      "indexes": [...]
    },
    "challenges": {
      "documentCount": 1,
      "indexes": [...]
    }
  }
}
```

## Adding a New Collection

Edit `src/mod/collections.ts`:

1. **Add interface:**
```typescript
export interface MyDocument {
  id: string;
  name: string;
  createdAt: string;
}
```

2. **Add schema:**
```typescript
const MyCollectionSchema = {
  validator: {
    $jsonSchema: {
      required: ['id', 'name'],
      properties: {
        id: { bsonType: 'string' },
        name: { bsonType: 'string' }
      }
    }
  }
};
```

3. **Add indexes:**
```typescript
const MyIndexes = [
  { key: { id: 1 }, unique: true }
];
```

4. **Add to COLLECTIONS:**
```typescript
export const COLLECTIONS = {
  users: { /* ... */ },
  challenges: { /* ... */ },
  myCollection: {  // NEW
    name: 'myCollection',
    schema: MyCollectionSchema,
    indexes: MyIndexes,
  }
};
```

5. **Restart** - Collection is created automatically!

## Philosophy

**Development:** Code-first, fast iteration
- Change schemas in code
- Restart to apply
- No migration scripts needed

**Eventually:** Migrate to proper migrations when stable
- Add migration tool
- Track versions
- Coordinate with deploys

See [docs/COLLECTIONS.md](docs/COLLECTIONS.md) for complete guide.

## Useful Commands

```bash
# View collections in MongoDB
docker exec -it psz-mongodb mongosh -u psz_user -p psz_password --authenticationDatabase admin

# In mongosh:
use psz-sketch
show collections
db.users.find()
db.users.countDocuments()
```

## Web UIs

- **Mongo Express**: http://localhost:8082 (if using Docker)
- **API Stats**: http://localhost:4321/api/db-stats
