import { getAll, openDb, putItem } from "./indexedDb.js";

const STORE_NAME = "speciesRoleCandidates";

export function getSpeciesRoleCandidates() {
  return getAll(STORE_NAME);
}

export async function saveSpeciesRoleCandidatesForPokemon(pokemonId, candidates) {
  await deleteSpeciesRoleCandidatesForPokemon(pokemonId);
  await Promise.all(candidates.map((candidate) => putItem(STORE_NAME, candidate)));
}

export async function deleteSpeciesRoleCandidatesForPokemon(pokemonId) {
  const db = await openDb();

  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.index("pokemonId").getAllKeys(String(pokemonId));

      request.onsuccess = () => {
        for (const key of request.result || []) {
          store.delete(key);
        }
      };
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
