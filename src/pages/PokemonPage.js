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

  view.innerHTML = `
    <section class="page-head">
      <div>
        <h2>個体</h2>
        <p>所持している個体を登録・確認します。</p>
      </div>
      <button id="showRegister" class="primary-button" type="button">＋ 登録</button>
    </section>
    <section id="registerPanel" class="panel hidden">
      <h3>個体登録</h3>
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
      <div class="grid pokemon-grid">
        ${filtered.length ? filtered.map((userPokemon) => renderUserPokemonCard(userPokemon, state)).join("") : `<div class="empty-state">条件に一致するデータがありません</div>`}
      </div>
      <aside>
        ${selected ? renderUserPokemonDetail(selected, state) : `<div class="empty-state">登録個体がありません</div>`}
      </aside>
    </section>
  `;

  document.querySelector("#showRegister").addEventListener("click", () => {
    document.querySelector("#registerPanel").classList.toggle("hidden");
  });
  document.querySelector("#pokemonQuery").addEventListener("input", (event) => {
    state.filters.pokemonQuery = event.target.value;
    renderPokemonPage({ state, view, actions });
  });
  document.querySelector("#pokemonStatus").addEventListener("change", (event) => {
    state.filters.pokemonStatus = event.target.value;
    renderPokemonPage({ state, view, actions });
  });
  document.querySelector("#registerForm").addEventListener("submit", (event) => handleRegister(event, state, actions));
  document.querySelector("#registerSpecies").addEventListener("change", () => fillSpeciesDefaults(state));
  document.querySelector("#roleForm")?.addEventListener("submit", (event) => handleRoleSave(event, state, actions));
  document.querySelectorAll("[data-user-pokemon-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedUserPokemonId = button.dataset.userPokemonId;
      renderPokemonPage({ state, view, actions });
    });
  });
  document.querySelector("#deleteSelected")?.addEventListener("click", () => handleDeleteSelected(state, actions));
}

function renderRegisterForm(state) {
  const mapper = state.mapper;
  const pokemonRows = mapper
    .table("tblPokemon")
    .slice()
    .sort((a, b) => Number(mapper.getValue(a, "dexNo", 0)) - Number(mapper.getValue(b, "dexNo", 0)));
  const first = pokemonRows[0];
  return `
    <form id="registerForm" class="form-grid">
      <label>種族
        <select id="registerSpecies" class="select" name="pokemonId" required>
          ${pokemonRows.map((row) => option(mapper.pokemonId(row), `${mapper.pokemonName(row)} / No.${mapper.getValue(row, "dexNo", "-")}`, first ? mapper.pokemonId(first) : "")).join("")}
        </select>
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
        <select id="ingredientLv1" class="select" name="ingredientLv1">${ingredientOptions(state, first ? mapper.getValue(first, "ingredientA") : "")}</select>
      </label>
      <label>Lv30食材
        <select id="ingredientLv30" class="select" name="ingredientLv30">${ingredientOptions(state, first ? mapper.getValue(first, "ingredientB") : "")}</select>
      </label>
      <label>Lv60食材
        <select id="ingredientLv60" class="select" name="ingredientLv60">${ingredientOptions(state, first ? mapper.getValue(first, "ingredientC") : "")}</select>
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

function ingredientOptions(state, selectedId) {
  const mapper = state.mapper;
  const base = option("NONE", "未設定", selectedId || "NONE");
  return base + mapper.table("tblIngredient").map((row) => option(mapper.masterOptionValue(row), row.名前 ?? mapper.rowId(row), selectedId)).join("");
}

function fillSpeciesDefaults(state) {
  const mapper = state.mapper;
  const selected = mapper.pokemonById(document.querySelector("#registerSpecies").value);
  if (!selected) return;
  document.querySelector("#ingredientLv1").innerHTML = ingredientOptions(state, mapper.getValue(selected, "ingredientA"));
  document.querySelector("#ingredientLv30").innerHTML = ingredientOptions(state, mapper.getValue(selected, "ingredientB"));
  document.querySelector("#ingredientLv60").innerHTML = ingredientOptions(state, mapper.getValue(selected, "ingredientC"));
}

async function handleRegister(event, state, actions) {
  event.preventDefault();
  const data = new FormData(event.target);
  const now = new Date().toISOString();
  const item = {
    userPokemonId: `up_${crypto.randomUUID()}`,
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
    memo: String(data.get("memo") || ""),
    createdAt: now,
    updatedAt: now,
    sortOrder: state.userPokemon.length + 1,
  };

  await saveUserPokemon(item);
  await actions.refreshUserPokemon();
  state.selectedUserPokemonId = item.userPokemonId;
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
      <h3>役割編集</h3>
      ${renderRoleForm(userPokemon, state)}
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
        <div class="detail-item"><span>メモ</span>${escapeHtml(vm.memo || "なし")}</div>
      </div>
      <div class="button-row" style="margin-top: 12px;">
        <button id="deleteSelected" class="danger-button" type="button">削除</button>
      </div>
    </section>
  `;
}

function renderRoleForm(userPokemon, state) {
  const mapper = state.mapper;
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
          ${mapper.table("tblType").map((row) => option(mapper.masterOptionValue(row), row.名前 ?? mapper.rowId(row), berryRole?.typeId ?? "NONE")).join("")}
        </select>
      </label>
      <label>きのみ役割状態
        <select class="select" name="berryRoleStatus">
          ${ROLE_STATUS_OPTIONS.map((status) => option(status, status, berryRole?.roleStatus ?? "採用")).join("")}
        </select>
      </label>
      ${ingredientRoles.map((role, index) => renderIngredientRoleFields(role, index + 1, state)).join("")}
      ${skillRoles.map((role, index) => renderSkillRoleFields(role, index + 1, state)).join("")}
      <div class="button-row wide">
        <button class="primary-button" type="submit">役割を保存</button>
      </div>
    </form>
  `;
}

function renderIngredientRoleFields(role, index, state) {
  const mapper = state.mapper;
  return `
    <label>食材担当${index}
      <select class="select" name="ingredientRole${index}">
        ${option("NONE", "未設定", role?.ingredientId ?? "NONE")}
        ${mapper.table("tblIngredient").map((row) => option(mapper.masterOptionValue(row), row.名前 ?? mapper.rowId(row), role?.ingredientId ?? "NONE")).join("")}
      </select>
    </label>
    <label>食材評価${index}
      <input class="input" name="ingredientScore${index}" type="number" min="0" max="99" value="${escapeHtml(role?.score ?? 0)}">
    </label>
    <label>食材状態${index}
      <select class="select" name="ingredientRoleStatus${index}">
        ${ROLE_STATUS_OPTIONS.map((status) => option(status, status, role?.roleStatus ?? "採用")).join("")}
      </select>
    </label>
  `;
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
        ${ROLE_STATUS_OPTIONS.map((status) => option(status, status, role?.roleStatus ?? "採用")).join("")}
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
  renderPokemonPage({ state, view: document.querySelector("#view"), actions });
}
