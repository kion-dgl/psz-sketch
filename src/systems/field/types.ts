/**
 * Field System Types
 * Types for field exploration and progression
 */

export type StageVariant = 'a' | 'e' | 'b' | 'z';

export interface StageDefinition {
  stageId: string;           // e.g., 's01a', 's01e', 's01b', 's01z'
  variant: StageVariant;
  areaId: string;            // Allows cross-area (for missions)
}

export interface Field {
  id: string;
  name: string;
  description: string;
  areaId: string;
  requiredLevel: number;
  recommendedLevel: number;
  parTime: number;           // Base par time in seconds for grading
  stageSequence: StageDefinition[];
  unlockRequirements?: FieldUnlockRequirement[];
  bossId?: string;
}

export interface FieldUnlockRequirement {
  type: 'field' | 'level';
  id?: string;               // Required for type 'field'
  value?: number;            // Required for type 'level'
}

export interface FieldResult {
  fieldId: string;
  difficulty: 'normal' | 'hard' | 'super-hard';
  completed: boolean;
  duration: number;          // in milliseconds
  stagesCompleted: number;
  expGained: number;
  mesetaGained: number;
  itemsGained: FieldItemDrop[];
  grade: FieldGrade;
}

export interface FieldItemDrop {
  itemId: string;
  quantity: number;
}

export type FieldGrade = 'S' | 'A' | 'B' | 'C' | 'D';

export interface FieldReward {
  baseExp: number;
  baseMeseta: number;
  items?: FieldDropTable[];
}

export interface FieldDropTable {
  itemId: string;
  quantity: number;
  chance: number;  // 0-1
}
