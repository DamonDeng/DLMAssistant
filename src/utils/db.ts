import { ChatSession, Config, Workflow, Assistant } from '../types';

const DB_NAME = 'ChatDB';
const DB_VERSION = 12;
const SESSIONS_STORE = 'sessions';
const CONFIG_STORE = 'config';
const WORKFLOWS_STORE = 'workflows';
const OLD_ASSISTANTS_STORE = 'assistants';
const NEW_ASSISTANTS_STORE = 'new_assistants';

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
      if (!db.objectStoreNames.contains(WORKFLOWS_STORE)) {
        db.createObjectStore(WORKFLOWS_STORE, { keyPath: 'id' });
      }

      // Always recreate the NEW_ASSISTANTS_STORE to ensure proper setup
      if (db.objectStoreNames.contains(NEW_ASSISTANTS_STORE)) {
        db.deleteObjectStore(NEW_ASSISTANTS_STORE);
      }
      db.createObjectStore(NEW_ASSISTANTS_STORE, { keyPath: 'id', autoIncrement: true });

      // Handle migration from old assistants store if it exists
      if (db.objectStoreNames.contains(OLD_ASSISTANTS_STORE)) {
        try {
          const transaction = request.transaction;
          if (transaction) {
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
                db.deleteObjectStore(OLD_ASSISTANTS_STORE);
              }
            };
          }
        } catch (error) {
          console.error('Error during migration:', error);
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

export const getAllAssistants = (): Promise<Assistant[]> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME);

    request.onerror = () => {
      reject(new Error('Error opening database'));
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      try {
        const transaction = db.transaction(NEW_ASSISTANTS_STORE, 'readonly');
        const store = transaction.objectStore(NEW_ASSISTANTS_STORE);
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = () => {
          const assistants = getAllRequest.result || [];
          resolve(assistants.filter(assistant => !assistant.deleted));
        };

        getAllRequest.onerror = () => {
          reject(new Error('Error getting assistants'));
        };
      } catch (error) {
        console.error('Error accessing assistants store:', error);
        resolve([]);
      }
    };
  });
};

export const updateAssistant = (assistant: Omit<Assistant, 'id'> & { id?: number }): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!assistant.name || !assistant.mainWorkflow) {
      reject(new Error('Assistant name and mainWorkflow are required'));
      return;
    }

    const request = indexedDB.open(DB_NAME);

    request.onerror = () => {
      reject(new Error('Error opening database'));
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      try {
        const transaction = db.transaction(NEW_ASSISTANTS_STORE, 'readwrite');
        const store = transaction.objectStore(NEW_ASSISTANTS_STORE);
        
        // Prepare the assistant data
        const assistantData = {
          name: assistant.name,
          mainWorkflow: assistant.mainWorkflow,
          createdTime: assistant.createdTime,
          updatedAt: assistant.updatedAt || Date.now()
        };

        // For new assistants (no id), use add()
        // For existing assistants, use put()
        const dbRequest = !assistant.id ? 
          store.add(assistantData) : 
          store.put({ ...assistantData, id: assistant.id });

        dbRequest.onsuccess = () => {
          resolve();
        };

        dbRequest.onerror = (error) => {
          console.error('Error in updateAssistant:', error);
          reject(new Error('Error updating assistant'));
        };
      } catch (error) {
        console.error('Error accessing assistants store:', error);
        reject(new Error('Error accessing assistants store'));
      }
    };
  });
};
