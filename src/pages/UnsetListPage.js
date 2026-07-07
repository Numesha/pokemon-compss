import { buildUnsetListItems } from "../services/unsetListService.js";
import { escapeHtml } from "../utils/html.js";

export function renderUnsetListPage({ state, view, actions }) {
  const items = buildUnsetListItems(state);
  const groups = groupByCategory(items);

  view.innerHTML = `
    <section class="page-head">
      <div>
        <h2>未設定一覧</h2>
        <p>判断に必要な設定がまだ入っていない項目を確認します。</p>
      </div>
      <span class="badge">${items.length}件</span>
    </section>
    ${
      groups.length
        ? `<section class="unset-list">${groups.map(renderCategoryGroup).join("")}</section>`
        : `<section class="empty-state">未設定項目はありません。</section>`
    }
  `;

  document.querySelectorAll("[data-unset-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = items.find((candidate) => candidate.id === button.dataset.unsetAction);
      if (!item) return;
      runUnsetAction(item.action, actions);
    });
  });
}

function groupByCategory(items) {
  const groupsByCategory = new Map();
  for (const item of items) {
    if (!groupsByCategory.has(item.category)) {
      groupsByCategory.set(item.category, []);
    }
    groupsByCategory.get(item.category).push(item);
  }
  return [...groupsByCategory.entries()].map(([category, categoryItems]) => ({
    category,
    items: categoryItems.sort((a, b) => a.title.localeCompare(b.title, "ja")),
  }));
}

function renderCategoryGroup(group) {
  return `
    <section class="panel unset-group">
      <div class="section-head">
        <div>
          <h3>${escapeHtml(group.category)}</h3>
          <p class="muted">${group.items.length}件</p>
        </div>
      </div>
      <div class="unset-item-list">
        ${group.items.map(renderUnsetItem).join("")}
      </div>
    </section>
  `;
}

function renderUnsetItem(item) {
  return `
    <article class="unset-item">
      <div>
        <strong>${escapeHtml(item.title)}</strong>
        <p class="muted">${escapeHtml(item.detail)}</p>
      </div>
      <button class="secondary-button" type="button" data-unset-action="${escapeHtml(item.id)}">${escapeHtml(item.actionLabel)}</button>
    </article>
  `;
}

function runUnsetAction(action, actions) {
  if (action.type === "userPokemon") {
    actions.openUserPokemon(action.userPokemonId);
    return;
  }
  if (action.type === "dex") {
    actions.openDexPokemon(action.pokemonId);
    return;
  }
  if (action.type === "role") {
    actions.setRoute(action.kind);
  }
}
