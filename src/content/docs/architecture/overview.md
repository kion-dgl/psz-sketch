---
title: Architecture Overview
description: System architecture and design diagrams for Density Dwarf
---

This section contains architecture diagrams and design documentation for Density Dwarf. The diagrams are created using Mermaid and can be validated for consistency.

## Available Diagrams

### [User Flow](/architecture/user-flow)
Complete user journey from landing on the title screen through authentication, asset sync, character selection, and entering the city hub.

**Shows**: Decision points, screen navigation, user actions

### [API Contracts](/architecture/api-contracts)
Overview of all API endpoints called during the title-to-city flow, showing which screens call which APIs and the data flow between frontend and backend.

**Shows**: Screen-to-API relationships, request/response flow

### [System Architecture](/architecture/system-architecture)
High-level system architecture showing the relationships between client, API server, database, and CDN.

**Shows**: Component boundaries, data storage, service layers

### [Data Flow Sequence](/architecture/data-flow)
Detailed sequence diagram showing the chronological order of operations from initial page load through city entry.

**Shows**: Time-ordered interactions, asynchronous operations

## Diagram Sources

All Mermaid diagram sources are stored in `/docs/architecture/`:
- `user-flow.mmd` - User flow diagram
- `api-contracts.mmd` - API contract relationships
- `system-architecture.mmd` - System component architecture
- `data-flow.mmd` - Sequence diagram

## Validation

To validate that the diagrams are consistent with the codebase:

```bash
# Validate Mermaid syntax
npm run validate:diagrams

# Check API contracts match Zod schemas
npm run validate:contracts
```

## Color Legend

**User Flow Diagram**:
- 🟢 Green: Start/end points
- 🟡 Orange: Authentication/critical operations
- 🔵 Blue: API calls

**API Contracts**:
- 🔴 Red: Auth API
- 🟢 Green: Sync API
- 🔵 Blue: Character API
- 🟡 Yellow: City API

**System Architecture**:
- 🔵 Light Blue: Client components
- 🟡 Yellow: Cache/storage
- 🟠 Orange: Cryptography
- 🟢 Green: API services
- 🔴 Pink: Database tables
- 🟣 Purple: External assets

## Architecture Principles

### 1. Event Sourcing
All character state changes are recorded as immutable events in `character_events` table. The `character_state` table is a projection of these events.

### 2. Offline-First
Assets are pre-cached using localForage (IndexedDB) during the sync phase, enabling fast loading and offline gameplay.

### 3. Cryptographic Authentication
ECDSA P-256 key pairs provide passwordless authentication. Private keys are stored as non-extractable CryptoKeyPair objects in IndexedDB and can never leave the browser.

### 4. API-First Design
Clear separation between frontend and backend with well-defined JSON API contracts.

### 5. Type Safety
Zod schemas define all API contracts and are shared between client and server for runtime validation and TypeScript types.
