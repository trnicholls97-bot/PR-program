# IronLog

## 1. Project Overview

**App name:** IronLog (from `<meta name="apple-mobile-web-app-title" content="IronLog">`)

**Purpose:** PWA workout/exercise tracker. Users select a training day (Chest, Back, Shoulders, Legs, Misc, or custom), log sets/reps/weight per exercise, track personal records, review history, and optionally sync data across devices via Firebase.

**Tech stack:**
- Vanilla HTML, CSS, JavaScript — no framework, no build tool
- Firebase Auth (Google OAuth) + Cloud Firestore for cross-device sync
- PWA: `manifest.json` + Apple mobile web app meta tags; no service worker is present in the current codebase

---

## 2. File Structure

```
├── index.html        — HTML shell: all pages, modals, and nav; loads all scripts (393 lines)
├── app.js            — All JavaScript application logic (1656 lines, ~84 KB)
├── styles.css        — External CSS stylesheet (~33 KB)
├── workouts.js       — Workout data definitions: exercise library, day plans, MET values
├── firebase-sync.js  — Firebase Auth + Firestore integration layer
├── manifest.json     — PWA manifest
└── README.md         — This file
```

### index.html
Contains the full HTML structure and no inline JavaScript logic. Loads Firebase compat CDN scripts in `<head>`, then at end of `<body>` loads `workouts.js`, `app.js`, and `firebase-sync.js` in that order. Inline styles exist on some specific elements; the primary stylesheet is `styles.css`. Key DOM sections:

| Comment marker | Element ID(s) | Purpose |
|---|---|---|
| `<!-- ▌LOG ▌ -->` | `#page-log`, `#log-home`, `#log-active` | Day grid and active workout session |
| `<!-- ▌RECORDS ▌ -->` | `#page-records`, `#records-scroll-body` | PR records view |
| `<!-- ▌HISTORY ▌ -->` | `#page-history`, `#history-body` | Workout history |
| `<!-- ▌SETTINGS ▌ -->` | `#page-settings` | Profile, themes, plans, library, data, account |
| `<nav class="nav">` | — | Bottom navigation bar |
| `<!-- EXERCISE PICKER MODAL -->` | `#ex-modal` | Exercise add modal |
| `<!-- WORKOUT SUMMARY MODAL -->` | — | Post-workout summary |
| `<!-- THEME MODAL -->` | — | Theme color editor |
| `<!-- PLANS MODAL -->` | — | Day plan editor |
| `<!-- LIBRARY MODAL -->` | `#lib-modal` | Exercise library browser |

### app.js
All JavaScript application logic. Sections in file order:

| Lines | Section | Key symbols |
|---|---|---|
| 1–12 | CONSTANTS | `ACCENT_PRESETS` |
| 13–37 | STATE | `S`, `loadState()`, `saveState()` |
| 38–73 | TIMER | `startTimer()`, `startRestTimer()`, `resetRestTimer()` |
| 74–122 | UTILS | `e1rm()`, `isPR()`, `recordPR()`, `resolveEx()`, `allExercises()` |
| 123–204 | CALORIES | `calcTDEE()`, `calcWorkoutCalories()`, `updateLogCalBanner()` |
| 205–269 | PROFILE | `saveProfile()`, `loadProfileInputs()`, `updateTDEEDisplay()` |
| 270–414 | THEMES | `applyTheme()`, `getTheme()`, `openThemeModal()`, `setThemeColor()` |
| 415–650 | PLANS MODAL | `openPlansModal()`, `addExToDay()`, `saveNewDay()`, `renderPlansDayList()` |
| 651–789 | LIBRARY MODAL | `openLibraryModal()`, `selectLibMuscle()`, `renderLibExercises()` |
| 790–1123 | DAY/SESSION RENDERING | `renderDayGrid()`, `selectDay()`, `renderActiveSession()`, `buildExBlock()`, `buildSetRow()`, `addSet()`, `updateSet()` |
| 1124–1219 | FINISH/SUMMARY | `finishWorkout()`, `showSummary()`, `dismissSummary()` |
| 1220–1274 | EXERCISE PICKER MODAL | `openAddExercise()`, `addExToSession()` |
| 1275–1397 | RECORDS | `renderRecords()`, `renderRecordsMuscleGrid()`, `getHistoricalSets()` |
| 1398–1552 | HISTORY | `renderHistory()`, `renderHistoryList()`, `filterHistoryByDate()` |
| 1553–1619 | SETTINGS | `addCustomExercise()`, `renderCustomExList()`, `exportData()`, `importData()`, `clearAllData()` |
| 1620–1632 | NAV | `switchPage()` |
| 1634–1656 | TOAST + INIT | `showToast()`, boot sequence |

### workouts.js
Defines all workout data as global constants consumed by `app.js`:

- `DEFAULT_DAY_PLANS` — object mapping day IDs (`chest`, `back`, `shoulders`, `legs`, `misc`) to ordered arrays of exercise name strings
- `DAY_DEFS` — array of `{id, label, icon}` objects for the built-in training days
- `EXERCISE_LIB` — array of ~100 exercise objects: `{name, muscle, met, targetSets, targetReps, targetWeight}`. Grouped by muscle: Chest, Back, Shoulders, Quads, Hamstrings, Glutes, Calves, Biceps, Triceps, Core, Cardio
- `MUSCLE_ORDER` — ordered array of muscle group strings for display sorting
- `MUSCLE_ICONS` — map of muscle group → emoji
- `MET_BY_MUSCLE` — fallback MET values per muscle group (used for custom exercises)
- `CARDIO_EXERCISES` — `Set` of exercise names that track time/speed/resistance instead of weight/reps
- `EXERCISE_VARIATIONS` — map of exercise name → array of grip/style variant strings

### firebase-sync.js
Wrapped in an IIFE. Initializes Firebase using hardcoded config (`FIREBASE_CONFIG`), then:
- Detects WebView/in-app browsers and shows a warning before attempting OAuth
- Patches `window.saveState` to debounce-push state to Firestore 1200 ms after each local save
- Reads/writes a single Firestore document per user on sign-in
- Manages a Google OAuth sign-in UI overlay and a signed-in account pill

See [Section 5](#5-firebase-integration) for full details.

### manifest.json
```json
{
  "name": "IronLog",
  "short_name": "IronLog",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0d0d0d",
  "theme_color": "#0d0d0d",
  "icons": [
    { "src": "icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## 3. Architecture Notes

### Global State (`S`)
All mutable application state lives in a single object `let S = {...}` declared at `app.js:13`. It is the sole source of truth.

Key fields:

| Field | Type | Description |
|---|---|---|
| `accentColor` | string | Active accent hex (default `#ff6b35`) |
| `profile` | object | User body metrics (age, sex, weight, height, body fat) |
| `dayPlans` | object | Map of dayId → ordered exercise name array; initialized from `DEFAULT_DAY_PLANS` |
| `currentSession` | object\|null | In-progress workout; `null` when no workout active |
| `workouts` | array | Completed workout records |
| `prs` | object | Personal records keyed by exercise name |
| `cardioPrs` | object | Cardio PRs keyed by exercise name |
| `customExercises` | array | User-added exercises (same shape as `EXERCISE_LIB` entries) |
| `customDays` | array | User-added training days (same shape as `DAY_DEFS` entries) |
| `exerciseOverrides` | object | Per-exercise target overrides keyed by exercise name |
| `exerciseNameOverrides` | object | Display name overrides keyed by original exercise name |
| `dayIconOverrides` | object | Emoji overrides keyed by day ID |
| `themes` | object | Theme config: `active` key (`'dark'`\|`'light'`), plus `dark` and `light` sub-objects with color values |

**Persistence:** `saveState()` serializes `S` to `localStorage` under the key `ironlog_v6`. `loadState()` deserializes on page load. `firebase-sync.js` patches `window.saveState` to also push to Firestore.

### Script Load Order
```
workouts.js  →  app.js  →  firebase-sync.js
```
`workouts.js` must load before `app.js` because `app.js` references `DEFAULT_DAY_PLANS`, `EXERCISE_LIB`, `DAY_DEFS`, etc. at module initialization time (e.g., `S.dayPlans = JSON.parse(JSON.stringify(DEFAULT_DAY_PLANS))`). `firebase-sync.js` must load last because it patches `window.saveState` and calls DOM/app functions defined in `app.js`.

### Data Flow: workouts.js → UI
1. `EXERCISE_LIB` and `S.customExercises` are merged by `allExercises()` (`app.js:101`)
2. `resolveEx(name)` (`app.js:107`) looks up an exercise by name and merges any per-exercise overrides from `S.exerciseOverrides`
3. `getExercisesForDay(dayId)` (`app.js:112`) maps the exercise name list in `S.dayPlans[dayId]` through `resolveEx()`
4. `renderActiveSession()` and `buildExBlock()` use the resolved exercise objects to render set rows

### Page Navigation
Four pages are always present in the DOM (`#page-log`, `#page-records`, `#page-history`, `#page-settings`). `switchPage(id, btn)` (`app.js:1623`) toggles `active` class. Pages do not unmount; state is not reset between navigations.

### Boot Sequence (`app.js:1647–1655`)
```js
loadState();
applyTheme(...);
updateThemeBadges();
renderDayGrid();
// Restore active session if one was in progress
```
After `app.js` completes, `firebase-sync.js` runs and sets up `auth.onAuthStateChanged`, which calls `pullFromFirestore()` on sign-in and re-renders via `renderDayGrid()`, `loadProfileInputs()`, etc.

---

## 4. PWA Details

- **Manifest:** `manifest.json` at repo root. Linked via `<link rel="manifest">` (implicit from browser defaults; not explicitly in index.html — the browser finds it at `/manifest.json`).
- **Theme color:** `#0d0d0d` (near-black), set in both `manifest.json` and `<meta name="theme-color">`
- **Background color:** `#0d0d0d`
- **Display mode:** `standalone` (hides browser chrome)
- **Orientation:** `portrait`
- **Icons:** `icon-192.png` and `icon-512.png` must exist at repo root. Apple touch icon is embedded inline as a base64 PNG in `index.html:11`.
- **iOS install support:** `<meta name="apple-mobile-web-app-capable" content="yes">` and `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`
- **Offline support:** None. No service worker is registered. The app requires a network connection on first load and for Firebase sync. Assets are not cached.

---

## 5. Firebase Integration

**SDK version:** Firebase compat 9.23.0, loaded from `gstatic.com` CDN.

**Services used:**
- `firebase/auth` — Google OAuth via `signInWithPopup`
- `firebase/firestore` — document read/write

**Firestore data path:**
```
users/{uid}/data/state   (single document per user)
```

**Fields written to Firestore** (from `pushToFirestore()` in `firebase-sync.js`):
`workouts`, `prs`, `cardioPrs`, `customExercises`, `exerciseOverrides`, `dayIconOverrides`, `customDays`, `dayPlans`, `profile`, `accentColor`, `themes`, `exerciseNameOverrides`, `updatedAt`

**Field NOT synced:** `currentSession` — active workout stays local only.

**Sync behavior:**
- On sign-in: `pullFromFirestore()` fetches the document and merges into `S`, preserving `currentSession`.
- On first sign-in (no document exists): local state is pushed up to Firestore.
- On every `saveState()` call: a 1200 ms debounced `pushToFirestore()` runs.
- Sync failures are logged as warnings; the app continues in local-only mode.

**Authentication flow:**
1. `auth.onAuthStateChanged` fires on load.
2. If no user: `buildAuthUI()` creates a full-screen overlay with "Sign in with Google" and "Continue without account".
3. WebView/in-app browser is detected before OAuth attempt; a redirect overlay is shown instead.
4. On successful sign-in: overlay is removed, account pill is added to settings, `pullFromFirestore()` runs.
5. Sign-out via account pill triggers `auth.signOut()`, which re-shows the auth overlay.

---

## 6. Known Constraints

- **No build system.** All edits are direct to source files. There is no bundler, transpiler, or minifier.
- **No JS modules.** All scripts load in global scope via `<script src>`. Variables defined in `workouts.js` and `app.js` are globally accessible. Name collisions are not protected against by any module boundary.
- **Script order is load-order dependent.** `workouts.js` globals must exist before `app.js` parses; `firebase-sync.js` must load after `app.js` defines `window.saveState` and all render functions it calls.
- **CSS is in a separate file.** `styles.css` is the primary stylesheet. Some one-off styles are applied inline on specific elements in `index.html`. There is no CSS preprocessor.
- **State is a single mutable global.** All reads and writes go through `S`. There is no immutability layer, no event bus, and no reactivity system. Mutations take effect immediately; UI must be manually re-rendered after state changes.
- **No offline support.** Removing or adding service worker support would require a new file and registration code.
- **Firebase config is hardcoded** in `firebase-sync.js`. There is no environment variable system.
- **`ironlog_v6` is the localStorage schema version key.** Changing the shape of `S` without a migration path will silently drop old data on next load (handled by `Object.assign` with defaults).

---

## 7. Common Tasks

**Adding a new exercise or workout:** Add an entry to `EXERCISE_LIB` in `workouts.js` using the same object shape `{name, muscle, met, targetSets, targetReps, targetWeight}`; add the name to the relevant array in `DEFAULT_DAY_PLANS` if it should appear by default.

**Changing the UI theme/colors:** Edit CSS custom property values in `styles.css`, or modify the `dark`/`light` theme defaults in `S.themes` at `app.js:25–29`; the accent color presets are in `ACCENT_PRESETS` at `app.js:4`.

**Modifying Firebase sync behavior:** All sync logic is in `firebase-sync.js` — edit `pushToFirestore()` to change which fields are written, `pullFromFirestore()` to change merge behavior, or the debounce delay (`1200` ms) in `debouncedSave()`.

**Adding a new screen or view:** Add a `<div class="page" id="page-{name}">` block to `index.html`, add a nav button that calls `switchPage('{name}', this)`, and add a render function to `app.js` invoked from `switchPage()` when `id === '{name}'`.
