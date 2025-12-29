import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { Suspense, useState, useMemo } from 'react';
import {
  Gate, gateMeta,
  KeyGate, keyGateMeta,
  Fence, fenceMeta,
  Fence4, fence4Meta,
  Key, keyMeta,
  InteractSwitch, interactSwitchMeta,
  StepSwitch, stepSwitchMeta,
  RemoteSwitch, remoteSwitchMeta,
  DropMeseta, dropMesetaMeta,
  DropWeapon, dropWeaponMeta,
  DropArmor, dropArmorMeta,
  DropRare, dropRareMeta,
  DropItem, dropItemMeta,
  Waypoint, waypointMeta,
  Box, boxMeta,
  RareBox, rareBoxMeta,
  Wall, wallMeta,
  type StoryMeta,
} from '../elements';

// Registry of all elements with their components and metadata
interface ElementEntry {
  id: string;
  Component: React.ComponentType<{ state?: string }>;
  meta: StoryMeta;
}

interface CategoryEntry {
  name: string;
  elements: ElementEntry[];
}

const CATEGORIES: CategoryEntry[] = [
  {
    name: 'Gates',
    elements: [
      { id: 'gate', Component: Gate as React.ComponentType<{ state?: string }>, meta: gateMeta },
      { id: 'key-gate', Component: KeyGate as React.ComponentType<{ state?: string }>, meta: keyGateMeta },
    ],
  },
  {
    name: 'Fences',
    elements: [
      { id: 'fence', Component: Fence as React.ComponentType<{ state?: string }>, meta: fenceMeta },
      { id: 'fence-4', Component: Fence4 as React.ComponentType<{ state?: string }>, meta: fence4Meta },
    ],
  },
  {
    name: 'Switches',
    elements: [
      { id: 'interact-switch', Component: InteractSwitch as React.ComponentType<{ state?: string }>, meta: interactSwitchMeta },
      { id: 'step-switch', Component: StepSwitch as React.ComponentType<{ state?: string }>, meta: stepSwitchMeta },
      { id: 'remote-switch', Component: RemoteSwitch as React.ComponentType<{ state?: string }>, meta: remoteSwitchMeta },
    ],
  },
  {
    name: 'Pickups',
    elements: [
      { id: 'key', Component: Key as React.ComponentType<{ state?: string }>, meta: keyMeta },
    ],
  },
  {
    name: 'Drops',
    elements: [
      { id: 'drop-meseta', Component: DropMeseta as React.ComponentType<{ state?: string }>, meta: dropMesetaMeta },
      { id: 'drop-weapon', Component: DropWeapon as React.ComponentType<{ state?: string }>, meta: dropWeaponMeta },
      { id: 'drop-armor', Component: DropArmor as React.ComponentType<{ state?: string }>, meta: dropArmorMeta },
      { id: 'drop-rare', Component: DropRare as React.ComponentType<{ state?: string }>, meta: dropRareMeta },
      { id: 'drop-item', Component: DropItem as React.ComponentType<{ state?: string }>, meta: dropItemMeta },
    ],
  },
  {
    name: 'Indicators',
    elements: [
      { id: 'waypoint', Component: Waypoint as React.ComponentType<{ state?: string }>, meta: waypointMeta },
    ],
  },
  {
    name: 'Containers',
    elements: [
      { id: 'box', Component: Box as React.ComponentType<{ state?: string }>, meta: boxMeta },
      { id: 'rare-box', Component: RareBox as React.ComponentType<{ state?: string }>, meta: rareBoxMeta },
    ],
  },
  {
    name: 'Walls',
    elements: [
      { id: 'wall', Component: Wall as React.ComponentType<{ state?: string }>, meta: wallMeta },
    ],
  },
];

// Flatten for lookup
const ALL_ELEMENTS = CATEGORIES.flatMap((cat) => cat.elements);

function ElementPreview({ element, state }: { element: ElementEntry; state: string }) {
  const { Component } = element;

  return (
    <Suspense fallback={null}>
      <Component state={state} />
    </Suspense>
  );
}

export default function StorybookViewer() {
  const [selectedId, setSelectedId] = useState<string>(ALL_ELEMENTS[0].id);
  const [states, setStates] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    ALL_ELEMENTS.forEach((el) => {
      initial[el.id] = el.meta.defaultState;
    });
    return initial;
  });

  const selectedElement = useMemo(() => {
    return ALL_ELEMENTS.find((el) => el.id === selectedId) || ALL_ELEMENTS[0];
  }, [selectedId]);

  const currentState = states[selectedId] || selectedElement.meta.defaultState;

  const handleStateChange = (newState: string) => {
    setStates((prev) => ({ ...prev, [selectedId]: newState }));
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: '#1a1a2e',
      color: 'white',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      {/* Left Panel - Element List */}
      <div style={{
        width: '220px',
        borderRight: '1px solid #333',
        overflow: 'auto',
        padding: '1rem',
        background: '#151525',
      }}>
        {CATEGORIES.map((category) => (
          <div key={category.name} style={{ marginBottom: '1.5rem' }}>
            <div style={{
              fontSize: '11px',
              color: '#666',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '0.5rem',
            }}>
              {category.name}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {category.elements.map((element) => (
                <button
                  key={element.id}
                  onClick={() => setSelectedId(element.id)}
                  style={{
                    padding: '10px 12px',
                    background: selectedId === element.id ? '#3a3a6a' : 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    color: selectedId === element.id ? 'white' : '#aaa',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: selectedId === element.id ? '600' : '400',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedId !== element.id) {
                      e.currentTarget.style.background = '#2a2a4a';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedId !== element.id) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  {element.meta.title}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #333' }}>
          <a
            href="/"
            style={{
              display: 'block',
              padding: '10px 14px',
              color: '#88aaff',
              textDecoration: 'none',
              fontSize: '13px',
              borderRadius: '6px',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#2a2a4a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            ← Back to Home
          </a>
        </div>
      </div>

      {/* Center - 3D Viewer */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Canvas camera={{ position: [3, 2, 3], fov: 50 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 10, 5]} intensity={0.8} />

          <ElementPreview element={selectedElement} state={currentState} />

          <OrbitControls />
          <Grid
            infiniteGrid
            fadeDistance={30}
            fadeStrength={5}
            cellColor="#333355"
            sectionColor="#444477"
          />
        </Canvas>

        {/* Element title overlay */}
        <div style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ fontSize: '18px', fontWeight: '600' }}>
            {selectedElement.meta.title}
          </div>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
            {selectedElement.meta.description}
          </div>
        </div>
      </div>

      {/* Right Panel - State Controls */}
      <div style={{
        width: '280px',
        borderLeft: '1px solid #333',
        overflow: 'auto',
        padding: '1.5rem',
        background: '#151525',
      }}>
        <div style={{
          fontSize: '11px',
          color: '#666',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '1rem',
        }}>
          State
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {selectedElement.meta.states.map((stateOption) => {
            const isSelected = currentState === stateOption.name;

            return (
              <label
                key={stateOption.name}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px',
                  background: isSelected ? '#3a3a6a' : '#2a2a4a',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  border: isSelected ? '1px solid #5a5a9a' : '1px solid transparent',
                }}
              >
                <input
                  type="radio"
                  name="element-state"
                  value={stateOption.name}
                  checked={isSelected}
                  onChange={() => handleStateChange(stateOption.name)}
                  style={{
                    width: '18px',
                    height: '18px',
                    marginTop: '2px',
                    accentColor: '#88aaff',
                  }}
                />
                <div>
                  <div style={{
                    fontWeight: '500',
                    fontSize: '14px',
                    color: isSelected ? 'white' : '#ccc',
                  }}>
                    {stateOption.label}
                  </div>
                  {stateOption.description && (
                    <div style={{
                      fontSize: '12px',
                      color: '#888',
                      marginTop: '4px',
                    }}>
                      {stateOption.description}
                    </div>
                  )}
                </div>
              </label>
            );
          })}
        </div>

        {/* Props Info */}
        <div style={{ marginTop: '2rem' }}>
          <div style={{
            fontSize: '11px',
            color: '#666',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '0.75rem',
          }}>
            Current Props
          </div>
          <pre style={{
            background: '#1a1a2e',
            padding: '12px',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#88aaff',
            overflow: 'auto',
            margin: 0,
          }}>
{`<${selectedElement.meta.title.replace(/[:\s]/g, '')}
  state="${currentState}"
/>`}
          </pre>
        </div>

        {/* Usage Notes */}
        <div style={{ marginTop: '2rem' }}>
          <div style={{
            fontSize: '11px',
            color: '#666',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '0.75rem',
          }}>
            Usage
          </div>
          <div style={{
            fontSize: '12px',
            color: '#888',
            lineHeight: '1.6',
          }}>
            {getUsageText(selectedElement.id)}
          </div>
        </div>
      </div>
    </div>
  );
}

function getUsageText(elementId: string): string {
  switch (elementId) {
    case 'gate':
      return 'Gates block passage between stages in the grid. They open automatically when all enemies in the stage are defeated.';
    case 'key-gate':
      return 'Key Gates block passage and require a Key pickup to unlock. Unlike regular gates, they do not open by defeating enemies.';
    case 'fence':
      return 'Fences block access to items or keys within a stage. They are disabled by activating an InteractSwitch.';
    case 'fence-4':
      return 'Four-sided fence that blocks access from all directions. Works the same as regular fences but provides 360-degree coverage.';
    case 'key':
      return 'Keys are pickup items that unlock KeyGates. They float and rotate when available, disappear when collected.';
    case 'interact-switch':
      return 'Players interact with these switches to disable fences. Typically placed near the fence they control.';
    case 'step-switch':
      return 'Pressure plates that activate when stepped on. Used for contextual triggers like traps, lights, or debug functions.';
    case 'remote-switch':
      return 'Interactive switch used to disarm traps or trigger remote mechanisms. Player must interact to activate.';
    case 'drop-meseta':
      return 'Currency drops from defeated enemies. Auto-collected when the player walks near.';
    case 'drop-weapon':
      return 'Weapon drops from defeated enemies or containers. Must be picked up manually.';
    case 'drop-armor':
      return 'Armor/protector drops from defeated enemies or containers. Must be picked up manually.';
    case 'drop-rare':
      return 'Rare item drops. These have a distinct appearance to indicate their rarity.';
    case 'drop-item':
      return 'Generic item drops like consumables or materials. Must be picked up manually.';
    case 'waypoint':
      return 'Navigation indicators placed in load triggers. Shows different icons based on whether the destination has been visited.';
    case 'box':
      return 'Destructible containers that may drop items when destroyed. Model varies by field.';
    case 'rare-box':
      return 'Special containers that drop valuable items when destroyed. Model varies by field.';
    case 'wall':
      return 'Destructible walls that block passage until destroyed. Model varies by field.';
    default:
      return '';
  }
}
