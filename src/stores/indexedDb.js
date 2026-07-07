const DB_NAME = "pokesuri-compass";
const DB_VERSION = 6;

const STORES = {
  userPokemon: { keyPath: "userPokemonId", indexes: [["pokemonId", "pokemonId"]] },
  speciesSettings: { keyPath: "pokemonId", indexes: [["huntStatus", "huntStatus"]] },
  speciesRoleCandidates: { keyPath: "candidateId", indexes: [["pokemonId", "pokemonId"], ["kind", "kind"], ["targetId", "targetId"]] },
  berryRoles: { keyPath: "assignmentId", indexes: [["userPokemonId", "userPokemonId"], ["typeId", "typeId"]] },
  ingredientRoles: { keyPath: "assignmentId", indexes: [["userPokemonId", "userPokemonId"], ["ingredientId", "ingredientId"]] },
  skillRoles: { keyPath: "assignmentId", indexes: [["userPokemonId", "userPokemonId"], ["skillRole", "skillRole"]] },
  goals: { keyPath: "goalId", indexes: [["kind", "kind"], ["targetId", "targetId"]] },
  todos: { keyPath: "todoId", indexes: [["source", "source"], ["status", "status"], ["kind", "kind"], ["targetId", "targetId"]] },
  masterMeta: { keyPath: "key", indexes: [] },
};

export function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const [storeName, config] of Object.entries(STORES)) {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: config.keyPath });
          for (const [indexName, keyPath] of config.indexes) {
            store.createIndex(indexName, keyPath, { unique: false });
          }
        }
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAll(storeName) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(storeName, "readonly").objectStore(storeName).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  }).finally(() => db.close());
}

export async function putItem(storeName, item) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(storeName, "readwrite").objectStore(storeName).put(item);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  }).finally(() => db.close());
}

export async function deleteItem(storeName, key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(storeName, "readwrite").objectStore(storeName).delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  }).finally(() => db.close());
}

export async function clearStore(storeName) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(storeName, "readwrite").objectStore(storeName).clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  }).finally(() => db.close());
}

export async function replaceStoreItems(storeName, items) {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    store.clear();
    for (const item of items || []) {
      store.put(item);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  }).finally(() => db.close());
}
