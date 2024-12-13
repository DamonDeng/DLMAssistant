import { ChatSession, Config, Assistant } from '../types';

const DB_NAME = 'ChatDB';
const DB_VERSION = 3;
const SESSIONS_STORE = 'sessions';
const CONFIG_STORE = 'config';
const ASSISTANTS_STORE = 'assistants';

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
      if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
        db.createObjectStore(SESSIONS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(CONFIG_STORE)) {
        db.createObjectStore(CONFIG_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(ASSISTANTS_STORE)) {
        db.createObjectStore(ASSISTANTS_STORE, { keyPath: 'id' });
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
      const transaction = db.transaction(SESSIONS_STORE, 'readonly');
      const store = transaction.objectStore(SESSIONS_STORE);
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
      const transaction = db.transaction(SESSIONS_STORE, 'readwrite');
      const store = transaction.objectStore(SESSIONS_STORE);
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

export const getConfig = (): Promise<Config | null> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME);

    request.onerror = () => {
      reject(new Error('Error opening database'));
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(CONFIG_STORE, 'readonly');
      const store = transaction.objectStore(CONFIG_STORE);
      const getRequest = store.get('config');

      getRequest.onsuccess = () => {
        resolve(getRequest.result || null);
      };

      getRequest.onerror = () => {
        reject(new Error('Error getting config'));
      };
    };
  });
};

export const updateConfig = (config: Config): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME);

    request.onerror = () => {
      reject(new Error('Error opening database'));
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(CONFIG_STORE, 'readwrite');
      const store = transaction.objectStore(CONFIG_STORE);
      const configWithId = { ...config, id: 'config' };
      const updateRequest = store.put(configWithId);

      updateRequest.onsuccess = () => {
        resolve();
      };

      updateRequest.onerror = () => {
        reject(new Error('Error updating config'));
      };
    };
  });
};

export const getAllAssistants = (): Promise<Assistant[]> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME);

    request.onerror = () => {
      reject(new Error('Error opening database'));
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(ASSISTANTS_STORE, 'readonly');
      const store = transaction.objectStore(ASSISTANTS_STORE);
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result);
      };

      getAllRequest.onerror = () => {
        reject(new Error('Error getting assistants'));
      };
    };
  });
};

export const updateAssistant = (assistant: Assistant): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME);

    request.onerror = () => {
      reject(new Error('Error opening database'));
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(ASSISTANTS_STORE, 'readwrite');
      const store = transaction.objectStore(ASSISTANTS_STORE);
      const updateRequest = store.put(assistant);

      updateRequest.onsuccess = () => {
        resolve();
      };

      updateRequest.onerror = () => {
        reject(new Error('Error updating assistant'));
      };
    };
  });
};
