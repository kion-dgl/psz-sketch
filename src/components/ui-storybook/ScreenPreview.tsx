import HUD from '../hud/HUD';
import Minimap from '../minimap/Minimap';
import Tooltip, { type TooltipData } from '../tooltip/Tooltip';
import ActionPalette from '../palette/ActionPalette';

// Sample floor/boundary paths from valley minimap
const FLOOR_PATH = "M 117.4,99.3 L 98.4,98.6 L 76.4,138.6 Z M 117.4,99.3 L 76.4,138.6 L 123.9,135.1 Z M 262.4,243.7 L 279.5,286.2 L 302.8,237.4 Z M 167.6,271.2 L 169.1,280.3 L 265.5,292.6 Z M 167.6,271.2 L 265.5,292.6 L 202.0,243.8 Z M 202.0,243.8 L 265.5,292.6 L 279.5,286.2 Z M 202.0,243.8 L 279.5,286.2 L 262.4,243.7 Z M 130.5,170.8 L 172.5,135.5 L 160.9,110.1 Z M 130.5,170.8 L 160.9,110.1 L 123.9,135.1 Z M 284.6,187.2 L 262.4,243.7 L 302.8,237.4 Z M 284.6,187.2 L 302.8,237.4 L 302.8,185.7 Z M 76.4,138.6 L 130.5,170.8 L 123.9,135.1 Z M 160.9,110.1 L 117.4,99.3 L 123.9,135.1 Z M 259.1,96.0 L 237.6,126.5 L 266.0,160.2 Z M 259.1,96.0 L 266.0,160.2 L 288.3,132.1 Z M 288.3,132.1 L 266.0,160.2 L 274.0,174.7 Z M 288.3,132.1 L 274.0,174.7 L 316.2,164.5 Z M 266.0,160.2 L 161.6,217.3 L 194.4,228.6 Z M 161.6,217.3 L 147.8,263.2 L 194.4,228.6 Z M 81.5,229.3 L 115.2,182.8 L 60.7,144.5 Z M 81.5,229.3 L 60.7,144.5 L 60.7,222.6 Z M 170.9,97.3 L 191.9,136.8 L 237.6,126.5 Z M 170.9,97.3 L 237.6,126.5 L 225.3,83.2 Z M 274.0,174.7 L 266.0,160.2 L 194.4,228.6 Z M 274.0,174.7 L 194.4,228.6 L 251.6,226.9 Z M 237.6,126.5 L 259.1,96.0 L 225.3,83.2 Z M 130.5,170.8 L 115.2,182.8 L 144.8,181.3 Z";

const BOUNDARY_PATH = "M 237.6,126.5 L 266.0,160.2 M 288.3,132.1 L 259.1,96.0 M 316.2,164.5 L 288.3,132.1 M 266.0,160.2 L 161.6,217.3 M 161.6,217.3 L 147.8,263.2 M 81.5,229.3 L 115.2,182.8 M 60.7,144.5 L 60.7,222.6 M 60.7,222.6 L 81.5,229.3 M 191.9,136.8 L 237.6,126.5 M 225.3,83.2 L 170.9,97.3 M 259.1,96.0 L 225.3,83.2 M 170.9,97.3 L 124.6,83.2 M 89.7,83.2 L 60.7,144.5 M 144.8,181.3 L 191.9,136.8 M 115.2,182.8 L 144.8,181.3";

const GATE_POSITIONS = [
  { x: 84, y: 79.7, width: 48, height: 8 },
  { x: 248, y: 312, width: 48, height: 8 },
  { x: 26.8, y: 269.5, width: 8, height: 48 },
  { x: 336.3, y: 157.8, width: 8, height: 48 },
];

const DEFAULT_SLOTS = [
  { icon: '/icons/palette/attack.svg', borderColor: 'green' },
  { icon: '/icons/equipment/rod.svg', borderColor: 'purple' },
  { icon: '/icons/palette/foie.svg', borderColor: 'red' },
  { icon: '/icons/palette/resta.svg', borderColor: 'cyan' },
  { icon: '/icons/palette/evade.svg', borderColor: 'blue' },
  { icon: '/icons/palette/gifoie.svg', borderColor: 'yellow' },
] as const;

export default function ScreenPreview() {
  const tooltipData: TooltipData = {
    type: 'enemy',
    name: 'Porel',
    attribute: 'Native',
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Screen Preview</h1>
      <p style={styles.subtitle}>1024x768 game screen layout</p>

      {/* Screen Container */}
      <div style={styles.screenWrapper}>
        <div style={styles.screen}>
          {/* Background placeholder */}
          <div style={styles.gameBackground}>
            <span style={styles.bgText}>Game View</span>
          </div>

          {/* HUD - Top Left */}
          <div style={styles.hudPosition}>
            <HUD
              name="Kireek"
              level={45}
              currentHP={342}
              maxHP={450}
              currentPP={85}
              maxPP={120}
              photonBlastGauge={65}
              leader={true}
            />
          </div>

          {/* Minimap - Top Right */}
          <div style={styles.minimapPosition}>
            <Minimap
              floorPath={FLOOR_PATH}
              boundaryPath={BOUNDARY_PATH}
              gatePositions={GATE_POSITIONS}
              playerX={180}
              playerZ={180}
              playerRotation={45}
              gates={[
                { id: 0, exists: true, locked: false },
                { id: 1, exists: true, locked: true },
                { id: 2, exists: true, locked: false },
                { id: 3, exists: false, locked: false },
              ]}
              size={160}
            />
          </div>

          {/* Tooltip - Bottom Left */}
          <div style={styles.tooltipPosition}>
            <Tooltip data={tooltipData} />
          </div>

          {/* Action Palette - Bottom Right */}
          <div style={styles.palettePosition}>
            <ActionPalette
              slots={DEFAULT_SLOTS as any}
              triggerHeld={false}
            />
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={styles.legend}>
        <div style={styles.legendItem}>
          <span style={styles.legendColor} data-color="hud" /> HUD (top-left)
        </div>
        <div style={styles.legendItem}>
          <span style={styles.legendColor} data-color="minimap" /> Minimap (top-right)
        </div>
        <div style={styles.legendItem}>
          <span style={styles.legendColor} data-color="tooltip" /> Tooltip (bottom-left)
        </div>
        <div style={styles.legendItem}>
          <span style={styles.legendColor} data-color="palette" /> Action Palette (bottom-right)
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
    marginBottom: '8px',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '14px',
    color: '#888',
    textAlign: 'center',
    marginBottom: '20px',
  },
  screenWrapper: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  screen: {
    position: 'relative',
    width: '1024px',
    height: '768px',
    background: '#000',
    border: '4px solid #333',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  gameBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(180deg, #1a3a2a 0%, #0a1a10 50%, #050a08 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgText: {
    fontSize: '48px',
    color: '#1a2a1a',
    fontWeight: 'bold',
    userSelect: 'none',
  },
  hudPosition: {
    position: 'absolute',
    top: '16px',
    left: '16px',
  },
  minimapPosition: {
    position: 'absolute',
    top: '16px',
    right: '16px',
  },
  tooltipPosition: {
    position: 'absolute',
    bottom: '16px',
    left: '16px',
  },
  palettePosition: {
    position: 'absolute',
    bottom: '16px',
    right: '16px',
  },
  legend: {
    display: 'flex',
    justifyContent: 'center',
    gap: '24px',
    fontSize: '12px',
    color: '#888',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  legendColor: {
    display: 'inline-block',
    width: '12px',
    height: '12px',
    borderRadius: '2px',
    background: '#4a9eff',
  },
};
