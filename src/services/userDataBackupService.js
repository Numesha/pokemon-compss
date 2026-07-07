import { clearStore, getAll, replaceStoreItems } from "../stores/indexedDb.js";

export const USER_DATA_STORES = [
  "userPokemon",
  "speciesSettings",
  "speciesRoleCandidates",
  "berryRoles",
  "ingredientRoles",
  "skillRoles",
  "goals",
  "todos",
];

export async function buildUserDataBackup({ appVersion, masterVersion }) {
  const userData = {};
  await Promise.all(USER_DATA_STORES.map(async (storeName) => {
    userData[storeName] = await getAll(storeName);
  }));

  return {
    appName: "ポケスリ育成コンパス",
    appVersion,
    masterVersion,
    exportedAt: new Date().toISOString(),
    userData,
  };
}

export async function restoreUserDataBackup(backup) {
  assertValidBackup(backup);

  for (const storeName of USER_DATA_STORES) {
    await replaceStoreItems(storeName, backup.userData[storeName] || []);
  }
}

export async function clearUserData() {
  for (const storeName of USER_DATA_STORES) {
    await clearStore(storeName);
  }
}

export function assertValidBackup(backup) {
  if (!backup || typeof backup !== "object") {
    throw new Error("バックアップJSONの形式が正しくありません。");
  }
  if (!backup.userData || typeof backup.userData !== "object") {
    throw new Error("userData が見つかりません。ポケスリ育成コンパスのバックアップJSONを選択してください。");
  }
  for (const storeName of USER_DATA_STORES) {
    if (backup.userData[storeName] != null && !Array.isArray(backup.userData[storeName])) {
      throw new Error(`${storeName} の形式が正しくありません。`);
    }
  }
}
