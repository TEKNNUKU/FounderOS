// ╔══════════════════════════════════════════════════════════════╗
// ║                   js/dashboard.js — Dashboard Page          ║
// ╚══════════════════════════════════════════════════════════════╝

import DB from "./db.js";
import { navigate, toast } from "./app.js";

const PRIORITY = {
  high:   { icon: "🔥", label: "High Impact",  cls: "priority-high"   },
  medium: { icon: "⚡", label: "Medium",        cls: "priority-medium" },
  low:    { icon: "·",  label: "Low",           cls: "priority-low"    },
};

const STATE_COLOR = {
  Active:   { glow: "#00ff9d", tagCls: "tag-active"   },
  Maintain: { glow: "#f59e0b", tagCls: "tag-maintain" },
  Incubate: { glow: "#818cf8", tagCls: "tag-incubate" },
};

export async function renderDashboard(container) {
  const [mission, ventures, allTasks] = await Promise.all([
    DB.getMission(),
    DB.getVentures(),
    DB.getTasks()
  ]);

  const checked = mission.checked || {};
  const completedCount = Object.values(checked).filter(Boolean).length;
  const total = mission.outcomes?.length || 0;
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  const taskCountByVenture = {};
  const doneCountByVenture = {};
  allTasks.forEach(t => {
    taskCountByVenture[t.ventureId] = (taskCountByVenture[t.ventureId] || 0) + (t.completed ? 0 : 1);
    doneCountByVenture[t.ventureId] = (doneCountByVenture[t.ventureId] || 0) + (t.completed ? 1 : 0);
  });

  const totalOpen   = allTasks.filter(t => !t.completed).length;
  const totalDone   = allTasks.filter(t => t.completed).length;
  const highPrio    = allTasks.filter(t => !t.completed && t.priority === "high").length;
  const blockedCount = ventures.filter(v => v.blocked).length;

  container.innerHTML = `
    <div>
      <!-- Header -->
      <div class="page-header fade-up">
        <div class="page-supertitle">
          <span class="live-dot" style="display:inline-block;margin-right:8px;vertical-align:middle;"></span>
          FOUNDER CONTROL TOWER — ${new Date().toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric", year:"numeric" }).toUpperCase()}
        </div>
        <h1 class="page-title">Mission <span class="accent">Command.</span></h1>
      </div>

      <!-- Stat Row -->
      <div class="stat-row fade-up-2">
        <div class="stat-chip">
          <span class="chip-val" style="color:var(--text)">${totalOpen}</span>
          <span class="chip-lbl">Open Tasks</span>
        </div>
        <div class="stat-chip">
          <span class="chip-val" style="color:var(--accent)">${totalDone}</span>
          <span class="chip-lbl">Completed</span>
        </div>
        <div class="stat-chip">
          <span class="chip-val" style="color:#ff5555">${highPrio}</span>
          <span class="chip-lbl">🔥 High Priority</span>
        </div>
        <div class="stat-chip">
          <span class="chip-val" style="color:var(--warn)">${blockedCount}</span>
          <span class="chip-lbl">Blocked</span>
        </div>
      </div>

      <!-- Weekly Mission -->
      <div class="card fade-up-3 mb-24" style="position:relative;overflow:hidden;">
        <div style="position:absolute;top:0;right:0;width:220px;height:220px;background:radial-gradient(circle at top right,#00ff9d07,transparent);pointer-events:none;border-radius:50%;"></div>
        
        <div class="flex justify-between items-center mb-20">
          <div>
            <div class="card-label">THIS WEEK'S MISSION</div>
            <h2 style="font-weight:800;font-size:20px;">${mission.week || "Weekly Outcomes"}</h2>
          </div>
          <div style="text-align:right;">
            <div style="font-family:var(--font-mono);font-size:28px;font-weight:700;color:var(--accent);">${completedCount}/${total}</div>
            <div style="font-size:11px;color:var(--muted2);">${pct}% complete</div>
          </div>
        </div>

        <div class="progress-bar-track mb-20">
          <div class="progress-bar-fill" style="width:${pct}%"></div>
        </div>

        <div id="missionList">
          ${(mission.outcomes || []).map((outcome, i) => `
            <div class="mission-item ${checked[i] ? 'done' : ''}" data-index="${i}">
              <div class="check-box ${checked[i] ? 'checked' : ''}" data-check="${i}"></div>
              <span class="mission-text">${outcome}</span>
              <span class="mission-num">${String(i + 1).padStart(2, "0")}</span>
            </div>
          `).join("")}
        </div>

        ${total === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">◎</div>
            <div class="empty-text">No mission set.<br>
              <button onclick="window._nav('mission')" class="btn btn-sm btn-primary" style="margin-top:12px;">Set Weekly Mission →</button>
            </div>
          </div>
        ` : ""}
      </div>

      <!-- Venture Control Tower -->
      <div class="fade-up-4">
        <div class="section-header">
          <div>
            <div class="section-supertitle">PORTFOLIO OVERVIEW</div>
            <h2 class="section-title">Venture Control Tower</h2>
          </div>
          <button class="btn btn-sm btn-ghost" onclick="window._nav('ventures')">Manage Ventures →</button>
        </div>

        <div class="grid-3" id="ventureGrid">
          ${ventures.map(v => {
            const sc = STATE_COLOR[v.state] || STATE_COLOR.Active;
            const open = taskCountByVenture[v.id] || 0;
            const done = doneCountByVenture[v.id] || 0;
            return `
              <div class="venture-card" onclick="window._navBoard('${v.id}')" style="border-color: ${v.blocked ? '#ff444440' : 'var(--border)'}">
                <div class="card-glow" style="background:radial-gradient(circle at top right,${sc.glow},transparent);"></div>
                <div class="flex items-center gap-8 mb-12" style="flex-wrap:wrap;">
                  <span class="tag ${sc.tagCls}">${v.state}</span>
                  ${v.blocked ? '<span class="tag tag-blocked">Blocked</span>' : ''}
                </div>
                <div class="card-name">${v.name}</div>
                <div class="card-obj">${v.currentObjective || "—"}</div>
                <div class="card-stats">
                  <div>
                    <div class="stat-val">${open}</div>
                    <div class="stat-lbl">OPEN</div>
                  </div>
                  <div>
                    <div class="stat-val" style="color:var(--accent)">${done}</div>
                    <div class="stat-lbl">DONE</div>
                  </div>
                  <div class="card-metric">
                    <div class="metric-val">${v.keyMetric || "—"}</div>
                    <div class="metric-lbl">TARGET</div>
                  </div>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    </div>
  `;

  // Expose nav helpers globally for onclick
  window._nav      = (page) => navigate(page);
  window._navBoard = (id)   => navigate("board", id);

  // Mission checkbox handlers
  container.querySelectorAll(".check-box[data-check]").forEach(el => {
    el.addEventListener("click", async (e) => {
      e.stopPropagation();
      const i = parseInt(el.dataset.check);
      const newChecked = { ...checked, [i]: !checked[i] };
      checked[i] = !checked[i];

      el.classList.toggle("checked", checked[i]);
      el.closest(".mission-item").classList.toggle("done", checked[i]);

      // Update progress
      const done = Object.values(checked).filter(Boolean).length;
      const pctNew = total > 0 ? Math.round((done / total) * 100) : 0;
      container.querySelector(".progress-bar-fill").style.width = pctNew + "%";
      container.querySelector("[style*='font-size:28px']").textContent = `${done}/${total}`;
      container.querySelector("[style*='font-size:11px']").textContent = `${pctNew}% complete`;

      await DB.updateMissionChecked(newChecked);
    });
  });

  // Venture card hover: border color
  container.querySelectorAll(".venture-card").forEach(card => {
    const id = card.getAttribute("onclick").match(/'(.+?)'/)[1];
    const v  = ventures.find(v => v.id === id);
    if (!v) return;
    const sc = STATE_COLOR[v.state] || STATE_COLOR.Active;
    card.addEventListener("mouseenter", () => { if (!v.blocked) card.style.borderColor = sc.glow + "60"; });
    card.addEventListener("mouseleave", () => { card.style.borderColor = v.blocked ? "#ff444440" : "var(--border)"; });
  });
}
