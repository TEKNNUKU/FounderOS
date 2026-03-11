// ╔══════════════════════════════════════════════════════════════╗
// ║             js/mission.js — Weekly Mission Planning Page    ║
// ╚══════════════════════════════════════════════════════════════╝

import DB from "./db.js";
import { navigate, toast } from "./app.js";

export async function renderMission(container) {
  const mission = await DB.getMission();

  container.innerHTML = `
    <div>
      <div class="page-header fade-up">
        <div class="page-supertitle">SUNDAY PLANNING RITUAL</div>
        <h1 class="page-title">Weekly Mission <span class="accent">Command.</span></h1>
      </div>

      <!-- Mission Editor -->
      <div class="card fade-up-2 mb-20" style="max-width:700px;">
        <div class="card-label">WEEK LABEL</div>
        <input id="weekLabel" value="${mission.week || ""}" placeholder="e.g. March 10 – 16, 2025" style="margin-bottom:24px;" />

        <div class="card-label">MISSION-CRITICAL OUTCOMES</div>
        <div style="font-family:var(--font-mono);font-size:11px;color:var(--muted2);margin-bottom:10px;">
          Enter one outcome per line. These become your daily mission checklist.
        </div>
        <textarea id="outcomesText" rows="10" placeholder="Launch GATA beta signup page&#10;Enroll 10 workshop students&#10;Release jobletters Resume AI feature&#10;Publish weekly vlog&#10;Close 1 TEK1SECURITY renewal">${(mission.outcomes || []).join("\n")}</textarea>

        <div style="display:flex;align-items:center;gap:16px;margin-top:20px;flex-wrap:wrap;">
          <button class="btn btn-lg btn-primary" id="saveMissionBtn">Save Mission →</button>
          <button class="btn btn-md btn-ghost" id="clearMissionBtn">Clear All</button>
          <span id="savedMsg" style="font-family:var(--font-mono);font-size:12px;color:var(--accent);opacity:0;transition:opacity 0.3s;">
            ✓ Saved to Control Tower
          </span>
        </div>
      </div>

      <!-- Current Mission Preview -->
      <div class="card fade-up-3 mb-20" style="max-width:700px;">
        <div class="card-label">CURRENT MISSION PREVIEW</div>
        <div id="missionPreview" style="display:flex;flex-direction:column;gap:2px;">
          ${(mission.outcomes || []).length === 0
            ? `<div class="empty-state"><div class="empty-icon">◎</div><div class="empty-text">No outcomes set yet.</div></div>`
            : (mission.outcomes || []).map((o, i) => `
              <div style="display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid var(--border);">
                <span style="font-family:var(--font-mono);font-size:11px;color:var(--accent);min-width:24px;">${String(i+1).padStart(2,"0")}</span>
                <span style="font-weight:600;font-size:14px;">${o}</span>
              </div>
            `).join("")
          }
        </div>
      </div>

      <!-- Founder Workflow -->
      <div class="card fade-up-4" style="max-width:700px;">
        <div class="card-label">YOUR FOUNDER WORKFLOW</div>
        <div>
          <div class="workflow-step">
            <span class="workflow-step-num">SUNDAY</span>
            <span class="workflow-step-desc">Define your 3–5 mission-critical outcomes here. These are the only things that truly matter this week.</span>
          </div>
          <div class="workflow-step">
            <span class="workflow-step-num">DAILY</span>
            <span class="workflow-step-desc">Open the Dashboard. Only work on tasks that directly drive your weekly outcomes. Ignore everything else.</span>
          </div>
          <div class="workflow-step">
            <span class="workflow-step-num">TRACKING</span>
            <span class="workflow-step-desc">Check off outcomes as they're completed. Your progress bar on the Dashboard reflects your week in real time.</span>
          </div>
          <div class="workflow-step">
            <span class="workflow-step-num">REVIEW</span>
            <span class="workflow-step-desc">Every Friday: review what you completed vs what you didn't. Carry unfinished outcomes to next week. Learn and iterate.</span>
          </div>
        </div>
      </div>
    </div>
  `;

  // Save mission
  container.querySelector("#saveMissionBtn").addEventListener("click", async () => {
    const week     = container.querySelector("#weekLabel").value.trim();
    const text     = container.querySelector("#outcomesText").value;
    const outcomes = text.split("\n").map(s => s.trim()).filter(Boolean);

    if (outcomes.length === 0) { toast("Add at least one outcome.", "error"); return; }

    const btn = container.querySelector("#saveMissionBtn");
    btn.textContent = "Saving..."; btn.disabled = true;

    await DB.saveMission({ week: week || "This Week", outcomes, checked: {} });

    btn.textContent = "Save Mission →"; btn.disabled = false;
    toast("✓ Mission saved to Control Tower");

    // Show saved message
    const msg = container.querySelector("#savedMsg");
    msg.style.opacity = "1";
    setTimeout(() => { msg.style.opacity = "0"; }, 2500);

    // Update preview
    container.querySelector("#missionPreview").innerHTML = outcomes.map((o, i) => `
      <div style="display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid var(--border);">
        <span style="font-family:var(--font-mono);font-size:11px;color:var(--accent);min-width:24px;">${String(i+1).padStart(2,"0")}</span>
        <span style="font-weight:600;font-size:14px;">${o}</span>
      </div>
    `).join("");
  });

  // Clear
  container.querySelector("#clearMissionBtn").addEventListener("click", () => {
    if (confirm("Clear all outcomes?")) {
      container.querySelector("#outcomesText").value = "";
      container.querySelector("#weekLabel").value = "";
    }
  });
}
