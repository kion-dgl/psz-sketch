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
        className="absolute inset-0 w-screen h-screen bg-black/50 z-[2000] flex items-center justify-center"
      >
        {/* Menu panel */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-[#141428]/95 text-white p-8 rounded-xl font-mono min-w-[400px] max-w-[600px] border-2 border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
        >
          {/* Header */}
          <div className="text-2xl font-bold mb-6 border-b-2 border-white/30 pb-3 flex justify-between items-center">
            <span>Equipment</span>
            <span className="text-sm text-gray-400">
              {selectedCharacter.character_name} - Lv.{selectedCharacter.level}
            </span>
          </div>

          {/* Equipment Slots */}
          <div className="flex flex-col gap-4">
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
          <div className="mt-6 pt-4 border-t border-white/20 text-xs text-gray-500 text-center">
            Press TAB or ESC to close
          </div>
        </div>
      </div>
    </>
  );
}

function EquipmentSlot({ label, item, onUnequip }: { label: string; item?: string; onUnequip: () => void }) {
  return (
    <div className="bg-white/5 p-3 rounded-md border border-white/10 flex justify-between items-center">
      <div>
        <div className="text-xs text-gray-400 mb-1">
          {label}
        </div>
        <div className={`text-sm ${item ? 'text-yellow-400 font-bold' : 'text-gray-600'}`}>
          {item || 'Empty'}
        </div>
      </div>

      {item && (
        <button
          onClick={onUnequip}
          className="bg-red-500/80 hover:bg-red-500 text-white border-none px-4 py-2 rounded cursor-pointer text-xs font-mono transition-colors"
        >
          Unequip
        </button>
      )}
    </div>
  );
}
