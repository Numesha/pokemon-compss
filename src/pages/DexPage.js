import { displayUserPokemonName, normalizeText } from "../master/masterMapper.js";
import { buildSpeciesSettingFromForm, getSpeciesSetting, HUNT_STATUS, HUNT_STATUS_OPTIONS } from "../services/speciesSettingService.js";
import { buildSpeciesRoleCandidatesFromForm, getSpeciesRoleCandidatesForPokemon } from "../services/speciesRoleCandidateService.js";
import { SKILL_ROLE_OPTIONS } from "../services/roleService.js";
import { saveSpeciesRoleCandidatesForPokemon } from "../stores/speciesRoleCandidateStore.js";
import { saveSpeciesSetting } from "../stores/speciesSettingStore.js";
import { escapeHtml, option } from "../utils/html.js";

export function renderDexPage({ state, view, actions }) {
  const mapper = state.mapper;
  const pokemonRows = mapper.table("tblPokemon");
  const filtered = filteredDexRows(state);
  const selected = state.selectedDexId ? mapper.pokemonById(state.selectedDexId) : filtered[0];
  if (selected) state.selectedDexId = mapper.pokemonId(selected);

  if (state.dexDetailOpen && selected) {
    view.innerHTML = `
      <nav class="breadcrumb">図鑑 ＞ ${escapeHtml(state.mapper.pokemonDisplayName(selected))}</nav>
      <section class="page-head">
        <div>
          <h2>図鑑詳細</h2>
          <p>種族情報、厳選状態、種族役割候補を確認・編集します。</p>
        </div>
        <button class="secondary-button fixed-back-button" type="button" data-back-to-dex-list>一覧へ戻る</button>
      </section>
      ${renderDexDetail(selected, state)}
    `;
    document.querySelector("[data-back-to-dex-list]")?.addEventListener("click", () => {
      actions.backToDexList();
    });
    document.querySelectorAll("[data-user-pokemon-id]").forEach((button) => {
      button.addEventListener("click", () => actions.openUserPokemon(button.dataset.userPokemonId));
    });
    document.querySelector("#speciesSettingForm")?.addEventListener("submit", (event) => handleSpeciesSettingSave(event, state, view, actions));
    document.querySelector("#speciesRoleCandidateForm")?.addEventListener("submit", (event) => handleSpeciesRoleCandidateSave(event, state, view, actions));
    bindDirtyTracking();
    return;
  }

  view.innerHTML = `
    <nav class="breadcrumb">図鑑</nav>
    <section class="page-head">
      <div>
        <h2>図鑑</h2>
        <p>種族単位でマスター情報を確認します。</p>
      </div>
      <span id="dexCount" class="badge">${filtered.length} / ${pokemonRows.length}件</span>
    </section>
    <section class="toolbar">
      <label class="field">検索
        <input id="dexQuery" class="input" value="${escapeHtml(state.filters.dexQuery)}" placeholder="名前・タイプ・食材・スキル">
      </label>
      <label class="field">得意
        <select id="dexSpecialty" class="select">
          ${option("ALL", "すべて", state.filters.dexSpecialty)}
          ${mapper.table("tblSpecialty").map((row) => option(mapper.masterOptionValue(row), row.名前 ?? mapper.rowId(row), state.filters.dexSpecialty)).join("")}
        </select>
      </label>
      <label class="field">タイプ
        <select id="dexType" class="select">
          ${option("ALL", "すべて", state.filters.dexType)}
          ${mapper.table("tblType").map((row) => option(mapper.masterOptionValue(row), row.名前 ?? mapper.rowId(row), state.filters.dexType)).join("")}
        </select>
      </label>
      <label class="field">役割
        <select id="dexRole" class="select">
          ${renderDexRoleFilterOptions(state)}
        </select>
      </label>
    </section>
    <section id="dexGrid" class="grid">
      ${renderDexGrid(filtered, state)}
    </section>
  `;

  document.querySelector("#dexQuery").addEventListener("input", (event) => {
    state.filters.dexQuery = event.target.value;
    updateDexResults(state, actions);
  });
  document.querySelector("#dexSpecialty").addEventListener("change", (event) => {
    state.filters.dexSpecialty = event.target.value;
    renderDexPage({ state, view, actions });
  });
  document.querySelector("#dexType").addEventListener("change", (event) => {
    state.filters.dexType = event.target.value;
    renderDexPage({ state, view, actions });
  });
  document.querySelector("#dexRole").addEventListener("change", (event) => {
    state.filters.dexRole = event.target.value;
    renderDexPage({ state, view, actions });
  });
  bindDexCardEvents(state, actions);
}

function filteredDexRows(state) {
  return state.mapper.table("tblPokemon").filter((row) => matchesDexFilters(row, state));
}

function updateDexResults(state, actions) {
  const pokemonRows = state.mapper.table("tblPokemon");
  const filtered = filteredDexRows(state);
  const count = document.querySelector("#dexCount");
  const grid = document.querySelector("#dexGrid");
  if (count) count.textContent = `${filtered.length} / ${pokemonRows.length}件`;
  if (grid) grid.innerHTML = renderDexGrid(filtered, state);
  bindDexCardEvents(state, actions);
}

function bindDexCardEvents(state, actions) {
  document.querySelectorAll("[data-dex-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedDexId = button.dataset.dexId;
      actions.openDexDetail(button.dataset.dexId);
    });
  });
  document.querySelectorAll("[data-hunt-toggle]").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.stopPropagation();
      const pokemonId = button.dataset.huntToggle;
      const next = nextHuntStatus(button.dataset.huntStatus);
      const current = getSpeciesSetting(state.speciesSettings, pokemonId);
      await saveSpeciesSetting({
        ...current,
        pokemonId: String(pokemonId),
        huntStatus: next,
        updatedAt: new Date().toISOString(),
      });
      await actions.refreshSpeciesSettings();
      actions.rebuildTodoCandidates();
      await actions.regenerateTodos();
      actions.notify("保存しました");
      updateDexResults(state, actions);
    });
  });
}

function matchesDexFilters(row, state) {
  const mapper = state.mapper;
  const query = normalizeText(state.filters.dexQuery);
  const specialtyId = mapper.getValue(row, "specialtyId");
  const typeId = mapper.getValue(row, "typeId");
  if (state.filters.dexSpecialty !== "ALL" && String(specialtyId) !== state.filters.dexSpecialty) return false;
  if (state.filters.dexType !== "ALL" && String(typeId) !== state.filters.dexType) return false;
  if (!matchesDexRoleFilter(row, state)) return false;
  if (!query) return true;

  const searchText = [
    mapper.pokemonName(row),
    mapper.lookupName("tblType", typeId, ""),
    mapper.lookupName("tblSpecialty", specialtyId, ""),
    mapper.lookupName("tblIngredient", mapper.getValue(row, "ingredientA"), ""),
    mapper.lookupName("tblIngredient", mapper.getValue(row, "ingredientB"), ""),
    mapper.lookupName("tblIngredient", mapper.getValue(row, "ingredientC"), ""),
    mapper.lookupName("tblMainSkill", mapper.getValue(row, "mainSkillId"), ""),
    mapper.lookupName("tblMainSkillVariation", mapper.getValue(row, "mainSkillId"), ""),
    mapper.lookupName("tblVariation", mapper.getValue(row, "variationId"), ""),
  ].join(" ");

  return normalizeText(searchText).includes(query);
}

function matchesDexRoleFilter(row, state) {
  const filter = state.filters.dexRole || "ALL";
  if (filter === "ALL") return true;
  const pokemonId = state.mapper.pokemonId(row);
  const candidates = state.speciesRoleCandidates.filter((candidate) => String(candidate.pokemonId) === String(pokemonId));
  if (filter === "kind:berry") return candidates.some((candidate) => candidate.kind === "berry");
  if (filter === "kind:ingredient") return candidates.some((candidate) => candidate.kind === "ingredient");
  if (filter === "kind:skill") return candidates.some((candidate) => candidate.kind === "skill");
  const [kind, targetId] = filter.split(":");
  return candidates.some((candidate) => candidate.kind === kind && String(candidate.targetId) === String(targetId));
}

function renderDexRoleFilterOptions(state) {
  const selected = state.filters.dexRole || "ALL";
  const mapper = state.mapper;
  return [
    option("ALL", "すべて", selected),
    option("kind:berry", "きのみ担当候補", selected),
    option("kind:ingredient", "食材担当候補", selected),
    option("kind:skill", "スキル担当候補", selected),
    ...mapper.table("tblType").map((row) => {
      const id = mapper.masterOptionValue(row);
      return option(`berry:${id}`, `${mapper.lookupName("tblType", id, id)}タイプ`, selected);
    }),
    ...mapper.table("tblIngredient").map((row) => {
      const id = mapper.masterOptionValue(row);
      return option(`ingredient:${id}`, mapper.lookupName("tblIngredient", id, id), selected);
    }),
    ...SKILL_ROLE_OPTIONS.map((skillRole) => option(`skill:${skillRole}`, skillRole, selected)),
  ].join("");
}

function renderDexGrid(filtered, state) {
  return filtered.length
    ? filtered.map((row) => renderDexCard(row, state)).join("")
    : `<div class="empty-state">条件に一致するデータがありません</div>`;
}

function renderDexCard(row, state) {
  const mapper = state.mapper;
  const vm = mapper.createDexPokemonViewModel(row, state);
  const selected = String(state.selectedDexId) === vm.pokemonId;
  const speciesSetting = getSpeciesSetting(state.speciesSettings, vm.pokemonId);
  return `
    <article class="card" aria-current="${selected ? "true" : "false"}">
      <div class="card-title">
        <button class="link-button" data-dex-id="${escapeHtml(vm.pokemonId)}" type="button">${escapeHtml(vm.displayName)}</button>
        <span class="chip">No.${escapeHtml(vm.dexNo)}</span>
      </div>
      <ul class="meta-list">
        <li>${escapeHtml(vm.specialtyName)}</li>
        <li>${escapeHtml(vm.typeName)}</li>
        <li>登録 ${vm.ownedCount}匹 / 採用 ${vm.adoptedCount}匹</li>
      </ul>
      <button class="secondary-button hunt-toggle" type="button" data-hunt-toggle="${escapeHtml(vm.pokemonId)}" data-hunt-status="${escapeHtml(speciesSetting.huntStatus)}">
        厳選: ${escapeHtml(speciesSetting.huntStatus)}
      </button>
    </article>
  `;
}

function nextHuntStatus(current) {
  const order = [HUNT_STATUS.unset, HUNT_STATUS.hunt, HUNT_STATUS.exclude, HUNT_STATUS.hold];
  const index = order.indexOf(current);
  return order[(index + 1) % order.length] || HUNT_STATUS.unset;
}

function renderDexDetail(row, state) {
  const mapper = state.mapper;
  const vm = mapper.createDexPokemonViewModel(row, state);
  const speciesSetting = getSpeciesSetting(state.speciesSettings, vm.pokemonId);
  const speciesRoleCandidates = getSpeciesRoleCandidatesForPokemon(vm.pokemonId, state.speciesRoleCandidates);
  const islands = mapper.table("tblPokemonIsland").filter((item) => String(item["内部ID"] ?? item.pokemonId) === vm.pokemonId);
  return `
    <section class="panel">
      <h3>${escapeHtml(vm.displayName)}</h3>
      <div class="detail-grid">
        <div class="detail-item"><span>図鑑No.</span>${escapeHtml(vm.dexNo)}</div>
        <div class="detail-item"><span>得意</span>${escapeHtml(vm.specialtyName)}</div>
        <div class="detail-item"><span>タイプ</span>${escapeHtml(vm.typeName)}</div>
        <div class="detail-item"><span>睡眠タイプ</span>${escapeHtml(vm.sleepTypeName)}</div>
        <div class="detail-item"><span>メインスキル</span>${escapeHtml(vm.mainSkillName)}</div>
        <div class="detail-item"><span>バリエーション</span>${escapeHtml(vm.variationName)}</div>
      </div>
    </section>
    <details class="panel fold-panel">
      <summary>厳選状態</summary>
      <form id="speciesSettingForm" class="form-grid">
        <label>状態
          <select class="select" name="huntStatus">
            ${HUNT_STATUS_OPTIONS.map((status) => option(status, status, speciesSetting.huntStatus)).join("")}
          </select>
        </label>
        <label class="wide">メモ
          <textarea class="textarea" name="speciesMemo" placeholder="自由入力">${escapeHtml(speciesSetting.memo || "")}</textarea>
        </label>
        <div class="button-row wide">
          <button class="primary-button" type="submit">図鑑設定を保存</button>
        </div>
      </form>
    </details>
    <details class="panel fold-panel">
      <summary>種族役割候補</summary>
      ${renderSpeciesRoleCandidateForm(speciesRoleCandidates, state)}
    </details>
    <section class="panel">
      <h3>食材候補</h3>
      <ul class="meta-list">
        <li>Lv1 ${escapeHtml(vm.ingredientAName)}</li>
        <li>Lv30 ${escapeHtml(vm.ingredientBName)}</li>
        <li>Lv60 ${escapeHtml(vm.ingredientCName)}</li>
      </ul>
    </section>
    <section class="panel">
      <h3>出現情報</h3>
      ${
        islands.length
          ? `<ul class="meta-list">${islands.map((island) => `<li>${escapeHtml(island["島名"] ?? island.islandName ?? island["島ID"] ?? "島未設定")} / ${escapeHtml(vm.sleepTypeName)}</li>`).join("")}</ul>`
          : `<p class="muted">出現島は未登録です。</p>`
      }
    </section>
    <section class="panel">
      <h3>登録個体</h3>
      ${
        vm.ownedPokemon.length
          ? `<div class="grid pokemon-grid">${vm.ownedPokemon.map((userPokemon) => renderOwnedSmallCard(userPokemon, state)).join("")}</div>`
          : `<p class="muted">この種族の登録個体はまだありません。</p>`
      }
    </section>
    <section class="panel">
      <h3>現在担当</h3>
      ${
        vm.roleSummary.length
          ? `<ul class="meta-list">${vm.roleSummary.map((role) => `<li>${role.icon} ${escapeHtml(role.label)}</li>`).join("")}</ul>`
          : `<p class="muted">未設定</p>`
      }
    </section>
  `;
}

function renderSpeciesRoleCandidateForm(candidates, state) {
  const mapper = state.mapper;
  const berryCandidate = candidates.find((candidate) => candidate.kind === "berry");
  const ingredientCandidates = candidates.filter((candidate) => candidate.kind === "ingredient");
  const skillCandidates = candidates.filter((candidate) => candidate.kind === "skill");

  while (ingredientCandidates.length < 3) ingredientCandidates.push(null);
  while (skillCandidates.length < 2) skillCandidates.push(null);

  return `
    <form id="speciesRoleCandidateForm" class="form-grid">
      <label>きのみタイプ
        <select class="select" name="speciesBerryTypeId">
          ${option("NONE", "未設定", berryCandidate?.targetId ?? "NONE")}
          ${mapper.table("tblType").map((row) => option(mapper.masterOptionValue(row), row.名前 ?? mapper.rowId(row), berryCandidate?.targetId ?? "NONE")).join("")}
        </select>
      </label>
      ${ingredientCandidates.map((candidate, index) => `
        <label>食材候補${index + 1}
          <select class="select" name="speciesIngredientRole${index + 1}">
            ${option("NONE", "未設定", candidate?.targetId ?? "NONE")}
            ${mapper.table("tblIngredient").map((row) => option(mapper.masterOptionValue(row), row.名前 ?? mapper.rowId(row), candidate?.targetId ?? "NONE")).join("")}
          </select>
        </label>
      `).join("")}
      ${skillCandidates.map((candidate, index) => `
        <label>スキル候補${index + 1}
          <select class="select" name="speciesSkillRole${index + 1}">
            ${option("NONE", "未設定", candidate?.targetId ?? "NONE")}
            ${SKILL_ROLE_OPTIONS.map((skillRole) => option(skillRole, skillRole, candidate?.targetId ?? "NONE")).join("")}
          </select>
        </label>
      `).join("")}
      <div class="button-row wide">
        <button class="primary-button" type="submit">役割候補を保存</button>
      </div>
    </form>
  `;
}

async function handleSpeciesSettingSave(event, state, view, actions) {
  event.preventDefault();
  const pokemonId = state.selectedDexId;
  if (!pokemonId) return;
  await saveSpeciesSetting(buildSpeciesSettingFromForm(pokemonId, new FormData(event.target)));
  await actions.refreshSpeciesSettings();
  actions.rebuildTodoCandidates();
  await actions.regenerateTodos();
  actions.notify("保存しました");
  event.target.dataset.dirty = "false";
  renderDexPage({ state, view, actions });
}

async function handleSpeciesRoleCandidateSave(event, state, view, actions) {
  event.preventDefault();
  const pokemonId = state.selectedDexId;
  if (!pokemonId) return;
  const candidates = buildSpeciesRoleCandidatesFromForm(pokemonId, new FormData(event.target));
  await saveSpeciesRoleCandidatesForPokemon(pokemonId, candidates);
  await actions.refreshSpeciesRoleCandidates();
  actions.rebuildTodoCandidates();
  await actions.regenerateTodos();
  actions.notify("保存しました");
  event.target.dataset.dirty = "false";
  renderDexPage({ state, view, actions });
}

function bindDirtyTracking() {
  document.querySelectorAll("form").forEach((form) => {
    form.dataset.dirty = "false";
    form.addEventListener("input", () => { form.dataset.dirty = "true"; });
    form.addEventListener("change", () => { form.dataset.dirty = "true"; });
  });
}

function renderOwnedSmallCard(userPokemon, state) {
  return `
    <button class="card" data-user-pokemon-id="${escapeHtml(userPokemon.userPokemonId)}" type="button">
      <div class="card-title">
        <strong>${escapeHtml(displayUserPokemonName(userPokemon, state))}</strong>
        <span class="chip">Lv${escapeHtml(userPokemon.level)}</span>
      </div>
      <ul class="meta-list">
        <li>${escapeHtml(userPokemon.trainingStatus)}</li>
        ${userPokemon.isFavorite ? "<li>★ お気に入り</li>" : ""}
      </ul>
    </button>
  `;
}
