export {
  loadGameData,
  saveGameData,
  saveCharacterSlot,
  loadCharacterSlot,
  saveSharedStorage,
  loadSharedStorage,
  setLastActiveSlot,
  getLastActiveSlot,
  resetAllGameData,
  hasSaveData,
} from './persistence';

export type {
  PersistedCharacterData,
  PersistedGameData,
} from './persistence';
