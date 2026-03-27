// ══════════════════════════════════════════════
//  CONSTANTS
// ══════════════════════════════════════════════
const ACCENT_PRESETS=[
  {name:'Fire',hex:'#ff6b35'},{name:'Cyan',hex:'#00d4ff'},
  {name:'Lime',hex:'#b8ff3a'},{name:'Purple',hex:'#a855f7'},{name:'Pink',hex:'#f43f8e'},
];


// ══════════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════════
let S={
  accentColor:'#ff6b35',
  profile:{age:'',sex:'',weight:'',ft:'',in:'',formula:'mifflin',bfPct:'',neck:'',waist:'',hip:''},
  customDays:[],
  exerciseOverrides:{},
  dayIconOverrides:{},
  dayPlans:JSON.parse(JSON.stringify(DEFAULT_DAY_PLANS)),
  currentSession:null,
  workouts:[],
  prs:{},
  cardioPrs:{},
  customExercises:[],
  themes:{
    active:'dark',
    dark:{bg:'#0d0d0d',surface:'#181818',textBody:'#f2f2f2',textHead:'#ffffff',accent:'#ff6b35'},
    light:{bg:'#f2f2f7',surface:'#ffffff',textBody:'#1c1c1e',textHead:'#000000',accent:'#007aff'},
  },
  exerciseNameOverrides:{},
};

function loadState(){
  try{const s=localStorage.getItem('ironlog_v6');if(s){const p=JSON.parse(s);Object.assign(S,p);if(!S.dayPlans)S.dayPlans=JSON.parse(JSON.stringify(DEFAULT_DAY_PLANS));}}catch(e){}
}
function saveState(){try{localStorage.setItem('ironlog_v6',JSON.stringify(S));}catch(e){}}

// ══════════════════════════════════════════════
//  TIMER
// ══════════════════════════════════════════════
let timerInterval=null;
let restTimerInterval=null;
let restTimerStart=0;
function startTimer(){
  if(timerInterval)return;
  timerInterval=setInterval(()=>{
    const el=document.getElementById('timer-display');
    if(!el||!S.currentSession)return;
    const sec=Math.floor((Date.now()-S.currentSession.startTime)/1000);
    const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;
    el.textContent=h>0?`${h}:${pad(m)}:${pad(s)}`:`${pad(m)}:${pad(s)}`;
  },1000);
}
function stopTimer(){clearInterval(timerInterval);timerInterval=null;stopRestTimer();}
function startRestTimer(){
  restTimerStart=Date.now();
  if(restTimerInterval)return;
  restTimerInterval=setInterval(()=>{
    const el=document.getElementById('rest-display');if(!el)return;
    const sec=Math.floor((Date.now()-restTimerStart)/1000);
    const m=Math.floor(sec/60),s=sec%60;
    el.textContent=`${pad(m)}:${pad(s)}`;
    el.classList.add('active');
  },1000);
}
function stopRestTimer(){clearInterval(restTimerInterval);restTimerInterval=null;}
function resetRestTimer(){
  restTimerStart=Date.now();
  const el=document.getElementById('rest-display');
  if(el){el.textContent='00:00';el.classList.add('active');}
}
function pad(n){return String(n).padStart(2,'0');}

// ══════════════════════════════════════════════
//  UTILS
// ══════════════════════════════════════════════
function todayStr(){return new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});}
function timeStr(ts){return new Date(ts).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});}
function shortDate(ts){return new Date(ts).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});}
function isoDate(ts){return new Date(ts).toISOString().slice(0,10);}
function durStr(ms){const m=Math.round(ms/60000);return m<60?`${m}m`:`${Math.floor(m/60)}h ${m%60}m`;}
function e1rm(w,r){return(w&&r)?Math.round(w*(1+r/30)):0;}
function isPR(name,w,r){if(!w||!r)return false;const v=e1rm(w,r),p=S.prs[name];return!p||v>p.e1rm;}
function recordPR(name,w,r){const isDumb=isDumbbellExercise(name);const displayW=isDumb?w*2:w;S.prs[name]={weight:displayW,reps:r,e1rm:e1rm(displayW,r),date:Date.now()};}
function getPRStatus(name,w,r){
  if(!w||!r)return null;
  const prData=S.prs[name];
  if(!prData)return'new';
  if(prData.reps===r){
    if(w>prData.weight)return'up';
    if(w===prData.weight)return'equal';
    if(w<prData.weight)return'down';
  }
  return null;
}

function allDayDefs(){
  const ov=S.dayIconOverrides||{};
  return [...DAY_DEFS,...(S.customDays||[])].map(d=>ov[d.id]?{...d,icon:ov[d.id]}:d);
}
function allExercises(){
  return [...EXERCISE_LIB,...S.customExercises.map(ce=>({...ce}))];
}
function findEx(name){
  return allExercises().find(e=>e.name===name)||{name,muscle:'Misc',targetSets:'',targetReps:'',targetWeight:0};
}
function resolveEx(nameOrObj){
  const base=typeof nameOrObj==='string'?findEx(nameOrObj):{...findEx(nameOrObj.name),...nameOrObj};
  const ov=S.exerciseOverrides[base.name]||{};
  return{...base,...ov};
}
function getExercisesForDay(dayId){
  const plan=S.dayPlans[dayId]||[];
  return plan.map(name=>resolveEx(name));
}
function scrollToCenter(el){
  if(!el)return;
  setTimeout(()=>{
    el.scrollIntoView({behavior:'smooth',block:'center'});
  },50);
}

// ══════════════════════════════════════════════
//  CALORIE CALCULATIONS
// ══════════════════════════════════════════════
function calcNavyBF(){
  const p=S.profile;
  const sex=p.sex,wLbs=parseFloat(p.weight);
  const ft=parseFloat(p.ft)||0,inches=parseFloat(p.in)||0;
  const hIn=ft*12+inches;
  const neck=parseFloat(p.neck),waist=parseFloat(p.waist);
  if(!sex||!hIn||!neck||!waist)return null;
  let bf;
  if(sex==='male'){
    if(waist<=neck)return null;
    bf=(495/(1.0324-0.19077*Math.log10(waist-neck)+0.15456*Math.log10(hIn)))-450;
  }else{
    const hip=parseFloat(p.hip);
    if(!hip||waist+hip<=neck)return null;
    bf=(495/(1.29579-0.35004*Math.log10(waist+hip-neck)+0.22100*Math.log10(hIn)))-450;
  }
  if(!isFinite(bf)||bf<=0||bf>=100)return null;
  return bf;
}
function getEffectiveBF(){
  const p=S.profile;
  const formula=p.formula||'mifflin';
  if(formula==='mifflin-lean'||formula==='katch'){const v=parseFloat(p.bfPct);return(v>0&&v<100)?v:null;}
  if(formula==='navy')return calcNavyBF();
  return null;
}
function calcTDEE(){
  const p=S.profile;
  const age=parseFloat(p.age),sex=p.sex,wLbs=parseFloat(p.weight);
  const ft=parseFloat(p.ft)||0,inches=parseFloat(p.in)||0;
  const hIn=ft*12+inches;
  if(!age||!sex||!wLbs||!hIn)return null;
  const wKg=wLbs*0.453592,hCm=hIn*2.54;
  const formula=p.formula||'mifflin';
  let bmr;
  if(formula==='mifflin'){
    bmr=sex==='male'?(10*wKg)+(6.25*hCm)-(5*age)+5:(10*wKg)+(6.25*hCm)-(5*age)-161;
  }else if(formula==='mifflin-lean'){
    const bf=parseFloat(p.bfPct);
    const leanKg=(bf>0&&bf<100)?wKg*(1-bf/100):wKg;
    bmr=sex==='male'?(10*leanKg)+(6.25*hCm)-(5*age)+5:(10*leanKg)+(6.25*hCm)-(5*age)-161;
  }else if(formula==='katch'){
    const bf=parseFloat(p.bfPct);
    if(bf>0&&bf<100){const leanKg=wKg*(1-bf/100);bmr=370+(21.6*leanKg);}
    else{bmr=sex==='male'?(10*wKg)+(6.25*hCm)-(5*age)+5:(10*wKg)+(6.25*hCm)-(5*age)-161;}
  }else if(formula==='navy'){
    const bf=calcNavyBF();
    const leanKg=bf!==null?wKg*(1-bf/100):wKg;
    bmr=370+(21.6*leanKg);
  }
  if(!bmr)return null;
  return Math.round(bmr*1.375);
}
function calcWorkoutCalories(exercises,durationMs){
  const wLbs=parseFloat(S.profile.weight);
  let wKg=wLbs?wLbs*0.453592:80;
  const bf=getEffectiveBF();
  if(bf!==null)wKg=wKg*(1-bf/100);
  const hours=durationMs/3600000;
  if(!hours)return null;
  if(!exercises.length)return null;
  const met=exercises.reduce((s,e)=>s+(e.met||MET_BY_MUSCLE[e.muscle]||4.5),0)/exercises.length;
  return Math.round(met*wKg*hours);
}
function getTodayBurnedCalories(){
  const today=isoDate(Date.now());
  return S.workouts.filter(w=>isoDate(w.startTime)===today).reduce((s,w)=>s+(w.calories||0),0);
}
function updateLogCalBanner(){
  const tdee=calcTDEE();
  const banner=document.getElementById('log-cal-banner');
  if(!tdee){banner.style.display='none';return;}
  const burned=getTodayBurnedCalories();
  const net=tdee+burned;
  banner.style.display='block';
  document.getElementById('log-cal-val').textContent=net.toLocaleString()+' kcal';
  document.getElementById('log-cal-sub').textContent=burned?`${tdee.toLocaleString()} maintenance + ${burned.toLocaleString()} burned today`:'Maintenance (no workout logged today)';
}

// ══════════════════════════════════════════════
//  PROFILE
// ══════════════════════════════════════════════
function saveProfile(){
  S.profile={
    age:document.getElementById('prof-age').value,
    sex:document.getElementById('prof-sex').value,
    weight:document.getElementById('prof-weight').value,
    ft:document.getElementById('prof-ft').value,
    in:document.getElementById('prof-in').value,
    formula:document.getElementById('prof-formula').value,
    bfPct:document.getElementById('prof-bf').value,
    neck:document.getElementById('prof-neck').value,
    waist:document.getElementById('prof-waist').value,
    hip:document.getElementById('prof-hip').value,
  };
  saveState();updateTDEEDisplay();
}
function loadProfileInputs(){
  const p=S.profile;
  document.getElementById('prof-age').value=p.age||'';
  document.getElementById('prof-sex').value=p.sex||'';
  document.getElementById('prof-weight').value=p.weight||'';
  document.getElementById('prof-ft').value=p.ft||'';
  document.getElementById('prof-in').value=p.in||'';
  document.getElementById('prof-formula').value=p.formula||'mifflin';
  document.getElementById('prof-bf').value=p.bfPct||'';
  document.getElementById('prof-neck').value=p.neck||'';
  document.getElementById('prof-waist').value=p.waist||'';
  document.getElementById('prof-hip').value=p.hip||'';
  updateFormulaFields();
  updateTDEEDisplay();
}
function updateTDEEDisplay(){
  const tdee=calcTDEE();
  const block=document.getElementById('calorie-result-block');
  if(tdee){
    document.getElementById('tdee-val').textContent=tdee.toLocaleString();
    block.style.display='block';
    const formula=S.profile.formula||'mifflin';
    const bf=getEffectiveBF();
    const labels={
      'mifflin':'Mifflin-St Jeor · lightly active (1.375×)',
      'mifflin-lean':`Mifflin + Lean Mass (${bf?Math.round(bf)+'% BF':''}) · 1.375×`,
      'katch':`Katch-McArdle (${bf?Math.round(bf)+'% BF':''}) · 1.375×`,
      'navy':`Navy Method (${bf?Math.round(bf)+'% BF est.':''}) · Katch-McArdle · 1.375×`,
    };
    const lbl=document.getElementById('tdee-formula-label');
    if(lbl)lbl.textContent=labels[formula]||labels['mifflin'];
  }else{
    block.style.display='none';
  }
}

function updateFormulaFields(){
  const formula=document.getElementById('prof-formula').value;
  const sex=document.getElementById('prof-sex').value;
  const bfRow=document.getElementById('bf-pct-row');
  const navyRows=document.getElementById('navy-rows');
  const navyHipRow=document.getElementById('navy-hip-row');
  bfRow.style.display=(formula==='mifflin-lean'||formula==='katch')?'grid':'none';
  navyRows.style.display=(formula==='navy')?'block':'none';
  if(navyHipRow)navyHipRow.style.display=(formula==='navy'&&sex==='female')?'grid':'none';
}

// ══════════════════════════════════════════════
//  THEME SYSTEM
// ══════════════════════════════════════════════
const THEME_DEFAULTS={
  dark:{bg:'#0d0d0d',surface:'#181818',textBody:'#f2f2f2',textHead:'#ffffff',accent:'#ff6b35'},
  light:{bg:'#f2f2f7',surface:'#ffffff',textBody:'#1c1c1e',textHead:'#000000',accent:'#007aff'},
};
const THEME_COLOR_PRESETS={
  accent:['#ff6b35','#00d4ff','#b8ff3a','#a855f7','#f43f8e','#007aff','#34c759','#ff9f0a'],
  bg:['#0d0d0d','#1a1a1a','#000000','#f2f2f7','#ffffff','#1c1c1e'],
  surface:['#181818','#222222','#2c2c2c','#ffffff','#f2f2f7','#e5e5ea'],
  textBody:['#f2f2f2','#ffffff','#cccccc','#1c1c1e','#000000','#3c3c43'],
  textHead:['#ffffff','#f2f2f2','#000000','#1c1c1e'],
};
const THEME_COLOR_LABELS={bg:'Background',surface:'Widgets',textBody:'Body Text',textHead:'Header Text',accent:'Accent'};
let themeModalMode='dark'; // 'dark' | 'light'
let themeExpandedKey=null;

function getTheme(mode){
  if(!S.themes)S.themes={active:'dark',dark:{...THEME_DEFAULTS.dark},light:{...THEME_DEFAULTS.light}};
  if(!S.themes[mode])S.themes[mode]={...THEME_DEFAULTS[mode]};
  return S.themes[mode];
}
function applyTheme(mode){
  if(!S.themes)S.themes={active:'dark',dark:{...THEME_DEFAULTS.dark},light:{...THEME_DEFAULTS.light}};
  S.themes.active=mode;
  const t=getTheme(mode);
  const r=document.documentElement.style;
  r.setProperty('--bg',t.bg);
  // Derive surface variants
  r.setProperty('--surface',t.surface);
  r.setProperty('--surface2',blendColor(t.surface,t.bg,.4));
  r.setProperty('--surface3',blendColor(t.surface,t.bg,.7));
  r.setProperty('--text',t.textBody);
  r.setProperty('--text-head',t.textHead);
  r.setProperty('--accent',t.accent);
  r.setProperty('--accent-dim',t.accent+'1a');
  r.setProperty('--accent-border',t.accent+'4d');
  // Derive border & muted from bg/surface
  const dark=isDarkColor(t.bg);
  r.setProperty('--border',dark?'#2e2e2e':'#d1d1d6');
  r.setProperty('--muted',dark?'#5a5a5a':'#8e8e93');
  r.setProperty('--muted2',dark?'#888888':'#6c6c70');
  S.accentColor=t.accent;
  saveState();
  updateThemeBadges();
}
function blendColor(c1,c2,t){
  const parse=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
  try{
    const a=parse(c1),b=parse(c2);
    const r=Math.round(a[0]*(1-t)+b[0]*t);
    const g=Math.round(a[1]*(1-t)+b[1]*t);
    const bl=Math.round(a[2]*(1-t)+b[2]*t);
    return`#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${bl.toString(16).padStart(2,'0')}`;
  }catch(e){return c1;}
}
function isDarkColor(hex){
  try{
    const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
    return(r*299+g*587+b*114)/1000<128;
  }catch(e){return true;}
}
function updateThemeBadges(){
  const active=(S.themes&&S.themes.active)||'dark';
  const darkRadio=document.getElementById('radio-dark');
  const lightRadio=document.getElementById('radio-light');
  if(darkRadio)darkRadio.classList.toggle('active',active==='dark');
  if(lightRadio)lightRadio.classList.toggle('active',active==='light');
}
function openThemeModal(mode){
  themeModalMode=mode;themeExpandedKey=null;
  document.getElementById('theme-modal-title').textContent=mode==='dark'?'Dark Theme':'Light Theme';
  const activateBtn=document.getElementById('theme-modal-activate-btn');
  if(activateBtn){
    const isActive=S.themes&&S.themes.active===mode;
    activateBtn.textContent=isActive?'Active ✓':'Use Theme';
    activateBtn.style.color=isActive?'var(--accent)':'var(--text)';
  }
  renderThemeModalContent();
  document.getElementById('theme-modal').classList.add('open');
}
function closeThemeModal(){
  document.getElementById('theme-modal').classList.remove('open');
  updateThemeBadges();
}
function activateCurrentTheme(){
  applyTheme(themeModalMode);
  const btn=document.getElementById('theme-modal-activate-btn');
  if(btn){btn.textContent='Active ✓';btn.style.color='var(--accent)';}
  renderThemeModalContent();
}
function renderThemeModalContent(){
  const t=getTheme(themeModalMode);
  const content=document.getElementById('theme-modal-content');
  content.innerHTML=`<div class="settings-group" style="margin:16px">
    ${Object.entries(THEME_COLOR_LABELS).map(([key,label])=>{
      const color=t[key]||'#888888';
      const isOpen=themeExpandedKey===key;
      const presets=(THEME_COLOR_PRESETS[key]||[]);
      const swatches=presets.map(p=>`<div class="swatch${p===color?' selected':''}" style="background:${p}" onclick="setThemeColor('${key}','${p}')"></div>`).join('');
      return`<div>
        <div class="theme-color-row" onclick="toggleThemeColorExpand('${key}')">
          <div class="settings-row-label">${label}</div>
          <div style="display:flex;align-items:center;gap:10px">
            <div class="theme-color-preview" style="background:${color}"></div>
            <span style="color:var(--muted);font-size:12px">${color}</span>
            <span style="color:var(--muted);font-size:12px">${isOpen?'▲':'▼'}</span>
          </div>
        </div>
        <div class="theme-color-expand${isOpen?' open':''}">
          <div class="theme-section-label">Presets</div>
          <div class="theme-swatch-row color-swatches">${swatches}</div>
          <div class="theme-section-label">Custom</div>
          <div class="theme-hex-row">
            <div class="theme-hex-preview" id="thp-${key}" style="background:${color}"></div>
            <input class="hex-input" id="thi-${key}" value="${color}" maxlength="7" placeholder="#000000" oninput="onThemeHexInput('${key}',this.value)">
            <button class="hex-apply-btn" onclick="applyThemeHexInput('${key}')">Apply</button>
          </div>
        </div>
      </div>`;
    }).join('')}
  </div>`;
}
function toggleThemeColorExpand(key){
  themeExpandedKey=themeExpandedKey===key?null:key;
  renderThemeModalContent();
}
function setThemeColor(key,hex){
  const t=getTheme(themeModalMode);
  t[key]=hex;
  if(S.themes.active===themeModalMode)applyTheme(themeModalMode);
  else saveState();
  renderThemeModalContent();
}
function onThemeHexInput(key,val){
  const el=document.getElementById(`thp-${key}`);
  if(el&&/^#[0-9a-fA-F]{6}$/.test(val))el.style.background=val;
}
function applyThemeHexInput(key){
  const val=(document.getElementById(`thi-${key}`)?.value||'').trim();
  if(!/^#[0-9a-fA-F]{6}$/.test(val)){showToast('Enter a valid hex like #ff6b35',false);return;}
  setThemeColor(key,val);
}

// ══════════════════════════════════════════════
//  PLANS MODAL
// ══════════════════════════════════════════════
let plansModalView='days'; // 'days','exercises','add-muscles','add-exercises','new-day'
let plansModalDayId=null;
let plansModalMuscle=null;

function openPlansModal(){
  plansModalView='days';plansModalDayId=null;plansModalMuscle=null;
  document.getElementById('plans-modal-search').value='';
  document.getElementById('plans-modal-back').onclick=closePlansModal;
  document.getElementById('plans-modal-title').textContent='Workout Days';
  document.getElementById('plans-action-bar').style.display='none';
  renderPlansDayList('');
  document.getElementById('plans-modal').classList.add('open');
}
function closePlansModal(){
  document.getElementById('plans-modal').classList.remove('open');
}
function plansModalBack(){
  document.getElementById('plans-modal-search').value='';
  if(plansModalView==='exercises'||plansModalView==='new-day'){
    plansModalView='days';plansModalDayId=null;
    document.getElementById('plans-modal-back').onclick=closePlansModal;
    document.getElementById('plans-modal-title').textContent='Workout Days';
    document.getElementById('plans-action-bar').style.display='none';
    renderPlansDayList('');
  }else if(plansModalView==='add-muscles'){
    plansModalView='exercises';plansModalMuscle=null;
    const def=allDayDefs().find(d=>d.id===plansModalDayId);
    document.getElementById('plans-modal-title').textContent=def?def.label:'Day';
    document.getElementById('plans-action-bar').style.display='block';
    renderPlansDayExercises(plansModalDayId,'');
  }else if(plansModalView==='add-exercises'){
    plansModalView='add-muscles';plansModalMuscle=null;
    document.getElementById('plans-modal-title').textContent='Add Exercise';
    document.getElementById('plans-action-bar').style.display='none';
    renderPlansAddMuscles('');
  }
}
function selectPlanDay(dayId){
  plansModalView='exercises';plansModalDayId=dayId;
  const def=allDayDefs().find(d=>d.id===dayId);
  document.getElementById('plans-modal-search').value='';
  document.getElementById('plans-modal-back').onclick=plansModalBack;
  document.getElementById('plans-modal-title').textContent=def?def.label:'Day';
  document.getElementById('plans-action-bar').style.display='block';
  renderPlansDayExercises(dayId,'');
}
function openAddExPicker(){
  plansModalView='add-muscles';plansModalMuscle=null;
  document.getElementById('plans-modal-search').value='';
  document.getElementById('plans-modal-title').textContent='Add Exercise';
  document.getElementById('plans-action-bar').style.display='none';
  renderPlansAddMuscles('');
}
function selectPlansAddMuscle(muscle){
  plansModalView='add-exercises';plansModalMuscle=muscle;
  document.getElementById('plans-modal-search').value='';
  document.getElementById('plans-modal-title').textContent=muscle;
  renderPlansAddExercises(muscle,'');
}
function addExToDay(name){
  const dayId=plansModalDayId;
  if(!S.dayPlans[dayId])S.dayPlans[dayId]=[];
  if(!S.dayPlans[dayId].includes(name)){
    S.dayPlans[dayId].push(name);saveState();
    showToast(`Added: ${name}`,false);
  }
}
function removeExFromDay(dayId,idx){
  if(!S.dayPlans[dayId])return;
  S.dayPlans[dayId].splice(idx,1);saveState();
  renderPlansDayExercises(dayId,document.getElementById('plans-modal-search').value);
}
function showNewDayForm(){
  plansModalView='new-day';
  document.getElementById('plans-modal-search').value='';
  document.getElementById('plans-modal-back').onclick=plansModalBack;
  document.getElementById('plans-modal-title').textContent='New Day';
  document.getElementById('plans-action-bar').style.display='none';
  renderNewDayForm();
}
function limitEmojiInput(input,max){
  const seg=new Intl.Segmenter();
  const clusters=[...seg.segment(input.value)].map(s=>s.segment);
  if(clusters.length>max){
    input.value=clusters.slice(0,max).join('');
  }
}
function renderNewDayForm(){
  document.getElementById('plans-modal-content').innerHTML=`<div class="plans-new-day-form">
    <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:8px">Icon (up to 2 emojis)</div>
    <input class="plans-emoji-input" id="new-day-icon" type="text" placeholder="😀" oninput="limitEmojiInput(this,2)" onfocus="this.setSelectionRange(this.value.length,this.value.length)" inputmode="text" autocomplete="off" autocorrect="off" spellcheck="false" style="margin-bottom:16px">
    <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:8px">Name</div>
    <input class="lib-modal-search-input" id="new-day-name" placeholder="e.g. Push Day" type="text" onfocus="this.setSelectionRange(this.value.length,this.value.length)" autocomplete="off" style="margin-bottom:16px">
    <button class="plans-add-btn" onclick="saveNewDay()">Create Day</button>
  </div>`;
}
function saveNewDay(){
  const name=(document.getElementById('new-day-name').value||'').trim();
  if(!name){showToast('Enter a day name',false);return;}
  const iconEl=document.getElementById('new-day-icon');
  const icon=(iconEl?iconEl.value.trim():'')||'💪';
  const id='custom_'+Date.now();
  if(!S.customDays)S.customDays=[];
  S.customDays.push({id,label:name,icon});
  S.dayPlans[id]=[];
  saveState();renderDayGrid();
  showToast(`Created: ${name}`,false);
  selectPlanDay(id);
}
function deleteCustomDay(dayId){
  if(!confirm('Delete this day?'))return;
  S.customDays=(S.customDays||[]).filter(d=>d.id!==dayId);
  delete S.dayPlans[dayId];
  if(S.currentSession&&S.currentSession.dayId===dayId)S.currentSession=null;
  saveState();renderDayGrid();
  renderPlansDayList(document.getElementById('plans-modal-search').value);
}
function deletePlanDayFromBar(){
  const dayId=plansModalDayId;
  if(!dayId)return;
  const def=allDayDefs().find(d=>d.id===dayId);
  const name=def?def.label:'this day';
  if(!confirm(`Delete "${name}"?\n\nThis will permanently remove the day and all its exercises from your workout plan.`))return;
  S.customDays=(S.customDays||[]).filter(d=>d.id!==dayId);
  delete S.dayPlans[dayId];
  if(S.currentSession&&S.currentSession.dayId===dayId)S.currentSession=null;
  saveState();
  renderDayGrid();
  showToast(`Deleted: ${name}`,false);
  plansModalBack();
}
function renderPlansDayList(q){
  const content=document.getElementById('plans-modal-content');
  let days=allDayDefs();
  if(q.trim())days=days.filter(d=>d.label.toLowerCase().includes(q.toLowerCase()));
  const cards=days.map(d=>{
    const count=(S.dayPlans[d.id]||[]).length;
    const esc=d.id.replace(/'/g,"\\'");
    return`<div class="lib-muscle-card" onclick="selectPlanDay('${esc}')">
      <div class="lib-muscle-icon">${d.icon}</div>
      <div class="lib-muscle-name">${d.label}</div>
      <div class="lib-muscle-count">${count} exercise${count!==1?'s':''}</div>
    </div>`;
  }).join('');
  const newCard=`<div class="plans-new-day-card" onclick="showNewDayForm()">
    <div style="font-size:28px;margin-bottom:6px">+</div>
    <div style="font-weight:700;font-size:14px">New Day</div>
  </div>`;
  content.innerHTML=`<div class="lib-muscle-grid">${cards+newCard}</div>`;
}
function renderPlansDayExercises(dayId,q){
  const content=document.getElementById('plans-modal-content');
  const allExNames=S.dayPlans[dayId]||[];
  let exNames=allExNames;
  if(q.trim())exNames=exNames.filter(n=>n.toLowerCase().includes(q.toLowerCase()));
  const isCustom=(S.customDays||[]).some(cd=>cd.id===dayId);
  const esc=dayId.replace(/'/g,"\\'");
  const def=allDayDefs().find(d=>d.id===dayId);
  const currentIcon=def?def.icon:'';
  const iconSection=`<div style="padding:14px 16px 10px;border-bottom:1px solid var(--border)">
    <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:6px">Day Icon</div>
    <input class="plans-emoji-input" id="day-icon-input-${esc}" type="text" value="${currentIcon}" placeholder="😀" oninput="limitEmojiInput(this,2)" inputmode="text" autocomplete="off" autocorrect="off" spellcheck="false" style="margin-bottom:6px">
    <button class="plans-add-btn" style="padding:10px 14px;font-size:14px" onclick="saveDayIcon('${esc}')">Save Icon</button>
  </div>`;
  const rows=exNames.length?exNames.map(name=>{
    const idx=allExNames.indexOf(name);
    const ex=findEx(name);
    return`<div class="plans-ex-row">
      <div style="flex:1"><div class="plans-ex-name">${name}</div><div class="plans-ex-muscle">${ex.muscle}</div></div>
      <button class="plans-ex-del" onclick="removeExFromDay('${esc}',${idx})">&#10005;</button>
    </div>`;
  }).join(''):`<div style="text-align:center;padding:60px 20px;color:var(--muted)">${q.trim()?'No exercises found':'No exercises yet.<br>Tap <b>+ Add Exercise</b> below.'}</div>`;
  content.innerHTML=iconSection+rows;
  const deleteBtn=document.getElementById('plans-delete-day-btn');
  if(deleteBtn)deleteBtn.style.display=isCustom?'flex':'none';
}
function saveDayIcon(dayId){
  const el=document.getElementById('day-icon-input-'+dayId);
  if(!el)return;
  const icon=el.value.trim();
  if(!S.dayIconOverrides)S.dayIconOverrides={};
  S.dayIconOverrides[dayId]=icon;
  saveState();renderDayGrid();
  showToast('Icon saved',false);
}
function renderPlansAddMuscles(q){
  const content=document.getElementById('plans-modal-content');
  const all=allExercises();
  if(q.trim()){
    const qLow=q.toLowerCase();
    const matches=all.filter(e=>e.name.toLowerCase().includes(qLow)||e.muscle.toLowerCase().includes(qLow));
    matches.sort((a,b)=>a.name.localeCompare(b.name));
    if(!matches.length){content.innerHTML=`<div style="text-align:center;padding:60px 20px;color:var(--muted)">No exercises found</div>`;return;}
    content.innerHTML=`<div class="lib-ex-list">${matches.map(ex=>buildPlansAddExItem(ex)).join('')}</div>`;
    return;
  }
  content.innerHTML=`<div class="lib-muscle-grid">${MUSCLE_ORDER.map(m=>{
    const count=all.filter(e=>e.muscle===m).length;
    const icon=MUSCLE_ICONS[m]||'•';
    return`<div class="lib-muscle-card" onclick="selectPlansAddMuscle('${m}')">
      <div class="lib-muscle-icon">${icon}</div>
      <div class="lib-muscle-name">${m}</div>
      <div class="lib-muscle-count">${count} exercise${count!==1?'s':''}</div>
    </div>`;
  }).join('')}</div>`;
}
function renderPlansAddExercises(muscle,q){
  const content=document.getElementById('plans-modal-content');
  let exs=allExercises().filter(e=>e.muscle===muscle);
  if(q.trim())exs=exs.filter(e=>e.name.toLowerCase().includes(q.toLowerCase()));
  exs.sort((a,b)=>a.name.localeCompare(b.name));
  if(!exs.length){content.innerHTML=`<div style="text-align:center;padding:60px 20px;color:var(--muted)">No exercises found</div>`;return;}
  content.innerHTML=`<div class="lib-ex-list">${exs.map(ex=>buildPlansAddExItem(ex)).join('')}</div>`;
}
function buildPlansAddExItem(ex){
  const plan=S.dayPlans[plansModalDayId]||[];
  const isAdded=plan.includes(ex.name);
  const escapedName=ex.name.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
  return`<div class="modal-ex-item" id="padd-${btoa(unescape(encodeURIComponent(ex.name))).replace(/[^a-zA-Z0-9]/g,'')}" style="${isAdded?'opacity:.45':''}">
    <div><div class="modal-ex-name">${ex.name}</div><div class="modal-ex-cat">${ex.muscle}</div></div>
    <div>${isAdded
      ?'<span style="color:var(--accent);font-size:13px;font-weight:600">Added &#10003;</span>'
      :`<button class="plans-add-ex-btn" onclick="addExToDay('${escapedName}');this.textContent='Added \\u2713';this.disabled=true;this.closest('.modal-ex-item').style.opacity='.45'">Add</button>`
    }</div>
  </div>`;
}
function filterPlansSearch(q){
  if(plansModalView==='days')renderPlansDayList(q);
  else if(plansModalView==='exercises')renderPlansDayExercises(plansModalDayId,q);
  else if(plansModalView==='add-muscles')renderPlansAddMuscles(q);
  else if(plansModalView==='add-exercises')renderPlansAddExercises(plansModalMuscle,q);
}

// ══════════════════════════════════════════════
//  LIBRARY MODAL
// ══════════════════════════════════════════════
let libModalView='muscles';
let libModalMuscle=null;

function openLibraryModal(){
  libModalView='muscles';
  libModalMuscle=null;
  document.getElementById('lib-modal-search').value='';
  document.getElementById('lib-modal-back').onclick=closeLibraryModal;
  document.getElementById('lib-modal-title').textContent='Exercise Library';
  renderLibMuscleGroups('');
  document.getElementById('lib-modal').classList.add('open');
}
function closeLibraryModal(){
  document.getElementById('lib-modal').classList.remove('open');
}
function libModalBack(){
  libModalView='muscles';
  libModalMuscle=null;
  document.getElementById('lib-modal-search').value='';
  document.getElementById('lib-modal-back').onclick=closeLibraryModal;
  document.getElementById('lib-modal-title').textContent='Exercise Library';
  renderLibMuscleGroups('');
}
function selectLibMuscle(muscle){
  libModalView='exercises';
  libModalMuscle=muscle;
  document.getElementById('lib-modal-search').value='';
  document.getElementById('lib-modal-back').onclick=libModalBack;
  document.getElementById('lib-modal-title').textContent=muscle;
  renderLibExercises(muscle,'');
}
function renderLibMuscleGroups(q){
  const content=document.getElementById('lib-modal-content');
  const all=allExercises();
  let muscles=MUSCLE_ORDER;
  if(q.trim()){
    // When searching on muscle screen, show flat exercise list
    const qLow=q.toLowerCase();
    const matches=all.filter(e=>e.name.toLowerCase().includes(qLow)||e.muscle.toLowerCase().includes(qLow));
    matches.sort((a,b)=>a.name.localeCompare(b.name));
    content.innerHTML=`<div class="lib-ex-list">${matches.map(ex=>buildLibExItem(ex)).join('')}</div>`;
    if(!matches.length)content.innerHTML=`<div style="text-align:center;padding:60px 20px;color:var(--muted)">No exercises found</div>`;
    return;
  }
  content.innerHTML=`<div class="lib-muscle-grid">${muscles.map(m=>{
    const count=all.filter(e=>e.muscle===m).length;
    const icon=MUSCLE_ICONS[m]||'•';
    return`<div class="lib-muscle-card" onclick="selectLibMuscle('${m}')">
      <div class="lib-muscle-icon">${icon}</div>
      <div class="lib-muscle-name">${m}</div>
      <div class="lib-muscle-count">${count} exercise${count!==1?'s':''}</div>
    </div>`;
  }).join('')}</div>`;
}
function renderLibExercises(muscle,q){
  const content=document.getElementById('lib-modal-content');
  let exs=allExercises().filter(e=>e.muscle===muscle);
  if(q.trim())exs=exs.filter(e=>e.name.toLowerCase().includes(q.toLowerCase()));
  exs.sort((a,b)=>a.name.localeCompare(b.name));
  if(!exs.length){content.innerHTML=`<div style="text-align:center;padding:60px 20px;color:var(--muted)">No exercises found</div>`;return;}
  content.innerHTML=`<div class="lib-ex-list">${exs.map(ex=>buildLibExItem(ex)).join('')}</div>`;
}
function buildLibExItem(ex){
  const r=resolveEx(ex);
  const key=btoa(unescape(encodeURIComponent(ex.name))).replace(/[^a-zA-Z0-9]/g,'');
  const escapedName=ex.name.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
  const displayName=(S.exerciseNameOverrides&&S.exerciseNameOverrides[ex.name])||ex.name;
  return`<div class="lib-ex-item">
    <div class="lib-ex-item-top" onclick="toggleLibItemByKey('${key}')">
      <div>
        <div style="display:flex;align-items:center;gap:6px">
          <div class="lib-ex-item-name">${displayName}</div>
          <button style="background:none;border:none;color:var(--muted2);font-size:16px;cursor:pointer;padding:0 2px;line-height:1;flex-shrink:0" onclick="event.stopPropagation();toggleLibRename('${key}')" title="Rename">&#8943;</button>
        </div>
        <div class="lib-ex-item-muscle">${ex.muscle}</div>
      </div>
      <span style="color:var(--muted);font-size:12px">&#9998;</span>
    </div>
    <div class="lib-ex-rename-bar" id="lib-rename-${key}">
      <input class="lib-ex-rename-input" id="lib-rename-input-${key}" value="${displayName}" placeholder="${ex.name}" autocomplete="off">
      <button class="lib-save-btn" style="flex-shrink:0" onclick="saveLibRename('${key}','${escapedName}')">Save</button>
      <button style="background:none;border:none;color:var(--muted);font-size:18px;cursor:pointer;padding:0 4px" onclick="toggleLibRename('${key}')">&#10005;</button>
    </div>
    <div class="lib-ex-edit" id="lib-edit-${key}">
      <div class="lib-edit-row">
        <div style="flex:1"><input class="lib-edit-input" id="lib-sets-${key}" value="${r.targetSets||''}" placeholder="Sets"><div class="lib-edit-label">Sets</div></div>
        <div style="flex:1"><input class="lib-edit-input" id="lib-reps-${key}" value="${r.targetReps||''}" placeholder="Reps"><div class="lib-edit-label">Rep Range</div></div>
        <div style="flex:1"><input class="lib-edit-input" type="number" inputmode="decimal" id="lib-wt-${key}" value="${r.targetWeight||''}" placeholder="0"><div class="lib-edit-label">Target lbs</div></div>
      </div>
      <div class="lib-edit-row"><button class="lib-save-btn" onclick="saveLibItemByKey('${key}','${escapedName}')">Save</button></div>
    </div>
  </div>`;
}
function toggleLibItemByKey(key){
  const edit=document.getElementById(`lib-edit-${key}`);
  if(edit)edit.classList.toggle('open');
}
function toggleLibRename(key){
  const bar=document.getElementById(`lib-rename-${key}`);
  if(bar){
    bar.classList.toggle('open');
    if(bar.classList.contains('open'))setTimeout(()=>document.getElementById(`lib-rename-input-${key}`)?.focus(),100);
  }
}
function saveLibRename(key,originalName){
  const inp=document.getElementById(`lib-rename-input-${key}`);
  if(!inp)return;
  const newName=inp.value.trim();
  if(!newName){showToast('Name cannot be empty',false);return;}
  if(!S.exerciseNameOverrides)S.exerciseNameOverrides={};
  if(newName===originalName){delete S.exerciseNameOverrides[originalName];}
  else{S.exerciseNameOverrides[originalName]=newName;}
  saveState();
  showToast('Name saved',false);
  const bar=document.getElementById(`lib-rename-${key}`);
  if(bar)bar.classList.remove('open');
  // Update displayed name inline
  const nameEl=document.querySelector(`#lib-rename-${key}`)?.closest('.lib-ex-item')?.querySelector('.lib-ex-item-name');
  if(nameEl)nameEl.textContent=newName;
}
function saveLibItemByKey(key,name){
  const sets=document.getElementById(`lib-sets-${key}`).value.trim();
  const reps=document.getElementById(`lib-reps-${key}`).value.trim();
  const wt=document.getElementById(`lib-wt-${key}`).value;
  S.exerciseOverrides[name]={targetSets:sets,targetReps:reps,targetWeight:parseFloat(wt)||0};
  saveState();showToast(`Saved: ${name}`,false);
  document.getElementById(`lib-edit-${key}`).classList.remove('open');
}
function filterLibrarySearch(q){
  if(libModalView==='muscles'){
    renderLibMuscleGroups(q);
  }else{
    renderLibExercises(libModalMuscle,q);
  }
}

// ══════════════════════════════════════════════
//  LOG PAGE
// ══════════════════════════════════════════════
function renderDayGrid(){
  document.getElementById('log-date-sub').textContent=todayStr();
  const allDays=allDayDefs();
  const regularDays=allDays.filter(d=>d.id!=='misc');
  const miscDay=allDays.find(d=>d.id==='misc');
  const daysToRender=[...regularDays,...(miscDay?[miscDay]:[])];
  document.getElementById('day-grid').innerHTML=daysToRender.map(d=>{
    const active=S.currentSession&&S.currentSession.dayId===d.id;
    const count=(S.dayPlans[d.id]||[]).length;
    const cls=(d.id==='misc'?'day-card misc':'day-card')+(active?' active-session':'');
    return`<div class="${cls}" onclick="selectDay('${d.id}')">
      <span class="day-card-icon">${d.icon}</span>
      <div class="day-card-name">${d.label}</div>
      <div class="day-card-count">${active?'&#9201; In Progress':count+' exercises'}</div>
    </div>`;
  }).join('');
  updateLogCalBanner();
}

function selectDay(dayId){
  if(!S.currentSession||S.currentSession.dayId!==dayId){
    S.currentSession={dayId,startTime:Date.now(),exercises:[]};
    saveState();
  }
  document.getElementById('log-home').style.display='none';
  document.getElementById('log-active').style.display='block';
  renderActiveSession();startTimer();
}

function renderActiveSession(){
  const def=allDayDefs().find(d=>d.id===S.currentSession.dayId);
  document.getElementById('log-active').innerHTML=`
    <button class="back-btn" onclick="backToDaySelect()" style="padding-top:calc(env(safe-area-inset-top,0px) + 14px)">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
      ${def?def.label:'Workout'}
    </button>
    <div class="workout-view">
      <div class="timer-bar">
        <div><div class="timer-display" id="timer-display">00:00</div><div class="timer-label">Elapsed</div></div>
        <div class="timer-center"><div class="rest-display" id="rest-display">00:00</div><div class="timer-label">Rest</div></div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
          <button class="timer-btn" onclick="finishWorkout()">Finish Workout</button>
          <button class="timer-cancel-btn" onclick="cancelWorkout()">Cancel Workout</button>
        </div>
      </div>
      <div id="session-exercises"></div>
      <button class="add-ex-btn" onclick="openAddExercise()"><span style="font-size:18px">+</span> Add Exercise</button>
      <div style="height:10px"></div>
    </div>`;
  renderSessionExercises();
  startRestTimer();
}

function renderSessionExercises(){
  const c=document.getElementById('session-exercises');if(!c)return;
  c.innerHTML='';
  S.currentSession.exercises.forEach((ex,ei)=>c.appendChild(buildExBlock(ex,ei)));
}

function buildExBlock(ex,ei){
  const block=document.createElement('div');
  block.className='exercise-block';block.id=`ex-block-${ei}`;
  const resolved=resolveEx(ex);
  const isCardio=CARDIO_EXERCISES.has(ex.name)||ex.muscle==='Cardio';
  const hasPR=!isCardio&&ex.sets.some(s=>!s.warmup&&isPR(ex.name,s.weight,s.reps));
  const targetWt=resolved.targetWeight?` <span style="color:var(--accent)">&#8594; ${resolved.targetWeight}lbs</span>`:'';
  const displayName=(S.exerciseNameOverrides&&S.exerciseNameOverrides[ex.name])||ex.name;
  const variations=typeof EXERCISE_VARIATIONS!=='undefined'?EXERCISE_VARIATIONS[ex.name]:null;
  const variationSel=variations
    ?`<select class="variation-select" onchange="setExVariation(${ei},this.value)">
        ${variations.map(v=>`<option value="${v}"${ex.variation===v?' selected':''}>${v}</option>`).join('')}
      </select>`
    :'';
  block.innerHTML=`
    <div class="ex-header">
      <div style="min-width:0;flex:1">
        <div class="ex-name">${displayName}</div>
        ${variationSel}
        <div class="ex-meta">${ex.muscle}${!isCardio?` &middot; ${resolved.targetSets} sets &middot; ${resolved.targetReps}${targetWt}`:''}</div>
        <div class="ex-ts">Added ${timeStr(ex.timestamp)}</div>
      </div>
      <div class="ex-actions">
        ${hasPR?`<span class="pr-badge">PR</span>`:''}
        <button class="icon-btn" onclick="toggleChangeEx(${ei})" title="Change exercise" style="font-size:11px;color:var(--muted2)">&#8644;</button>
        <button class="icon-btn del" onclick="removeExercise(${ei})">&#10005;</button>
      </div>
    </div>
    <div class="change-ex-bar" id="change-bar-${ei}">
      <input class="change-ex-search" id="change-search-${ei}" placeholder="Search to swap exercise..." oninput="filterChangeEx(${ei},this.value)">
      <div class="change-ex-list" id="change-list-${ei}"></div>
    </div>
    <div id="sets-${ei}"></div>
    <button class="add-set-btn" onclick="addSet(${ei})">+ Add Set</button>`;
  const sc=block.querySelector(`#sets-${ei}`);
  ex.sets.forEach((s,si)=>sc.appendChild(buildSetRow(ei,si,s,isCardio)));
  return block;
}
function setExVariation(ei,val){
  S.currentSession.exercises[ei].variation=val;saveState();
}

function toggleChangeEx(ei){
  const bar=document.getElementById(`change-bar-${ei}`);
  bar.classList.toggle('open');
  if(bar.classList.contains('open')){
    scrollToCenter(bar);
    setTimeout(()=>document.getElementById(`change-search-${ei}`).focus(),200);
  }
}

function filterChangeEx(ei,q){
  const list=document.getElementById(`change-list-${ei}`);
  if(!q.trim()){list.innerHTML='';return;}
  const matches=allExercises().filter(e=>e.name.toLowerCase().includes(q.toLowerCase())).slice(0,8);
  list.innerHTML=matches.map(e=>`<div class="change-ex-opt" onclick="swapExercise(${ei},'${e.name.replace(/'/g,"\\'")}')">
    ${e.name} <span style="color:var(--muted);font-size:11px">${e.muscle}</span>
  </div>`).join('');
}

function swapExercise(ei,newName){
  const ex=S.currentSession.exercises[ei];
  const resolved=resolveEx(newName);
  ex.name=resolved.name;ex.muscle=resolved.muscle;
  ex.targetSets=resolved.targetSets;ex.targetReps=resolved.targetReps;ex.targetWeight=resolved.targetWeight;
  saveState();renderSessionExercises();
}

function isDumbbellExercise(name){
  return/\b(dumbbell|db)\b/i.test(name);
}

function buildSetRow(ei,si,set,isCardio){
  const row=document.createElement('div');
  if(isCardio===undefined){
    const ex=S.currentSession.exercises[ei];
    isCardio=CARDIO_EXERCISES.has(ex.name)||ex.muscle==='Cardio';
  }
  const exName=S.currentSession.exercises[ei].name;
  const isDumbbell=!isCardio&&isDumbbellExercise(exName);
  if(isCardio){
    row.className='set-row cardio-row';row.id=`set-${ei}-${si}`;
    row.innerHTML=`
      <div class="set-num">${si+1}</div>
      <div><input class="set-input" type="number" inputmode="decimal" placeholder="—" value="${set.time||''}" onfocus="scrollToCenter(this)" onchange="updateSet(${ei},${si},'time',this.value)"><div class="cardio-label">min</div></div>
      <div><input class="set-input" type="number" inputmode="decimal" placeholder="—" value="${set.speed||''}" onfocus="scrollToCenter(this)" onchange="updateSet(${ei},${si},'speed',this.value)"><div class="cardio-label">speed</div></div>
      <div><input class="set-input" type="number" inputmode="decimal" placeholder="—" value="${set.resistance||''}" onfocus="scrollToCenter(this)" onchange="updateSet(${ei},${si},'resistance',this.value)"><div class="cardio-label">resistance</div></div>
      <div></div>`;
    return row;
  }
  const isWarmup=set.warmup||false;
  const displayWeight=isDumbbell?set.weight*2||'':set.weight||'';
  const weightForPR=isDumbbell?set.weight*2:set.weight;
  const pr=!isWarmup&&isPR(exName,weightForPR,set.reps);
  const prStatus=!isWarmup&&set.weight&&set.reps?getPRStatus(exName,weightForPR,set.reps):null;
  const prBadgeHtml=isWarmup?'<div></div>':prStatus==='up'?`<div style="background:#39d98a;color:#fff;border:none;font-size:9px;font-weight:800;letter-spacing:.08em;padding:2px 6px;border-radius:5px;text-transform:uppercase;font-family:monospace;min-width:24px;text-align:center">+ </div>`:prStatus==='equal'?`<div style="background:#007aff;color:#fff;border:none;font-size:9px;font-weight:800;letter-spacing:.08em;padding:2px 6px;border-radius:5px;text-transform:uppercase;font-family:monospace;min-width:24px;text-align:center">= </div>`:prStatus==='down'?`<div style="background:#ff4d6d;color:#fff;border:none;font-size:9px;font-weight:800;letter-spacing:.08em;padding:2px 6px;border-radius:5px;text-transform:uppercase;font-family:monospace;min-width:24px;text-align:center">− </div>`:pr?`<div class="pr-badge">PR</div>`:'<div></div>';
  row.className=`set-row${pr?' pr':''}${isWarmup?' warmup-row':''}`;row.id=`set-${ei}-${si}`;

  const restHtml=set.rest?`<div style="font-size:9px;color:var(--accent);margin-top:2px;font-weight:600">${set.rest}m rest</div>`:'';

  if(isDumbbell){
    row.innerHTML=`
      <div style="text-align:center">
        <div class="set-num">${si+1}</div>
        ${restHtml}
      </div>
      <button class="warmup-btn${isWarmup?' active':''}" onclick="toggleWarmup(${ei},${si})" title="Mark as warmup">W</button>
      <div style="display:flex;align-items:center;gap:6px;flex:1">
        <input class="set-input" type="number" inputmode="decimal" placeholder="lbs" value="${set.weight||''}" onfocus="scrollToCenter(this)" onchange="updateSet(${ei},${si},'weight',this.value)" style="flex:1">
        <span style="font-size:12px;color:var(--muted);white-space:nowrap">× 2</span>
        <span style="font-size:13px;color:var(--muted2);font-weight:500;min-width:30px;text-align:right">${displayWeight?displayWeight+'':'-'}</span>
      </div>
      <input class="set-input" type="number" inputmode="numeric" placeholder="reps" value="${set.reps||''}" onfocus="scrollToCenter(this)" onchange="updateSet(${ei},${si},'reps',this.value)">
      ${prBadgeHtml}`;
  }else{
    row.innerHTML=`
      <div style="text-align:center">
        <div class="set-num">${si+1}</div>
        ${restHtml}
      </div>
      <button class="warmup-btn${isWarmup?' active':''}" onclick="toggleWarmup(${ei},${si})" title="Mark as warmup">W</button>
      <input class="set-input" type="number" inputmode="decimal" placeholder="lbs" value="${set.weight||''}" onfocus="scrollToCenter(this)" onchange="updateSet(${ei},${si},'weight',this.value)">
      <input class="set-input" type="number" inputmode="numeric" placeholder="reps" value="${set.reps||''}" onfocus="scrollToCenter(this)" onchange="updateSet(${ei},${si},'reps',this.value)">
      ${prBadgeHtml}`;
  }
  return row;
}

function toggleWarmup(ei,si){
  const set=S.currentSession.exercises[ei].sets[si];
  set.warmup=!set.warmup;
  const row=document.getElementById(`set-${ei}-${si}`);
  if(!row)return;
  const isWarmup=set.warmup;
  row.classList.toggle('warmup-row',isWarmup);row.classList.toggle('pr',false);
  const wBtn=row.querySelector('.warmup-btn');if(wBtn)wBtn.classList.toggle('active',isWarmup);
  const badge=row.querySelector('div:last-child');
  if(badge)badge.outerHTML='<div></div>';
  saveState();
}

function addSet(ei){
  const ex=S.currentSession.exercises[ei];
  const sets=ex.sets;
  const last=sets.length>0?sets[sets.length-1]:{weight:'',reps:'',time:'',speed:'',resistance:''};
  const isCardio=CARDIO_EXERCISES.has(ex.name)||ex.muscle==='Cardio';
  const now=Date.now();
  const restMs=sets.length>0&&last.ts?now-last.ts:0;
  const restMin=Math.round(restMs/60000);

  let warmupDefault=false;
  const isFirstEx=ei===0;
  if(isFirstEx&&!isCardio){
    if(!S.currentSession.warmupCheckDone){
      warmupDefault=sets.length<4;
    }
  }

  const newSet=isCardio
    ?{time:last.time||'',speed:last.speed||'',resistance:last.resistance||'',ts:now,rest:restMin}
    :{weight:last.weight||'',reps:last.reps||'',ts:now,warmup:warmupDefault,rest:restMin};
  sets.push(newSet);
  const sc=document.getElementById(`sets-${ei}`);
  const si=sets.length-1;
  const row=buildSetRow(ei,si,sets[si],isCardio);
  sc.appendChild(row);
  scrollToCenter(row);
  resetRestTimer();
  saveState();

  if(isFirstEx&&!isCardio&&!S.currentSession.warmupCheckDone&&(sets.length===4||sets.length===5)){
    showWarmupCheckDialog(ei);
  }
}

function updateSet(ei,si,field,val){
  const set=S.currentSession.exercises[ei].sets[si];
  set[field]=val?parseFloat(val):'';
  const name=S.currentSession.exercises[ei].name;
  const isDumb=isDumbbellExercise(name);
  const row=document.getElementById(`set-${ei}-${si}`);if(!row)return;
  const isWarmup=set.warmup;
  const weightForPR=isDumb?set.weight*2:set.weight;
  const pr=!isWarmup&&isPR(name,weightForPR,set.reps);
  row.classList.toggle('pr',pr&&!isWarmup);
  if(isDumb&&field==='weight'){
    const dbDisplay=row.querySelector('span:nth-child(3)');
    if(dbDisplay)dbDisplay.textContent=set.weight?set.weight*2+'':'-';
  }
  const prStatus=!isWarmup&&set.weight&&set.reps?getPRStatus(name,weightForPR,set.reps):null;
  const badge=row.querySelector('div:last-child');
  if(badge)badge.outerHTML=isWarmup?`<div class="wu-badge">WU</div>`:prStatus==='up'?`<div style="background:#39d98a;color:#fff;border:none;font-size:9px;font-weight:800;letter-spacing:.08em;padding:2px 6px;border-radius:5px;text-transform:uppercase;font-family:monospace;min-width:24px;text-align:center">+ </div>`:prStatus==='equal'?`<div style="background:#007aff;color:#fff;border:none;font-size:9px;font-weight:800;letter-spacing:.08em;padding:2px 6px;border-radius:5px;text-transform:uppercase;font-family:monospace;min-width:24px;text-align:center">= </div>`:prStatus==='down'?`<div style="background:#ff4d6d;color:#fff;border:none;font-size:9px;font-weight:800;letter-spacing:.08em;padding:2px 6px;border-radius:5px;text-transform:uppercase;font-family:monospace;min-width:24px;text-align:center">− </div>`:pr?`<div class="pr-badge">PR</div>`:'<div></div>';
  const block=document.getElementById(`ex-block-${ei}`);
  if(block){
    const anyPR=S.currentSession.exercises[ei].sets.some(s=>!s.warmup&&isPR(name,isDumb?s.weight*2:s.weight,s.reps));
    const existing=block.querySelector('.ex-actions .pr-badge');
    if(anyPR&&!existing)block.querySelector('.icon-btn.del').insertAdjacentHTML('beforebegin','<span class="pr-badge">PR</span>');
    else if(!anyPR&&existing)existing.remove();
  }
  saveState();
}

function showWarmupCheckDialog(ei){
  const overlay=document.createElement('div');
  overlay.style.cssText=`
    position:fixed;inset:0;z-index:5000;
    background:rgba(0,0,0,.6);
    display:flex;align-items:center;justify-content:center;
    padding:20px;font-family:'Barlow',sans-serif;
  `;
  const dialog=document.createElement('div');
  dialog.style.cssText=`
    background:var(--surface,#181818);
    border:1px solid var(--border,#2e2e2e);
    border-radius:16px;padding:28px 24px;
    max-width:340px;width:100%;
    text-align:center;
  `;
  dialog.innerHTML=`
    <div style="font-size:20px;font-weight:700;color:var(--text,#f2f2f2);margin-bottom:12px">
      Have you completed your warmup?
    </div>
    <div style="font-size:14px;color:var(--muted,#5a5a5a);margin-bottom:24px;line-height:1.5">
      We'll mark sets automatically to help track your workout.
    </div>
    <div style="display:flex;flex-direction:column;gap:12px">
      <button id="warmup-yes-btn" style="
        background:var(--accent,#ff6b35);color:#fff;
        border:none;border-radius:12px;padding:14px;
        font-family:'Barlow',sans-serif;font-size:15px;font-weight:700;
        cursor:pointer;transition:opacity .15s
      ">Yes, start working sets</button>
      <button id="warmup-continue-btn" style="
        background:transparent;color:var(--accent,#ff6b35);
        border:1px solid var(--accent,#ff6b35);border-radius:12px;padding:13px;
        font-family:'Barlow',sans-serif;font-size:15px;font-weight:600;
        cursor:pointer;transition:opacity .15s
      ">Continue warmup</button>
    </div>
  `;
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  document.getElementById('warmup-yes-btn').onclick=()=>{
    S.currentSession.warmupCheckDone=true;
    S.currentSession.exercises[ei].sets.forEach(s=>{s.warmup=false;});
    renderSessionExercises();
    saveState();
    overlay.remove();
  };

  document.getElementById('warmup-continue-btn').onclick=()=>{
    overlay.remove();
  };
}

function removeExercise(ei){S.currentSession.exercises.splice(ei,1);renderSessionExercises();saveState();}
function backToDaySelect(){
  stopTimer();stopRestTimer();
  document.getElementById('log-active').style.display='none';
  document.getElementById('log-home').style.display='block';
  renderDayGrid();
}
function cancelWorkout(){
  if(!confirm('Cancel this workout? All progress will be lost.'))return;
  S.currentSession=null;
  stopTimer();stopRestTimer();saveState();
  document.getElementById('log-active').style.display='none';
  document.getElementById('log-home').style.display='block';
  renderDayGrid();
}

// ══════════════════════════════════════════════
//  FINISH & SUMMARY
// ══════════════════════════════════════════════
function finishWorkout(){
  if(!S.currentSession.exercises.length){showToast('Add at least one exercise first',false);return;}
  const endTime=Date.now();
  const duration=endTime-S.currentSession.startTime;
  const def=allDayDefs().find(d=>d.id===S.currentSession.dayId);
  const newPRs=[];
  if(!S.cardioPrs)S.cardioPrs={};
  S.currentSession.exercises.forEach(ex=>{
    const isCardio=CARDIO_EXERCISES.has(ex.name)||ex.muscle==='Cardio';
    if(isCardio){
      ex.sets.forEach(s=>{
        if(s.time||s.speed||s.resistance)
          S.cardioPrs[ex.name]={time:s.time||'',speed:s.speed||'',resistance:s.resistance||'',date:Date.now()};
      });
    }else{
      ex.sets.forEach(s=>{
        if(!s.warmup&&s.weight&&s.reps){
          const isDumb=isDumbbellExercise(ex.name);
          const weightForPR=isDumb?s.weight*2:s.weight;
          if(isPR(ex.name,weightForPR,s.reps)){
            const old=S.prs[ex.name];
            newPRs.push({name:ex.name,oldWeight:old?old.weight:null,oldReps:old?old.reps:null,newWeight:weightForPR,newReps:s.reps});
            recordPR(ex.name,s.weight,s.reps);
          }
        }
      });
    }
  });
  const weightUpdates=[];
  S.currentSession.exercises.forEach(ex=>{
    const resolved=resolveEx(ex);
    const maxLogged=Math.max(0,...ex.sets.filter(s=>!s.warmup&&s.weight).map(s=>s.weight));
    if(maxLogged>0&&maxLogged!==(resolved.targetWeight||0))
      weightUpdates.push({name:ex.name,current:resolved.targetWeight||0,logged:maxLogged});
  });
  S.workouts.unshift({
    dayId:S.currentSession.dayId,dayLabel:def?def.label:'Workout',
    startTime:S.currentSession.startTime,endTime,duration,
    exercises:JSON.parse(JSON.stringify(S.currentSession.exercises)),
    calories:calcWorkoutCalories(S.currentSession.exercises,duration),
  });
  S.currentSession=null;stopTimer();stopRestTimer();saveState();
  showSummary({def,duration,exercises:S.workouts[0].exercises,newPRs,weightUpdates,calories:S.workouts[0].calories});
  document.getElementById('log-active').style.display='none';
  document.getElementById('log-home').style.display='block';
  renderDayGrid();
}

function showSummary({def,duration,exercises,newPRs,weightUpdates,calories}){
  const totalSets=exercises.reduce((a,ex)=>a+ex.sets.filter(s=>s.weight||s.reps).length,0);
  document.getElementById('sum-emoji').textContent=newPRs.length?'🏆':(def?def.icon:'✅');
  document.getElementById('sum-title').textContent=newPRs.length?'New Personal Best!':'Workout Complete';
  document.getElementById('sum-sub').textContent=(def?def.label:'Workout')+' · '+new Date().toLocaleDateString('en-US',{month:'long',day:'numeric'});
  document.getElementById('sum-duration').textContent=durStr(duration);
  document.getElementById('sum-calories').textContent=calories?calories.toLocaleString():'—';
  document.getElementById('sum-sets').textContent=totalSets;
  let bodyHtml='';
  if(newPRs.length){
    bodyHtml+=`<div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:8px">New PRs</div>`;
    bodyHtml+=newPRs.map(pr=>`<div class="summary-pr-item">
      <div><div class="summary-pr-name">${pr.name}</div>${pr.oldWeight?`<div class="summary-pr-old">Prev: ${pr.oldWeight}lbs &times; ${pr.oldReps}</div>`:'<div class="summary-pr-old">First time logged</div>'}</div>
      <div class="summary-pr-new"><div class="summary-pr-val">${pr.newWeight}lbs</div><div class="summary-pr-badge">&times; ${pr.newReps} reps &#8593;</div></div>
    </div>`).join('');
  }
  document.getElementById('summary-body').innerHTML=bodyHtml||`<div style="color:var(--muted);font-size:14px;padding:20px 0;text-align:center">Keep pushing.</div>`;
  const updateArea=document.getElementById('sum-pr-update-area');
  if(weightUpdates.length){
    updateArea.innerHTML=`<div style="background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:14px;margin-bottom:10px">
      <div style="font-size:12px;font-weight:700;color:var(--muted2);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px">Update Target Weights?</div>
      ${weightUpdates.map((u,i)=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
        <div><div style="font-size:13px;font-weight:500">${u.name}</div><div style="font-size:11px;color:var(--muted)">${u.current?u.current+'lbs &rarr; ':''}<span style="color:var(--accent)">${u.logged}lbs</span></div></div>
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer"><input type="checkbox" id="wt-update-${i}" checked style="accent-color:var(--accent);width:16px;height:16px"><span style="font-size:12px;color:var(--muted2)">Update</span></label>
      </div>`).join('')}
      <button class="lib-save-btn" style="margin-top:12px;width:100%;padding:10px" onclick='applyWeightUpdates(${JSON.stringify(weightUpdates)})'>Apply Selected</button>
    </div>`;
  } else updateArea.innerHTML='';
  document.getElementById('summary-modal').classList.add('open');
}

function applyWeightUpdates(updates){
  updates.forEach((u,i)=>{
    const cb=document.getElementById(`wt-update-${i}`);
    if(cb&&cb.checked){if(!S.exerciseOverrides[u.name])S.exerciseOverrides[u.name]={};S.exerciseOverrides[u.name].targetWeight=u.logged;}
  });
  saveState();document.getElementById('sum-pr-update-area').innerHTML=`<div style="font-size:12px;color:var(--green);padding:6px 0">&#10003; Targets updated</div>`;
}
function dismissSummary(){
  document.getElementById('summary-modal').classList.remove('open');
  renderHistory();renderRecords();updateLogCalBanner();
}

// ══════════════════════════════════════════════
//  ADD EXERCISE MODAL
// ══════════════════════════════════════════════
function openAddExercise(){
  const def=allDayDefs().find(d=>d.id===S.currentSession?.dayId);
  document.getElementById('modal-title').textContent='Add Exercise';
  document.getElementById('modal-sub').textContent=def?def.label:'';
  document.getElementById('modal-search').value='';
  renderModalList('');
  const overlay=document.getElementById('ex-modal');
  overlay.classList.add('open');
  overlay.onclick=e=>{if(e.target===overlay)closeModal();};
  setTimeout(()=>document.getElementById('modal-search').focus(),300);
}
function closeModal(){document.getElementById('ex-modal').classList.remove('open');}
function filterModal(q){renderModalList(q.toLowerCase());}

function renderModalList(q){
  const list=document.getElementById('modal-list');
  const dayId=S.currentSession?.dayId;
  const planNames=new Set(S.dayPlans[dayId]||[]);
  const added=new Set((S.currentSession?.exercises||[]).map(e=>e.name));
  const all=allExercises();
  const thisDayEx=all.filter(e=>planNames.has(e.name));
  const otherEx=all.filter(e=>!planNames.has(e.name));
  const fThis=thisDayEx.filter(e=>!q||e.name.toLowerCase().includes(q)||e.muscle.toLowerCase().includes(q));
  const fOther=otherEx.filter(e=>!q||e.name.toLowerCase().includes(q)||e.muscle.toLowerCase().includes(q));
  list.innerHTML='';
  if(fThis.length){
    if(!q){const l=document.createElement('div');l.className='modal-section-label';l.textContent='This Workout';list.appendChild(l);}
    fThis.forEach(ex=>list.appendChild(buildModalItem(ex,added.has(ex.name))));
  }
  if(fOther.length){
    const l=document.createElement('div');l.className='modal-section-label';l.textContent=q?'Results':'All Exercises';list.appendChild(l);
    fOther.forEach(ex=>list.appendChild(buildModalItem(ex,added.has(ex.name))));
  }
  if(!fThis.length&&!fOther.length)list.innerHTML=`<div style="text-align:center;padding:40px;color:var(--muted)">No exercises found</div>`;
}

function buildModalItem(ex,isAdded){
  const pr=S.prs[ex.name];const resolved=resolveEx(ex);
  const item=document.createElement('div');item.className='modal-ex-item';
  if(isAdded)item.style.opacity='.4';
  item.innerHTML=`<div><div class="modal-ex-name">${ex.name}${isAdded?' &#10003;':''}</div><div class="modal-ex-cat">${ex.muscle}</div></div>
    <div style="text-align:right">${pr?`<div class="modal-ex-pr">${pr.weight}lbs &times; ${pr.reps}</div>`:''}<div class="modal-ex-target">${resolved.targetSets} &middot; ${resolved.targetReps}${resolved.targetWeight?` &middot; ${resolved.targetWeight}lbs`:''}</div></div>`;
  if(!isAdded)item.onclick=()=>{addExToSession(ex);closeModal();};
  return item;
}

function addExToSession(ex){
  const resolved=resolveEx(ex);
  const isCardio=CARDIO_EXERCISES.has(resolved.name)||resolved.muscle==='Cardio';
  const initSet=isCardio?{time:'',speed:'',resistance:'',ts:Date.now()}:{weight:'',reps:'',ts:Date.now(),warmup:false};
  S.currentSession.exercises.unshift({...resolved,timestamp:Date.now(),sets:[initSet]});
  saveState();renderSessionExercises();
}

// ══════════════════════════════════════════════
//  RECORDS
// ══════════════════════════════════════════════
let recordsView='muscles';
let recordsMuscle=null;
let recordsExpandedExercises={}; // Track which exercise rows are expanded: {exerciseName: true/false}

function renderRecords(){
  const inp=document.getElementById('records-search');
  if(inp)inp.value='';
  recordsView='muscles';
  recordsMuscle=null;
  recordsExpandedExercises={}; // Reset expanded state when going back to muscle view
  renderRecordsMuscleGrid('');
}
function renderRecordsMuscleGrid(q){
  recordsView='muscles';
  const body=document.getElementById('records-scroll-body');
  const all=allExercises();
  let content;
  if(q.trim()){
    const qLow=q.toLowerCase();
    const matches=all.filter(e=>e.name.toLowerCase().includes(qLow)||e.muscle.toLowerCase().includes(qLow));
    matches.sort((a,b)=>a.name.localeCompare(b.name));
    content=buildRecordsExList(matches);
  }else{
    content=`<div class="lib-muscle-grid">${MUSCLE_ORDER.map(m=>{
      const count=all.filter(e=>e.muscle===m).length;
      const icon=MUSCLE_ICONS[m]||'•';
      const hasPR=all.filter(e=>e.muscle===m).some(e=>S.prs[e.name]);
      return`<div class="lib-muscle-card" onclick="selectRecordsMuscle('${m}')">
        <div class="lib-muscle-icon">${icon}</div>
        <div class="lib-muscle-name">${m}</div>
        <div class="lib-muscle-count">${count} exercise${count!==1?'s':''}${hasPR?' · PR':''}</div>
      </div>`;
    }).join('')}</div>`;
  }
  body.innerHTML=`<div class="page-head"><div class="page-head-title">Records</div><div class="page-head-sub">PRs &amp; recommended ranges</div></div>
    ${content}<div style="height:16px"></div>`;
}
function selectRecordsMuscle(muscle){
  recordsView='exercises';
  recordsMuscle=muscle;
  const inp=document.getElementById('records-search');
  if(inp)inp.value='';
  renderRecordsExercises(muscle,'');
}
function renderRecordsExercises(muscle,q){
  const body=document.getElementById('records-scroll-body');
  const icon=MUSCLE_ICONS[muscle]||'•';
  let exs=allExercises().filter(e=>e.muscle===muscle);
  if(q.trim())exs=exs.filter(e=>e.name.toLowerCase().includes(q.toLowerCase()));
  exs.sort((a,b)=>a.name.localeCompare(b.name));
  body.innerHTML=`<div class="records-sticky-header">
      <button onclick="renderRecords()" style="background:none;border:none;color:var(--accent);font-family:'Barlow',sans-serif;font-size:15px;font-weight:600;cursor:pointer;padding:4px 0;display:flex;align-items:center;gap:2px;flex-shrink:0">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>Back</button>
      <div style="flex:1;font-family:'Barlow Condensed',sans-serif;font-size:28px;font-weight:800;text-transform:uppercase;letter-spacing:.02em;line-height:1">${icon} ${muscle}</div>
    </div>
    ${buildRecordsExList(exs,muscle)}<div style="height:16px"></div>`;
}
function getHistoricalSets(exerciseName){
  const sets=[];
  S.workouts.forEach(w=>{
    w.exercises.forEach((ex,ei)=>{
      if(ex.name===exerciseName){
        ex.sets.forEach((s,si)=>{
          if(s.weight||s.reps||s.time||s.speed){
            sets.push({weight:s.weight,reps:s.reps,time:s.time,speed:s.speed,resistance:s.resistance,warmup:s.warmup,workoutDate:shortDate(w.startTime),workoutIndex:w.startTime});
          }
        });
      }
    });
  });
  return sets.sort((a,b)=>b.workoutIndex-a.workoutIndex);
}

function toggleRecordsExpand(exName,muscleGroup){
  // Close other expanded exercises in the same muscle group
  const exercisesInMuscle=allExercises().filter(e=>e.muscle===muscleGroup);
  exercisesInMuscle.forEach(e=>{
    if(e.name!==exName)recordsExpandedExercises[e.name]=false;
  });
  recordsExpandedExercises[exName]=!recordsExpandedExercises[exName];
  renderRecordsExercises(muscleGroup,'');
}

function buildRecordsExList(exs,muscleGroup=''){
  if(!exs.length)return`<div style="text-align:center;padding:60px 20px;color:var(--muted)">No exercises found</div>`;
  return`<div style="margin:0 20px;background:var(--surface);border:1px solid var(--border);border-radius:14px;overflow:hidden">
    ${exs.map((ex,i)=>{
      const isCardio=CARDIO_EXERCISES.has(ex.name)||ex.muscle==='Cardio';
      const pr=isCardio?(S.cardioPrs&&S.cardioPrs[ex.name]):S.prs[ex.name];
      const isExpanded=recordsExpandedExercises[ex.name];
      const historicalSets=isExpanded?getHistoricalSets(ex.name):[];
      let prHtml;
      if(isCardio){
        prHtml=pr
          ?`<div class="er-pr-val" style="font-size:15px">${pr.time?pr.time+' min':''}</div><div class="er-pr-date">${[pr.speed?'spd '+pr.speed:'',pr.resistance?'res '+pr.resistance:''].filter(Boolean).join(' · ')}${pr.date?' · '+shortDate(pr.date):''}</div>`
          :`<div class="er-no-pr">No record yet</div>`;
      }else{
        prHtml=pr
          ?`<div class="er-pr-val">${pr.weight}lbs</div><div class="er-pr-date">&times; ${pr.reps} reps &middot; ${shortDate(pr.date)}</div>`
          :`<div class="er-no-pr">No PR yet</div>`;
      }
      const rowHtml=`<div class="exercise-record-row" style="${i>0?'border-top:1px solid var(--border);':''}cursor:pointer;display:flex;align-items:center;justify-content:space-between;padding:12px 14px" onclick="toggleRecordsExpand('${ex.name}','${muscleGroup}')">
        <div><div class="er-name">${ex.name}</div></div>
        <div style="display:flex;align-items:center;gap:8px">
          <div class="er-pr">${prHtml}</div>
          <div style="font-size:16px;color:var(--muted2);transition:transform .2s">${isExpanded?'▼':'▶'}</div>
        </div>
      </div>`;
      const expandedHtml=isExpanded?`<div style="background:var(--surface2);padding:10px 14px;border-top:1px solid var(--border);font-size:12px;color:var(--muted2)">
        ${historicalSets.length?historicalSets.map((s,si)=>`<div style="display:flex;justify-content:space-between;padding:6px 0;${si>0?'border-top:1px solid var(--border);':''}">${s.weight?`<span><strong>${s.weight}lbs</strong> × ${s.reps}</span>`:`<span>${s.time||'-'} min</span>`}<span>${s.workoutDate}</span></div>`).join(''):'<div style="padding:8px;color:var(--muted)">No sets logged</div>'}
      </div>`:'';
      return rowHtml+expandedHtml;
    }).join('')}
  </div>`;
}
function filterRecordsSearch(q){
  if(recordsView==='muscles')renderRecordsMuscleGrid(q);
  else renderRecordsExercises(recordsMuscle,q);
}

// ══════════════════════════════════════════════
//  HISTORY (CALENDAR)
// ══════════════════════════════════════════════
let calYear=new Date().getFullYear(),calMonth=new Date().getMonth();

function shiftMonth(dir){
  calMonth+=dir;
  if(calMonth>11){calMonth=0;calYear++;}
  if(calMonth<0){calMonth=11;calYear--;}
  renderHistory();
}

function renderHistory(){
  document.getElementById('history-sub').textContent=`${S.workouts.length} workout${S.workouts.length!==1?'s':''} logged`;
  // Calendar header
  const monthNames=['January','February','March','April','May','June','July','August','September','October','November','December'];
  document.getElementById('cal-month-label').textContent=`${monthNames[calMonth]} ${calYear}`;
  // Build calendar
  const grid=document.getElementById('cal-grid');
  const dayLabels=['Su','Mo','Tu','We','Th','Fr','Sa'];
  const workoutDates=new Set(S.workouts.map(w=>isoDate(w.startTime)));
  const today=isoDate(Date.now());
  const firstDay=new Date(calYear,calMonth,1).getDay();
  const daysInMonth=new Date(calYear,calMonth+1,0).getDate();
  let calHtml=dayLabels.map(d=>`<div class="cal-day-label">${d}</div>`).join('');
  for(let i=0;i<firstDay;i++)calHtml+=`<div class="cal-day empty"></div>`;
  for(let d=1;d<=daysInMonth;d++){
    const ds=`${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const hasW=workoutDates.has(ds);
    const isToday=ds===today;
    calHtml+=`<div class="cal-day${hasW?' has-workout':''}${isToday?' today-cal':''}" data-date="${ds}" onclick="filterHistoryByDate('${ds}')">${d}</div>`;
  }
  grid.innerHTML=calHtml;
  // Re-apply selected day highlight if still in this month
  if(selectedCalDate){
    const t=document.querySelector(`.cal-day[data-date="${selectedCalDate}"]`);
    if(t)t.classList.add('selected-day');
  }
  // History list — show selected date or month's workouts by default
  renderHistoryList(selectedCalDate);
}

let selectedCalDate=null;

function filterHistoryByDate(ds){
  // Toggle: clicking the same day again clears the filter
  if(selectedCalDate===ds){
    selectedCalDate=null;
    document.querySelectorAll('.cal-day').forEach(el=>el.classList.remove('selected-day'));
    renderHistoryList(null);
    return;
  }
  selectedCalDate=ds;
  document.querySelectorAll('.cal-day').forEach(el=>el.classList.remove('selected-day'));
  const target=document.querySelector(`.cal-day[data-date="${ds}"]`);
  if(target)target.classList.add('selected-day');
  renderHistoryList(ds);
  // Scroll to the history list
  const body=document.getElementById('history-body');
  if(body)setTimeout(()=>body.scrollIntoView({behavior:'smooth',block:'start'}),80);
}

function renderHistoryList(filterDate){
  const body=document.getElementById('history-body');
  let filtered=S.workouts;
  const detailed=!!filterDate; // show full set detail when a day is selected
  if(filterDate){filtered=S.workouts.filter(w=>isoDate(w.startTime)===filterDate);}
  else{filtered=S.workouts.filter(w=>{const d=new Date(w.startTime);return d.getFullYear()===calYear&&d.getMonth()===calMonth;});}

  let html='';

  // Add active session at top if exists
  if(S.currentSession){
    const def=allDayDefs().find(d=>d.id===S.currentSession.dayId);
    const icon=def?def.icon:'⚡';
    html+=`<div class="history-entry" style="border-color:var(--accent);background:var(--accent-dim,.1)">
      <div class="he-header">
        <div><div class="he-day" style="color:var(--accent)">${icon} ${def?def.label:'Workout'} (In Progress)</div></div>
        <div class="he-duration">${durStr(Date.now()-S.currentSession.startTime)}</div>
      </div>
    </div>`;
  }

  if(!filtered.length){
    if(!html){body.innerHTML=`<div class="empty"><div class="empty-icon">&#128203;</div><p>${filterDate?'No workout on this day.':'No workouts this month.'}</p></div>`;}
    else{body.innerHTML=html;}
    return;
  }

  if(!S.workoutCollapsedStates)S.workoutCollapsedStates={};
  html+=filtered.map((w)=>{
    const realIdx=S.workouts.indexOf(w);
    const stateKey=''+w.startTime;
    const isCollapsed=!!S.workoutCollapsedStates[stateKey];
    const def=allDayDefs().find(d=>d.id===w.dayId);const icon=def?def.icon:'⚡';
    const hasPR=w.exercises.some(ex=>ex.sets.some(s=>{const pr=S.prs[ex.name];return pr&&pr.date>=w.startTime&&pr.date<=w.endTime;}));

    // Per-exercise detail with sets when a day is selected
    const exDetail=detailed
      ? w.exercises.map(ex=>{
          const validSets=ex.sets.filter(s=>s.weight||s.reps);
          const exHasPR=ex.sets.some(s=>{const pr=S.prs[ex.name];return pr&&pr.date>=w.startTime&&pr.date<=w.endTime;});
          return`<div style="margin-bottom:10px">
            <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0 4px;border-bottom:1px solid var(--border)">
              <div style="font-size:13px;font-weight:600">${ex.name}</div>
              ${exHasPR?`<span class="pr-badge">PR</span>`:''}
            </div>
            ${validSets.length?`<div style="display:grid;grid-template-columns:28px 1fr 1fr 40px;gap:4px;padding:6px 0">
              <div style="font-size:10px;color:var(--muted);text-align:center;font-weight:700">SET</div>
              <div style="font-size:10px;color:var(--muted);text-align:center;font-weight:700">LBS</div>
              <div style="font-size:10px;color:var(--muted);text-align:center;font-weight:700">REPS</div>
              <div></div>
              ${validSets.map((s,si)=>{
                const isWu=s.warmup;
                const isPr=!isWu&&S.prs[ex.name]&&e1rm(s.weight,s.reps)>=S.prs[ex.name].e1rm;
                return`<div style="font-size:12px;color:var(--muted);text-align:center">${si+1}</div>
                  <div style="font-size:13px;font-weight:500;text-align:center${isWu?';color:var(--muted)':''}">${s.weight||'—'}</div>
                  <div style="font-size:13px;font-weight:500;text-align:center${isWu?';color:var(--muted)':''}">${s.reps||'—'}</div>
                  <div style="text-align:center">${isWu?`<span class="wu-badge">WU</span>`:isPr?`<span class="pr-badge">PR</span>`:''}</div>`;
              }).join('')}
            </div>`:'<div style="font-size:12px;color:var(--muted);padding:6px 0">No sets logged</div>'}
          </div>`;
        }).join('')
      : w.exercises.map(ex=>{const valid=ex.sets.filter(s=>s.weight||s.reps).length;return`<div class="he-exercise-row"><div>${ex.name}</div><div class="he-ex-sets">${valid} set${valid!==1?'s':''}</div></div>`;}).join('');

    const headerHtml=`<div class="history-entry${detailed?' history-entry-detailed':''}">
      <div class="he-header" onclick="toggleCollapseWorkout('${stateKey}')" style="cursor:pointer">
        <div><div class="he-day">${icon} ${w.dayLabel}</div><div class="he-date">${shortDate(w.startTime)} &middot; ${timeStr(w.startTime)}</div></div>
        <div class="he-badges">
          ${hasPR?`<span class="pr-badge">PR</span>`:''}
          <div class="he-duration">${durStr(w.duration)}</div>
          <span style="font-size:18px;margin-right:8px">${isCollapsed?'▶':'▼'}</span>
          <button class="he-del-btn" onclick="event.stopPropagation();deleteWorkout(${realIdx})">&#10005;</button>
        </div>
      </div>
      ${!isCollapsed?`<div class="he-body">${exDetail}
        ${w.calories?`<div class="he-cal-row"><div class="he-cal-label">&#128293; Est. burned</div><div class="he-cal-val">${w.calories.toLocaleString()} kcal</div></div>`:''}
      </div>`:''}</div>`;
    return headerHtml;
  }).join('');

  body.innerHTML=html;
}

function toggleCollapseWorkout(stateKey){
  if(!S.workoutCollapsedStates)S.workoutCollapsedStates={};
  S.workoutCollapsedStates[stateKey]=!S.workoutCollapsedStates[stateKey];
  saveState();renderHistory();
}

function deleteWorkout(idx){
  if(!confirm('Delete this workout?'))return;
  S.workouts.splice(idx,1);saveState();renderHistory();renderRecords();updateLogCalBanner();
}

// ══════════════════════════════════════════════
//  SETTINGS
// ══════════════════════════════════════════════
let customFormOpen=false;
function toggleCustomForm(){
  customFormOpen=!customFormOpen;
  document.getElementById('custom-ex-form').style.display=customFormOpen?'block':'none';
  document.getElementById('custom-form-toggle').textContent=customFormOpen?'−':'+';
}
function addCustomExercise(){
  const name=document.getElementById('new-ex-name').value.trim();
  const muscle=document.getElementById('new-ex-muscle').value;
  const sets=document.getElementById('new-ex-sets').value.trim()||'3-4';
  if(!name){showToast('Enter an exercise name',false);return;}
  if(allExercises().find(e=>e.name.toLowerCase()===name.toLowerCase())){showToast('Already in library',false);return;}
  S.customExercises.push({name,muscle,targetSets:sets,targetReps:'8-12',targetWeight:0});
  saveState();
  document.getElementById('new-ex-name').value='';document.getElementById('new-ex-sets').value='';
  renderCustomExList();showToast(`Added: ${name}`,false);
}
function removeCustomExercise(i){S.customExercises.splice(i,1);saveState();renderCustomExList();}
function renderCustomExList(){
  const el=document.getElementById('custom-ex-list');
  if(!S.customExercises.length){el.innerHTML='';return;}
  el.innerHTML=S.customExercises.map((ex,i)=>
    `<div class="custom-ex-item"><div><span style="font-weight:500">${ex.name}</span><span style="color:var(--muted2);margin-left:6px;font-size:12px">${ex.muscle}</span></div><button class="icon-btn del" onclick="removeCustomExercise(${i})">&#10005;</button></div>`
  ).join('');
}

function exportData(){
  const filename=`ironlog-backup-${new Date().toISOString().slice(0,10)}.json`;
  const blob=new Blob([JSON.stringify(S,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=filename;
  document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
  showToast('&#8595; Backup saved',false);
}

function importData(input){
  const file=input.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{
    try{
      const data=JSON.parse(e.target.result);
      Object.assign(S,data);
      if(!S.dayPlans)S.dayPlans=JSON.parse(JSON.stringify(DEFAULT_DAY_PLANS));
      saveState();applyTheme((S.themes&&S.themes.active)||'dark');updateThemeBadges();
      renderDayGrid();renderRecords();renderHistory();renderCustomExList();loadProfileInputs();
      showToast('&#8593; Data imported',false);
    }catch(err){showToast('Invalid backup file',false);}
  };
  reader.readAsText(file);input.value='';
}

function clearAllData(){
  if(!confirm('Clear ALL data? This cannot be undone.'))return;
  S.workouts=[];S.prs={};S.customExercises=[];S.currentSession=null;S.exerciseOverrides={};
  S.profile={age:'',sex:'',weight:'',ft:'',in:'',formula:'mifflin',bfPct:'',neck:'',waist:'',hip:''};
  S.customDays=[];
  S.dayPlans=JSON.parse(JSON.stringify(DEFAULT_DAY_PLANS));
  saveState();stopTimer();
  document.getElementById('log-active').style.display='none';
  document.getElementById('log-home').style.display='block';
  renderDayGrid();renderRecords();renderHistory();renderCustomExList();loadProfileInputs();
  showToast('Data cleared',false);
}

// ══════════════════════════════════════════════
//  NAV
// ══════════════════════════════════════════════
function switchPage(id,btn){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById(`page-${id}`).classList.add('active');
  btn.classList.add('active');
  document.getElementById('page-container').scrollTop=0;
  if(id==='records')renderRecords();
  if(id==='history')renderHistory();
  if(id==='settings'){updateThemeBadges();renderCustomExList();loadProfileInputs();}
}

// ══════════════════════════════════════════════
//  TOAST
// ══════════════════════════════════════════════
let toastTimer;
function showToast(msg,isPr){
  const t=document.getElementById('toast');
  t.innerHTML=msg;t.classList.toggle('pr',!!isPr);t.classList.add('show');
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2800);
}

// ══════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════
loadState();
applyTheme((S.themes&&S.themes.active)||'dark');
updateThemeBadges();
renderDayGrid();
if(S.currentSession){
  document.getElementById('log-home').style.display='none';
  document.getElementById('log-active').style.display='block';
  renderActiveSession();startTimer();
}
