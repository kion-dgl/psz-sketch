/**
 * Mag System Exports
 */

export {
  createMag,
  getMagLevel,
  getMagForm,
  canFeedItem,
  getFeedEffect,
  getFeedableItems,
  feedMag,
  formatMagInfo,
  getMagStatBonuses,
} from './mag';

export type {
  MagState,
  MagStats,
  MagForm,
  MagFeedEffect,
  MagPersonality,
} from './types';

export {
  MAG_FEED_EFFECTS,
  MAG_PERSONALITIES,
} from './types';
