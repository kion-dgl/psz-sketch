import { useState, useEffect } from 'react';
import HUDStorybook from '../hud/HUDStorybook';
import ActionPaletteStorybook from '../palette/ActionPaletteStorybook';
import MinimapStorybook from '../minimap/MinimapStorybook';
import TooltipStorybook from '../tooltip/TooltipStorybook';
import StatsStorybook from '../stats/StatsStorybook';
import MainMenuStorybook from '../main-menu/MainMenuStorybook';
import ItemsStorybook from '../main-menu/ItemsStorybook';
import EquipStorybook from '../main-menu/EquipStorybook';
import ItemShopStorybook from '../shops/ItemShopStorybook';
import WeaponShopStorybook from '../shops/WeaponShopStorybook';
import Shop3DStorybook from '../shops/Shop3DStorybook';
import WeaponShop3DStorybook from '../shops/WeaponShop3DStorybook';
import MagEvolutionsStorybook from '../mag/MagEvolutionsStorybook';
import MagFeederStorybook from '../mag/MagFeederStorybook';
import ScreenPreview from './ScreenPreview';

type UIComponent = 'screen' | 'hud' | 'action-palette' | 'minimap' | 'tooltip' | 'stats' | 'main-menu' | 'items' | 'equip' | 'item-shop' | 'weapon-shop' | 'shop-3d' | 'weapon-shop-3d' | 'mag-evolutions' | 'mag-feeder';

const UI_COMPONENTS: { id: UIComponent; label: string; available: boolean }[] = [
  { id: 'screen', label: 'Screen Preview', available: true },
  { id: 'hud', label: 'HUD', available: true },
  { id: 'action-palette', label: 'Action Palette', available: true },
  { id: 'minimap', label: 'Minimap', available: true },
  { id: 'tooltip', label: 'Tooltip', available: true },
  { id: 'stats', label: 'Stats', available: true },
  { id: 'main-menu', label: 'Main Menu', available: true },
  { id: 'items', label: 'Items', available: true },
  { id: 'equip', label: 'Equip', available: true },
  { id: 'item-shop', label: 'Item Shop', available: true },
  { id: 'weapon-shop', label: 'Weapon Shop', available: true },
  { id: 'shop-3d', label: 'Item Shop 3D', available: true },
  { id: 'weapon-shop-3d', label: 'Weapon Shop 3D', available: true },
  { id: 'mag-evolutions', label: 'Mag Evolutions', available: true },
  { id: 'mag-feeder', label: 'Mag Feeder', available: true },
];

const validComponents = UI_COMPONENTS.map(c => c.id);

function getComponentFromUrl(): UIComponent {
  if (typeof window === 'undefined') return 'screen';
  const path = window.location.pathname;
  const match = path.match(/\/storybook\/ui\/([^/]+)/);
  if (match && validComponents.includes(match[1] as UIComponent)) {
    return match[1] as UIComponent;
  }
  return 'screen';
}

interface UIStorybookProps {
  initialComponent?: string;
}

export default function UIStorybook({ initialComponent }: UIStorybookProps) {
  const [selected, setSelected] = useState<UIComponent>(() => {
    if (initialComponent && validComponents.includes(initialComponent as UIComponent)) {
      return initialComponent as UIComponent;
    }
    return getComponentFromUrl();
  });

  // Update URL when selection changes
  const handleSelect = (comp: UIComponent) => {
    setSelected(comp);
    const newUrl = `/storybook/ui/${comp}`;
    window.history.pushState({}, '', newUrl);
  };

  // Listen for browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      setSelected(getComponentFromUrl());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <h2 style={styles.sidebarTitle}>UI Components</h2>
        <nav style={styles.nav}>
          {UI_COMPONENTS.map((comp) => (
            <button
              key={comp.id}
              onClick={() => comp.available && handleSelect(comp.id)}
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
        {selected === 'screen' && <ScreenPreview />}
        {selected === 'hud' && <HUDStorybook />}
        {selected === 'action-palette' && <ActionPaletteStorybook />}
        {selected === 'minimap' && <MinimapStorybook />}
        {selected === 'tooltip' && <TooltipStorybook />}
        {selected === 'stats' && <StatsStorybook />}
        {selected === 'main-menu' && <MainMenuStorybook />}
        {selected === 'items' && <ItemsStorybook />}
        {selected === 'equip' && <EquipStorybook />}
        {selected === 'item-shop' && <ItemShopStorybook />}
        {selected === 'weapon-shop' && <WeaponShopStorybook />}
        {selected === 'shop-3d' && <Shop3DStorybook />}
        {selected === 'weapon-shop-3d' && <WeaponShop3DStorybook />}
        {selected === 'mag-evolutions' && <MagEvolutionsStorybook />}
        {selected === 'mag-feeder' && <MagFeederStorybook />}
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
