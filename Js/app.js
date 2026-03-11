// ╔══════════════════════════════════════════════════════════════╗
// ║                 js/app.js — App Shell & Navigation          ║
// ╚══════════════════════════════════════════════════════════════╝

import { isFirebaseReady } from "./firebase.js";
import { renderDashboard }  from "./dashboard.js";
import { renderVentures }   from "./ventures.js";
import { renderTasks }      from "./tasks.js";
import { renderMission }    from "./mission.js";
import { renderBoard }      from "./board.js";

// ── State ─────────────────────────────────────────────────────────────────────
export let currentPage = "dashboard";
export let selectedVentureId = null;
export function setSelectedVenture(id) { selectedVentureId = id; }

// ── Toast system ──────────────────────────────────────────────────────────────
export function toast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  const el = document.createElement("div");
  el.className = `toast${type === "error" ? " error" : ""}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => { el.style.opacity = "0"; el.style.transform = "translateY(8px)"; el.style.transition = "all 0.3s ease"; }, 2200);
  setTimeout(() => el.remove(), 2600);
}

// ── Page navigation ───────────────────────────────────────────────────────────
const PAGE_RENDERERS = {
  dashboard: renderDashboard,
  ventures:  renderVentures,
  tasks:     renderTasks,
  mission:   renderMission,
  board:     renderBoard,
};

export async function navigate(page, ventureId = null) {
  if (ventureId) selectedVentureId = ventureId;
  currentPage = page;

  // Update nav active states
  document.querySelectorAll(".nav-item, .mobile-nav-item").forEach(el => {
    el.classList.toggle("active", el.dataset.page === page);
  });

  // Clear and render page
  const main = document.getElementById("mainContent");
  main.innerHTML = `<div class="loading-state"><div class="spinner"></div><span>Loading...</span></div>`;

  // Close mobile sidebar
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebarOverlay").style.display = "none";

  try {
    const renderer = PAGE_RENDERERS[page];
    if (renderer) await renderer(main);
  } catch (err) {
    console.error("Page render error:", err);
    main.innerHTML = `<div class="loading-state" style="color:var(--danger)">Failed to load page. Check console.</div>`;
  }
}

// ── Firebase status banner ────────────────────────────────────────────────────
function renderFirebaseBanner() {
  if (isFirebaseReady()) return "";
  return `
    <div class="config-notice fade-up">
      <strong>⚙️ Running in Offline Mode</strong> — Data is saved to your browser's localStorage.<br>
      To connect Firebase: open <code>js/firebase.js</code>, paste your Firebase config, and reload.
      All data will automatically sync to Firestore once connected.
    </div>
  `;
}

// ── Init ──────────────────────────────────────────────────────────────────────
function init() {
  // Set current date in sidebar footer
  const dateEl = document.getElementById("sidebarDate");
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString("en-US", {
      weekday: "long", month: "short", day: "numeric"
    }).toUpperCase();
  }

  // Firebase banner
  const banner = document.getElementById("firebaseBanner");
  if (banner) banner.innerHTML = renderFirebaseBanner();

  // Nav click handlers
  document.querySelectorAll(".nav-item, .mobile-nav-item").forEach(el => {
    el.addEventListener("click", () => navigate(el.dataset.page));
  });

  // Mobile menu
  document.getElementById("menuBtn")?.addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("open");
    document.getElementById("sidebarOverlay").style.display = "block";
  });
  document.getElementById("sidebarOverlay")?.addEventListener("click", () => {
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("sidebarOverlay").style.display = "none";
  });

  // Start on dashboard
  navigate("dashboard");
}

document.addEventListener("DOMContentLoaded", init);
