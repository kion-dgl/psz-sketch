import { useMemo } from 'react';

interface HUDProps {
  name: string;
  level: number;
  currentHP: number;
  maxHP: number;
  currentPP: number;
  maxPP: number;
  photonBlastGauge: number; // 0-100
  leader?: boolean;
}

export default function HUD({
  name,
  level,
  currentHP,
  maxHP,
  currentPP,
  maxPP,
  photonBlastGauge,
  leader = false,
}: HUDProps) {
  const hpPercent = useMemo(() => Math.min(100, (currentHP / maxHP) * 100), [currentHP, maxHP]);
  const ppPercent = useMemo(() => Math.min(100, (currentPP / maxPP) * 100), [currentPP, maxPP]);
  const pbPercent = useMemo(() => Math.min(100, Math.max(0, photonBlastGauge)), [photonBlastGauge]);

  return (
    <div style={styles.container}>
      {/* Photon Blast Gauge */}
      <div style={styles.pbGauge}>
        <div style={styles.pbOuter}>
          <div style={styles.pbInner}>
            <div
              style={{
                ...styles.pbFill,
                background: pbPercent >= 100
                  ? 'radial-gradient(circle, #ff6b6b 0%, #c0392b 50%, #8b0000 100%)'
                  : 'radial-gradient(circle, #e74c3c 0%, #922b21 50%, #641e16 100%)',
                boxShadow: pbPercent >= 100 ? '0 0 10px #ff0000, 0 0 20px #ff0000' : 'none',
              }}
            />
          </div>
        </div>
      </div>

      {/* Stats Panel */}
      <div style={styles.statsPanel}>
        {/* Name and Level Row */}
        <div style={styles.levelRow}>
          {leader && <span style={styles.leaderStar}>★</span>}
          <span style={styles.name}>{name}</span>
          <span style={styles.lvLabel}>Lv</span>
          <span style={styles.lvValue}>{level}</span>
        </div>

        {/* HP Row */}
        <div style={styles.statRow}>
          <span style={styles.hpLabel}>HP</span>
          <span style={styles.statValues}>
            <span style={styles.currentValue}>{currentHP}</span>
            <span style={styles.separator}>/</span>
            <span style={styles.maxValue}>{maxHP}</span>
          </span>
        </div>
        <div style={styles.barContainer}>
          <div style={{ ...styles.hpBar, width: `${hpPercent}%` }} />
        </div>

        {/* PP Row */}
        <div style={styles.statRow}>
          <span style={styles.ppLabel}>PP</span>
          <span style={styles.statValues}>
            <span style={styles.currentValue}>{currentPP}</span>
            <span style={styles.separator}>/</span>
            <span style={styles.maxValue}>{maxPP}</span>
          </span>
        </div>
        <div style={styles.barContainer}>
          <div style={{ ...styles.ppBar, width: `${ppPercent}%` }} />
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: 'linear-gradient(180deg, #a8d4f0 0%, #7eb8e0 20%, #5a9fd4 80%, #4a8bc4 100%)',
    border: '3px solid #2c5a7c',
    borderRadius: '12px',
    padding: '8px 12px 8px 8px',
    fontFamily: '"Press Start 2P", "Courier New", monospace',
    fontSize: '10px',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.2)',
    imageRendering: 'pixelated',
  },
  pbGauge: {
    width: '48px',
    height: '48px',
    flexShrink: 0,
  },
  pbOuter: {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #4a4a4a 0%, #2a2a2a 50%, #1a1a1a 100%)',
    borderRadius: '4px',
    padding: '4px',
    clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
  },
  pbInner: {
    width: '100%',
    height: '100%',
    background: '#1a1a1a',
    borderRadius: '2px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
  },
  pbFill: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    transition: 'all 0.3s ease',
  },
  statsPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: '140px',
  },
  levelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '2px',
  },
  leaderStar: {
    color: '#f1c40f',
    fontSize: '12px',
    textShadow: '1px 1px 0 #7f6a00',
  },
  name: {
    color: '#f5f5dc',
    textShadow: '1px 1px 0 #555',
    marginRight: 'auto',
  },
  lvLabel: {
    color: '#f5f5dc',
    textShadow: '1px 1px 0 #555',
  },
  lvValue: {
    color: '#f5f5dc',
    textShadow: '1px 1px 0 #555',
    marginLeft: '8px',
  },
  statRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hpLabel: {
    color: '#2ecc71',
    textShadow: '1px 1px 0 #1a5a2a',
    fontWeight: 'bold',
  },
  ppLabel: {
    color: '#3498db',
    textShadow: '1px 1px 0 #1a3a5a',
    fontWeight: 'bold',
  },
  statValues: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
  },
  currentValue: {
    color: '#f5f5dc',
    textShadow: '1px 1px 0 #555',
  },
  separator: {
    color: '#aaa',
  },
  maxValue: {
    color: '#ddd',
    textShadow: '1px 1px 0 #555',
  },
  barContainer: {
    width: '100%',
    height: '8px',
    background: '#1a3a5a',
    borderRadius: '2px',
    overflow: 'hidden',
    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)',
  },
  hpBar: {
    height: '100%',
    background: 'linear-gradient(180deg, #58d68d 0%, #2ecc71 50%, #27ae60 100%)',
    borderRadius: '2px',
    transition: 'width 0.3s ease',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
  },
  ppBar: {
    height: '100%',
    background: 'linear-gradient(180deg, #5dade2 0%, #3498db 50%, #2980b9 100%)',
    borderRadius: '2px',
    transition: 'width 0.3s ease',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
  },
};
