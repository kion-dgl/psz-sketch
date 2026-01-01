import { useState, useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { CollisionProvider } from '../../collision';
import {
  CITY_AREAS,
  FIELD_STAGES,
  ALL_CATEGORIES,
  getStagePath,
  getStageAssetPath,
  type StageField,
  type StageArea,
  type CityArea,
} from './stageData';

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

// Sample tags for demo mode
import { Stage, Box, Gate, Switch, Warp } from '../tags';

// Particles
import SandParticles from '../valley/SandParticles';
import RainParticles from '../valley/RainParticles';
import SnowParticles from '../snowfield/SnowParticles';
import EmberParticles from '../makara/EmberParticles';
import SporeSparkParticles from '../paru/SporeSparkParticles';
import SteamParticles from '../arca/SteamParticles';
import ShadowWispParticles from '../shrine/ShadowWispParticles';
import EternalMoteParticles from '../tower/EternalMoteParticles';

type ViewMode = 'environment' | 'with-tags';

interface FieldEnvironmentProps {
  fieldId: string;
  mapId: string;
  showTags: boolean;
}

function FieldEnvironment({ fieldId, mapId, showTags }: FieldEnvironmentProps) {
  // Render appropriate environment based on field
  const renderEnv = () => {
    switch (fieldId) {
      case 'valley':
        return (
          <>
            <ValleyEnv mapId={mapId} />
            <SandParticles intensity="light" />
            <CollisionProvider>
              <ValleyFloorCollision mapId={mapId} />
              {showTags && <SampleTags />}
            </CollisionProvider>
          </>
        );
      case 'wetlands':
        return (
          <>
            <WetlandsEnv mapId={mapId} />
            <RainParticles />
            <CollisionProvider>
              <WetlandsFloorCollision mapId={mapId} />
              {showTags && <SampleTags />}
            </CollisionProvider>
          </>
        );
      case 'snowfield':
        return (
          <>
            <SnowfieldEnv mapId={mapId} />
            <SnowParticles />
            <CollisionProvider>
              <SnowfieldFloorCollision mapId={mapId} />
              {showTags && <SampleTags />}
            </CollisionProvider>
          </>
        );
      case 'makara':
        return (
          <>
            <MakaraEnv mapId={mapId} />
            <EmberParticles />
            <CollisionProvider>
              <MakaraFloorCollision mapId={mapId} />
              {showTags && <SampleTags />}
            </CollisionProvider>
          </>
        );
      case 'paru':
        return (
          <>
            <ParuEnv mapId={mapId} />
            <SporeSparkParticles />
            <CollisionProvider>
              <ParuFloorCollision mapId={mapId} />
              {showTags && <SampleTags />}
            </CollisionProvider>
          </>
        );
      case 'arca':
        return (
          <>
            <ArcaEnv mapId={mapId} />
            <SteamParticles />
            <CollisionProvider>
              <ArcaFloorCollision mapId={mapId} />
              {showTags && <SampleTags />}
            </CollisionProvider>
          </>
        );
      case 'shrine':
        return (
          <>
            <ShrineEnv mapId={mapId} />
            <ShadowWispParticles />
            <CollisionProvider>
              <ShrineFloorCollision mapId={mapId} />
              {showTags && <SampleTags />}
            </CollisionProvider>
          </>
        );
      case 'tower':
        return (
          <>
            <TowerEnv mapId={mapId} />
            <EternalMoteParticles />
            <CollisionProvider>
              <TowerFloorCollision mapId={mapId} />
              {showTags && <SampleTags />}
            </CollisionProvider>
          </>
        );
      default:
        return null;
    }
  };

  return renderEnv();
}

function CityEnvironment({ areaId, showTags }: { areaId: string; showTags: boolean }) {
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

function SampleTags() {
  return (
    <Stage id="storybook-demo">
      <Box position={[3, 0, 0]} />
      <Box position={[5, 0, 0]} />
      <Box position={[7, 0, 0]} />
      <Gate id="gate1" position={[0, 0, 8]} />
      <Switch type="step" targetId="gate1" position={[0, 0, 4]} />
      <Warp type="start" position={[0, 0, -5]} />
      <Warp type="area" position={[0, 0, 15]} targetArea="#" state="inactive" />
    </Stage>
  );
}

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="gray" wireframe />
    </mesh>
  );
}

export default function StageStorybook() {
  // Selection state
  const [category, setCategory] = useState<string>('valley');
  const [areaId, setAreaId] = useState<string>('a');
  const [variantId, setVariantId] = useState<string>('s01a_ga1');
  const [viewMode, setViewMode] = useState<ViewMode>('environment');

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

  // Handle category change
  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    if (newCategory === 'city') {
      setAreaId('warp');
      setVariantId('');
    } else {
      const field = FIELD_STAGES.find(f => f.id === newCategory);
      if (field) {
        setAreaId(field.areas[0]?.id ?? 'a');
        setVariantId(field.areas[0]?.variants[0]?.id ?? '');
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

        {/* View mode toggle */}
        <label style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          View:
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as ViewMode)}
            style={{ padding: '0.5rem', borderRadius: '4px' }}
          >
            <option value="environment">Environment Only</option>
            <option value="with-tags">With Sample Tags</option>
          </select>
        </label>

        {/* Info */}
        <div style={{ marginLeft: 'auto', color: '#888', fontSize: '0.9rem' }}>
          {isCity ? (
            <span>City: {currentCityArea?.label}</span>
          ) : (
            <span>Map ID: {mapId}</span>
          )}
        </div>
      </div>

      {/* 3D Canvas */}
      <div style={{ flex: 1, background: '#000' }}>
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[0, 10, 20]} />
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={5}
            maxDistance={100}
          />

          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 20, 10]} intensity={0.8} castShadow />

          <Suspense fallback={<LoadingFallback />}>
            {isCity ? (
              <CityEnvironment areaId={areaId} showTags={viewMode === 'with-tags'} />
            ) : (
              <FieldEnvironment
                fieldId={category}
                mapId={mapId}
                showTags={viewMode === 'with-tags'}
              />
            )}
          </Suspense>

          {/* Grid helper */}
          <gridHelper args={[100, 100, '#444', '#222']} />
        </Canvas>
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
          <span>
            Asset path: {getStageAssetPath(category, areaId, variantId)}
          </span>
        )}
      </div>
    </div>
  );
}
