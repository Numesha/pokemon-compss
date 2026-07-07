export function getSpeciesRoleCandidatesForPokemon(pokemonId, candidates = []) {
  return candidates.filter((candidate) => String(candidate.pokemonId) === String(pokemonId));
}

export function buildSpeciesRoleCandidatesFromForm(pokemonId, formData) {
  const now = new Date().toISOString();
  const normalizedPokemonId = String(pokemonId);
  const candidates = [];

  addCandidate(candidates, normalizedPokemonId, "berry", String(formData.get("speciesBerryTypeId") || "NONE"), now);

  [1, 2, 3].forEach((index) => {
    addCandidate(
      candidates,
      normalizedPokemonId,
      "ingredient",
      String(formData.get(`speciesIngredientRole${index}`) || "NONE"),
      now,
    );
  });

  [1, 2].forEach((index) => {
    addCandidate(
      candidates,
      normalizedPokemonId,
      "skill",
      String(formData.get(`speciesSkillRole${index}`) || "NONE"),
      now,
    );
  });

  return candidates.filter(uniqueCandidate);
}

function addCandidate(candidates, pokemonId, kind, targetId, now) {
  if (!targetId || targetId === "NONE") return;
  candidates.push({
    candidateId: speciesRoleCandidateId(pokemonId, kind, targetId),
    pokemonId,
    kind,
    targetId,
    createdAt: now,
    updatedAt: now,
  });
}

function speciesRoleCandidateId(pokemonId, kind, targetId) {
  return `species_role:${pokemonId}:${kind}:${targetId}`;
}

function uniqueCandidate(candidate, index, candidates) {
  return candidates.findIndex((item) => item.candidateId === candidate.candidateId) === index;
}
