/**
 * Server-side storage
 * - Users: MongoDB (persistent)
 * - Challenges: Redis with TTL (temporary, auto-expire)
 */

import { getCollection } from './mongodb';
import type { UserDocument } from './collections';

// Re-export types for convenience
export type User = UserDocument;

export interface ChallengeData {
  fingerprint: string;
  challenge: string;
  timestamp: number;
  expiresIn: number;
}

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
 * Challenges storage
 * Always uses in-memory storage since challenges are temporary (2 min TTL)
 * In production, expired challenges are cleaned up periodically
 */
export const challenges = {
  async get(fingerprint: string): Promise<ChallengeData | undefined> {
    const data = inMemoryChallenges.get(fingerprint);

    // Check if expired
    if (data) {
      const now = Date.now();
      const expiresAt = data.timestamp + data.expiresIn;
      if (now > expiresAt) {
        // Expired, delete and return undefined
        inMemoryChallenges.delete(fingerprint);
        return undefined;
      }
    }

    return data;
  },

  async set(fingerprint: string, data: ChallengeData): Promise<void> {
    inMemoryChallenges.set(fingerprint, data);

    // Schedule automatic cleanup after expiry
    setTimeout(() => {
      inMemoryChallenges.delete(fingerprint);
    }, data.expiresIn);
  },

  async delete(fingerprint: string): Promise<void> {
    inMemoryChallenges.delete(fingerprint);
  },
};

