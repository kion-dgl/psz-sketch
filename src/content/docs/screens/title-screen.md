---
title: Title Screen
description: The landing page and authentication flow for Density Dwarf
---

![Title Screen](/screenshots/title-screen.png)

The title screen is the first screen players encounter when visiting the root path (`/`) of Density Dwarf. It implements a frictionless, anonymous authentication system that allows players to start playing immediately without registration.

## Authentication Flow

The title screen handles the cryptographic authentication process entirely behind the scenes, creating a seamless experience for players.

### 1. Private Key Generation & Storage

When a player first navigates to `/`, the browser checks for an existing ECDSA key pair in IndexedDB:

- **If no key exists**: The browser generates a new ECDSA P-256 key pair using Web Crypto API
  - Algorithm: ECDSA with curve P-256
  - Extractable: `false` (critical security feature - keys cannot be exported)
  - Stored directly in IndexedDB as a `CryptoKeyPair` object
- **If key exists**: The browser retrieves the existing key pair for authentication

This approach ensures each player has a unique cryptographic identity without requiring any user input, while the non-extractable property ensures private keys can never leave the browser.

### 2. User Identification

The system uses a **fingerprint** derived from the public key as the user ID:

1. Export the public key to SPKI (SubjectPublicKeyInfo) format
2. Hash the SPKI data using SHA-256
3. Take the first **30 bytes** of the 32-byte hash
4. Base64-encode these 30 bytes to create a **40-character fingerprint**

This fingerprint serves as the unique user identifier across the system.

### 3. Challenge-Response Authentication

Once the key pair is available, the client initiates a two-step challenge-response authentication flow:

#### Step 1: Request Challenge
1. **Client → Server**: POST to `/api/challenge` with fingerprint and full public key (base64-encoded SPKI)
2. **Server**: Verifies fingerprint matches public key, generates random challenge (nonce)
3. **Server → Client**: Returns the challenge

#### Step 2: Authenticate
1. **Client**: Signs the challenge using the non-extractable private key (ECDSA with SHA-256)
2. **Client → Server**: POST to `/api/authenticate` with fingerprint and signature
3. **Server**: Verifies signature, generates JWT session token
4. **Server → Client**: Returns JWT for authenticated API access

### 4. Session Management

After successful authentication, the server returns a JWT (JSON Web Token) that the client uses for subsequent API requests. The player is then redirected to the [Sync](/screens/sync) screen to download game assets before proceeding to [Character Select](/screens/character-select).

The JWT contains:
- **sub** (subject): The 40-character fingerprint
- **exp** (expiration): Token expiry time
- Client includes JWT in `Authorization: Bearer <token>` header for all authenticated requests

## Benefits of This Approach

### Zero Friction Onboarding
- No sign-up forms
- No email verification
- No passwords to remember
- Instant play within seconds

### Security Without Compromise
- Cryptographic authentication using ECDSA P-256
- Challenge-response prevents replay attacks
- Private keys stored as non-extractable in IndexedDB (cannot be exported)
- Each session is cryptographically verified via JWT
- Fingerprint-based user identification (40-character hash)

### Future-Proof Identity
- Players can migrate their anonymous account to a full account later
- Private keys can be exported for account recovery
- Supports adding traditional authentication methods without losing progress

## Technical Implementation

The authentication system uses modern web cryptography APIs:

- **ECDSA P-256**: Elliptic Curve Digital Signature Algorithm with NIST P-256 curve
- **Non-Extractable Keys**: CryptoKeyPair stored in IndexedDB with extractable=false for security
- **IndexedDB**: Secure browser storage for persisting the non-extractable key pair
- **Fingerprint**: 40-character user ID derived from SHA-256 hash of public key (first 30 bytes, base64)
- **JWT**: JSON Web Tokens for session management and authenticated API access

This implementation provides a balance between user experience and security, allowing players to start playing immediately while maintaining the integrity of the game's authentication system.
