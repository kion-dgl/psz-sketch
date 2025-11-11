/**
 * POST /api/challenge
 * 
 * Receives a fingerprint and public key, validates them, and returns a challenge.
 * If the user doesn't exist, it performs implicit registration.
 */

import type { APIRoute } from 'astro';
import { randomBytes } from 'node:crypto';
import { users, challenges } from '../../mod/serverStorage';
import { verifyFingerprint } from '../../mod/serverCrypto';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { fingerprint, fullPublicKey } = body;

    if (!fingerprint || !fullPublicKey) {
      return new Response(
        JSON.stringify({ error: 'Missing fingerprint or fullPublicKey' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify that the fingerprint matches the public key
    const isValid = await verifyFingerprint(fingerprint, fullPublicKey);
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Fingerprint does not match public key' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if user exists
    let user = await users.get(fingerprint);

    // If user doesn't exist, create them (implicit registration)
    if (!user) {
      user = {
        fingerprint,
        publicKey: fullPublicKey,
        createdAt: new Date().toISOString(),
      };
      await users.set(fingerprint, user);
    }

    // Generate a random challenge (32 bytes, base64-encoded)
    const challengeBytes = randomBytes(32);
    const challenge = challengeBytes.toString('base64');

    // Store the challenge with a timestamp (for expiry check)
    await challenges.set(fingerprint, {
      fingerprint,
      challenge,
      timestamp: Date.now(),
      expiresIn: 120000, // 2 minutes
    });

    return new Response(
      JSON.stringify({ challenge }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in /api/challenge:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

