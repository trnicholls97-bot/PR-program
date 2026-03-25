// ══════════════════════════════════════════════
//  IRONLOG — FIREBASE SYNC LAYER
//  Drop this AFTER your main app script block.
//  Requires Firebase compat SDKs loaded via CDN.
// ══════════════════════════════════════════════

(function () {
  // ── Config ────────────────────────────────────
  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyB4p9ladsBpr4CoMPnysQbDNcWMiUR5onc",
    authDomain: "ironlog-41457.firebaseapp.com",
    projectId: "ironlog-41457",
    storageBucket: "ironlog-41457.firebasestorage.app",
    messagingSenderId: "1049172749246",
    appId: "1:1049172749246:web:71289c76d1e1fba8d167ef",
    measurementId: "G-X5XWMP8T41",
  };

  // ── Init ──────────────────────────────────────
  if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
  const auth = firebase.auth();
  const db   = firebase.firestore();

  // ── Debounce helper ───────────────────────────
  let saveTimer = null;
  function debouncedSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(pushToFirestore, 1200);
  }

  // ── Firestore path for current user ───────────
  function userDoc() {
    const uid = auth.currentUser?.uid;
    if (!uid) return null;
    return db.collection("users").doc(uid).collection("data").doc("state");
  }

  // ── Push local state → Firestore ──────────────
  async function pushToFirestore() {
    const ref = userDoc();
    if (!ref) return;
    try {
      // We store everything except currentSession (active workout stays local)
      const payload = {
        workouts:            S.workouts,
        prs:                 S.prs,
        cardioPrs:           S.cardioPrs || {},
        customExercises:     S.customExercises,
        exerciseOverrides:   S.exerciseOverrides,
        dayIconOverrides:    S.dayIconOverrides || {},
        customDays:          S.customDays || [],
        dayPlans:            S.dayPlans,
        profile:             S.profile,
        accentColor:         S.accentColor,
        themes:              S.themes || {},
        exerciseNameOverrides: S.exerciseNameOverrides || {},
        updatedAt:           firebase.firestore.FieldValue.serverTimestamp(),
      };
      await ref.set(payload, { merge: true });
    } catch (err) {
      console.warn("Firestore save failed:", err.message);
    }
  }

  // ── Pull Firestore → local state ──────────────
  async function pullFromFirestore() {
    const ref = userDoc();
    if (!ref) return;
    try {
      const snap = await ref.get();
      if (!snap.exists) {
        // First login — push local data up so it isn't lost
        await pushToFirestore();
        return;
      }
      const data = snap.data();
      // Merge into S without overwriting active session
      const session = S.currentSession;
      Object.assign(S, {
        workouts:            data.workouts            ?? S.workouts,
        prs:                 data.prs                ?? S.prs,
        cardioPrs:           data.cardioPrs           ?? S.cardioPrs ?? {},
        customExercises:     data.customExercises     ?? S.customExercises,
        exerciseOverrides:   data.exerciseOverrides   ?? S.exerciseOverrides,
        dayIconOverrides:    data.dayIconOverrides    ?? S.dayIconOverrides ?? {},
        customDays:          data.customDays          ?? S.customDays ?? [],
        dayPlans:            data.dayPlans            ?? S.dayPlans,
        profile:             data.profile             ?? S.profile,
        accentColor:         data.accentColor         ?? S.accentColor,
        themes:              data.themes              ?? S.themes ?? {},
        exerciseNameOverrides: data.exerciseNameOverrides ?? S.exerciseNameOverrides ?? {},
      });
      S.currentSession = session; // restore active workout
      saveState(); // persist to localStorage as cache
      // Re-render everything
      applyTheme((S.themes && S.themes.active) || "dark");
      renderDayGrid();
      renderCustomExList();
      loadProfileInputs();
      updateThemeBadges();
      showToast("☁️ Data synced", false);
    } catch (err) {
      console.warn("Firestore pull failed:", err.message);
    }
  }

  // ── Patch saveState to also push to Firestore ─
  const _originalSaveState = window.saveState;
  window.saveState = function () {
    _originalSaveState();        // keep localStorage cache
    debouncedSave();             // async push to Firestore
  };

  // ── Auth UI ───────────────────────────────────
  function buildAuthUI() {
    const overlay = document.createElement("div");
    overlay.id = "auth-overlay";
    overlay.style.cssText = `
      position:fixed;inset:0;z-index:9999;
      background:var(--bg,#0d0d0d);
      display:flex;flex-direction:column;
      align-items:center;justify-content:center;
      gap:24px;padding:40px 32px;
      font-family:'Barlow',sans-serif;
    `;
    overlay.innerHTML = `
      <div style="font-size:52px">🏋️</div>
      <div style="text-align:center">
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:40px;font-weight:800;
                    letter-spacing:.04em;text-transform:uppercase;color:var(--text,#f2f2f2)">
          IronLog
        </div>
        <div style="font-size:13px;color:var(--muted2,#888);margin-top:6px">
          Sign in to sync across devices
        </div>
      </div>

      <button id="google-signin-btn" style="
        display:flex;align-items:center;gap:12px;
        background:#fff;color:#1c1c1e;
        border:none;border-radius:14px;
        padding:14px 24px;cursor:pointer;
        font-family:'Barlow',sans-serif;font-size:16px;font-weight:700;
        box-shadow:0 4px 20px rgba(0,0,0,.4);
        width:100%;max-width:280px;justify-content:center;
        transition:opacity .15s;
      ">
        <svg width="20" height="20" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        Sign in with Google
      </button>

      <button id="offline-btn" style="
        background:none;border:none;
        color:var(--muted2,#888);font-family:'Barlow',sans-serif;
        font-size:13px;cursor:pointer;padding:4px;
        text-decoration:underline;text-underline-offset:3px;
      ">
        Continue without account
      </button>

      <div id="auth-error" style="
        color:#ff4d6d;font-size:12px;text-align:center;display:none;
        max-width:260px;line-height:1.5;
      "></div>
    `;
    document.body.appendChild(overlay);

    document.getElementById("google-signin-btn").onclick = async () => {
      const btn = document.getElementById("google-signin-btn");
      btn.style.opacity = ".5";
      btn.textContent = "Signing in…";
      try {
        const provider = new firebase.auth.GoogleAuthProvider();
        await auth.signInWithPopup(provider);
      } catch (err) {
        btn.style.opacity = "1";
        btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 48 48">...</svg> Sign in with Google`;
        const errEl = document.getElementById("auth-error");
        errEl.textContent = err.code === "auth/popup-blocked"
          ? "Popup blocked. Allow popups for this site and try again."
          : err.message;
        errEl.style.display = "block";
      }
    };

    document.getElementById("offline-btn").onclick = () => {
      dismissAuthOverlay();
      showToast("Running offline — data stays on this device", false);
    };
  }

  function dismissAuthOverlay() {
    const overlay = document.getElementById("auth-overlay");
    if (overlay) overlay.remove();
  }

  // ── Account header pill (shown when signed in) ─
  function buildAccountPill(user) {
    // Remove old pill if exists
    const old = document.getElementById("account-pill");
    if (old) old.remove();

    const pill = document.createElement("div");
    pill.id = "account-pill";
    pill.style.cssText = `
      position:fixed;top:calc(env(safe-area-inset-top,0px) + 8px);right:12px;
      z-index:500;display:flex;align-items:center;gap:8px;
      background:var(--surface,#181818);border:1px solid var(--border,#2e2e2e);
      border-radius:20px;padding:5px 10px 5px 5px;cursor:pointer;
      font-family:'Barlow',sans-serif;font-size:12px;color:var(--muted2,#888);
      box-shadow:0 2px 12px rgba(0,0,0,.3);
    `;
    const avatar = user.photoURL
      ? `<img src="${user.photoURL}" style="width:22px;height:22px;border-radius:50%;object-fit:cover">`
      : `<div style="width:22px;height:22px;border-radius:50%;background:var(--accent,#ff6b35);
                     display:flex;align-items:center;justify-content:center;
                     font-size:11px;font-weight:700;color:#fff">
           ${(user.displayName||user.email||"?")[0].toUpperCase()}
         </div>`;
    const name = user.displayName?.split(" ")[0] || user.email?.split("@")[0] || "Account";
    pill.innerHTML = `${avatar}<span>${name}</span>`;
    pill.onclick = () => {
      if (confirm(`Sign out of IronLog?\n\nYour data will remain synced to ${user.email || "your account"}.`)) {
        auth.signOut();
      }
    };
    document.body.appendChild(pill);
  }

  // ── Auth state listener ───────────────────────
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      // Signed in
      dismissAuthOverlay();
      buildAccountPill(user);
      await pullFromFirestore();
    } else {
      // Signed out — remove pill and show auth screen
      const pill = document.getElementById("account-pill");
      if (pill) pill.remove();
      // Only show overlay if not already present
      if (!document.getElementById("auth-overlay")) {
        buildAuthUI();
      }
    }
  });

})();
