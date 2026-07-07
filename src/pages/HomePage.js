import { buildIslandSleepTypeTodoGroups } from "../services/todoGroupService.js";
import { escapeHtml } from "../utils/html.js";

export function renderHomePage({ state, view, actions }) {
  const todoGroups = buildIslandSleepTypeTodoGroups(state.todos);

  view.innerHTML = `
    <nav class="breadcrumb">ホーム</nav>
    <section class="page-head">
      <div>
        <h2>ホーム</h2>
        <p>厳選候補のToDoを島と睡眠タイプごとに確認します。</p>
      </div>
      <span class="badge">${todoGroups.length}グループ</span>
    </section>
    <section class="panel">
      <div class="section-head">
        <div>
          <h3>島別ToDo</h3>
          <p class="muted">島×睡眠タイプごとに、候補ポケモンと役割を確認できます。</p>
        </div>
      </div>
      ${
        todoGroups.length
          ? `<div class="todo-group-list">${todoGroups.map((group, index) => renderTodoGroup(group, index)).join("")}</div>`
          : `<div class="empty-state">現在の条件で生成されたToDoはありません。</div>`
      }
    </section>
  `;

  document.querySelectorAll("[data-island-todo-group]").forEach((button) => {
    button.addEventListener("click", () => {
      actions.openIslandSleepType({
        islandName: button.dataset.islandName,
        sleepTypeId: button.dataset.sleepTypeId,
        sleepTypeName: button.dataset.sleepTypeName,
      });
    });
  });
  document.querySelectorAll("[data-open-dex-pokemon]").forEach((button) => {
    button.addEventListener("click", () => actions.openDexDetail(button.dataset.openDexPokemon));
  });
}

function renderTodoGroup(group, index) {
  return `
    <details class="todo-group" ${index === 0 ? "open" : ""}>
      <summary>
        <span>
          <strong>${escapeHtml(group.islandName)}</strong>
          <span class="muted">${escapeHtml(group.sleepTypeName)}</span>
        </span>
        <span class="badge">${group.todos.length}件</span>
      </summary>
      <div class="todo-group-body">
        <ul class="todo-candidate-list">
          ${group.todos.map((todo) => `
            <li>
              <span>
                <strong>${escapeHtml(todo.pokemonName ?? "候補未設定")}</strong>
                <span class="chip">役割: ${escapeHtml(todo.label ?? "-")}</span>
              </span>
              <span class="button-row">
                <button
                  class="secondary-button"
                  type="button"
                  data-island-todo-group
                  data-island-name="${escapeHtml(group.islandName)}"
                  data-sleep-type-id="${escapeHtml(group.sleepTypeId)}"
                  data-sleep-type-name="${escapeHtml(group.sleepTypeName)}"
                >島で確認</button>
                ${todo.pokemonId ? `<button class="secondary-button" type="button" data-open-dex-pokemon="${escapeHtml(todo.pokemonId)}">図鑑を見る</button>` : ""}
              </span>
            </li>
          `).join("")}
        </ul>
      </div>
    </details>
  `;
}
