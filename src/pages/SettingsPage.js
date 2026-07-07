import { goalId } from "../services/goalService.js";
import { saveGoal } from "../stores/goalStore.js";
import { escapeHtml } from "../utils/html.js";

export function renderSettingsPage({ state, view, actions }) {
  const sampleGoals = getSampleGoals(state);
  view.innerHTML = `
    <section class="page-head">
      <div>
        <h2>メニュー</h2>
        <p>役割別の確認、データ管理、点検を行います。</p>
      </div>
    </section>
    ${state.notice ? `<section class="notice ${escapeHtml(state.notice.type)}">${escapeHtml(state.notice.message)}</section>` : ""}
    <section class="panel">
      <h3>役割画面</h3>
      <div class="menu-grid">
        <button class="secondary-button" type="button" data-role-route="berry">きのみ</button>
        <button class="secondary-button" type="button" data-role-route="ingredient">食材</button>
        <button class="secondary-button" type="button" data-role-route="skill">スキル</button>
      </div>
    </section>
    <section class="panel">
      <h3>点検</h3>
      <div class="menu-grid">
        <button class="secondary-button" type="button" data-route-button="unset">未設定一覧</button>
        <button class="secondary-button" type="button" data-route-button="todo">ToDo確認</button>
      </div>
    </section>
    <section class="panel">
      <h3>バックアップと復元</h3>
      <p class="muted">ユーザーデータだけをJSONで保存・復元します。master.json本体は含めません。</p>
      <div class="button-row">
        <button class="primary-button" type="button" data-export-user-data>JSONバックアップ</button>
        <label class="secondary-button file-button">
          JSONから復元
          <input class="hidden" type="file" accept="application/json,.json" data-import-user-data>
        </label>
      </div>
    </section>
    <section class="panel danger-panel">
      <h3>データ初期化</h3>
      <p class="muted">登録個体、役割、目標、厳選設定、ToDoを初期化します。master.jsonは削除しません。</p>
      <button class="danger-button" type="button" data-reset-user-data>ユーザーデータを初期化</button>
    </section>
    <section class="panel">
      <h3>マスターデータ</h3>
      <div class="detail-grid">
        <div class="detail-item"><span>バージョン</span>${escapeHtml(state.master.meta?.masterVersion ?? "不明")}</div>
        <div class="detail-item"><span>更新日時</span>${escapeHtml(state.master.meta?.masterUpdatedAt ?? "不明")}</div>
        <div class="detail-item"><span>生成日時</span>${escapeHtml(state.master.meta?.generatedAt ?? "不明")}</div>
      </div>
    </section>
    <section class="panel">
      <h3>役割進捗</h3>
      <div class="detail-grid">
        ${renderProgressSummary("きのみ", state.roleProgress.berryProgress)}
        ${renderProgressSummary("食材", state.roleProgress.ingredientProgress)}
        ${renderProgressSummary("スキル", state.roleProgress.skillProgress)}
      </div>
    </section>
    <section class="panel">
      <h3>簡易目標データ</h3>
      <form id="goalSampleForm" class="form-grid">
        ${sampleGoals.map((goal) => `
          <label>${escapeHtml(goal.label)}
            <input class="input" name="${escapeHtml(goal.goalId)}" type="number" min="0" max="999" value="${escapeHtml(goal.targetValue)}">
          </label>
        `).join("")}
        <div class="button-row wide">
          <button class="primary-button" type="submit">目標を保存</button>
        </div>
      </form>
    </section>
    <section class="panel">
      <h3>ToDo生成</h3>
      ${
        state.todos.length
          ? `<ul class="meta-list">${state.todos.map((todo) => `<li>${escapeHtml(todo.pokemonName ?? "候補未設定")} / ${escapeHtml(todo.label)} / ${escapeHtml(formatIslandSleepTypes(todo))} / 不足 ${escapeHtml(todo.shortage)} / ${escapeHtml(todo.status)}</li>`).join("")}</ul>`
          : `<p class="muted">生成対象はありません。</p>`
      }
    </section>
  `;

  document.querySelector("#goalSampleForm")?.addEventListener("submit", (event) => handleGoalSave(event, sampleGoals, actions));
  document.querySelectorAll("[data-role-route]").forEach((button) => {
    button.addEventListener("click", () => actions.setRoute(button.dataset.roleRoute));
  });
  document.querySelectorAll("[data-route-button]").forEach((button) => {
    button.addEventListener("click", () => actions.setRoute(button.dataset.routeButton));
  });
  document.querySelector("[data-export-user-data]")?.addEventListener("click", () => actions.exportUserData());
  document.querySelector("[data-import-user-data]")?.addEventListener("change", (event) => {
    actions.importUserData(event.target.files?.[0]);
    event.target.value = "";
  });
  document.querySelector("[data-reset-user-data]")?.addEventListener("click", () => actions.resetUserData());
}

function formatIslandSleepTypes(todo) {
  const items = todo.islandSleepTypes || [];
  if (items.length === 0) return "島未設定";
  return items.map((item) => `${item.islandName} ${item.sleepTypeName}`).join("、");
}

function renderProgressSummary(label, progressItems) {
  const totalCurrent = progressItems.reduce((sum, item) => sum + item.currentValue, 0);
  const totalTarget = progressItems.reduce((sum, item) => sum + item.targetValue, 0);
  const totalShortage = progressItems.reduce((sum, item) => sum + item.shortage, 0);
  return `
    <div class="detail-item">
      <span>${escapeHtml(label)}</span>
      現在 ${totalCurrent} / 目標 ${totalTarget} / 不足 ${totalShortage}
    </div>
  `;
}

function getSampleGoals(state) {
  return [
    firstProgressGoal(state.roleProgress.berryProgress, "きのみ目標"),
    firstProgressGoal(state.roleProgress.ingredientProgress, "食材目標"),
    firstProgressGoal(state.roleProgress.skillProgress, "スキル目標"),
  ].filter(Boolean);
}

function firstProgressGoal(progressItems, labelPrefix) {
  const item = progressItems[0];
  if (!item) return null;
  return {
    goalId: goalId(item.kind, item.targetId),
    kind: item.kind,
    targetId: item.targetId,
    label: `${labelPrefix}: ${item.label}`,
    targetValue: item.targetValue,
  };
}

async function handleGoalSave(event, sampleGoals, actions) {
  event.preventDefault();
  const formData = new FormData(event.target);
  await Promise.all(sampleGoals.map((goal) => saveGoal({
    goalId: goal.goalId,
    kind: goal.kind,
    targetId: goal.targetId,
    targetValue: Number(formData.get(goal.goalId) || 0),
    createdAt: new Date().toISOString(),
  })));
  await actions.refreshGoals();
  actions.recalculateRoleProgress();
  await actions.regenerateTodos();
  actions.render();
}
