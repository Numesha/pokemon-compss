const columnAliases = {
  pokemonId: ["pokemonId", "内部ID", "ID"],
  dexNo: ["dexNo", "図鑑No.", "図鑑No"],
  name: ["name", "名前", "ポケモン名"],
  evolutionGroupId: ["evolutionGroupId", "系統ID"],
  previousPokemonId: ["previousPokemonId", "進化前ID"],
  variationId: ["variationId", "バリエーションID"],
  specialtyId: ["specialtyId", "得意ID"],
  typeId: ["typeId", "タイプID"],
  sleepTypeId: ["sleepTypeId", "睡眠タイプID"],
  mainSkillId: ["mainSkillId", "メインスキルID"],
  ingredientA: ["ingredientA", "食材A"],
  ingredientB: ["ingredientB", "食材B"],
  ingredientC: ["ingredientC", "食材C"],
};

export const trainingStatuses = ["未設定", "候補", "育成予定", "育成中", "つなぎ", "採用"];

import { buildRoleSummary } from "../services/roleService.js";

export function createMasterMapper(master) {
  const tables = master.tables || {};

  function table(name) {
    return tables[name] || [];
  }

  function getValue(row, key, fallback = "") {
    const aliases = columnAliases[key] || [key];
    for (const alias of aliases) {
      if (Object.prototype.hasOwnProperty.call(row, alias)) {
        return row[alias];
      }
    }
    return fallback;
  }

  function rowId(row) {
    return row.ID ?? row.Id ?? row.id ?? row["ID"] ?? row["内部ID"] ?? row["島ID"] ?? "";
  }

  function lookupName(tableName, id, fallback = "未設定") {
    if (!id || id === "NONE") return fallback;
    const found = table(tableName).find((row) => {
      const name = row.名前 ?? row.name ?? row.表示名;
      return String(rowId(row)) === String(id) || String(name) === String(id);
    });
    return found?.名前 ?? found?.name ?? found?.表示名 ?? String(id);
  }

  function masterOptionValue(row) {
    return row.名前 ?? row.name ?? row.表示名 ?? rowId(row);
  }

  function pokemonId(row) {
    return String(getValue(row, "pokemonId"));
  }

  function pokemonName(row) {
    return String(getValue(row, "name", "不明データ"));
  }

  function pokemonById(id) {
    return table("tblPokemon").find((row) => pokemonId(row) === String(id));
  }

  function skillName(id) {
    const main = lookupName("tblMainSkill", id, "");
    if (main) return main;
    return lookupName("tblMainSkillVariation", id, "未設定");
  }

  function createPokemonViewModel(userPokemon, context) {
    const species = pokemonById(userPokemon.pokemonId);
    return {
      userPokemonId: userPokemon.userPokemonId,
      pokemonId: userPokemon.pokemonId,
      displayName: displayUserPokemonName(userPokemon, context),
      species,
      speciesName: species ? pokemonName(species) : "不明データ",
      level: userPokemon.level,
      trainingStatus: userPokemon.trainingStatus,
      isFavorite: userPokemon.isFavorite,
      ingredientLv1Name: lookupName("tblIngredient", userPokemon.ingredientLv1, "未設定"),
      ingredientLv30Name: lookupName("tblIngredient", userPokemon.ingredientLv30, "未設定"),
      ingredientLv60Name: lookupName("tblIngredient", userPokemon.ingredientLv60, "未設定"),
      natureName: lookupName("tblNature", userPokemon.natureId, "未設定"),
      memo: userPokemon.memo || "",
      mainSkillLevel: userPokemon.mainSkillLevel,
      roleSummary: buildRoleSummary(userPokemon.userPokemonId, context.roleAssignments, context.mapper),
    };
  }

  function createDexPokemonViewModel(row, context) {
    const id = pokemonId(row);
    const owned = context.userPokemon.filter((item) => String(item.pokemonId) === id);
    const adopted = owned.filter((item) => item.trainingStatus === "採用");
    return {
      pokemonId: id,
      row,
      name: pokemonName(row),
      dexNo: getValue(row, "dexNo", "-"),
      specialtyName: lookupName("tblSpecialty", getValue(row, "specialtyId"), "未設定"),
      typeName: lookupName("tblType", getValue(row, "typeId"), "未設定"),
      sleepTypeName: lookupName("tblSleepType", getValue(row, "sleepTypeId"), "睡眠タイプ未設定"),
      mainSkillName: skillName(getValue(row, "mainSkillId")),
      variationName: lookupName("tblVariation", getValue(row, "variationId"), "通常"),
      ingredientAName: lookupName("tblIngredient", getValue(row, "ingredientA"), "未設定"),
      ingredientBName: lookupName("tblIngredient", getValue(row, "ingredientB"), "未設定"),
      ingredientCName: lookupName("tblIngredient", getValue(row, "ingredientC"), "未設定"),
      ownedCount: owned.length,
      adoptedCount: adopted.length,
      ownedPokemon: owned,
      roleSummary: owned.flatMap((userPokemon) => buildRoleSummary(userPokemon.userPokemonId, context.roleAssignments, context.mapper)),
    };
  }

  function createRoleCandidateViewModel(userPokemon, context) {
    const vm = createPokemonViewModel(userPokemon, context);
    return {
      userPokemonId: vm.userPokemonId,
      displayName: vm.displayName,
      speciesName: vm.speciesName,
      trainingStatus: vm.trainingStatus,
      roleSummary: vm.roleSummary,
    };
  }

  return {
    createDexPokemonViewModel,
    createPokemonViewModel,
    createRoleCandidateViewModel,
    getValue,
    lookupName,
    masterOptionValue,
    pokemonById,
    pokemonId,
    pokemonName,
    rowId,
    skillName,
    table,
  };
}

export function displayUserPokemonName(userPokemon, state) {
  if (userPokemon.nickname) return userPokemon.nickname;
  const species = state.mapper.pokemonById(userPokemon.pokemonId);
  const baseName = species ? state.mapper.pokemonName(species) : "不明データ";
  const sameSpecies = state.userPokemon
    .filter((item) => String(item.pokemonId) === String(userPokemon.pokemonId))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const index = sameSpecies.findIndex((item) => item.userPokemonId === userPokemon.userPokemonId);
  return `${baseName}${toCircledNumber(index + 1)}`;
}

export function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[ぁ-ん]/g, (char) => String.fromCharCode(char.charCodeAt(0) + 0x60));
}

export function toCircledNumber(value) {
  const numbers = ["", "①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"];
  return numbers[value] || `#${value}`;
}
