const ACTIVE_STATUSES = new Set(["採用", "つなぎ", "育成中", "育成予定", "候補"]);

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

export function buildCurrentForcesForIslandTypes({ mapper, userPokemon, roleAssignments, typeIds, displayName }) {
  const targetTypes = new Set((typeIds || []).flatMap((typeId) => {
    const typeName = mapper.lookupName("tblType", typeId, typeId);
    return [String(typeId), String(typeName)];
  }));

  return userPokemon
    .map((item) => ({
      userPokemonId: item.userPokemonId,
      pokemonId: item.pokemonId,
      displayName: displayName(item),
      level: item.level,
      trainingStatus: item.trainingStatus,
      roles: islandForceRoleLabels(item, roleAssignments, mapper, targetTypes),
    }))
    .filter((item) => item.roles.length > 0)
    .sort((a, b) => `${a.displayName}:${a.level}`.localeCompare(`${b.displayName}:${b.level}`, "ja"));
}

export function favoriteTypeIdsForIsland(mapper, islandName, selectedTypeIds = []) {
  const island = mapper.table("tblIsland").find((row) => String(row.名前 ?? row.name) === String(islandName));
  if (!island) return selectedTypeIds;
  if ((island.FavoriteTypeMode ?? "") === "RANDOM") return selectedTypeIds;
  const islandId = mapper.rowId(island);
  return mapper.table("tblIslandFavoriteType")
    .filter((row) => String(row["島ID"] ?? row.islandId) === String(islandId))
    .map((row) => row["タイプID"] ?? row.typeId)
    .filter(Boolean);
}

export function appearingPokemonForIsland(mapper, islandName) {
  return mapper.table("tblPokemonIsland")
    .filter((row) => String(row["島名"] ?? row.islandName ?? row["島ID"] ?? "") === String(islandName))
    .map((row) => mapper.pokemonById(row["内部ID"] ?? row.pokemonId))
    .filter(Boolean)
    .filter((row, index, rows) => rows.findIndex((item) => mapper.pokemonId(item) === mapper.pokemonId(row)) === index)
    .sort((a, b) => Number(mapper.getValue(a, "dexNo", 0)) - Number(mapper.getValue(b, "dexNo", 0)));
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

function islandForceRoleLabels(userPokemon, roleAssignments, mapper, targetTypes) {
  if (!ACTIVE_STATUSES.has(userPokemon.trainingStatus)) return [];

  const berryRoles = roleAssignments.berryRoles
    .filter((role) => role.userPokemonId === userPokemon.userPokemonId && ACTIVE_STATUSES.has(role.roleStatus))
    .filter((role) => targetTypes.has(String(role.typeId)) || targetTypes.has(String(mapper.lookupName("tblType", role.typeId, role.typeId))))
    .map((role) => `きのみ: ${mapper.lookupName("tblType", role.typeId, role.typeId)}`);

  const energyRoles = roleAssignments.skillRoles
    .filter((role) => role.userPokemonId === userPokemon.userPokemonId && ACTIVE_STATUSES.has(role.roleStatus))
    .filter((role) => role.skillRole === "エナジー" && role.targetTypeId)
    .filter((role) => targetTypes.has(String(role.targetTypeId)) || targetTypes.has(String(mapper.lookupName("tblType", role.targetTypeId, role.targetTypeId))))
    .map((role) => `エナジー: ${mapper.lookupName("tblType", role.targetTypeId, role.targetTypeId)}`);

  return [...berryRoles, ...energyRoles];
}
