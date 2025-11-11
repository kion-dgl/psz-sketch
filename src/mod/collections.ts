/**
 * MongoDB Collection Definitions
 *
 * This file defines all MongoDB collections, their schemas, and indexes.
 * Collections are automatically created/updated on application startup.
 *
 * Philosophy:
 * - Define everything in code (tracked in source control)
 * - Lazy during development (collections created on demand)
 * - Indexes and validation defined here
 * - Can evolve to proper migrations later when stable
 */

import { Db } from 'mongodb';

/**
 * User Collection
 * Stores registered users with their public keys
 */
export interface UserDocument {
  fingerprint: string;      // SHA-256 hash of public key (40 chars)
  publicKey: string;         // Full ECDSA P-256 public key (base64)
  createdAt: string;         // ISO 8601 timestamp
}

const UsersCollectionSchema = {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['fingerprint', 'publicKey', 'createdAt'],
      properties: {
        fingerprint: {
          bsonType: 'string',
          description: 'SHA-256 hash of public key (40 characters)',
          minLength: 40,
          maxLength: 40,
        },
        publicKey: {
          bsonType: 'string',
          description: 'Full ECDSA P-256 public key in base64 format',
        },
        createdAt: {
          bsonType: 'string',
          description: 'ISO 8601 timestamp of user registration',
        },
      },
    },
  },
  validationAction: 'error',
  validationLevel: 'moderate', // Don't validate existing documents on update
};

const UsersIndexes = [
  {
    key: { fingerprint: 1 },
    unique: true,
    name: 'fingerprint_unique',
  },
  {
    key: { createdAt: 1 },
    name: 'created_at_idx',
  },
];

/**
 * Challenge Collection
 * Stores authentication challenges (temporary, short-lived)
 */
export interface ChallengeDocument {
  fingerprint: string;       // User fingerprint
  challenge: string;         // Random challenge string (base64)
  timestamp: number;         // Unix timestamp (milliseconds)
  expiresIn: number;         // TTL in milliseconds
}

const ChallengesCollectionSchema = {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['fingerprint', 'challenge', 'timestamp', 'expiresIn'],
      properties: {
        fingerprint: {
          bsonType: 'string',
          description: 'User fingerprint',
        },
        challenge: {
          bsonType: 'string',
          description: 'Base64-encoded random challenge',
        },
        timestamp: {
          bsonType: 'number',
          description: 'Unix timestamp in milliseconds',
        },
        expiresIn: {
          bsonType: 'number',
          description: 'TTL in milliseconds',
        },
      },
    },
  },
  validationAction: 'error',
  validationLevel: 'moderate',
};

const ChallengesIndexes = [
  {
    key: { fingerprint: 1 },
    unique: true,
    name: 'fingerprint_unique',
  },
  {
    key: { timestamp: 1 },
    name: 'timestamp_idx',
    expireAfterSeconds: 300, // Auto-delete after 5 minutes (MongoDB TTL)
  },
];

/**
 * Collection Definitions
 * Add new collections here as the application grows
 */
export const COLLECTIONS = {
  users: {
    name: 'users',
    schema: UsersCollectionSchema,
    indexes: UsersIndexes,
  },
  challenges: {
    name: 'challenges',
    schema: ChallengesCollectionSchema,
    indexes: ChallengesIndexes,
  },
} as const;

/**
 * Initialize all collections
 * Creates collections with validation and indexes if they don't exist
 * Safe to call multiple times (idempotent)
 */
export async function initializeCollections(db: Db): Promise<void> {
  console.log('🗄️  Initializing MongoDB collections...');

  for (const [key, definition] of Object.entries(COLLECTIONS)) {
    const { name, schema, indexes } = definition;

    try {
      // Check if collection exists
      const collections = await db.listCollections({ name }).toArray();
      const exists = collections.length > 0;

      if (!exists) {
        // Create collection with validation
        console.log(`  ✨ Creating collection: ${name}`);
        await db.createCollection(name, schema);
      } else {
        // Update validation schema for existing collection
        console.log(`  ♻️  Updating collection schema: ${name}`);
        await db.command({
          collMod: name,
          validator: schema.validator,
          validationLevel: schema.validationLevel,
          validationAction: schema.validationAction,
        });
      }

      // Create or update indexes
      const collection = db.collection(name);
      for (const index of indexes) {
        console.log(`  📇 Ensuring index: ${name}.${index.name}`);
        await collection.createIndex(index.key, {
          name: index.name,
          unique: index.unique,
          expireAfterSeconds: index.expireAfterSeconds,
        });
      }

      console.log(`  ✅ Collection ready: ${name}`);
    } catch (error) {
      console.error(`  ❌ Error initializing collection ${name}:`, error);
      throw error;
    }
  }

  console.log('✨ All collections initialized!\n');
}

/**
 * Drop all collections (useful for testing/development)
 * WARNING: This deletes all data!
 */
export async function dropAllCollections(db: Db): Promise<void> {
  console.warn('⚠️  Dropping all collections...');

  for (const [key, definition] of Object.entries(COLLECTIONS)) {
    try {
      await db.collection(definition.name).drop();
      console.log(`  🗑️  Dropped: ${definition.name}`);
    } catch (error: any) {
      // Ignore "collection does not exist" errors
      if (error.code !== 26) {
        throw error;
      }
    }
  }

  console.log('✨ All collections dropped!\n');
}

/**
 * Get collection statistics (useful for debugging)
 */
export async function getCollectionStats(db: Db): Promise<Record<string, any>> {
  const stats: Record<string, any> = {};

  for (const [key, definition] of Object.entries(COLLECTIONS)) {
    try {
      const collection = db.collection(definition.name);
      const count = await collection.countDocuments();
      const indexes = await collection.indexes();

      stats[definition.name] = {
        documentCount: count,
        indexes: indexes.map((idx) => ({
          name: idx.name,
          keys: idx.key,
        })),
      };
    } catch (error) {
      stats[definition.name] = { error: 'Collection does not exist' };
    }
  }

  return stats;
}
