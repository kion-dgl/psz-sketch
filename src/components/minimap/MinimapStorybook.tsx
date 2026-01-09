import { useState } from 'react';
import Minimap from './Minimap';

// Extracted from the SVG file
const FLOOR_PATH = "M 117.4,99.3 L 98.4,98.6 L 76.4,138.6 Z M 117.4,99.3 L 76.4,138.6 L 123.9,135.1 Z M 262.4,243.7 L 279.5,286.2 L 302.8,237.4 Z M 167.6,271.2 L 169.1,280.3 L 265.5,292.6 Z M 167.6,271.2 L 265.5,292.6 L 202.0,243.8 Z M 202.0,243.8 L 265.5,292.6 L 279.5,286.2 Z M 202.0,243.8 L 279.5,286.2 L 262.4,243.7 Z M 130.5,170.8 L 172.5,135.5 L 160.9,110.1 Z M 130.5,170.8 L 160.9,110.1 L 123.9,135.1 Z M 284.6,187.2 L 262.4,243.7 L 302.8,237.4 Z M 284.6,187.2 L 302.8,237.4 L 302.8,185.7 Z M 76.4,138.6 L 130.5,170.8 L 123.9,135.1 Z M 160.9,110.1 L 117.4,99.3 L 123.9,135.1 Z M 259.1,96.0 L 237.6,126.5 L 266.0,160.2 Z M 259.1,96.0 L 266.0,160.2 L 288.3,132.1 Z M 288.3,132.1 L 266.0,160.2 L 274.0,174.7 Z M 288.3,132.1 L 274.0,174.7 L 316.2,164.5 Z M 266.0,160.2 L 161.6,217.3 L 194.4,228.6 Z M 161.6,217.3 L 147.8,263.2 L 194.4,228.6 Z M 81.5,229.3 L 115.2,182.8 L 60.7,144.5 Z M 81.5,229.3 L 60.7,144.5 L 60.7,222.6 Z M 170.9,97.3 L 191.9,136.8 L 237.6,126.5 Z M 170.9,97.3 L 237.6,126.5 L 225.3,83.2 Z M 274.0,174.7 L 266.0,160.2 L 194.4,228.6 Z M 274.0,174.7 L 194.4,228.6 L 251.6,226.9 Z M 237.6,126.5 L 259.1,96.0 L 225.3,83.2 Z M 279.5,286.2 L 265.5,292.6 L 258.1,313.0 Z M 279.5,286.2 L 258.1,313.0 L 292.9,303.8 Z M 292.9,303.8 L 258.1,313.0 L 258.1,370.8 Z M 292.9,303.8 L 258.1,370.8 L 292.9,361.9 Z M -23.5,274.8 L -38.0,309.6 L 89.7,309.6 Z M -23.5,274.8 L 89.7,309.6 L 89.7,274.8 Z M 89.7,274.8 L 89.7,309.6 L 150.7,298.0 Z M 89.7,274.8 L 150.7,298.0 L 147.8,263.2 Z M 98.4,98.6 L 117.4,99.3 L 89.7,83.2 Z M 117.4,99.3 L 124.6,83.2 L 89.7,83.2 Z M 167.6,271.2 L 147.8,263.2 L 169.1,280.3 Z M 147.8,263.2 L 150.7,298.0 L 169.1,280.3 Z M 244.8,477.1 L 265.8,489.5 L 292.9,361.9 Z M 244.8,477.1 L 292.9,361.9 L 258.1,370.8 Z M 89.7,36.7 L 124.6,29.8 L 146.8,-77.9 Z M 89.7,36.7 L 146.8,-77.9 L 125.0,-89.5 Z M 124.6,83.2 L 124.6,29.8 L 89.7,36.7 Z M 124.6,83.2 L 89.7,36.7 L 89.7,83.2 Z M 322.0,199.3 L 380.0,199.3 L 380.0,164.5 Z M 322.0,199.3 L 380.0,164.5 L 316.2,164.5 Z M 322.0,199.3 L 316.2,164.5 L 302.8,185.7 Z M 124.6,83.2 L 117.4,99.3 L 160.9,110.1 Z M 124.6,83.2 L 160.9,110.1 L 170.9,97.3 Z M 60.7,144.5 L 76.4,138.6 L 98.4,98.6 Z M 60.7,144.5 L 98.4,98.6 L 89.7,83.2 Z M 316.2,164.5 L 274.0,174.7 L 284.6,187.2 Z M 316.2,164.5 L 284.6,187.2 L 302.8,185.7 Z M 251.6,226.9 L 194.4,228.6 L 202.0,243.8 Z M 251.6,226.9 L 202.0,243.8 L 262.4,243.7 Z M 60.7,144.5 L 115.2,182.8 L 130.5,170.8 Z M 60.7,144.5 L 130.5,170.8 L 76.4,138.6 Z M 172.5,135.5 L 191.9,136.8 L 170.9,97.3 Z M 172.5,135.5 L 170.9,97.3 L 160.9,110.1 Z M 144.8,181.3 L 191.9,136.8 L 172.5,135.5 Z M 144.8,181.3 L 172.5,135.5 L 130.5,170.8 Z M 302.8,185.7 L 302.8,237.4 L 319.7,248.9 Z M 302.8,185.7 L 319.7,248.9 L 322.0,199.3 Z M 150.7,298.0 L 258.1,313.0 L 265.5,292.6 Z M 150.7,298.0 L 265.5,292.6 L 169.1,280.3 Z M 147.8,263.2 L 167.6,271.2 L 202.0,243.8 Z M 147.8,263.2 L 202.0,243.8 L 194.4,228.6 Z M 262.4,243.7 L 284.6,187.2 L 274.0,174.7 Z M 262.4,243.7 L 274.0,174.7 L 251.6,226.9 Z M 302.8,237.4 L 279.5,286.2 L 292.9,303.8 Z M 302.8,237.4 L 292.9,303.8 L 319.7,248.9 Z M 130.5,170.8 L 115.2,182.8 L 144.8,181.3 Z";

const BOUNDARY_PATH = "M 237.6,126.5 L 266.0,160.2 M 288.3,132.1 L 259.1,96.0 M 316.2,164.5 L 288.3,132.1 M 266.0,160.2 L 161.6,217.3 M 161.6,217.3 L 147.8,263.2 M 81.5,229.3 L 115.2,182.8 M 60.7,144.5 L 60.7,222.6 M 60.7,222.6 L 81.5,229.3 M 191.9,136.8 L 237.6,126.5 M 225.3,83.2 L 170.9,97.3 M 259.1,96.0 L 225.3,83.2 M 258.1,313.0 L 258.1,370.8 M 292.9,361.9 L 292.9,303.8 M -23.5,274.8 L -38.0,309.6 M -38.0,309.6 L 89.7,309.6 M 89.7,274.8 L -23.5,274.8 M 89.7,309.6 L 150.7,298.0 M 147.8,263.2 L 89.7,274.8 M 244.8,477.1 L 265.8,489.5 M 265.8,489.5 L 292.9,361.9 M 258.1,370.8 L 244.8,477.1 M 124.6,29.8 L 146.8,-77.9 M 146.8,-77.9 L 125.0,-89.5 M 125.0,-89.5 L 89.7,36.7 M 124.6,83.2 L 124.6,29.8 M 89.7,36.7 L 89.7,83.2 M 322.0,199.3 L 380.0,199.3 M 380.0,199.3 L 380.0,164.5 M 380.0,164.5 L 316.2,164.5 M 170.9,97.3 L 124.6,83.2 M 89.7,83.2 L 60.7,144.5 M 144.8,181.3 L 191.9,136.8 M 319.7,248.9 L 322.0,199.3 M 150.7,298.0 L 258.1,313.0 M 292.9,303.8 L 319.7,248.9 M 115.2,182.8 L 144.8,181.3";

// Gate positions from the SVG
const GATE_POSITIONS = [
  { x: 84, y: 79.7, width: 48, height: 8 },      // Gate 0: Top gate
  { x: 248, y: 312, width: 48, height: 8 },      // Gate 1: Bottom gate
  { x: 26.8, y: 269.5, width: 8, height: 48 },   // Gate 2: Left gate
  { x: 336.3, y: 157.8, width: 8, height: 48 },  // Gate 3: Right gate
];

interface GateState {
  id: number;
  exists: boolean;
  locked: boolean;
}

export default function MinimapStorybook() {
  const [playerX, setPlayerX] = useState(200);
  const [playerZ, setPlayerZ] = useState(200);
  const [playerRotation, setPlayerRotation] = useState(0);
  const [minimapSize, setMinimapSize] = useState(200);
  const [gates, setGates] = useState<GateState[]>([
    { id: 0, exists: true, locked: true },
    { id: 1, exists: true, locked: false },
    { id: 2, exists: true, locked: true },
    { id: 3, exists: true, locked: false },
  ]);

  const updateGate = (index: number, field: keyof Omit<GateState, 'id'>, value: boolean) => {
    setGates(prev => prev.map((gate, i) =>
      i === index ? { ...gate, [field]: value } : gate
    ));
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Minimap</h1>

      {/* Preview Area */}
      <div style={styles.previewArea}>
        <div style={styles.previewBg}>
          <Minimap
            floorPath={FLOOR_PATH}
            boundaryPath={BOUNDARY_PATH}
            gatePositions={GATE_POSITIONS}
            playerX={playerX}
            playerZ={playerZ}
            playerRotation={playerRotation}
            gates={gates}
            size={minimapSize}
          />
        </div>
      </div>

      {/* Controls */}
      <div style={styles.controls}>
        {/* Player Position */}
        <h3 style={styles.sectionTitle}>Player Position</h3>
        <div style={styles.sliderGroup}>
          <div style={styles.controlRow}>
            <label style={styles.label}>X Position</label>
            <input
              type="range"
              min="0"
              max="400"
              value={playerX}
              onChange={(e) => setPlayerX(Number(e.target.value))}
              style={styles.slider}
            />
            <span style={styles.value}>{playerX}</span>
          </div>
          <div style={styles.controlRow}>
            <label style={styles.label}>Z Position</label>
            <input
              type="range"
              min="0"
              max="400"
              value={playerZ}
              onChange={(e) => setPlayerZ(Number(e.target.value))}
              style={styles.slider}
            />
            <span style={styles.value}>{playerZ}</span>
          </div>
          <div style={styles.controlRow}>
            <label style={styles.label}>Rotation</label>
            <input
              type="range"
              min="0"
              max="360"
              value={playerRotation}
              onChange={(e) => setPlayerRotation(Number(e.target.value))}
              style={styles.slider}
            />
            <span style={styles.value}>{playerRotation}°</span>
          </div>
        </div>

        {/* Minimap Size */}
        <h3 style={styles.sectionTitle}>Display Size</h3>
        <div style={styles.controlRow}>
          <label style={styles.label}>Size</label>
          <input
            type="range"
            min="100"
            max="400"
            value={minimapSize}
            onChange={(e) => setMinimapSize(Number(e.target.value))}
            style={styles.slider}
          />
          <span style={styles.value}>{minimapSize}px</span>
        </div>

        {/* Gate Controls */}
        <h3 style={styles.sectionTitle}>Gates</h3>
        <div style={styles.gatesGrid}>
          {gates.map((gate, index) => (
            <div key={gate.id} style={styles.gateControl}>
              <h4 style={styles.gateTitle}>
                Gate {index} ({['Top', 'Bottom', 'Left', 'Right'][index]})
              </h4>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={gate.exists}
                  onChange={(e) => updateGate(index, 'exists', e.target.checked)}
                />
                Exists
              </label>
              <label style={{
                ...styles.checkboxLabel,
                opacity: gate.exists ? 1 : 0.5,
              }}>
                <input
                  type="checkbox"
                  checked={gate.locked}
                  onChange={(e) => updateGate(index, 'locked', e.target.checked)}
                  disabled={!gate.exists}
                />
                Locked
                <span style={{
                  display: 'inline-block',
                  width: 12,
                  height: 12,
                  marginLeft: 8,
                  borderRadius: 2,
                  background: gate.locked ? '#ff4444' : '#44ff44',
                  opacity: gate.exists ? 1 : 0.3,
                }} />
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '20px',
    minHeight: '100vh',
    background: '#1a1a2e',
    color: '#fff',
  },
  title: {
    fontSize: '24px',
    marginBottom: '20px',
    textAlign: 'center',
  },
  previewArea: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '30px',
  },
  previewBg: {
    background: 'linear-gradient(135deg, #2d3436 0%, #000000 100%)',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
  },
  controls: {
    maxWidth: '600px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    background: '#2d2d44',
    padding: '20px',
    borderRadius: '8px',
  },
  sectionTitle: {
    fontSize: '14px',
    color: '#6b8afd',
    margin: '16px 0 8px 0',
    borderBottom: '1px solid #3a3a5a',
    paddingBottom: '8px',
  },
  sliderGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  controlRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  label: {
    width: '100px',
    fontSize: '12px',
    color: '#aaa',
  },
  slider: {
    flex: 1,
    height: '4px',
    cursor: 'pointer',
  },
  value: {
    width: '60px',
    fontSize: '12px',
    color: '#6b8afd',
    textAlign: 'right',
  },
  gatesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  gateControl: {
    background: '#1a1a2e',
    padding: '12px',
    borderRadius: '6px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  gateTitle: {
    fontSize: '12px',
    margin: 0,
    color: '#aaa',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#ccc',
    cursor: 'pointer',
  },
};
