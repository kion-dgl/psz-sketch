/**
 * Character Types
 * Core type definitions for the character system
 */

export interface Character {
  character_id: string;
  character_name: string;
  level: number;
  experience: number;
  slot: number;
  class_id: string;
  variation_index: number;
  texture_id: string;
  created_at: string;
  meseta?: number;
}

export interface CharacterCreationParams {
  name: string;
  classId: string;
  slot: number;
  variationIndex?: number;
  bodyColorIndex?: number;
  hairColorIndex?: number;
  skinToneIndex?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export type CharacterSlots = (Character | null)[];

export const MAX_SLOTS = 4;
export const MAX_NAME_LENGTH = 50;
export const MIN_NAME_LENGTH = 1;

// Valid class IDs
export const VALID_CLASS_IDS = [
  // Human
  'HUmar', 'HUmarl', 'RAmar', 'RAmarl', 'FOmar', 'FOmarl',
  // Newman
  'HUnewm', 'HUnewearl', 'FOnewm', 'FOnewearl',
  // Cast
  'HUcast', 'HUcaseal', 'RAcast', 'RAcaseal',
] as const;

export type ClassId = typeof VALID_CLASS_IDS[number];
