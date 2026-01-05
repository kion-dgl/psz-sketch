import { useState } from 'react';

interface SystemMenuProps {
  onBack: () => void;
  onSave?: () => void;
  onQuit?: () => void;
}

export default function SystemMenu({ onBack, onSave, onQuit }: SystemMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const menuItems = [
    { label: 'Save Game', action: onSave },
    { label: 'Quit Game', action: onQuit },
  ];

  const handleSelect = (index: number) => {
    const item = menuItems[index];
    if (item.action) {
      item.action();
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.headerText}>System</span>
      </div>
      <div style={styles.menuList}>
        {menuItems.map((item, index) => (
          <button
            key={item.label}
            onClick={() => handleSelect(index)}
            onMouseEnter={() => setSelectedIndex(index)}
            style={{
              ...styles.menuItem,
              ...(selectedIndex === index ? styles.menuItemSelected : {}),
            }}
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
          <span style={styles.buttonHint}>B</span> Back
        </span>
        <button onClick={onBack} style={styles.backButton}>
          Back
        </button>
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
  footer: {
    display: 'flex',
    gap: '16px',
    padding: '8px 12px',
    background: 'linear-gradient(180deg, #4a8ab8 0%, #3a7aa8 100%)',
    borderTop: '2px solid #2a5a7a',
    alignItems: 'center',
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
    marginLeft: 'auto',
    padding: '4px 12px',
    background: '#2a5a7a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '11px',
    cursor: 'pointer',
  },
};
