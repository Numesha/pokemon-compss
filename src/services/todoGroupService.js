const ACTIVE_STATUSES = new Set(["採用", "つなぎ", "謗｡逕ｨ", "縺､縺ｪ縺・"]);

export function buildIslandSleepTypeTodoGroups(todos) {
  const groupsByKey = new Map();

  for (const todo of todos) {
    for (const islandSleepType of todo.islandSleepTypes || []) {
      const islandName = islandSleepType.islandName ?? "島未設定";
      const sleepTypeId = islandSleepType.sleepTypeId ?? "NONE";
      const sleepTypeName = islandSleepType.sleepTypeName ?? "睡眠タイプ未設定";
      const key = islandSleepTypeKey({ islandName, sleepTypeId, sleepTypeName });
      if (!groupsByKey.has(key)) {
        groupsByKey.set(key, {
          islandName,
          sleepTypeId,
          sleepTypeName,
          todos: [],
        });
      }
      groupsByKey.get(key).todos.push(todo);
    }
  }

  return [...groupsByKey.values()]
    .map((group) => ({
      ...group,
      todos: sortTodos(group.todos),
    }))
    .sort((a, b) => `${a.islandName}:${a.sleepTypeName}`.localeCompare(`${b.islandName}:${b.sleepTypeName}`, "ja"));
}

export function findIslandSleepTypeTodoGroup(todos, selected) {
  if (!selected) return null;
  return buildIslandSleepTypeTodoGroups(todos).find((group) => (
    group.islandName === selected.islandName &&
    String(group.sleepTypeId) === String(selected.sleepTypeId) &&
    group.sleepTypeName === selected.sleepTypeName
  )) || {
    islandName: selected.islandName,
    sleepTypeId: selected.sleepTypeId,
    sleepTypeName: selected.sleepTypeName,
    todos: [],
  };
}

export function buildCurrentForcesForIslandSleepType({ mapper, userPokemon, roleAssignments, selected, displayName }) {
  if (!selected) return [];

  return userPokemon
    .filter((item) => isPokemonOnIslandSleepType({ mapper, pokemonId: item.pokemonId, selected }))
    .map((item) => ({
      userPokemonId: item.userPokemonId,
      pokemonId: item.pokemonId,
      displayName: displayName(item),
      level: item.level,
      trainingStatus: item.trainingStatus,
      roles: activeRoleLabels(item, roleAssignments, mapper),
    }))
    .filter((item) => item.roles.length > 0)
    .sort((a, b) => `${a.displayName}:${a.level}`.localeCompare(`${b.displayName}:${b.level}`, "ja"));
}

function islandSleepTypeKey({ islandName, sleepTypeId, sleepTypeName }) {
  return `${islandName}:${sleepTypeId}:${sleepTypeName}`;
}

function sortTodos(todos) {
  return [...todos].sort((a, b) => `${a.pokemonName}:${a.label}`.localeCompare(`${b.pokemonName}:${b.label}`, "ja"));
}

function isPokemonOnIslandSleepType({ mapper, pokemonId, selected }) {
  const species = mapper.pokemonById(pokemonId);
  if (!species) return false;

  const sleepTypeId = mapper.getValue(species, "sleepTypeId", "NONE");
  const sleepTypeName = mapper.lookupName("tblSleepType", sleepTypeId, "NONE");
  const matchesSleepType = String(sleepTypeId) === String(selected.sleepTypeId) || sleepTypeName === selected.sleepTypeName;
  if (!matchesSleepType) return false;

  return mapper.table("tblPokemonIsland").some((row) => (
    String(row["内部ID"] ?? row.pokemonId) === String(pokemonId) &&
    String(row["島名"] ?? row.islandName ?? row["島ID"] ?? "") === String(selected.islandName)
  ));
}

function activeRoleLabels(userPokemon, roleAssignments, mapper) {
  if (!ACTIVE_STATUSES.has(userPokemon.trainingStatus)) return [];

  return [
    ...roleAssignments.berryRoles
      .filter((role) => role.userPokemonId === userPokemon.userPokemonId && ACTIVE_STATUSES.has(role.roleStatus))
      .map((role) => `きのみ: ${mapper.lookupName("tblType", role.typeId, role.typeId)}`),
    ...roleAssignments.ingredientRoles
      .filter((role) => role.userPokemonId === userPokemon.userPokemonId && ACTIVE_STATUSES.has(role.roleStatus))
      .map((role) => `食材: ${mapper.lookupName("tblIngredient", role.ingredientId, role.ingredientId)} / ${role.score}`),
    ...roleAssignments.skillRoles
      .filter((role) => role.userPokemonId === userPokemon.userPokemonId && ACTIVE_STATUSES.has(role.roleStatus))
      .map((role) => `スキル: ${role.skillRole}`),
  ];
}
