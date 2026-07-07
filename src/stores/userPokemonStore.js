import { deleteItem, getAll, putItem } from "./indexedDb.js";

const STORE_NAME = "userPokemon";

export function getUserPokemon() {
  return getAll(STORE_NAME);
}

export function saveUserPokemon(userPokemon) {
  return putItem(STORE_NAME, userPokemon);
}

export function deleteUserPokemon(userPokemonId) {
  return deleteItem(STORE_NAME, userPokemonId);
}
