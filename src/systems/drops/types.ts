/**
 * Drop System Types
 */

export type Difficulty = 'normal' | 'hard' | 'super-hard';

export interface DropEntry {
  itemId: string;
  dropRate: number; // 0-1 (0.01 = 1%)
  minQuantity?: number;
  maxQuantity?: number;
}

export interface EnemyDropTable {
  enemyId: string;
  commonDrops: DropEntry[];
  rareDrops: DropEntry[];
  guaranteedDrops?: DropEntry[];
}

export interface AreaDropTable {
  areaId: string;
  difficulty: Difficulty;
  enemies: EnemyDropTable[];
  boxDrops?: DropEntry[]; // Drops from breakable boxes/containers
}

export interface DropResult {
  itemId: string;
  quantity: number;
  isRare: boolean;
}

export interface MesetaDropRange {
  min: number;
  max: number;
}

export const DIFFICULTY_DROP_MODIFIERS: Record<Difficulty, number> = {
  'normal': 1.0,
  'hard': 1.25,
  'super-hard': 1.5,
};

export const DIFFICULTY_MESETA_MODIFIERS: Record<Difficulty, number> = {
  'normal': 1.0,
  'hard': 2.0,
  'super-hard': 3.0,
};

export const BASE_MESETA_DROP: MesetaDropRange = {
  min: 10,
  max: 50,
};
