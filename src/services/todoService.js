export const TODO_SOURCE = {
  roleProgress: "roleProgress",
};

export const TODO_STATUS = {
  open: "open",
  hold: "hold",
  done: "done",
};

export function generateTodosFromRoleProgress(roleProgress, todoCandidates = [], existingTodos = []) {
  const existingById = new Map(existingTodos.map((todo) => [todo.todoId, todo]));
  const progressItems = [
    ...roleProgress.berryProgress,
    ...roleProgress.ingredientProgress,
    ...roleProgress.skillProgress,
  ];

  return progressItems.flatMap((item) => {
    if (item.shortage <= 0) return [];
    return todoCandidates
      .filter((candidate) => candidate.kind === item.kind && candidate.targetId === item.targetId)
      .map((candidate) => buildTodoFromCandidate(item, candidate, existingById.get(todoIdForCandidate(item, candidate))));
  });
}

export function getEmptyTodos() {
  return [];
}

function buildTodoFromCandidate(progressItem, candidate, existingTodo) {
  const now = new Date().toISOString();
  return {
    todoId: todoIdForCandidate(progressItem, candidate),
    source: TODO_SOURCE.roleProgress,
    kind: progressItem.kind,
    targetId: progressItem.targetId,
    label: progressItem.label,
    pokemonId: candidate.pokemonId,
    pokemonName: candidate.pokemonName,
    evolutionGroupId: candidate.evolutionGroupId,
    previousPokemonId: candidate.previousPokemonId,
    variationId: candidate.variationId,
    sleepTypeId: candidate.sleepTypeId,
    sleepTypeName: candidate.sleepTypeName,
    islandSleepTypes: candidate.islandSleepTypes,
    currentValue: progressItem.currentValue,
    targetValue: progressItem.targetValue,
    shortage: progressItem.shortage,
    status: existingTodo?.status ?? TODO_STATUS.open,
    createdAt: existingTodo?.createdAt ?? now,
    updatedAt: now,
  };
}

function todoIdForCandidate(progressItem, candidate) {
  return `roleProgress:${progressItem.kind}:${progressItem.targetId}:${candidate.pokemonId}`;
}
