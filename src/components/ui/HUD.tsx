/**
 * HUD Component
 *
 * Displays character name, HP, and MP in the top right corner.
 * Styled with semi-transparent background for readability while
 * maintaining immersion.
 */

import { useCharacterStore } from '../../stores/characterStore';
import { useGameState } from '../../stores/gameStateStore';

export default function HUD() {
  const selectedCharacter = useCharacterStore((state) => state.selectedCharacter);
  const { hp, maxHp, mp, maxMp } = useGameState();

  if (!selectedCharacter) return null;

  const hpPercentage = (hp / maxHp) * 100;
  const mpPercentage = (mp / maxMp) * 100;

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      left: '20px',
      background: 'rgba(0, 0, 0, 0.7)',
      color: 'white',
      padding: '1rem',
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontSize: '14px',
      zIndex: 1000,
      pointerEvents: 'none',
      minWidth: '200px'
    }}>
      {/* Character Name and Level */}
      <div style={{
        fontSize: '16px',
        fontWeight: 'bold',
        marginBottom: '0.75rem',
        color: '#ffd700',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>{selectedCharacter.character_name}</span>
        <span style={{ fontSize: '14px', color: '#aaa' }}>Lv.1</span>
      </div>

      {/* HP Bar */}
      <div style={{ marginBottom: '0.5rem' }}>
        <div style={{
          fontSize: '12px',
          marginBottom: '4px',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span>HP</span>
          <span>{hp} / {maxHp}</span>
        </div>
        <div style={{
          width: '100%',
          height: '20px',
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '4px',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.3)'
        }}>
          <div style={{
            width: `${hpPercentage}%`,
            height: '100%',
            background: hpPercentage > 50 ? '#2ecc71' : hpPercentage > 25 ? '#f39c12' : '#e74c3c',
            transition: 'width 0.3s ease, background 0.3s ease'
          }} />
        </div>
      </div>

      {/* MP Bar */}
      <div>
        <div style={{
          fontSize: '12px',
          marginBottom: '4px',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span>MP</span>
          <span>{mp} / {maxMp}</span>
        </div>
        <div style={{
          width: '100%',
          height: '20px',
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '4px',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.3)'
        }}>
          <div style={{
            width: `${mpPercentage}%`,
            height: '100%',
            background: '#3498db',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>
    </div>
  );
}
