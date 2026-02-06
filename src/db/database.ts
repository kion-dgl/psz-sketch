/**
 * SQLite Database Layer
 * Central database connection and schema management
 */
import Database from 'better-sqlite3';
import { join } from 'path';
import { homedir } from 'os';
import { mkdirSync, existsSync } from 'fs';

// Database file location
const DATA_DIR = join(homedir(), '.psz-sketch');
const DB_PATH = join(DATA_DIR, 'game.db');

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

// Create database connection
export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/**
 * Initialize database schema
 */
export function initializeDatabase(): void {
  db.exec(`
    -- Characters table
    CREATE TABLE IF NOT EXISTS characters (
      id TEXT PRIMARY KEY,
      slot INTEGER NOT NULL CHECK (slot >= 0 AND slot <= 3),
      name TEXT NOT NULL,
      class_id TEXT NOT NULL,
      level INTEGER NOT NULL DEFAULT 1,
      experience INTEGER NOT NULL DEFAULT 0,
      meseta INTEGER NOT NULL DEFAULT 500,
      variation_index INTEGER NOT NULL DEFAULT 0,
      texture_id TEXT NOT NULL DEFAULT '0_0',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(slot)
    );

    -- Inventory table (items owned by characters)
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      character_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      item_data TEXT NOT NULL,  -- JSON blob of full item
      quantity INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
      UNIQUE(character_id, item_id)
    );

    -- Equipment table (what's equipped per character)
    CREATE TABLE IF NOT EXISTS equipment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      character_id TEXT NOT NULL,
      slot TEXT NOT NULL CHECK (slot IN ('weapon', 'frame', 'unit1', 'unit2', 'unit3', 'unit4')),
      item_data TEXT NOT NULL,  -- JSON blob of full item
      FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
      UNIQUE(character_id, slot)
    );

    -- Shared storage items (shared between all characters)
    CREATE TABLE IF NOT EXISTS storage_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id TEXT NOT NULL UNIQUE,
      item_data TEXT NOT NULL,  -- JSON blob of full item
      quantity INTEGER NOT NULL DEFAULT 1
    );

    -- Shared storage meseta (single row)
    CREATE TABLE IF NOT EXISTS storage_meseta (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      amount INTEGER NOT NULL DEFAULT 0
    );

    -- Initialize meseta row if not exists
    INSERT OR IGNORE INTO storage_meseta (id, amount) VALUES (1, 0);

    -- Game session state (current location, combat, etc.)
    CREATE TABLE IF NOT EXISTS game_state (
      character_id TEXT PRIMARY KEY,
      location TEXT NOT NULL DEFAULT 'city',
      session_data TEXT,  -- JSON blob for mission/field state
      combat_data TEXT,   -- JSON blob for combat state
      FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
    );

    -- Create indexes for common queries
    CREATE INDEX IF NOT EXISTS idx_inventory_character ON inventory(character_id);
    CREATE INDEX IF NOT EXISTS idx_equipment_character ON equipment(character_id);
  `);
}

/**
 * Close database connection
 */
export function closeDatabase(): void {
  db.close();
}

/**
 * Reset database (for testing)
 */
export function resetDatabase(): void {
  db.exec(`
    DELETE FROM game_state;
    DELETE FROM equipment;
    DELETE FROM inventory;
    DELETE FROM characters;
    DELETE FROM storage_items;
    UPDATE storage_meseta SET amount = 0 WHERE id = 1;
  `);
}

// Initialize on import
initializeDatabase();
