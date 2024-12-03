import { ChatSession } from '../types';

const DB_NAME = 'ChatDB';
const DB_VERSION = 1;
const STORE_NAME = 'sessions';

export const initDB = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Error opening database'));
    };

    request.onsuccess = () => {
      resolve();
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const getAllSessions = (): Promise<ChatSession[]> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME);

    request.onerror = () => {
      reject(new Error('Error opening database'));
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result);
      };

      getAllRequest.onerror = () => {
        reject(new Error('Error getting sessions'));
      };
    };
  });
};

export const updateSession = (session: ChatSession): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME);

    request.onerror = () => {
      reject(new Error('Error opening database'));
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const updateRequest = store.put(session);

      updateRequest.onsuccess = () => {
        resolve();
      };

      updateRequest.onerror = () => {
        reject(new Error('Error updating session'));
      };
    };
  });
};
