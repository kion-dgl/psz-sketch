/**
 * Session Manager
 * Handles user session creation and validation
 *
 * This module works alongside JWT authentication to provide a complete auth solution:
 *
 * - **Sessions**: Used for server-side page authentication (e.g., /sync, /character-select)
 *   - Stored server-side (in-memory for dev, Redis for production)
 *   - Checked by AuthenticatedLayout to protect pages
 *   - Created after successful JWT authentication
 *
 * - **JWT**: Used for API endpoint authentication (e.g., /api/*)
 *   - Sent as Authorization header: Bearer <token>
 *   - Verified by individual API endpoints
 *   - Stateless and portable
 *
 * Flow:
 * 1. User authenticates via challenge-response → receives JWT
 * 2. Server creates session for the user
 * 3. Pages use AuthenticatedLayout → checks session
 * 4. API calls include JWT in header → verified per request
 */

import type { AstroGlobal } from 'astro';

export interface UserSession {
  fingerprint: string;
  authenticatedAt: number;
  expiresAt: number;
}

/**
 * Creates a session for an authenticated user
 */
export async function createUserSession(
  session: AstroGlobal['session'],
  fingerprint: string,
  expiresInSeconds: number = 3600 // 1 hour default
): Promise<void> {
  const now = Date.now();
  const sessionData: UserSession = {
    fingerprint,
    authenticatedAt: now,
    expiresAt: now + (expiresInSeconds * 1000),
  };

  await session.set('user', sessionData);
}

/**
 * Gets the current user session
 */
export async function getUserSession(
  session: AstroGlobal['session']
): Promise<UserSession | null> {
  const userData = await session.get('user');

  if (!userData) {
    return null;
  }

  // Check if session has expired
  const now = Date.now();
  if (userData.expiresAt < now) {
    await session.destroy();
    return null;
  }

  return userData;
}

/**
 * Destroys the current user session
 */
export async function destroyUserSession(
  session: AstroGlobal['session']
): Promise<void> {
  await session.destroy();
}

/**
 * Checks if a user is authenticated
 */
export async function isAuthenticated(
  session: AstroGlobal['session']
): Promise<boolean> {
  const userData = await getUserSession(session);
  return userData !== null;
}
