import MainMenu from './MainMenu';

export default function MainMenuStorybook() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Main Menu</h1>
      <p style={styles.subtitle}>Navigate through Items, Equip, Palette, and System menus</p>

      {/* Preview Area */}
      <div style={styles.previewArea}>
        <div style={styles.previewBg}>
          <MainMenu />
        </div>
      </div>

      {/* Info */}
      <div style={styles.info}>
        <h3 style={styles.infoTitle}>Menu Structure</h3>
        <div style={styles.menuList}>
          <div style={styles.menuItem}>
            <span style={styles.menuName}>Items</span>
            <span style={styles.menuDesc}>Inventory with tabs: Usable, Weapon, Armor, Special (40 max)</span>
          </div>
          <div style={styles.menuItem}>
            <span style={styles.menuName}>Equip</span>
            <span style={styles.menuDesc}>Weapon, Armor (with unit slots), and Mag equipment</span>
          </div>
          <div style={styles.menuItem}>
            <span style={styles.menuName}>Palette</span>
            <span style={styles.menuDesc}>Configure action palette slots (3 normal + 3 R-held)</span>
          </div>
          <div style={styles.menuItem}>
            <span style={styles.menuName}>Mags</span>
            <span style={styles.menuDesc}>(Disabled) Mag management - see issue #37</span>
          </div>
          <div style={styles.menuItem}>
            <span style={styles.menuName}>Techniques</span>
            <span style={styles.menuDesc}>(Disabled) Technique descriptions</span>
          </div>
          <div style={styles.menuItem}>
            <span style={styles.menuName}>Quest</span>
            <span style={styles.menuDesc}>(Disabled) Mission list - see issue #40</span>
          </div>
          <div style={styles.menuItem}>
            <span style={styles.menuName}>System</span>
            <span style={styles.menuDesc}>Save Game, Quit Game</span>
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
    marginBottom: '8px',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '14px',
    color: '#888',
    textAlign: 'center',
    marginBottom: '20px',
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
  info: {
    maxWidth: '500px',
    margin: '0 auto',
    background: '#2d2d44',
    padding: '20px',
    borderRadius: '8px',
  },
  infoTitle: {
    fontSize: '14px',
    color: '#6b8afd',
    margin: '0 0 16px 0',
    borderBottom: '1px solid #3a3a5a',
    paddingBottom: '8px',
  },
  menuList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  menuItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  menuName: {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#fff',
  },
  menuDesc: {
    fontSize: '11px',
    color: '#888',
  },
};
