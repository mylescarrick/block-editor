import type { BlockDocument } from "@/types/blocks";

// ============================================================================
// PERSISTENCE LAYER (IndexedDB)
// Uses IndexedDB for larger storage quota (~50MB+ vs localStorage's ~5MB)
// Replace with your actual backend/database for production
// ============================================================================

const DB_NAME = "block-editor";
const DB_VERSION = 1;
const STORE_NAME = "documents";

// Simulated network delay for realistic UX testing
const simulateDelay = (ms = 300) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Open IndexedDB connection
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create documents store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

/**
 * Load all documents from storage
 */
export async function loadDocuments(): Promise<BlockDocument[]> {
  await simulateDelay();

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);

      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error("Failed to load documents:", error);
    return [];
  }
}

/**
 * Load a single document by ID
 */
export async function loadDocument(id: string): Promise<BlockDocument | null> {
  await simulateDelay();

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);

      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error("Failed to load document:", error);
    return null;
  }
}

/**
 * Save a document (create or update)
 */
export async function saveDocument(
  document: BlockDocument
): Promise<BlockDocument> {
  await simulateDelay();

  const updatedDoc = {
    ...document,
    updatedAt: new Date().toISOString(),
  };

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(updatedDoc);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(updatedDoc);

      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error("Failed to save document:", error);
    throw error;
  }
}

/**
 * Delete a document by ID
 */
export async function deleteDocument(id: string): Promise<void> {
  await simulateDelay();

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();

      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error("Failed to delete document:", error);
    throw error;
  }
}

/**
 * Clear all documents (useful for debugging quota issues)
 */
export async function clearAllDocuments(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();

      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error("Failed to clear documents:", error);
    throw error;
  }
}

/**
 * Upload an image and return its URL
 * STUB: In production, upload to S3, Cloudflare R2, etc.
 */
export async function uploadImage(file: File): Promise<string> {
  await simulateDelay(500);

  // Create a local object URL for demo purposes
  // In production, upload to your storage service
  return URL.createObjectURL(file);
}
