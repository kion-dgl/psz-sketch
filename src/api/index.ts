/**
 * Game API
 * Unified export for all API functions
 */

// Database
export { db, initializeDatabase, closeDatabase, resetDatabase } from '../db';

// Character API
export {
  createCharacter,
  getCharacter,
  getCharacterBySlot,
  getAllCharacters,
  deleteCharacter,
  deleteCharacterBySlot,
  updateMeseta,
  addExperience,
  type Character,
} from './character';

// Inventory API
export {
  getInventory,
  getInventoryCount,
  isInventoryFull,
  addItem,
  removeItem,
  getItem,
  useConsumable,
  type InventorySlot,
} from './inventory';

// Equipment API
export {
  getEquipment,
  getEquippedItem,
  equipWeapon,
  equipFrame,
  equipUnit,
  unequipWeapon,
  unequipFrame,
  unequipUnit,
  type EquipmentSlot,
  type EquipmentState,
} from './equipment';

// Storage API
export {
  getStorage,
  getStorageCount,
  depositMeseta,
  withdrawMeseta,
  depositItem,
  withdrawItem,
  clearStorage,
  type StorageSlot,
  type StorageState,
} from './storage';

// Location/State API
export {
  getGameState,
  getLocation,
  goto,
  setSessionData,
  setCombatData,
  enterField,
  enterMission,
  returnToCity,
  nextStage,
  type Location,
  type GameStateData,
  type SessionData,
  type CombatData,
  type EnemyData,
  type DroppedItem,
} from './location';

// Common types
export interface ApiResult<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}
