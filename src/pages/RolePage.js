import { goalId } from "../services/goalService.js";
import { buildRolePageItems, ROLE_PAGE_CONFIG } from "../services/roleViewService.js";
import { saveGoals } from "../stores/goalStore.js";
import { escapeHtml } from "../utils/html.js";

export function renderRolePage({ kind, state, view, actions }) {
  const config = ROLE_PAGE_CONFIG[kind];
  if (!config) {
    view.innerHTML = `<section class="empty-state">表示できる役割画面がありません。</section>`;
    return;
  }

  const items = buildRolePageItems({ kind, state });

  view.innerHTML = `
    <nav class="breadcrumb">役割 ＞ ${escapeHtml(config.title)}</nav>
    <section class="page-head">
      <div>
        <h2>${escapeHtml(config.title)}</h2>
        <p>${escapeHtml(config.description)}</p>
      </div>
      <span class="badge">${items.length}件</span>
      <button class="secondary-button fixed-back-button" type="button" data-back-to-menu>一覧へ戻る</button>
    </section>
    <form id="roleGoalForm">
      <section class="role-list">
        ${items.map((item) => renderRoleItem(item)).join("")}
      </section>
      <div class="sticky-actions">
        <button class="primary-button" type="submit">目標を保存</button>
      </div>
    </form>
  `;

  document.querySelector("#roleGoalForm")?.addEventListener("submit", (event) => handleGoalSave(event, kind, items, actions));
  if (document.querySelector("#roleGoalForm")) document.querySelector("#roleGoalForm").dataset.dirty = "false";
  document.querySelector("#roleGoalForm")?.addEventListener("input", (event) => {
    event.currentTarget.dataset.dirty = "true";
  });
  document.querySelector("[data-back-to-menu]")?.addEventListener("click", () => actions.backToMenu());
  document.querySelectorAll("[data-open-user-pokemon]").forEach((button) => {
    button.addEventListener("click", () => actions.openPokemonDetail(button.dataset.openUserPokemon));
  });
  document.querySelectorAll("[data-register-for-role]").forEach((button) => {
    button.addEventListener("click", () => {
      state.registerPrefill = { kind: button.dataset.kind, targetId: button.dataset.targetId };
      actions.setRoute("pokemon");
    });
  });
}

function renderRoleItem(item) {
  return `
    <article class="panel role-item">
      <div class="role-item-head">
        <div>
          <h3>${escapeHtml(item.label)}</h3>
          <p class="muted">現在 ${escapeHtml(item.currentValue)} / 目標 ${escapeHtml(item.targetValue)} / 不足 ${escapeHtml(item.shortage)}</p>
        </div>
        <label class="goal-field">目標
          <input
            class="input"
            name="${escapeHtml(item.goalId ?? goalId(item.kind, item.targetId))}"
            type="number"
            min="0"
            max="999"
            value="${escapeHtml(item.targetValue)}"
          >
        </label>
      </div>
      <div class="detail-grid">
        <div class="detail-item"><span>現在</span>${escapeHtml(item.currentValue)}</div>
        <div class="detail-item"><span>目標</span>${escapeHtml(item.targetValue)}</div>
        <div class="detail-item"><span>不足</span>${escapeHtml(item.shortage)}</div>
        <div class="detail-item"><span>担当個体</span>${item.assignees.length}件</div>
        <div class="detail-item"><span>候補種族</span>${item.candidateSpecies.length}件</div>
      </div>
      <div class="role-columns">
        <section>
          <h4>担当個体</h4>
          ${renderAssignees(item)}
        </section>
        <section>
          <h4>候補種族</h4>
          ${renderCandidateSpecies(item.candidateSpecies)}
        </section>
      </div>
    </article>
  `;
}

function renderAssignees(item) {
  if (item.assignees.length === 0) {
    return `
      <p class="muted">担当個体はありません。</p>
      <button class="secondary-button" type="button" data-register-for-role data-kind="${escapeHtml(item.kind)}" data-target-id="${escapeHtml(item.targetId)}">この役割の個体を登録</button>
    `;
  }
  return `
    <ul class="role-mini-list">
      ${item.assignees.map((assignee) => `
        <li>
          <button class="secondary-button candidate-button" type="button" data-open-user-pokemon="${escapeHtml(assignee.userPokemonId)}">${escapeHtml(assignee.displayName)}</button>
          <span>${escapeHtml(assignee.trainingStatus)} / ${escapeHtml(assignee.roleStatus)}${assignee.score ? ` / ${escapeHtml(assignee.score)}` : ""}</span>
        </li>
      `).join("")}
    </ul>
  `;
}

function renderCandidateSpecies(candidateSpecies) {
  if (candidateSpecies.length === 0) {
    return `<p class="muted">候補種族はありません。</p>`;
  }
  return `
    <ul class="role-mini-list">
      ${candidateSpecies.map((candidate) => `
        <li>
          <strong>${escapeHtml(candidate.pokemonName)}</strong>
          <span>${escapeHtml(candidate.huntStatus)}</span>
        </li>
      `).join("")}
    </ul>
  `;
}

async function handleGoalSave(event, kind, items, actions) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const now = new Date().toISOString();
  await saveGoals(items.map((item) => ({
    goalId: goalId(kind, item.targetId),
    kind,
    targetId: item.targetId,
    targetValue: Number(formData.get(goalId(kind, item.targetId)) || 0),
    createdAt: now,
  })));
  await actions.refreshGoals();
  actions.recalculateRoleProgress();
  await actions.regenerateTodos();
  actions.notify("保存しました");
  event.target.dataset.dirty = "false";
  actions.render();
}
