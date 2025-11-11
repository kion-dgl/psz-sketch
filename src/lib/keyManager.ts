/**
 * Key Manager
 * Handles ECDSA P-256 key pair generation, storage, and retrieval using IndexedDB
 */

const DB_NAME = 'psz-auth';
const STORE_NAME = 'user-key';
const KEY_ID = 'userKey';

/**
 * Opens the IndexedDB database and ensures the object store exists
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

/**
 * Generates a new ECDSA P-256 key pair and stores it in IndexedDB
 * The key is non-extractable for security
 */
export async function createAndStoreKey(): Promise<CryptoKeyPair> {
  // Generate ECDSA P-256 key pair
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    false, // non-extractable for security
    ['sign', 'verify']
  );

  // Store the key pair in IndexedDB
  const db = await openDatabase();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  await new Promise<void>((resolve, reject) => {
    const request = store.put(keyPair, KEY_ID);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });

  db.close();
  return keyPair;
}

/**
 * Retrieves the stored key pair from IndexedDB
 * Returns null if no key exists
 */
export async function getStoredKey(): Promise<CryptoKeyPair | null> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const keyPair = await new Promise<CryptoKeyPair | null>((resolve, reject) => {
      const request = store.get(KEY_ID);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });

    db.close();
    return keyPair;
  } catch (error) {
    console.error('Error retrieving key from IndexedDB:', error);
    return null;
  }
}

/**
 * Gets the stored key pair, or creates one if it doesn't exist
 */
export async function getOrCreateKey(): Promise<CryptoKeyPair> {
  const existingKey = await getStoredKey();
  if (existingKey) {
    return existingKey;
  }
  return createAndStoreKey();
}

/**
 * Converts an ArrayBuffer to a base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Exports the public key and generates the fingerprint
 * Returns both the 40-character fingerprint and the full public key
 */
export async function getPublicKeyDetails(publicKey: CryptoKey): Promise<{
  fingerprint: string;
  fullPublicKey: string;
}> {
  // Export the public key to SPKI format
  const publicKeyBuffer = await window.crypto.subtle.exportKey('spki', publicKey);

  // Hash the public key with SHA-256
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', publicKeyBuffer);

  // Take the first 30 bytes of the hash
  const fingerprintBytes = new Uint8Array(hashBuffer).slice(0, 30);

  // Base64-encode to get 40-character fingerprint
  const fingerprint = arrayBufferToBase64(fingerprintBytes.buffer);

  // Base64-encode the full public key
  const fullPublicKey = arrayBufferToBase64(publicKeyBuffer);

  return { fingerprint, fullPublicKey };
}

/**
 * Signs data with the private key
 */
export async function signData(
  privateKey: CryptoKey,
  data: string
): Promise<string> {
  // Convert string to ArrayBuffer
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  // Sign with ECDSA-SHA256
  const signature = await window.crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: 'SHA-256',
    },
    privateKey,
    dataBuffer
  );

  // Return base64-encoded signature
  return arrayBufferToBase64(signature);
}
