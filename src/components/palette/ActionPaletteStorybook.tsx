import { useState } from 'react';
import ActionPalette from './ActionPalette';

const ACTION_ICONS = [
  { name: 'Attack', path: '/icons/palette/attack.svg' },
  { name: 'Heavy Attack', path: '/icons/palette/heavy-attack.svg' },
  { name: 'Evade', path: '/icons/palette/evade.svg' },
];

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

interface SlotConfig {
  icon: string;
  border: string;
  iconColor: string;
}

const DEFAULT_SLOTS: SlotConfig[] = [
  // Default slots (1-3)
  { icon: '/icons/palette/attack.svg', border: 'green', iconColor: 'default' },
  { icon: '/icons/equipment/rod.svg', border: 'purple', iconColor: 'white' },
  { icon: '/icons/palette/foie.svg', border: 'red', iconColor: 'default' },
  // R-held slots (4-6)
  { icon: '/icons/palette/resta.svg', border: 'cyan', iconColor: 'default' },
  { icon: '/icons/palette/evade.svg', border: 'blue', iconColor: 'default' },
  { icon: '/icons/palette/gifoie.svg', border: 'yellow', iconColor: 'default' },
];

export default function ActionPaletteStorybook() {
  const [slots, setSlots] = useState<SlotConfig[]>(DEFAULT_SLOTS);
  const [triggerHeld, setTriggerHeld] = useState(false);

  const updateSlot = (index: number, field: keyof SlotConfig, value: string) => {
    setSlots(prev => prev.map((slot, i) =>
      i === index ? { ...slot, [field]: value } : slot
    ));
  };

  const renderIconSelect = (slotIndex: number) => (
    <select
      value={slots[slotIndex].icon}
      onChange={(e) => updateSlot(slotIndex, 'icon', e.target.value)}
      style={styles.select}
    >
      <optgroup label="Actions">
        {ACTION_ICONS.map((icon) => (
          <option key={icon.path} value={icon.path}>{icon.name}</option>
        ))}
      </optgroup>
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
  );

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Action Palette</h1>

      {/* Preview Area */}
      <div style={styles.previewArea}>
        <div style={styles.previewBg}>
          <ActionPalette
            slots={slots.map(s => ({
              icon: s.icon,
              borderColor: s.border,
              iconColor: s.iconColor === 'white' ? 'white' : undefined,
            })) as any}
            triggerHeld={triggerHeld}
          />
        </div>
      </div>

      {/* Controls */}
      <div style={styles.controls}>
        {/* R Trigger Toggle */}
        <div style={styles.controlGroup}>
          <label style={styles.label}>Hold R Trigger</label>
          <button
            style={{
              ...styles.toggleButton,
              ...(triggerHeld ? styles.toggleActive : {}),
            }}
            onMouseDown={() => setTriggerHeld(true)}
            onMouseUp={() => setTriggerHeld(false)}
            onMouseLeave={() => setTriggerHeld(false)}
          >
            Hold R
          </button>
          <span style={styles.hint}>
            (hold to see slots 4-6)
          </span>
        </div>

        {/* Default Slots Header */}
        <h3 style={styles.sectionTitle}>Default Slots (1-3)</h3>

        <div style={styles.slotsGrid}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={styles.slotControls}>
              <h4 style={styles.slotTitle}>Slot {i + 1}</h4>
              <div style={styles.controlGroup}>
                <label style={styles.label}>Icon</label>
                {renderIconSelect(i)}
              </div>
              <div style={styles.controlGroup}>
                <label style={styles.label}>Border</label>
                <select
                  value={slots[i].border}
                  onChange={(e) => updateSlot(i, 'border', e.target.value)}
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
                  value={slots[i].iconColor}
                  onChange={(e) => updateSlot(i, 'iconColor', e.target.value)}
                  style={styles.select}
                >
                  <option value="default">Default</option>
                  <option value="white">White</option>
                </select>
              </div>
            </div>
          ))}
        </div>

        {/* R-Held Slots Header */}
        <h3 style={styles.sectionTitle}>R-Held Slots (4-6)</h3>

        <div style={styles.slotsGrid}>
          {[3, 4, 5].map((i) => (
            <div key={i} style={styles.slotControls}>
              <h4 style={styles.slotTitle}>Slot {i + 1}</h4>
              <div style={styles.controlGroup}>
                <label style={styles.label}>Icon</label>
                {renderIconSelect(i)}
              </div>
              <div style={styles.controlGroup}>
                <label style={styles.label}>Border</label>
                <select
                  value={slots[i].border}
                  onChange={(e) => updateSlot(i, 'border', e.target.value)}
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
                  value={slots[i].iconColor}
                  onChange={(e) => updateSlot(i, 'iconColor', e.target.value)}
                  style={styles.select}
                >
                  <option value="default">Default</option>
                  <option value="white">White</option>
                </select>
              </div>
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
    maxWidth: '700px',
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
    fontSize: '11px',
    color: '#888',
  },
  select: {
    padding: '6px',
    borderRadius: '4px',
    border: '1px solid #444',
    background: '#1a1a2e',
    color: '#fff',
    fontSize: '12px',
  },
  toggleButton: {
    padding: '10px 20px',
    background: '#3a3a5a',
    border: 'none',
    borderRadius: '4px',
    color: '#888',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.15s ease',
  },
  toggleActive: {
    background: '#6b8afd',
    color: '#fff',
  },
  hint: {
    fontSize: '11px',
    color: '#666',
    marginTop: '4px',
  },
  sectionTitle: {
    fontSize: '14px',
    color: '#6b8afd',
    margin: '16px 0 8px 0',
    borderBottom: '1px solid #3a3a5a',
    paddingBottom: '8px',
  },
  slotsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
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
    fontSize: '12px',
    margin: 0,
    color: '#aaa',
  },
};
