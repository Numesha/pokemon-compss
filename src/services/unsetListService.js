import { goalId } from "./goalService.js";
import { HUNT_STATUS, getSpeciesSetting } from "./speciesSettingService.js";

export function buildUnsetListItems(state) {
  return [
    ...buildRoleUnsetItems(state),
    ...buildGoalUnsetItems(state),
    ...buildSpeciesSettingUnsetItems(state),
    ...buildSpeciesCandidateUnsetItems(state),
  ];
}

function buildRoleUnsetItems(state) {
  const assignedUserIds = new Set([
    ...state.roleAssignments.berryRoles.map((role) => role.userPokemonId),
    ...state.roleAssignments.ingredientRoles.map((role) => role.userPokemonId),
    ...state.roleAssignments.skillRoles.map((role) => role.userPokemonId),
  ]);

  return state.userPokemon
    .filter((userPokemon) => !assignedUserIds.has(userPokemon.userPokemonId))
    .map((userPokemon) => {
      const species = state.mapper.pokemonById(userPokemon.pokemonId);
      return {
        id: `role:${userPokemon.userPokemonId}`,
        category: "役割未設定",
        title: userPokemon.nickname || (species ? state.mapper.pokemonName(species) : "登録個体"),
        detail: "個体に担当役割が設定されていません。",
        actionLabel: "個体を開く",
        action: {
          type: "userPokemon",
          userPokemonId: userPokemon.userPokemonId,
        },
      };
    });
}

function buildGoalUnsetItems(state) {
  const savedGoalIds = new Set((state.savedGoals || []).map((goal) => goal.goalId));
  return [
    ...state.roleProgress.berryProgress,
    ...state.roleProgress.ingredientProgress,
    ...state.roleProgress.skillProgress,
  ]
    .filter((progress) => !savedGoalIds.has(goalId(progress.kind, progress.targetId)))
    .map((progress) => ({
      id: `goal:${progress.kind}:${progress.targetId}`,
      category: "目標未設定",
      title: progress.label,
      detail: `デフォルト目標 ${progress.targetValue} を使用中です。`,
      actionLabel: "役割画面を開く",
      action: {
        type: "role",
        kind: progress.kind,
      },
    }));
}

function buildSpeciesSettingUnsetItems(state) {
  return state.mapper.table("tblPokemon")
    .map((row) => {
      const pokemonId = state.mapper.pokemonId(row);
      const setting = getSpeciesSetting(state.speciesSettings, pokemonId);
      if (setting.huntStatus !== HUNT_STATUS.unset) return null;
      return {
        id: `species-setting:${pokemonId}`,
        category: "厳選設定未設定",
        title: state.mapper.pokemonName(row),
        detail: "図鑑の厳選状態が未設定です。",
        actionLabel: "図鑑を開く",
        action: {
          type: "dex",
          pokemonId,
        },
      };
    })
    .filter(Boolean);
}

function buildSpeciesCandidateUnsetItems(state) {
  const candidatePokemonIds = new Set(state.speciesRoleCandidates.map((candidate) => String(candidate.pokemonId)));

  return state.speciesSettings
    .filter((setting) => setting.huntStatus === HUNT_STATUS.hunt && !candidatePokemonIds.has(String(setting.pokemonId)))
    .map((setting) => {
      const species = state.mapper.pokemonById(setting.pokemonId);
      return {
        id: `species-candidate:${setting.pokemonId}`,
        category: "候補未設定",
        title: species ? state.mapper.pokemonName(species) : `Pokemon ${setting.pokemonId}`,
        detail: "厳選する種族ですが、役割候補が設定されていません。",
        actionLabel: "図鑑を開く",
        action: {
          type: "dex",
          pokemonId: String(setting.pokemonId),
        },
      };
    });
}
