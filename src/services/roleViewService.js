import { displayUserPokemonName } from "../master/masterMapper.js";

export const ROLE_PAGE_CONFIG = {
  berry: {
    title: "きのみ",
    description: "きのみタイプごとの目標、現在戦力、候補種族を確認します。",
    progressKey: "berryProgress",
  },
  ingredient: {
    title: "食材",
    description: "食材ごとの目標、現在戦力、候補種族を確認します。",
    progressKey: "ingredientProgress",
  },
  skill: {
    title: "スキル",
    description: "スキル役割ごとの目標、現在戦力、候補種族を確認します。",
    progressKey: "skillProgress",
  },
};

export function buildRolePageItems({ kind, state }) {
  const config = ROLE_PAGE_CONFIG[kind];
  if (!config) return [];

  return state.roleProgress[config.progressKey]
    .map((progress) => ({
      ...progress,
      assignees: buildAssignees({ kind, targetId: progress.targetId, state }),
      candidateSpecies: buildCandidateSpecies({ kind, targetId: progress.targetId, state }),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "ja"));
}

function buildAssignees({ kind, targetId, state }) {
  return matchingAssignments({ kind, targetId, roleAssignments: state.roleAssignments })
    .map((assignment) => {
      const userPokemon = state.userPokemon.find((item) => item.userPokemonId === assignment.userPokemonId);
      if (!userPokemon) return null;
      return {
        userPokemonId: userPokemon.userPokemonId,
        displayName: displayUserPokemonName(userPokemon, state),
        level: userPokemon.level,
        trainingStatus: userPokemon.trainingStatus,
        roleStatus: assignment.roleStatus,
        score: assignment.score,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.displayName.localeCompare(b.displayName, "ja"));
}

function buildCandidateSpecies({ kind, targetId, state }) {
  return state.speciesRoleCandidates
    .filter((candidate) => candidate.kind === kind && String(candidate.targetId) === String(targetId))
    .map((candidate) => {
      const species = state.mapper.pokemonById(candidate.pokemonId);
      if (!species) return null;
      const setting = state.speciesSettings.find((item) => String(item.pokemonId) === String(candidate.pokemonId));
      return {
        pokemonId: candidate.pokemonId,
        pokemonName: state.mapper.pokemonName(species),
        huntStatus: setting?.huntStatus ?? "未設定",
      };
    })
    .filter(Boolean)
    .filter(uniqueSpecies)
    .sort((a, b) => a.pokemonName.localeCompare(b.pokemonName, "ja"));
}

function matchingAssignments({ kind, targetId, roleAssignments }) {
  if (kind === "berry") {
    return roleAssignments.berryRoles.filter((role) => String(role.typeId) === String(targetId));
  }
  if (kind === "ingredient") {
    return roleAssignments.ingredientRoles.filter((role) => String(role.ingredientId) === String(targetId));
  }
  return roleAssignments.skillRoles.filter((role) => String(role.skillRole) === String(targetId));
}

function uniqueSpecies(candidate, index, candidates) {
  return candidates.findIndex((item) => String(item.pokemonId) === String(candidate.pokemonId)) === index;
}
