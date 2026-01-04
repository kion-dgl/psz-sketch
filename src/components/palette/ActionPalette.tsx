interface PaletteSlot {
  icon: string | null; // URL to icon SVG
  borderColor: string; // green, purple, red, etc.
  iconColor?: string; // override icon color (default based on border)
}

interface ActionPaletteProps {
  slots: [PaletteSlot, PaletteSlot, PaletteSlot, PaletteSlot, PaletteSlot, PaletteSlot];
  triggerHeld?: boolean; // When true, show slots 4-6 instead of 1-3
}

const BORDER_COLORS: Record<string, string> = {
  green: '#4ade80',
  purple: '#a855f7',
  red: '#ef4444',
  blue: '#3b82f6',
  yellow: '#eab308',
  cyan: '#06b6d4',
  white: '#ffffff',
};

export default function ActionPalette({ slots, triggerHeld = false }: ActionPaletteProps) {
  // Show slots 0-2 normally, slots 3-5 when R is held
  const visibleSlots = triggerHeld ? slots.slice(3, 6) : slots.slice(0, 3);

  return (
    <div style={styles.container}>
      <div style={styles.slotsContainer}>
        {visibleSlots.map((slot, index) => (
          <div
            key={index}
            style={{
              ...styles.slot,
              borderColor: BORDER_COLORS[slot.borderColor] || slot.borderColor,
              boxShadow: `0 0 8px ${BORDER_COLORS[slot.borderColor] || slot.borderColor}40`,
            }}
          >
            <div style={styles.slotInner}>
              {slot.icon && (
                <img
                  src={slot.icon}
                  alt=""
                  style={{
                    ...styles.icon,
                    filter: slot.iconColor === 'white'
                      ? 'brightness(0) invert(1)'
                      : undefined,
                  }}
                />
              )}
            </div>
          </div>
        ))}
      </div>
      <div style={{
        ...styles.trigger,
        ...(triggerHeld ? styles.triggerActive : {}),
      }}>R</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'linear-gradient(180deg, #a8d4f0 0%, #7eb8e0 20%, #5a9fd4 80%, #4a8bc4 100%)',
    border: '3px solid #2c5a7c',
    borderRadius: '12px',
    padding: '12px 16px',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.2)',
  },
  slotsContainer: {
    display: 'flex',
    gap: '12px',
  },
  slot: {
    width: '56px',
    height: '56px',
    borderWidth: '3px',
    borderStyle: 'solid',
    borderRadius: '8px',
    clipPath: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.1s ease',
  },
  slotInner: {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #2a2a3a 0%, #1a1a2a 50%, #0f0f1a 100%)',
    clipPath: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
  },
  icon: {
    width: '42px',
    height: '42px',
    objectFit: 'contain',
  },
  trigger: {
    fontFamily: '"Press Start 2P", "Courier New", monospace',
    fontSize: '14px',
    color: '#2c5a7c',
    textShadow: '1px 1px 0 rgba(255,255,255,0.5)',
    marginLeft: '4px',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'all 0.15s ease',
  },
  triggerActive: {
    background: '#2c5a7c',
    color: '#fff',
    textShadow: 'none',
  },
};
