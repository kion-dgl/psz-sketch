/**
 * Pause Menu Component
 *
 * Equipment management menu that overlays the game without pausing it.
 * Allows viewing and switching equipment. Press TAB or ESC to toggle.
 */

import { useEffect } from 'react';
import { useGameState } from '../../stores/gameStateStore';
import { useCharacterStore } from '../../stores/characterStore';

export default function PauseMenu() {
  const { isPauseMenuOpen, equipment, equipItem, togglePauseMenu } = useGameState();
  const selectedCharacter = useCharacterStore((state) => state.selectedCharacter);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' || e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        console.log('[PauseMenu] Toggling menu with key:', e.key);
        togglePauseMenu();
      }
    };

    // Use capture phase to ensure we get the event first
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [togglePauseMenu]);

  if (!isPauseMenuOpen || !selectedCharacter) return null;

  const handleUnequip = (slot: 'weapon' | 'armor' | 'accessory1' | 'accessory2') => {
    equipItem(slot, undefined);
  };

  return (
    <>
      {/* Semi-transparent overlay */}
      <div
        onClick={togglePauseMenu}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Menu panel */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'rgba(20, 20, 40, 0.95)',
            color: 'white',
            padding: '2rem',
            borderRadius: '12px',
            fontFamily: 'monospace',
            minWidth: '400px',
            maxWidth: '600px',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
          }}
        >
          {/* Header */}
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '1.5rem',
            borderBottom: '2px solid rgba(255, 255, 255, 0.3)',
            paddingBottom: '0.75rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>Equipment</span>
            <span style={{ fontSize: '14px', color: '#aaa' }}>
              {selectedCharacter.character_name} - Lv.{selectedCharacter.level}
            </span>
          </div>

          {/* Equipment Slots */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Weapon */}
            <EquipmentSlot
              label="Weapon"
              item={equipment.weapon}
              onUnequip={() => handleUnequip('weapon')}
            />

            {/* Armor */}
            <EquipmentSlot
              label="Armor"
              item={equipment.armor}
              onUnequip={() => handleUnequip('armor')}
            />

            {/* Accessory 1 */}
            <EquipmentSlot
              label="Accessory 1"
              item={equipment.accessory1}
              onUnequip={() => handleUnequip('accessory1')}
            />

            {/* Accessory 2 */}
            <EquipmentSlot
              label="Accessory 2"
              item={equipment.accessory2}
              onUnequip={() => handleUnequip('accessory2')}
            />
          </div>

          {/* Footer */}
          <div style={{
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.2)',
            fontSize: '12px',
            color: '#888',
            textAlign: 'center'
          }}>
            Press TAB or ESC to close
          </div>
        </div>
      </div>
    </>
  );
}

function EquipmentSlot({ label, item, onUnequip }: { label: string; item?: string; onUnequip: () => void }) {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.05)',
      padding: '0.75rem',
      borderRadius: '6px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div>
        <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '4px' }}>
          {label}
        </div>
        <div style={{
          fontSize: '14px',
          color: item ? '#ffd700' : '#666',
          fontWeight: item ? 'bold' : 'normal'
        }}>
          {item || 'Empty'}
        </div>
      </div>

      {item && (
        <button
          onClick={onUnequip}
          style={{
            background: 'rgba(231, 76, 60, 0.8)',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontFamily: 'monospace'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(231, 76, 60, 1)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(231, 76, 60, 0.8)'}
        >
          Unequip
        </button>
      )}
    </div>
  );
}
