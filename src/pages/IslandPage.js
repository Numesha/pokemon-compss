import { displayUserPokemonName } from "../master/masterMapper.js";
import {
  buildCurrentForcesForIslandSleepType,
  buildIslandSleepTypeTodoGroups,
  findIslandSleepTypeTodoGroup,
} from "../services/todoGroupService.js";
import { escapeHtml } from "../utils/html.js";

export function renderIslandPage({ state, view, actions }) {
  const groups = buildIslandSleepTypeTodoGroups(state.todos);
  const selected = state.selectedIslandSleepType ?? groups[0] ?? null;
  const selectedGroup = selected ? findIslandSleepTypeTodoGroup(state.todos, selected) : null;
  const currentForces = selected ? buildCurrentForcesForIslandSleepType({
    mapper: state.mapper,
    userPokemon: state.userPokemon,
    roleAssignments: state.roleAssignments,
    selected,
    displayName: (userPokemon) => displayUserPokemonName(userPokemon, state),
  }) : [];

  view.innerHTML = `
    <section class="page-head">
      <div>
        <h2>島</h2>
        <p>島と睡眠タイプごとに、厳選候補と現在戦力を確認します。</p>
      </div>
      ${selectedGroup ? `<span class="badge">${selectedGroup.todos.length}件</span>` : ""}
    </section>
    ${
      selectedGroup
        ? renderIslandContent({ groups, selectedGroup, currentForces })
        : `<section class="empty-state">表示できる島別ToDoはありません。</section>`
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
}

function renderIslandContent({ groups, selectedGroup, currentForces }) {
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
    </article>
  `;
}

function renderCurrentForce(force) {
  return `
    <article class="detail-item">
      <span>${escapeHtml(force.trainingStatus ?? "-")}</span>
      <strong>${escapeHtml(force.displayName)}</strong>
      <ul class="meta-list compact-list">
        <li>Lv${escapeHtml(force.level ?? "-")}</li>
        ${force.roles.map((role) => `<li>${escapeHtml(role)}</li>`).join("")}
      </ul>
    </article>
  `;
}
