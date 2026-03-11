// ╔═══════════════════════════════════════════════════════════════╗
// ║            js/firebase.js — Firebase Configuration          ║
// ║                                                              ║
// ║  SETUP INSTRUCTIONS:                                         ║
// ║  1. Go to https://console.firebase.google.com                ║
// ║  2. Create a new project (or use existing)                   ║
// ║  3. Click "Add app" → Web (</>)                              ║
// ║  4. Copy your firebaseConfig and paste it below              ║
// ║  5. Enable Firestore Database in the Firebase console        ║
// ║  6. Set Firestore rules to allow read/write (for dev):       ║
// ║     rules_version = '2';                                     ║
// ║     service cloud.firestore {                                ║
// ║       match /databases/{database}/documents {                ║
// ║         match /{document=**} {                               ║
// ║           allow read, write: if true;                        ║
// ║         }                                                     ║
// ║       }                                                       ║
// ║     }                                                         ║
// ╚══════════════════════════════════════════════════════════════╝

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ─── PASTE YOUR FIREBASE CONFIG HERE ─────────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyC78w7fvmlZK6fzg0Xpwq99DNDrcFURpj8",
  authDomain:        "founderos-c69cc.firebaseapp.com",
  projectId:         "founderos-c69cc",
  storageBucket:     "founderos-c69cc.firebasestorage.app",
  messagingSenderId: "555326494817",
  appId:             "1:555326494817:web:db434257de276dfbb07220"
};
// ─────────────────────────────────────────────────────────────────────────────

let db = null;

// Only attempt Firebase init if config has been filled in
const configIsReal = firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY";

if (configIsReal) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("✅ Firebase connected:", firebaseConfig.projectId);
  } catch (err) {
    console.warn("⚠️ Firebase init failed — running in offline mode.", err.message);
    db = null;
  }
} else {
  console.info("ℹ️ Firebase not configured — running in localStorage offline mode.");
}

export { db };
export const isFirebaseReady = () => db !== null;
