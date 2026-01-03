/**
 * Weather Data for Stage Storybook
 *
 * Each field has specific weather options that affect:
 * - Particles (type and intensity)
 * - Lighting (ambient color, intensity, directional light)
 */

export interface WeatherOption {
  id: string;
  label: string;
  particles: 'none' | 'sand' | 'rain' | 'snow' | 'ember' | 'spore' | 'steam' | 'wisp' | 'mote';
  particleIntensity: 'light' | 'normal' | 'heavy';
  ambientColor: string;
  ambientIntensity: number;
  directionalColor: string;
  directionalIntensity: number;
  isNight: boolean;
}

export interface FieldWeather {
  fieldId: string;
  options: WeatherOption[];
}

// Valley weather options (desert)
const VALLEY_WEATHER: WeatherOption[] = [
  {
    id: 'clear-day',
    label: 'Clear Day',
    particles: 'none',
    particleIntensity: 'light',
    ambientColor: '#fffbe6',
    ambientIntensity: 0.6,
    directionalColor: '#fff5d6',
    directionalIntensity: 1.0,
    isNight: false,
  },
  {
    id: 'clear-night',
    label: 'Clear Night',
    particles: 'none',
    particleIntensity: 'light',
    ambientColor: '#1a1a3e',
    ambientIntensity: 0.2,
    directionalColor: '#8888cc',
    directionalIntensity: 0.3,
    isNight: true,
  },
  {
    id: 'sand-light-day',
    label: 'Light Sand (Day)',
    particles: 'sand',
    particleIntensity: 'light',
    ambientColor: '#ffe8c4',
    ambientIntensity: 0.5,
    directionalColor: '#ffd699',
    directionalIntensity: 0.8,
    isNight: false,
  },
  {
    id: 'sand-light-night',
    label: 'Light Sand (Night)',
    particles: 'sand',
    particleIntensity: 'light',
    ambientColor: '#2a2a4e',
    ambientIntensity: 0.15,
    directionalColor: '#6666aa',
    directionalIntensity: 0.2,
    isNight: true,
  },
  {
    id: 'sandstorm-day',
    label: 'Sandstorm (Day)',
    particles: 'sand',
    particleIntensity: 'heavy',
    ambientColor: '#c4a060',
    ambientIntensity: 0.4,
    directionalColor: '#aa8844',
    directionalIntensity: 0.3,
    isNight: false,
  },
  {
    id: 'sandstorm-night',
    label: 'Sandstorm (Night)',
    particles: 'sand',
    particleIntensity: 'heavy',
    ambientColor: '#3a3020',
    ambientIntensity: 0.1,
    directionalColor: '#554422',
    directionalIntensity: 0.1,
    isNight: true,
  },
  {
    id: 'rain-day',
    label: 'Rain (Day)',
    particles: 'rain',
    particleIntensity: 'normal',
    ambientColor: '#8899aa',
    ambientIntensity: 0.4,
    directionalColor: '#aabbcc',
    directionalIntensity: 0.5,
    isNight: false,
  },
  {
    id: 'rain-night',
    label: 'Rain (Night)',
    particles: 'rain',
    particleIntensity: 'normal',
    ambientColor: '#1a2030',
    ambientIntensity: 0.15,
    directionalColor: '#4455aa',
    directionalIntensity: 0.2,
    isNight: true,
  },
];

// Wetlands weather options (swamp)
const WETLANDS_WEATHER: WeatherOption[] = [
  {
    id: 'overcast-day',
    label: 'Overcast Day',
    particles: 'none',
    particleIntensity: 'light',
    ambientColor: '#7a8a7a',
    ambientIntensity: 0.5,
    directionalColor: '#aabbaa',
    directionalIntensity: 0.6,
    isNight: false,
  },
  {
    id: 'overcast-night',
    label: 'Overcast Night',
    particles: 'none',
    particleIntensity: 'light',
    ambientColor: '#1a2a1a',
    ambientIntensity: 0.15,
    directionalColor: '#334433',
    directionalIntensity: 0.2,
    isNight: true,
  },
  {
    id: 'rain-light-day',
    label: 'Light Rain (Day)',
    particles: 'rain',
    particleIntensity: 'light',
    ambientColor: '#6a7a7a',
    ambientIntensity: 0.4,
    directionalColor: '#8899aa',
    directionalIntensity: 0.5,
    isNight: false,
  },
  {
    id: 'rain-light-night',
    label: 'Light Rain (Night)',
    particles: 'rain',
    particleIntensity: 'light',
    ambientColor: '#152025',
    ambientIntensity: 0.12,
    directionalColor: '#334455',
    directionalIntensity: 0.15,
    isNight: true,
  },
  {
    id: 'rain-heavy-day',
    label: 'Heavy Rain (Day)',
    particles: 'rain',
    particleIntensity: 'heavy',
    ambientColor: '#4a5a6a',
    ambientIntensity: 0.3,
    directionalColor: '#667788',
    directionalIntensity: 0.3,
    isNight: false,
  },
  {
    id: 'rain-heavy-night',
    label: 'Heavy Rain (Night)',
    particles: 'rain',
    particleIntensity: 'heavy',
    ambientColor: '#101820',
    ambientIntensity: 0.08,
    directionalColor: '#223344',
    directionalIntensity: 0.1,
    isNight: true,
  },
];

// Snowfield weather options (arctic)
const SNOWFIELD_WEATHER: WeatherOption[] = [
  {
    id: 'clear-day',
    label: 'Clear Day',
    particles: 'none',
    particleIntensity: 'light',
    ambientColor: '#e8f0ff',
    ambientIntensity: 0.7,
    directionalColor: '#ffffff',
    directionalIntensity: 1.0,
    isNight: false,
  },
  {
    id: 'clear-night',
    label: 'Clear Night',
    particles: 'none',
    particleIntensity: 'light',
    ambientColor: '#1a1a4a',
    ambientIntensity: 0.25,
    directionalColor: '#8888ff',
    directionalIntensity: 0.4,
    isNight: true,
  },
  {
    id: 'snow-light-day',
    label: 'Light Snow (Day)',
    particles: 'snow',
    particleIntensity: 'light',
    ambientColor: '#d8e8ff',
    ambientIntensity: 0.5,
    directionalColor: '#eeeeff',
    directionalIntensity: 0.7,
    isNight: false,
  },
  {
    id: 'snow-light-night',
    label: 'Light Snow (Night)',
    particles: 'snow',
    particleIntensity: 'light',
    ambientColor: '#1a1a3a',
    ambientIntensity: 0.2,
    directionalColor: '#6666aa',
    directionalIntensity: 0.3,
    isNight: true,
  },
  {
    id: 'blizzard-day',
    label: 'Blizzard (Day)',
    particles: 'snow',
    particleIntensity: 'heavy',
    ambientColor: '#8899bb',
    ambientIntensity: 0.3,
    directionalColor: '#aabbdd',
    directionalIntensity: 0.2,
    isNight: false,
  },
  {
    id: 'blizzard-night',
    label: 'Blizzard (Night)',
    particles: 'snow',
    particleIntensity: 'heavy',
    ambientColor: '#101030',
    ambientIntensity: 0.1,
    directionalColor: '#333366',
    directionalIntensity: 0.1,
    isNight: true,
  },
];

// Makara weather options (underground ruins)
const MAKARA_WEATHER: WeatherOption[] = [
  {
    id: 'dim',
    label: 'Dim',
    particles: 'none',
    particleIntensity: 'light',
    ambientColor: '#3a2a20',
    ambientIntensity: 0.3,
    directionalColor: '#664422',
    directionalIntensity: 0.4,
    isNight: false,
  },
  {
    id: 'dark',
    label: 'Dark',
    particles: 'none',
    particleIntensity: 'light',
    ambientColor: '#1a1008',
    ambientIntensity: 0.15,
    directionalColor: '#442211',
    directionalIntensity: 0.2,
    isNight: true,
  },
  {
    id: 'embers-dim',
    label: 'Embers (Dim)',
    particles: 'ember',
    particleIntensity: 'normal',
    ambientColor: '#4a3020',
    ambientIntensity: 0.35,
    directionalColor: '#884422',
    directionalIntensity: 0.5,
    isNight: false,
  },
  {
    id: 'embers-dark',
    label: 'Embers (Dark)',
    particles: 'ember',
    particleIntensity: 'heavy',
    ambientColor: '#2a1810',
    ambientIntensity: 0.2,
    directionalColor: '#662211',
    directionalIntensity: 0.3,
    isNight: true,
  },
];

// Paru weather options (overgrown city)
const PARU_WEATHER: WeatherOption[] = [
  {
    id: 'overgrown-day',
    label: 'Overgrown Day',
    particles: 'none',
    particleIntensity: 'light',
    ambientColor: '#4a6a4a',
    ambientIntensity: 0.4,
    directionalColor: '#88aa66',
    directionalIntensity: 0.6,
    isNight: false,
  },
  {
    id: 'overgrown-night',
    label: 'Overgrown Night',
    particles: 'none',
    particleIntensity: 'light',
    ambientColor: '#1a2a1a',
    ambientIntensity: 0.15,
    directionalColor: '#335533',
    directionalIntensity: 0.2,
    isNight: true,
  },
  {
    id: 'spores-day',
    label: 'Spores (Day)',
    particles: 'spore',
    particleIntensity: 'normal',
    ambientColor: '#5a7a4a',
    ambientIntensity: 0.45,
    directionalColor: '#99bb77',
    directionalIntensity: 0.5,
    isNight: false,
  },
  {
    id: 'spores-night',
    label: 'Spores (Night)',
    particles: 'spore',
    particleIntensity: 'normal',
    ambientColor: '#1a3020',
    ambientIntensity: 0.2,
    directionalColor: '#447744',
    directionalIntensity: 0.25,
    isNight: true,
  },
];

// Arca weather options (industrial)
const ARCA_WEATHER: WeatherOption[] = [
  {
    id: 'industrial-day',
    label: 'Industrial Day',
    particles: 'none',
    particleIntensity: 'light',
    ambientColor: '#7a7a7a',
    ambientIntensity: 0.5,
    directionalColor: '#aaaaaa',
    directionalIntensity: 0.7,
    isNight: false,
  },
  {
    id: 'industrial-night',
    label: 'Industrial Night',
    particles: 'none',
    particleIntensity: 'light',
    ambientColor: '#2a2a30',
    ambientIntensity: 0.2,
    directionalColor: '#556666',
    directionalIntensity: 0.3,
    isNight: true,
  },
  {
    id: 'steam-day',
    label: 'Steam (Day)',
    particles: 'steam',
    particleIntensity: 'normal',
    ambientColor: '#8a8a8a',
    ambientIntensity: 0.45,
    directionalColor: '#bbbbbb',
    directionalIntensity: 0.6,
    isNight: false,
  },
  {
    id: 'steam-night',
    label: 'Steam (Night)',
    particles: 'steam',
    particleIntensity: 'normal',
    ambientColor: '#2a3035',
    ambientIntensity: 0.2,
    directionalColor: '#667788',
    directionalIntensity: 0.3,
    isNight: true,
  },
];

// Shrine weather options (dark/supernatural)
const SHRINE_WEATHER: WeatherOption[] = [
  {
    id: 'darkness',
    label: 'Darkness',
    particles: 'none',
    particleIntensity: 'light',
    ambientColor: '#1a1020',
    ambientIntensity: 0.2,
    directionalColor: '#442266',
    directionalIntensity: 0.3,
    isNight: true,
  },
  {
    id: 'deep-darkness',
    label: 'Deep Darkness',
    particles: 'none',
    particleIntensity: 'light',
    ambientColor: '#0a0510',
    ambientIntensity: 0.1,
    directionalColor: '#221133',
    directionalIntensity: 0.15,
    isNight: true,
  },
  {
    id: 'wisps',
    label: 'Shadow Wisps',
    particles: 'wisp',
    particleIntensity: 'normal',
    ambientColor: '#1a1525',
    ambientIntensity: 0.25,
    directionalColor: '#553388',
    directionalIntensity: 0.35,
    isNight: true,
  },
  {
    id: 'wisps-heavy',
    label: 'Dense Wisps',
    particles: 'wisp',
    particleIntensity: 'heavy',
    ambientColor: '#151020',
    ambientIntensity: 0.2,
    directionalColor: '#442277',
    directionalIntensity: 0.3,
    isNight: true,
  },
];

// Tower weather options (eternal/magical)
const TOWER_WEATHER: WeatherOption[] = [
  {
    id: 'eternal-light',
    label: 'Eternal Light',
    particles: 'none',
    particleIntensity: 'light',
    ambientColor: '#ffe8cc',
    ambientIntensity: 0.6,
    directionalColor: '#ffdd99',
    directionalIntensity: 0.8,
    isNight: false,
  },
  {
    id: 'eternal-dark',
    label: 'Eternal Dark',
    particles: 'none',
    particleIntensity: 'light',
    ambientColor: '#2a2035',
    ambientIntensity: 0.25,
    directionalColor: '#6655aa',
    directionalIntensity: 0.35,
    isNight: true,
  },
  {
    id: 'motes',
    label: 'Eternal Motes',
    particles: 'mote',
    particleIntensity: 'normal',
    ambientColor: '#eeddcc',
    ambientIntensity: 0.55,
    directionalColor: '#ffcc88',
    directionalIntensity: 0.7,
    isNight: false,
  },
  {
    id: 'motes-night',
    label: 'Night Motes',
    particles: 'mote',
    particleIntensity: 'normal',
    ambientColor: '#2a2540',
    ambientIntensity: 0.3,
    directionalColor: '#7766bb',
    directionalIntensity: 0.4,
    isNight: true,
  },
];

// Map field IDs to their weather options
export const FIELD_WEATHER: Record<string, WeatherOption[]> = {
  valley: VALLEY_WEATHER,
  wetlands: WETLANDS_WEATHER,
  snowfield: SNOWFIELD_WEATHER,
  makara: MAKARA_WEATHER,
  paru: PARU_WEATHER,
  arca: ARCA_WEATHER,
  shrine: SHRINE_WEATHER,
  tower: TOWER_WEATHER,
};

// Get default weather for a field
export function getDefaultWeather(fieldId: string): WeatherOption {
  const options = FIELD_WEATHER[fieldId];
  if (options && options.length > 0) {
    // Return first option with particles as default
    return options.find(o => o.particles !== 'none') ?? options[0];
  }
  // Fallback
  return VALLEY_WEATHER[2]; // Light Sand (Day)
}
