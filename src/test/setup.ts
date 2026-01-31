/**
 * Test Setup
 * Common test utilities and mocks for unit tests
 */

import { beforeEach, vi } from 'vitest';

// Mock localStorage for all tests
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
})();

// Set up localStorage mock before each test
beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();

  // Make localStorage available globally
  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });
});

// Export for direct use in tests
export { localStorageMock };

/**
 * Helper to create a mock character for testing
 */
export function createMockCharacter(overrides: Partial<{
  character_id: string;
  character_name: string;
  level: number;
  experience: number;
  slot: number;
  class_id: string;
  variation_index: number;
  texture_id: string;
  created_at: string;
}> = {}) {
  return {
    character_id: `char_${Date.now()}`,
    character_name: 'TestChar',
    level: 1,
    experience: 0,
    slot: 0,
    class_id: 'HUmar',
    variation_index: 0,
    texture_id: '0_0',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Helper to seed localStorage with characters
 */
export function seedCharacters(characters: (ReturnType<typeof createMockCharacter> | null)[]) {
  // Ensure 4 slots
  while (characters.length < 4) {
    characters.push(null);
  }
  localStorage.setItem('characters', JSON.stringify(characters));
}

/**
 * Helper to get characters from localStorage
 */
export function getStoredCharacters() {
  const stored = localStorage.getItem('characters');
  return stored ? JSON.parse(stored) : [];
}
