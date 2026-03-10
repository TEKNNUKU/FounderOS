// ╔══════════════════════════════════════════════════════════════╗
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
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
};
// ─────────────────────────────────────────────────────────────────────────────

let app, db;

try {
  app = initializeApp(firebaseConfig);
  db  = getFirestore(app);
  console.log("✅ Firebase connected:", firebaseConfig.projectId);
} catch (err) {
  console.warn("⚠️ Firebase init failed — running in offline mode.", err.message);
  db = null;
}

export { db };
export const isFirebaseReady = () => db !== null && firebaseConfig.apiKey !== "YOUR_API_KEY";
