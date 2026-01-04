import { useMemo } from 'react';

interface GateState {
  id: number;
  exists: boolean;
  locked: boolean;
}

interface MinimapProps {
  floorPath: string; // SVG path data for floor triangles
  boundaryPath: string; // SVG path data for boundary edges
  gatePositions: Array<{ x: number; y: number; width: number; height: number }>;
  playerX: number; // 0-400 in SVG coordinates
  playerZ: number; // 0-400 in SVG coordinates
  playerRotation: number; // degrees, 0 = up
  gates: GateState[];
  size?: number; // display size in pixels
}

export default function Minimap({
  floorPath,
  boundaryPath,
  gatePositions,
  playerX,
  playerZ,
  playerRotation,
  gates,
  size = 200,
}: MinimapProps) {
  // Player triangle points (pointing up by default)
  const playerTriangle = useMemo(() => {
    const triSize = 12;
    // Triangle pointing up: top vertex, bottom-left, bottom-right
    return `
      M ${playerX} ${playerZ - triSize}
      L ${playerX - triSize * 0.6} ${playerZ + triSize * 0.5}
      L ${playerX + triSize * 0.6} ${playerZ + triSize * 0.5}
      Z
    `;
  }, [playerX, playerZ]);

  return (
    <div style={{
      ...styles.container,
      width: size,
      height: size,
    }}>
      <svg
        viewBox="0 0 400 400"
        style={styles.svg}
      >
        {/* Background */}
        <rect width="400" height="400" fill="#1a1a2e" />

        {/* Floor triangles */}
        <path d={floorPath} fill="#2a2a4e" stroke="none" />

        {/* Boundary edges */}
        <path
          d={boundaryPath}
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Gate markers */}
        {gates.map((gate, index) => {
          const pos = gatePositions[index];
          if (!pos || !gate.exists) return null;
          return (
            <rect
              key={gate.id}
              x={pos.x}
              y={pos.y}
              width={pos.width}
              height={pos.height}
              fill={gate.locked ? '#ff4444' : '#44ff44'}
              stroke="white"
              strokeWidth="1"
            />
          );
        })}

        {/* Player marker */}
        <g transform={`rotate(${playerRotation}, ${playerX}, ${playerZ})`}>
          <path
            d={playerTriangle}
            fill="#00ff00"
            stroke="#ffffff"
            strokeWidth="2"
          />
        </g>
      </svg>
    </div>
  );
}

// Gate positions extracted from the SVG (approximate centers)
const GATE_POSITIONS: Record<number, { x: number; y: number; width: number; height: number }> = {
  0: { x: 84, y: 79.7, width: 48, height: 8 },      // Top gate
  1: { x: 248, y: 312, width: 48, height: 8 },      // Bottom gate
  2: { x: 26.8, y: 269.5, width: 8, height: 48 },   // Left gate
  3: { x: 336.3, y: 157.8, width: 8, height: 48 },  // Right gate
};

function GateOverlay({ gate }: { gate: GateState }) {
  const pos = GATE_POSITIONS[gate.id];
  if (!pos || !gate.exists) return null;

  return (
    <rect
      x={pos.x}
      y={pos.y}
      width={pos.width}
      height={pos.height}
      fill={gate.locked ? '#ff4444' : '#44ff44'}
      stroke="white"
      strokeWidth="1"
    />
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    borderRadius: '8px',
    overflow: 'hidden',
    border: '2px solid #2c5a7c',
    boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
  },
  svg: {
    width: '100%',
    height: '100%',
    display: 'block',
  },
};
