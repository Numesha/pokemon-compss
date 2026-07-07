:root {
  color-scheme: light;
  --bg: #f6f2e9;
  --surface: #fffaf0;
  --surface-strong: #ffffff;
  --line: #ded7c9;
  --text: #273334;
  --muted: #687778;
  --accent: #5d9d96;
  --accent-strong: #347d78;
  --blue: #477da8;
  --green: #4f8f5f;
  --yellow: #b48735;
  --red: #b8554d;
  --shadow: 0 10px 24px rgba(52, 72, 72, 0.11);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  background:
    linear-gradient(180deg, rgba(118, 176, 167, 0.16), transparent 240px),
    var(--bg);
  color: var(--text);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

button,
input,
select,
textarea {
  font: inherit;
}

button {
  cursor: pointer;
}

.app-shell {
  min-height: 100vh;
  padding-bottom: 76px;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px clamp(16px, 4vw, 32px);
  background: rgba(246, 242, 233, 0.92);
  border-bottom: 1px solid rgba(222, 215, 201, 0.8);
  backdrop-filter: blur(12px);
}

.topbar h1 {
  margin: 0;
  font-size: clamp(20px, 4vw, 30px);
  letter-spacing: 0;
}

.eyebrow {
  margin: 0 0 3px;
  color: var(--accent-strong);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.status-pill,
.badge {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 4px 10px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface-strong);
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.status-pill.ready {
  color: var(--green);
}

.status-pill.error {
  color: var(--red);
}

.main-layout {
  width: min(1120px, 100%);
  margin: 0 auto;
  padding: 18px clamp(14px, 4vw, 28px);
}

.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 16px;
}

.page-head h2 {
  margin: 0;
  font-size: clamp(22px, 4vw, 32px);
  letter-spacing: 0;
}

.page-head p {
  margin: 6px 0 0;
  color: var(--muted);
}

.toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
  margin-bottom: 14px;
}

.toolbar.island-selector {
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

@media (min-width: 740px) {
  .toolbar {
    grid-template-columns: minmax(260px, 1fr) 180px 180px;
  }
}

.field,
.form-grid label {
  display: grid;
  gap: 6px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 700;
}

.input,
.select,
.textarea {
  width: 100%;
  min-height: 44px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface-strong);
  color: var(--text);
  padding: 10px 12px;
}

.textarea {
  min-height: 92px;
  resize: vertical;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.pokemon-grid {
  grid-template-columns: repeat(auto-fit, minmax(172px, 1fr));
}

.card,
.panel {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface-strong);
  box-shadow: var(--shadow);
}

.card {
  display: grid;
  gap: 10px;
  width: 100%;
  min-height: 132px;
  padding: 14px;
  text-align: left;
}

.card:hover,
.card:focus-visible {
  border-color: rgba(93, 157, 150, 0.8);
  outline: 2px solid rgba(93, 157, 150, 0.16);
}

.card-title {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.card-title strong {
  font-size: 17px;
}

.meta-list {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.meta-list li,
.chip {
  min-height: 26px;
  padding: 4px 8px;
  border: 1px solid rgba(222, 215, 201, 0.9);
  border-radius: 999px;
  background: #fbf7ed;
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
}

.panel {
  padding: 16px;
  margin-bottom: 14px;
}

.panel h3 {
  margin: 0 0 12px;
  font-size: 18px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}

.detail-item {
  padding: 10px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
}

.detail-item span {
  display: block;
  margin-bottom: 4px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.section-head h3,
.section-head p {
  margin: 0;
}

.section-head h3 {
  margin-bottom: 4px;
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.primary-button,
.secondary-button,
.danger-button {
  min-height: 42px;
  border-radius: 8px;
  padding: 9px 13px;
  border: 1px solid transparent;
  font-weight: 800;
}

.primary-button {
  background: var(--accent);
  color: white;
}

.secondary-button {
  background: var(--surface-strong);
  color: var(--accent-strong);
  border-color: var(--line);
}

.danger-button {
  background: #fff1ef;
  color: var(--red);
  border-color: #efc5bf;
}

.file-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.danger-panel {
  border-color: #efc5bf;
}

.notice {
  margin-bottom: 14px;
  padding: 11px 13px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface-strong);
  font-weight: 700;
}

.notice.success {
  color: var(--green);
  border-color: rgba(79, 143, 95, 0.35);
}

.notice.error {
  color: var(--red);
  border-color: rgba(184, 85, 77, 0.35);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 12px;
}

.form-grid .wide {
  grid-column: 1 / -1;
}

.empty-state {
  padding: 28px;
  border: 1px dashed var(--line);
  border-radius: 8px;
  background: rgba(255, 250, 240, 0.8);
  color: var(--muted);
  text-align: center;
}

.bottom-tabs {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 10;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  padding: 9px max(10px, env(safe-area-inset-right)) max(9px, env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left));
  background: rgba(255, 250, 240, 0.96);
  border-top: 1px solid var(--line);
  backdrop-filter: blur(12px);
}

.tab-button {
  min-height: 48px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--muted);
  font-size: 13px;
  font-weight: 800;
}

.tab-button.active {
  background: #e6f1ee;
  color: var(--accent-strong);
}

.split {
  display: grid;
  gap: 14px;
}

@media (min-width: 900px) {
  .split {
    grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
    align-items: start;
  }
}

.muted {
  color: var(--muted);
}

.hidden {
  display: none !important;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
}

.role-list {
  display: grid;
  gap: 14px;
}

.role-item {
  display: grid;
  gap: 14px;
}

.role-item-head {
  display: grid;
  gap: 12px;
}

@media (min-width: 740px) {
  .role-item-head {
    grid-template-columns: minmax(0, 1fr) 140px;
    align-items: start;
  }
}

.role-item-head h3,
.role-item-head p {
  margin: 0;
}

.role-item-head h3 {
  margin-bottom: 4px;
}

.goal-field {
  display: grid;
  gap: 6px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 700;
}

.role-columns {
  display: grid;
  gap: 12px;
}

@media (min-width: 760px) {
  .role-columns {
    grid-template-columns: 1fr 1fr;
  }
}

.role-columns h4 {
  margin: 0 0 8px;
  font-size: 14px;
}

.role-mini-list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.role-mini-list li {
  display: grid;
  gap: 3px;
  padding: 9px 10px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
}

.role-mini-list span {
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
}

.unset-list {
  display: grid;
  gap: 14px;
}

.unset-group {
  display: grid;
  gap: 10px;
}

.unset-item-list {
  display: grid;
  gap: 8px;
}

.unset-item {
  display: grid;
  gap: 10px;
  align-items: center;
  padding: 10px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
}

@media (min-width: 720px) {
  .unset-item {
    grid-template-columns: minmax(0, 1fr) auto;
  }
}

.unset-item p {
  margin: 4px 0 0;
}

.sticky-actions {
  position: sticky;
  bottom: 76px;
  display: flex;
  justify-content: flex-end;
  padding: 10px 0 0;
}

.todo-list {
  display: grid;
  gap: 14px;
}

.todo-group-list {
  display: grid;
  gap: 10px;
}

.todo-group {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface-strong);
  overflow: hidden;
}

.todo-group summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  cursor: pointer;
}

.todo-group summary span:first-child {
  display: grid;
  gap: 3px;
}

.todo-group-body {
  display: grid;
  gap: 12px;
  padding: 0 12px 12px;
}

.todo-candidate-list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.todo-candidate-list li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 9px 10px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
  font-weight: 700;
}

.island-todo-list,
.island-force-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
}

.compact-list {
  margin-top: 8px;
}

.todo-card {
  display: grid;
  gap: 14px;
}

.todo-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.todo-card-head h3 {
  margin-bottom: 4px;
}

.todo-card-head p {
  margin: 0;
}

.todo-islands {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface-strong);
}

.data-table th,
.data-table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--line);
  text-align: left;
  vertical-align: top;
}

.data-table th {
  background: var(--surface);
  color: var(--muted);
  font-size: 12px;
}

.data-table tr:last-child td {
  border-bottom: 0;
}
