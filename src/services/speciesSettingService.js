export const HUNT_STATUS = {
  unset: "未設定",
  hunt: "厳選する",
  exclude: "厳選しない",
  hold: "保留",
};

export const HUNT_STATUS_OPTIONS = [
  HUNT_STATUS.unset,
  HUNT_STATUS.hunt,
  HUNT_STATUS.hold,
  HUNT_STATUS.exclude,
];

export function getSpeciesSetting(speciesSettings, pokemonId) {
  return speciesSettings.find((setting) => String(setting.pokemonId) === String(pokemonId)) || {
    pokemonId: String(pokemonId),
    huntStatus: HUNT_STATUS.unset,
    ingredientPatternTargets: [],
    memo: "",
  };
}

export function buildSpeciesSettingFromForm(pokemonId, formData) {
  return {
    pokemonId: String(pokemonId),
    huntStatus: String(formData.get("huntStatus") || HUNT_STATUS.unset),
    ingredientPatternTargets: [],
    memo: String(formData.get("speciesMemo") || ""),
    updatedAt: new Date().toISOString(),
  };
}
