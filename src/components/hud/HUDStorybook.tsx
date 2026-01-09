import { useState } from 'react';
import HUD from './HUD';

export default function HUDStorybook() {
  const [name, setName] = useState('Sarisa');
  const [level, setLevel] = useState(1);
  const [maxHP, setMaxHP] = useState(100);
  const [currentHP, setCurrentHP] = useState(100);
  const [maxPP, setMaxPP] = useState(80);
  const [currentPP, setCurrentPP] = useState(80);
  const [photonBlastGauge, setPhotonBlastGauge] = useState(0);
  const [leader, setLeader] = useState(true);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>HUD Component</h1>

      {/* Preview Area */}
      <div style={styles.previewArea}>
        <div style={styles.previewBg}>
          <HUD
            name={name}
            level={level}
            currentHP={currentHP}
            maxHP={maxHP}
            currentPP={currentPP}
            maxPP={maxPP}
            photonBlastGauge={photonBlastGauge}
            leader={leader}
          />
        </div>
      </div>

      {/* Controls */}
      <div style={styles.controls}>
        <div style={styles.controlGroup}>
          <label style={styles.label}>
            Name:
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
            />
          </label>
        </div>

        <div style={styles.controlGroup}>
          <label style={styles.label}>
            Level: {level}
            <input
              type="range"
              min="1"
              max="100"
              value={level}
              onChange={(e) => setLevel(Number(e.target.value))}
              style={styles.slider}
            />
          </label>
        </div>

        <div style={styles.controlGroup}>
          <label style={styles.label}>
            Max HP: {maxHP}
            <input
              type="range"
              min="10"
              max="1000"
              value={maxHP}
              onChange={(e) => {
                const val = Number(e.target.value);
                setMaxHP(val);
                if (currentHP > val) setCurrentHP(val);
              }}
              style={styles.slider}
            />
          </label>
        </div>

        <div style={styles.controlGroup}>
          <label style={styles.label}>
            Current HP: {currentHP}
            <input
              type="range"
              min="0"
              max={maxHP}
              value={currentHP}
              onChange={(e) => setCurrentHP(Number(e.target.value))}
              style={styles.slider}
            />
          </label>
        </div>

        <div style={styles.controlGroup}>
          <label style={styles.label}>
            Max PP: {maxPP}
            <input
              type="range"
              min="10"
              max="1000"
              value={maxPP}
              onChange={(e) => {
                const val = Number(e.target.value);
                setMaxPP(val);
                if (currentPP > val) setCurrentPP(val);
              }}
              style={styles.slider}
            />
          </label>
        </div>

        <div style={styles.controlGroup}>
          <label style={styles.label}>
            Current PP: {currentPP}
            <input
              type="range"
              min="0"
              max={maxPP}
              value={currentPP}
              onChange={(e) => setCurrentPP(Number(e.target.value))}
              style={styles.slider}
            />
          </label>
        </div>

        <div style={styles.controlGroup}>
          <label style={styles.label}>
            Photon Blast: {photonBlastGauge}%
            <input
              type="range"
              min="0"
              max="100"
              value={photonBlastGauge}
              onChange={(e) => setPhotonBlastGauge(Number(e.target.value))}
              style={styles.slider}
            />
          </label>
        </div>

        <div style={styles.controlGroup}>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={leader}
              onChange={(e) => setLeader(e.target.checked)}
              style={styles.checkbox}
            />
            Party Leader
          </label>
        </div>

        {/* Quick Presets */}
        <div style={styles.presets}>
          <button
            style={styles.presetButton}
            onClick={() => {
              setCurrentHP(maxHP);
              setCurrentPP(maxPP);
            }}
          >
            Full Health
          </button>
          <button
            style={styles.presetButton}
            onClick={() => {
              setCurrentHP(Math.floor(maxHP * 0.25));
              setCurrentPP(Math.floor(maxPP * 0.1));
            }}
          >
            Low Health
          </button>
          <button
            style={styles.presetButton}
            onClick={() => setPhotonBlastGauge(100)}
          >
            PB Ready
          </button>
          <button
            style={styles.presetButton}
            onClick={() => {
              setLevel(100);
              setMaxHP(800);
              setCurrentHP(800);
              setMaxPP(500);
              setCurrentPP(500);
            }}
          >
            High Level
          </button>
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
    maxWidth: '500px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    background: '#2d2d44',
    padding: '20px',
    borderRadius: '8px',
  },
  controlGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '14px',
    color: '#aaa',
  },
  input: {
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #444',
    background: '#1a1a2e',
    color: '#fff',
    fontSize: '14px',
  },
  slider: {
    width: '100%',
    cursor: 'pointer',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#aaa',
    cursor: 'pointer',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
  presets: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginTop: '10px',
  },
  presetButton: {
    padding: '8px 16px',
    background: '#4a4a6a',
    border: 'none',
    borderRadius: '4px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'background 0.2s',
  },
};
