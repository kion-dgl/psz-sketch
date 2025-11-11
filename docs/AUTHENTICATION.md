# Authentication System - Usage Guide

## Quick Start

### Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the dev server**
   ```bash
   npm run dev
   ```

3. **Open the title screen**
   Navigate to `http://localhost:4321/title`

The authentication will happen automatically!

## How It Works

### For Users (Zero Friction!)

1. Visit the title screen
2. Authentication happens automatically in the background
3. See your unique ID displayed
4. Get redirected to the game

**No signup. No passwords. No friction.**

### For Developers

#### Client-Side Flow

```typescript
import { authenticate, setJwt } from '../lib/authService';

// Authenticate (handles everything automatically)
const jwt = await authenticate();

// Store the JWT
setJwt(jwt);

// Use JWT for authenticated requests
import { authenticatedFetch } from '../lib/authService';
const response = await authenticatedFetch('/api/game/save-state', {
  method: 'POST',
  body: JSON.stringify({ data: 'your game state' })
});
```

#### Key Management

```typescript
import { getOrCreateKey, getPublicKeyDetails } from '../lib/keyManager';

// Get or create key pair (stores in IndexedDB)
const keyPair = await getOrCreateKey();

// Get fingerprint and public key
const { fingerprint, fullPublicKey } = await getPublicKeyDetails(keyPair.publicKey);
```

#### Server-Side API

**Protect your endpoints:**

```typescript
import { verifyJWT } from '../lib/serverCrypto';

export const POST: APIRoute = async ({ request }) => {
  // Get JWT from header
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const token = authHeader.substring(7);
  const payload = verifyJWT(token);
  
  if (!payload) {
    return new Response('Invalid token', { status: 401 });
  }
  
  const userFingerprint = payload.sub;
  // ... handle authenticated request
};
```

## API Reference

### POST /api/challenge

Request a challenge for authentication.

**Request:**
```json
{
  "fingerprint": "40-character-base64-string",
  "fullPublicKey": "base64-encoded-spki-public-key"
}
```

**Response (200):**
```json
{
  "challenge": "base64-encoded-random-challenge"
}
```

**Errors:**
- 400: Missing or invalid fingerprint/publicKey
- 500: Internal server error

### POST /api/authenticate

Authenticate with signed challenge.

**Request:**
```json
{
  "fingerprint": "40-character-base64-string",
  "signature": "base64-encoded-ecdsa-signature"
}
```

**Response (200):**
```json
{
  "jwt": "jwt-token"
}
```

**Errors:**
- 400: Missing fingerprint or signature
- 401: User not found, no challenge, challenge expired, or invalid signature
- 500: Internal server error

## Security Considerations

### Key Storage

Keys are stored in IndexedDB with the following properties:
- **Non-extractable**: Keys cannot be exported from the browser
- **Algorithm**: ECDSA with P-256 curve
- **Usages**: Private key for signing, public key for verification

### Challenge-Response

- Challenges are 32-byte random values
- Challenges expire after 2 minutes
- Challenges are deleted after single use (prevents replay attacks)
- Server verifies the signature matches the challenge

### JWT

- Default expiry: 1 hour
- Contains fingerprint as subject (`sub`)
- Signed with server secret (configure via `JWT_SECRET` env var)

### Production Recommendations

1. **Environment Variables**
   ```bash
   JWT_SECRET=your-strong-secret-key-here
   ```

2. **Use Redis for Challenges**
   Replace in-memory storage with Redis:
   ```typescript
   import { createClient } from 'redis';
   const redis = createClient();
   await redis.set(`challenge:${fingerprint}`, challenge, 'EX', 120);
   ```

3. **Use Database for Users**
   Replace in-memory storage with PostgreSQL/MongoDB:
   ```sql
   CREATE TABLE users (
     fingerprint VARCHAR(40) PRIMARY KEY,
     public_key TEXT NOT NULL,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

4. **Add Rate Limiting**
   Prevent brute force attacks on authentication endpoints.

5. **Enable HTTPS**
   Always use HTTPS in production to prevent MITM attacks.

## Testing

### Run the test suite

```bash
node docs/test-auth.mjs
```

Expected output:
```
🧪 Testing Authentication Flow

1️⃣  Generating ECDSA P-256 key pair...
   ✓ Key pair generated

2️⃣  Generating fingerprint...
   Fingerprint: xeYlCx2lfqTZrVZDZ7Bssx3xD7CTA/GwHr4HNxaM
   Length: 40 characters
   ✓ Fingerprint generated

3️⃣  Requesting challenge from server...
   Challenge: BGfqssZRLNRZUp0gMXMn...
   ✓ Challenge received

4️⃣  Signing challenge...
   Signature: ov4+eMZ3txhPfQjnpAcw...
   ✓ Challenge signed

5️⃣  Authenticating with signature...
   JWT: eyJhbGciOiJIUzI1NiIsInR5cCI6Ik...
   ✓ Authentication successful

✅ All tests passed!
```

## Troubleshooting

### "Challenge expired" error
- Challenges expire after 2 minutes
- User took too long to complete authentication
- Refresh the page to get a new challenge

### "Invalid signature" error
- Private key doesn't match public key
- Challenge was modified
- Check clock synchronization

### Keys not persisting
- IndexedDB might be disabled
- Browser in private/incognito mode
- Storage quota exceeded

### API endpoints not working
- Make sure Astro is in server mode (`output: 'server'`)
- Verify Node adapter is installed
- Check server logs for errors

## Browser Compatibility

Requires browsers with:
- Web Crypto API support
- IndexedDB support
- ECDSA P-256 support

**Supported:**
- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## License

This authentication system is part of the Density Dwarf project.
