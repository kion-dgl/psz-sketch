/**
 * Server-side storage
 * Uses MongoDB for persistent storage in production
 * Falls back to in-memory storage in development
 */

import { getCollection } from './mongodb';
import type { UserDocument, ChallengeDocument } from './collections';

// Re-export types for convenience
export type User = UserDocument;
export type ChallengeData = ChallengeDocument;

// Check if MongoDB is configured
const USE_MONGODB = !!process.env.MONGODB_URI;

// In-memory fallback for development
const inMemoryUsers = new Map<string, User>();
const inMemoryChallenges = new Map<string, ChallengeData>();

/**
 * Users collection wrapper
 */
export const users = {
  async get(fingerprint: string): Promise<User | undefined> {
    if (USE_MONGODB) {
      const collection = await getCollection<User>('users');
      const user = await collection.findOne({ fingerprint });
      return user || undefined;
    }
    return inMemoryUsers.get(fingerprint);
  },

  async set(fingerprint: string, user: User): Promise<void> {
    if (USE_MONGODB) {
      const collection = await getCollection<User>('users');
      await collection.updateOne(
        { fingerprint },
        { $set: user },
        { upsert: true }
      );
    } else {
      inMemoryUsers.set(fingerprint, user);
    }
  },

  async has(fingerprint: string): Promise<boolean> {
    if (USE_MONGODB) {
      const collection = await getCollection<User>('users');
      const count = await collection.countDocuments({ fingerprint });
      return count > 0;
    }
    return inMemoryUsers.has(fingerprint);
  },
};

/**
 * Challenges collection wrapper
 */
export const challenges = {
  async get(fingerprint: string): Promise<ChallengeData | undefined> {
    if (USE_MONGODB) {
      const collection = await getCollection<ChallengeData>('challenges');
      const challenge = await collection.findOne({ fingerprint });
      return challenge || undefined;
    }
    return inMemoryChallenges.get(fingerprint);
  },

  async set(fingerprint: string, data: ChallengeData): Promise<void> {
    if (USE_MONGODB) {
      const collection = await getCollection<ChallengeData>('challenges');
      await collection.updateOne(
        { fingerprint },
        { $set: data },
        { upsert: true }
      );
    } else {
      inMemoryChallenges.set(fingerprint, data);
    }
  },

  async delete(fingerprint: string): Promise<void> {
    if (USE_MONGODB) {
      const collection = await getCollection<ChallengeData>('challenges');
      await collection.deleteOne({ fingerprint });
    } else {
      inMemoryChallenges.delete(fingerprint);
    }
  },
};

