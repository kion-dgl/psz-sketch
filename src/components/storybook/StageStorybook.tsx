import { useState, useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { CollisionProvider } from '../../collision';
import {
  CITY_AREAS,
  FIELD_STAGES,
  ALL_CATEGORIES,
  getStageAssetPath,
} from './stageData';
import { FIELD_WEATHER, getDefaultWeather, type WeatherOption } from './weatherData';

// Dynamic imports for environment components
import ValleyEnv, { ValleyFloorCollision } from '../valley/environments/ValleyEnv';
import WetlandsEnv, { WetlandsFloorCollision } from '../wetlands/environments/WetlandsEnv';
import SnowfieldEnv, { SnowfieldFloorCollision } from '../snowfield/environments/SnowfieldEnv';
import MakaraEnv, { MakaraFloorCollision } from '../makara/environments/MakaraEnv';
import ParuEnv, { ParuFloorCollision } from '../paru/environments/ParuEnv';
import ArcaEnv, { ArcaFloorCollision } from '../arca/environments/ArcaEnv';
import ShrineEnv, { ShrineFloorCollision } from '../shrine/environments/ShrineEnv';
import TowerEnv, { TowerFloorCollision } from '../tower/environments/TowerEnv';

// City environments
import WarpEnvironment from '../warp/WarpEnvironment';
import MarketEnvironment from '../city/MarketEnvironment';
import CounterEnvironment from '../counter/CounterEnvironment';
import UndergroundEnvironment from '../underground/UndergroundEnvironment';

// Particles
import SandParticles from '../valley/SandParticles';
import RainParticles from '../valley/RainParticles';
import SnowParticles from '../snowfield/SnowParticles';
import EmberParticles from '../makara/EmberParticles';
import SporeSparkParticles from '../paru/SporeSparkParticles';
import SteamParticles from '../arca/SteamParticles';
import ShadowWispParticles from '../shrine/ShadowWispParticles';
import EternalMoteParticles from '../tower/EternalMoteParticles';

interface FieldEnvironmentProps {
  fieldId: string;
  mapId: string;
  weather: WeatherOption;
}

function WeatherParticles({ weather }: { weather: WeatherOption }) {
  switch (weather.particles) {
    case 'sand':
      return <SandParticles intensity={weather.particleIntensity} />;
    case 'rain':
      return <RainParticles intensity={weather.particleIntensity} />;
    case 'snow':
      return <SnowParticles intensity={weather.particleIntensity} />;
    case 'ember':
      return <EmberParticles />;
    case 'spore':
      return <SporeSparkParticles />;
    case 'steam':
      return <SteamParticles />;
    case 'wisp':
      return <ShadowWispParticles />;
    case 'mote':
      return <EternalMoteParticles />;
    default:
      return null;
  }
}

function WeatherLighting({ weather }: { weather: WeatherOption }) {
  // Fog color and density vary by time of day
  const fogColor = weather.isNight ? '#0a0a15' : '#d4c4a8';
  const fogNear = weather.isNight ? 30 : 50;
  const fogFar = weather.isNight ? 80 : 150;

  return (
    <>
      <fog attach="fog" args={[fogColor, fogNear, fogFar]} />
      {/* Ambient light provides base illumination - affects scene atmosphere */}
      <ambientLight color={weather.ambientColor} intensity={weather.ambientIntensity} />
      {/* Directional light for sun/moon shadows */}
      <directionalLight
        position={[10, 20, 10]}
        color={weather.directionalColor}
        intensity={weather.directionalIntensity}
        castShadow
      />
    </>
  );
}

function FieldEnvironment({ fieldId, mapId, weather }: FieldEnvironmentProps) {
  const renderEnv = () => {
    switch (fieldId) {
      case 'valley':
        return (
          <>
            <ValleyEnv mapId={mapId} />
            <CollisionProvider>
              <ValleyFloorCollision mapId={mapId} />
            </CollisionProvider>
          </>
        );
      case 'wetlands':
        return (
          <>
            <WetlandsEnv mapId={mapId} />
            <CollisionProvider>
              <WetlandsFloorCollision mapId={mapId} />
            </CollisionProvider>
          </>
        );
      case 'snowfield':
        return (
          <>
            <SnowfieldEnv mapId={mapId} />
            <CollisionProvider>
              <SnowfieldFloorCollision mapId={mapId} />
            </CollisionProvider>
          </>
        );
      case 'makara':
        return (
          <>
            <MakaraEnv mapId={mapId} />
            <CollisionProvider>
              <MakaraFloorCollision mapId={mapId} />
            </CollisionProvider>
          </>
        );
      case 'paru':
        return (
          <>
            <ParuEnv mapId={mapId} />
            <CollisionProvider>
              <ParuFloorCollision mapId={mapId} />
            </CollisionProvider>
          </>
        );
      case 'arca':
        return (
          <>
            <ArcaEnv mapId={mapId} />
            <CollisionProvider>
              <ArcaFloorCollision mapId={mapId} />
            </CollisionProvider>
          </>
        );
      case 'shrine':
        return (
          <>
            <ShrineEnv mapId={mapId} />
            <CollisionProvider>
              <ShrineFloorCollision mapId={mapId} />
            </CollisionProvider>
          </>
        );
      case 'tower':
        return (
          <>
            <TowerEnv mapId={mapId} />
            <CollisionProvider>
              <TowerFloorCollision mapId={mapId} />
            </CollisionProvider>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <WeatherLighting weather={weather} />
      <WeatherParticles weather={weather} />
      {renderEnv()}
    </>
  );
}

function CityEnvironment({ areaId }: { areaId: string }) {
  switch (areaId) {
    case 'warp':
      return <WarpEnvironment />;
    case 'city':
      return <MarketEnvironment />;
    case 'counter':
      return <CounterEnvironment />;
    case 'underground':
      return <UndergroundEnvironment />;
    default:
      return null;
  }
}

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="gray" wireframe />
    </mesh>
  );
}

// Styles for controls
const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
  color: '#aaa',
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const selectStyle: React.CSSProperties = {
  padding: '0.5rem',
  borderRadius: '4px',
  border: '1px solid #444',
  background: '#1a1a2e',
  color: 'white',
  fontSize: '0.9rem',
  width: '100%',
};

export default function StageStorybook() {
  // Selection state
  const [category, setCategory] = useState<string>('valley');
  const [areaId, setAreaId] = useState<string>('a');
  const [variantId, setVariantId] = useState<string>('s01a_ga1');
  const [weatherId, setWeatherId] = useState<string>('sand-light-day');

  // Get current field/city data
  const isCity = category === 'city';
  const currentField = FIELD_STAGES.find(f => f.id === category);
  const currentArea = currentField?.areas.find(a => a.id === areaId);

  // Available areas for current category
  const availableAreas = useMemo(() => {
    if (isCity) {
      return CITY_AREAS.map(c => ({ id: c.id, label: c.label }));
    }
    return currentField?.areas.map(a => ({ id: a.id, label: a.label })) ?? [];
  }, [isCity, currentField]);

  // Available variants for current area
  const availableVariants = useMemo(() => {
    if (isCity) return [];
    return currentArea?.variants ?? [];
  }, [isCity, currentArea]);

  // Available weather options for current field
  const availableWeather = useMemo(() => {
    if (isCity) return [];
    return FIELD_WEATHER[category] ?? [];
  }, [isCity, category]);

  // Current weather config
  const currentWeather = useMemo(() => {
    const options = FIELD_WEATHER[category];
    return options?.find(w => w.id === weatherId) ?? getDefaultWeather(category);
  }, [category, weatherId]);

  // Handle category change
  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    if (newCategory === 'city') {
      setAreaId('warp');
      setVariantId('');
      setWeatherId('');
    } else {
      const field = FIELD_STAGES.find(f => f.id === newCategory);
      if (field) {
        setAreaId(field.areas[0]?.id ?? 'a');
        setVariantId(field.areas[0]?.variants[0]?.id ?? '');
        // Set default weather for new field
        const defaultWeather = getDefaultWeather(newCategory);
        setWeatherId(defaultWeather.id);
      }
    }
  };

  // Handle area change
  const handleAreaChange = (newArea: string) => {
    setAreaId(newArea);
    if (!isCity && currentField) {
      const area = currentField.areas.find(a => a.id === newArea);
      setVariantId(area?.variants[0]?.id ?? '');
    }
  };

  // Build mapId for field stages
  const mapId = variantId;

  // Generate the Stage component code
  const stageCode = isCity
    ? `<CityEnvironment area="${areaId}" />`
    : `<Stage
  field="${category}"
  area="${areaId}"
  variant="${variantId}"
  weather="${weatherId}"
/>`;

  // Get current field label
  const currentFieldLabel = isCity
    ? 'City Areas'
    : FIELD_STAGES.find(f => f.id === category)?.label ?? category;

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '0.75rem 1rem',
        background: '#1a1a2e',
        borderBottom: '1px solid #333',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <h1 style={{ margin: 0, color: 'white', fontSize: '1.1rem', fontWeight: 500 }}>
          Stage Storybook
        </h1>
        <div style={{ color: '#888', fontSize: '0.85rem' }}>
          {currentFieldLabel} {!isCity && `/ ${currentArea?.label ?? areaId}`}
        </div>
      </div>

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', background: '#000' }}>
        {/* 3D Canvas */}
        <div style={{ flex: 1 }}>
          <Canvas shadows>
            {/* Dynamic background color based on weather */}
            <color attach="background" args={[isCity ? '#1a1a2e' : (currentWeather.isNight ? '#0a0a15' : '#87CEEB')]} />

            <PerspectiveCamera makeDefault position={[0, 10, 20]} />
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={5}
              maxDistance={100}
            />

            <Suspense fallback={<LoadingFallback />}>
              {isCity ? (
                <>
                  <ambientLight intensity={0.5} />
                  <directionalLight position={[10, 20, 10]} intensity={0.8} castShadow />
                  <CityEnvironment areaId={areaId} />
                </>
              ) : (
                <FieldEnvironment
                  fieldId={category}
                  mapId={mapId}
                  weather={currentWeather}
                />
              )}
            </Suspense>

            {/* Grid helper - hide at night for better atmosphere */}
            {!currentWeather.isNight && <gridHelper args={[100, 100, '#444', '#222']} />}
          </Canvas>
        </div>

        {/* Right panel - Controls */}
        <div style={{
          width: '300px',
          background: '#16213e',
          borderLeft: '1px solid #333',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Controls section */}
          <div style={{ padding: '1rem', borderBottom: '1px solid #333' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#888', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Controls
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Field dropdown */}
              <label style={labelStyle}>
                Field
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  style={selectStyle}
                >
                  {ALL_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </label>

              {/* Area dropdown */}
              <label style={labelStyle}>
                Area
                <select
                  value={areaId}
                  onChange={(e) => handleAreaChange(e.target.value)}
                  style={selectStyle}
                >
                  {availableAreas.map(area => (
                    <option key={area.id} value={area.id}>{area.label}</option>
                  ))}
                </select>
              </label>

              {/* Variant dropdown (field stages only) */}
              {!isCity && availableVariants.length > 0 && (
                <label style={labelStyle}>
                  Variant
                  <select
                    value={variantId}
                    onChange={(e) => setVariantId(e.target.value)}
                    style={selectStyle}
                  >
                    {availableVariants.map(v => (
                      <option key={v.id} value={v.id}>{v.label}</option>
                    ))}
                  </select>
                </label>
              )}

              {/* Weather dropdown (field stages only) */}
              {!isCity && availableWeather.length > 0 && (
                <label style={labelStyle}>
                  Weather
                  <select
                    value={weatherId}
                    onChange={(e) => setWeatherId(e.target.value)}
                    style={selectStyle}
                  >
                    {availableWeather.map(w => (
                      <option key={w.id} value={w.id}>{w.label}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          </div>

          {/* Code section */}
          <div style={{ padding: '1rem', flex: 1, overflow: 'auto' }}>
            <h3 style={{ margin: '0 0 0.75rem 0', color: '#888', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Stage Tag
            </h3>
            <pre style={{
              background: 'rgba(0,0,0,0.3)',
              padding: '0.75rem',
              borderRadius: '6px',
              fontSize: '0.8rem',
              color: '#6b8afd',
              overflow: 'auto',
              margin: 0,
              lineHeight: 1.5,
            }}>
              {stageCode}
            </pre>

            {/* Properties table */}
            {!isCity && (
              <div style={{ marginTop: '1rem' }}>
                <h3 style={{ margin: '0 0 0.75rem 0', color: '#888', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Properties
                </h3>
                <table style={{ width: '100%', fontSize: '0.8rem', color: '#ccc' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '0.25rem 0', color: '#888' }}>field</td>
                      <td style={{ padding: '0.25rem 0' }}>{category}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.25rem 0', color: '#888' }}>area</td>
                      <td style={{ padding: '0.25rem 0' }}>{areaId}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.25rem 0', color: '#888' }}>variant</td>
                      <td style={{ padding: '0.25rem 0' }}>{variantId}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.25rem 0', color: '#888' }}>weather</td>
                      <td style={{ padding: '0.25rem 0' }}>{currentWeather.label}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.25rem 0', color: '#888' }}>particles</td>
                      <td style={{ padding: '0.25rem 0' }}>{currentWeather.particles === 'none' ? 'None' : currentWeather.particles}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.25rem 0', color: '#888' }}>time</td>
                      <td style={{ padding: '0.25rem 0', color: currentWeather.isNight ? '#6688cc' : '#ffcc66' }}>
                        {currentWeather.isNight ? 'Night' : 'Day'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Asset path */}
            {!isCity && (
              <div style={{ marginTop: '1rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#888', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Asset Path
                </h3>
                <code style={{
                  display: 'block',
                  background: 'rgba(0,0,0,0.3)',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  color: '#aaa',
                  wordBreak: 'break-all',
                }}>
                  {getStageAssetPath(category, areaId, variantId)}
                </code>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '0.5rem 1rem',
        background: '#1a1a2e',
        borderTop: '1px solid #333',
        color: '#666',
        fontSize: '0.75rem',
      }}>
        Drag to rotate, Scroll to zoom, Right-drag to pan
      </div>
    </div>
  );
}
