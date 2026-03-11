// ╔══════════════════════════════════════════════════════════════╗
// ║              js/tasks.js — Global Task Table Page           ║
// ╚══════════════════════════════════════════════════════════════╝

import DB from "./db.js";
import { navigate, toast } from "./app.js";

const PRIORITY = {
  high:   { icon: "🔥", label: "High Impact", cls: "priority-high"   },
  medium: { icon: "⚡", label: "Medium",       cls: "priority-medium" },
  low:    { icon: "·",  label: "Low",          cls: "priority-low"    },
};

export async function renderTasks(container) {
  const [allTasks, ventures] = await Promise.all([
    DB.getTasks(),
    DB.getVentures()
  ]);

  const ventureMap = {};
  ventures.forEach(v => { ventureMap[v.id] = v.name; });

  let filterStatus   = "all";
  let filterVenture  = "all";
  let filterPriority = "all";

  const highCount = allTasks.filter(t => t.priority === "high" && !t.completed).length;

  function getFiltered() {
    let f = [...allTasks];
    if (filterStatus  === "pending") f = f.filter(t => !t.completed);
    if (filterStatus  === "done")    f = f.filter(t =>  t.completed);
    if (filterVenture !== "all")     f = f.filter(t => t.ventureId === filterVenture);
    if (filterPriority !== "all")    f = f.filter(t => t.priority === filterPriority);
    const pOrder = { high: 0, medium: 1, low: 2 };
    return f.sort((a, b) => (pOrder[a.priority]||1) - (pOrder[b.priority]||1) || (a.createdAt||0) - (b.createdAt||0));
  }

  function renderTable() {
    const filtered = getFiltered();
    const tbody = container.querySelector("#globalTaskBody");
    if (!tbody) return;

    // Update count
    const countEl = container.querySelector("#taskCount");
    if (countEl) countEl.textContent = `${filtered.length} task${filtered.length !== 1 ? "s" : ""}`;

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">◻</div><div class="empty-text">No tasks match these filters.</div></div></td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(task => {
      const p       = PRIORITY[task.priority] || PRIORITY.medium;
      const vName   = ventureMap[task.ventureId] || task.ventureId;
      const statusCls = task.completed ? "tag-done" : "tag-pending";
      const statusLbl = task.completed ? "Done" : "Pending";
      return `
        <tr data-tid="${task.id}" style="opacity:${task.completed ? 0.55 : 1}">
          <td>
            <div class="check-box ${task.completed ? 'checked' : ''}" data-toggle="${task.id}" style="cursor:pointer;"></div>
          </td>
          <td>
            <button class="venture-link" data-vid="${task.ventureId}" style="background:none;border:none;color:var(--accent);font-family:var(--font-head);font-weight:700;font-size:13px;cursor:pointer;padding:0;">
              ${vName}
            </button>
          </td>
          <td style="font-weight:600;font-size:14px;${task.completed ? 'text-decoration:line-through;color:var(--muted);' : ''}">${task.title}</td>
          <td>
            <span class="${p.cls}" style="font-family:var(--font-mono);font-size:11px;">${p.icon} ${p.label}</span>
          </td>
          <td><span class="tag ${statusCls}">${statusLbl}</span></td>
        </tr>
      `;
    }).join("");

    // Toggle complete
    tbody.querySelectorAll("[data-toggle]").forEach(el => {
      el.addEventListener("click", async () => {
        const tid  = el.dataset.toggle;
        const task = allTasks.find(t => t.id === tid);
        if (!task) return;
        task.completed = !task.completed;
        await DB.updateTask(tid, { completed: task.completed });
        renderTable();
        toast(task.completed ? "✓ Task completed" : "Task reopened");
      });
    });

    // Venture link → board
    tbody.querySelectorAll(".venture-link").forEach(btn => {
      btn.addEventListener("click", () => navigate("board", btn.dataset.vid));
    });
  }

  container.innerHTML = `
    <div>
      <div class="page-header fade-up">
        <div class="page-supertitle">CROSS-VENTURE VIEW</div>
        <div class="flex justify-between items-center flex-wrap gap-12">
          <h1 class="page-title">Open <span class="accent">Task Board.</span></h1>
          ${highCount > 0 ? `
            <div style="background:#ff444412;border:1px solid #ff444428;border-radius:8px;padding:12px 18px;display:flex;align-items:center;gap:12px;">
              <span style="font-size:20px;">🔥</span>
              <div>
                <div style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:#ff5555;">${highCount}</div>
                <div style="font-size:10px;color:var(--muted2);letter-spacing:0.08em;">HIGH PRIORITY OPEN</div>
              </div>
            </div>
          ` : ""}
        </div>
      </div>

      <!-- Filters -->
      <div class="card fade-up-2 mb-20">
        <div class="form-row" style="align-items:flex-end;">
          <div class="form-group" style="flex:2;">
            <label class="form-label">FILTER BY VENTURE</label>
            <select id="ventureFilter">
              <option value="all">All Ventures</option>
              ${ventures.map(v => `<option value="${v.id}">${v.name}</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">PRIORITY</label>
            <select id="priorityFilter">
              <option value="all">All Priorities</option>
              <option value="high">🔥 High Impact</option>
              <option value="medium">⚡ Medium</option>
              <option value="low">· Low</option>
            </select>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;padding-bottom:1px;">
            <button class="filter-pill active" data-filter="all">ALL</button>
            <button class="filter-pill" data-filter="pending">PENDING</button>
            <button class="filter-pill" data-filter="done">DONE</button>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="card fade-up-3">
        <div class="flex justify-between items-center mb-16">
          <div class="card-label" style="margin-bottom:0;">TASKS</div>
          <span id="taskCount" style="font-family:var(--font-mono);font-size:11px;color:var(--muted2);"></span>
        </div>
        <div class="overflow-x">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:40px;"></th>
                <th>Venture</th>
                <th>Task</th>
                <th>Priority</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="globalTaskBody"></tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  // Initial render
  renderTable();

  // Filter bindings
  container.querySelector("#ventureFilter").addEventListener("change", e => {
    filterVenture = e.target.value;
    renderTable();
  });
  container.querySelector("#priorityFilter").addEventListener("change", e => {
    filterPriority = e.target.value;
    renderTable();
  });
  container.querySelectorAll("[data-filter]").forEach(pill => {
    pill.addEventListener("click", () => {
      container.querySelectorAll("[data-filter]").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      filterStatus = pill.dataset.filter;
      renderTable();
    });
  });
}
