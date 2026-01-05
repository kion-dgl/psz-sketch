import { useState } from 'react';

interface PaletteMenuProps {
  onBack: () => void;
}

interface PaletteAction {
  id: string;
  name: string;
  icon: string;
  type: 'action' | 'technique' | 'item';
}

// Available actions to assign
const AVAILABLE_ACTIONS: PaletteAction[] = [
  { id: 'attack', name: 'Attack', icon: '⚔', type: 'action' },
  { id: 'heavy', name: 'Heavy Attack', icon: '🗡', type: 'action' },
  { id: 'evade', name: 'Evade', icon: '💨', type: 'action' },
  { id: 'foie', name: 'Foie', icon: '🔥', type: 'technique' },
  { id: 'barta', name: 'Barta', icon: '❄', type: 'technique' },
  { id: 'zonde', name: 'Zonde', icon: '⚡', type: 'technique' },
  { id: 'resta', name: 'Resta', icon: '💚', type: 'technique' },
  { id: 'anti', name: 'Anti', icon: '✨', type: 'technique' },
  { id: 'shifta', name: 'Shifta', icon: '⬆', type: 'technique' },
  { id: 'deband', name: 'Deband', icon: '🛡', type: 'technique' },
  { id: 'monomate', name: 'Monomate', icon: '💊', type: 'item' },
  { id: 'monofluid', name: 'Monofluid', icon: '💧', type: 'item' },
];

// Default palette configuration
const DEFAULT_PALETTE: (string | null)[] = [
  'attack', 'heavy', 'foie',  // Normal slots 1-3
  'resta', 'evade', 'barta', // R-held slots 4-6
];

export default function PaletteMenu({ onBack }: PaletteMenuProps) {
  const [palette, setPalette] = useState<(string | null)[]>(DEFAULT_PALETTE);
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [isSelectingAction, setIsSelectingAction] = useState(false);
  const [actionSelectIndex, setActionSelectIndex] = useState(0);

  const getActionById = (id: string | null): PaletteAction | null => {
    if (!id) return null;
    return AVAILABLE_ACTIONS.find(a => a.id === id) || null;
  };

  const handleSlotClick = (index: number) => {
    setSelectedSlot(index);
    setIsSelectingAction(true);
    setActionSelectIndex(0);
  };

  const handleActionSelect = (action: PaletteAction | null) => {
    const newPalette = [...palette];
    newPalette[selectedSlot] = action?.id || null;
    setPalette(newPalette);
    setIsSelectingAction(false);
  };

  const handleClearSlot = () => {
    const newPalette = [...palette];
    newPalette[selectedSlot] = null;
    setPalette(newPalette);
    setIsSelectingAction(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.panel}>
        <div style={styles.header}>
          <span style={styles.headerText}>Action Palette</span>
        </div>

        {!isSelectingAction ? (
          // Palette slot view
          <div style={styles.content}>
            <div style={styles.sectionLabel}>Normal (Slots 1-3)</div>
            <div style={styles.slotRow}>
              {[0, 1, 2].map((index) => {
                const action = getActionById(palette[index]);
                return (
                  <button
                    key={index}
                    onClick={() => handleSlotClick(index)}
                    style={{
                      ...styles.slot,
                      ...(selectedSlot === index && !isSelectingAction ? styles.slotSelected : {}),
                    }}
                  >
                    <span style={styles.slotNumber}>{index + 1}</span>
                    <span style={styles.slotIcon}>{action?.icon || '—'}</span>
                    <span style={styles.slotName}>{action?.name || 'Empty'}</span>
                  </button>
                );
              })}
            </div>

            <div style={styles.sectionLabel}>R-Held (Slots 4-6)</div>
            <div style={styles.slotRow}>
              {[3, 4, 5].map((index) => {
                const action = getActionById(palette[index]);
                return (
                  <button
                    key={index}
                    onClick={() => handleSlotClick(index)}
                    style={{
                      ...styles.slot,
                      ...(selectedSlot === index && !isSelectingAction ? styles.slotSelected : {}),
                    }}
                  >
                    <span style={styles.slotNumber}>{index + 1}</span>
                    <span style={styles.slotIcon}>{action?.icon || '—'}</span>
                    <span style={styles.slotName}>{action?.name || 'Empty'}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          // Action selection view
          <div style={styles.content}>
            <div style={styles.sectionLabel}>
              Select action for Slot {selectedSlot + 1}
            </div>
            <div style={styles.actionList}>
              <button
                onClick={handleClearSlot}
                onMouseEnter={() => setActionSelectIndex(-1)}
                style={{
                  ...styles.actionItem,
                  ...(actionSelectIndex === -1 ? styles.actionItemSelected : {}),
                }}
              >
                <span style={styles.actionIcon}>✕</span>
                <span style={styles.actionName}>Clear Slot</span>
              </button>
              {AVAILABLE_ACTIONS.map((action, index) => (
                <button
                  key={action.id}
                  onClick={() => handleActionSelect(action)}
                  onMouseEnter={() => setActionSelectIndex(index)}
                  style={{
                    ...styles.actionItem,
                    ...(actionSelectIndex === index ? styles.actionItemSelected : {}),
                  }}
                >
                  <span style={styles.actionIcon}>{action.icon}</span>
                  <span style={styles.actionName}>{action.name}</span>
                  <span style={styles.actionType}>{action.type}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setIsSelectingAction(false)}
              style={styles.cancelButton}
            >
              Cancel
            </button>
          </div>
        )}

        <div style={styles.footer}>
          <span style={styles.footerHint}>
            <span style={styles.buttonHint}>A</span> Select
          </span>
          <span style={styles.footerHint}>
            <span style={styles.buttonHint}>B</span> Back
          </span>
        </div>
      </div>

      <button onClick={onBack} style={styles.backButton}>← Back</button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
  },
  panel: {
    width: '320px',
    background: 'linear-gradient(180deg, #7cb8d8 0%, #5a9cc8 100%)',
    border: '3px solid #2a5a7a',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  header: {
    background: 'linear-gradient(180deg, #4a8ab8 0%, #3a7aa8 100%)',
    padding: '8px 12px',
    borderBottom: '2px solid #2a5a7a',
    textAlign: 'center',
  },
  headerText: {
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 'bold',
    textShadow: '1px 1px 0 #2a5a7a',
  },
  content: {
    padding: '12px',
  },
  sectionLabel: {
    color: '#1a3a5a',
    fontSize: '11px',
    fontWeight: 'bold',
    marginBottom: '8px',
    marginTop: '8px',
  },
  slotRow: {
    display: 'flex',
    gap: '8px',
  },
  slot: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    padding: '8px',
    background: 'linear-gradient(180deg, #5a9cc8 0%, #4a8cb8 100%)',
    border: '2px solid #3a7aa8',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.1s ease',
  },
  slotSelected: {
    background: '#f0a020',
    borderColor: '#c08010',
  },
  slotNumber: {
    fontSize: '10px',
    color: '#ffffff',
    background: '#2a5a7a',
    padding: '2px 6px',
    borderRadius: '3px',
  },
  slotIcon: {
    fontSize: '20px',
  },
  slotName: {
    fontSize: '10px',
    color: '#1a3a5a',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  actionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    maxHeight: '200px',
    overflowY: 'auto',
  },
  actionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 8px',
    background: 'transparent',
    border: 'none',
    borderRadius: '4px',
    color: '#1a3a5a',
    fontSize: '12px',
    textAlign: 'left',
    cursor: 'pointer',
  },
  actionItemSelected: {
    background: '#f0a020',
    color: '#1a1a1a',
  },
  actionIcon: {
    width: '24px',
    textAlign: 'center',
    fontSize: '14px',
  },
  actionName: {
    flex: 1,
    fontWeight: 'bold',
  },
  actionType: {
    fontSize: '10px',
    color: '#6a8a9a',
    textTransform: 'capitalize',
  },
  cancelButton: {
    marginTop: '8px',
    padding: '6px 12px',
    background: '#3a7aa8',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '11px',
    cursor: 'pointer',
    width: '100%',
  },
  footer: {
    display: 'flex',
    gap: '16px',
    padding: '8px 12px',
    background: 'linear-gradient(180deg, #4a8ab8 0%, #3a7aa8 100%)',
    borderTop: '2px solid #2a5a7a',
  },
  footerHint: {
    fontSize: '11px',
    color: '#ffffff',
  },
  buttonHint: {
    display: 'inline-block',
    background: '#2a5a7a',
    color: '#ffffff',
    padding: '2px 6px',
    borderRadius: '3px',
    marginRight: '4px',
    fontSize: '10px',
    fontWeight: 'bold',
  },
  backButton: {
    position: 'absolute',
    top: '-30px',
    left: '0',
    padding: '4px 12px',
    background: '#2a5a7a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '11px',
    cursor: 'pointer',
  },
};
