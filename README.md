# Density Dwarf (PSZ Sketch)

A Phantom Star Zero inspired game with modern web technologies and cryptographic authentication.

[![Built with Starlight](https://astro.badg.es/v2/built-with-starlight/tiny.svg)](https://starlight.astro.build)

## ✨ Features

### 🔐 Cryptographic Authentication
- **Zero-friction onboarding**: No passwords, no sign-ups, just play
- **ECDSA P-256**: Modern elliptic curve cryptography
- **Non-extractable keys**: Secure key storage in IndexedDB
- **Challenge-response**: Prevents replay attacks
- **JWT sessions**: Stateless authentication

### 📚 Documentation Site
Built with Astro Starlight for comprehensive game documentation:
- Architecture diagrams (Mermaid)
- Screen flow documentation
- Mechanics and game systems
- API contracts

### 🎮 Game Systems
- Character creation and management
- Quest system
- Storage and inventory
- Shops and crafting

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Visit the title screen
# Open http://localhost:4321/title
```

## 🏗️ Project Structure

```
.
├── docs/                    # Additional documentation
│   ├── AUTHENTICATION.md   # Auth system guide
│   ├── test-results.md     # Test results
│   └── architecture/       # Mermaid diagrams
├── public/                 # Static assets
│   ├── logo.svg           # Game logo
│   └── screenshots/       # UI screenshots
├── src/
│   ├── content/
│   │   └── docs/          # Starlight documentation
│   ├── layouts/           # Page layouts
│   ├── lib/               # Shared libraries
│   │   ├── authService.ts      # Client auth
│   │   ├── keyManager.ts       # Key generation
│   │   ├── serverCrypto.ts     # Server crypto
│   │   └── serverStorage.ts    # In-memory storage
│   └── pages/
│       ├── api/           # API endpoints
│       │   ├── challenge.ts    # POST /api/challenge
│       │   └── authenticate.ts # POST /api/authenticate
│       ├── title.astro    # Title screen
│       └── sync.astro     # Asset sync screen
├── astro.config.mjs       # Astro configuration
└── package.json
```

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Check out [Starlight’s docs](https://starlight.astro.build/), read [the Astro documentation](https://docs.astro.build), or jump into the [Astro Discord server](https://astro.build/chat).

## 🔐 Authentication System

The game uses a modern cryptographic authentication system:

### How It Works

1. **Key Generation**: ECDSA P-256 key pair generated on first visit
2. **Fingerprint**: 40-character ID derived from public key hash
3. **Challenge-Response**: Server sends challenge, client signs it
4. **JWT Token**: Server verifies signature and issues JWT

### Security Features

- ✅ Non-extractable keys (stored in IndexedDB)
- ✅ Challenge expiry (2 minutes)
- ✅ Single-use challenges (replay attack prevention)
- ✅ Fingerprint verification
- ✅ Zero security vulnerabilities (CodeQL scan)

See [docs/AUTHENTICATION.md](docs/AUTHENTICATION.md) for complete documentation.

## 📖 Documentation

Visit the documentation site for:
- [Architecture Overview](src/content/docs/architecture/overview.md)
- [Title Screen](src/content/docs/screens/title-screen.md)
- [System Architecture](docs/architecture/system-architecture.mmd)
- [Data Flow](docs/architecture/data-flow.mmd)

## 🧪 Testing

Test results: [docs/test-results.md](docs/test-results.md)

## 🔧 Technology Stack

- **Framework**: [Astro](https://astro.build) v5.15.2
- **Documentation**: [Starlight](https://starlight.astro.build)
- **Authentication**: Web Crypto API (ECDSA P-256)
- **Storage**: IndexedDB (client), In-memory (server demo)
- **Sessions**: JWT with jsonwebtoken
- **Adapter**: @astrojs/node (SSR)

## 🛡️ Security

- **CodeQL Scan**: 0 vulnerabilities
- **Non-extractable Keys**: Private keys cannot be exported
- **Challenge-Response**: Prevents replay attacks
- **Short-lived Challenges**: 2-minute expiry
- **JWT Expiry**: 1 hour default
