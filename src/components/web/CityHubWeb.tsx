import { useState, useEffect } from 'react';
import type { Character } from '../../systems/character/types';

export default function CityHubWeb() {
  const [character, setCharacter] = useState<Character | null>(null);

  useEffect(() => {
    loadSelectedCharacter();
  }, []);

  const loadSelectedCharacter = () => {
    const selectedId = localStorage.getItem('selectedCharacterId');
    if (!selectedId) {
      window.location.href = '/web/character-select';
      return;
    }

    const stored = localStorage.getItem('characters');
    if (stored) {
      try {
        const characters = JSON.parse(stored);
        const found = characters.find((c: Character | null) =>
          c?.character_id === selectedId
        );
        if (found) {
          setCharacter(found);
        } else {
          window.location.href = '/web/character-select';
        }
      } catch {
        window.location.href = '/web/character-select';
      }
    } else {
      window.location.href = '/web/character-select';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('selectedCharacterId');
    window.location.href = '/web/character-select';
  };

  if (!character) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.container} data-testid="city-hub">
      {/* Character Info Panel */}
      <div style={styles.characterPanel}>
        <div style={styles.characterAvatar}>
          <span style={styles.avatarIcon}>👤</span>
        </div>
        <div style={styles.characterInfo}>
          <span style={styles.characterName} data-testid="character-name">
            {character.character_name}
          </span>
          <span style={styles.characterClass} data-testid="character-class">
            {character.class_id}
          </span>
          <span style={styles.characterLevel} data-testid="character-level">
            Level {character.level}
          </span>
        </div>
        <div style={styles.mesetaDisplay}>
          <span style={styles.mesetaIcon}>💰</span>
          <span style={styles.mesetaAmount} data-testid="meseta-amount">
            {(character.meseta ?? 0).toLocaleString()}
          </span>
        </div>
      </div>

      {/* City Title */}
      <h1 style={styles.title}>DAIRON CITY</h1>

      {/* Navigation Menu */}
      <nav style={styles.nav}>
        <a href="/web/shop" style={styles.navButton} data-testid="nav-shop">
          <span style={styles.navIcon}>🏪</span>
          <span>SHOP</span>
        </a>
        <a href="/web/inventory" style={styles.navButton} data-testid="nav-inventory">
          <span style={styles.navIcon}>🎒</span>
          <span>INVENTORY</span>
        </a>
        <a href="/web/guild-counter" style={styles.navButton} data-testid="nav-missions">
          <span style={styles.navIcon}>⚔️</span>
          <span>GUILD</span>
        </a>
        <a href="/web/storage" style={styles.navButton} data-testid="nav-storage">
          <span style={styles.navIcon}>📦</span>
          <span>STORAGE</span>
        </a>
      </nav>

      {/* Logout Button */}
      <button
        style={styles.logoutButton}
        onClick={handleLogout}
        data-testid="logout"
      >
        ← LOGOUT
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a1628 0%, #1a2a4a 50%, #0a1628 100%)',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontFamily: "'Press Start 2P', system-ui, sans-serif",
    color: 'white',
  },
  loading: {
    fontSize: '0.8rem',
    color: '#6bb8ff',
  },
  characterPanel: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    padding: '1rem 2rem',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '2px solid #3a5a8a',
    borderRadius: '8px',
    marginBottom: '2rem',
    width: '100%',
    maxWidth: '600px',
  },
  characterAvatar: {
    width: '64px',
    height: '64px',
    background: 'rgba(107, 184, 255, 0.2)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIcon: {
    fontSize: '2rem',
  },
  characterInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  characterName: {
    fontSize: '0.9rem',
    color: 'white',
  },
  characterClass: {
    fontSize: '0.6rem',
    color: '#6bb8ff',
  },
  characterLevel: {
    fontSize: '0.6rem',
    color: '#a6c9ff',
  },
  mesetaDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    background: 'rgba(252, 211, 77, 0.1)',
    border: '2px solid #fcd34d',
    borderRadius: '4px',
  },
  mesetaIcon: {
    fontSize: '1rem',
  },
  mesetaAmount: {
    fontSize: '0.7rem',
    color: '#fcd34d',
  },
  title: {
    fontSize: '1.2rem',
    color: '#6bb8ff',
    marginBottom: '2rem',
    letterSpacing: '4px',
  },
  nav: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1rem',
    maxWidth: '500px',
    width: '100%',
  },
  navButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1.5rem',
    background: 'linear-gradient(135deg, #2d4a6a 0%, #1a3a5a 100%)',
    border: '2px solid #6bb8ff',
    borderRadius: '8px',
    color: 'white',
    textDecoration: 'none',
    fontSize: '0.7rem',
    letterSpacing: '2px',
    transition: 'all 0.2s',
    cursor: 'pointer',
  },
  navIcon: {
    fontSize: '2rem',
  },
  logoutButton: {
    marginTop: '2rem',
    padding: '0.75rem 1.5rem',
    background: 'transparent',
    border: '2px solid #f87171',
    borderRadius: '4px',
    color: '#f87171',
    fontFamily: 'inherit',
    fontSize: '0.6rem',
    cursor: 'pointer',
    letterSpacing: '1px',
    transition: 'all 0.2s',
  },
};
