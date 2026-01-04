import { useState } from 'react';
import HUDStorybook from '../hud/HUDStorybook';

type UIComponent = 'hud' | 'action-palette' | 'minimap' | 'item-tooltip' | 'main-menu' | 'stats' | 'shops';

const UI_COMPONENTS: { id: UIComponent; label: string; available: boolean }[] = [
  { id: 'hud', label: 'HUD', available: true },
  { id: 'action-palette', label: 'Action Palette', available: false },
  { id: 'minimap', label: 'Minimap', available: false },
  { id: 'item-tooltip', label: 'Item Tooltip', available: false },
  { id: 'main-menu', label: 'Main Menu', available: false },
  { id: 'stats', label: 'Stats', available: false },
  { id: 'shops', label: 'Shops', available: false },
];

export default function UIStorybook() {
  const [selected, setSelected] = useState<UIComponent>('hud');

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <h2 style={styles.sidebarTitle}>UI Components</h2>
        <nav style={styles.nav}>
          {UI_COMPONENTS.map((comp) => (
            <button
              key={comp.id}
              onClick={() => comp.available && setSelected(comp.id)}
              style={{
                ...styles.navButton,
                ...(selected === comp.id ? styles.navButtonActive : {}),
                ...(comp.available ? {} : styles.navButtonDisabled),
              }}
              disabled={!comp.available}
            >
              {comp.label}
              {!comp.available && <span style={styles.comingSoon}>Soon</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {selected === 'hud' && <HUDStorybook />}
        {selected === 'action-palette' && <PlaceholderPanel name="Action Palette" />}
        {selected === 'minimap' && <PlaceholderPanel name="Minimap" />}
        {selected === 'item-tooltip' && <PlaceholderPanel name="Item Tooltip" />}
        {selected === 'main-menu' && <PlaceholderPanel name="Main Menu" />}
        {selected === 'stats' && <PlaceholderPanel name="Stats" />}
        {selected === 'shops' && <PlaceholderPanel name="Shops" />}
      </div>
    </div>
  );
}

function PlaceholderPanel({ name }: { name: string }) {
  return (
    <div style={styles.placeholder}>
      <h2>{name}</h2>
      <p>Coming soon...</p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    background: '#1a1a2e',
    color: '#fff',
  },
  sidebar: {
    width: '200px',
    background: '#16213e',
    padding: '20px',
    borderRight: '1px solid #2d3a5a',
  },
  sidebarTitle: {
    fontSize: '16px',
    marginBottom: '20px',
    color: '#6b8afd',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    background: 'transparent',
    border: 'none',
    borderRadius: '6px',
    color: '#aaa',
    fontSize: '14px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s',
  },
  navButtonActive: {
    background: '#2d3a5a',
    color: '#fff',
  },
  navButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  comingSoon: {
    fontSize: '10px',
    color: '#666',
    background: '#2a2a3a',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  content: {
    flex: 1,
    overflow: 'auto',
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#666',
  },
};
