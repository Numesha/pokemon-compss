import { getGoalValue } from "./goalService.js";

const ACTIVE_STATUSES = new Set(["採用", "つなぎ"]);

export function calculateRoleProgress({ goals, mapper, roleAssignments, userPokemon }) {
  const userById = new Map(userPokemon.map((item) => [item.userPokemonId, item]));
  return {
    berryProgress: calculateBerryProgress({ goals, mapper, roleAssignments, userById }),
    ingredientProgress: calculateIngredientProgress({ goals, mapper, roleAssignments, userById }),
    skillProgress: calculateSkillProgress({ goals, roleAssignments, userById }),
  };
}

function calculateBerryProgress({ goals, mapper, roleAssignments, userById }) {
  return mapper.table("tblType").map((row) => {
    const typeId = mapper.masterOptionValue(row);
    const assignments = roleAssignments.berryRoles.filter((role) => role.typeId === typeId);
    const currentValue = assignments.filter((role) => isActiveRole(role, userById)).length;
    const targetValue = getGoalValue(goals, "berry", typeId);
    return buildProgressItem({
      kind: "berry",
      targetId: typeId,
      label: mapper.lookupName("tblType", typeId, typeId),
      targetValue,
      currentValue,
      assignmentCount: assignments.length,
    });
  });
}

function calculateIngredientProgress({ goals, mapper, roleAssignments, userById }) {
  return mapper.table("tblIngredient").map((row) => {
    const ingredientId = mapper.masterOptionValue(row);
    const assignments = roleAssignments.ingredientRoles.filter((role) => role.ingredientId === ingredientId);
    const currentValue = assignments
      .filter((role) => isActiveRole(role, userById))
      .reduce((sum, role) => sum + Number(role.score || 0), 0);
    const targetValue = getGoalValue(goals, "ingredient", ingredientId);
    return buildProgressItem({
      kind: "ingredient",
      targetId: ingredientId,
      label: mapper.lookupName("tblIngredient", ingredientId, ingredientId),
      targetValue,
      currentValue,
      assignmentCount: assignments.length,
    });
  });
}

function calculateSkillProgress({ goals, roleAssignments, userById }) {
  const skillRoles = [...new Set([
    "回復",
    "料理チャンス",
    "料理パワーアップ",
    "ゆめのかけら",
    "エナジー",
    "食材補助",
    ...roleAssignments.skillRoles.map((role) => role.skillRole),
  ])];

  return skillRoles.map((skillRole) => {
    const assignments = roleAssignments.skillRoles.filter((role) => role.skillRole === skillRole);
    const currentValue = assignments.filter((role) => isActiveRole(role, userById)).length;
    const targetValue = getGoalValue(goals, "skill", skillRole);
    return buildProgressItem({
      kind: "skill",
      targetId: skillRole,
      label: skillRole,
      targetValue,
      currentValue,
      assignmentCount: assignments.length,
    });
  });
}

function isActiveRole(role, userById) {
  const userPokemon = userById.get(role.userPokemonId);
  return Boolean(userPokemon) && ACTIVE_STATUSES.has(userPokemon.trainingStatus) && ACTIVE_STATUSES.has(role.roleStatus);
}

function buildProgressItem({ kind, targetId, label, targetValue, currentValue, assignmentCount }) {
  const shortage = Math.max(0, targetValue - currentValue);
  return {
    kind,
    targetId,
    label,
    targetValue,
    currentValue,
    shortage,
    assignmentCount,
    isAchieved: shortage === 0,
  };
}
