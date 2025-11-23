/**
 * MongoDB Connection
 * Manages connection to MongoDB Atlas database
 * Automatically initializes collections on first connection
 */

import { MongoClient, type Db } from 'mongodb';
import { initializeCollections } from './collections';

const MONGODB_URI = import.meta.env.MONGODB_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = import.meta.env.MONGODB_DB_NAME || process.env.MONGODB_DB_NAME || 'psz-sketch';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;
let collectionsInitialized = false;

/**
 * Parse MongoDB connection string to extract auth options
 * The MongoDB driver sometimes has issues with connection string auth,
 * so we parse it and pass explicitly for consistent behavior across environments
 */
function parseMongoOptions(uri: string) {
  try {
    const options: any = {};

    // Extract username and password using regex
    // Format: mongodb://username:password@host...
    const credentialsMatch = uri.match(/mongodb:\/\/([^:]+):([^@]+)@/);
    if (credentialsMatch) {
      options.auth = {
        username: decodeURIComponent(credentialsMatch[1]),
        password: decodeURIComponent(credentialsMatch[2]),
      };
    }

    // Extract authSource from query params
    const authSourceMatch = uri.match(/[?&]authSource=([^&]+)/);
    if (authSourceMatch) {
      options.authSource = authSourceMatch[1];
    }

    // Extract authMechanism from query params
    const authMechanismMatch = uri.match(/[?&]authMechanism=([^&]+)/);
    if (authMechanismMatch) {
      options.authMechanism = authMechanismMatch[1];
    }

    return options;
  } catch (error) {
    console.warn('Could not parse MongoDB URI for auth options:', error);
    return {};
  }
}

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

  // Parse auth options from connection string
  const options = parseMongoOptions(MONGODB_URI);

  // Create new connection with parsed options
  const client = new MongoClient(MONGODB_URI, options);
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
      console.error('⚠️  Failed to initialize collections (will be created on first use):', error);
      // Don't throw - MongoDB will create collections automatically when documents are inserted
      // Mark as initialized to prevent repeated attempts
      collectionsInitialized = true;
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
