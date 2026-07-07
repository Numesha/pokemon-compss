import { displayUserPokemonName } from "../master/masterMapper.js";
import {
  appearingPokemonForIsland,
  buildCurrentForcesForIslandTypes,
  buildIslandSleepTypeTodoGroups,
  favoriteTypeIdsForIsland,
  findIslandSleepTypeTodoGroup,
} from "../services/todoGroupService.js";
import { escapeHtml, option } from "../utils/html.js";

export function renderIslandPage({ state, view, actions }) {
  const todoGroups = buildIslandSleepTypeTodoGroups(state.todos);
  const groups = todoGroups.length ? todoGroups : buildFallbackIslandGroups(state);
  const selected = state.selectedIslandSleepType ?? groups[0] ?? null;
  const selectedGroup = selected
    ? (todoGroups.length ? findIslandSleepTypeTodoGroup(state.todos, selected) : selected)
    : null;
  const selectedTypes = selected ? selectedTypeIdsForIsland(state, selected.islandName) : [];
  const currentForces = selected ? buildCurrentForcesForIslandTypes({
    mapper: state.mapper,
    userPokemon: state.userPokemon,
    roleAssignments: state.roleAssignments,
    typeIds: selectedTypes,
    displayName: (userPokemon) => displayUserPokemonName(userPokemon, state),
  }) : [];
  const appearing = selected ? appearingPokemonForIsland(state.mapper, selected.islandName) : [];

  view.innerHTML = `
    <section class="page-head">
      <nav class="breadcrumb">島${selectedGroup ? ` ＞ ${escapeHtml(selectedGroup.islandName)} ＞ ${escapeHtml(selectedGroup.sleepTypeName)}` : ""}</nav>
      <div>
        <h2>島</h2>
        <p>島と睡眠タイプごとに、厳選候補と現在戦力を確認します。</p>
      </div>
      ${selectedGroup ? `<span class="badge">${selectedGroup.todos.length}件</span>` : ""}
    </section>
    ${
      selectedGroup
        ? renderIslandContent({ groups, selectedGroup, currentForces, appearing, selectedTypes, state })
        : `<section class="empty-state">表示できる島情報はありません。</section>`
    }
  `;

  document.querySelectorAll("[data-island-selector]").forEach((button) => {
    button.addEventListener("click", () => {
      actions.openIslandSleepType({
        islandName: button.dataset.islandName,
        sleepTypeId: button.dataset.sleepTypeId,
        sleepTypeName: button.dataset.sleepTypeName,
      });
    });
  });
  document.querySelectorAll("[data-island-type-select]").forEach((select) => {
    select.addEventListener("change", () => {
      const islandName = select.dataset.islandName;
      state.islandTypeSelections[islandName] = Array.from(document.querySelectorAll(`[data-island-type-select][data-island-name="${CSS.escape(islandName)}"]`)).map((item) => item.value);
      renderIslandPage({ state, view, actions });
    });
  });
  document.querySelectorAll("[data-open-user-pokemon]").forEach((button) => {
    button.addEventListener("click", () => actions.openPokemonDetail(button.dataset.openUserPokemon));
  });
  document.querySelectorAll("[data-open-dex-pokemon]").forEach((button) => {
    button.addEventListener("click", () => actions.openDexDetail(button.dataset.openDexPokemon));
  });
}

function buildFallbackIslandGroups(state) {
  return state.mapper.table("tblIsland")
    .filter((row) => row.名前 && String(row.名前).trim())
    .sort((a, b) => Number(a.解放順 ?? 0) - Number(b.解放順 ?? 0))
    .map((row) => ({
      islandName: row.名前,
      sleepTypeId: "ALL",
      sleepTypeName: "すべて",
      todos: [],
    }));
}

function renderIslandContent({ groups, selectedGroup, currentForces, appearing, selectedTypes, state }) {
  return `
    <section class="toolbar island-selector">
      ${groups.map((group) => renderIslandSelectorButton(group, selectedGroup)).join("")}
    </section>
    <section class="panel">
      <h3>選択中の条件</h3>
      <div class="detail-grid">
        <div class="detail-item"><span>島名</span>${escapeHtml(selectedGroup.islandName ?? "-")}</div>
        <div class="detail-item"><span>睡眠タイプ</span>${escapeHtml(selectedGroup.sleepTypeName ?? "-")}</div>
        <div class="detail-item"><span>ToDo</span>${selectedGroup.todos.length}件</div>
      </div>
    </section>
    ${renderTypeSelectorIfNeeded(state, selectedGroup, selectedTypes)}
    <section class="panel">
      <h3>ToDo一覧</h3>
      ${
        selectedGroup.todos.length
          ? `<div class="island-todo-list">${selectedGroup.todos.map(renderTodoItem).join("")}</div>`
          : `<p class="muted">この条件のToDoはありません。</p>`
      }
    </section>
    <section class="panel">
      <h3>現在戦力</h3>
      ${
        currentForces.length
          ? `<div class="island-force-list">${currentForces.map(renderCurrentForce).join("")}</div>`
          : `<p class="muted">この条件に該当する現在戦力はまだありません。</p>`
      }
    </section>
    <details class="panel fold-panel">
      <summary>全出現ポケモンを見る</summary>
      ${
        appearing.length
          ? `<ul class="role-mini-list">${appearing.map((row) => `<li><button class="secondary-button candidate-button" type="button" data-open-dex-pokemon="${escapeHtml(state.mapper.pokemonId(row))}">${escapeHtml(state.mapper.pokemonDisplayName(row))}</button><span>No.${escapeHtml(state.mapper.getValue(row, "dexNo", "-"))} / ${escapeHtml(state.mapper.lookupName("tblSleepType", state.mapper.getValue(row, "sleepTypeId"), "-"))}</span></li>`).join("")}</ul>`
          : `<p class="muted">出現ポケモンは未登録です。</p>`
      }
    </details>
  `;
}

function selectedTypeIdsForIsland(state, islandName) {
  const saved = state.islandTypeSelections[islandName];
  const fixed = favoriteTypeIdsForIsland(state.mapper, islandName, saved || []);
  if (fixed.length) return fixed;
  return saved || state.mapper.table("tblType").slice(0, 3).map((row) => state.mapper.rowId(row));
}

function renderTypeSelectorIfNeeded(state, selectedGroup, selectedTypes) {
  const island = state.mapper.table("tblIsland").find((row) => String(row.名前 ?? row.name) === String(selectedGroup.islandName));
  if (!island || island.FavoriteTypeMode !== "RANDOM") return "";
  return `
    <section class="panel">
      <h3>現在戦力の対象タイプ</h3>
      <div class="form-grid">
        ${[0, 1, 2].map((index) => `
          <label>タイプ${index + 1}
            <select class="select" data-island-type-select data-island-name="${escapeHtml(selectedGroup.islandName)}">
              ${state.mapper.table("tblType").map((row) => option(state.mapper.rowId(row), row.名前 ?? state.mapper.rowId(row), selectedTypes[index])).join("")}
            </select>
          </label>
        `).join("")}
      </div>
    </section>
  `;
}

function renderIslandSelectorButton(group, selectedGroup) {
  const selected = group.islandName === selectedGroup.islandName &&
    String(group.sleepTypeId) === String(selectedGroup.sleepTypeId) &&
    group.sleepTypeName === selectedGroup.sleepTypeName;
  return `
    <button
      class="${selected ? "primary-button" : "secondary-button"}"
      type="button"
      data-island-selector
      data-island-name="${escapeHtml(group.islandName)}"
      data-sleep-type-id="${escapeHtml(group.sleepTypeId)}"
      data-sleep-type-name="${escapeHtml(group.sleepTypeName)}"
    >${escapeHtml(group.islandName)} / ${escapeHtml(group.sleepTypeName)}</button>
  `;
}

function renderTodoItem(todo) {
  return `
    <article class="detail-item">
      <span>${escapeHtml(todo.label ?? "-")}</span>
      <strong>${escapeHtml(todo.pokemonName ?? "候補未設定")}</strong>
      <ul class="meta-list compact-list">
        <li>現在 ${escapeHtml(todo.currentValue)}</li>
        <li>目標 ${escapeHtml(todo.targetValue)}</li>
        <li>不足 ${escapeHtml(todo.shortage)}</li>
      </ul>
      ${todo.pokemonId ? `<button class="secondary-button" type="button" data-open-dex-pokemon="${escapeHtml(todo.pokemonId)}">図鑑を見る</button>` : ""}
    </article>
  `;
}

function renderCurrentForce(force) {
  return `
    <article class="detail-item">
      <span>${escapeHtml(force.trainingStatus ?? "-")}</span>
      <button class="secondary-button candidate-button" type="button" data-open-user-pokemon="${escapeHtml(force.userPokemonId)}">${escapeHtml(force.displayName)}</button>
      <ul class="meta-list compact-list">
        <li>Lv${escapeHtml(force.level ?? "-")}</li>
        ${force.roles.map((role) => `<li>${escapeHtml(role)}</li>`).join("")}
      </ul>
    </article>
  `;
}
