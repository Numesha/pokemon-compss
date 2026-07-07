import { getAll, putItem } from "./indexedDb.js";

const STORE_NAME = "speciesSettings";

export function getSpeciesSettings() {
  return getAll(STORE_NAME);
}

export function saveSpeciesSetting(setting) {
  return putItem(STORE_NAME, {
    ...setting,
    updatedAt: new Date().toISOString(),
  });
}
