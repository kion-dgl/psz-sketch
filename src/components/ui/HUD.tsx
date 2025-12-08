/**
 * HUD Component
 *
 * Displays character name, HP, and MP in the top left corner.
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

  // Determine HP bar color based on percentage
  const hpBarColor = hpPercentage > 50
    ? 'bg-green-500'
    : hpPercentage > 25
    ? 'bg-orange-500'
    : 'bg-red-500';

  return (
    <div className="absolute top-5 left-5 bg-black/70 text-white p-4 rounded-lg font-mono text-sm z-[1000] pointer-events-none min-w-[200px]">
      {/* Character Name and Level */}
      <div className="flex justify-between items-center text-base font-bold mb-3 text-yellow-400">
        <span>{selectedCharacter.character_name}</span>
        {/* TODO: Use selectedCharacter.level instead of hardcoded value */}
        <span className="text-sm text-gray-400">Lv.1</span>
      </div>

      {/* HP Bar */}
      <div className="mb-2">
        <div className="flex justify-between text-xs mb-1">
          <span>HP</span>
          <span>{hp} / {maxHp}</span>
        </div>
        <div className="w-full h-5 bg-white/20 rounded border border-white/30 overflow-hidden">
          <div
            className={`h-full ${hpBarColor} transition-all duration-300 ease-in-out`}
            style={{ width: `${hpPercentage}%` }}
          />
        </div>
      </div>

      {/* MP Bar */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span>MP</span>
          <span>{mp} / {maxMp}</span>
        </div>
        <div className="w-full h-5 bg-white/20 rounded border border-white/30 overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300 ease-in-out"
            style={{ width: `${mpPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
