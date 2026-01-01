/**
 * Stage Storybook Data
 *
 * Defines the hierarchy of stages for the storybook:
 * - City areas (warp, market, counter, underground)
 * - Field stages (valley, wetlands, snowfield, makara, paru, arca, shrine, tower)
 */

export interface StageVariant {
  id: string;      // e.g., "s01a_ga1"
  label: string;   // e.g., "GA1"
}

export interface StageArea {
  id: string;      // e.g., "a", "b", "e", "z"
  label: string;   // e.g., "Area A"
  variants: StageVariant[];
}

export interface StageField {
  id: string;      // e.g., "valley"
  label: string;   // e.g., "Gurhacia Valley"
  prefix: string;  // e.g., "s01" for stage file naming
  areas: StageArea[];
  envComponent: string; // Component name to load
}

export interface CityArea {
  id: string;      // e.g., "warp"
  label: string;   // e.g., "Warp Area"
  path: string;    // e.g., "/stage/warp"
}

// City areas (lobby/hub)
export const CITY_AREAS: CityArea[] = [
  { id: 'warp', label: 'Warp Area', path: '/stage/warp' },
  { id: 'city', label: 'City Market', path: '/stage/city' },
  { id: 'counter', label: 'Mission Counter', path: '/stage/counter' },
  { id: 'underground', label: 'Underground', path: '/stage/underground' },
];

// Common variants found in most areas
const COMMON_VARIANTS: StageVariant[] = [
  { id: 'ga1', label: 'GA1' },
  { id: 'ib1', label: 'IB1' },
  { id: 'ib2', label: 'IB2' },
  { id: 'ic1', label: 'IC1' },
  { id: 'ic3', label: 'IC3' },
  { id: 'lb1', label: 'LB1' },
  { id: 'lb3', label: 'LB3' },
  { id: 'lc1', label: 'LC1' },
  { id: 'lc2', label: 'LC2' },
  { id: 'na1', label: 'NA1' },
  { id: 'nb2', label: 'NB2' },
  { id: 'nc2', label: 'NC2' },
  { id: 'sa1', label: 'SA1' },
  { id: 'tb3', label: 'TB3' },
  { id: 'tc3', label: 'TC3' },
  { id: 'td1', label: 'TD1' },
  { id: 'td2', label: 'TD2' },
  { id: 'xb2', label: 'XB2' },
];

// E area (boss) variants
const E_VARIANTS: StageVariant[] = [
  { id: 'ia1', label: 'IA1' },
];

// Z area (end) variants
const Z_VARIANTS: StageVariant[] = [
  { id: 'na1', label: 'NA1' },
];

// Standard areas for most fields
function createStandardAreas(prefix: string): StageArea[] {
  return [
    {
      id: 'a',
      label: 'Area A',
      variants: COMMON_VARIANTS.map(v => ({
        id: `${prefix}a_${v.id}`,
        label: v.label,
      })),
    },
    {
      id: 'b',
      label: 'Area B',
      variants: COMMON_VARIANTS.map(v => ({
        id: `${prefix}b_${v.id}`,
        label: v.label,
      })),
    },
    {
      id: 'e',
      label: 'Area E (Boss)',
      variants: E_VARIANTS.map(v => ({
        id: `${prefix}e_${v.id}`,
        label: v.label,
      })),
    },
    {
      id: 'z',
      label: 'Area Z (End)',
      variants: Z_VARIANTS.map(v => ({
        id: `${prefix}z_${v.id}`,
        label: v.label,
      })),
    },
  ];
}

// Field stages
export const FIELD_STAGES: StageField[] = [
  {
    id: 'valley',
    label: 'Gurhacia Valley',
    prefix: 's01',
    areas: createStandardAreas('s01'),
    envComponent: 'ValleyEnv',
  },
  {
    id: 'wetlands',
    label: 'Ozette Wetlands',
    prefix: 's02',
    areas: createStandardAreas('s02'),
    envComponent: 'WetlandsEnv',
  },
  {
    id: 'snowfield',
    label: 'Rioh Snowfield',
    prefix: 's03',
    areas: createStandardAreas('s03'),
    envComponent: 'SnowfieldEnv',
  },
  {
    id: 'makara',
    label: 'Makara Ruins',
    prefix: 's04',
    areas: createStandardAreas('s04'),
    envComponent: 'MakaraEnv',
  },
  {
    id: 'paru',
    label: 'Oblivion City Paru',
    prefix: 's05',
    areas: createStandardAreas('s05'),
    envComponent: 'ParuEnv',
  },
  {
    id: 'arca',
    label: 'Arca Plant',
    prefix: 's06',
    areas: createStandardAreas('s06'),
    envComponent: 'ArcaEnv',
  },
  {
    id: 'shrine',
    label: 'Dark Shrine',
    prefix: 's07',
    areas: createStandardAreas('s07'),
    envComponent: 'ShrineEnv',
  },
  {
    id: 'tower',
    label: 'Eternal Tower',
    prefix: 's08',
    areas: [
      // Tower has floors 0-7 instead of a/b
      ...Array.from({ length: 8 }, (_, i) => ({
        id: String(i),
        label: `Floor ${i + 1}`,
        variants: COMMON_VARIANTS.map(v => ({
          id: `s08${i}_${v.id}`,
          label: v.label,
        })),
      })),
      {
        id: 'e',
        label: 'Boss Floor',
        variants: E_VARIANTS.map(v => ({
          id: `s08e_${v.id}`,
          label: v.label,
        })),
      },
    ],
    envComponent: 'TowerEnv',
  },
];

// Get all fields including city
export const ALL_CATEGORIES = [
  { id: 'city', label: 'City Areas', type: 'city' as const },
  ...FIELD_STAGES.map(f => ({ id: f.id, label: f.label, type: 'field' as const })),
];

// Helper to get stage path
export function getStagePath(fieldId: string, areaId: string, variantId: string): string {
  if (fieldId === 'city') {
    return `/stage/${areaId}`;
  }
  return `/stage/${fieldId}-${variantId}`;
}

// Helper to get asset path for a stage
export function getStageAssetPath(fieldId: string, areaId: string, variantId: string): string {
  return `/stages/${fieldId}_${areaId}/${variantId}`;
}
