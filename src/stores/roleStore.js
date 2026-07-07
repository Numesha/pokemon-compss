import { deleteItem, getAll, openDb, putItem } from "./indexedDb.js";

export const ROLE_STORES = {
  berry: "berryRoles",
  ingredient: "ingredientRoles",
  skill: "skillRoles",
};

export async function getRoleAssignments() {
  const [berryRoles, ingredientRoles, skillRoles] = await Promise.all([
    getAll(ROLE_STORES.berry),
    getAll(ROLE_STORES.ingredient),
    getAll(ROLE_STORES.skill),
  ]);
  return { berryRoles, ingredientRoles, skillRoles };
}

export async function saveRoleAssignmentsForUser(userPokemonId, assignments) {
  await deleteRoleAssignmentsForUser(userPokemonId);
  await Promise.all([
    ...assignments.berryRoles.map((role) => putItem(ROLE_STORES.berry, role)),
    ...assignments.ingredientRoles.map((role) => putItem(ROLE_STORES.ingredient, role)),
    ...assignments.skillRoles.map((role) => putItem(ROLE_STORES.skill, role)),
  ]);
}

export async function deleteRoleAssignmentsForUser(userPokemonId) {
  const db = await openDb();
  const stores = Object.values(ROLE_STORES);

  try {
    await Promise.all(stores.map((storeName) => deleteFromStore(db, storeName, userPokemonId)));
  } finally {
    db.close();
  }
}

function deleteFromStore(db, storeName, userPokemonId) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const request = store.index("userPokemonId").getAllKeys(userPokemonId);

    request.onsuccess = () => {
      for (const key of request.result || []) {
        store.delete(key);
      }
    };
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
