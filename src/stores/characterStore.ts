/**
 * Global Character Store (Zustand)
 *
 * Manages the currently selected character state across the application.
 * This is used when a user selects a character from the character-select screen
 * and navigates to the game.
 */

import { create } from 'zustand';

export interface Character {
  character_id: string;
  character_name: string;
  level: number;
  experience: number;
  slot: number;
  class_id: string;
  texture_id: string;
  created_at: string;
}

interface CharacterStore {
  selectedCharacter: Character | null;
  setSelectedCharacter: (character: Character) => void;
  clearSelectedCharacter: () => void;
}

export const useCharacterStore = create<CharacterStore>((set) => ({
  selectedCharacter: null,
  setSelectedCharacter: (character) => set({ selectedCharacter: character }),
  clearSelectedCharacter: () => set({ selectedCharacter: null }),
}));
