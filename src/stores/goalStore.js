import { getAll, putItem } from "./indexedDb.js";

const STORE_NAME = "goals";

export function getGoals() {
  return getAll(STORE_NAME);
}

export function saveGoal(goal) {
  return putItem(STORE_NAME, {
    ...goal,
    updatedAt: new Date().toISOString(),
  });
}

export async function saveGoals(goals) {
  await Promise.all(goals.map((goal) => saveGoal(goal)));
}
