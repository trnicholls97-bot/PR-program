# IronLog

## Project Overview

**App name:** IronLog (from `<meta name="apple-mobile-web-app-title" content="IronLog">`)

**Purpose:** PWA workout/exercise tracker. Users select a training day (Chest, Back, Shoulders, Legs, Misc, or custom), log sets/reps/weight per exercise, track personal records, review history, and optionally sync data across devices via Firebase.

**Tech stack:**
- Vanilla HTML, CSS, JavaScript — no framework, no build tool
- Firebase Auth (Google OAuth) + Cloud Firestore for cross-device sync
- PWA: `manifest.json` + Apple mobile web app meta tags; no service worker

---

## Project Structure

```
IronLog/
├── app/                     — Application shell & main logic
│   ├── index.html          — HTML shell: all pages, modals, nav
│   └── app.js              — Application logic & UI orchestration
├── core/                    — Backend integration & sync
│   └── firebase-sync.js     — Firebase Auth + Firestore sync
├── features/               — PWA & app metadata
│   └── manifest.json       — PWA manifest
├── resources/              — Static data & styling
│   ├── workout.js          — Exercise library & day plans
│   ├── exercise-help.json  — YouTube help video metadata
│   └── styles.css          — Application styles
└── README.md               — This file
```

### Directory Descriptions

#### `app/`
- **index.html** (393 lines)
  Main HTML shell containing all page layouts, modals, and navigation. Loads Firebase CDN, then imports app modules. Minimal inline styles except where necessary.

- **app.js** (1656 lines, ~95 KB)
  Core application logic: UI orchestration, event handling, workout/timer management, exercise operations, user authentication coordination, and cross-feature integration. Single source of truth for app state (`S` object).

#### `core/`
- **firebase-sync.js** (~15 KB)
  Firebase initialization, authentication flows (Google OAuth), Firestore sync, user session handling, and cloud persistence. Completely isolated from app business logic; Firebase-specific concerns only.

#### `features/`
- **manifest.json**
  PWA manifest defining app name, icons, display mode, and theme colors.

#### `resources/`
- **workout.js** (~21 KB)
  Exercise library (100+ exercises with MET values), day plan definitions, muscle group organization, and helpers for calorie calculation. Pure data and lookup logic—no UI.

- **exercise-help.json** (~1 KB)
  JSON-driven mapping of exercises to YouTube instructional videos. Separate from exercise database for cleaner data structure. Keys are normalized exercise IDs; values include YouTube video ID and display label.

- **styles.css** (~33 KB)
  All application styling including layout, components, theming (dark/light), typography, and responsive design. Uses CSS custom properties for theme variables.

---

## Runtime Initialization Order

1. `index.html` loads Firebase CDN scripts
2. `workout.js` is loaded (defines `EXERCISE_LIB`, `DEFAULT_DAY_PLANS`, etc.)
3. `app.js` is loaded (initializes state from localStorage, sets up event listeners)
4. `firebase-sync.js` is loaded (listens for auth state, enables cloud sync if authenticated)

---

## Key Features Implemented

- **Workout Management**: Select workout day, add exercises, log sets with weight/reps
- **Timer Control**: Start/Pause/Finish buttons; separate rest timer (starts after first set)
- **Personal Records**: Auto-detect new PRs, track history, exclude warmup sets from PR calculations
- **Exercise Help**: Embedded YouTube video tutorials for exercises with help entries
- **Theme Support**: Dark/light themes with customizable accent colors
- **Authentication**: Firebase Google OAuth; optional offline mode
- **Cloud Sync**: Firestore sync for multi-device data persistence
- **PWA**: Installable web app with offline support (data cached in localStorage)

---

## Important Paths & Assumptions

### Static Asset Paths
- From `app/index.html`:
  - CSS: `../resources/styles.css`
  - Workout data: `../resources/workout.js`
  - Firebase sync: `../core/firebase-sync.js`

- From `app/app.js` (runtime):
  - Exercise help JSON: `../resources/exercise-help.json` (relative to `index.html` location)

### Deployment & Hosting
- **Static hosting compatible**: Use relative paths; no server-side routing required
- **GitHub Pages subpath deployment**: Works with relative paths; verify manifest path in HTML
- **Service worker**: Not currently used; offline support relies on localStorage caching

---

## Development Notes

### State Management
- **Single source of truth**: `S` object (global state in `app.js`)
- **Persistence**: `saveState()` writes to localStorage; Firebase sync is asynchronous
- **Session handling**: Active workout tracked in `S.currentSession`

### Timer Architecture
- **Explicit state flags**: `isWorkoutTimerRunning`, `isRestTimerRunning`
- **Rest timer**: Starts only after first set is logged (not on exercise creation)
- **Pause behavior**: Pausing stops both workout and rest timers
- **Resume**: Rest timer resumes from paused state (not reset)

### Firebase Integration
- Auth listeners update UI dynamically
- Sync is debounced (1.2s delay after save)
- Active workout stored locally only; not synced until finished
- Auth state drives account section display in settings

---

## Common Tasks

### Add a New Exercise
Edit `resources/workout.js` and add an entry to `EXERCISE_LIB` array:
```javascript
{
  name: 'Exercise Name',
  muscle: 'Muscle Group',
  met: 5.0,
  targetSets: '3-4',
  targetReps: '8-12',
  targetWeight: 0
}
```

### Add Help Video for Exercise
Edit `resources/exercise-help.json` with a normalized exercise ID:
```json
"exercise_name": {
  "youtubeId": "VIDEO_ID",
  "label": "Display Title"
}
```
Exercise ID should be lowercase with underscores (e.g., "barbell_bench_press").

### Customize Theme Colors
In `app/index.html`, modify the CSS custom property values, or use the in-app theme editor in Settings.

---

## Known Limitations & Future Work

- No service worker (could improve offline experience)
- Calorie burn estimates are approximate (based on MET averages)
- Exercise suggestions/progressions not yet implemented
- No export to CSV/PDF
- No social features or workout sharing

---

## Testing Checklist

- [ ] App loads without errors
- [ ] Styles apply correctly (dark/light themes work)
- [ ] Firebase auth flow works if internet available
- [ ] Offline mode (no auth) works
- [ ] Workout creation and set logging works
- [ ] Rest timer starts after first set (not on exercise creation)
- [ ] Start/Pause button reflects actual timer state
- [ ] PR tracking excludes warmup sets
- [ ] Exercise help videos load (if entry exists in exercise-help.json)
- [ ] Settings account section shows login/logout correctly
- [ ] PWA manifest loads from correct path
- [ ] Data syncs to Firebase if authenticated
