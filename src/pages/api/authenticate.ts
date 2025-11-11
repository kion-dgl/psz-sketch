/**
 * POST /api/authenticate
 * 
 * Verifies the signature of the challenge and returns a JWT if valid.
 */

import type { APIRoute } from 'astro';
import { users, challenges } from '../../mod/serverStorage';
import { verifySignature, generateJWT } from '../../mod/serverCrypto';
import { createUserSession } from '../../mod/sessionManager';

export const POST: APIRoute = async ({ request, session }) => {
  try {
    const body = await request.json();
    const { fingerprint, signature } = body;

    if (!fingerprint || !signature) {
      return new Response(
        JSON.stringify({ error: 'Missing fingerprint or signature' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get the user
    const user = await users.get(fingerprint);
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get the challenge
    const challengeData = await challenges.get(fingerprint);
    if (!challengeData) {
      return new Response(
        JSON.stringify({ error: 'No challenge found' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if challenge has expired
    const now = Date.now();
    if (now - challengeData.timestamp > challengeData.expiresIn) {
      await challenges.delete(fingerprint);
      return new Response(
        JSON.stringify({ error: 'Challenge expired' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Delete the challenge immediately (prevent replay attacks)
    const challenge = challengeData.challenge;
    await challenges.delete(fingerprint);

    // Verify the signature
    const isValid = await verifySignature(
      user.publicKey,
      challenge,
      signature
    );

    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate JWT
    const jwt = generateJWT(fingerprint);

    // Create session for the authenticated user
    await createUserSession(session, fingerprint);

    return new Response(
      JSON.stringify({ jwt }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in /api/authenticate:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
