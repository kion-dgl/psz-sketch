import { useState } from 'react';
import ActionPalette from './ActionPalette';

const TECHNIQUE_ICONS = [
  { name: 'Foie', path: '/icons/palette/foie.svg' },
  { name: 'Gifoie', path: '/icons/palette/gifoie.svg' },
  { name: 'Rafoie', path: '/icons/palette/rafoie.svg' },
  { name: 'Barta', path: '/icons/palette/barta.svg' },
  { name: 'Gibarta', path: '/icons/palette/gibarta.svg' },
  { name: 'Rabarta', path: '/icons/palette/rabarta.svg' },
  { name: 'Zonde', path: '/icons/palette/zonde.svg' },
  { name: 'Gizonde', path: '/icons/palette/gizonde.svg' },
  { name: 'Razonde', path: '/icons/palette/razonde.svg' },
  { name: 'Resta', path: '/icons/palette/resta.svg' },
  { name: 'Anti', path: '/icons/palette/anti.svg' },
  { name: 'Reverser', path: '/icons/palette/reverser.svg' },
  { name: 'Shifta', path: '/icons/palette/shifta.svg' },
  { name: 'Deband', path: '/icons/palette/deband.svg' },
  { name: 'Jellen', path: '/icons/palette/jellen.svg' },
  { name: 'Zalure', path: '/icons/palette/zalure.svg' },
  { name: 'Megid', path: '/icons/palette/megid.svg' },
  { name: 'Grants', path: '/icons/palette/grants.svg' },
  { name: 'Ryuker', path: '/icons/palette/ryuker.svg' },
];

const EQUIPMENT_ICONS = [
  { name: 'Rod', path: '/icons/equipment/rod.svg' },
  { name: 'Barrier', path: '/icons/equipment/barrier.svg' },
  { name: 'Unit', path: '/icons/equipment/unit.svg' },
];

const BORDER_COLORS = ['green', 'purple', 'red', 'blue', 'yellow', 'cyan', 'white'];

export default function ActionPaletteStorybook() {
  const [slot1Icon, setSlot1Icon] = useState('/icons/palette/foie.svg');
  const [slot1Border, setSlot1Border] = useState('green');
  const [slot1IconColor, setSlot1IconColor] = useState('default');

  const [slot2Icon, setSlot2Icon] = useState('/icons/equipment/rod.svg');
  const [slot2Border, setSlot2Border] = useState('purple');
  const [slot2IconColor, setSlot2IconColor] = useState('white');

  const [slot3Icon, setSlot3Icon] = useState('/icons/palette/gifoie.svg');
  const [slot3Border, setSlot3Border] = useState('red');
  const [slot3IconColor, setSlot3IconColor] = useState('default');

  const [trigger, setTrigger] = useState<'L' | 'R'>('R');

  const allIcons = [...TECHNIQUE_ICONS, ...EQUIPMENT_ICONS];

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Action Palette</h1>

      {/* Preview Area */}
      <div style={styles.previewArea}>
        <div style={styles.previewBg}>
          <ActionPalette
            slots={[
              { icon: slot1Icon, borderColor: slot1Border, iconColor: slot1IconColor === 'white' ? 'white' : undefined },
              { icon: slot2Icon, borderColor: slot2Border, iconColor: slot2IconColor === 'white' ? 'white' : undefined },
              { icon: slot3Icon, borderColor: slot3Border, iconColor: slot3IconColor === 'white' ? 'white' : undefined },
            ]}
            trigger={trigger}
          />
        </div>
      </div>

      {/* Controls */}
      <div style={styles.controls}>
        {/* Trigger */}
        <div style={styles.controlGroup}>
          <label style={styles.label}>Trigger Button</label>
          <div style={styles.buttonGroup}>
            <button
              style={{ ...styles.toggleButton, ...(trigger === 'L' ? styles.toggleActive : {}) }}
              onClick={() => setTrigger('L')}
            >
              L
            </button>
            <button
              style={{ ...styles.toggleButton, ...(trigger === 'R' ? styles.toggleActive : {}) }}
              onClick={() => setTrigger('R')}
            >
              R
            </button>
          </div>
        </div>

        {/* Slot 1 */}
        <div style={styles.slotControls}>
          <h3 style={styles.slotTitle}>Slot 1</h3>
          <div style={styles.controlGroup}>
            <label style={styles.label}>Icon</label>
            <select
              value={slot1Icon}
              onChange={(e) => setSlot1Icon(e.target.value)}
              style={styles.select}
            >
              <optgroup label="Techniques">
                {TECHNIQUE_ICONS.map((icon) => (
                  <option key={icon.path} value={icon.path}>{icon.name}</option>
                ))}
              </optgroup>
              <optgroup label="Equipment">
                {EQUIPMENT_ICONS.map((icon) => (
                  <option key={icon.path} value={icon.path}>{icon.name}</option>
                ))}
              </optgroup>
            </select>
          </div>
          <div style={styles.controlGroup}>
            <label style={styles.label}>Border Color</label>
            <select
              value={slot1Border}
              onChange={(e) => setSlot1Border(e.target.value)}
              style={styles.select}
            >
              {BORDER_COLORS.map((color) => (
                <option key={color} value={color}>{color}</option>
              ))}
            </select>
          </div>
          <div style={styles.controlGroup}>
            <label style={styles.label}>Icon Color</label>
            <select
              value={slot1IconColor}
              onChange={(e) => setSlot1IconColor(e.target.value)}
              style={styles.select}
            >
              <option value="default">Default</option>
              <option value="white">White</option>
            </select>
          </div>
        </div>

        {/* Slot 2 */}
        <div style={styles.slotControls}>
          <h3 style={styles.slotTitle}>Slot 2</h3>
          <div style={styles.controlGroup}>
            <label style={styles.label}>Icon</label>
            <select
              value={slot2Icon}
              onChange={(e) => setSlot2Icon(e.target.value)}
              style={styles.select}
            >
              <optgroup label="Techniques">
                {TECHNIQUE_ICONS.map((icon) => (
                  <option key={icon.path} value={icon.path}>{icon.name}</option>
                ))}
              </optgroup>
              <optgroup label="Equipment">
                {EQUIPMENT_ICONS.map((icon) => (
                  <option key={icon.path} value={icon.path}>{icon.name}</option>
                ))}
              </optgroup>
            </select>
          </div>
          <div style={styles.controlGroup}>
            <label style={styles.label}>Border Color</label>
            <select
              value={slot2Border}
              onChange={(e) => setSlot2Border(e.target.value)}
              style={styles.select}
            >
              {BORDER_COLORS.map((color) => (
                <option key={color} value={color}>{color}</option>
              ))}
            </select>
          </div>
          <div style={styles.controlGroup}>
            <label style={styles.label}>Icon Color</label>
            <select
              value={slot2IconColor}
              onChange={(e) => setSlot2IconColor(e.target.value)}
              style={styles.select}
            >
              <option value="default">Default</option>
              <option value="white">White</option>
            </select>
          </div>
        </div>

        {/* Slot 3 */}
        <div style={styles.slotControls}>
          <h3 style={styles.slotTitle}>Slot 3</h3>
          <div style={styles.controlGroup}>
            <label style={styles.label}>Icon</label>
            <select
              value={slot3Icon}
              onChange={(e) => setSlot3Icon(e.target.value)}
              style={styles.select}
            >
              <optgroup label="Techniques">
                {TECHNIQUE_ICONS.map((icon) => (
                  <option key={icon.path} value={icon.path}>{icon.name}</option>
                ))}
              </optgroup>
              <optgroup label="Equipment">
                {EQUIPMENT_ICONS.map((icon) => (
                  <option key={icon.path} value={icon.path}>{icon.name}</option>
                ))}
              </optgroup>
            </select>
          </div>
          <div style={styles.controlGroup}>
            <label style={styles.label}>Border Color</label>
            <select
              value={slot3Border}
              onChange={(e) => setSlot3Border(e.target.value)}
              style={styles.select}
            >
              {BORDER_COLORS.map((color) => (
                <option key={color} value={color}>{color}</option>
              ))}
            </select>
          </div>
          <div style={styles.controlGroup}>
            <label style={styles.label}>Icon Color</label>
            <select
              value={slot3IconColor}
              onChange={(e) => setSlot3IconColor(e.target.value)}
              style={styles.select}
            >
              <option value="default">Default</option>
              <option value="white">White</option>
            </select>
          </div>
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
  controlGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontSize: '12px',
    color: '#aaa',
  },
  select: {
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #444',
    background: '#1a1a2e',
    color: '#fff',
    fontSize: '14px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px',
  },
  toggleButton: {
    padding: '8px 16px',
    background: '#3a3a5a',
    border: 'none',
    borderRadius: '4px',
    color: '#888',
    cursor: 'pointer',
    fontSize: '14px',
  },
  toggleActive: {
    background: '#6b8afd',
    color: '#fff',
  },
  slotControls: {
    background: '#1a1a2e',
    padding: '12px',
    borderRadius: '6px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  slotTitle: {
    fontSize: '14px',
    margin: 0,
    color: '#6b8afd',
  },
};
