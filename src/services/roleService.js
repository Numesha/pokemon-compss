export const ROLE_STATUS_OPTIONS = ["候補", "つなぎ", "採用"];

export const SKILL_ROLE_OPTIONS = [
  "回復",
  "料理チャンス",
  "料理パワーアップ",
  "ゆめのかけら",
  "エナジー",
  "食材補助",
];

export function getEmptyRoleAssignments() {
  return {
    berryRoles: [],
    ingredientRoles: [],
    skillRoles: [],
  };
}

export function getRoleAssignmentsForUser(userPokemonId, roleAssignments) {
  const roles = roleAssignments || getEmptyRoleAssignments();
  return {
    berryRoles: roles.berryRoles.filter((role) => role.userPokemonId === userPokemonId),
    ingredientRoles: roles.ingredientRoles.filter((role) => role.userPokemonId === userPokemonId),
    skillRoles: roles.skillRoles.filter((role) => role.userPokemonId === userPokemonId),
  };
}

export function buildRoleSummary(userPokemonId, roleAssignments, mapper) {
  const roles = getRoleAssignmentsForUser(userPokemonId, roleAssignments);
  return [
    ...roles.berryRoles.map((role) => ({
      kind: "berry",
      icon: "🍓",
      label: `${mapper.lookupName("tblType", role.typeId, role.typeId)}タイプ担当`,
      status: role.roleStatus,
    })),
    ...roles.ingredientRoles.map((role) => ({
      kind: "ingredient",
      icon: "🌽",
      label: `${mapper.lookupName("tblIngredient", role.ingredientId, role.ingredientId)}（${role.score}）`,
      status: role.roleStatus,
    })),
    ...roles.skillRoles.map((role) => ({
      kind: "skill",
      icon: "✨",
      label: role.skillRole === "エナジー" && role.targetTypeId
        ? `エナジー / ${mapper.lookupName("tblType", role.targetTypeId, role.targetTypeId)}`
        : role.skillRole,
      status: role.roleStatus,
    })),
  ];
}

export function buildRoleAssignmentsFromForm(userPokemonId, formData) {
  const createdAt = new Date().toISOString();
  const berryTypeId = String(formData.get("berryTypeId") || "NONE");
  const berryStatus = String(formData.get("berryRoleStatus") || "採用");
  const berryRoles = berryTypeId === "NONE"
    ? []
    : [{
        assignmentId: `berry_role_${crypto.randomUUID()}`,
        userPokemonId,
        typeId: berryTypeId,
        roleStatus: berryStatus,
        createdAt,
        updatedAt: createdAt,
      }];

  const ingredientRoles = [1, 2, 3]
    .map((index) => {
      const ingredientId = String(formData.get(`ingredientRole${index}`) || "NONE");
      const score = Number(formData.get(`ingredientScore${index}`) || 0);
      const roleStatus = String(formData.get(`ingredientRoleStatus${index}`) || "採用");
      if (ingredientId === "NONE" || score <= 0) return null;
      return {
        assignmentId: `ingredient_role_${crypto.randomUUID()}`,
        userPokemonId,
        ingredientId,
        score,
        roleStatus,
        createdAt,
        updatedAt: createdAt,
      };
    })
    .filter(Boolean);

  const skillRoles = [1, 2]
    .map((index) => {
      const skillRole = String(formData.get(`skillRole${index}`) || "NONE");
      const targetTypeId = String(formData.get(`skillTargetType${index}`) || "NONE");
      const roleStatus = String(formData.get(`skillRoleStatus${index}`) || "採用");
      if (skillRole === "NONE") return null;
      return {
        assignmentId: `skill_role_${crypto.randomUUID()}`,
        userPokemonId,
        skillRole,
        targetTypeId: skillRole === "エナジー" && targetTypeId !== "NONE" ? targetTypeId : null,
        roleStatus,
        createdAt,
        updatedAt: createdAt,
      };
    })
    .filter(Boolean);

  return { berryRoles, ingredientRoles, skillRoles };
}
