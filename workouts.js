// ══════════════════════════════════════════════
//  IRONLOG — WORKOUT DATA
//  Edit this file to customize exercises,
//  day plans, and calorie estimates.
// ══════════════════════════════════════════════

// MET values: energy cost relative to rest (1.0)
// Compendium of Physical Activities reference values,
// adjusted for typical gym rest intervals.
// Higher = more calories per minute of session time.

const DEFAULT_DAY_PLANS = {
  chest:     ['Barbell Bench Press','Incline Dumbbell Bench Press','Machine Pectoral Fly','Triceps Pushdown (machine)','Tricep Pushdown (bar)','Decline Sit-ups','Cardio'],
  back:      ['Landmine Rows','Seated/Low Row','Assisted Pullups','Pulldowns','Standing Bicep Curls','Decline Sit-ups','Cardio'],
  shoulders: ['Overhead Barbell Press','Single-Arm Rear Delt Flys','Dumbbell Lateral Raises','Cable Lateral Raises','Cardio'],
  legs:      ['Hack Squat','Leg Press','Quad Extensions (machine)','Laying Hamstring Curls (machine)','Glute/Back Extensions or Hip Thrusts','Decline Sit-ups','Cardio'],
  misc:      [],
};

const DAY_DEFS = [
  {id:'chest',     label:'Chest Day',    icon:'💪'},
  {id:'back',      label:'Back Day',     icon:'🏋️'},
  {id:'shoulders', label:'Shoulder Day', icon:'🔱'},
  {id:'legs',      label:'Leg Day',      icon:'🦵'},
  {id:'misc',      label:'Misc',         icon:'⚡'},
];

// ── CHEST ───────────────────────────────────────
// Compound presses are metabolically expensive (MET 5-6);
// isolation flies are lower (MET 3.5-4).
const EXERCISE_LIB = [
  {name:'Barbell Bench Press',              muscle:'Chest',      met:5.5, targetSets:'4-5 warmup + 5 working', targetReps:'5-8',    targetWeight:0},
  {name:'Dumbbell Bench Press',             muscle:'Chest',      met:5.0, targetSets:'4',                      targetReps:'8-12',   targetWeight:0},
  {name:'Incline Barbell Bench Press',      muscle:'Chest',      met:5.5, targetSets:'4',                      targetReps:'6-10',   targetWeight:0},
  {name:'Incline Dumbbell Bench Press',     muscle:'Chest',      met:5.0, targetSets:'3',                      targetReps:'8-12',   targetWeight:0},
  {name:'Decline Barbell Bench Press',      muscle:'Chest',      met:5.5, targetSets:'3',                      targetReps:'6-10',   targetWeight:0},
  {name:'Machine Chest Press',              muscle:'Chest',      met:4.5, targetSets:'3',                      targetReps:'10-15',  targetWeight:0},
  {name:'Machine Pectoral Fly',             muscle:'Chest',      met:3.5, targetSets:'4',                      targetReps:'10-15',  targetWeight:0},
  {name:'Cable Fly (low to high)',          muscle:'Chest',      met:3.5, targetSets:'3',                      targetReps:'12-15',  targetWeight:0},
  {name:'Cable Fly (high to low)',          muscle:'Chest',      met:3.5, targetSets:'3',                      targetReps:'12-15',  targetWeight:0},
  {name:'Dumbbell Fly',                     muscle:'Chest',      met:3.5, targetSets:'3',                      targetReps:'12-15',  targetWeight:0},
  {name:'Push-ups',                         muscle:'Chest',      met:4.0, targetSets:'3',                      targetReps:'15-20',  targetWeight:0},
  {name:'Dips',                             muscle:'Chest',      met:5.0, targetSets:'3',                      targetReps:'8-12',   targetWeight:0},

// ── BACK ────────────────────────────────────────
// Heavy rows and deadlifts are among the highest MET
// movements in the gym (6-7). Pulldowns/pullups ~5-5.5.
  {name:'Barbell Deadlift',                 muscle:'Back',       met:6.5, targetSets:'4-5 warmup + 3 working', targetReps:'3-6',    targetWeight:0},
  {name:'Romanian Deadlift',                muscle:'Back',       met:6.0, targetSets:'4',                      targetReps:'6-10',   targetWeight:0},
  {name:'Barbell Row',                      muscle:'Back',       met:6.0, targetSets:'4',                      targetReps:'6-10',   targetWeight:0},
  {name:'Landmine Rows',                    muscle:'Back',       met:5.5, targetSets:'4-5 warmup + 5 working', targetReps:'5-8',    targetWeight:0},
  {name:'Dumbbell Row (single arm)',        muscle:'Back',       met:5.0, targetSets:'4',                      targetReps:'8-12',   targetWeight:0},
  {name:'Seated/Low Row',                   muscle:'Back',       met:5.0, targetSets:'4',                      targetReps:'8-12',   targetWeight:0},
  {name:'Cable Row (wide grip)',            muscle:'Back',       met:5.0, targetSets:'3',                      targetReps:'10-15',  targetWeight:0},
  {name:'T-Bar Row',                        muscle:'Back',       met:5.5, targetSets:'4',                      targetReps:'6-10',   targetWeight:0},
  {name:'Chest-Supported Row',              muscle:'Back',       met:4.5, targetSets:'3',                      targetReps:'10-15',  targetWeight:0},
  {name:'Pulldowns',                        muscle:'Back',       met:5.0, targetSets:'4',                      targetReps:'8-12',   targetWeight:0},
  {name:'Pulldowns (close grip)',           muscle:'Back',       met:5.0, targetSets:'3',                      targetReps:'8-12',   targetWeight:0},
  {name:'Assisted Pullups',                 muscle:'Back',       met:5.0, targetSets:'4',                      targetReps:'6-10',   targetWeight:0},
  {name:'Pull-ups',                         muscle:'Back',       met:5.5, targetSets:'4',                      targetReps:'5-10',   targetWeight:0},
  {name:'Chin-ups',                         muscle:'Back',       met:5.5, targetSets:'3',                      targetReps:'5-10',   targetWeight:0},
  {name:'Face Pulls',                       muscle:'Back',       met:3.5, targetSets:'4',                      targetReps:'15-20',  targetWeight:0},
  {name:'Straight-Arm Pulldown',            muscle:'Back',       met:3.5, targetSets:'3',                      targetReps:'12-15',  targetWeight:0},
  {name:'Rack Pulls',                       muscle:'Back',       met:6.0, targetSets:'3',                      targetReps:'4-6',    targetWeight:0},

// ── SHOULDERS ───────────────────────────────────
// Overhead pressing ~5-5.5. Lateral/rear delt
// isolation work is lower (3.0-3.5).
  {name:'Overhead Barbell Press',           muscle:'Shoulders',  met:5.5, targetSets:'4-5 warmup + 5 working', targetReps:'5-8',    targetWeight:0},
  {name:'Seated Dumbbell Press',            muscle:'Shoulders',  met:5.0, targetSets:'4',                      targetReps:'8-12',   targetWeight:0},
  {name:'Arnold Press',                     muscle:'Shoulders',  met:5.0, targetSets:'3',                      targetReps:'10-12',  targetWeight:0},
  {name:'Machine Shoulder Press',           muscle:'Shoulders',  met:4.5, targetSets:'3',                      targetReps:'10-15',  targetWeight:0},
  {name:'Dumbbell Lateral Raises',          muscle:'Shoulders',  met:3.0, targetSets:'4',                      targetReps:'12-15',  targetWeight:0},
  {name:'Cable Lateral Raises',             muscle:'Shoulders',  met:3.0, targetSets:'4',                      targetReps:'12-15',  targetWeight:0},
  {name:'Machine Lateral Raises',           muscle:'Shoulders',  met:3.0, targetSets:'3',                      targetReps:'12-15',  targetWeight:0},
  {name:'Single-Arm Rear Delt Flys',        muscle:'Shoulders',  met:3.0, targetSets:'4',                      targetReps:'12-15',  targetWeight:0},
  {name:'Rear Delt Cable Fly',              muscle:'Shoulders',  met:3.0, targetSets:'3',                      targetReps:'15-20',  targetWeight:0},
  {name:'Machine Rear Delt Fly',            muscle:'Shoulders',  met:3.0, targetSets:'3',                      targetReps:'15-20',  targetWeight:0},
  {name:'Upright Row',                      muscle:'Shoulders',  met:4.5, targetSets:'3',                      targetReps:'10-12',  targetWeight:0},
  {name:'Shrugs (barbell)',                 muscle:'Shoulders',  met:3.5, targetSets:'4',                      targetReps:'10-15',  targetWeight:0},
  {name:'Shrugs (dumbbell)',                muscle:'Shoulders',  met:3.5, targetSets:'3',                      targetReps:'12-15',  targetWeight:0},

// ── LEGS / QUADS ────────────────────────────────
// Lower body compound movements are the highest MET
// exercises in resistance training (6-8).
  {name:'Barbell Back Squat',               muscle:'Quads',      met:7.0, targetSets:'4-5 warmup + 5 working', targetReps:'4-8',    targetWeight:0},
  {name:'Barbell Front Squat',              muscle:'Quads',      met:7.0, targetSets:'4',                      targetReps:'4-8',    targetWeight:0},
  {name:'Hack Squat',                       muscle:'Quads',      met:6.5, targetSets:'4-5 warmup + 5 working', targetReps:'5-8',    targetWeight:0},
  {name:'Leg Press',                        muscle:'Quads',      met:6.0, targetSets:'3',                      targetReps:'8-12',   targetWeight:0},
  {name:'Bulgarian Split Squat',            muscle:'Quads',      met:6.5, targetSets:'3',                      targetReps:'8-10',   targetWeight:0},
  {name:'Lunges (barbell)',                 muscle:'Quads',      met:6.0, targetSets:'3',                      targetReps:'10-12',  targetWeight:0},
  {name:'Lunges (dumbbell)',                muscle:'Quads',      met:5.5, targetSets:'3',                      targetReps:'10-12',  targetWeight:0},
  {name:'Step-ups',                         muscle:'Quads',      met:5.5, targetSets:'3',                      targetReps:'10-12',  targetWeight:0},
  {name:'Quad Extensions (machine)',        muscle:'Quads',      met:4.5, targetSets:'4',                      targetReps:'10-15',  targetWeight:0},

// ── HAMSTRINGS ──────────────────────────────────
  {name:'Romanian Deadlift (hamstring focus)', muscle:'Hamstrings', met:6.0, targetSets:'4',                   targetReps:'6-10',   targetWeight:0},
  {name:'Stiff-Leg Deadlift',               muscle:'Hamstrings',  met:5.5, targetSets:'3',                     targetReps:'8-12',   targetWeight:0},
  {name:'Laying Hamstring Curls (machine)', muscle:'Hamstrings',  met:4.5, targetSets:'4',                     targetReps:'10-15',  targetWeight:0},
  {name:'Seated Hamstring Curls',           muscle:'Hamstrings',  met:4.5, targetSets:'3',                     targetReps:'10-15',  targetWeight:0},
  {name:'Nordic Hamstring Curl',            muscle:'Hamstrings',  met:5.0, targetSets:'3',                     targetReps:'5-8',    targetWeight:0},
  {name:'Good Mornings',                    muscle:'Hamstrings',  met:5.0, targetSets:'3',                     targetReps:'10-12',  targetWeight:0},

// ── GLUTES ──────────────────────────────────────
  {name:'Glute/Back Extensions',            muscle:'Glutes',      met:5.5, targetSets:'4',                     targetReps:'10-15',  targetWeight:0},
  {name:'Hip Thrusts (barbell)',            muscle:'Glutes',      met:5.5, targetSets:'4',                     targetReps:'8-12',   targetWeight:0},
  {name:'Hip Thrusts (machine)',            muscle:'Glutes',      met:5.0, targetSets:'3',                     targetReps:'10-15',  targetWeight:0},
  {name:'Glute/Back Extensions or Hip Thrusts', muscle:'Glutes', met:5.5, targetSets:'4',                     targetReps:'10-15',  targetWeight:0},
  {name:'Cable Kickbacks',                  muscle:'Glutes',      met:4.0, targetSets:'3',                     targetReps:'12-15',  targetWeight:0},
  {name:'Sumo Deadlift',                    muscle:'Glutes',      met:6.5, targetSets:'4',                     targetReps:'4-8',    targetWeight:0},
  {name:'Glute Bridge',                     muscle:'Glutes',      met:4.5, targetSets:'3',                     targetReps:'12-15',  targetWeight:0},

// ── CALVES ──────────────────────────────────────
  {name:'Standing Calf Raises',             muscle:'Calves',      met:3.0, targetSets:'4',                     targetReps:'12-20',  targetWeight:0},
  {name:'Seated Calf Raises',               muscle:'Calves',      met:3.0, targetSets:'4',                     targetReps:'12-20',  targetWeight:0},
  {name:'Leg Press Calf Raises',            muscle:'Calves',      met:3.0, targetSets:'3',                     targetReps:'15-20',  targetWeight:0},

// ── BICEPS ──────────────────────────────────────
// Curl variations are low-MET isolation work (3.0-4.0).
  {name:'Barbell Curl',                     muscle:'Biceps',      met:3.5, targetSets:'4',                     targetReps:'8-12',   targetWeight:0},
  {name:'Standing Bicep Curls',             muscle:'Biceps',      met:3.5, targetSets:'5',                     targetReps:'8-12',   targetWeight:0},
  {name:'Dumbbell Curl',                    muscle:'Biceps',      met:3.5, targetSets:'3',                     targetReps:'10-12',  targetWeight:0},
  {name:'Hammer Curl',                      muscle:'Biceps',      met:3.5, targetSets:'3',                     targetReps:'10-12',  targetWeight:0},
  {name:'Incline Dumbbell Curl',            muscle:'Biceps',      met:3.5, targetSets:'3',                     targetReps:'10-12',  targetWeight:0},
  {name:'Preacher Curl (machine)',          muscle:'Biceps',      met:3.5, targetSets:'3',                     targetReps:'10-12',  targetWeight:0},
  {name:'Preacher Curl (barbell)',          muscle:'Biceps',      met:3.5, targetSets:'3',                     targetReps:'8-12',   targetWeight:0},
  {name:'Cable Curl',                       muscle:'Biceps',      met:3.5, targetSets:'3',                     targetReps:'12-15',  targetWeight:0},
  {name:'Concentration Curl',               muscle:'Biceps',      met:3.0, targetSets:'3',                     targetReps:'10-12',  targetWeight:0},

// ── TRICEPS ─────────────────────────────────────
  {name:'Triceps Pushdown (machine)',       muscle:'Triceps',     met:3.5, targetSets:'4',                     targetReps:'10-15',  targetWeight:0},
  {name:'Tricep Pushdown (bar)',            muscle:'Triceps',     met:3.5, targetSets:'4',                     targetReps:'10-15',  targetWeight:0},
  {name:'Tricep Pushdown (rope)',           muscle:'Triceps',     met:3.5, targetSets:'3',                     targetReps:'12-15',  targetWeight:0},
  {name:'Overhead Tricep Extension (cable)',muscle:'Triceps',     met:3.5, targetSets:'3',                     targetReps:'12-15',  targetWeight:0},
  {name:'Overhead Tricep Extension (DB)',   muscle:'Triceps',     met:3.5, targetSets:'3',                     targetReps:'10-12',  targetWeight:0},
  {name:'Skull Crushers',                   muscle:'Triceps',     met:4.0, targetSets:'3',                     targetReps:'8-12',   targetWeight:0},
  {name:'Close-Grip Bench Press',          muscle:'Triceps',     met:5.0, targetSets:'3',                     targetReps:'8-12',   targetWeight:0},
  {name:'Tricep Dips',                      muscle:'Triceps',     met:4.5, targetSets:'3',                     targetReps:'8-12',   targetWeight:0},
  {name:'Kickbacks',                        muscle:'Triceps',     met:3.0, targetSets:'3',                     targetReps:'12-15',  targetWeight:0},

// ── CORE ────────────────────────────────────────
// Core work MET varies widely; these are conservative
// estimates for weighted/controlled movements.
  {name:'Decline Sit-ups',                  muscle:'Core',        met:4.0, targetSets:'5',                     targetReps:'15-20',  targetWeight:0},
  {name:'Cable Crunch',                     muscle:'Core',        met:4.0, targetSets:'4',                     targetReps:'15-20',  targetWeight:0},
  {name:'Machine Crunch',                   muscle:'Core',        met:4.0, targetSets:'4',                     targetReps:'12-15',  targetWeight:0},
  {name:'Hanging Leg Raise',               muscle:'Core',        met:4.5, targetSets:'4',                     targetReps:'10-15',  targetWeight:0},
  {name:'Ab Wheel Rollout',                muscle:'Core',        met:4.5, targetSets:'3',                     targetReps:'8-12',   targetWeight:0},
  {name:'Plank',                            muscle:'Core',        met:3.5, targetSets:'3',                     targetReps:'45-60s', targetWeight:0},
  {name:'Side Plank',                       muscle:'Core',        met:3.5, targetSets:'3',                     targetReps:'30-45s', targetWeight:0},
  {name:'Russian Twists',                   muscle:'Core',        met:4.0, targetSets:'3',                     targetReps:'20-30',  targetWeight:0},
  {name:'Landmine Twists',                  muscle:'Core',        met:4.5, targetSets:'3',                     targetReps:'12-15',  targetWeight:0},
  {name:'Torso Rotation',                   muscle:'Core',        met:4.0, targetSets:'3',                     targetReps:'12-15',  targetWeight:0},
  {name:'Sit-ups',                          muscle:'Core',        met:3.5, targetSets:'4',                     targetReps:'15-25',  targetWeight:0},

// ── CARDIO ──────────────────────────────────────
// Cardio exercises track time, speed, and resistance instead of weight/reps.
// MET values are rough session averages including warmup and cooldown.
  {name:'Cardio',                           muscle:'Cardio',      met:7.0, targetSets:'1',                     targetReps:'20 min', targetWeight:0},
  {name:'Treadmill',                        muscle:'Cardio',      met:7.0, targetSets:'1',                     targetReps:'20 min', targetWeight:0},
  {name:'Stationary Bike',                  muscle:'Cardio',      met:7.0, targetSets:'1',                     targetReps:'20 min', targetWeight:0},
  {name:'Rowing Machine',                   muscle:'Cardio',      met:7.0, targetSets:'1',                     targetReps:'20 min', targetWeight:0},
  {name:'Elliptical',                       muscle:'Cardio',      met:6.0, targetSets:'1',                     targetReps:'20 min', targetWeight:0},
  {name:'Stair Climber',                    muscle:'Cardio',      met:8.0, targetSets:'1',                     targetReps:'20 min', targetWeight:0},
  {name:'Battle Ropes',                     muscle:'Cardio',      met:9.0, targetSets:'5',                     targetReps:'30s',    targetWeight:0},
  {name:'Jump Rope',                        muscle:'Cardio',      met:9.0, targetSets:'5',                     targetReps:'2 min',  targetWeight:0},
  {name:'HIIT (general)',                   muscle:'Cardio',      met:9.5, targetSets:'1',                     targetReps:'20 min', targetWeight:0},
];

const MUSCLE_ORDER  = ['Chest','Back','Shoulders','Quads','Hamstrings','Glutes','Calves','Biceps','Triceps','Core','Cardio','Misc'];
const MUSCLE_ICONS  = {Chest:'💪',Back:'🏋️',Shoulders:'🔱',Quads:'🦵',Hamstrings:'🦵',Glutes:'🍑',Calves:'🦵',Biceps:'💪',Triceps:'💪',Core:'🔥',Cardio:'🏃',Misc:'⚡'};
// MET_BY_MUSCLE kept as fallback for custom exercises added by user
const MET_BY_MUSCLE = {Chest:5,Back:5.5,Shoulders:4.5,Quads:6,Hamstrings:5.5,Glutes:5.5,Calves:3,Biceps:3.5,Triceps:3.5,Core:4,Cardio:7,Misc:4.5};

// Cardio exercises track time/speed/resistance instead of weight/reps
const CARDIO_EXERCISES = new Set(['Cardio','Treadmill','Stationary Bike','Rowing Machine','Elliptical','Stair Climber','Battle Ropes','Jump Rope','HIIT (general)']);

// Variation options for exercises with multiple grip/style variants
const EXERCISE_VARIATIONS = {
  'Pull-ups':              ['Standard','Wide Grip','Close Grip','Hammer Grip'],
  'Assisted Pullups':      ['Standard','Wide Grip','Chin-Up','Hammer Grip'],
  'Pulldowns':             ['Wide Grip','Close Grip','Reverse Grip','Single Arm'],
  'Pulldowns (close grip)':['Close Grip','Wide Grip','Underhand'],
  'Chin-ups':              ['Standard','Wide Grip','Close Grip'],
  'Barbell Bench Press':   ['Standard','Wide Grip','Close Grip'],
  'Barbell Curl':          ['Standard','Wide Grip','Close Grip'],
  'Standing Bicep Curls':  ['Standard','Wide Grip','Close Grip','Hammer'],
  'Dumbbell Curl':         ['Standard','Supinating','Hammer'],
  'Cable Curl':            ['Standard','Rope','Bar','Single Arm'],
  'Seated/Low Row':        ['Narrow Grip','Wide Grip','Overhand'],
  'Cable Row (wide grip)': ['Wide Grip','Narrow Grip','Single Arm'],
  'Overhead Barbell Press':['Standard','Behind Neck','Seated'],
  'Tricep Pushdown (bar)': ['Bar','Rope','V-Bar','Single Arm'],
  'Tricep Pushdown (rope)':['Rope','Bar','V-Bar'],
  'Leg Press':             ['Standard','Narrow Stance','Wide Stance','Single Leg'],
  'Hip Thrusts (barbell)': ['Standard','Single Leg','Banded'],
  'Glute/Back Extensions': ['Standard','Weighted','Single Leg'],
};
