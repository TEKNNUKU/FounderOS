// ╔══════════════════════════════════════════════════════════════╗
// ║              js/db.js — Database Abstraction Layer           ║
// ║  Wraps Firestore. Falls back to localStorage if Firebase     ║
// ║  is not configured — so the app works immediately.           ║
// ╚══════════════════════════════════════════════════════════════╝

import { db, isFirebaseReady } from "./firebase.js";

import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const LS_KEY = "founder_os_v2";

// ── Default seed data ─────────────────────────────────────────────────────────
const SEED = {
  ventures: [
    { id: "gata",       name: "GATA Protocol",     state: "Active",   currentObjective: "Beta Launch",       weeklyOutcome: "Signup page live",    keyMetric: "500 users",   blocked: false },
    { id: "jobletters", name: "jobletters.xyz",     state: "Active",   currentObjective: "Resume AI Feature", weeklyOutcome: "AI draft live",       keyMetric: "200 users",   blocked: true  },
    { id: "teknnuku",   name: "TEKNNUKU Studio",    state: "Incubate", currentObjective: "Brand identity",    weeklyOutcome: "Logo + site live",    keyMetric: "Launch",      blocked: false },
    { id: "tek1sec",    name: "TEK1SECURITY",       state: "Maintain", currentObjective: "Client retention",  weeklyOutcome: "3 renewals closed",   keyMetric: "MRR $2k",     blocked: false },
    { id: "celestial",  name: "Celestial Threads",  state: "Incubate", currentObjective: "Collection design", weeklyOutcome: "5 designs done",      keyMetric: "Pre-orders",  blocked: false },
    { id: "pawaplus",   name: "Pawaplus 9ja",       state: "Active",   currentObjective: "Market expansion",  weeklyOutcome: "Partner deals signed", keyMetric: "10 partners", blocked: false },
    { id: "autodex",    name: "AUTODEX TRADER",     state: "Incubate", currentObjective: "Algo testing",      weeklyOutcome: "Backtest results",    keyMetric: "ROI +15%",    blocked: false },
  ],
  tasks: [
    { id: "t1", ventureId: "gata",       title: "Finish GATANow UI",              priority: "high",   completed: false, createdAt: Date.now() },
    { id: "t2", ventureId: "gata",       title: "Build community onboarding flow", priority: "high",   completed: false, createdAt: Date.now() - 1000 },
    { id: "t3", ventureId: "gata",       title: "Fix GATA token integration",      priority: "medium", completed: false, createdAt: Date.now() - 2000 },
    { id: "t4", ventureId: "gata",       title: "Finish service listing system",   priority: "low",    completed: true,  createdAt: Date.now() - 3000 },
    { id: "t5", ventureId: "jobletters", title: "Resume AI integration",           priority: "high",   completed: false, createdAt: Date.now() - 4000 },
    { id: "t6", ventureId: "jobletters", title: "Landing page redesign",           priority: "medium", completed: false, createdAt: Date.now() - 5000 },
    { id: "t7", ventureId: "teknnuku",   title: "Create website wireframes",       priority: "low",    completed: false, createdAt: Date.now() - 6000 },
    { id: "t8", ventureId: "pawaplus",   title: "Draft partner agreement",         priority: "high",   completed: false, createdAt: Date.now() - 7000 },
  ],
  weeklyMission: {
    week: "This Week",
    outcomes: [
      "Launch GATA beta signup page",
      "Enroll 10 workshop students",
      "Release jobletters Resume AI feature",
      "Publish weekly vlog",
      "Close 1 TEK1SECURITY renewal"
    ],
    checked: {}
  }
};

// ── localStorage helpers ──────────────────────────────────────────────────────
function lsLoad() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(SEED));
  } catch { return JSON.parse(JSON.stringify(SEED)); }
}
function lsSave(data) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}
function uid() { return Math.random().toString(36).slice(2, 10); }

// ── Unified DB API ────────────────────────────────────────────────────────────
// The same API is used whether Firebase is connected or not.
// Firebase mode: reads/writes to Firestore
// Offline mode:  reads/writes to localStorage

const DB = {

  // ── VENTURES ────────────────────────────────────────────────────────────────

  async getVentures() {
    if (isFirebaseReady()) {
      const snap = await getDocs(collection(db, "ventures"));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    return lsLoad().ventures;
  },

  async addVenture(data) {
    if (isFirebaseReady()) {
      const ref = await addDoc(collection(db, "ventures"), { ...data, createdAt: serverTimestamp() });
      return { id: ref.id, ...data };
    }
    const store = lsLoad();
    const v = { id: uid(), ...data };
    store.ventures.push(v);
    lsSave(store);
    return v;
  },

  async updateVenture(id, data) {
    if (isFirebaseReady()) {
      await updateDoc(doc(db, "ventures", id), data);
      return;
    }
    const store = lsLoad();
    store.ventures = store.ventures.map(v => v.id === id ? { ...v, ...data } : v);
    lsSave(store);
  },

  async deleteVenture(id) {
    if (isFirebaseReady()) {
      await deleteDoc(doc(db, "ventures", id));
      // Also delete tasks
      const snap = await getDocs(query(collection(db, "tasks"), where("ventureId", "==", id)));
      await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
      return;
    }
    const store = lsLoad();
    store.ventures = store.ventures.filter(v => v.id !== id);
    store.tasks    = store.tasks.filter(t => t.ventureId !== id);
    lsSave(store);
  },

  // ── TASKS ────────────────────────────────────────────────────────────────────

  async getTasks(ventureId = null) {
    if (isFirebaseReady()) {
      let q = ventureId
        ? query(collection(db, "tasks"), where("ventureId", "==", ventureId))
        : collection(db, "tasks");
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    const all = lsLoad().tasks;
    return ventureId ? all.filter(t => t.ventureId === ventureId) : all;
  },

  async addTask(data) {
    if (isFirebaseReady()) {
      const ref = await addDoc(collection(db, "tasks"), { ...data, completed: false, createdAt: serverTimestamp() });
      return { id: ref.id, ...data, completed: false };
    }
    const store = lsLoad();
    const task = { id: uid(), ...data, completed: false, createdAt: Date.now() };
    store.tasks.push(task);
    lsSave(store);
    return task;
  },

  async updateTask(id, data) {
    if (isFirebaseReady()) {
      await updateDoc(doc(db, "tasks", id), data);
      return;
    }
    const store = lsLoad();
    store.tasks = store.tasks.map(t => t.id === id ? { ...t, ...data } : t);
    lsSave(store);
  },

  async deleteTask(id) {
    if (isFirebaseReady()) {
      await deleteDoc(doc(db, "tasks", id));
      return;
    }
    const store = lsLoad();
    store.tasks = store.tasks.filter(t => t.id !== id);
    lsSave(store);
  },

  // ── WEEKLY MISSION ───────────────────────────────────────────────────────────

  async getMission() {
    if (isFirebaseReady()) {
      const snap = await getDocs(collection(db, "weeklyMission"));
      if (snap.empty) return SEED.weeklyMission;
      // Use the most recent doc
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      docs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      return docs[0];
    }
    return lsLoad().weeklyMission;
  },

  async saveMission(data) {
    if (isFirebaseReady()) {
      // Delete old docs and create fresh one
      const snap = await getDocs(collection(db, "weeklyMission"));
      await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
      await addDoc(collection(db, "weeklyMission"), { ...data, createdAt: serverTimestamp() });
      return;
    }
    const store = lsLoad();
    store.weeklyMission = data;
    lsSave(store);
  },

  async updateMissionChecked(checked) {
    if (isFirebaseReady()) {
      const snap = await getDocs(collection(db, "weeklyMission"));
      if (!snap.empty) {
        await updateDoc(snap.docs[0].ref, { checked });
      }
      return;
    }
    const store = lsLoad();
    store.weeklyMission.checked = checked;
    lsSave(store);
  }
};

export default DB;
