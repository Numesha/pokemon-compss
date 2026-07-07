import { SKILL_ROLE_OPTIONS } from "./roleService.js";

export const GOAL_KIND = {
  berry: "berry",
  ingredient: "ingredient",
  skill: "skill",
};

export const DEFAULT_GOALS = {
  berry: 1,
  ingredient: 10,
  skill: 1,
};

export function goalId(kind, targetId) {
  return `${kind}:${targetId}`;
}

export function getGoalValue(goals, kind, targetId) {
  const found = goals.find((goal) => goal.goalId === goalId(kind, targetId));
  return Number(found?.targetValue ?? DEFAULT_GOALS[kind] ?? 0);
}

export function buildDefaultGoals(mapper) {
  const now = new Date().toISOString();
  return [
    ...mapper.table("tblType").map((row) => createGoal("berry", mapper.masterOptionValue(row), DEFAULT_GOALS.berry, now)),
    ...mapper.table("tblIngredient").map((row) => createGoal("ingredient", mapper.masterOptionValue(row), DEFAULT_GOALS.ingredient, now)),
    ...SKILL_ROLE_OPTIONS.map((skillRole) => createGoal("skill", skillRole, DEFAULT_GOALS.skill, now)),
  ];
}

export function mergeGoalsWithDefaults(existingGoals, mapper) {
  const existingById = new Map(existingGoals.map((goal) => [goal.goalId, goal]));
  return buildDefaultGoals(mapper).map((defaultGoal) => existingById.get(defaultGoal.goalId) || defaultGoal);
}

function createGoal(kind, targetId, targetValue, timestamp) {
  return {
    goalId: goalId(kind, targetId),
    kind,
    targetId,
    targetValue,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
