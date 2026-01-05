import { useState } from 'react';
import SystemMenu from './SystemMenu';
import EquipMenu from './EquipMenu';
import ItemsMenu from './ItemsMenu';
import PaletteMenu from './PaletteMenu';

type MenuScreen = 'main' | 'items' | 'equip' | 'palette' | 'mags' | 'techniques' | 'quest' | 'system';

interface MenuItem {
  id: MenuScreen;
  label: string;
  disabled?: boolean;
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'items', label: 'Items' },
  { id: 'equip', label: 'Equip' },
  { id: 'palette', label: 'Palette' },
  { id: 'mags', label: 'Mags', disabled: true },
  { id: 'techniques', label: 'Techniques', disabled: true },
  { id: 'quest', label: 'Quest', disabled: true },
  { id: 'system', label: 'System' },
];

export default function MainMenu() {
  const [currentScreen, setCurrentScreen] = useState<MenuScreen>('main');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleSelect = (item: MenuItem) => {
    if (!item.disabled) {
      setCurrentScreen(item.id);
    }
  };

  const handleBack = () => {
    setCurrentScreen('main');
  };

  // Render sub-menus
  if (currentScreen === 'system') {
    return <SystemMenu onBack={handleBack} />;
  }
  if (currentScreen === 'equip') {
    return <EquipMenu onBack={handleBack} />;
  }
  if (currentScreen === 'items') {
    return <ItemsMenu onBack={handleBack} />;
  }
  if (currentScreen === 'palette') {
    return <PaletteMenu onBack={handleBack} />;
  }

  // Main menu
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.headerText}>Menu</span>
      </div>
      <div style={styles.menuList}>
        {MENU_ITEMS.map((item, index) => (
          <button
            key={item.id}
            onClick={() => handleSelect(item)}
            onMouseEnter={() => setSelectedIndex(index)}
            style={{
              ...styles.menuItem,
              ...(selectedIndex === index ? styles.menuItemSelected : {}),
              ...(item.disabled ? styles.menuItemDisabled : {}),
            }}
            disabled={item.disabled}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div style={styles.footer}>
        <span style={styles.footerHint}>
          <span style={styles.buttonHint}>A</span> Select
        </span>
        <span style={styles.footerHint}>
          <span style={styles.buttonHint}>B</span> Close
        </span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '200px',
    background: 'linear-gradient(180deg, #7cb8d8 0%, #5a9cc8 100%)',
    border: '3px solid #2a5a7a',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
  },
  header: {
    background: 'linear-gradient(180deg, #4a8ab8 0%, #3a7aa8 100%)',
    padding: '8px 12px',
    borderBottom: '2px solid #2a5a7a',
  },
  headerText: {
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 'bold',
    textShadow: '1px 1px 0 #2a5a7a',
  },
  menuList: {
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  menuItem: {
    padding: '10px 16px',
    background: 'transparent',
    border: 'none',
    borderRadius: '4px',
    color: '#1a3a5a',
    fontSize: '14px',
    fontWeight: 'bold',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.1s ease',
  },
  menuItemSelected: {
    background: '#f0a020',
    color: '#1a1a1a',
  },
  menuItemDisabled: {
    color: '#6a8a9a',
    cursor: 'not-allowed',
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
};
