import { escapeHtml } from "../utils/html.js";

export function renderTodoPage({ state, view }) {
  const todos = sortTodos(state.todos);

  view.innerHTML = `
    <section class="page-head">
      <div>
        <h2>ToDo</h2>
        <p>目標未達の役割に対して、厳選候補の種族と出現条件を確認します。</p>
      </div>
      <span class="badge">${todos.length}件</span>
    </section>
    ${
      todos.length
        ? `<section class="todo-list">${todos.map(renderTodoCard).join("")}</section>`
        : `<section class="empty-state">現在の条件で生成されたToDoはありません。</section>`
    }
  `;
}

function sortTodos(todos) {
  return [...todos].sort((a, b) => (
    `${a.pokemonName ?? ""}:${a.kind}:${a.label}`.localeCompare(`${b.pokemonName ?? ""}:${b.kind}:${b.label}`, "ja")
  ));
}

function renderTodoCard(todo) {
  return `
    <article class="panel todo-card">
      <div class="todo-card-head">
        <div>
          <h3>${escapeHtml(todo.pokemonName ?? "候補未設定")}</h3>
          <p class="muted">${escapeHtml(todoLabel(todo))}</p>
        </div>
        <span class="badge">${escapeHtml(statusLabel(todo.status))}</span>
      </div>
      <div class="detail-grid">
        <div class="detail-item"><span>種族</span>${escapeHtml(todo.pokemonName ?? "-")}</div>
        <div class="detail-item"><span>役割</span>${escapeHtml(todo.label ?? "-")}</div>
        <div class="detail-item"><span>現在 / 目標</span>${escapeHtml(todo.currentValue)} / ${escapeHtml(todo.targetValue)}</div>
        <div class="detail-item"><span>不足</span>${escapeHtml(todo.shortage)}</div>
      </div>
      <div class="todo-islands">
        ${renderIslandSleepTypes(todo)}
      </div>
    </article>
  `;
}

function renderIslandSleepTypes(todo) {
  const items = todo.islandSleepTypes || [];
  if (items.length === 0) {
    return `<p class="muted">島と睡眠タイプは未設定です。</p>`;
  }
  return `
    <table class="data-table">
      <thead>
        <tr>
          <th>島</th>
          <th>睡眠タイプ</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((item) => `
          <tr>
            <td>${escapeHtml(item.islandName ?? "-")}</td>
            <td>${escapeHtml(item.sleepTypeName ?? "-")}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function todoLabel(todo) {
  const kindLabels = {
    berry: "きのみ",
    ingredient: "食材",
    skill: "スキル",
  };
  return `${kindLabels[todo.kind] ?? "役割"} / ${todo.label ?? "-"}`;
}

function statusLabel(status) {
  const labels = {
    open: "未対応",
    hold: "保留",
    done: "完了",
  };
  return labels[status] ?? status ?? "-";
}
