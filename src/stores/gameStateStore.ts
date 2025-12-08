/**
 * Game State Store (Zustand)
 *
 * Manages dynamic gameplay state like HP, MP, equipment, inventory, etc.
 * This is separate from character store since these values change during gameplay.
 */

import { create } from 'zustand';

export interface Equipment {
  weapon?: string;
  armor?: string;
  accessory1?: string;
  accessory2?: string;
}

export interface GameState {
  // Combat stats
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;

  // Equipment
  equipment: Equipment;

  // UI state
  isPauseMenuOpen: boolean;
  activeShopNPC: string | null;

  // Actions
  setHp: (hp: number) => void;
  setMp: (mp: number) => void;
  setMaxHp: (maxHp: number) => void;
  setMaxMp: (maxMp: number) => void;
  equipItem: (slot: keyof Equipment, item: string | undefined) => void;
  togglePauseMenu: () => void;
  openShop: (npcName: string) => void;
  closeShop: () => void;
  resetGameState: () => void;
}

export const useGameState = create<GameState>((set) => ({
  // Initial values (could be loaded from character data)
  hp: 100,
  maxHp: 100,
  mp: 50,
  maxMp: 50,

  equipment: {},

  isPauseMenuOpen: false,
  activeShopNPC: null,

  setHp: (hp) => set({ hp }),
  setMp: (mp) => set({ mp }),
  setMaxHp: (maxHp) => set({ maxHp }),
  setMaxMp: (maxMp) => set({ maxMp }),

  equipItem: (slot, item) => set((state) => ({
    equipment: { ...state.equipment, [slot]: item }
  })),

  togglePauseMenu: () => set((state) => ({ isPauseMenuOpen: !state.isPauseMenuOpen })),

  openShop: (npcName) => set({ activeShopNPC: npcName }),
  closeShop: () => set({ activeShopNPC: null }),

  resetGameState: () => set({
    hp: 100,
    maxHp: 100,
    mp: 50,
    maxMp: 50,
    equipment: {},
    isPauseMenuOpen: false,
    activeShopNPC: null,
  }),
}));
