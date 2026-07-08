import { displayUserPokemonName, normalizeText, trainingStatuses } from "../master/masterMapper.js";
import {
  buildRoleAssignmentsFromForm,
  getRoleAssignmentsForUser,
  ROLE_STATUS_OPTIONS,
  SKILL_ROLE_OPTIONS,
} from "../services/roleService.js";
import { deleteRoleAssignmentsForUser, saveRoleAssignmentsForUser } from "../stores/roleStore.js";
import { deleteUserPokemon, saveUserPokemon } from "../stores/userPokemonStore.js";
import { escapeHtml, option } from "../utils/html.js";

export function renderPokemonPage({ state, view, actions }) {
  const filtered = state.userPokemon.filter((userPokemon) => matchesPokemonFilters(userPokemon, state));
  const selected = state.selectedUserPokemonId
    ? state.userPokemon.find((item) => item.userPokemonId === state.selectedUserPokemonId)
    : filtered[0];
  if (selected) state.selectedUserPokemonId = selected.userPokemonId;

  if (state.pokemonDetailOpen && selected) {
    view.innerHTML = renderDetailPage(selected, state);
    bindDetailEvents(state, actions);
    bindSpeciesPickers(state);
    bindDirtyTracking();
    return;
  }

  view.innerHTML = `
    <nav class="breadcrumb">個体</nav>
    <section class="page-head">
      <div>
        <h2>個体</h2>
        <p>所持している個体を登録・確認します。</p>
      </div>
      <button id="showRegister" class="primary-button" type="button">＋ 登録</button>
    </section>
    <section id="registerPanel" class="panel ${state.registerPrefill ? "" : "hidden"}">
      <h3>個体登録</h3>
      ${state.registerPrefill ? `<p class="muted">役割画面から移動しました。登録後、個体詳細で役割を保存してください。</p>` : ""}
      ${renderRegisterForm(state)}
    </section>
    <section class="toolbar">
      <label class="field">検索
        <input id="pokemonQuery" class="input" value="${escapeHtml(state.filters.pokemonQuery)}" placeholder="名前・ニックネーム・メモ">
      </label>
      <label class="field">状態
        <select id="pokemonStatus" class="select">
          ${option("ALL", "すべて", state.filters.pokemonStatus)}
          ${trainingStatuses.map((status) => option(status, status, state.filters.pokemonStatus)).join("")}
          ${option("FAVORITE", "お気に入り", state.filters.pokemonStatus)}
        </select>
      </label>
    </section>
    <section class="split">
      <div id="pokemonGrid" class="grid pokemon-grid">
        ${renderPokemonGrid(filtered, state)}
      </div>
    </section>
  `;

  document.querySelector("#showRegister").addEventListener("click", () => {
    document.querySelector("#registerPanel").classList.toggle("hidden");
  });
  document.querySelector("#pokemonQuery").addEventListener("input", (event) => {
    state.filters.pokemonQuery = event.target.value;
    updatePokemonResults(state, actions);
  });
  document.querySelector("#pokemonStatus").addEventListener("change", (event) => {
    state.filters.pokemonStatus = event.target.value;
    renderPokemonPage({ state, view, actions });
  });
  document.querySelector("#registerForm").addEventListener("submit", (event) => handleRegister(event, state, actions));
  bindSpeciesPickers(state);
  bindDirtyTracking();
  bindUserPokemonCardEvents(state, actions);
}

function renderPokemonGrid(filtered, state) {
  return filtered.length
    ? filtered.map((userPokemon) => renderUserPokemonCard(userPokemon, state)).join("")
    : `<div class="empty-state">条件に一致するデータがありません</div>`;
}

function updatePokemonResults(state, actions) {
  const filtered = state.userPokemon.filter((userPokemon) => matchesPokemonFilters(userPokemon, state));
  const grid = document.querySelector("#pokemonGrid");
  if (grid) grid.innerHTML = renderPokemonGrid(filtered, state);
  bindUserPokemonCardEvents(state, actions);
}

function bindUserPokemonCardEvents(state, actions) {
  document.querySelectorAll("[data-user-pokemon-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedUserPokemonId = button.dataset.userPokemonId;
      actions.openPokemonDetail(button.dataset.userPokemonId);
    });
  });
}

function renderRegisterForm(state) {
  const mapper = state.mapper;
  const pokemonRows = mapper
    .table("tblPokemon")
    .slice()
    .sort((a, b) => Number(mapper.getValue(a, "dexNo", 0)) - Number(mapper.getValue(b, "dexNo", 0)));
  return `
    <form id="registerForm" class="form-grid">
      <label>種族
        ${renderSpeciesPicker("register", pokemonRows, mapper, "")}
      </label>
      <label>ニックネーム
        <input class="input" name="nickname" placeholder="未入力なら連番表示">
      </label>
      <label>Lv
        <input class="input" name="level" type="number" min="1" max="100" value="1">
      </label>
      <label>育成状態
        <select class="select" name="trainingStatus">
          ${trainingStatuses.map((status) => option(status, status, "未設定")).join("")}
        </select>
      </label>
      <label>Lv1食材
        <select id="ingredientLv1" class="select" name="ingredientLv1">${pokemonIngredientOptions(state, "", "NONE", "ingredientA")}</select>
      </label>
      <label>Lv30食材
        <select id="ingredientLv30" class="select" name="ingredientLv30">${pokemonIngredientOptions(state, "", "NONE", "ingredientB")}</select>
      </label>
      <label>Lv60食材
        <select id="ingredientLv60" class="select" name="ingredientLv60">${pokemonIngredientOptions(state, "", "NONE", "ingredientC")}</select>
      </label>
      <label>メインスキルLv
        <input class="input" name="mainSkillLevel" type="number" min="1" max="7" value="1">
      </label>
      <label>性格
        <select class="select" name="natureId">
          ${option("NONE", "未設定", "NONE")}
          ${mapper.table("tblNature").map((row) => option(mapper.masterOptionValue(row), row.名前 ?? mapper.rowId(row), "NONE")).join("")}
        </select>
      </label>
      ${renderSubSkillFields(state, {})}
      <label>お気に入り
        <select class="select" name="isFavorite">
          ${option("false", "いいえ", "false")}
          ${option("true", "はい", "false")}
        </select>
      </label>
      <label class="wide">メモ
        <textarea class="textarea" name="memo" placeholder="自由入力"></textarea>
      </label>
      <div class="button-row wide">
        <button class="primary-button" type="submit">登録する</button>
      </div>
    </form>
  `;
}

function renderSpeciesPicker(id, pokemonRows, mapper, selectedPokemonId) {
  const selected = mapper.pokemonById(selectedPokemonId);
  const selectedId = selected ? mapper.pokemonId(selected) : "";
  const selectedLabel = selected ? mapper.pokemonDisplayName(selected) : "";
  return `
    <input
      class="input"
      value="${escapeHtml(selectedLabel)}"
      placeholder="ポケモン名を入力"
      autocomplete="off"
      data-species-picker-input="${escapeHtml(id)}"
    >
    <input type="hidden" name="pokemonId" value="${escapeHtml(selectedId)}" data-species-picker-id="${escapeHtml(id)}">
    <div class="candidate-list" data-species-picker-list="${escapeHtml(id)}"></div>
  `;
}

function bindSpeciesPickers(state) {
  document.querySelectorAll("[data-species-picker-input]").forEach((input) => {
    const id = input.dataset.speciesPickerInput;
    const hidden = document.querySelector(`[data-species-picker-id="${id}"]`);
    const list = document.querySelector(`[data-species-picker-list="${id}"]`);
    if (!hidden || !list) return;

    const renderCandidates = () => {
      const query = normalizeText(input.value);
      const rows = state.mapper.table("tblPokemon")
        .filter((row) => !query || normalizeText(state.mapper.pokemonDisplayName(row)).includes(query) || normalizeText(state.mapper.pokemonName(row)).includes(query))
        .slice(0, 8);
      list.innerHTML = rows.map((row) => `
        <button
          class="secondary-button candidate-button"
          type="button"
          data-species-candidate="${escapeHtml(state.mapper.pokemonId(row))}"
          data-species-picker-target="${escapeHtml(id)}"
        >${escapeHtml(state.mapper.pokemonDisplayName(row))} / No.${escapeHtml(state.mapper.getValue(row, "dexNo", "-"))}</button>
      `).join("");
      list.querySelectorAll("[data-species-candidate]").forEach((button) => {
        button.addEventListener("click", () => selectSpeciesCandidate(button, state));
      });
    };

    input.addEventListener("input", () => {
      hidden.value = "";
      if (id === "register") resetRegisterIngredientOptions(state);
      renderCandidates();
    });
    input.addEventListener("focus", renderCandidates);
  });

}

function selectSpeciesCandidate(button, state) {
  const id = button.dataset.speciesPickerTarget;
  const pokemonId = button.dataset.speciesCandidate;
  const row = state.mapper.pokemonById(pokemonId);
  const input = document.querySelector(`[data-species-picker-input="${id}"]`);
  const hidden = document.querySelector(`[data-species-picker-id="${id}"]`);
  const list = document.querySelector(`[data-species-picker-list="${id}"]`);
  if (!row || !input || !hidden) return;
  input.value = state.mapper.pokemonDisplayName(row);
  hidden.value = pokemonId;
  if (list) list.innerHTML = "";
  if (id === "register") fillSpeciesDefaults(state);
  if (id === "edit") fillEditSpeciesDefaults(state);
}

function fillSpeciesDefaults(state) {
  const mapper = state.mapper;
  const pokemonId = document.querySelector("[data-species-picker-id='register']").value;
  const selected = mapper.pokemonById(pokemonId);
  if (!selected) return;
  setRegisterIngredientOptions(state, pokemonId);
}

function resetRegisterIngredientOptions(state) {
  setRegisterIngredientOptions(state, "");
}

function setRegisterIngredientOptions(state, pokemonId) {
  const mapper = state.mapper;
  const selected = mapper.pokemonById(pokemonId);
  const lv1 = document.querySelector("#ingredientLv1");
  const lv30 = document.querySelector("#ingredientLv30");
  const lv60 = document.querySelector("#ingredientLv60");
  if (!lv1 || !lv30 || !lv60) return;
  lv1.innerHTML = pokemonIngredientOptions(state, pokemonId, selected ? mapper.getValue(selected, "ingredientA") : "NONE", "ingredientA");
  lv30.innerHTML = pokemonIngredientOptions(state, pokemonId, selected ? mapper.getValue(selected, "ingredientB") : "NONE", "ingredientB");
  lv60.innerHTML = pokemonIngredientOptions(state, pokemonId, selected ? mapper.getValue(selected, "ingredientC") : "NONE", "ingredientC");
}

function fillEditSpeciesDefaults(state) {
  const pokemonId = document.querySelector("[data-species-picker-id='edit']")?.value;
  const mapper = state.mapper;
  const selected = mapper.pokemonById(pokemonId);
  if (!selected) return;
  document.querySelector("#editIngredientLv1").innerHTML = pokemonIngredientOptions(state, pokemonId, mapper.getValue(selected, "ingredientA"), "ingredientA");
  document.querySelector("#editIngredientLv30").innerHTML = pokemonIngredientOptions(state, pokemonId, mapper.getValue(selected, "ingredientB"), "ingredientB");
  document.querySelector("#editIngredientLv60").innerHTML = pokemonIngredientOptions(state, pokemonId, mapper.getValue(selected, "ingredientC"), "ingredientC");
}

function renderSubSkillFields(state, userPokemon) {
  const selected = {
    subSkillLv10: userPokemon.subSkillLv10 || "NONE",
    subSkillLv25: userPokemon.subSkillLv25 || "NONE",
    subSkillLv50: userPokemon.subSkillLv50 || "NONE",
    subSkillLv70: userPokemon.subSkillLv70 || "NONE",
    subSkillLv80: userPokemon.subSkillLv80 || "NONE",
  };
  return `
    <label>サブスキル Lv10
      <select class="select" name="subSkillLv10">${subSkillOptions(state, selected.subSkillLv10)}</select>
    </label>
    <label>サブスキル Lv25
      <select class="select" name="subSkillLv25">${subSkillOptions(state, selected.subSkillLv25)}</select>
    </label>
    <label>サブスキル Lv50
      <select class="select" name="subSkillLv50">${subSkillOptions(state, selected.subSkillLv50)}</select>
    </label>
    <label>サブスキル Lv70
      <select class="select" name="subSkillLv70">${subSkillOptions(state, selected.subSkillLv70)}</select>
    </label>
    <label>サブスキル Lv80
      <select class="select" name="subSkillLv80">${subSkillOptions(state, selected.subSkillLv80)}</select>
    </label>
  `;
}

function subSkillOptions(state, selectedId) {
  const mapper = state.mapper;
  const base = option("NONE", "未設定", selectedId || "NONE");
  return base + mapper.table("tblSubSkill").map((row) => option(mapper.rowId(row), row.名前 ?? mapper.rowId(row), selectedId)).join("");
}

function userPokemonFromForm(data, existing, state) {
  const now = new Date().toISOString();
  return {
    ...(existing || {}),
    userPokemonId: existing?.userPokemonId ?? `up_${crypto.randomUUID()}`,
    pokemonId: String(data.get("pokemonId")),
    nickname: String(data.get("nickname") || "").trim(),
    level: Number(data.get("level") || 1),
    isFavorite: data.get("isFavorite") === "true",
    trainingStatus: String(data.get("trainingStatus") || "未設定"),
    ingredientLv1: String(data.get("ingredientLv1") || "NONE"),
    ingredientLv30: String(data.get("ingredientLv30") || "NONE"),
    ingredientLv60: String(data.get("ingredientLv60") || "NONE"),
    mainSkillLevel: Number(data.get("mainSkillLevel") || 1),
    natureId: String(data.get("natureId") || "NONE"),
    subSkillLv10: String(data.get("subSkillLv10") || "NONE"),
    subSkillLv25: String(data.get("subSkillLv25") || "NONE"),
    subSkillLv50: String(data.get("subSkillLv50") || "NONE"),
    subSkillLv70: String(data.get("subSkillLv70") || "NONE"),
    subSkillLv80: String(data.get("subSkillLv80") || "NONE"),
    memo: String(data.get("memo") || ""),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    sortOrder: existing?.sortOrder ?? state.userPokemon.length + 1,
  };
}

async function handleRegister(event, state, actions) {
  event.preventDefault();
  const data = new FormData(event.target);
  if (!data.get("pokemonId")) {
    window.alert("候補からポケモンを選択してください。");
    return;
  }
  const item = userPokemonFromForm(data, null, state);

  await saveUserPokemon(item);
  await actions.refreshUserPokemon();
  state.selectedUserPokemonId = item.userPokemonId;
  state.pokemonDetailOpen = true;
  actions.notify("登録しました");
  renderPokemonPage({ state, view: document.querySelector("#view"), actions });
}

async function handleEditPokemon(event, state, actions) {
  event.preventDefault();
  const selected = state.userPokemon.find((item) => item.userPokemonId === state.selectedUserPokemonId);
  if (!selected) return;
  const data = new FormData(event.target);
  if (!data.get("pokemonId")) {
    window.alert("候補からポケモンを選択してください。");
    return;
  }
  const item = userPokemonFromForm(data, selected, state);
  await saveUserPokemon(item);
  await actions.refreshUserPokemon();
  state.selectedUserPokemonId = item.userPokemonId;
  actions.notify("保存しました");
  renderPokemonPage({ state, view: document.querySelector("#view"), actions });
}

function matchesPokemonFilters(userPokemon, state) {
  if (state.filters.pokemonStatus === "FAVORITE" && !userPokemon.isFavorite) return false;
  if (
    state.filters.pokemonStatus !== "ALL" &&
    state.filters.pokemonStatus !== "FAVORITE" &&
    userPokemon.trainingStatus !== state.filters.pokemonStatus
  ) {
    return false;
  }

  const query = normalizeText(state.filters.pokemonQuery);
  if (!query) return true;
  const species = state.mapper.pokemonById(userPokemon.pokemonId);
  const roleSummary = state.mapper.createRoleCandidateViewModel(userPokemon, state).roleSummary;
  const text = [
    displayUserPokemonName(userPokemon, state),
    species ? state.mapper.pokemonName(species) : "",
    userPokemon.trainingStatus,
    userPokemon.memo,
    state.mapper.lookupName("tblIngredient", userPokemon.ingredientLv1, ""),
    state.mapper.lookupName("tblIngredient", userPokemon.ingredientLv30, ""),
    state.mapper.lookupName("tblIngredient", userPokemon.ingredientLv60, ""),
    roleSummary.map((role) => `${role.label} ${role.status}`).join(" "),
  ].join(" ");
  return normalizeText(text).includes(query);
}

function renderUserPokemonCard(userPokemon, state) {
  const vm = state.mapper.createPokemonViewModel(userPokemon, state);
  return `
    <button class="card" data-user-pokemon-id="${escapeHtml(userPokemon.userPokemonId)}" type="button">
      <div class="card-title">
        <strong>${escapeHtml(vm.displayName)}</strong>
        <span class="chip">Lv${escapeHtml(vm.level)}</span>
      </div>
      <ul class="meta-list">
        <li>${escapeHtml(vm.trainingStatus)}</li>
        ${vm.roleSummary.map((role) => `<li>${role.icon}</li>`).join("")}
        ${vm.isFavorite ? "<li>★</li>" : ""}
      </ul>
    </button>
  `;
}

function renderUserPokemonDetail(userPokemon, state) {
  const mapper = state.mapper;
  const vm = mapper.createPokemonViewModel(userPokemon, state);
  const species = vm.species;
  if (!species) {
    return `<section class="panel"><h3>不明データ</h3><p class="muted">マスターデータから削除された種族を参照しています。</p></section>`;
  }

  return `
    <section class="panel">
      <h3>${escapeHtml(vm.displayName)}</h3>
      <div class="detail-grid">
        <div class="detail-item"><span>種族</span>${escapeHtml(vm.speciesName)}</div>
        <div class="detail-item"><span>Lv</span>${escapeHtml(vm.level)}</div>
        <div class="detail-item"><span>育成状態</span>${escapeHtml(vm.trainingStatus)}</div>
        <div class="detail-item"><span>お気に入り</span>${vm.isFavorite ? "★ はい" : "いいえ"}</div>
      </div>
    </section>
    <section class="panel">
      <h3>現在担当中</h3>
      ${
        vm.roleSummary.length
          ? `<ul class="meta-list">${vm.roleSummary.map((role) => `<li>${role.icon} ${escapeHtml(role.label)} / ${escapeHtml(role.status)}</li>`).join("")}</ul>`
          : `<p class="muted">未設定</p>`
      }
    </section>
    <section class="panel">
      <h3>基本情報</h3>
      <div class="detail-grid">
        <div class="detail-item"><span>得意</span>${escapeHtml(mapper.lookupName("tblSpecialty", mapper.getValue(species, "specialtyId"), "未設定"))}</div>
        <div class="detail-item"><span>タイプ</span>${escapeHtml(mapper.lookupName("tblType", mapper.getValue(species, "typeId"), "未設定"))}</div>
        <div class="detail-item"><span>睡眠タイプ</span>${escapeHtml(mapper.lookupName("tblSleepType", mapper.getValue(species, "sleepTypeId"), "未設定"))}</div>
        <div class="detail-item"><span>メインスキル</span>${escapeHtml(mapper.skillName(mapper.getValue(species, "mainSkillId")))}</div>
      </div>
    </section>
    <section class="panel">
      <h3>食材</h3>
      <ul class="meta-list">
        <li>Lv1 ${escapeHtml(vm.ingredientLv1Name)}</li>
        <li>Lv30 ${escapeHtml(vm.ingredientLv30Name)}</li>
        <li>Lv60 ${escapeHtml(vm.ingredientLv60Name)}</li>
      </ul>
    </section>
    <section class="panel">
      <h3>メインスキル</h3>
      <p>${escapeHtml(mapper.skillName(mapper.getValue(species, "mainSkillId")))} / Lv${escapeHtml(vm.mainSkillLevel)}</p>
    </section>
    <section class="panel">
      <h3>性格・メモ</h3>
      <div class="detail-grid">
        <div class="detail-item"><span>性格</span>${escapeHtml(vm.natureName)}</div>
        <div class="detail-item"><span>上昇補正</span>${escapeHtml(vm.natureEffect.upName)}${vm.natureEffect.upName !== "補正なし" ? "↑" : ""}</div>
        <div class="detail-item"><span>下降補正</span>${escapeHtml(vm.natureEffect.downName)}${vm.natureEffect.downName !== "補正なし" ? "↓" : ""}</div>
        <div class="detail-item"><span>メモ</span>${escapeHtml(vm.memo || "なし")}</div>
      </div>
    </section>
    <section class="panel">
      <h3>サブスキル</h3>
      <ul class="meta-list">
        ${renderSubSkillListItem("Lv10", vm.subSkills.level10, state)}
        ${renderSubSkillListItem("Lv25", vm.subSkills.level25, state)}
        ${renderSubSkillListItem("Lv50", vm.subSkills.level50, state)}
        ${renderSubSkillListItem("Lv70", vm.subSkills.level70, state)}
        ${renderSubSkillListItem("Lv80", vm.subSkills.level80, state)}
      </ul>
    </section>
    <details class="panel fold-panel">
      <summary>登録内容編集</summary>
      ${renderEditForm(userPokemon, state)}
    </details>
    <details class="panel fold-panel">
      <summary>役割編集</summary>
      ${renderRoleForm(userPokemon, state)}
      <div class="button-row" style="margin-top: 12px;">
        <button id="deleteSelected" class="danger-button" type="button">削除</button>
      </div>
    </details>
  `;
}

function renderSubSkillListItem(label, subSkillId, state) {
  return `<li>${escapeHtml(label)} ${escapeHtml(state.mapper.lookupName("tblSubSkill", subSkillId, "未設定"))}</li>`;
}

function renderEditForm(userPokemon, state) {
  const mapper = state.mapper;
  const pokemonRows = mapper
    .table("tblPokemon")
    .slice()
    .sort((a, b) => Number(mapper.getValue(a, "dexNo", 0)) - Number(mapper.getValue(b, "dexNo", 0)));
  return `
    <form id="editPokemonForm" class="form-grid">
      <label>種族
        ${renderSpeciesPicker("edit", pokemonRows, mapper, userPokemon.pokemonId)}
      </label>
      <label>ニックネーム
        <input class="input" name="nickname" value="${escapeHtml(userPokemon.nickname || "")}" placeholder="未入力なら連番表示">
      </label>
      <label>Lv
        <input class="input" name="level" type="number" min="1" max="100" value="${escapeHtml(userPokemon.level || 1)}">
      </label>
      <label>育成状態
        <select class="select" name="trainingStatus">
          ${trainingStatuses.map((status) => option(status, status, userPokemon.trainingStatus || "未設定")).join("")}
        </select>
      </label>
      <label>Lv1食材
        <select id="editIngredientLv1" class="select" name="ingredientLv1">${pokemonIngredientOptions(state, userPokemon.pokemonId, userPokemon.ingredientLv1, "ingredientA")}</select>
      </label>
      <label>Lv30食材
        <select id="editIngredientLv30" class="select" name="ingredientLv30">${pokemonIngredientOptions(state, userPokemon.pokemonId, userPokemon.ingredientLv30, "ingredientB")}</select>
      </label>
      <label>Lv60食材
        <select id="editIngredientLv60" class="select" name="ingredientLv60">${pokemonIngredientOptions(state, userPokemon.pokemonId, userPokemon.ingredientLv60, "ingredientC")}</select>
      </label>
      <label>メインスキルLv
        <input class="input" name="mainSkillLevel" type="number" min="1" max="7" value="${escapeHtml(userPokemon.mainSkillLevel || 1)}">
      </label>
      <label>性格
        <select class="select" name="natureId">
          ${option("NONE", "未設定", userPokemon.natureId || "NONE")}
          ${mapper.table("tblNature").map((row) => option(mapper.masterOptionValue(row), row.名前 ?? mapper.rowId(row), userPokemon.natureId || "NONE")).join("")}
        </select>
      </label>
      ${renderSubSkillFields(state, userPokemon)}
      <label>お気に入り
        <select class="select" name="isFavorite">
          ${option("false", "いいえ", String(Boolean(userPokemon.isFavorite)))}
          ${option("true", "はい", String(Boolean(userPokemon.isFavorite)))}
        </select>
      </label>
      <label class="wide">メモ
        <textarea class="textarea" name="memo" placeholder="自由入力">${escapeHtml(userPokemon.memo || "")}</textarea>
      </label>
      <div class="button-row wide">
        <button class="primary-button" type="submit">登録内容を保存</button>
      </div>
    </form>
  `;
}

function pokemonIngredientOptions(state, pokemonId, selectedId, fallbackKey) {
  const mapper = state.mapper;
  const species = mapper.pokemonById(pokemonId);
  const fallback = species ? mapper.getValue(species, fallbackKey) : "NONE";
  const options = [selectedId || fallback || "NONE", fallback].filter(Boolean);
  if (species) {
    options.push(mapper.getValue(species, "ingredientA"), mapper.getValue(species, "ingredientB"), mapper.getValue(species, "ingredientC"));
  }
  const unique = [...new Set(options.filter((value) => value && value !== "NONE"))];
  return option("NONE", "未設定", selectedId || "NONE") + unique.map((id) => option(id, state.mapper.lookupName("tblIngredient", id, id), selectedId || fallback)).join("");
}

function renderDetailPage(userPokemon, state) {
  return `
    <nav class="breadcrumb">個体 ＞ ${escapeHtml(displayUserPokemonName(userPokemon, state))}</nav>
    <section class="page-head">
      <div>
        <h2>個体詳細</h2>
        <p>登録内容と役割を確認・編集します。</p>
      </div>
      <button class="secondary-button fixed-back-button" type="button" data-back-to-pokemon-list>一覧へ戻る</button>
    </section>
    ${renderUserPokemonDetail(userPokemon, state)}
  `;
}

function bindDetailEvents(state, actions) {
  document.querySelector("[data-back-to-pokemon-list]")?.addEventListener("click", () => {
    actions.backToPokemonList();
  });
  document.querySelector("#editPokemonForm")?.addEventListener("submit", (event) => handleEditPokemon(event, state, actions));
  document.querySelector("#roleForm")?.addEventListener("submit", (event) => handleRoleSave(event, state, actions));
  document.querySelector("#deleteSelected")?.addEventListener("click", () => handleDeleteSelected(state, actions));
}

function bindDirtyTracking() {
  document.querySelectorAll("form").forEach((form) => {
    form.dataset.dirty = "false";
    form.addEventListener("input", () => { form.dataset.dirty = "true"; });
    form.addEventListener("change", () => { form.dataset.dirty = "true"; });
  });
}

function renderRoleForm(userPokemon, state) {
  const mapper = state.mapper;
  const species = mapper.pokemonById(userPokemon.pokemonId);
  const roles = getRoleAssignmentsForUser(userPokemon.userPokemonId, state.roleAssignments);
  const berryRole = roles.berryRoles[0];
  const ingredientRoles = [...roles.ingredientRoles];
  const skillRoles = [...roles.skillRoles];

  while (ingredientRoles.length < 3) ingredientRoles.push(null);
  while (skillRoles.length < 2) skillRoles.push(null);

  return `
    <form id="roleForm" class="form-grid">
      <label>きのみ担当タイプ
        <select class="select" name="berryTypeId">
          ${option("NONE", "未設定", berryRole?.typeId ?? "NONE")}
          ${roleTypeOptions(state, species, berryRole?.typeId)}
        </select>
      </label>
      <label>きのみ役割状態
        <select class="select" name="berryRoleStatus">
          ${roleStatusOptions(berryRole?.roleStatus)}
        </select>
      </label>
      ${ingredientRoles.map((role, index) => renderIngredientRoleFields(role, index + 1, userPokemon, state)).join("")}
      ${skillRoles.map((role, index) => renderSkillRoleFields(role, index + 1, state)).join("")}
      <div class="button-row wide">
        <button class="primary-button" type="submit">役割を保存</button>
      </div>
    </form>
  `;
}

function roleTypeOptions(state, species, selectedId) {
  const mapper = state.mapper;
  const speciesType = species ? mapper.getValue(species, "typeId") : "";
  const ids = [selectedId, speciesType].filter((id) => id && id !== "NONE");
  return [...new Set(ids)].map((id) => option(id, mapper.lookupName("tblType", id, id), selectedId || "NONE")).join("");
}

function renderIngredientRoleFields(role, index, userPokemon, state) {
  const mapper = state.mapper;
  return `
    <label>食材担当${index}
      <select class="select" name="ingredientRole${index}">
        ${option("NONE", "未設定", role?.ingredientId ?? "NONE")}
        ${roleIngredientOptions(state, userPokemon, role?.ingredientId)}
      </select>
    </label>
    <label>食材評価${index}
      <input class="input" name="ingredientScore${index}" type="number" min="0" max="99" value="${escapeHtml(role?.score ?? 0)}">
    </label>
    <label>食材状態${index}
      <select class="select" name="ingredientRoleStatus${index}">
        ${roleStatusOptions(role?.roleStatus)}
      </select>
    </label>
  `;
}

function roleStatusOptions(selectedStatus) {
  const selected = selectedStatus || "NONE";
  return option("NONE", "未設定", selected) +
    ROLE_STATUS_OPTIONS.map((status) => option(status, status, selected)).join("");
}

function roleIngredientOptions(state, userPokemon, selectedId) {
  const mapper = state.mapper;
  const species = mapper.pokemonById(userPokemon.pokemonId);
  const ids = [selectedId];
  if (species) {
    ids.push(mapper.getValue(species, "ingredientA"), mapper.getValue(species, "ingredientB"), mapper.getValue(species, "ingredientC"));
  }
  return [...new Set(ids.filter((id) => id && id !== "NONE"))]
    .map((id) => option(id, mapper.lookupName("tblIngredient", id, id), selectedId))
    .join("");
}

function renderSkillRoleFields(role, index, state) {
  const mapper = state.mapper;
  return `
    <label>スキル役割${index}
      <select class="select" name="skillRole${index}">
        ${option("NONE", "未設定", role?.skillRole ?? "NONE")}
        ${SKILL_ROLE_OPTIONS.map((skillRole) => option(skillRole, skillRole, role?.skillRole ?? "NONE")).join("")}
      </select>
    </label>
    <label>エナジー担当タイプ${index}
      <select class="select" name="skillTargetType${index}">
        ${option("NONE", "未設定", role?.targetTypeId ?? "NONE")}
        ${mapper.table("tblType").map((row) => option(mapper.masterOptionValue(row), row.名前 ?? mapper.rowId(row), role?.targetTypeId ?? "NONE")).join("")}
      </select>
    </label>
    <label>スキル状態${index}
      <select class="select" name="skillRoleStatus${index}">
        ${roleStatusOptions(role?.roleStatus)}
      </select>
    </label>
  `;
}

async function handleRoleSave(event, state, actions) {
  event.preventDefault();
  const userPokemonId = state.selectedUserPokemonId;
  if (!userPokemonId) return;
  const assignments = buildRoleAssignmentsFromForm(userPokemonId, new FormData(event.target));
  await saveRoleAssignmentsForUser(userPokemonId, assignments);
  await actions.refreshRoleAssignments();
  actions.recalculateRoleProgress();
  await actions.regenerateTodos();
  actions.notify("保存しました");
  renderPokemonPage({ state, view: document.querySelector("#view"), actions });
}

async function handleDeleteSelected(state, actions) {
  const selected = state.userPokemon.find((item) => item.userPokemonId === state.selectedUserPokemonId);
  if (!selected) return;
  const ok = window.confirm("この個体を削除します。\n関連する役割設定も解除されます。\nよろしいですか？");
  if (!ok) return;
  await deleteUserPokemon(selected.userPokemonId);
  await deleteRoleAssignmentsForUser(selected.userPokemonId);
  await actions.refreshUserPokemon();
  await actions.refreshRoleAssignments();
  actions.recalculateRoleProgress();
  await actions.regenerateTodos();
  state.selectedUserPokemonId = state.userPokemon[0]?.userPokemonId ?? null;
  state.pokemonDetailOpen = false;
  actions.notify("削除しました");
  renderPokemonPage({ state, view: document.querySelector("#view"), actions });
}
