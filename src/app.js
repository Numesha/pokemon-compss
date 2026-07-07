import { loadMaster } from "./master/masterLoader.js";
import { createMasterMapper } from "./master/masterMapper.js";
import { mergeGoalsWithDefaults } from "./services/goalService.js";
import { calculateRoleProgress } from "./services/roleProgressService.js";
import { getEmptyRoleAssignments } from "./services/roleService.js";
import { buildTodoCandidates } from "./services/todoCandidateMapper.js";
import { generateTodosFromRoleProgress, getEmptyTodos } from "./services/todoService.js";
import { buildUserDataBackup, clearUserData, restoreUserDataBackup } from "./services/userDataBackupService.js";
import { getGoals } from "./stores/goalStore.js";
import { getRoleAssignments } from "./stores/roleStore.js";
import { getSpeciesRoleCandidates } from "./stores/speciesRoleCandidateStore.js";
import { getSpeciesSettings } from "./stores/speciesSettingStore.js";
import { getTodos, replaceGeneratedTodos } from "./stores/todoStore.js";
import { getUserPokemon } from "./stores/userPokemonStore.js";
import { renderDexPage } from "./pages/DexPage.js";
import { renderPokemonPage } from "./pages/PokemonPage.js";
import { renderHomePage } from "./pages/HomePage.js";
import { renderIslandPage } from "./pages/IslandPage.js";
import { renderSettingsPage } from "./pages/SettingsPage.js";
import { renderTodoPage } from "./pages/TodoPage.js";
import { renderRolePage } from "./pages/RolePage.js";
import { renderUnsetListPage } from "./pages/UnsetListPage.js";

const APP_VERSION = "1.0.0";

const state = {
  route: "home",
  master: null,
  mapper: null,
  userPokemon: [],
  speciesSettings: [],
  speciesRoleCandidates: [],
  roleAssignments: getEmptyRoleAssignments(),
  savedGoals: [],
  goals: [],
  roleProgress: {
    berryProgress: [],
    ingredientProgress: [],
    skillProgress: [],
  },
  todoCandidates: [],
  todos: getEmptyTodos(),
  selectedIslandSleepType: null,
  selectedDexId: null,
  selectedUserPokemonId: null,
  filters: {
    dexQuery: "",
    dexSpecialty: "ALL",
    dexType: "ALL",
    pokemonQuery: "",
    pokemonStatus: "ALL",
  },
  notice: null,
};

const view = document.querySelector("#view");
const masterStatus = document.querySelector("#masterStatus");

const actions = {
  setRoute,
  openIslandSleepType,
  openDexPokemon,
  openUserPokemon,
  refreshUserPokemon,
  refreshSpeciesSettings,
  refreshSpeciesRoleCandidates,
  refreshRoleAssignments,
  refreshGoals,
  refreshTodos,
  exportUserData,
  importUserData,
  resetUserData,
  setNotice,
  recalculateRoleProgress,
  rebuildTodoCandidates,
  regenerateTodos,
  render,
};

function setNotice(message, type = "info") {
  state.notice = message ? { message, type } : null;
  render();
}

function setRoute(route) {
  state.route = route;
  const activeTabRoute = ["berry", "ingredient", "skill", "settings", "unset", "todo"].includes(route) ? "menu" : route;
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.route === activeTabRoute);
  });
  render();
}

function openIslandSleepType(islandSleepType) {
  state.selectedIslandSleepType = islandSleepType;
  setRoute("island");
}

function openDexPokemon(pokemonId) {
  state.selectedDexId = String(pokemonId);
  setRoute("dex");
}

function openUserPokemon(userPokemonId) {
  state.selectedUserPokemonId = userPokemonId;
  setRoute("pokemon");
}

async function refreshUserPokemon() {
  state.userPokemon = await getUserPokemon();
}

async function refreshSpeciesSettings() {
  state.speciesSettings = await getSpeciesSettings();
}

async function refreshSpeciesRoleCandidates() {
  state.speciesRoleCandidates = await getSpeciesRoleCandidates();
}

async function refreshRoleAssignments() {
  state.roleAssignments = await getRoleAssignments();
}

async function refreshGoals() {
  const savedGoals = await getGoals();
  state.savedGoals = savedGoals;
  state.goals = mergeGoalsWithDefaults(savedGoals, state.mapper);
}

function recalculateRoleProgress() {
  state.roleProgress = calculateRoleProgress({
    goals: state.goals,
    mapper: state.mapper,
    roleAssignments: state.roleAssignments,
    userPokemon: state.userPokemon,
  });
}

function rebuildTodoCandidates() {
  state.todoCandidates = buildTodoCandidates({
    mapper: state.mapper,
    roleProgress: state.roleProgress,
    speciesSettings: state.speciesSettings,
    speciesRoleCandidates: state.speciesRoleCandidates,
  });
}

async function refreshTodos() {
  state.todos = await getTodos();
}

async function regenerateTodos() {
  rebuildTodoCandidates();
  const generatedTodos = generateTodosFromRoleProgress(state.roleProgress, state.todoCandidates, state.todos);
  await replaceGeneratedTodos(generatedTodos);
  await refreshTodos();
}

async function refreshUserData() {
  await refreshUserPokemon();
  await refreshSpeciesSettings();
  await refreshSpeciesRoleCandidates();
  await refreshRoleAssignments();
  await refreshGoals();
  recalculateRoleProgress();
  await refreshTodos();
  await regenerateTodos();
}

async function exportUserData() {
  try {
    const backup = await buildUserDataBackup({
      appVersion: APP_VERSION,
      masterVersion: state.master.meta?.masterVersion ?? "unknown",
    });
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
    link.href = url;
    link.download = `pokesuri-compass-backup-${date}.json`;
    link.click();
    URL.revokeObjectURL(url);
    state.notice = { message: "ユーザーデータをJSONで書き出しました。", type: "success" };
    render();
  } catch (error) {
    showUserError("バックアップの作成に失敗しました。IndexedDBの状態を確認してください。", error);
  }
}

async function importUserData(file) {
  if (!file) return;
  try {
    const text = await file.text();
    let backup;
    try {
      backup = JSON.parse(text);
    } catch (error) {
      throw new Error("JSONとして読み込めませんでした。バックアップJSONを選択してください。");
    }

    const confirmed = window.confirm("現在のユーザーデータをバックアップ内容で置き換えます。復元しますか？");
    if (!confirmed) return;

    await restoreUserDataBackup(backup);
    await refreshUserData();
    state.notice = { message: "バックアップからユーザーデータを復元しました。", type: "success" };
    render();
  } catch (error) {
    showUserError(error.message || "バックアップの復元に失敗しました。ファイルの内容を確認してください。", error);
  }
}

async function resetUserData() {
  const confirmed = window.confirm("登録個体、役割、目標、厳選設定、ToDoを初期化します。master.jsonは削除されません。初期化しますか？");
  if (!confirmed) return;

  try {
    await clearUserData();
    await refreshUserData();
    state.notice = { message: "ユーザーデータを初期化しました。master.jsonは残っています。", type: "success" };
    render();
  } catch (error) {
    showUserError("ユーザーデータの初期化に失敗しました。IndexedDBの状態を確認してください。", error);
  }
}

function render() {
  if (!state.master || !state.mapper) return;

  if (state.route === "dex") {
    renderDexPage({ state, view, actions });
  } else if (state.route === "pokemon") {
    renderPokemonPage({ state, view, actions });
  } else if (state.route === "island") {
    renderIslandPage({ state, view, actions });
  } else if (state.route === "todo") {
    renderTodoPage({ state, view, actions });
  } else if (["berry", "ingredient", "skill"].includes(state.route)) {
    renderRolePage({ kind: state.route, state, view, actions });
  } else if (state.route === "unset") {
    renderUnsetListPage({ state, view, actions });
  } else if (state.route === "menu" || state.route === "settings") {
    renderSettingsPage({ state, view, actions });
  } else {
    renderHomePage({ appVersion: APP_VERSION, state, view, actions });
  }
}

async function boot() {
  try {
    state.master = await loadMaster();
    state.mapper = createMasterMapper(state.master);
    masterStatus.textContent = `Master ${state.master.meta?.masterVersion ?? "unknown"}`;
    masterStatus.className = "status-pill ready";
  } catch (error) {
    masterStatus.textContent = "master.json未読込";
    masterStatus.className = "status-pill error";
    view.innerHTML = `
      <section class="empty-state">
        <strong>マスターデータの読み込みに失敗しました。</strong><br>
        public/master.json が存在するか、ファイル内容が正しいJSONかを確認してください。
      </section>
    `;
    console.error(error);
    return;
  }

  try {
    await refreshUserData();
    render();
  } catch (error) {
    state.notice = { message: "保存データの読み込みに失敗しました。ブラウザのIndexedDBを確認してください。", type: "error" };
    view.innerHTML = `
      <section class="empty-state">
        <strong>保存データの読み込みに失敗しました。</strong><br>
        IndexedDBにアクセスできない可能性があります。ブラウザ設定や空き容量を確認してください。
      </section>
    `;
    console.error(error);
  }
}

function showUserError(message, error) {
  console.error(error);
  state.notice = { message, type: "error" };
  window.alert(message);
  render();
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((error) => {
      console.warn("Service Worker registration failed", error);
    });
  });
}

document.querySelectorAll(".tab-button").forEach((button) => {
  button.addEventListener("click", () => setRoute(button.dataset.route));
});

boot();
