# Copilot Instructions

- **Framework topology**: Astro app with mixed server/SSR routes in `src/pages/**` and React islands (`client:load`) under `src/components/**`. Docs live in `src/content/**` (Starlight). 3D is built with `@react-three/fiber` + `@react-three/drei` + `three` (see `src/components/title/SpaceScene.tsx`).
- **Client-only architecture (current)**: No server APIs. All data stored in browser (IndexedDB for keys, localStorage for character data). Key generation via `src/lib/keyManager.ts` (Web Crypto P-256, non-extractable). Pages are plain Astro with React islands, no session checks.
- **Layouts**: All pages use `src/layouts/Layout.astro`. No authentication layout needed (client-only).
- **Title screen pattern**: `src/pages/title.astro` renders full-viewport, scroll-locked experience. Background is the `SpaceScene` canvas (class `space-scene-full`) fixed behind UI; overlay UI is absolutely centered with glassmorphism. UI elements positioned via absolute/relative layers. Start button enabled after local key prep.
- **3D scene notes**: `SpaceScene.tsx` uses memoized star buffers, animated earth/moon meshes with procedural textures, fog/background color, sun as light source, and OrbitControls with zoom/pan disabled. Canvas must fill parent; ensure parent has explicit width/height (100vw/100vh) and `overflow:hidden`.
- **State & stores**: Global character selection uses Zustand in `src/stores/characterStore.ts`. React islands (e.g., `CharacterSelectGrid`) are mounted with `client:load` inside Astro pages. Character data stored in localStorage.
- **Commands**: `npm run dev` (or `npm start`) to serve, `npm run build` for prod build, `npm run preview` to test build, `npm run check-env` to verify env wiring. Project uses ESM (`type: module`).
- **Assets & content**: Static player assets under `public/player/**`; quest/content configs under `src/content/**` and `src/content/config.ts`. Title logo is at `src/assets/img/logo.png`.
- **Legacy code (removed)**: `src/mod/` (server auth), `src/pages/api/` (all endpoints 410 Gone), `src/lib/authService.ts` (no longer used). Do not reintroduce server APIs.
- **Styling conventions**: Page-level styles colocated in `.astro` files. Prefer CSS variables/gradients already in use; keep typography light and space-themed colors (#040712, blues/teals) consistent with title screen.
- **Testing/verification**: No dedicated test runner; sanity check by running `npm run dev` and loading `/`, `/character-select`, `/character-create`. Ensure Web Crypto/IndexedDB usage wrapped in try/catch for unsupported environments.
- **Deployment**: Vercel adapter present (`@astrojs/vercel`); avoid Node-only APIs in client bundles. Keep imports SSR-safe—guard `window`/`indexedDB` access inside browser-only code.
