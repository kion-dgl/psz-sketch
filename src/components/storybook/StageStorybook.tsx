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

// Tags for display in panel (note: Fence, KeyGate not yet implemented)
import { Stage, Box, Gate, Switch, Warp, Key, NPC } from '../tags';

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
  return (
    <>
      <ambientLight color={weather.ambientColor} intensity={weather.ambientIntensity} />
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

// Tag documentation for right panel
const TAG_DOCS = [
  {
    name: 'Box',
    description: 'Destructible container',
    collision: 'Trigger (Sphere-AABB)',
    props: 'position, state, onDestroy',
  },
  {
    name: 'Gate',
    description: 'Enemy-activated barrier',
    collision: 'Wall (Circle-Line 2D) when closed',
    props: 'id, position, state, blocked',
  },
  {
    name: 'KeyGate',
    description: 'Key-required barrier (Coming Soon)',
    collision: 'Wall (Circle-Line 2D) when locked',
    props: 'id, keyId, position',
  },
  {
    name: 'Fence',
    description: 'Switch-controlled barrier (Coming Soon)',
    collision: 'Wall (Circle-Line 2D) when active',
    props: 'id, position, state, variant',
  },
  {
    name: 'Switch',
    description: 'Activates gates/fences',
    collision: 'Trigger (Sphere-AABB)',
    props: 'type (step/interact/remote), targetId, position',
  },
  {
    name: 'NPC',
    description: 'Interactable character',
    collision: 'NPC (Distance+Dot)',
    props: 'name, model, position, onInteract',
  },
  {
    name: 'Warp',
    description: 'Area transition point',
    collision: 'Trigger (Sphere-AABB)',
    props: 'type (start/area), targetArea, position',
  },
  {
    name: 'Key',
    description: 'Collectible key item',
    collision: 'Trigger (Sphere-AABB)',
    props: 'keyId, position, onCollect',
  },
];

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
  const currentCityArea = CITY_AREAS.find(c => c.id === areaId);

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

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Controls */}
      <div style={{
        padding: '1rem',
        background: '#1a1a2e',
        borderBottom: '1px solid #333',
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        <h2 style={{ margin: 0, color: 'white', fontSize: '1.2rem' }}>Stage Storybook</h2>

        {/* Category dropdown */}
        <label style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Field:
          <select
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '4px', minWidth: '150px' }}
          >
            {ALL_CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>
        </label>

        {/* Area dropdown */}
        <label style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Area:
          <select
            value={areaId}
            onChange={(e) => handleAreaChange(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '4px', minWidth: '120px' }}
          >
            {availableAreas.map(area => (
              <option key={area.id} value={area.id}>{area.label}</option>
            ))}
          </select>
        </label>

        {/* Variant dropdown (field stages only) */}
        {!isCity && availableVariants.length > 0 && (
          <label style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Variant:
            <select
              value={variantId}
              onChange={(e) => setVariantId(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '4px', minWidth: '100px' }}
            >
              {availableVariants.map(v => (
                <option key={v.id} value={v.id}>{v.label}</option>
              ))}
            </select>
          </label>
        )}

        {/* Weather dropdown (field stages only) */}
        {!isCity && availableWeather.length > 0 && (
          <label style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Weather:
            <select
              value={weatherId}
              onChange={(e) => setWeatherId(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '4px', minWidth: '140px' }}
            >
              {availableWeather.map(w => (
                <option key={w.id} value={w.id}>{w.label}</option>
              ))}
            </select>
          </label>
        )}

        {/* Info */}
        <div style={{ marginLeft: 'auto', color: '#888', fontSize: '0.9rem' }}>
          {isCity ? (
            <span>City: {currentCityArea?.label}</span>
          ) : (
            <span>Map ID: {mapId}</span>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', background: '#000' }}>
        {/* 3D Canvas */}
        <div style={{ flex: 1 }}>
          <Canvas shadows>
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

            {/* Grid helper */}
            <gridHelper args={[100, 100, '#444', '#222']} />
          </Canvas>
        </div>

        {/* Right panel - Tags documentation */}
        <div style={{
          width: '280px',
          background: '#16213e',
          borderLeft: '1px solid #333',
          overflowY: 'auto',
          padding: '1rem',
        }}>
          <h3 style={{ margin: '0 0 1rem 0', color: 'white', fontSize: '1rem' }}>R3F Tags</h3>

          {TAG_DOCS.map(tag => (
            <div
              key={tag.name}
              style={{
                marginBottom: '1rem',
                padding: '0.75rem',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '6px',
                borderLeft: '3px solid #6b8afd',
              }}
            >
              <div style={{ color: '#6b8afd', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                {'<'}{tag.name}{' />'}
              </div>
              <div style={{ color: '#ccc', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                {tag.description}
              </div>
              <div style={{ color: '#888', fontSize: '0.75rem' }}>
                <div><strong>Collision:</strong> {tag.collision}</div>
                <div><strong>Props:</strong> {tag.props}</div>
              </div>
            </div>
          ))}

          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #333' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#888', fontSize: '0.85rem' }}>Usage</h4>
            <pre style={{
              background: 'rgba(0,0,0,0.3)',
              padding: '0.5rem',
              borderRadius: '4px',
              fontSize: '0.7rem',
              color: '#aaa',
              overflow: 'auto',
            }}>
{`<Stage id="mission-01">
  <Box position={[5, 0, 0]} />
  <Gate id="gate1" />
  <Switch
    type="step"
    targetId="gate1"
  />
  <Warp type="area"
    targetArea="/next"
  />
</Stage>`}
            </pre>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div style={{
        padding: '0.5rem 1rem',
        background: '#1a1a2e',
        borderTop: '1px solid #333',
        color: '#888',
        fontSize: '0.8rem',
        display: 'flex',
        gap: '2rem',
      }}>
        <span>Controls: Drag to rotate, Scroll to zoom, Right-drag to pan</span>
        {!isCity && (
          <>
            <span>Asset path: {getStageAssetPath(category, areaId, variantId)}</span>
            <span style={{ color: currentWeather.isNight ? '#6688cc' : '#ffcc66' }}>
              {currentWeather.isNight ? 'Night' : 'Day'} | Particles: {currentWeather.particles === 'none' ? 'None' : currentWeather.particles}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
