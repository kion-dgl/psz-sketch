/**
 * Server-side cryptography utilities
 * Handles signature verification and JWT generation
 */

import jwt from 'jsonwebtoken';
import { webcrypto } from 'node:crypto';

// Use Node.js webcrypto implementation
const { subtle } = webcrypto;

// Secret key for JWT signing (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret-key-change-in-production';

/**
 * Converts a base64 string to an ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = Buffer.from(base64, 'base64').toString('binary');
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Verifies that a fingerprint matches a public key
 */
export async function verifyFingerprint(
  fingerprint: string,
  fullPublicKey: string
): Promise<boolean> {
  try {
    // Convert base64 public key to ArrayBuffer
    const publicKeyBuffer = base64ToArrayBuffer(fullPublicKey);

    // Hash with SHA-256
    const hashBuffer = await subtle.digest('SHA-256', publicKeyBuffer);

    // Take first 30 bytes
    const fingerprintBytes = new Uint8Array(hashBuffer).slice(0, 30);

    // Base64 encode
    const calculatedFingerprint = Buffer.from(fingerprintBytes).toString('base64');

    return calculatedFingerprint === fingerprint;
  } catch (error) {
    console.error('Error verifying fingerprint:', error);
    return false;
  }
}

/**
 * Verifies a signature against a challenge using the public key
 */
export async function verifySignature(
  fullPublicKey: string,
  challenge: string,
  signature: string
): Promise<boolean> {
  try {
    // Import the public key
    const publicKeyBuffer = base64ToArrayBuffer(fullPublicKey);
    const publicKey = await subtle.importKey(
      'spki',
      publicKeyBuffer,
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      false,
      ['verify']
    );

    // Convert challenge to ArrayBuffer
    const challengeBuffer = Buffer.from(challenge, 'utf-8');

    // Convert signature to ArrayBuffer
    const signatureBuffer = base64ToArrayBuffer(signature);

    // Verify the signature
    const isValid = await subtle.verify(
      {
        name: 'ECDSA',
        hash: 'SHA-256',
      },
      publicKey,
      signatureBuffer,
      challengeBuffer
    );

    return isValid;
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

/**
 * Generates a JWT for an authenticated user
 */
export function generateJWT(fingerprint: string): string {
  const payload = {
    sub: fingerprint,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
  };

  return jwt.sign(payload, JWT_SECRET);
}

/**
 * Verifies a JWT and returns the payload
 */
export function verifyJWT(token: string): { sub: string } | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
    return payload;
  } catch (error) {
    console.error('Error verifying JWT:', error);
    return null;
  }
}
