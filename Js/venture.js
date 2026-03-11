// ╔══════════════════════════════════════════════════════════════╗
// ║                js/ventures.js — Venture Manager Page        ║
// ╚══════════════════════════════════════════════════════════════╝

import DB from "./db.js";
import { navigate, toast } from "./app.js";

export async function renderVentures(container) {
  const ventures = await DB.getVentures();

  container.innerHTML = `
    <div>
      <div class="page-header fade-up">
        <div class="page-supertitle">PORTFOLIO MANAGEMENT</div>
        <div class="flex justify-between items-center flex-wrap gap-12">
          <h1 class="page-title">Venture <span class="accent">Manager.</span></h1>
          <button class="btn btn-md btn-primary" id="toggleAddForm">+ New Venture</button>
        </div>
      </div>

      <!-- Add Venture Form -->
      <div id="addVentureForm" class="card fade-up mb-24" style="display:none;border-color:#00ff9d25;">
        <div class="card-label" style="color:var(--accent);">NEW VENTURE</div>
        <div class="form-row mb-12">
          <div class="form-group">
            <label class="form-label">VENTURE NAME *</label>
            <input id="vName" placeholder="e.g. AUTODEX TRADER" />
          </div>
          <div class="form-group">
            <label class="form-label">STATE</label>
            <select id="vState">
              <option value="Active">Active</option>
              <option value="Maintain">Maintain</option>
              <option value="Incubate">Incubate</option>
            </select>
          </div>
        </div>
        <div class="form-row mb-12">
          <div class="form-group">
            <label class="form-label">CURRENT OBJECTIVE</label>
            <input id="vObjective" placeholder="e.g. Beta Launch" />
          </div>
          <div class="form-group">
            <label class="form-label">WEEKLY OUTCOME</label>
            <input id="vOutcome" placeholder="e.g. Signup page live" />
          </div>
          <div class="form-group">
            <label class="form-label">KEY METRIC</label>
            <input id="vMetric" placeholder="e.g. 500 users" />
          </div>
        </div>
        <div class="flex items-center gap-8" style="align-items:center;">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-family:var(--font-mono);font-size:11px;color:var(--muted2);">
            <input type="checkbox" id="vBlocked" style="width:auto;accent-color:var(--danger);" /> BLOCKED
          </label>
        </div>
        <div class="flex gap-8 mt-16">
          <button class="btn btn-md btn-primary" id="saveVenture">Create Venture</button>
          <button class="btn btn-md btn-ghost" id="cancelAdd">Cancel</button>
        </div>
      </div>

      <!-- Venture Table -->
      <div class="card fade-up-2">
        <div class="card-label">ALL VENTURES (${ventures.length})</div>
        <div class="overflow-x">
          <table class="data-table" id="ventureTable">
            <thead>
              <tr>
                <th>Venture</th>
                <th>State</th>
                <th>Objective</th>
                <th>Weekly Outcome</th>
                <th>Metric</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${ventures.length === 0 ? `
                <tr><td colspan="6">
                  <div class="empty-state"><div class="empty-icon">⬡</div><div class="empty-text">No ventures yet. Add one above.</div></div>
                </td></tr>
              ` : ventures.map(v => `
                <tr data-vid="${v.id}">
                  <td>
                    <div style="font-weight:700;font-size:14px;">${v.name}</div>
                    ${v.blocked ? '<div style="font-family:var(--font-mono);font-size:9px;color:#ff7777;margin-top:3px;">BLOCKED</div>' : ''}
                  </td>
                  <td>
                    <select class="state-select" data-vid="${v.id}" style="width:auto;padding:5px 10px;font-size:11px;">
                      <option ${v.state==='Active'?'selected':''}>Active</option>
                      <option ${v.state==='Maintain'?'selected':''}>Maintain</option>
                      <option ${v.state==='Incubate'?'selected':''}>Incubate</option>
                    </select>
                  </td>
                  <td style="font-family:var(--font-mono);font-size:11px;color:var(--muted2);">${v.currentObjective || '—'}</td>
                  <td style="font-family:var(--font-mono);font-size:11px;color:var(--muted2);">${v.weeklyOutcome || '—'}</td>
                  <td style="font-family:var(--font-mono);font-size:12px;color:var(--accent);">${v.keyMetric || '—'}</td>
                  <td>
                    <div class="flex gap-8">
                      <button class="btn btn-sm btn-ghost open-board-btn" data-vid="${v.id}">Board →</button>
                      <button class="btn btn-sm btn-ghost edit-btn" data-vid="${v.id}" title="Edit">✎</button>
                      <button class="btn btn-sm btn-danger delete-btn" data-vid="${v.id}" title="Delete">✕</button>
                    </div>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Distribution Engines Section -->
      <div class="card fade-up-3 mt-16">
        <div class="card-label">DISTRIBUTION ENGINES</div>
        <div class="grid-3">
          ${[
            { name: "Poverty2Prosperity", icon: "📢", desc: "Core audience channel" },
            { name: "Inner Circle",       icon: "⭕", desc: "Premium community"     },
            { name: "Weekly Vlog",        icon: "🎬", desc: "Video content engine"  },
            { name: "Social Media",       icon: "🌐", desc: "Reach & awareness"     },
          ].map(d => `
            <div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:16px;display:flex;align-items:center;gap:12px;">
              <span style="font-size:22px;">${d.icon}</span>
              <div>
                <div style="font-weight:700;font-size:13px;">${d.name}</div>
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--muted2);">${d.desc}</div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `;

  // ── Event bindings ──────────────────────────────────────────────────────────
  const form    = container.querySelector("#addVentureForm");
  const toggleBtn = container.querySelector("#toggleAddForm");

  toggleBtn.addEventListener("click", () => {
    form.style.display = form.style.display === "none" ? "block" : "none";
  });
  container.querySelector("#cancelAdd").addEventListener("click", () => {
    form.style.display = "none";
  });

  container.querySelector("#saveVenture").addEventListener("click", async () => {
    const name = container.querySelector("#vName").value.trim();
    if (!name) { toast("Venture name is required.", "error"); return; }

    const btn = container.querySelector("#saveVenture");
    btn.textContent = "Saving..."; btn.disabled = true;

    await DB.addVenture({
      name,
      state:            container.querySelector("#vState").value,
      currentObjective: container.querySelector("#vObjective").value.trim(),
      weeklyOutcome:    container.querySelector("#vOutcome").value.trim(),
      keyMetric:        container.querySelector("#vMetric").value.trim(),
      blocked:          container.querySelector("#vBlocked").checked,
    });
    toast(`✓ ${name} added to your portfolio`);
    navigate("ventures");
  });

  // State change
  container.querySelectorAll(".state-select").forEach(sel => {
    sel.addEventListener("change", async () => {
      await DB.updateVenture(sel.dataset.vid, { state: sel.value });
      // Color update
      const tagCls = { Active: "tag-active", Maintain: "tag-maintain", Incubate: "tag-incubate" };
      toast(`State updated to ${sel.value}`);
    });
  });

  // Open board
  container.querySelectorAll(".open-board-btn").forEach(btn => {
    btn.addEventListener("click", () => navigate("board", btn.dataset.vid));
  });

  // Delete venture
  container.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const row = btn.closest("tr");
      const name = row.querySelector("td div").textContent;
      if (!confirm(`Delete "${name}" and all its tasks? This cannot be undone.`)) return;
      btn.textContent = "..."; btn.disabled = true;
      await DB.deleteVenture(btn.dataset.vid);
      toast(`${name} removed`);
      navigate("ventures");
    });
  });

  // Edit (inline — reload with form pre-filled)
  container.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const v = ventures.find(x => x.id === btn.dataset.vid);
      if (!v) return;
      // Scroll to and fill form
      form.style.display = "block";
      form.scrollIntoView({ behavior: "smooth" });
      container.querySelector("#vName").value      = v.name;
      container.querySelector("#vState").value     = v.state;
      container.querySelector("#vObjective").value = v.currentObjective || "";
      container.querySelector("#vOutcome").value   = v.weeklyOutcome || "";
      container.querySelector("#vMetric").value    = v.keyMetric || "";
      container.querySelector("#vBlocked").checked = v.blocked;

      // Switch save button to update mode
      const saveBtn = container.querySelector("#saveVenture");
      saveBtn.textContent = "Update Venture";
      saveBtn.onclick = async () => {
        const name = container.querySelector("#vName").value.trim();
        if (!name) { toast("Name is required.", "error"); return; }
        saveBtn.textContent = "Saving..."; saveBtn.disabled = true;
        await DB.updateVenture(v.id, {
          name,
          state:            container.querySelector("#vState").value,
          currentObjective: container.querySelector("#vObjective").value.trim(),
          weeklyOutcome:    container.querySelector("#vOutcome").value.trim(),
          keyMetric:        container.querySelector("#vMetric").value.trim(),
          blocked:          container.querySelector("#vBlocked").checked,
        });
        toast(`✓ ${name} updated`);
        navigate("ventures");
      };
    });
  });
}
