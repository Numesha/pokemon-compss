import { deleteItem, getAll, putItem } from "./indexedDb.js";

const STORE_NAME = "todos";

export function getTodos() {
  return getAll(STORE_NAME);
}

export async function replaceGeneratedTodos(todos) {
  const existing = await getTodos();
  const generated = existing.filter((todo) => todo.source === "roleProgress");
  await Promise.all(generated.map((todo) => deleteItem(STORE_NAME, todo.todoId)));
  await Promise.all(todos.map((todo) => putItem(STORE_NAME, todo)));
}
