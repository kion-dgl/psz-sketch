/**
 * MongoDB Connection
 * Manages connection to MongoDB Atlas database
 * Automatically initializes collections on first connection
 */

import { MongoClient, Db } from 'mongodb';
import { initializeCollections } from './collections';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'psz-sketch';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;
let collectionsInitialized = false;

/**
 * Connects to MongoDB and returns the database instance
 * Uses connection caching to avoid multiple connections
 * Automatically initializes collections on first connection
 */
export async function connectToDatabase(): Promise<Db> {
  // Return cached connection if available
  if (cachedClient && cachedDb) {
    return cachedDb;
  }

  // Create new connection
  const client = new MongoClient(MONGODB_URI);
  await client.connect();

  const db = client.db(DB_NAME);

  // Cache the connection
  cachedClient = client;
  cachedDb = db;

  console.log('✅ Connected to MongoDB');

  // Initialize collections on first connection
  if (!collectionsInitialized) {
    try {
      await initializeCollections(db);
      collectionsInitialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize collections:', error);
      // Don't throw - allow app to start even if initialization fails
      // Collections will be created on demand
    }
  }

  return db;
}

/**
 * Gets a collection from the database
 */
export async function getCollection<T = any>(collectionName: string) {
  const db = await connectToDatabase();
  return db.collection<T>(collectionName);
}
