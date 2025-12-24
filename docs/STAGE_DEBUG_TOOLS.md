# Stage Debug Tools Pattern

This document describes the pattern for creating debug tools for stage areas in the game. Each stage area (wetlands, snowfield, etc.) has two debug tools:

1. **Texture Debug Tool** - For viewing and adjusting texture repeat/offset settings
2. **Trigger Debug Tool** - For placing spawn points and exit triggers

## File Structure

For each stage area (e.g., `areaname`), create the following files:

```
src/
├── components/
│   └── areaname/
│       ├── AreanameDebug.tsx          # Texture debug component
│       ├── AreanameTriggerDebug.tsx   # Trigger debug component
│       └── areanameConfig.ts          # Spawn/trigger configurations
└── pages/
    └── stage/
        ├── areaname.astro             # Stage hub page (add debug links)
        ├── areaname-debug.astro       # Texture debug page
        └── areaname-trigger-debug.astro # Trigger debug page
```

## Step-by-Step Implementation

### 1. Create the Texture Debug Component

Copy from an existing implementation (e.g., `WetlandsDebug.tsx` or `SnowfieldDebug.tsx`) and update:

- Component name: `AreanameDebug`
- Directory function: `getAreanameDir()` - update the regex pattern for map IDs
- Map lists: Update `AREANAME_A_MAPS`, `AREANAME_B_MAPS`, etc.
- UI text: Update titles and labels
- Export filename in `handleExportJSON`

Key regex pattern for directory lookup:
```typescript
function getAreanameDir(mapId: string): string {
  const match = mapId.match(/^s0X([a-z])_/);  // X = stage number
  if (match) {
    return `stages/areaname_${match[1]}`;
  }
  return 'stages/areaname_a';
}
```

### 2. Create the Trigger Debug Component

Copy from an existing implementation and update:

- Component name: `AreanameTriggerDebug`
- Storage key: `'areaname-trigger-configs'`
- Directory function: Same pattern as texture debug
- Map lists: Same as texture debug
- Export function: Update `AREANAME_CONFIG` variable name
- UI links: Update back button href

### 3. Create the Config File

Create `areanameConfig.ts` with:

```typescript
export interface TriggerConfig {
  position: [number, number, number];
  size?: [number, number, number];
  rotation?: number;
  targetUrl?: string;
  targetMap?: string;
  label?: string;
  spawnPosition?: [number, number, number];
  spawnRotation?: number;
}

export interface SpawnPoint {
  position: [number, number, number];
  rotation: number;
  label?: string;
  isDefault?: boolean;
}

export interface MapConfig {
  spawnPoints: SpawnPoint[];
  triggers: TriggerConfig[];
}

export function getDefaultSpawn(config: MapConfig) { ... }

export const AREANAME_CONFIG: Record<string, MapConfig> = {
  // Add configs here after using trigger debug tool
};

export function getMapConfig(mapId: string): MapConfig { ... }
```

### 4. Create the Astro Pages

**areaname-debug.astro:**
```astro
---
import Layout from '../../layouts/Layout.astro';
import AreanameDebug from '../../components/areaname/AreanameDebug';

export const prerender = false;
---

<Layout title="Area Name - Texture Debug">
  <AreanameDebug client:load />
</Layout>
```

**areaname-trigger-debug.astro:**
```astro
---
import Layout from '../../layouts/Layout.astro';
import AreanameTriggerDebug from '../../components/areaname/AreanameTriggerDebug';

export const prerender = false;
---

<Layout title="Area Name - Trigger Debug">
  <AreanameTriggerDebug client:load />
</Layout>
```

### 5. Update the Hub Page

Add links to the debug tools in `areaname.astro`:

```astro
<a href="/stage/areaname-debug">Texture Debug Tool</a>
<a href="/stage/areaname-trigger-debug">Trigger Debug Tool</a>
```

## Using the Debug Tools

### Texture Debug Tool

1. Select a map from the dropdown
2. Use orbit controls to view the 3D model
3. Select textures from the panel and adjust:
   - repeatX / repeatY - Texture tiling
   - offsetX / offsetY - Texture offset
4. Click "Export JSON" to save settings

### Trigger Debug Tool

1. Select a map from the dropdown
2. Choose marker type: "Spawn Point" or "Exit Trigger"
3. Click on the floor to place markers
4. Use rotation buttons to adjust facing direction (45° increments)
5. Markers auto-save to localStorage
6. Click "Export All" to generate TypeScript config code
7. Paste the exported code into `areanameConfig.ts`

## Map ID Conventions

Maps follow the pattern: `s0Xy_abc`

- `X` = Stage number (2=wetlands, 3=snowfield, etc.)
- `y` = Variant letter (a, b, e, z)
- `abc` = Section identifier (ga1, ib1, etc.)

Examples:
- `s02a_ga1` = Wetlands A, Gateway 1
- `s03b_ib2` = Snowfield B, Inner Bridge 2

## Existing Implementations

| Area | Stage # | Status |
|------|---------|--------|
| Wetlands | s02 | Complete |
| Snowfield | s03 | Debug tools created |
| Valley | s01 | Partial |
| Tower | s08 | Partial |
| Arca | s04 | Partial |
| Paru | s05 | Partial |
| Makara | s06 | Partial |
| Shrine | s07 | Partial |
