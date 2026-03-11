// ╔══════════════════════════════════════════════════════════════╗
// ║             js/board.js — Venture Task Board Page           ║
// ╚══════════════════════════════════════════════════════════════╝

import DB from "./db.js";
import { navigate, selectedVentureId, toast } from "./app.js";

const PRIORITY = {
  high:   { icon: "🔥", label: "High Impact", cls: "priority-high"   },
  medium: { icon: "⚡", label: "Medium",       cls: "priority-medium" },
  low:    { icon: "·",  label: "Low",          cls: "priority-low"    },
};
const STATE_STYLES = {
  Active:   { tag: "tag-active",   glow: "#00ff9d" },
  Maintain: { tag: "tag-maintain", glow: "#f59e0b" },
  Incubate: { tag: "tag-incubate", glow: "#818cf8" },
};

export async function renderBoard(container) {
  const ventureId = selectedVentureId;
  const [ventures, tasks] = await Promise.all([
    DB.getVentures(),
    DB.getTasks(ventureId)
  ]);

  const venture = ventures.find(v => v.id === ventureId);
  if (!venture) {
    container.innerHTML = `<div class="empty-state"><div class="empty-text">Venture not found.</div></div>`;
    return;
  }

  const ss  = STATE_STYLES[venture.state] || STATE_STYLES.Active;
  const open = tasks.filter(t => !t.completed).length;
  const done = tasks.filter(t => t.completed).length;

  let filter   = "all";
  let priority = "all";

  function getFiltered(taskList) {
    let f = [...taskList];
    if (filter === "pending") f = f.filter(t => !t.completed);
    if (filter === "done")    f = f.filter(t => t.completed);
    if (priority !== "all")   f = f.filter(t => t.priority === priority);
    // Sort: high > medium > low, then by createdAt
    const pOrder = { high: 0, medium: 1, low: 2 };
    return f.sort((a, b) => (pOrder[a.priority]||1) - (pOrder[b.priority]||1));
  }

  function renderTaskList(taskList) {
    const filtered = getFiltered(taskList);
    const listEl = container.querySelector("#taskList");
    if (!listEl) return;

    if (filtered.length === 0) {
      listEl.innerHTML = `<div class="empty-state"><div class="empty-icon">◻</div><div class="empty-text">No tasks match this filter.</div></div>`;
      return;
    }

    listEl.innerHTML = filtered.map(task => {
      const p = PRIORITY[task.priority] || PRIORITY.medium;
      return `
        <div class="task-item ${task.completed ? 'done' : ''}" data-tid="${task.id}">
          <div class="check-box ${task.completed ? 'checked' : ''}" data-toggle="${task.id}"></div>
          <span class="${p.cls}" style="font-size:16px;flex-shrink:0;">${p.icon}</span>
          <span class="task-title">${task.title}</span>
          <span class="${p.cls}" style="font-family:var(--font-mono);font-size:10px;flex-shrink:0;display:none;">${p.label}</span>
          <div class="task-actions">
            <span class="tag ${task.completed ? 'tag-done' : 'tag-pending'}">${task.completed ? 'Done' : 'Pending'}</span>
            <button class="btn btn-sm btn-danger delete-task" data-tid="${task.id}" title="Delete">✕</button>
          </div>
        </div>
      `;
    }).join("");

    // Bind task actions
    listEl.querySelectorAll("[data-toggle]").forEach(el => {
      el.addEventListener("click", async () => {
        const tid  = el.dataset.toggle;
        const task = tasks.find(t => t.id === tid);
        if (!task) return;
        task.completed = !task.completed;
        await DB.updateTask(tid, { completed: task.completed });
        // Update stats
        const newOpen = tasks.filter(t => !t.completed).length;
        const newDone = tasks.filter(t => t.completed).length;
        container.querySelector("#statOpen").textContent = newOpen;
        container.querySelector("#statDone").textContent = newDone;
        renderTaskList(tasks);
        toast(task.completed ? "✓ Task completed" : "Task reopened");
      });
    });

    listEl.querySelectorAll(".delete-task").forEach(btn => {
      btn.addEventListener("click", async () => {
        const tid  = btn.dataset.tid;
        const task = tasks.find(t => t.id === tid);
        if (!confirm(`Delete "${task?.title}"?`)) return;
        await DB.deleteTask(tid);
        const idx = tasks.findIndex(t => t.id === tid);
        if (idx !== -1) tasks.splice(idx, 1);
        const newOpen = tasks.filter(t => !t.completed).length;
        const newDone = tasks.filter(t => t.completed).length;
        container.querySelector("#statOpen").textContent = newOpen;
        container.querySelector("#statDone").textContent = newDone;
        renderTaskList(tasks);
        toast("Task deleted");
      });
    });

    // Show priority label on large screens
    if (window.innerWidth > 768) {
      listEl.querySelectorAll(".task-actions + span, .task-title + span").forEach(el => el.style.display = "block");
    }
  }

  container.innerHTML = `
    <div>
      <button class="back-btn" id="backBtn">← Back to Dashboard</button>

      <!-- Venture Header -->
      <div class="page-header fade-up">
        <div class="flex gap-8 mb-8" style="flex-wrap:wrap;">
          <span class="tag ${ss.tag}">${venture.state}</span>
          ${venture.blocked ? '<span class="tag tag-blocked">Blocked</span>' : ''}
        </div>
        <div class="flex justify-between items-center flex-wrap gap-12">
          <h1 class="page-title">${venture.name}</h1>
          <div class="flex gap-12">
            <div class="stat-chip" style="min-width:80px;text-align:center;">
              <span class="chip-val" id="statOpen">${open}</span>
              <span class="chip-lbl">OPEN</span>
            </div>
            <div class="stat-chip" style="min-width:80px;text-align:center;">
              <span class="chip-val" id="statDone" style="color:var(--accent)">${done}</span>
              <span class="chip-lbl">DONE</span>
            </div>
          </div>
        </div>
        <div style="font-family:var(--font-mono);font-size:11px;color:var(--muted2);margin-top:8px;">
          ${venture.currentObjective || "—"} · ${venture.weeklyOutcome || "—"} · 
          <span style="color:var(--accent);">${venture.keyMetric || "—"}</span>
        </div>
      </div>

      <!-- Add Task -->
      <div class="card fade-up-2 mb-20">
        <div class="card-label">ADD TASK</div>
        <div class="form-row">
          <div class="form-group" style="flex:3;">
            <input id="taskTitle" placeholder="Task title..." />
          </div>
          <div class="form-group" style="flex:1;min-width:150px;">
            <select id="taskPriority">
              <option value="high">🔥 High Impact</option>
              <option value="medium" selected>⚡ Medium</option>
              <option value="low">· Low</option>
            </select>
          </div>
          <div style="display:flex;align-items:flex-end;">
            <button class="btn btn-md btn-primary" id="addTaskBtn">+ Add Task</button>
          </div>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="filter-bar fade-up-3">
        <button class="filter-pill active" data-filter="all">ALL</button>
        <button class="filter-pill" data-filter="pending">PENDING</button>
        <button class="filter-pill" data-filter="done">DONE</button>
        <div style="width:1px;height:20px;background:var(--border);margin:0 4px;"></div>
        <button class="filter-pill active" data-priority="all">ALL PRIORITY</button>
        <button class="filter-pill" data-priority="high">🔥 HIGH</button>
        <button class="filter-pill" data-priority="medium">⚡ MEDIUM</button>
        <button class="filter-pill" data-priority="low">· LOW</button>
      </div>

      <!-- Task List -->
      <div id="taskList" class="fade-up-4" style="display:flex;flex-direction:column;gap:8px;"></div>
    </div>
  `;

  // Back button
  container.querySelector("#backBtn").addEventListener("click", () => navigate("dashboard"));

  // Initial render
  renderTaskList(tasks);

  // Add task
  const addTask = async () => {
    const title = container.querySelector("#taskTitle").value.trim();
    if (!title) { toast("Task title is required.", "error"); return; }
    const btn = container.querySelector("#addTaskBtn");
    btn.textContent = "Adding..."; btn.disabled = true;

    const task = await DB.addTask({
      ventureId,
      title,
      priority: container.querySelector("#taskPriority").value,
    });
    tasks.push(task);
    container.querySelector("#taskTitle").value = "";
    btn.textContent = "+ Add Task"; btn.disabled = false;
    container.querySelector("#statOpen").textContent = tasks.filter(t => !t.completed).length;
    renderTaskList(tasks);
    toast("✓ Task added");
  };

  container.querySelector("#addTaskBtn").addEventListener("click", addTask);
  container.querySelector("#taskTitle").addEventListener("keydown", e => e.key === "Enter" && addTask());

  // Status filters
  container.querySelectorAll("[data-filter]").forEach(pill => {
    pill.addEventListener("click", () => {
      container.querySelectorAll("[data-filter]").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      filter = pill.dataset.filter;
      renderTaskList(tasks);
    });
  });

  // Priority filters
  container.querySelectorAll("[data-priority]").forEach(pill => {
    pill.addEventListener("click", () => {
      container.querySelectorAll("[data-priority]").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      priority = pill.dataset.priority;
      renderTaskList(tasks);
    });
  });
}
