/**
 * Server-side storage
 * In-memory storage for users and challenges (demo purposes)
 * In production, this would use Redis for challenges and a database for users
 */

export interface User {
  fingerprint: string;
  publicKey: string;
  createdAt: string;
}

export interface ChallengeData {
  challenge: string;
  timestamp: number;
  expiresIn: number;
}

// In-memory storage (for demo purposes)
export const users = new Map<string, User>();
export const challenges = new Map<string, ChallengeData>();

