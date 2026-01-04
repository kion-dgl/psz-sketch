import { useState, useMemo } from 'react';
import type { UnifiedStageConfig, FloorTriangle, SvgSettings } from '../types';
import { DEFAULT_SVG_SETTINGS } from '../types';

interface SvgTabProps {
  config: UnifiedStageConfig;
  updateConfig: (updater: (prev: UnifiedStageConfig) => UnifiedStageConfig) => void;
  floorTriangles: FloorTriangle[];
  mapId: string;
}

// Generate SVG minimap with configurable bounds
function generateSvgMinimap(
  triangles: FloorTriangle[],
  portals: UnifiedStageConfig['portals'],
  options: {
    gridSize: number;
    centerX: number;
    centerZ: number;
    svgSize: number;
    padding: number;
  }
): { svg: string; gatesInBounds: number } {
  const { gridSize, centerX, centerZ, svgSize, padding } = options;

  if (triangles.length === 0) {
    return {
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgSize} ${svgSize}"><rect width="${svgSize}" height="${svgSize}" fill="#1a1a2e"/><text x="${svgSize / 2}" y="${svgSize / 2}" text-anchor="middle" fill="#666">No floor data</text></svg>`,
      gatesInBounds: 0,
    };
  }

  // Use configurable bounds centered on centerX, centerZ
  const halfGrid = gridSize / 2;
  const minX = centerX - halfGrid;
  const maxX = centerX + halfGrid;
  const minZ = centerZ - halfGrid;
  const maxZ = centerZ + halfGrid;

  const width = maxX - minX;
  const height = maxZ - minZ;
  const scale = (svgSize - padding * 2) / Math.max(width, height);

  // Transform functions
  const toSvgX = (x: number) => (x - minX) * scale + padding;
  const toSvgY = (z: number) => (z - minZ) * scale + padding;

  // Filter triangles to only include those within bounds (at least partially)
  const visibleTriangles = triangles.filter((tri) => {
    return tri.vertices.some(
      (v) => v.x >= minX && v.x <= maxX && v.z >= minZ && v.z <= maxZ
    );
  });

  // Build triangle paths
  const trianglePaths = visibleTriangles
    .map((tri) => {
      const points = tri.vertices.map(
        (v) => `${toSvgX(v.x).toFixed(1)},${toSvgY(v.z).toFixed(1)}`
      );
      return `M ${points.join(' L ')} Z`;
    })
    .join(' ');

  // Find boundary edges (edges shared by only 1 triangle)
  const edgeMap = new Map<string, number>();
  const edgeVertices = new Map<string, [[number, number], [number, number]]>();

  visibleTriangles.forEach((tri) => {
    const verts = tri.vertices.map((v) => [v.x, v.z] as [number, number]);
    for (let i = 0; i < 3; i++) {
      const v1 = verts[i];
      const v2 = verts[(i + 1) % 3];
      // Create consistent key regardless of order
      const key =
        v1[0] < v2[0] || (v1[0] === v2[0] && v1[1] < v2[1])
          ? `${v1[0].toFixed(3)},${v1[1].toFixed(3)}-${v2[0].toFixed(3)},${v2[1].toFixed(3)}`
          : `${v2[0].toFixed(3)},${v2[1].toFixed(3)}-${v1[0].toFixed(3)},${v1[1].toFixed(3)}`;
      edgeMap.set(key, (edgeMap.get(key) || 0) + 1);
      edgeVertices.set(key, [v1, v2]);
    }
  });

  // Build boundary path
  const boundaryEdges: string[] = [];
  edgeMap.forEach((count, key) => {
    if (count === 1) {
      const [v1, v2] = edgeVertices.get(key)!;
      boundaryEdges.push(
        `M ${toSvgX(v1[0]).toFixed(1)},${toSvgY(v1[1]).toFixed(1)} L ${toSvgX(v2[0]).toFixed(1)},${toSvgY(v2[1]).toFixed(1)}`
      );
    }
  });

  // Gate markers as red rectangles - filter to those in bounds
  const gatesInBounds = portals.filter((portal) => {
    const x = portal.position[0];
    const z = portal.position[2];
    return x >= minX && x <= maxX && z >= minZ && z <= maxZ;
  });

  const gateMarkers = gatesInBounds
    .map((portal, index) => {
      const x = toSvgX(portal.position[0]);
      const y = toSvgY(portal.position[2]);
      // Red rectangle - orientation based on direction
      // North/South gates are wide (horizontal), East/West gates are tall (vertical)
      const isHorizontal = portal.direction === 'north' || portal.direction === 'south';
      const rectWidth = isHorizontal ? 48 : 8;
      const rectHeight = isHorizontal ? 8 : 48;

      // Position label based on gate direction
      let labelX = x;
      let labelY = y;
      let anchor = 'middle';
      const labelOffset = 16;

      switch (portal.direction) {
        case 'north':
          labelY = y - labelOffset;
          break;
        case 'south':
          labelY = y + labelOffset + 8;
          break;
        case 'east':
          labelX = x + labelOffset + 4;
          anchor = 'start';
          break;
        case 'west':
          labelX = x - labelOffset - 4;
          anchor = 'end';
          break;
      }

      const rect = `<rect x="${(x - rectWidth / 2).toFixed(1)}" y="${(y - rectHeight / 2).toFixed(1)}" width="${rectWidth}" height="${rectHeight}" fill="#ff4444" stroke="white" stroke-width="1"/>`;
      const label = `<text x="${labelX.toFixed(1)}" y="${labelY.toFixed(1)}" text-anchor="${anchor}" font-size="10" fill="#ffaaaa" font-family="sans-serif">${portal.label}</text>`;

      return rect + '\n' + label;
    })
    .join('\n');

  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgSize} ${svgSize}">
  <rect width="${svgSize}" height="${svgSize}" fill="#1a1a2e"/>
  <path d="${trianglePaths}" fill="#2a2a4e" stroke="none"/>
  <path d="${boundaryEdges.join(' ')}" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"/>
  ${gateMarkers}
</svg>`,
    gatesInBounds: gatesInBounds.length,
  };
}

export default function SvgTab({ config, updateConfig, floorTriangles, mapId }: SvgTabProps) {
  const [exportStatus, setExportStatus] = useState('');

  // Get only included triangles
  const includedTriangles = useMemo(() => {
    return floorTriangles.filter((t) => t.included);
  }, [floorTriangles]);

  // Calculate default center from floor bounds
  const autoBounds = useMemo(() => {
    if (includedTriangles.length === 0) {
      return { centerX: 0, centerZ: 0, gridSize: 40 };
    }

    let minX = Infinity,
      maxX = -Infinity,
      minZ = Infinity,
      maxZ = -Infinity;
    includedTriangles.forEach((tri) => {
      tri.vertices.forEach((v) => {
        minX = Math.min(minX, v.x);
        maxX = Math.max(maxX, v.x);
        minZ = Math.min(minZ, v.z);
        maxZ = Math.max(maxZ, v.z);
      });
    });

    const width = maxX - minX;
    const height = maxZ - minZ;
    // Default grid size to fit the content with some margin
    const gridSize = Math.ceil(Math.max(width, height) * 1.2);

    return {
      centerX: (minX + maxX) / 2,
      centerZ: (minZ + maxZ) / 2,
      gridSize: Math.max(gridSize, 20),
    };
  }, [includedTriangles]);

  // Get current settings from config or use defaults/auto
  const settings = useMemo((): SvgSettings => {
    if (config.svgSettings) {
      return config.svgSettings;
    }
    // If no saved settings, use auto-calculated bounds
    return {
      ...DEFAULT_SVG_SETTINGS,
      gridSize: autoBounds.gridSize,
      centerX: autoBounds.centerX,
      centerZ: autoBounds.centerZ,
    };
  }, [config.svgSettings, autoBounds]);

  // Update a single setting
  const updateSetting = <K extends keyof SvgSettings>(key: K, value: SvgSettings[K]) => {
    updateConfig((prev) => ({
      ...prev,
      svgSettings: {
        ...settings,
        [key]: value,
      },
    }));
  };

  // Reset to auto-calculated bounds
  const handleResetBounds = () => {
    updateConfig((prev) => ({
      ...prev,
      svgSettings: {
        ...settings,
        gridSize: autoBounds.gridSize,
        centerX: autoBounds.centerX,
        centerZ: autoBounds.centerZ,
      },
    }));
  };

  // Generate SVG preview
  const { svg: svgPreview, gatesInBounds } = useMemo(() => {
    return generateSvgMinimap(includedTriangles, config.portals, settings);
  }, [includedTriangles, config.portals, settings]);

  // Export SVG
  const exportSvg = () => {
    const blob = new Blob([svgPreview], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${mapId}_minimap.svg`;
    link.click();
    URL.revokeObjectURL(url);
    setExportStatus(`Exported ${mapId}_minimap.svg`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: 'white' }}>
      <h3 style={{ margin: 0, borderBottom: '1px solid #444', paddingBottom: '8px' }}>
        SVG Minimap
      </h3>

      {/* Grid Size Control */}
      <div style={{ padding: '12px', background: '#1a1a2e', borderRadius: '4px' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#888' }}>View Bounds</h4>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
            Grid Size: {settings.gridSize.toFixed(1)}
          </label>
          <input
            type="range"
            min={10}
            max={200}
            step={1}
            value={settings.gridSize}
            onChange={(e) => updateSetting('gridSize', parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#666' }}>
            <span>10</span>
            <span>200</span>
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
            Center X: {settings.centerX.toFixed(2)}
          </label>
          <input
            type="range"
            min={-100}
            max={100}
            step={0.5}
            value={settings.centerX}
            onChange={(e) => updateSetting('centerX', parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
            Center Z: {settings.centerZ.toFixed(2)}
          </label>
          <input
            type="range"
            min={-100}
            max={100}
            step={0.5}
            value={settings.centerZ}
            onChange={(e) => updateSetting('centerZ', parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <button
          onClick={handleResetBounds}
          style={{
            width: '100%',
            padding: '8px',
            background: '#444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          Reset to Auto Bounds
        </button>
      </div>

      {/* SVG Preview - moved here right under View Bounds */}
      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: '#888' }}>
          Preview:
        </label>
        <div
          style={{
            background: '#1a1a2e',
            borderRadius: '4px',
            padding: '8px',
            display: 'flex',
            justifyContent: 'center',
            maxHeight: '300px',
            overflow: 'auto',
          }}
          dangerouslySetInnerHTML={{ __html: svgPreview }}
        />
      </div>

      {/* SVG Size Controls */}
      <div style={{ padding: '12px', background: '#1a1a2e', borderRadius: '4px' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#888' }}>Output Size</h4>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
            SVG Size: {settings.svgSize}px
          </label>
          <input
            type="range"
            min={200}
            max={1024}
            step={8}
            value={settings.svgSize}
            onChange={(e) => updateSetting('svgSize', parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
            Padding: {settings.padding}px
          </label>
          <input
            type="range"
            min={0}
            max={50}
            step={2}
            value={settings.padding}
            onChange={(e) => updateSetting('padding', parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          padding: '12px',
          background: '#1a1a2e',
          borderRadius: '4px',
          fontSize: '12px',
        }}
      >
        <div>Floor triangles: {includedTriangles.length}</div>
        <div>
          Gates: {gatesInBounds}/{config.portals.length}
          {config.portals.length > 0 && gatesInBounds === 0 && (
            <span style={{ color: '#f88', marginLeft: 8 }}>
              (none in bounds!)
            </span>
          )}
        </div>
        <div>
          Bounds: X[{(settings.centerX - settings.gridSize / 2).toFixed(1)}, {(settings.centerX + settings.gridSize / 2).toFixed(1)}] Z[
          {(settings.centerZ - settings.gridSize / 2).toFixed(1)}, {(settings.centerZ + settings.gridSize / 2).toFixed(1)}]
        </div>
      </div>

      {/* Gate positions debug */}
      {config.portals.length > 0 && (
        <div
          style={{
            padding: '12px',
            background: '#1a1a2e',
            borderRadius: '4px',
            fontSize: '11px',
            color: '#888',
          }}
        >
          <div style={{ marginBottom: '4px', color: '#aaa' }}>Gate positions:</div>
          {config.portals.map((p) => (
            <div key={p.id}>
              {p.label}: X={p.position[0].toFixed(1)}, Z={p.position[2].toFixed(1)}
            </div>
          ))}
        </div>
      )}

      {/* Export Button */}
      <button
        onClick={exportSvg}
        disabled={includedTriangles.length === 0}
        style={{
          padding: '12px',
          background: includedTriangles.length > 0 ? '#4a9eff' : '#333',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: includedTriangles.length > 0 ? 'pointer' : 'not-allowed',
          fontWeight: 'bold',
          fontSize: '14px',
        }}
      >
        Export SVG Minimap
      </button>

      {/* Status */}
      {exportStatus && (
        <div
          style={{
            padding: '8px 12px',
            background: '#1a1a2e',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#8f8',
          }}
        >
          {exportStatus}
        </div>
      )}

      {/* Legend */}
      <div style={{ fontSize: '11px', color: '#666', marginTop: '8px' }}>
        <p style={{ margin: '4px 0' }}>
          <span style={{ display: 'inline-block', width: 12, height: 8, background: '#ff4444', marginRight: 6 }}></span>
          Gate positions (red rectangles)
        </p>
        <p style={{ margin: '4px 0' }}>
          <span style={{ display: 'inline-block', width: 12, height: 2, background: 'white', marginRight: 6 }}></span>
          Floor boundary (white outline)
        </p>
        <p style={{ margin: '4px 0', fontStyle: 'italic' }}>
          Settings are auto-saved to localStorage
        </p>
      </div>
    </div>
  );
}
