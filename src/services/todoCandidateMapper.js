import { HUNT_STATUS, getSpeciesSetting } from "./speciesSettingService.js";

export function buildTodoCandidates({ mapper, roleProgress, speciesSettings, speciesRoleCandidates }) {
  const progressItems = [
    ...roleProgress.berryProgress,
    ...roleProgress.ingredientProgress,
    ...roleProgress.skillProgress,
  ];

  return progressItems
    .filter((progressItem) => progressItem.shortage > 0)
    .flatMap((progressItem) => matchingSpeciesCandidates(progressItem, speciesRoleCandidates)
      .map((candidate) => buildCandidate(progressItem, candidate, mapper, speciesSettings))
      .filter(Boolean))
    .filter(uniqueCandidate());
}

function matchingSpeciesCandidates(progressItem, speciesRoleCandidates = []) {
  return speciesRoleCandidates.filter((candidate) => (
    candidate.kind === progressItem.kind && String(candidate.targetId) === String(progressItem.targetId)
  ));
}

function buildCandidate(progressItem, speciesCandidate, mapper, speciesSettings) {
  const pokemonId = String(speciesCandidate.pokemonId || "");
  if (!pokemonId) return null;

  const setting = getSpeciesSetting(speciesSettings, pokemonId);
  if (setting.huntStatus !== HUNT_STATUS.hunt) return null;

  const species = mapper.pokemonById(pokemonId);
  if (!species) return null;

  const islandSleepTypes = buildIslandSleepTypes(species, mapper);
  if (islandSleepTypes.length === 0) return null;

  return {
    candidateId: speciesCandidate.candidateId,
    kind: progressItem.kind,
    targetId: progressItem.targetId,
    targetLabel: progressItem.label,
    shortage: progressItem.shortage,
    pokemonId,
    pokemonName: mapper.pokemonName(species),
    evolutionGroupId: mapper.getValue(species, "evolutionGroupId", "NONE"),
    previousPokemonId: mapper.getValue(species, "previousPokemonId", "NONE"),
    variationId: mapper.getValue(species, "variationId", "DEFAULT"),
    sleepTypeId: mapper.getValue(species, "sleepTypeId", "NONE"),
    sleepTypeName: mapper.lookupName("tblSleepType", mapper.getValue(species, "sleepTypeId"), "NONE"),
    islandSleepTypes,
  };
}

function buildIslandSleepTypes(species, mapper) {
  const pokemonId = mapper.pokemonId(species);
  const sleepTypeId = mapper.getValue(species, "sleepTypeId", "NONE");
  const sleepTypeName = mapper.lookupName("tblSleepType", sleepTypeId, "NONE");
  return mapper.table("tblPokemonIsland")
    .filter((row) => String(row["内部ID"] ?? row.pokemonId) === pokemonId)
    .map((row) => ({
      islandName: row["島名"] ?? row.islandName ?? row["島ID"] ?? "NONE",
      sleepTypeId,
      sleepTypeName,
    }));
}

function uniqueCandidate() {
  const seen = new Set();
  return (candidate) => {
    const key = `${candidate.kind}:${candidate.targetId}:${candidate.pokemonId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  };
}
