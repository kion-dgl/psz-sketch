/**
 * Authentication Service
 * Handles the challenge-response authentication flow
 */

import {
  getOrCreateKey,
  getPublicKeyDetails,
  signData,
} from './keyManager';

export interface ChallengeResponse {
  challenge: string;
}

export interface AuthenticateResponse {
  jwt: string;
}

/**
 * Performs the complete authentication flow
 * Returns a JWT token on success
 */
export async function authenticate(apiBaseUrl: string = ''): Promise<string> {
  // Step 1: Get or create the key pair
  const keyPair = await getOrCreateKey();

  // Step 2: Get public key details (fingerprint and full public key)
  const { fingerprint, fullPublicKey } = await getPublicKeyDetails(
    keyPair.publicKey
  );

  // Step 3: Request a challenge from the server
  const challengeResponse = await fetch(`${apiBaseUrl}/api/challenge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fingerprint,
      fullPublicKey,
    }),
  });

  if (!challengeResponse.ok) {
    throw new Error(`Challenge request failed: ${challengeResponse.status}`);
  }

  const { challenge }: ChallengeResponse = await challengeResponse.json();

  // Step 4: Sign the challenge with the private key
  const signature = await signData(keyPair.privateKey, challenge);

  // Step 5: Send the signature to the server for authentication
  const authResponse = await fetch(`${apiBaseUrl}/api/authenticate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fingerprint,
      signature,
    }),
  });

  if (!authResponse.ok) {
    throw new Error(`Authentication failed: ${authResponse.status}`);
  }

  const { jwt }: AuthenticateResponse = await authResponse.json();

  return jwt;
}

/**
 * Stores the JWT token (in memory for now, can be extended to use sessionStorage)
 */
let currentJwt: string | null = null;

export function setJwt(jwt: string): void {
  currentJwt = jwt;
  // Optionally store in sessionStorage for persistence
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('jwt', jwt);
  }
}

export function getJwt(): string | null {
  if (currentJwt) {
    return currentJwt;
  }
  // Try to retrieve from sessionStorage
  if (typeof sessionStorage !== 'undefined') {
    currentJwt = sessionStorage.getItem('jwt');
  }
  return currentJwt;
}

export function clearJwt(): void {
  currentJwt = null;
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem('jwt');
  }
}

/**
 * Makes an authenticated API request with the JWT token
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const jwt = getJwt();
  if (!jwt) {
    throw new Error('No JWT token available. Please authenticate first.');
  }

  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${jwt}`);

  return fetch(url, {
    ...options,
    headers,
  });
}
