import { ChatSession, Config, Workflow } from '../types';

const DB_NAME = 'ChatDB';
const DB_VERSION = 10; // Increment significantly to ensure upgrade
const SESSIONS_STORE = 'sessions';
const CONFIG_STORE = 'config';
const WORKFLOWS_STORE = 'workflows';
const OLD_ASSISTANTS_STORE = 'assistants';

export const initDB = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Error opening database'));
    };

    request.onsuccess = () => {
      resolve();
    };

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const oldVersion = event.oldVersion;
      
      // Create stores if they don't exist
      if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
        db.createObjectStore(SESSIONS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(CONFIG_STORE)) {
        db.createObjectStore(CONFIG_STORE, { keyPath: 'id' });
      }

      // Handle migration from assistants to workflows
      if (oldVersion < DB_VERSION) {
        // Create new workflows store if it doesn't exist
        if (!db.objectStoreNames.contains(WORKFLOWS_STORE)) {
          db.createObjectStore(WORKFLOWS_STORE, { keyPath: 'id' });
        }

        // If old store exists, migrate data
        if (db.objectStoreNames.contains(OLD_ASSISTANTS_STORE)) {
          const transaction = request.transaction;
          if (transaction) {
            try {
              const assistantsStore = transaction.objectStore(OLD_ASSISTANTS_STORE);
              const workflowsStore = transaction.objectStore(WORKFLOWS_STORE);

              assistantsStore.openCursor().onsuccess = (cursorEvent: any) => {
                const cursor = cursorEvent.target.result;
                if (cursor) {
                  const assistant = cursor.value;
                  const workflow = {
                    id: assistant.id,
                    name: assistant.name,
                    createdTime: assistant.createdTime,
                    deleted: assistant.deleted,
                    nodes: assistant.workflow?.nodes || [],
                    connections: assistant.workflow?.connections || []
                  };
                  workflowsStore.add(workflow);
                  cursor.continue();
                } else {
                  // No more data to migrate
                  db.deleteObjectStore(OLD_ASSISTANTS_STORE);
                }
              };
            } catch (error) {
              console.error('Error during migration:', error);
              // If migration fails, ensure we at least have the new store
              if (!db.objectStoreNames.contains(WORKFLOWS_STORE)) {
                db.createObjectStore(WORKFLOWS_STORE, { keyPath: 'id' });
              }
            }
          }
        }
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

export const getAllWorkflows = (): Promise<Workflow[]> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME);

    request.onerror = () => {
      reject(new Error('Error opening database'));
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      try {
        const transaction = db.transaction(WORKFLOWS_STORE, 'readonly');
        const store = transaction.objectStore(WORKFLOWS_STORE);
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = () => {
          resolve(getAllRequest.result || []);
        };

        getAllRequest.onerror = () => {
          reject(new Error('Error getting workflows'));
        };
      } catch (error) {
        // If there's an error accessing the store, return an empty array
        console.error('Error accessing workflows store:', error);
        resolve([]);
      }
    };
  });
};

export const updateWorkflow = (workflow: Workflow): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME);

    request.onerror = () => {
      reject(new Error('Error opening database'));
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      try {
        const transaction = db.transaction(WORKFLOWS_STORE, 'readwrite');
        const store = transaction.objectStore(WORKFLOWS_STORE);
        const updateRequest = store.put(workflow);

        updateRequest.onsuccess = () => {
          resolve();
        };

        updateRequest.onerror = () => {
          reject(new Error('Error updating workflow'));
        };
      } catch (error) {
        reject(new Error('Error accessing workflows store'));
      }
    };
  });
};
