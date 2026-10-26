const LOGO_EMBLEM="assets/img/emblem.png";
const LOGO_KAACLOGO="assets/img/kaac-logo.png";
const LOGO_DIGITAL="assets/img/digital-india.png";
const IMG_GATE="assets/img/gate.jpg";
const IMG_RENDER="assets/img/render.jpg";
const IMG_PEOPLE="assets/img/people.jpg";
const IMG_MUSEUM="assets/img/museum.jpg";
const IMG_GAMSA="assets/img/gamsa.png";
const PH_BG={recruitment:'bg-people',learn:'bg-museum',jobs:'bg-gate',courses:'bg-render',register:'bg-gate',trainer:'bg-render',track:'bg-museum',verify:'bg-gate',notices:'bg-render',about:'bg-museum',contact:'bg-gate',login:'bg-museum'};
(function(){const s=document.createElement('style');s.textContent=`.bg-gate{background-image:url(${IMG_GATE})!important}.bg-render{background-image:url(${IMG_RENDER})!important}.bg-people{background-image:url(${IMG_PEOPLE})!important}.bg-museum{background-image:url(${IMG_MUSEUM})!important}.bg-gamsa{background-image:url(${IMG_GAMSA})!important}`;document.head.appendChild(s)})();
/* ============================== Utilities ============================== */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today = () => new Date().toISOString().slice(0,10);
const nowISO = () => new Date().toISOString();
const fmtD = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—';
const fmtDT = d => d ? new Date(d).toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';
const YEAR = new Date().getFullYear();
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove('show'),3200)}
/** Age in whole years on a given date (YYYY-MM-DD). */
function ageOn(dob,on){const d=new Date(dob),n=new Date(on);let a=n.getFullYear()-d.getFullYear();if(n<new Date(n.getFullYear(),d.getMonth(),d.getDate()))a--;return a}
function age(dob){if(!dob)return 0;const d=new Date(dob),n=new Date();let a=n.getFullYear()-d.getFullYear();if(n<new Date(n.getFullYear(),d.getMonth(),d.getDate()))a--;return a}

/* Aadhaar: Verhoeff checksum (UIDAI uses this for the 12th digit) */
const VD=[[0,1,2,3,4,5,6,7,8,9],[1,2,3,4,0,6,7,8,9,5],[2,3,4,0,1,7,8,9,5,6],[3,4,0,1,2,8,9,5,6,7],[4,0,1,2,3,9,5,6,7,8],[5,9,8,7,6,0,4,3,2,1],[6,5,9,8,7,1,0,4,3,2],[7,6,5,9,8,2,1,0,4,3],[8,7,6,5,9,3,2,1,0,4],[9,8,7,6,5,4,3,2,1,0]];
const VP=[[0,1,2,3,4,5,6,7,8,9],[1,5,7,6,2,8,3,0,9,4],[5,8,0,3,7,9,6,1,4,2],[8,9,1,6,0,4,3,5,2,7],[9,4,5,3,1,2,7,6,8,0],[4,2,8,6,5,7,3,9,0,1],[2,7,9,3,8,0,6,4,1,5],[7,0,4,6,9,1,3,2,5,8]];
const VINV=[0,4,3,2,1,5,6,7,8,9];
const verhoeffOk = n => {let c=0;[...n].reverse().forEach((d,i)=>{c=VD[c][VP[i%8][+d]]});return c===0};
const validAadhaar = a => /^[2-9]\d{11}$/.test(a) && verhoeffOk(a);
function testAadhaar(){let n=String(2+Math.floor(Math.random()*8));for(let i=0;i<10;i++)n+=Math.floor(Math.random()*10);let c=0;[...n].reverse().forEach((d,i)=>{c=VD[c][VP[(i+1)%8][+d]]});return n+VINV[c]}

/* ============================== Reference data ============================== */
const ROLES = {admin:'System Administrator',dealing:'Dealing Assistant',supervising:'Supervising & Monitoring Officer',jts:'Joint Secretary',centre:'Centre Manager',training:'Training Manager'};
const QUALS = ['Class 5','Class 8','Class 10','Class 12','ITI','Diploma','Graduate','Post Graduate'];
/* Application stages: Dealing Assistant → S&M Officer → Joint Secretary → Centre Manager → Training Manager */
const STATUS = {
  submitted:['Submitted','info'], returned:['Returned for correction','warn'], rejected:['Rejected','bad'],
  verified:['Documents verified','info'], shortlisted:['Shortlisted','info'], notshortlisted:['Not shortlisted','bad'],
  approved:['Selected','ok'], notapproved:['Not selected','bad'], allocated:['Centre allotted','ok'],
  batched:['Batch allotted','ok'], training:['In training','ok'], passed:['Passed assessment','ok'],
  failed:['Not passed','bad'], certified:['Certified','ok'],
  admit:['Admit card issued','info'], selected:['Selected','ok'], notselected:['Not selected','bad']  // earlier version only
};
const CLOSED = ['rejected','notshortlisted','notapproved','notselected','certified','failed'];
/* Where each stage's applications are waiting, shown to officers and applicants. */
const STAGE_NOTE = {submitted:'With the Dealing Assistant for document verification',returned:'Waiting for you to re-upload documents',verified:'With the Supervising & Monitoring Officer for shortlisting',
  shortlisted:'With the Joint Secretary for approval',approved:'Selected. The Centre Manager will allot your training centre',allocated:'Centre allotted. Waiting for a batch',
  batched:'In a batch. Training starts on the batch start date',training:'Training in progress',passed:'Passed. Certificate to be issued'};
const SELECTED_ON = ['approved','allocated','batched','training','passed','failed','certified'];
/* Skill India Digital Hub (SIDH): the national skilling portal. Options below match what SIDH records. */
const SIDH_URL='https://www.skillindiadigital.gov.in/';
const RELIGIONS=['Hindu','Muslim','Christian','Sikh','Buddhist','Jain','Others'];
const EMPLOYMENT=['Unemployed','Student','Wage employed','Self-employed'];
const sidhLink = (text='Skill India Digital Hub') => `<a href="${SIDH_URL}" target="_blank" rel="noopener noreferrer">${text}</a>`;
const statusTag = s => `<span class="tag ${STATUS[s]?.[1]||''}">${esc(STATUS[s]?.[0]||s)}</span>`;
const DOC_TYPES = [
  {key:'photo',label:'Passport-size photograph',req:true,img:true},
  {key:'aadhaar',label:'Aadhaar card (copy)',req:true},
  {key:'edu',label:'Highest qualification certificate / marksheet',req:true},
  {key:'prc',label:'Residence proof (PRC / domicile)',req:true},
  {key:'caste',label:'Caste certificate (if applicable)',req:false},
  {key:'income',label:'Income certificate (if applicable)',req:false},
  {key:'bank',label:'Bank passbook first page',req:false},
];

/* Shown on the login page only when the server runs in development mode with demo accounts. */
const DEMO_USERS = [
  ['admin','Admin@123','admin',''],['dealing','Deal@123','dealing',''],['supervising','Super@123','supervising',''],
  ['jtsecy','Jts@123','jts',''],['centre','Centre@123','centre',''],['training','Train@123','training','']
];
/* Used until the settings arrive from the server. */
const DEFAULT_SETTINGS = {deptName:'Skill Development & Entrepreneurship Department',council:'Karbi Anglong Autonomous Council',address:'Diphu, Karbi Anglong, Assam – 782460',jtsDesignation:'Joint Secretary'};

/* ============================== Data (PHP + PostgreSQL API) ==============================
   All records live in PostgreSQL behind api.php. The server decides what each visitor may see and do;
   this page only displays what it is sent and asks the server to make changes. */
const COLLS = ['students','sectors','courses','centres','batches','users','notifs','ojt','settings','trainers','notices','extcourses','jobs','recruitments'];
const S = {}; COLLS.forEach(c => S[c] = {});
const STAFF_COLLS = ['students','trainers','batches','ojt','notifs'];
let DEMO = false, LOADED = false, LOAD_ERROR = '';
const list = c => Object.values(S[c]);
const settings = () => ({...DEFAULT_SETTINGS,...(S.settings.main||{})});
const byId = arr => Object.fromEntries((arr||[]).map(x=>[x.id,x]));

class ApiError extends Error { constructor(message,status){super(message);this.status=status} }
async function api(route,{method='GET',data,form,query}={}){
  const opt={method,credentials:'same-origin',headers:{}};
  if(method==='POST'){
    opt.headers['X-KAAC']='1';
    if(form) opt.body=form; else {opt.headers['Content-Type']='application/json';opt.body=JSON.stringify(data||{})}
  }
  let res;
  try{res=await fetch('api.php?r='+route+(query?'&'+new URLSearchParams(query):''),opt)}
  catch(e){throw new ApiError('Cannot reach the server. Check your connection and try again.',0)}
  let body=null; try{body=await res.json()}catch(e){}
  if(!res.ok){
    if(res.status===401&&(ME||STU)&&!['login','student_login','sign_ojt','change_password'].includes(route)) sessionEnded();
    throw new ApiError(body?.error||`The server could not complete the request (${res.status}).`,res.status);
  }
  return body;
}
function applyData(d){
  ['sectors','courses','centres','notices','users','recruitments',...STAFF_COLLS].forEach(c=>{if(d[c]) S[c]=byId(d[c])});
  if(d.settings) S.settings={main:d.settings};
  if(d.ext){S.extcourses=byId(d.ext.courses);S.jobs=byId(d.ext.jobs)}
}
async function loadPublic(){const d=await api('public');DEMO=!!d.demo;applyData(d)}
async function loadStaff(){const d=await api('staff_data');ME=d.me;MAXBATCH=d.maxBatchSize||45;applyData(d)}
/* The logged-in student's account and their own applications (CR-01). */
let STU=null;
async function loadStudent(){const d=await api('student_me');STU=d.me;STAFF_COLLS.forEach(c=>S[c]={});if(STU)applyData(d)}
/** Reloads what this visitor can see, then redraws (unless someone is typing). */
async function refresh(){
  try{ME?await loadStaff():STU?await loadStudent():await loadPublic()}catch(e){if(e.status!==401)toast(e.message)}
  scheduleRefresh();
}
/** Sends a staff or applicant action to the server. Returns the response, or null after showing the error. */
async function act(route,data,okMsg,form){
  try{const r=await api(route,{method:'POST',data,form});if(okMsg)toast(okMsg);if(ME||STU)await refresh();return r||{}}
  catch(e){toast(e.message);return null}
}
function sessionEnded(){
  const wasStudent=!!STU; ME=null; STU=null; STAFF_COLLS.forEach(c=>S[c]={});
  closeModal(); toast('Your session has ended. Please log in again.');
  loadPublic().catch(()=>{}).finally(()=>{route==='staff'?go('login'):['apply'].includes(route)||wasStudent?go('student'):render()});
}
let MAXBATCH=45;
setInterval(()=>{if((ME||STU)&&!document.hidden)refresh()},30000);
document.addEventListener('visibilitychange',()=>{if((ME||STU)&&!document.hidden)refresh()});
const docUrl = (id,download) => 'api.php?r=doc&id='+encodeURIComponent(id)+(download?'&download=1':'');

/* Refresh on data change, but never while someone is typing */
let refreshTimer=null, pendingRefresh=false;
function scheduleRefresh(){clearTimeout(refreshTimer);refreshTimer=setTimeout(()=>{
  const a=document.activeElement;
  if(FORM_ROUTES.includes(route) || $('#modal').classList.contains('open') || (a && $('#main').contains(a) && a.matches('input,textarea,select'))){pendingRefresh=true;return}
  render();
},120)}
document.addEventListener('focusout',()=>{if(pendingRefresh && !FORM_ROUTES.includes(route) && !$('#modal').classList.contains('open')){pendingRefresh=false;setTimeout(render,50)}});

/* ============================== Session & routing ============================== */
let route='home', staffView='dash', ME=null;
const FORM_ROUTES=['apply','trainer'];
let routeArg='';
/* Navigates to a route. Setting the hash it already has fires no hashchange, so redraw directly in that case. */
function go(r){if(location.hash==='#'+r)readHash();else location.hash=r}
function readHash(){const h=(location.hash||'#home').slice(1);const [r,arg]=h.split('/');route=['home','about','courses','learn','jobs','student','apply','reset','recruitment','trainer','track','verify','notices','contact','login','staff'].includes(r)?r:'home';
  routeArg=decodeURIComponent(arg||'');
  if(route==='apply'&&!STU){applyFor=routeArg;route='student'}
  if(route==='verify'&&arg&&decodeURIComponent(arg)!==verifyQ){verifyQ=decodeURIComponent(arg);runVerify()}
  if(route!=='track'){trackFound=null;trackPrefill=''}  // don't leave someone's details on a shared computer
  if(route==='staff'&&!ME)route='login';render();window.scrollTo(0,0)}
window.addEventListener('hashchange',readHash);
const can = (...roles) => ME && (ME.role==='admin' || roles.includes(ME.role));
const courseName = id => S.courses[id]?.name || id || '—';
const centreName = id => S.centres[id]?.name || id || '—';
const sectorName = id => S.sectors[id]?.name || id || '—';

/* ============================== Render ============================== */
function render(){
  renderChrome();
  $$('#pubnav a').forEach(a=>a.toggleAttribute('aria-current',a.getAttribute('href')==='#'+route||(route==='staff'&&a.id==='staffLink')));
  if(route==='staff'||route==='login') $('#pubnav a[aria-current]')?.setAttribute('aria-current','page');
  $$('#pubnav a[aria-current]').forEach(a=>a.setAttribute('aria-current','page'));
  $('#staffLink').textContent = ME ? 'Staff area' : 'Staff login';
  $('#staffLink').setAttribute('href', ME ? '#staff' : '#login');
  $('#studentLink').textContent = STU ? 'My applications' : 'Apply online';
  $('#studentLink').toggleAttribute('aria-current', ['student','apply','reset'].includes(route));
  $('#pubnav a[href="#recruitment"]').toggleAttribute('aria-current', ['recruitment','trainer'].includes(route));
  renderTicker();
  const m=$('#main');
  if(!LOADED){m.innerHTML=LOAD_ERROR?`<div class="panel" style="margin:40px auto;max-width:560px"><h2>The portal is not available</h2><p>${esc(LOAD_ERROR)}</p><button class="btn primary" onclick="init()">Try again</button></div>`:'<p class="muted" style="padding:60px 0;text-align:center">Loading…</p>';return}
  m.innerHTML = ({learn:vLearn,jobs:vJobs,about:vAbout,notices:vNotices,contact:vContact,trainer:vTrainerReg,home:vHome,courses:vCourses,student:vStudent,apply:vApply,reset:vReset,track:vTrack,verify:vVerify,login:vLogin,staff:vStaff,recruitment:vRecruitment}[route]||vHome)();
  if(route==='apply') wireApply();
  if(route==='trainer') wireTrainer();
}

/* ---------- Public website: chrome, home, about, notices, contact ---------- */
const NOTICE_CATS=['Notification','Admission','Result','Advertisement','Office order','Circular','Tender'];
const ICONS={
  userplus:'<circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-7 7-7s7 3 7 7"/><path d="M19 8v6M16 11h6"/>',
  trainer:'<rect x="3" y="4" width="18" height="12" rx="1"/><path d="M12 16v4M8 21h8M7 9h6M7 12h10"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  badge:'<circle cx="12" cy="9" r="6"/><path d="m9 14-2 7 5-3 5 3-2-7"/>',
  book:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M8 7h7"/>',
  lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/>',
  pin:'<path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>'
};
const ic = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k]}</svg>`;
const pageHead = (t,sub) => `<div class="pagehead ph ${PH_BG[route]||'bg-render'}"><div class="crumb"><a href="#home">Home</a> › ${esc(t)}</div><h1>${esc(t)}</h1>${sub?`<p class="muted" style="margin:6px 0 0">${esc(sub)}</p>`:''}</div>`;
function latestNotices(n){
  const ns=list('notices').filter(x=>x.active!==false).sort((a,b)=>(b.date||'').localeCompare(a.date||'')||(b.createdAt||'').localeCompare(a.createdAt||''));
  const out=ns.length?ns:(settings().notices||'').split('\n').filter(Boolean).map(t=>({id:'',title:t,category:'Notification',date:'',body:''}));
  return n?out.slice(0,n):out;
}
const isNew = d => d && (Date.now()-new Date(d)) < 7*864e5;

/* Header and footer are refreshed on every render */
function renderChrome(){
  const st=settings(); const logo=`<img src="${esc(st.logo||LOGO_KAACLOGO)}" alt="${esc(st.council)} logo">`;
  document.body.classList.toggle('is-home',route==='home');
  if(!$('#embImg').getAttribute('src')){$('#embImg').src=LOGO_EMBLEM;$('#diImg').src=LOGO_DIGITAL}
  $('#logoSlot').innerHTML=logo;
  $('#brandName').textContent=st.deptName; $('#brandSub').textContent=st.council;
  document.querySelector('.lt-navrow').classList.remove('open'); document.querySelector('.hamb').setAttribute('aria-expanded','false');
  const last=[...list('notices').map(n=>n.updatedAt||n.createdAt),...list('courses').map(c=>c.updatedAt)].filter(Boolean).sort().pop();
  const ext=(u,t)=>`<a href="${u}" target="_blank" rel="noopener">${t}</a>`;
  $('#siteFoot').innerHTML=`<div class="weave thin"></div><div class="ft-grid">
    <div><div class="ft-brand"><span class="logo-slot">${logo}</span><b class="h" style="margin:0">${esc(st.deptName)}</b></div>
      <p>${esc(st.council)}<br>${esc(st.address)}</p><p>${st.phone?'Helpline: '+esc(st.phone)+'<br>':''}${st.email?'Email: '+esc(st.email)+'<br>':''}${esc(st.officeHours||'')}</p></div>
    <div><b class="h">Quick links</b><a href="#home">Home</a><a href="#about">About us</a><a href="#courses">Courses</a><a href="#learn">Online learning</a><a href="#jobs">Jobs</a><a href="#notices">Notices</a><a href="#contact">Contact us</a></div>
    <div><b class="h">Services</b><a href="#student">Apply online (students)</a><a href="#recruitment">Recruitment (trainers)</a><a href="#track">Track status</a><a href="#verify">Verify certificate</a><a href="#login">Staff login</a></div>
    <div><b class="h">Important links</b>${ext('https://karbianglong.co.in/','KAAC official website')}${ext('https://artpskaac.in/stipend/','Stipend for ST(H) students')}${ext('https://karbiyouthfestival.com/','Karbi Youth Festival')}${ext('https://assam.gov.in/','Assam State Portal')}${ext('https://www.skillindiadigital.gov.in/','Skill India Digital Hub')}${ext('https://www.india.gov.in/','National Portal of India')}</div>
  </div>
  <div class="ft-bottom"><span>© ${YEAR} ${esc(st.deptName)}, ${esc(st.council)} · Last updated ${fmtD(last||nowISO())}${DEMO?' · <span id="modeNote">Development mode: demo accounts are enabled.</span>':''}</span>
    <span class="gf-tools" role="group" aria-label="Display options"><button onclick="setFs(-1)" aria-label="Smaller text">A-</button><button onclick="setFs(0)" aria-label="Normal text size">A</button><button onclick="setFs(1)" aria-label="Larger text">A+</button><button onclick="toggleTheme()" aria-label="Switch light or dark theme">◐</button></span></div>`;
}
let fsLevel=0;
function setFs(d){fsLevel=d===0?0:Math.max(-1,Math.min(2,fsLevel+d));$('#main').style.zoom=[0.9,1,1.12,1.25][fsLevel+1]}
function toggleTheme(){const r=document.documentElement;const cur=r.dataset.theme||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');r.dataset.theme=cur==='dark'?'light':'dark';try{localStorage.setItem('kaac-theme',r.dataset.theme)}catch(e){}}
try{const t=localStorage.getItem('kaac-theme');if(t)document.documentElement.dataset.theme=t}catch(e){}

/* Home: rich, search-first page */
Object.assign(ICONS,{
  monitor:'<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  cup:'<path d="M4 8h13v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6z"/><path d="M17 10h2a2 2 0 0 1 0 4h-2M8 2v3M12 2v3"/>',
  mountain:'<path d="m3 20 6-10 4 6 3-4 5 8z"/><circle cx="17" cy="6" r="2"/>',
  heart:'<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/><path d="M12 10v4M10 12h4"/>',
  hammer:'<path d="m13 3 8 8-3 3-8-8z"/><path d="m12 9-8 8 3 3 8-8"/>',
  bolt:'<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  wheel:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2"/><path d="M12 4v6M12 14v6M4 12h6M14 12h6"/>',
  leaf:'<path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15"/><path d="M5 19 14 10"/>',
  needle:'<path d="M4 20 18 6"/><circle cx="19" cy="5" r="1.5"/><path d="M6 14c3 0 4 4 7 4s3-3 6-3"/>',
  sparkle:'<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14c3 0 5.5 2 5.5 5"/>',
  building:'<path d="M4 21V5l8-3 8 3v16"/><path d="M9 21v-5h6v5M8 8h2M14 8h2M8 12h2M14 12h2"/>',
  home:'<path d="m3 11 9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>',
  map:'<path d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
  arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>'
});
const SECT_ICON={IT:'monitor',HOS:'cup',TOU:'mountain',HLT:'heart',CON:'hammer',ELE:'bolt',AUT:'wheel',AGR:'leaf',APP:'needle',BWS:'sparkle'};
const SECT_COL=['#0b6e4f','#2563eb','#d97706','#dc2626','#7c3aed','#0891b2','#475569','#65a30d','#be185d','#c026d3'];
const HILLS=`<svg class="hills" viewBox="0 0 1440 220" preserveAspectRatio="none" aria-hidden="true">
  <path style="fill:var(--h1)" d="M0 120C160 60 300 80 420 110c140 35 230-40 380-50 160-10 260 60 400 40 120-15 190-40 240-30v160H0Z"/>
  <path style="fill:var(--h2)" d="M0 160c140-40 260-30 380-10 140 25 260-30 400-35 150-5 260 50 400 35 120-12 200-30 260-25v95H0Z"/>
  <path style="fill:var(--h3)" d="M0 192c180-25 320-15 470-2 150 12 290-18 430-16 160 3 280 26 420 18 60-4 100-8 120-7v35H0Z"/>
  <path style="fill:var(--paper)" d="M0 214c240-10 480-10 720-4s480 6 720-2v12H0Z"/></svg>`;
let slideIdx=0, carPause=false, trackPrefill='';
function showSlide(i){const sl=$$('.slide');if(!sl.length)return;slideIdx=(i+sl.length)%sl.length;
  sl.forEach((s,k)=>{const on=k===slideIdx;s.classList.toggle('on',on);s.toggleAttribute('inert',!on);on?s.removeAttribute('aria-hidden'):s.setAttribute('aria-hidden','true')});
  $$('.dots button').forEach((b,k)=>b.setAttribute('aria-current',k===slideIdx))}
setInterval(()=>{if(route==='home'&&!carPause&&!document.hidden&&!matchMedia('(prefers-reduced-motion: reduce)').matches)showSlide(slideIdx+1)},7000);
function homeSearch(e){
  e.preventDefault(); const q=$('#gq').value.trim(), u=q.toUpperCase();
  if(!q){go('courses');return}
  if(u.includes('CERT')){go('verify/'+encodeURIComponent(u));return}
  if(/^KAAC-SDE-/.test(u)){trackPrefill=u;go('track');return}
  courseQ=q; courseSector='all'; go('courses');
}
function gSuggest(v){
  const box=$('#gsug'); if(!box) return; v=v.trim(); const lv=v.toLowerCase();
  if(!v){box.hidden=true;box.innerHTML='';return}
  const rows=[];
  // The typed text goes in a data attribute, never into the onclick code itself.
  if(/^kaac/i.test(v)) rows.push(`<button type="button" onmousedown="event.preventDefault()" data-v="${esc(v.toUpperCase())}" onclick="${/cert/i.test(v)?`go('verify/'+encodeURIComponent(this.dataset.v))`:`trackPrefill=this.dataset.v;go('track')`}">${ic('search')}<span>${/cert/i.test(v)?'Verify certificate':'Track application'} ${esc(v.toUpperCase())}</span></button>`);
  list('courses').filter(c=>c.active&&(c.name+' '+c.id+' '+sectorName(c.sectorId)).toLowerCase().includes(lv)).slice(0,6)
    .forEach(c=>rows.push(`<button type="button" onmousedown="event.preventDefault()" onclick="courseQ='${c.id}';courseSector='all';go('courses')">${ic('search')}<span>${esc(c.name)}</span><small>${esc(sectorName(c.sectorId))}</small></button>`));
  box.innerHTML=rows.join(''); box.hidden=!rows.length;
}
function vHome(){
  const st=settings(), courses=list('courses').filter(c=>c.active), sectors=list('sectors'), centres=list('centres').filter(c=>c.active);
  const ns=latestNotices(4); const top=ns[0]; const logo=st.logo?`<img src="${esc(st.logo)}" alt="">`:'KAAC';
  const openRec=openRecruitments()[0];
  const slides=[
    {t:'t1',bg:'bg-render',alt:'Karbi-style ceremonial gateway',icon:'userplus',h:`Registration open for the ${YEAR} session`,p:`Free training in ${courses.length} courses across ${sectors.length} sectors for the youth of Karbi Anglong and West Karbi Anglong.`,a:['#student','Apply now']},
    {t:'t2',bg:'bg-museum',alt:'Nothengpi Karbi Heritage Museum lit at night',icon:'book',h:'Stipend for ST (Hills) students',p:'The council gives stipends to ST (Hills) students pursuing professional courses. Applications are made on the council’s stipend portal.',a:['https://artpskaac.in/stipend/','Visit the stipend portal',1]},
    {t:'t3',bg:'bg-people',alt:'Young people of Karbi Anglong in traditional attire',icon:'sparkle',h:'Karbi Youth Festival',p:'The council’s annual festival celebrating Karbi music, dance and culture, with young people from across the region.',a:['https://karbiyouthfestival.com/','Visit the festival website',1]},
    {t:'t4',icon:'trainer',h:openRec?openRec.title:'Trainers and subject experts wanted',p:openRec?`${openRec.engagement||'Apply online'}. Last date ${fmtD(openRec.lastDate)}.`:'Watch this space for the department’s next trainer recruitment.',a:['#recruitment',openRec?'See the advertisement and apply':'See recruitment']}
  ];
  const fc0=extCourses().find(c=>c.featured), fj0=jobList().find(j=>j.featured);
  if(fj0) slides.splice(1,0,{t:'t2',icon:'building',h:`Now hiring: ${fj0.title}`,p:`${fj0.employer}, ${fj0.location} · ${fj0.pay}. See this and more openings on our Jobs page.`,a:['#jobs','See job openings']});
  if(fc0) slides.splice(1,0,{t:'t1',icon:'book',h:`Learn online: ${fc0.title}`,p:`${fc0.by}. ${fc0.duration}. ${fc0.cost}.`,a:[fc0.url,'Go to course',1]});
  slideIdx%=slides.length;
  const steps=[['Apply online','Create an account, choose a trade, upload documents'],['Verification','Documents checked by the Dealing Assistant'],['Shortlist and approval','Shortlisted, then approved by the Joint Secretary'],['Centre and batch','Selected candidates get a centre and a batch'],['Certificate','Issued after you pass the assessment'],['On-the-job training','Recommendation letter for employers']];
  return `
  <section class="hero2 herophoto bg-gate">
    <div class="hero2-in">
      <span class="pill">${ic('badge')} Free training · ${YEAR} session open</span>
      <h1 class="g-title">Skill Development &amp; Entrepreneurship</h1>
      <p class="g-sub">${esc(st.council)} · Diphu, Assam</p>
      <form class="g-search" role="search" onsubmit="homeSearch(event)">
        <div class="g-box">${ic('search')}<input id="gq" type="search" autocomplete="off" aria-label="Search courses, or enter an application or certificate number" placeholder="Search courses or application ID" oninput="gSuggest(this.value)" onkeydown="if(event.key==='Escape')gSuggest('')" onblur="setTimeout(()=>gSuggest(''),150)"><button class="g-go" type="submit" aria-label="Search">${ic('arrow')}</button></div>
        <div class="g-sug" id="gsug" role="listbox" hidden></div>
      </form>
      ${top?`<p class="g-news"><span class="newtag" style="margin:0 8px 0 0">Latest</span>${top.id?`<a href="#notices" onclick="event.preventDefault();openNotice('${top.id}')">${esc(top.title)}</a>`:esc(top.title)}</p>`:''}
    </div>
    ${HILLS}
  </section>
  <div class="tiles">
    ${[['#student','userplus','Apply for a course','Create an account and apply online','#0b6e4f'],['#recruitment','trainer','Recruitment','Trainers wanted: apply online','#2563eb'],['#track','search','Track status','Follow your application','#d97706'],['#verify','badge','Verify certificate','For employers','#be185d']]
      .map(([h,i,t,d,c])=>`<a class="tile" href="${h}" style="--c:${c}"><span class="ti">${ic(i)}</span><b>${t}</b><span class="d">${d}</span></a>`).join('')}
  </div>

  ${(()=>{const fc=extCourses().filter(c=>c.featured).slice(0,3), fj=jobList().filter(j=>j.featured).slice(0,3); if(!fc.length&&!fj.length) return '';
    return `<section class="lt-sec feat"><div class="sh"><h2><span class="star" aria-hidden="true">★</span> Featured opportunities</h2><span class="small muted">Picked by the department for citizens of Karbi Anglong</span></div>
    <div class="fgrid">${fc.map(c=>`<a class="fcard course" href="${esc(c.url)}" target="_blank" rel="noopener noreferrer"><span class="ribbon">Featured course</span><span class="fkind">${ic('book')} ${esc(c.provider)} · ${esc(c.topic)}</span><b>${esc(c.title)}</b><span class="fmeta">${esc(c.duration)}</span><span class="fcost">${esc(c.cost)}</span><span class="fgo">Go to course ${ic('ext')}</span></a>`).join('')}${fj.map(j=>`<a class="fcard job" href="${esc(j.url)}" target="_blank" rel="noopener noreferrer"><span class="ribbon">Featured job</span><span class="fkind">${ic('building')} ${esc(j.employer)}</span><b>${esc(j.title)}</b><span class="fmeta">${esc(j.location)}${j.posted?' · Posted '+esc(j.posted):''}</span><span class="fcost">${esc(j.pay)}</span><span class="fgo">View on ${esc(j.source)} ${ic('ext')}</span></a>`).join('')}</div>
    <div class="row" style="margin-top:16px"><a class="btn" href="#learn">All online courses</a><a class="btn" href="#jobs">All job openings</a></div></section>`})()}

  <section class="lt-sec">
    <div class="carousel" aria-roledescription="carousel" aria-label="Announcements" onmouseenter="carPause=true" onmouseleave="carPause=false" onfocusin="carPause=true" onfocusout="carPause=false">
      ${slides.map((s,i)=>`<div class="slide ${s.t} ${i===slideIdx?'on':''}" role="group" aria-roledescription="slide" aria-label="${i+1} of ${slides.length}" ${i===slideIdx?'':'inert aria-hidden="true"'}>
        <div class="txt"><h2>${esc(s.h)}</h2><p>${esc(s.p)}</p><a class="btn primary" href="${s.a[0]}" ${s.a[2]?'target="_blank" rel="noopener"':''}>${s.a[1]}</a></div>
        ${s.bg?`<div class="art ph ${s.bg}" role="img" aria-label="${esc(s.alt)}"></div>`:`<div class="art"><span class="glass">${ic(s.icon)}</span></div>`}</div>`).join('')}
      <button class="cbtn prev" aria-label="Previous slide" onclick="showSlide(slideIdx-1)">❮</button><button class="cbtn next" aria-label="Next slide" onclick="showSlide(slideIdx+1)">❯</button>
      <div class="dots">${slides.map((_,i)=>`<button aria-label="Show slide ${i+1}" aria-current="${i===slideIdx}" onclick="showSlide(${i})"></button>`).join('')}</div>
    </div>
  </section>

  <section class="lt-sec"><div class="gamsa-deco r bg-gamsa" aria-hidden="true"></div>
    <div class="sh"><h2>Explore courses by sector</h2><a href="#courses">View all ${courses.length} courses ${ic('arrow')}</a></div>
    <div class="sectors">${sectors.map((s,i)=>`<button class="sect" style="--c:${SECT_COL[i%SECT_COL.length]}" onclick="courseSector='${s.id}';go('courses')"><span class="ti">${ic(SECT_ICON[s.id]||'book')}</span><b>${esc(s.name)}</b><small>${courses.filter(c=>c.sectorId===s.id).length} courses</small></button>`).join('')}</div>
  </section>

  <section class="lt-sec"><div class="culture"><div class="culture-img bg-people" role="img" aria-label="Young people of Karbi Anglong in traditional Karbi attire"></div>
    <div class="culture-txt"><div><h2>Skills rooted in Karbi heritage</h2><p>From traditional handloom weaving and organic ginger farming to guiding visitors through the hills, our courses build on the craft, culture and landscape of Karbi Anglong, alongside modern trades in IT, healthcare and construction.</p></div>
    <div class="row"><button class="btn primary" onclick="courseSector='APP';go('courses')">Handloom courses</button><button class="btn" onclick="courseSector='TOU';go('courses')">Tourism courses</button></div></div></div></section>

  <section class="lt-sec"><div class="gamsa-deco l bg-gamsa" aria-hidden="true"></div><div class="g2c">
    <div><div class="photo-card bg-museum" role="img" aria-label="Nothengpi Karbi Heritage Museum lit at night"><span class="cap">Nothengpi Karbi Heritage Museum</span></div><h2>Karbi Anglong at a glance</h2>
      <p>The Karbi Anglong Autonomous Council is a self-governing body set up under the Sixth Schedule of the Constitution of India. From its headquarters in Diphu it administers Karbi Anglong and West Karbi Anglong, with powers over land, agriculture, forests, health, education and local infrastructure.</p>
      <p>Alongside development work, the council works to preserve the language and traditions of the Karbi people, celebrated in festivals such as Rongker and Chomangkan.</p>
      <p class="src">Source: <a href="https://karbianglong.co.in/" target="_blank" rel="noopener">karbianglong.co.in</a></p></div>
    <div class="gstats">${[['users','1.1M+','Population','#0b6e4f'],['building','35+','Council departments','#2563eb'],['home','2,000+','Villages','#d97706'],['map','10,000+ km²','Geographical area','#be185d']].map(([i,n,l,c])=>`<div style="--c:${c}"><span class="ti">${ic(i)}</span><b>${n}</b><small>${l}</small></div>`).join('')}</div>
  </div></section>

  <section class="lt-sec"><div class="howband"><h2>How it works</h2>
    <div class="hsteps">${steps.map(([t,d])=>`<div><b>${t}</b><span>${d}</span></div>`).join('')}</div></div></section>

  <section class="lt-sec lt-cols">
    <div class="card"><div class="sh"><h2>Learn AI and data science online</h2><a href="#learn">All courses ${ic('arrow')}</a></div><div class="lt-list">${extCourses().slice(0,4).map(c=>`<a href="${esc(c.url)}" target="_blank" rel="noopener noreferrer"><span class="t">${esc(c.title)}</span><small>${esc(c.provider)} · ${esc(c.cost)}</small></a>`).join('')}</div></div>
    <div class="card"><div class="sh"><h2>Recent job openings</h2><a href="#jobs">All jobs ${ic('arrow')}</a></div><div class="lt-list">${jobList().slice(0,4).map(j=>`<a href="#jobs"><span class="t">${esc(j.title)}</span><small>${esc(j.employer)} · ${esc(j.location)} · ${esc(j.pay)}</small></a>`).join('')}</div></div>
  </section>

  <section class="lt-sec lt-cols">
    <div class="card"><h2>Latest updates</h2><div class="lt-list">${ns.map(n=>`<a href="#notices" ${n.id?`onclick="event.preventDefault();openNotice('${n.id}')"`:''}><span class="t">${esc(n.title)}</span>${isNew(n.date)?'<span class="newtag">New</span>':''}<small>${esc(n.category)}${n.date?' · '+fmtD(n.date):''}</small></a>`).join('')||'<p class="muted">No updates yet.</p>'}
      <a href="#notices"><span class="t">All notices</span></a></div></div>
    <div class="card"><h2>The department</h2><div class="lt-list">
      <a href="#courses"><span class="t">${courses.length} courses in ${sectors.length} sectors</span><small>All free, with certificates employers can verify</small></a>
      <a href="#contact"><span class="t">${centres.length} training centres</span><small>Across Karbi Anglong and West Karbi Anglong</small></a>
      <a href="#about"><span class="t">About the department</span><small>What we do and who’s who</small></a>
      <a href="https://karbianglong.co.in/" target="_blank" rel="noopener"><span class="t">Karbi Anglong Autonomous Council</span><small>Official website of the council</small></a></div></div>
  </section>

  <section class="lt-sec"><div class="ctaband ph bg-render"><div><h2>Ready to learn a new skill?</h2><p>Keep your Aadhaar number and scanned documents ready, then apply online.</p></div>
    <div class="row"><a class="btn primary lg" href="#student">Apply now</a><a class="btn lg" href="#courses">Browse courses</a></div></div></section>`;
}

/* ---------- Online learning & jobs ---------- */
Object.assign(ICONS,{ext:'<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'});
const SNAP_DATE='2026-10-26';
const DEF_EXT=[
  {id:'cr-genai',featured:true,provider:'Coursera',topic:'Artificial intelligence',title:'Generative AI for Everyone',by:'DeepLearning.AI · taught by Andrew Ng',level:'Beginner, no coding needed',duration:'About 5 hours (3 weeks at 1–2 hours a week)',cost:'Free to audit; paid certificate',
   points:['How generative AI works, and what it can and cannot do','Everyday uses of chatbots and other AI tools at work','How to plan and scope a generative AI project','Effects on business, jobs and society'],url:'https://www.coursera.org/learn/generative-ai-for-everyone'},
  {id:'cr-ml',provider:'Coursera',topic:'Machine learning',title:'Machine Learning Specialization',by:'DeepLearning.AI & Stanford Online · taught by Andrew Ng',level:'Beginner (basic coding and school maths)',duration:'About 2 months at 10 hours a week (3 courses)',cost:'Free to audit; paid certificate',
   points:['Supervised learning: regression and classification','Neural networks and decision trees','Clustering, recommender systems and reinforcement learning basics','Hands-on Python with NumPy and scikit-learn'],url:'https://www.coursera.org/specializations/machine-learning-introduction'},
  {id:'cr-gda',provider:'Coursera',topic:'Data science',title:'Google Data Analytics Professional Certificate',by:'Google Career Certificates',level:'Beginner, no degree or experience required',duration:'About 6 months at 10 hours a week',cost:'Paid subscription; financial aid available',
   points:['Day-to-day work of a junior data analyst','Cleaning, analysing and visualising data','Spreadsheets, SQL, Tableau and programming for analysis','A case study for your portfolio'],url:'https://www.coursera.org/professional-certificates/google-data-analytics'},
  {id:'cr-ibmds',provider:'Coursera',topic:'Data science',title:'IBM Data Science Professional Certificate',by:'IBM Skills Network',level:'Beginner',duration:'Self-paced; about 5 months at a steady pace',cost:'Paid subscription; courses can be audited free',
   points:['What data scientists do and the data science method','Python and SQL for data work','Data analysis, visualisation and machine learning basics','Hands-on labs and a capstone project'],url:'https://www.coursera.org/professional-certificates/ibm-data-science'},
  {id:'np-ml',provider:'NPTEL / SWAYAM',topic:'Machine learning',title:'Introduction to Machine Learning',by:'IIT Madras · Prof. Balaraman Ravindran',level:'Undergraduate level; maths helps',duration:'8 or 12 weeks, offered each semester',cost:'Free to learn; fee only for the optional certificate exam',
   points:['Mathematical foundations of machine learning','Regression, classification and neural networks','Clustering and learning theory','A Government of India (Ministry of Education) initiative'],url:'https://nptel.ac.in/courses/106106139'},
  {id:'ug-dsgen',provider:'upGrad',topic:'Data science',title:'Professional Certificate Programme in Data Science with Generative AI',by:'IIIT Bangalore with upGrad',level:'Beginners and working professionals; no coding background needed',duration:'6 months, online',cost:'Paid; check current fees on the website',
   points:['Statistics, linear algebra and calculus for data science','Python programming for data analysis','Machine learning foundations','Generative AI tools and applications'],url:'https://www.upgrad.com/data-science-and-generative-ai-certification-iiitb/'},
  {id:'ug-mlai',provider:'upGrad',topic:'Artificial intelligence',title:'Executive Diploma in Machine Learning & AI',by:'IIIT Bangalore with upGrad',level:'Working professionals; not a first course',duration:'12 months, live and recorded lectures',cost:'Paid; check current fees on the website',
   points:['Machine learning, deep learning and NLP','MLOps and generative AI specialisations','Dozens of real-world case studies and projects','IIIT Bangalore executive alumni status'],url:'https://www.upgrad.com/executive-post-graduate-program-in-machine-learning-iiitb/'},
  {id:'ug-free',provider:'upGrad',topic:'Data science',title:'Free Data Science Courses',by:'upGrad',level:'Beginner',duration:'Short, self-paced courses',cost:'Free, with certificate',
   points:['Python, NumPy and pandas basics','Data analysis and visualisation','Introductory AI and machine learning topics','A low-risk way to try data science'],url:'https://www.upgrad.com/free-courses/data-science/'},
  {id:'sidh-ai',featured:true,provider:'Skill India',topic:'Artificial intelligence',title:'Skill India Digital Hub: AI and digital skills',by:'Government of India, Ministry of Skill Development & Entrepreneurship',level:'All levels',duration:'Self-paced',cost:'Free',
   points:['AI fundamentals and digital skills','Courses in several Indian languages','Government-recognised certificates on completion','Also lists apprenticeships and jobs'],url:'https://www.skillindiadigital.gov.in/'}
];
const PORTALS=[
  {name:'Naukri.com',tag:'Private jobs',desc:'India’s largest job site, with filters for city, experience and salary.',url:'https://www.naukri.com/'},
  {name:'National Career Service',tag:'Government',desc:'Government of India job portal with job fairs and career counselling.',url:'https://www.ncs.gov.in/'},
  {name:'Indeed India',tag:'Private jobs',desc:'Searches company sites and job boards, including many Assam listings.',url:'https://in.indeed.com/'},
  {name:'LinkedIn Jobs',tag:'Professional',desc:'Office, IT and professional roles, plus a profile employers can find.',url:'https://www.linkedin.com/jobs/'},
  {name:'WorkIndia',tag:'Entry level',desc:'Jobs for freshers and 10th or 12th pass candidates, by locality.',url:'https://www.workindia.in/'},
  {name:'apna',tag:'Entry level',desc:'App-based search for local and entry-level work.',url:'https://apna.co/'},
  {name:'Skill India Digital Hub',tag:'Government',desc:'Apprenticeships and jobs linked to skill certificates.',url:'https://www.skillindiadigital.gov.in/'},
  {name:'OLX Jobs, Diphu',tag:'Local',desc:'Local job ads around Diphu and Bokajan.',url:'https://www.olx.in/diphu_g4058602/jobs_c4'}
];
const DEF_JOBS=[
  {id:'j1',featured:true,title:'Executive Assistant',employer:'A Raja Group of Companies',location:'Six Mile, Guwahati',pay:'₹20,000–30,000 a month',req:'12th pass; freshers welcome',posted:'13 Oct 2026',source:'WorkIndia',url:'https://www.workindia.in/jobs-in-satgaon-guwahati/',course:'SKL-IT-01'},
  {id:'j2',featured:true,title:'Data Entry Associate',employer:'North East Steels and Infra Pvt Ltd',location:'Guwahati',pay:'₹20,000–25,000 a month',req:'Typing, data entry and database skills',posted:'',source:'SimplyHired',url:'https://simplyhired.co.in/search?l=assam&q=naukri',course:'SKL-IT-01'},
  {id:'j3',title:'Data Entry Operator',employer:'M/S Agni Services',location:'Guwahati',pay:'₹15,000–20,000 a month',req:'MS Word and Excel',posted:'',source:'SimplyHired',url:'https://simplyhired.co.in/search?l=assam&q=naukri',course:'SKL-IT-01'},
  {id:'j4',title:'Executive – Accounts',employer:'Komarla Hatcheries',location:'Guwahati',pay:'₹30,000–40,000 a month',req:'B.Com, M.Com or MBA (Finance); 1–3 years; Tally and Excel',posted:'',source:'Indeed',url:'https://in.indeed.com/q-naukri-com-l-guwahati,-assam-jobs.html',course:''},
  {id:'j5',title:'Junior Accountant',employer:'Shivaay Infratech LLP',location:'Guwahati',pay:'₹20,000–33,000 a month',req:'Bachelor’s degree; Excel and accounting',posted:'',source:'SimplyHired',url:'https://www.simplyhired.co.in/search?q=naukri+com&l=guwahati,+assam',course:''},
  {id:'j6',title:'Field Sales Officer',employer:'Winners Man Power',location:'GS Road, Guwahati',pay:'₹19,856–41,455 a month',req:'12th pass; freshers welcome',posted:'Oct 2026',source:'WorkIndia',url:'https://www.workindia.in/jobs-in-gs-road-guwahati/',course:''},
  {id:'j7',title:'Housekeeping staff',employer:'The Dream Hotel & Restaurant',location:'Hatigaon, Guwahati',pay:'₹8,000–15,000 a month',req:'10th pass; 1–2 years’ experience',posted:'9 Oct 2026',source:'WorkIndia',url:'https://www.workindia.in/jobs-in-hatigaon-guwahati/',course:'SKL-HOS-01'},
  {id:'j8',title:'Restaurant Manager',employer:'Flavour Fusion',location:'Jalukbari, Guwahati',pay:'₹12,000–14,000 a month',req:'12th pass; 2+ years’ experience',posted:'29 Sep 2026',source:'WorkIndia',url:'https://www.workindia.in/jobs-in-jalukbari-guwahati/',course:'SKL-HOS-02'},
  {id:'j9',title:'Civil Project Manager',employer:'Shivji Singla and Sons',location:'VIP Road, Guwahati',pay:'₹45,000–55,000 a month',req:'Graduate; 2+ years’ experience',posted:'13 Oct 2026',source:'WorkIndia',url:'https://www.workindia.in/jobs-in-satgaon-guwahati/',course:''},
  {id:'j10',title:'Branch Executive',employer:'NSKF India Pvt Ltd',location:'North Lakhimpur',pay:'₹15,000–25,000 a month',req:'Customer service and business development',posted:'',source:'SimplyHired',url:'https://simplyhired.co.in/search?l=assam&q=naukri',course:''}
];
function effList(defs,coll){
  const db=S[coll]||{}; const out=defs.map(d=>db[d.id]?{...d,...db[d.id]}:d);
  Object.values(db).forEach(r=>{if(!defs.some(d=>d.id===r.id))out.push(r)});
  return out.filter(r=>!r.hidden);
}
const extCourses=()=>effList(DEF_EXT,'extcourses');
const jobList=()=>effList(DEF_JOBS,'jobs');
const provSlug=p=>String(p||'').toLowerCase().replace(/[^a-z]/g,'');
const extA=(u,inner,cls='')=>`<a ${cls?`class="${cls}"`:''} href="${esc(u)}" target="_blank" rel="noopener noreferrer">${inner}</a>`;

let learnTopic='', learnProv='';
function xCard(c){
  return `<article class="xcard"><div class="xhead"><span class="xprov p-${provSlug(c.provider)}">${esc(c.provider)}</span><span class="tag">${esc(c.topic)}</span></div>
    <h3>${esc(c.title)}</h3><p class="small muted">${esc(c.by)}</p>
    <dl class="xmeta"><dt>Level</dt><dd>${esc(c.level)}</dd><dt>Duration</dt><dd>${esc(c.duration)}</dd><dt>Cost</dt><dd>${esc(c.cost)}</dd></dl>
    <ul class="xpoints">${(c.points||[]).map(p=>`<li>${esc(p)}</li>`).join('')}</ul>
    ${extA(c.url,`Go to course ${ic('ext')}`,'btn primary')}</article>`;
}
function vLearn(){
  const all=extCourses(); const topics=[...new Set(all.map(c=>c.topic))]; const provs=[...new Set(all.map(c=>c.provider))];
  const cs=all.filter(c=>(!learnTopic||c.topic===learnTopic)&&(!learnProv||c.provider===learnProv));
  const chips=(arr,cur,set)=>['',...arr].map(v=>`<button class="chip" aria-pressed="${cur===v}" data-v="${esc(v)}" onclick="${set}=this.dataset.v;render()">${esc(v||'All')}</button>`).join('');
  return `${pageHead('Online learning','AI, machine learning and data science courses from trusted platforms. Each course opens on the provider’s own website.')}
  <div class="row" style="margin-bottom:10px"><span class="small muted" style="min-width:64px">Topic</span><div class="chips">${chips(topics,learnTopic,'learnTopic')}</div></div>
  <div class="row" style="margin-bottom:20px"><span class="small muted" style="min-width:64px">Platform</span><div class="chips">${chips(provs,learnProv,'learnProv')}</div></div>
  <div class="xgrid">${cs.map(xCard).join('')||'<div class="panel">No courses match. Choose another topic or platform.</div>'}</div>
  <div class="callout" style="margin-top:22px">Course details were checked on ${fmtD(SNAP_DATE)} and can change. Confirm fees, dates and certificates on the provider’s website before you enrol. The department is not affiliated with these platforms. Many Coursera courses can be audited for free, and Coursera offers financial aid for certificates.</div>`;
}
function vJobs(){
  const js=jobList();
  return `${pageHead('Jobs','Find work after your training: search trusted job portals, or see recent openings in Assam.')}
  <section><div class="sh"><h2>Job portals</h2></div>
    <div class="pgrid">${PORTALS.map(p=>extA(p.url,`<span class="tag ${p.tag==='Government'?'ok':'info'}">${esc(p.tag)}</span><b>${esc(p.name)} ${ic('ext')}</b><span class="small muted">${esc(p.desc)}</span>`,'pcard')).join('')}</div></section>
  <section class="sec"><div class="sh"><h2>Recent openings in Assam</h2><span class="small muted">Collected from public job sites on ${fmtD(SNAP_DATE)}</span></div>
    <div class="tw"><table><thead><tr><th>Job</th><th>Location</th><th>Pay</th><th>Requirements</th><th>Posted</th><th></th></tr></thead><tbody>
    ${js.map(j=>`<tr><td><b>${esc(j.title)}</b><div class="small muted">${esc(j.employer)}</div>${j.course&&S.courses[j.course]?`<div class="small" style="margin-top:4px">Train for it: <a href="#courses" onclick="courseQ='${esc(j.course)}';courseSector='all'">${esc(courseName(j.course))}</a></div>`:''}</td>
      <td class="small">${esc(j.location)}</td><td class="small" style="white-space:nowrap">${esc(j.pay)}</td><td class="small">${esc(j.req)}</td><td class="small" style="white-space:nowrap">${esc(j.posted||'—')}</td>
      <td>${extA(j.url,`View on ${esc(j.source)} ${ic('ext')}`,'btn sm')}</td></tr>`).join('')||'<tr><td colspan="6" class="muted">No openings listed right now. Use the job portals above.</td></tr>'}
    </tbody></table></div>
    <div class="callout" style="margin-top:16px"><b>Before you apply:</b> an opening may already be filled, so check the listing on the job site. Genuine employers never ask for money to give you a job or an interview. The department does not verify these employers.</div></section>`;
}

/* Staff editor for online courses and job openings */
let extTab='jobs';
function sExtAdm(){
  const isJobs=extTab==='jobs'; const rows=isJobs?jobList():extCourses();
  return `<h1>Online learning & jobs</h1>
  <div class="row" style="margin-bottom:14px"><div class="chips"><button class="chip" aria-pressed="${isJobs}" onclick="extTab='jobs';render()">Job openings</button><button class="chip" aria-pressed="${!isJobs}" onclick="extTab='courses';render()">Online courses</button></div>
  <button class="btn primary" style="margin-left:auto" onclick="editExt('${extTab}')">${isJobs?'Add job opening':'Add online course'}</button></div>
  <p class="small muted">${isJobs?'Job openings go out of date quickly. Remove filled jobs and add new ones regularly.':'Each course links to the provider’s website. Check details before adding.'}</p>
  <div class="tw"><table><thead><tr>${isJobs?'<th>Job</th><th>Location</th><th>Pay</th><th>Posted</th><th>Source</th>':'<th>Course</th><th>Platform</th><th>Topic</th><th>Cost</th>'}<th></th></tr></thead><tbody>
  ${rows.map(r=>isJobs?`<tr><td><b>${esc(r.title)}</b>${r.featured?' <span class="tag ok">Featured</span>':''}<div class="small muted">${esc(r.employer)}</div></td><td class="small">${esc(r.location)}</td><td class="small">${esc(r.pay)}</td><td class="small">${esc(r.posted||'—')}</td><td class="small">${esc(r.source)}</td><td><button class="btn sm" onclick="editExt('jobs','${esc(r.id)}')">Edit</button></td></tr>`
    :`<tr><td><b>${esc(r.title)}</b>${r.featured?' <span class="tag ok">Featured</span>':''}<div class="small muted">${esc(r.by)}</div></td><td>${esc(r.provider)}</td><td class="small">${esc(r.topic)}</td><td class="small">${esc(r.cost)}</td><td><button class="btn sm" onclick="editExt('courses','${esc(r.id)}')">Edit</button></td></tr>`).join('')||'<tr><td colspan="6" class="muted">Nothing listed yet.</td></tr>'}
  </tbody></table></div>`;
}
function editExt(kind,id){
  const isJobs=kind==='jobs'; const r=id?(isJobs?jobList():extCourses()).find(x=>x.id===id):null;
  const f=(n,l,v,ph='')=>`<div class="field"><label>${l}</label><input name="${n}" value="${esc(v||'')}" placeholder="${esc(ph)}"></div>`;
  const body=isJobs?`<div class="grid g2">${f('title','Job title',r?.title)}${f('employer','Employer',r?.employer)}${f('location','Location',r?.location)}${f('pay','Pay',r?.pay,'₹15,000–20,000 a month')}${f('req','Requirements',r?.req)}${f('posted','Posted on',r?.posted,'e.g. 20 Oct 2026')}${f('source','Job site',r?.source,'e.g. Naukri')}${f('url','Link to the listing',r?.url,'https://')}
      <div class="field"><label>Related SDE course (optional)</label><select name="course"><option value="">None</option>${list('courses').map(c=>`<option value="${c.id}" ${r?.course===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select></div></div>`
    :`<div class="grid g2">${f('title','Course title',r?.title)}${f('provider','Platform',r?.provider,'Coursera, upGrad, NPTEL / SWAYAM…')}${f('topic','Topic',r?.topic,'Artificial intelligence, Data science…')}${f('by','Offered by',r?.by)}${f('level','Level',r?.level)}${f('duration','Duration',r?.duration)}${f('cost','Cost',r?.cost)}${f('url','Link to the course',r?.url,'https://')}</div>
      <div class="field"><label>What you’ll learn (one point per line)</label><textarea name="points" rows="4">${esc((r?.points||[]).join('\n'))}</textarea></div>`;
  openModal(`<div class="mh"><h3 style="margin:0">${r?'Edit':'Add'} ${isJobs?'job opening':'online course'}</h3><button class="btn sm" onclick="closeModal()">Close</button></div>
  <form class="mb" onsubmit="event.preventDefault();saveExt('${kind}','${esc(id||'')}',this)">${body}
  <div class="panel flat" style="margin:4px 0 14px"><label style="display:flex;gap:10px;font-weight:600;margin:0"><input type="checkbox" name="featured" ${r?.featured?'checked':''}> Feature on the home page</label><div class="hint">Featured items appear in the highlighted block, the slider and the opening section. Up to 3 courses and 3 jobs are shown.</div></div>
  <div class="row" style="justify-content:flex-end">${r?`<button type="button" class="btn danger" onclick="removeExt('${kind}','${esc(id)}')">Remove</button>`:''}<button class="btn primary">Save</button></div></form>`,true);
}
async function saveExt(kind,id,form){
  const isJobs=kind==='jobs'; const el=form.elements; const v=n=>el[n]?el[n].value.trim():'';
  if(!v('title')){toast('Add a title.');return}
  if(!/^https:\/\/\S+$/.test(v('url'))){toast('Add a full link starting with https://');return}
  const data=isJobs?{title:v('title'),employer:v('employer'),location:v('location'),pay:v('pay'),req:v('req'),posted:v('posted'),source:v('source'),url:v('url'),course:v('course'),featured:el.featured.checked}
    :{title:v('title'),provider:v('provider'),topic:v('topic'),by:v('by'),level:v('level'),duration:v('duration'),cost:v('cost'),url:v('url'),points:v('points').split('\n').map(s=>s.trim()).filter(Boolean),featured:el.featured.checked};
  // A built-in item that is edited is saved under its own ID, so it replaces the default.
  if(await act('save_ext',{kind,id,data},'Saved.')){closeModal();render()}
}
async function removeExt(kind,id){
  const isDefault=(kind==='jobs'?DEF_JOBS:DEF_EXT).some(d=>d.id===id);
  if(!confirm('Remove this from the website?')) return;
  if(await act('remove_ext',{kind,id,isDefault},'Removed.')){closeModal();render()}
}

/* About */
function vAbout(){
  const st=settings(); const paras=(st.aboutText||'').split(/\n+/).filter(Boolean);
  const order=['jts','training','supervising','monitoring','dealing','centre'];
  const people=list('users').filter(u=>u.active&&u.role!=='admin').sort((a,b)=>order.indexOf(a.role)-order.indexOf(b.role));
  return `${pageHead('About us')}<div class="culture-img bg-people" role="img" aria-label="Young people of Karbi Anglong in traditional Karbi attire" style="margin-bottom:26px"></div>
  <div class="two"><section class="about-txt">${paras.map(p=>`<p>${esc(p)}</p>`).join('')}
    <h3 style="margin-top:22px">What we do</h3>
    <ul style="padding-left:20px;line-height:1.8"><li>Free short-term skill training aligned to national standards (NSQF)</li><li>Aptitude tests, assessment and certification</li><li>On-the-job training and placement linkage with employers</li><li>Support for self-employment and small enterprises</li><li>Empanelment of qualified trainers for our centres</li></ul></section>
  <aside><div class="panel"><h3>Who’s who</h3><div class="tw"><table><tbody>${people.map(u=>`<tr><td><b>${esc(u.name)}</b><div class="small muted">${ROLES[u.role]}${u.centreId?', '+esc(centreName(u.centreId)):''}</div></td></tr>`).join('')||'<tr><td class="muted">To be updated.</td></tr>'}</tbody></table></div></div></aside></div>`;
}

/* Notices */
let noticeCat='';
function vNotices(){
  const ns=latestNotices().filter(n=>!noticeCat||n.category===noticeCat);
  return `${pageHead('Notices & updates','Admission notices, test schedules, results and circulars of the department.')}
  <div class="chips" style="margin-bottom:14px">${['',...NOTICE_CATS].map(c=>`<button class="chip" aria-pressed="${noticeCat===c}" onclick="noticeCat='${c}';render()">${c||'All'}</button>`).join('')}</div>
  <div class="tw updates"><table><thead><tr><th>Date</th><th>Title</th><th>Category</th><th></th></tr></thead><tbody>
  ${ns.map(n=>`<tr><td class="small" style="white-space:nowrap">${n.date?fmtD(n.date):'—'}</td><td>${n.id?`<a class="t" href="#notices" onclick="event.preventDefault();openNotice('${n.id}')">${esc(n.title)}</a>`:esc(n.title)}${isNew(n.date)?'<span class="newtag">New</span>':''}</td><td><span class="tag info">${esc(n.category)}</span></td><td>${n.id?`<button class="btn sm" onclick="openNotice('${n.id}')">View</button>`:''}</td></tr>`).join('')||'<tr><td colspan="4" class="muted">No notices in this category.</td></tr>'}
  </tbody></table></div>`;
}
function openNotice(id){
  const n=S.notices[id]; if(!n) return;
  openModal(`<div class="mh"><h3 style="margin:0">${esc(n.title)}</h3><button class="btn sm" onclick="closeModal()">Close</button></div>
  <div class="mb"><div class="row" style="margin-bottom:12px"><span class="tag info">${esc(n.category)}</span><span class="small muted">${fmtD(n.date)}</span></div>
  ${(n.body||'').split(/\n+/).filter(Boolean).map(p=>`<p>${esc(p)}</p>`).join('')}
  ${n.attachDocId?`<div class="row"><button class="btn" onclick="viewDoc('${n.attachDocId}')">View attachment</button><button class="btn" onclick="downloadAttachment('${n.attachDocId}')">Download</button></div><div id="docView" style="margin-top:12px"></div>`:''}</div>`);
}
function downloadAttachment(id){
  const a=document.createElement('a');a.href=docUrl(id,true);document.body.appendChild(a);a.click();a.remove();
}

/* ---------- Recruitment: scrolling ticker and Recruitment page ---------- */
Object.assign(ICONS,{megaphone:'<path d="M3 11v2a1 1 0 0 0 1 1h3l6 4V6L7 10H4a1 1 0 0 0-1 1z"/><path d="M17 8a5 5 0 0 1 0 8M20 5a9 9 0 0 1 0 14"/>'});
/** Recruitments still taking applications, nearest closing date first. */
const openRecruitments = () => list('recruitments').filter(r=>r.open).sort((a,b)=>a.lastDate.localeCompare(b.lastDate));
const daysLeft = d => Math.round((new Date(d+'T23:59:59+05:30')-Date.now())/864e5);
/* A line under the main menu announcing open recruitments. It scrolls, pauses on hover or keyboard focus,
   and stays still for visitors who ask their device for less motion. */
function renderTicker(){
  const box=$('#rticker'); const recs=openRecruitments();
  if(!recs.length||route==='staff'){box.hidden=true;box.innerHTML='';return}
  const items=recs.map(r=>{const n=daysLeft(r.lastDate);return `<a href="#recruitment">${isNew(r.updatedAt)?'<span class="rt-new">New</span>':''}<b>${esc(r.title)}</b> · <span class="rt-last">Last date ${esc(fmtD(r.lastDate))}${n<=7?` (${n<=0?'today':n+' day'+(n>1?'s':'')+' left'})`:''}</span>${r.remuneration?' · '+esc(r.remuneration):''} · Apply online →</a>`}).join('');
  const sig=recs.map(r=>r.id+r.updatedAt).join();
  if(box.dataset.sig===sig&&!box.hidden) return;  // keep the animation running smoothly across redraws
  box.dataset.sig=sig; box.hidden=false;
  box.innerHTML=`<div class="lt-in"><a class="rt-label" href="#recruitment">${ic('megaphone')}<span>Recruitment</span></a>
    <div class="rt-view" aria-label="Recruitment announcements"><div class="rt-track" style="--rt-dur:${Math.max(25,recs.length*22)}s">${items}<span aria-hidden="true" style="display:contents">${items.replace(/<a /g,'<a tabindex="-1" ')}</span></div></div></div>`;
}
function vRecruitment(){
  const recs=list('recruitments').sort((a,b)=>b.lastDate.localeCompare(a.lastDate));
  const open=recs.filter(r=>r.open), past=recs.filter(r=>!r.open);
  return `${pageHead('Recruitment','Advertisements of the Skill Development & Entrepreneurship Department. Apply online before the last date.')}
  ${open.length?open.map(recCard).join(''):'<div class="panel" style="margin-bottom:22px">There is no recruitment open right now. Please check again later, or see <a href="#notices">Notices</a>.</div>'}
  ${past.length?`<h2 style="margin-top:28px">Closed recruitments</h2>${past.map(recCard).join('')}`:''}`;
}
function recCard(r){
  const n=daysLeft(r.lastDate); const ins=(r.instructions||'').split('\n').filter(Boolean);
  return `<article class="rec ${r.open?'':'closed'}" id="rec-${esc(r.id)}"><div class="rec-head"><div><span class="tag ${r.open?'ok':''}">${r.open?'Open':'Closed'}</span> <span class="small muted">${esc(r.id)}</span>
    <h2>${esc(r.title)}</h2><p class="muted" style="margin:0">${esc(r.engagement)}</p></div>
    <div class="small" style="text-align:right"><b class="${r.open?'rt-last':''}" style="font-size:15px">Last date: ${esc(fmtD(r.lastDate))}</b>${r.open&&n<=14?`<div class="muted">${n<=0?'Closes today':n+' day'+(n>1?'s':'')+' left'}</div>`:''}</div></div>
    ${r.description?`<p style="margin-top:12px">${esc(r.description)}</p>`:''}
    <dl class="rec-facts">${r.vacancies?`<div><dt>Posts</dt><dd>${r.vacancies} ${esc(r.post)}${r.vacancies>1?'s':''}</dd></div>`:''}
      <div><dt>Minimum qualification</dt><dd>${esc(r.minQual)} pass or above</dd></div>
      <div><dt>Age</dt><dd>${r.minAge} to ${r.maxAge} years</dd></div>
      ${r.remuneration?`<div><dt>Remuneration</dt><dd>${esc(r.remuneration)}</dd></div>`:''}
      <div><dt>Mode of application</dt><dd>Online, on this portal</dd></div></dl>
    <h3>Documents required</h3><ul>${r.docs.filter(d=>d.req).map(d=>`<li>${esc(d.label)}</li>`).join('')}</ul>
    ${r.selection?`<h3>Selection</h3><p>${esc(r.selection)}</p>`:''}
    ${ins.length?`<h3>Important instructions</h3><ol>${ins.map(i=>`<li>${esc(i)}</li>`).join('')}</ol>`:''}
    <div class="actions">${r.open?`<a class="btn primary" href="#trainer/${esc(r.id)}">Apply online</a>`:''}
      ${r.attachDocId?`<a class="btn" href="${esc(docUrl(r.attachDocId))}" target="_blank" rel="noopener">View advertisement (PDF)</a><a class="btn" href="${esc(docUrl(r.attachDocId,true))}">Download</a>`:''}
      <a class="btn" href="#track">Track your application</a></div></article>`;
}

/* Contact */
function vContact(){
  const st=settings();
  return `${pageHead('Contact us')}
  <div class="two"><section class="panel"><h3>${esc(st.deptName)}</h3><p>${esc(st.council)}<br>${esc(st.address)}</p>
    <dl class="kv"><dt>Phone</dt><dd>${esc(st.phone||'To be updated')}</dd><dt>Email</dt><dd>${st.email?`<a href="mailto:${esc(st.email)}">${esc(st.email)}</a>`:'To be updated'}</dd><dt>Office hours</dt><dd>${esc(st.officeHours||'—')}</dd></dl></section>
  <section class="panel"><h3>Questions about an application?</h3><p class="small">Quote your application ID or trainer registration ID when you call or write. You can check most updates yourself on <a href="#track">Track status</a>.</p></section></div>
  <section class="sec"><div class="sec-h"><h2>Training centres</h2></div><div class="tw"><table><thead><tr><th>Centre ID</th><th>Centre</th><th>Type</th><th>District</th><th>Sectors</th><th>Facilities</th><th>Phone</th></tr></thead><tbody>
  ${list('centres').filter(c=>c.active).sort((a,b)=>a.id.localeCompare(b.id)).map(c=>`<tr><td class="id">${esc(c.id)}</td><td>${esc(c.name)}<div class="small muted">${esc(c.address)}${c.nearbyTown?' · near '+esc(c.nearbyTown):''}</div></td><td class="small">${esc(c.type)}</td><td>${esc(c.district)}</td><td class="small">${c.sectors.map(sectorName).join(', ')}</td><td class="small">${esc(c.facilities||'—')}</td><td class="small">${esc(c.phone||'—')}</td></tr>`).join('')}
  </tbody></table></div></section>`;
}

/* Staff: recruitment advertisements (Training Manager) */
function sRecruitAdm(){
  const rs=list('recruitments').sort((a,b)=>b.lastDate.localeCompare(a.lastDate));
  return `<h1>Recruitment</h1><div class="row" style="margin-bottom:14px"><span class="muted">Open recruitments scroll under the website’s main menu and are listed on the Recruitment page. Trainers apply online against them until the last date.</span><button class="btn primary" style="margin-left:auto" onclick="editRecruitment()">Publish a recruitment</button></div>
  <div class="tw"><table><thead><tr><th>ID</th><th>Title</th><th>Last date</th><th>Eligibility</th><th>Applications</th><th>Advertisement</th><th>Status</th><th></th></tr></thead><tbody>
  ${rs.map(r=>{const n=list('trainers').filter(t=>t.recruitmentId===r.id).length;return `<tr><td class="id">${esc(r.id)}</td><td>${esc(r.title)}</td><td class="small" style="white-space:nowrap">${fmtD(r.lastDate)}</td><td class="small">${esc(r.minQual)}+ · ${r.minAge}–${r.maxAge} yrs</td><td>${n}</td>
    <td class="small">${r.attachDocId?`<a href="${esc(docUrl(r.attachDocId))}" target="_blank" rel="noopener">${esc(r.attachName||'PDF')}</a>`:'—'}</td>
    <td>${!r.active?'<span class="tag">Hidden</span>':r.open?'<span class="tag ok">Open</span>':'<span class="tag warn">Closed</span>'}</td><td><button class="btn sm" onclick="editRecruitment('${esc(r.id)}')">Edit</button></td></tr>`}).join('')||'<tr><td colspan="8" class="muted">No recruitments yet.</td></tr>'}
  </tbody></table></div>`;
}
function editRecruitment(id){
  const r=id?S.recruitments[id]:null;
  const f=(n,l,v,ph='',type='text')=>`<div class="field"><label>${l}</label><input name="${n}" type="${type}" value="${esc(v??'')}" placeholder="${esc(ph)}"></div>`;
  openModal(`<div class="mh"><h3 style="margin:0">${r?'Edit recruitment':'Publish a recruitment'}</h3><button class="btn sm" onclick="closeModal()">Close</button></div>
  <form class="mb" onsubmit="event.preventDefault();saveRecruitment(this,'${esc(id||'')}')">
  <div class="grid g2">${f('title','Title',r?.title,'e.g. Engagement of 40 Trainers')}${f('engagement','Terms of engagement',r?.engagement,'e.g. Contractual, part-time, 6 months')}</div>
  <div class="grid g4">${f('post','Post',r?.post||'Trainer')}${f('vacancies','Number of posts',r?.vacancies,'','number')}${f('remuneration','Remuneration',r?.remuneration,'e.g. Starting from ₹6,000 per month')}
    <div class="field"><label>Last date</label><input name="lastDate" type="date" required value="${esc(r?.lastDate||'')}"><div class="hint">Applications close at the end of this day</div></div></div>
  <div class="grid g4"><div class="field"><label>Minimum qualification</label><select name="minQual">${QUALS.map(q=>`<option ${(r?.minQual||'Class 12')===q?'selected':''}>${q}</option>`).join('')}</select></div>
    ${f('minAge','Minimum age',r?.minAge??25,'','number')}${f('maxAge','Maximum age',r?.maxAge??40,'','number')}
    <div class="field"><label>Visibility</label><select name="active"><option value="1">Published</option><option value="0" ${r&&!r.active?'selected':''}>Hidden</option></select></div></div>
  <div class="field"><label>Description</label><textarea name="description" rows="3">${esc(r?.description||'')}</textarea></div>
  <div class="field"><label>Selection process</label><textarea name="selection" rows="2">${esc(r?.selection||'')}</textarea></div>
  <div class="field"><label>Important instructions (one per line)</label><textarea name="instructions" rows="4">${esc(r?.instructions||'')}</textarea></div>
  <div class="field"><label>Advertisement (PDF up to 2 MB, or an image)</label><input type="file" id="recFile" accept="application/pdf,image/*">${r?.attachName?`<div class="hint">Current file: ${esc(r.attachName)} · <label style="display:inline;font-weight:500"><input type="checkbox" id="recRemove"> Remove it</label></div>`:''}</div>
  <p class="small muted">Applicants must upload: ${TRAINER_DOCS.filter(d=>d.req).map(d=>esc(d.label)).join(', ')}.</p>
  <div class="row" style="justify-content:flex-end">${r?`<button type="button" class="btn danger" onclick="delRecruitment('${esc(id)}')">Delete</button>`:''}<button class="btn primary">${r?'Save':'Publish'}</button></div></form>`,true);
}
async function saveRecruitment(f,id){
  const fd=new FormData(); fd.append('id',id);
  ['title','engagement','post','vacancies','remuneration','lastDate','minQual','minAge','maxAge','active','description','selection','instructions'].forEach(n=>fd.append(n,f.elements[n].value.trim()));
  const file=$('#recFile').files[0];
  if(file){try{fd.append('file',await uploadable(file))}catch(e){toast(e.message);return}}
  else if($('#recRemove')?.checked) fd.append('removeFile','1');
  if(await act('save_recruitment',null,id?'Recruitment saved.':'Recruitment published.',fd)){closeModal();render()}
}
async function delRecruitment(id){if(!confirm('Delete this recruitment?'))return;if(await act('delete_recruitment',{id},'Recruitment deleted.')){closeModal();render()}}

/* Staff: notices & updates */
function sNoticesAdm(){
  const ns=list('notices').sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  return `<h1>Notices & updates</h1><div class="row" style="margin-bottom:14px"><span class="muted">Published notices appear in the website’s highlights ticker, Latest updates and the Notices page.</span><button class="btn primary" style="margin-left:auto" onclick="editNotice()">Publish a notice</button></div>
  <div class="tw"><table><thead><tr><th>Date</th><th>Title</th><th>Category</th><th>Attachment</th><th>Status</th><th></th></tr></thead><tbody>
  ${ns.map(n=>`<tr><td class="small" style="white-space:nowrap">${fmtD(n.date)}</td><td>${esc(n.title)}</td><td>${esc(n.category)}</td><td class="small">${esc(n.attachName||'—')}</td><td>${n.active!==false?'<span class="tag ok">Published</span>':'<span class="tag">Hidden</span>'}</td><td><button class="btn sm" onclick="editNotice('${n.id}')">Edit</button></td></tr>`).join('')||'<tr><td colspan="6" class="muted">No notices yet. Publish the first one.</td></tr>'}
  </tbody></table></div>`;
}
function editNotice(id){
  const n=id?S.notices[id]:null;
  openModal(`<div class="mh"><h3 style="margin:0">${n?'Edit notice':'Publish a notice'}</h3><button class="btn sm" onclick="closeModal()">Close</button></div>
  <form class="mb" onsubmit="event.preventDefault();saveNotice(this,'${id||''}')">
  <div class="field"><label>Title</label><input name="title" required value="${esc(n?.title||'')}"></div>
  <div class="grid g3"><div class="field"><label>Category</label><select name="category">${NOTICE_CATS.map(c=>`<option ${n?.category===c?'selected':''}>${c}</option>`).join('')}</select></div>
  <div class="field"><label>Date</label><input type="date" name="date" required value="${n?.date||today()}"></div>
  <div class="field"><label>Visibility</label><select name="active"><option value="1">Published</option><option value="0" ${n&&n.active===false?'selected':''}>Hidden</option></select></div></div>
  <div class="field"><label>Details</label><textarea name="body" rows="5">${esc(n?.body||'')}</textarea></div>
  <div class="field"><label>Attachment (PDF up to 2 MB, or a JPG/PNG image)</label><input type="file" id="noticeFile" accept="image/*,application/pdf">${n?.attachName?`<div class="hint">Current file: ${esc(n.attachName)} · <label style="display:inline;font-weight:500"><input type="checkbox" id="noticeRemove"> Remove it</label></div>`:''}</div>
  <div class="row" style="justify-content:flex-end">${n?`<button type="button" class="btn danger" onclick="delNotice('${id}')">Delete</button>`:''}<button class="btn primary">${n?'Save notice':'Publish notice'}</button></div></form>`);
}
async function saveNotice(f,id){
  const el=f.elements;
  if(!el.title.value.trim()){toast('Add a title for the notice.');return}
  const fd=new FormData();
  [['id',id],['title',el.title.value.trim()],['category',el.category.value],['date',el.date.value],['body',el.body.value],['active',el.active.value]].forEach(([k,v])=>fd.append(k,v));
  const file=$('#noticeFile').files[0];
  if(file){try{fd.append('file',await uploadable(file))}catch(e){toast(e.message);return}}
  else if($('#noticeRemove')?.checked) fd.append('removeFile','1');
  if(await act('save_notice',null,id?'Notice saved.':'Notice published.',fd)){closeModal();render()}
}
async function delNotice(id){if(!confirm('Delete this notice?'))return;if(await act('delete_notice',{id},'Notice deleted.')){closeModal();render()}}

/* ---------- Courses ---------- */
let courseSector='all', courseQ='';
function vCourses(){
  const sectors=list('sectors');
  const cs=list('courses').filter(c=>c.active&&(courseSector==='all'||c.sectorId===courseSector)&&(!courseQ||(c.name+c.id).toLowerCase().includes(courseQ.toLowerCase())));
  const by={}; cs.forEach(c=>(by[c.sectorId]=by[c.sectorId]||[]).push(c));
  return `${pageHead('Courses by sector')}
  <p class="muted">All courses are free. Pick a course and select <em>Apply</em> to start your registration.</p>
  <div class="row" style="margin:16px 0">
    <div class="chips" role="group" aria-label="Filter by sector">
      <button class="chip" aria-pressed="${courseSector==='all'}" onclick="courseSector='all';render()">All sectors</button>
      ${sectors.map(s=>`<button class="chip" aria-pressed="${courseSector===s.id}" onclick="courseSector='${s.id}';render()">${esc(s.name)}</button>`).join('')}
    </div>
    <input style="max-width:260px;margin-left:auto" placeholder="Search course or skill ID" value="${esc(courseQ)}" oninput="courseQ=this.value;clearTimeout(window._cq);window._cq=setTimeout(()=>{render();const i=document.querySelector('#main input');i.focus();i.setSelectionRange(i.value.length,i.value.length)},250)">
  </div>
  ${Object.keys(by).length?Object.entries(by).map(([sid,arr])=>`
    <section style="margin-bottom:26px">
      <h2>${esc(sectorName(sid))}</h2><p class="muted small">${esc(S.sectors[sid]?.desc||'')}</p>
      <div class="tw"><table><thead><tr><th>Skill ID</th><th>Course</th><th>NSQF</th><th>Duration</th><th>Eligibility</th><th>Seats</th><th>Offered at</th><th></th></tr></thead><tbody>
      ${arr.map(c=>`<tr><td class="id">${esc(c.id)}</td><td>${esc(c.name)}${c.qpCode?`<div class="small muted">QP ${esc(c.qpCode)}${c.ssc?' · '+esc(c.ssc):''}</div>`:''}</td><td>Level ${esc(c.nsqf)}</td><td>${c.hours} hrs<div class="small muted">≈ ${Math.max(1,Math.round(c.hours/120))} months</div></td>
        <td>${esc(c.minQual)} pass<div class="small muted">Age ${c.minAge}–${c.maxAge}</div></td><td>${c.seats}</td>
        <td class="small">${list('centres').filter(x=>x.active&&x.sectors.includes(c.sectorId)).map(x=>esc(x.name)).join(', ')||'—'}</td>
        <td><a class="btn sm primary" href="#apply/${esc(c.id)}">Apply</a></td></tr>`).join('')}
      </tbody></table></div>
    </section>`).join(''):'<div class="panel">No courses match. Clear the search or choose another sector.</div>'}`;
}

/* ---------- Student account and application (CR-01, CR-02) ---------- */
let applyFor='', justApplied='';
function courseOptions(sel){
  return `<option value="">Select a course</option>`+list('sectors').map(s=>{const cs=list('courses').filter(c=>c.active&&c.sectorId===s.id);return cs.length?`<optgroup label="${esc(s.name)}">${cs.map(c=>`<option value="${c.id}" ${sel===c.id?'selected':''}>${esc(c.name)} (${c.id})</option>`).join('')}</optgroup>`:''}).join('');
}
const openApplication = () => list('students').find(a=>!CLOSED.includes(a.status));

/* Log in / create account */
function vStudent(){
  if(!STU) return vStudentLogin();
  const apps=list('students').sort((a,b)=>b.createdAt.localeCompare(a.createdAt)); const open=openApplication();
  return `${pageHead('My applications','Welcome, '+STU.name+'. Follow your applications here, or apply for a trade.')}
  <div class="row" style="justify-content:space-between;margin-bottom:14px"><span class="muted small">Logged in as ${esc(STU.email)}</span><button class="btn sm" onclick="studentLogout()">Log out</button></div>
  ${justApplied?`<div class="callout" style="margin-bottom:16px"><b>Application submitted.</b> Your application number is <b>${esc(justApplied)}</b>. We have emailed it to ${esc(STU.email)}.</div>`:''}
  ${apps.length?apps.map(s=>`<section style="margin-bottom:22px">${STAGE_NOTE[s.status]?`<p class="small" style="margin:0 0 8px"><b>Where it is now:</b> ${esc(STAGE_NOTE[s.status])}</p>`:''}${trackHTML(s)}</section>`).join('')
    :'<div class="panel">You have not applied yet. Choose a trade below to start your application.</div>'}
  <div class="panel flat row" style="justify-content:space-between;margin:8px 0 20px"><span><b>Skill India Digital Hub.</b> Your national skilling profile, courses, jobs and DigiLocker certificates are on SIDH.${apps.find(a=>a.sidhId)?` Your SIDH ID: <b>${esc(apps.find(a=>a.sidhId).sidhId)}</b>`:''}</span>${sidhLink('Open Skill India Digital Hub ↗')}</div>
  <h2 style="margin-top:28px">Schemes and trades</h2>
  <p class="muted">${open?`You can apply for another trade once application ${esc(open.id)} is closed.`:'Choose the trade you want to train in. Training is free, and every trainee who passes gets a certificate.'}</p>
  ${list('sectors').map(sec=>{const cs=list('courses').filter(c=>c.active&&c.sectorId===sec.id);return cs.length?`<section style="margin-bottom:18px"><h3>${esc(sec.name)}</h3><div class="tw"><table><thead><tr><th>Trade</th><th>Skill ID</th><th>Duration</th><th>Eligibility</th><th></th></tr></thead><tbody>
    ${cs.map(c=>`<tr><td>${esc(c.name)}</td><td class="id">${esc(c.id)}</td><td class="small">${c.hours} hrs</td><td class="small">${esc(c.minQual)} pass · age ${c.minAge}–${c.maxAge}</td>
      <td>${open?'<span class="small muted">—</span>':`<a class="btn sm primary" href="#apply/${esc(c.id)}">Apply</a>`}</td></tr>`).join('')}</tbody></table></div></section>`:''}).join('')}`;
}
function vStudentLogin(){
  const c=applyFor&&S.courses[applyFor];
  return `${pageHead('Apply online','Create a student account, then choose a trade and fill in the application form.')}
  ${c?`<div class="callout" style="margin-bottom:16px">Log in or create an account to apply for <b>${esc(c.name)}</b>.</div>`:''}
  <div class="grid g2" style="align-items:start">
    <div class="panel"><h3>Log in</h3><form onsubmit="event.preventDefault();studentLogin(this)">
      <div class="field"><label>Email</label><input name="email" type="email" autocomplete="email" required></div>
      <div class="field"><label>Password</label><input name="password" type="password" autocomplete="current-password" required></div>
      <div class="err" id="sLoginErr"></div>
      <div class="row" style="justify-content:space-between"><button class="btn primary">Log in</button><a href="#" onclick="event.preventDefault();forgotDialog()">Forgot password?</a></div></form></div>
    <div class="panel"><h3>New here? Create an account</h3><form onsubmit="event.preventDefault();studentSignup(this)">
      <div class="field"><label>Full name (as in Aadhaar)</label><input name="name" autocomplete="name" required></div>
      <div class="grid g2"><div class="field"><label>Email</label><input name="email" type="email" autocomplete="email" required><div class="hint">Your application number and updates are sent here</div></div>
      <div class="field"><label>Mobile number</label><input name="mobile" inputmode="numeric" maxlength="10" autocomplete="tel" required></div></div>
      <div class="grid g2"><div class="field"><label>Password</label><input name="password" type="password" autocomplete="new-password" minlength="8" required><div class="hint">At least 8 characters, with letters and numbers</div></div>
      <div class="field"><label>Repeat password</label><input name="password2" type="password" autocomplete="new-password" required></div></div>
      <div class="err" id="sSignupErr"></div>
      <button class="btn primary">Create account</button>
      <p class="small muted" style="margin-top:10px">Creating an account is not an application. After you log in, choose a trade and apply.</p></form></div>
  </div>`;
}
async function afterStudentLogin(){
  await loadStudent(); toast('Welcome, '+STU.name+'.');
  if(applyFor){const c=applyFor;applyFor='';go('apply/'+encodeURIComponent(c))}else if(route==='student')render();else go('student');
}
async function studentLogin(f){
  const err=$('#sLoginErr'); err.textContent='';
  try{await api('student_login',{method:'POST',data:{email:f.email.value.trim(),password:f.password.value}});await afterStudentLogin()}catch(e){err.textContent=e.message}
}
async function studentSignup(f){
  const err=$('#sSignupErr'); err.textContent='';
  if(f.password.value!==f.password2.value){err.textContent='The passwords do not match.';return}
  try{await api('student_signup',{method:'POST',data:{name:f.name.value.trim(),email:f.email.value.trim(),mobile:f.mobile.value.trim(),password:f.password.value}});await afterStudentLogin()}
  catch(e){err.textContent=e.message}
}
async function studentLogout(){
  try{await api('logout',{method:'POST'})}catch(e){}
  STU=null; justApplied=''; STAFF_COLLS.forEach(c=>S[c]={});
  try{await loadPublic()}catch(e){}
  go('home');
}
function forgotDialog(){
  openModal(`<div class="mh"><h3 style="margin:0">Reset your password</h3><button class="btn sm" onclick="closeModal()">Close</button></div>
  <form class="mb" onsubmit="event.preventDefault();sendReset(this)"><p>Enter the email of your student account. We will email you a link to set a new password.</p>
  <div class="field"><label>Email</label><input name="email" type="email" required></div>
  <div id="fpMsg"></div><div class="row" style="justify-content:flex-end"><button class="btn primary">Email me a link</button></div></form>`);
}
async function sendReset(f){
  try{await api('forgot_password',{method:'POST',data:{email:f.email.value.trim(),base:location.origin+location.pathname}});
    $('#fpMsg').innerHTML='<div class="callout" style="margin-bottom:12px">If an account exists for this email, a link is on its way. It works for one hour.</div>'}
  catch(e){$('#fpMsg').innerHTML=`<p class="err">${esc(e.message)}</p>`}
}
function vReset(){
  return `${pageHead('Set a new password')}<div class="panel" style="max-width:460px"><form onsubmit="event.preventDefault();doReset(this)">
    <div class="field"><label>New password</label><input name="password" type="password" autocomplete="new-password" minlength="8" required><div class="hint">At least 8 characters, with letters and numbers</div></div>
    <div class="field"><label>Repeat new password</label><input name="password2" type="password" autocomplete="new-password" required></div>
    <div class="err" id="rsErr"></div><button class="btn primary">Save password and log in</button></form></div>`;
}
async function doReset(f){
  const err=$('#rsErr'); err.textContent='';
  if(f.password.value!==f.password2.value){err.textContent='The passwords do not match.';return}
  try{await api('reset_password',{method:'POST',data:{token:routeArg,password:f.password.value}});history.replaceState(null,'','#student');route='student';await afterStudentLogin()}
  catch(e){err.textContent=e.message}
}

/* Application form for one trade */
function vApply(){
  const c=S.courses[routeArg]; const open=openApplication();
  if(!c||!c.active) return `${pageHead('Apply for a trade')}<div class="panel">This trade is not open for applications. <a href="#student">Choose another trade</a>.</div>`;
  if(open) return `${pageHead('Apply for a trade')}<div class="panel">You already have an open application (${esc(open.id)}). You can apply again once it is closed. <a href="#student">Back to my applications</a></div>`;
  const centres=list('centres').filter(x=>x.active&&x.sectors.includes(c.sectorId));
  return `${pageHead('Application form',`${c.name} (${c.id})`)}
  <div class="panel flat" style="margin-bottom:16px"><div class="row" style="justify-content:space-between"><div><b>${esc(c.name)}</b> <span class="muted small">${esc(sectorName(c.sectorId))} · ${c.hours} hours · NSQF level ${esc(c.nsqf)}</span><div class="small">Eligibility: ${esc(c.minQual)} pass, age ${c.minAge}–${c.maxAge}</div></div><a class="btn sm" href="#student">Choose a different trade</a></div></div>
  <p class="muted">Fields marked <span style="color:var(--bad)">*</span> are required. Keep scanned copies of your documents ready (JPG, PNG or PDF).</p>
  <form id="regForm" novalidate><input type="hidden" name="pref1" value="${esc(c.id)}">
  <fieldset><legend>Aadhaar and contact</legend>
    <div class="grid g3">
      <div class="field"><label>Aadhaar number <span class="req">*</span></label><input name="aadhaar" inputmode="numeric" maxlength="14" placeholder="12-digit number" autocomplete="off"><div class="hint">Only the last 4 digits are stored on record.${DEMO?` <a href="#" onclick="event.preventDefault();document.querySelector('[name=aadhaar]').value=testAadhaar()">Fill a test number</a>`:''}</div></div>
      <div class="field"><label>Mobile number <span class="req">*</span></label><input name="mobile" inputmode="numeric" maxlength="10" value="${esc(STU.mobile)}"><div class="hint">Status updates are sent by SMS</div></div>
      <div class="field"><label>Email</label><input value="${esc(STU.email)}" disabled><div class="hint">From your account. The acknowledgement is sent here.</div></div>
    </div>
  </fieldset>
  <fieldset><legend>Personal details</legend>
    <div class="grid g3">
      <div class="field"><label>Full name (as in Aadhaar) <span class="req">*</span></label><input name="name" value="${esc(STU.name)}"></div>
      <div class="field"><label>Father’s name <span class="req">*</span></label><input name="father"></div>
      <div class="field"><label>Mother’s name</label><input name="mother"></div>
      <div class="field"><label>Date of birth <span class="req">*</span></label><input name="dob" type="date" max="${today()}"></div>
      <div class="field"><label>Gender <span class="req">*</span></label><select name="gender"><option value="">Select</option><option>Female</option><option>Male</option><option>Transgender</option></select></div>
      <div class="field"><label>Category <span class="req">*</span></label><select name="category"><option value="">Select</option><option>ST (Hills)</option><option>ST (Plains)</option><option>SC</option><option>OBC/MOBC</option><option>General</option><option>EWS</option></select></div>
      <div class="field"><label>Person with disability</label><select name="pwd"><option>No</option><option>Yes</option></select></div>
      <div class="field"><label>Religion <span class="req">*</span></label><select name="religion"><option value="">Select</option>${RELIGIONS.map(r=>`<option>${r}</option>`).join('')}</select></div>
      <div class="field"><label>Current employment status <span class="req">*</span></label><select name="employmentStatus"><option value="">Select</option>${EMPLOYMENT.map(r=>`<option>${r}</option>`).join('')}</select></div>
    </div>
  </fieldset>
  <fieldset><legend>Skill India Digital Hub</legend>
    <div class="field" style="max-width:420px"><label>SIDH candidate ID (if you have one)</label><input name="sidhId" maxlength="40" autocomplete="off"><div class="hint">Registered on ${sidhLink()}? Enter your ID so your training here is linked to your national skilling record. Not registered? You can still apply; the department will help link it.</div></div>
  </fieldset>
  <fieldset><legend>Address</legend>
    <div class="grid g3">
      <div class="field"><label>Village / town <span class="req">*</span></label><input name="village"></div>
      <div class="field"><label>Development block</label><input name="block"></div>
      <div class="field"><label>District <span class="req">*</span></label><select name="district"><option value="">Select</option><option>Karbi Anglong</option><option>West Karbi Anglong</option><option>Other</option></select></div>
      <div class="field"><label>PIN code <span class="req">*</span></label><input name="pin" inputmode="numeric" maxlength="6"></div>
    </div>
  </fieldset>
  <fieldset><legend>Education</legend>
    <div class="grid g4">
      <div class="field"><label>Highest qualification <span class="req">*</span></label><select name="qual"><option value="">Select</option>${QUALS.map(q=>`<option>${q}</option>`).join('')}</select><div id="eligNote" class="hint"></div></div>
      <div class="field"><label>Board / university</label><input name="board"></div>
      <div class="field"><label>Year of passing</label><input name="year" inputmode="numeric" maxlength="4"></div>
      <div class="field"><label>Percentage / grade</label><input name="pct"></div>
    </div>
  </fieldset>
  <fieldset><legend>Training centre</legend>
    <div class="field" style="max-width:420px"><label>Preferred centre</label><select name="prefCentre"><option value="">Any centre</option>${centres.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}${x.nearbyTown?' · near '+esc(x.nearbyTown):''}</option>`).join('')}</select><div class="hint">The Centre Manager allots centres after selection, keeping your preference in mind where possible.</div></div>
  </fieldset>
  <fieldset><legend>Documents</legend>
    <p class="small muted">JPG, PNG or PDF. Photos are resized automatically. PDFs can be up to 2 MB.</p>
    <div class="grid g2">${DOC_TYPES.map(d=>`<div class="field"><label>${d.label} ${d.req?'<span class="req">*</span>':''}</label><input type="file" name="doc_${d.key}" accept="${d.img?'image/*':'image/*,application/pdf'}"></div>`).join('')}</div>
  </fieldset>
  <div class="panel flat" style="margin-bottom:16px"><label style="display:flex;gap:10px;font-weight:500"><input type="checkbox" name="declare"> I declare that the information given is true. I consent to the use of my Aadhaar number for identity verification for this scheme only.</label></div>
  <div id="regErr" class="err" style="font-size:14px;margin-bottom:12px"></div>
  <div class="row"><button class="btn primary" type="submit" id="regBtn">Submit application</button><a class="btn" href="#student">Cancel</a></div>
  </form>`;
}
function eligibility(s, courseId){
  const c=S.courses[courseId]; if(!c) return {ok:false,issues:['Course not found']};
  const issues=[]; const a=age(s.dob);
  if(a<c.minAge||a>c.maxAge) issues.push(`Age ${a} is outside ${c.minAge}–${c.maxAge}`);
  if(QUALS.indexOf(s.qual)<QUALS.indexOf(c.minQual)) issues.push(`Needs ${c.minQual} pass (has ${s.qual||'none'})`);
  return {ok:!issues.length,issues};
}
function wireApply(){
  const f=$('#regForm'); if(!f) return; const note=$('#eligNote');
  const upd=()=>{const c=S.courses[f.pref1.value];if(!c)return;
    if(!f.dob.value||!f.qual.value){note.textContent='';return}
    const e=eligibility({dob:f.dob.value,qual:f.qual.value},c.id);note.textContent=e.ok?'You meet the eligibility for this trade.':e.issues.join('. ')+'.';note.className=e.ok?'hint':'err'};
  ['dob','qual'].forEach(n=>f[n].addEventListener('change',upd));
  f.aadhaar.addEventListener('input',()=>{const v=f.aadhaar.value.replace(/\D/g,'').slice(0,12);f.aadhaar.value=v.replace(/(\d{4})(?=\d)/g,'$1 ')});
  f.addEventListener('submit',submitApplication);
}
function readImage(file,max=900,q=.7,type='image/jpeg'){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,max/Math.max(im.width,im.height));const c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);const x=c.getContext('2d');if(type==='image/jpeg'){x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height)}x.drawImage(im,0,0,c.width,c.height);res(c.toDataURL(type,q))};im.onerror=()=>rej(new Error(file.name+' is not an image this browser can read.'));im.src=r.result};r.onerror=rej;r.readAsDataURL(file)})}
/** Images are resized to a sensible size in the browser before upload; PDFs are sent as they are. */
async function uploadable(file){
  if(file.type.startsWith('image/')){
    const data=await readImage(file,1600,.82);
    const bin=atob(data.split(',')[1]); const u=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
    return new File([u],file.name.replace(/\.[^.]+$/,'')+'.jpg',{type:'image/jpeg'});
  }
  if(file.type==='application/pdf'){if(file.size>2*1024*1024) throw new Error(file.name+' is larger than 2 MB. Compress the PDF or upload a photo of it instead.');return file}
  throw new Error(file.name+' is not a JPG, PNG or PDF file.');
}
/** Adds the chosen document files (and a small photo thumbnail) to a form submission. */
async function addFiles(fd,form,types){
  for(const d of types){const inp=form.querySelector(`[name=doc_${d.key}]`);const file=inp&&inp.files[0];if(!file)continue;
    fd.append('doc_'+d.key,await uploadable(file));
    if(d.key==='photo') fd.append('photo_thumb',await readImage(file,160,.75));
  }
}
const showErrors = (box,msg) => {box.innerHTML=String(msg).split('\n').map(esc).join('<br>');box.scrollIntoView({behavior:'smooth',block:'center'})};
async function submitApplication(e){
  e.preventDefault(); const f=e.target, err=$('#regErr'); err.textContent='';
  const v=n=>f[n].value.trim(); const aadhaar=v('aadhaar').replace(/\s/g,'');
  const problems=[];
  if(!validAadhaar(aadhaar)) problems.push('Enter a valid 12-digit Aadhaar number (the check digit does not match).');
  if(!/^[6-9]\d{9}$/.test(v('mobile'))) problems.push('Enter a valid 10-digit mobile number starting with 6–9.');
  ['name','father','dob','gender','category','religion','employmentStatus','village','district','qual'].forEach(n=>{if(!v(n))problems.push('Fill in '+f[n].closest('.field').querySelector('label').childNodes[0].textContent.trim().toLowerCase()+'.')});
  if(v('sidhId')&&!/^[A-Za-z0-9\/_.-]{1,40}$/.test(v('sidhId'))) problems.push('Check the SIDH candidate ID: use letters, numbers, / _ . - only, or leave it blank.');
  if(!/^\d{6}$/.test(v('pin'))) problems.push('Enter a 6-digit PIN code.');
  DOC_TYPES.filter(d=>d.req).forEach(d=>{if(!f['doc_'+d.key].files[0])problems.push('Upload '+d.label.toLowerCase()+'.')});
  if(!f.declare.checked) problems.push('Tick the declaration to continue.');
  if(problems.length){showErrors(err,problems.join('\n'));return}
  const btn=$('#regBtn'); btn.disabled=true; btn.textContent='Uploading documents…';
  try{
    const fd=new FormData();
    ['mobile','name','father','mother','dob','gender','category','pwd','religion','employmentStatus','sidhId','village','block','district','pin','qual','board','year','pct','pref1','prefCentre'].forEach(n=>fd.append(n,v(n)));
    fd.append('aadhaar',aadhaar); fd.append('declare','1');
    await addFiles(fd,f,DOC_TYPES);
    const d=await api('apply',{method:'POST',form:fd});
    justApplied=d.student.id; await loadStudent(); go('student');
  }catch(ex){showErrors(err,ex.message||'Could not submit. Try again.');btn.disabled=false;btn.textContent='Submit application'}
}

/* ---------- Track ---------- */
let trackFound=null;
function vTrack(){
  return `${pageHead('Track status','Students and trainers can both check their status and download documents here.')}
  <div class="panel" style="max-width:640px"><form onsubmit="event.preventDefault();trackResult(this.aid.value.trim(),this.dob.value)">
    <div class="grid g2"><div class="field"><label>Application or trainer ID</label><input name="aid" placeholder="KAAC-SDE-${YEAR}-00001" value="${esc(trackFound?.id||trackPrefill||'')}"></div>
    <div class="field"><label>Date of birth</label><input name="dob" type="date" value="${esc(trackFound?.dob||'')}"></div></div>
    <button class="btn primary">Show status</button></form></div>
  <div id="trackOut" style="margin-top:20px">${trackFound?(trackFound.trainer?trainerTrackHTML(S.trainers[trackFound.id]):trackHTML(S.students[trackFound.id])):''}</div>`;
}
/** Shows an application returned by the server. It only ever returns the record whose ID and date of birth match. */
function showTracked(d,dob,fresh){
  const p=d.kind==='trainer'?d.trainer:d.student;
  (d.kind==='trainer'?S.trainers:S.students)[p.id]=p;
  (d.batches||[]).forEach(b=>S.batches[b.id]=b); (d.ojt||[]).forEach(o=>S.ojt[o.id]=o);
  trackFound={id:p.id,dob,trainer:d.kind==='trainer'};
  const out=$('#trackOut'); if(!out) return;
  const what=d.kind==='trainer'?['Registration submitted.','trainer registration ID','check status']:['Application submitted.','application ID','track status and download documents'];
  out.innerHTML=(fresh?`<div class="callout" style="margin-bottom:16px"><b>${what[0]}</b> Your ${what[1]} is <b>${esc(p.id)}</b>. Save it — you need it with your date of birth to ${what[2]}.</div>`:'')
    +(d.kind==='trainer'?trainerTrackHTML(p):trackHTML(p));
}
async function trackResult(id,dob){
  const out=$('#trackOut'); out.innerHTML='<p class="muted">Checking…</p>';
  try{showTracked(await api('track',{method:'POST',data:{id,dob}}),dob,false)}
  catch(e){trackFound=null;out.innerHTML=`<div class="panel">${esc(e.message)}</div>`}
}
function trackHTML(s){
  const b=S.batches[s.batchId]; const ojts=list('ojt').filter(o=>o.studentId===s.id&&o.status==='signed');
  return `<div class="grid g2">
    <div class="panel"><div class="row" style="align-items:flex-start">${s.photo?`<img class="photo" src="${esc(s.photo)}" alt="">`:''}<div><h2 style="margin-bottom:4px">${esc(s.name)}</h2><div class="muted small">${esc(s.id)}</div><div style="margin-top:8px">${statusTag(s.status)}</div></div></div>
      <hr class="sep"><dl class="kv"><dt>Course</dt><dd>${esc(courseName(s.skillId||s.pref1))} <span class="muted">(${esc(s.skillId||s.pref1)})</span></dd>
      ${s.admit?`<dt>Aptitude test</dt><dd>${fmtD(s.admit.date)}, ${esc(s.admit.time)} at ${esc(s.admit.venue)}</dd>`:''}
      ${b?`<dt>Batch</dt><dd>${esc(b.id)}, ${fmtD(b.start)} to ${fmtD(b.end)}</dd><dt>Centre</dt><dd>${esc(centreName(b.centreId))} (${esc(b.centreId)})</dd>`:''}
      ${s.cert?`<dt>Certificate</dt><dd>${esc(s.cert.no)}</dd>`:''}</dl>
      <div class="row" style="margin-top:16px">
        ${s.admit?`<button class="btn primary" onclick="openDoc('admit','${esc(s.id)}')">Download admit card</button>`:''}
        ${s.cert?`<button class="btn primary" onclick="openDoc('cert','${esc(s.id)}')">Download certificate</button>`:''}
        ${ojts.map(o=>`<button class="btn" onclick="openDoc('ojt','${esc(o.id)}')">OJT letter: ${esc(o.employer)}</button>`).join('')}
      </div>
      ${s.status==='returned'?resubmitHTML(s):''}
    </div>
    <div class="panel"><h3>Progress</h3><ul class="tl">${[...(s.history||[])].reverse().map(h=>`<li><b>${esc(h.action)}</b>${h.remark?`<div>${esc(h.remark)}</div>`:''}<small>${fmtDT(h.at)} · ${esc(h.role)}</small></li>`).join('')}</ul></div>
  </div>`;
}
function resubmitHTML(s){
  const flagged=(s.docs||[]).filter(d=>d.status==='rejected');
  const keys=flagged.length?flagged.map(d=>d.key):DOC_TYPES.map(d=>d.key);
  return `<hr class="sep"><h3>Correct and resubmit</h3><p class="small">${esc(s.history.slice(-1)[0]?.remark||'')}</p>
  <form onsubmit="event.preventDefault();resubmit(this,DOC_TYPES,'${esc(s.id)}')">${keys.map(k=>{const d=DOC_TYPES.find(x=>x.key===k);return `<div class="field"><label>${d.label}</label><input type="file" name="doc_${k}" accept="${d.img?'image/*':'image/*,application/pdf'}"></div>`}).join('')}
  <button class="btn primary">Resubmit application</button></form>`;
}
/** Sends corrected documents: from the student's dashboard, or for the application shown on Track status. */
async function resubmit(f,types,id){
  const fromAccount = STU && route==='student';
  if(!fromAccount&&!trackFound) return;
  const fd=new FormData(); fd.append('id',fromAccount?id:trackFound.id); if(!fromAccount) fd.append('dob',trackFound.dob);
  try{await addFiles(fd,f,types)}catch(ex){toast(ex.message);return}
  if(![...fd.keys()].some(k=>k.startsWith('doc_'))){toast('Choose at least one corrected document.');return}
  try{
    const d=await api('resubmit',{method:'POST',form:fd});
    if(fromAccount){await loadStudent();render()}else showTracked(d,trackFound.dob,false);
    toast('Resubmitted. The Dealing Assistant will check your documents again.');
  }catch(e){toast(e.message)}
}

/* ---------- Verify certificate ---------- */
let verifyQ='', verifyRes=null;
async function runVerify(){
  verifyRes=verifyQ?{loading:true}:null; if(route==='verify')render();
  if(!verifyQ) return;
  try{verifyRes=await api('verify',{query:{no:verifyQ}})}catch(e){verifyRes={error:e.message}}
  if(route==='verify')render();
}
function vVerify(){
  const r=verifyRes;
  return `${pageHead('Verify a certificate','Employers can confirm a certificate issued by the department by its number.')}
  <div class="panel" style="max-width:560px"><form onsubmit="event.preventDefault();verifyQ=this.q.value.trim();history.replaceState(null,'','#verify/'+encodeURIComponent(verifyQ));runVerify()"><div class="field"><label>Certificate number</label><input name="q" value="${esc(verifyQ)}" placeholder="KAAC-SDE-CERT-${YEAR}-00001"></div><button class="btn primary">Verify</button></form></div>
  ${r?`<div class="panel" style="max-width:560px;margin-top:16px">${r.loading?'<p class="muted">Checking…</p>':r.error?`<p class="err">${esc(r.error)}</p>`:r.valid?`<span class="tag ok">Valid certificate</span><dl class="kv" style="margin-top:12px"><dt>Certificate no.</dt><dd>${esc(r.certNo)}</dd><dt>Name</dt><dd>${esc(r.name)}</dd><dt>Student ID</dt><dd>${esc(r.id)}</dd><dt>Course</dt><dd>${esc(r.course)} (${esc(r.skillId)})</dd><dt>Centre</dt><dd>${esc(r.centre)} (${esc(r.centreId)})</dd><dt>Grade</dt><dd>${esc(r.grade)}</dd><dt>Issued</dt><dd>${fmtD(r.issuedAt)}</dd></dl>`:'<span class="tag bad">Not found</span><p style="margin-top:10px">No certificate with this number was issued by the department.</p>'}</div>`:''}`;
}

/* ---------- Login ---------- */
function vLogin(){
  return `${pageHead('Staff login','For officers of the department and centre managers.')}<div style="max-width:440px">
  <div class="panel"><form onsubmit="event.preventDefault();doLogin(this)">
    <div class="field"><label>Username</label><input name="u" autocomplete="username"></div>
    <div class="field"><label>Password</label><input name="p" type="password" autocomplete="current-password"></div>
    <div id="loginErr" class="err"></div>
    <button class="btn primary" style="margin-top:8px">Log in</button></form></div>
  ${DEMO?`<details class="panel flat" style="margin-top:16px"><summary style="cursor:pointer;font-weight:600">Demo accounts (development mode only)</summary>
    <div class="tw" style="margin-top:10px"><table><thead><tr><th>Role</th><th>Username</th><th>Password</th></tr></thead><tbody>
    ${DEMO_USERS.map(u=>`<tr><td>${ROLES[u[2]]}${u[3]?' ('+u[3]+')':''}</td><td>${u[0]}</td><td>${u[1]}</td></tr>`).join('')}</tbody></table></div>
    <p class="small muted" style="margin-top:8px">These accounts exist only while the server runs with DEMO_USERS=true. They are never created in production.</p></details>`:''}</div>`;
}
async function doLogin(f){
  const err=$('#loginErr'); err.textContent='';
  const btn=f.querySelector('button'); btn.disabled=true;
  try{const r=await api('login',{method:'POST',data:{u:f.u.value.trim(),p:f.p.value}});ME=r.me;STU=null;await loadStaff();staffView='dash';go('staff')}
  catch(e){err.textContent=e.message;btn.disabled=false}
}
async function logout(){
  try{await api('logout',{method:'POST'})}catch(e){}
  ME=null; STAFF_COLLS.forEach(c=>S[c]={}); closeModal();
  try{await loadPublic()}catch(e){}
  go('home');
}

/* ============================== Staff area ============================== */
const MENU=[
  ['dash','Dashboard',null],
  ['apps','Applications',['dealing','supervising','jts']],
  ['approved','Selected list',['supervising','jts']],
  ['allot','Centre allocation',['centre']],
  ['batches','Batches',['centre','training']],
  ['trainers','Trainers',['dealing','training']],
  ['results','Attendance & results',['centre','training']],
  ['certs','Certificates',['training','centre']],
  ['ojt','OJT letters',['training','centre','jts']],
  ['mapping','Centre mapping',['centre','training','supervising']],
  ['notifs','SMS & email log',['supervising']],
  ['recruitAdm','Recruitment',['training']],
  ['noticesAdm','Notices & updates',['training']],
  ['extAdm','Online learning & jobs',['training']],
  ['master','Courses, sectors & centres',[]],
  ['users','Users & roles',[]],
  ['settings','Settings',[]]
];
/* The server sends each officer only the applications their stage deals with. */
function myStudents(){return list('students')}
/* Which applications wait for which role (CR-03 to CR-05). */
const QUEUE={dealing:'submitted',supervising:'verified',jts:'shortlisted'};
const unbatched = () => myStudents().filter(s=>s.status==='approved'||(s.status==='allocated'&&!s.batchId));
function pendingCount(v){
  const s=myStudents(), n=k=>s.filter(x=>x.status===k).length;
  if(v==='apps'&&QUEUE[ME.role]) return n(QUEUE[ME.role]);
  if(v==='allot'&&ME.role==='centre') return n('approved');
  if(v==='batches'&&ME.role==='centre') return s.filter(x=>x.status==='allocated').length;
  if(v==='batches'&&ME.role==='training') return list('batches').filter(b=>b.status!=='completed'&&!b.trainerId).length;
  if(v==='ojt'&&ME.role==='jts') return list('ojt').filter(o=>o.status==='pending').length;
  if(v==='certs'&&ME.role==='training') return n('passed');
  if(v==='trainers'){if(ME.role==='dealing')return list('trainers').filter(t=>t.status==='submitted').length;if(ME.role==='training')return list('trainers').filter(t=>t.status==='verified').length}
  return 0;
}
function vStaff(){
  const items=MENU.filter(([k,,r])=>r===null||can(...r));
  if(!items.find(i=>i[0]===staffView)) staffView='dash';
  const views={recruitAdm:sRecruitAdm,extAdm:sExtAdm,noticesAdm:sNoticesAdm,trainers:sTrainers,dash:sDash,apps:sApps,approved:sApproved,allot:sAllot,batches:sBatches,results:sResults,certs:sCerts,ojt:sOjt,mapping:sMapping,notifs:sNotifs,master:sMaster,users:sUsers,settings:sSettings};
  return `<div class="staff"><aside class="side">
    <div class="who"><b>${esc(ME.name)}</b><span class="small muted">${ROLES[ME.role]}${ME.centreId?' · '+esc(centreName(ME.centreId)):''}</span></div>
    ${items.map(([k,l])=>{const n=pendingCount(k);return `<button class="nav" aria-current="${staffView===k}" onclick="staffView='${k}';render()"><span>${l}</span>${n?`<span class="badge">${n}</span>`:''}</button>`}).join('')}
    <hr class="sep" style="margin:10px 0"><button class="nav" onclick="passwordDialog()">Change my password</button><button class="nav" onclick="logout()">Log out</button>
  </aside><section>${views[staffView]()}</section></div>`;
}

/* ---------- Dashboard ---------- */
function bars(rows){const max=Math.max(1,...rows.map(r=>r[1]));return rows.map(([l,n])=>`<div class="barrow"><span>${esc(l)}</span><div class="bar"><i style="width:${n/max*100}%"></i></div><b>${n}</b></div>`).join('')||'<p class="muted small">No data yet.</p>'}
function sDash(){
  const st=myStudents(); const c=k=>st.filter(s=>s.status===k).length;
  const bySector={}; st.forEach(s=>{const sec=S.courses[s.skillId||s.pref1]?.sectorId;bySector[sec]=(bySector[sec]||0)+1});
  const centres=list('centres').filter(x=>x.active&&(ME.role!=='centre'||!ME.centreId||x.id===ME.centreId));
  const tasks=[];
  if(can('dealing')&&c('submitted')) tasks.push([`${c('submitted')} applications waiting for document verification`,'apps']);
  if(can('supervising')&&c('verified')) tasks.push([`${c('verified')} verified applications waiting to be shortlisted`,'apps']);
  if(can('jts')&&c('shortlisted')) tasks.push([`${c('shortlisted')} shortlisted candidates waiting for your approval`,'apps']);
  if(can('centre')&&c('approved')) tasks.push([`${c('approved')} selected candidates need a training centre`,'allot']);
  if(can('centre')&&c('allocated')) tasks.push([`${c('allocated')} candidates allotted to a centre are not yet in a batch`,'batches']);
  if(can('dealing')){const n=list('trainers').filter(t=>t.status==='submitted').length;if(n)tasks.push([`${n} trainer registrations waiting for document verification`,'trainers'])}
  if(can('training')){const nb=list('batches').filter(b=>b.status!=='completed'&&!b.trainerId).length;if(nb)tasks.push([`${nb} batches need a trainer`,'batches']);const n=list('trainers').filter(t=>t.status==='verified').length;if(n)tasks.push([`${n} verified trainers waiting to be empanelled`,'trainers'])}
  if(can('centre')&&c('training')) tasks.push([`${c('training')} trainees in progress — record results when batches finish`,'results']);
  if(can('training')&&c('passed')) tasks.push([`${c('passed')} passed trainees need certificates`,'certs']);
  if(can('jts')){const p=list('ojt').filter(o=>o.status==='pending').length;if(p)tasks.push([`${p} OJT recommendation letters waiting for your signature`,'ojt'])}
  const label={centre:'Selected candidates',training:'Trainees in batches'}[ME.role]||'Total applications';
  return `<h1>Dashboard</h1>
  ${tasks.length?`<div class="panel" style="margin-bottom:18px"><h3>Waiting for you</h3>${tasks.map(([t,v])=>`<div class="row" style="justify-content:space-between;padding:6px 0;border-bottom:1px dashed var(--line)"><span>${t}</span><button class="btn sm" onclick="staffView='${v}';render()">Open</button></div>`).join('')}</div>`:''}
  <div class="grid g4">
    <div class="stat"><div class="n">${st.length}</div><div class="l">${label}</div></div>
    <div class="stat"><div class="n">${c('submitted')+c('returned')+c('verified')+c('shortlisted')}</div><div class="l">Under review</div></div>
    <div class="stat"><div class="n">${st.filter(s=>SELECTED_ON.includes(s.status)).length}</div><div class="l">Selected</div></div>
    <div class="stat"><div class="n">${c('certified')}</div><div class="l">Certified</div></div>
  </div>
  <div class="grid g2" style="margin-top:18px">
    <div class="panel"><h3>Applications by stage</h3>${bars(Object.keys(STATUS).map(k=>[STATUS[k][0],c(k)]).filter(r=>r[1]))}</div>
    <div class="panel"><h3>Applications by sector</h3>${bars(Object.entries(bySector).map(([k,n])=>[sectorName(k),n]))}</div>
    <div class="panel"><h3>Centre utilisation</h3>${bars(centres.map(x=>[x.name,list('batches').filter(b=>b.centreId===x.id&&b.status!=='completed').reduce((a,b)=>a+b.students.length,0)]))}<p class="small muted">Trainees in active batches.</p></div>
    <div class="panel"><h3>Recent activity</h3>${st.flatMap(s=>(s.history||[]).map(h=>({...h,s}))).sort((a,b)=>b.at.localeCompare(a.at)).slice(0,8).map(h=>`<div class="small" style="padding:5px 0;border-bottom:1px dashed var(--line)"><b>${esc(h.s.id)}</b> ${esc(h.action)}<div class="muted">${fmtDT(h.at)} · ${esc(h.by)}</div></div>`).join('')||'<p class="muted small">No activity yet.</p>'}</div>
  </div>
  ${can('supervising')?`<div class="row" style="margin-top:18px"><button class="btn" onclick="exportCSV()">Export all applications (CSV)</button></div>`:''}`;
}

/* ---------- Applications: verify, shortlist, approve ---------- */
let appF={view:'queue',status:'',course:'',q:''};
const BULK={dealing:['verify','Forward selected to the S&M Officer'],supervising:['shortlist','Shortlist selected and forward to the Joint Secretary'],jts:['approve','Approve selected']};
function sApps(){
  const queue=QUEUE[ME.role]; const inQueue=queue&&appF.view==='queue';
  let st=myStudents();
  if(inQueue) st=st.filter(s=>s.status===queue); else if(appF.status) st=st.filter(s=>s.status===appF.status);
  if(appF.course) st=st.filter(s=>(s.skillId||s.pref1)===appF.course);
  if(appF.q){const q=appF.q.toLowerCase();st=st.filter(s=>(s.id+s.name+s.mobile+s.village).toLowerCase().includes(q))}
  st.sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
  const hint={dealing:'Open each application and check every document. Forward complete applications to the Supervising & Monitoring Officer, return them to the applicant to re-upload, or reject them.',
    supervising:'Shortlist candidates who meet the eligibility and requirements. Shortlisted candidates go to the Joint Secretary for approval.',
    jts:'Approve the shortlist. Approved candidates are emailed that they have been selected, and the list goes to the Centre Manager.'}[ME.role]||'';
  const bulk=inQueue&&BULK[ME.role];
  return `<h1>Applications</h1>${hint?`<p class="muted">${hint}</p>`:''}
  ${queue?`<div class="chips" style="margin-bottom:12px"><button class="chip" aria-pressed="${appF.view==='queue'}" onclick="appF.view='queue';render()">Waiting for me (${myStudents().filter(s=>s.status===queue).length})</button><button class="chip" aria-pressed="${appF.view==='all'}" onclick="appF.view='all';render()">All applications</button></div>`:''}
  <div class="row" style="margin-bottom:12px">
    ${inQueue?'':`<select style="max-width:210px" onchange="appF.status=this.value;render()"><option value="">All stages</option>${Object.entries(STATUS).filter(([k])=>!['admit','selected','notselected'].includes(k)).map(([k,v])=>`<option value="${k}" ${appF.status===k?'selected':''}>${v[0]}</option>`).join('')}</select>`}
    <select style="max-width:260px" onchange="appF.course=this.value;render()"><option value="">All trades</option>${list('courses').map(c=>`<option value="${c.id}" ${appF.course===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select>
    <input style="max-width:240px" placeholder="Search name, ID, mobile" value="${esc(appF.q)}" onchange="appF.q=this.value;render()">
    <span class="muted small" style="margin-left:auto">${st.length} shown</span>
  </div>
  ${bulk&&st.length?`<div class="row" style="margin-bottom:10px"><button class="btn primary" onclick="bulkAction('${bulk[0]}')">${bulk[1]}</button><span class="small muted">Tick the candidates first. Use Open to act on one candidate or add a remark.</span></div>`:''}
  <div class="tw"><table><thead><tr>${bulk?`<th><input type="checkbox" aria-label="Select all" onchange="document.querySelectorAll('.appPick').forEach(i=>i.checked=this.checked)"></th>`:''}<th>Application ID</th><th>Name</th><th>Trade</th><th>Eligibility</th><th>Submitted</th><th>Stage</th><th></th></tr></thead><tbody>
  ${st.map(s=>{const e=eligibility(s,s.pref1);return `<tr>${bulk?`<td><input type="checkbox" class="appPick" value="${esc(s.id)}" aria-label="Select ${esc(s.name)}"></td>`:''}<td class="id">${esc(s.id)}</td><td>${esc(s.name)}<div class="small muted">${esc(s.village)}, ${esc(s.district)}</div></td><td>${esc(courseName(s.pref1))}<div class="small muted">${esc(s.pref1)}</div></td>
    <td>${e.ok?'<span class="tag ok">Eligible</span>':`<span class="tag warn" title="${esc(e.issues.join('; '))}">Check</span>`}</td><td class="small">${fmtD(s.createdAt)}</td><td>${statusTag(s.status)}</td>
    <td><button class="btn sm" onclick="openApp('${esc(s.id)}')">Open</button></td></tr>`}).join('')||`<tr><td colspan="8" class="muted">${inQueue?'Nothing is waiting for you.':'No applications match these filters.'}</td></tr>`}
  </tbody></table></div>`;
}
async function bulkAction(action){
  const ids=$$('.appPick:checked').map(i=>i.value);
  if(!ids.length){toast('Tick at least one candidate.');return}
  const what={verify:'forward',shortlist:'shortlist and forward',approve:'approve'}[action];
  if(!confirm(`${what[0].toUpperCase()+what.slice(1)} ${ids.length} application(s)?`)) return;
  const r=await act('bulk_action',{act:action,ids});
  if(r){toast(`${r.done} done.`+(r.skipped.length?` ${r.skipped.length} skipped: ${action==='verify'?'a document is marked incorrect or the application':'the application'} has moved on.`:''));render()}
}
function openModal(html,wide){$('#modalBox').className='box'+(wide?' wide':'');$('#modalBox').innerHTML=html;$('#modal').classList.add('open');setTimeout(()=>$('#modalBox').querySelector('input,select,textarea,button')?.focus(),30)}
function closeModal(){$('#modal').classList.remove('open');if(pendingRefresh){pendingRefresh=false;render()}}
$('#modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});

async function openApp(id){
  const s=S.students[id]; const e=eligibility(s,s.pref1);
  const actions=[];
  if(can('dealing')&&s.status==='submitted') actions.push(`<button class="btn danger" onclick="appAction('${id}','reject')">Reject</button><button class="btn" onclick="appAction('${id}','return')">Return for re-upload</button><button class="btn primary" onclick="appAction('${id}','verify')">Verify and forward to S&amp;M Officer</button>`);
  if(can('supervising')&&s.status==='verified') actions.push(`<button class="btn danger" onclick="appAction('${id}','notshortlist')">Not shortlisted</button><button class="btn primary" onclick="appAction('${id}','shortlist')">Shortlist and forward to Joint Secretary</button>`);
  if(can('jts')&&s.status==='shortlisted') actions.push(`<button class="btn danger" onclick="appAction('${id}','notapprove')">Do not approve</button><button class="btn primary" onclick="appAction('${id}','approve')">Approve</button>`);
  openModal(`<div class="mh"><h3 style="margin:0">${esc(s.name)} · ${esc(s.id)}</h3><button class="btn sm" onclick="closeModal()">Close</button></div>
  <div class="mb"><div class="grid g2">
    <div><div class="row" style="align-items:flex-start;margin-bottom:12px">${s.photo?`<img class="photo" src="${esc(s.photo)}" alt="">`:''}<div>${statusTag(s.status)}<div class="small muted" style="margin-top:6px">Submitted ${fmtDT(s.createdAt)}</div></div></div>
      <dl class="kv"><dt>Aadhaar</dt><dd>XXXX XXXX ${esc(s.aadhaarLast4)}</dd><dt>Father / mother</dt><dd>${esc(s.father)}${s.mother?' / '+esc(s.mother):''}</dd><dt>Date of birth</dt><dd>${fmtD(s.dob)} (age ${age(s.dob)})</dd><dt>Gender / category</dt><dd>${esc(s.gender)} · ${esc(s.category)}${s.pwd==='Yes'?' · PwD':''}</dd>
      <dt>Religion / employment</dt><dd>${esc(s.religion||'—')} · ${esc(s.employmentStatus||'—')}</dd>
      <dt>SIDH candidate ID</dt><dd>${sidhField('student',s.id,s.sidhId,can('dealing','supervising','centre','training'))}</dd>
      <dt>Mobile / email</dt><dd>${esc(s.mobile)}${s.email?'<br>'+esc(s.email):''}</dd><dt>Address</dt><dd>${esc([s.village,s.block,s.district,s.pin].filter(Boolean).join(', '))}</dd>
      <dt>Qualification</dt><dd>${esc(s.qual)}${s.board?', '+esc(s.board):''}${s.year?' ('+esc(s.year)+')':''}${s.pct?', '+esc(s.pct):''}</dd>
      <dt>Trade</dt><dd>${esc(courseName(s.pref1))} (${esc(s.pref1)}) ${e.ok?'<span class="tag ok">Eligible</span>':`<span class="tag warn">${esc(e.issues.join('; '))}</span>`}</dd>
      ${s.pref2?`<dt>2nd choice</dt><dd>${esc(courseName(s.pref2))}</dd>`:''}<dt>Preferred centre</dt><dd>${esc(s.prefCentre?centreName(s.prefCentre)+' ('+s.prefCentre+')':'Any')}</dd>
      ${s.admit?`<dt>Admit card</dt><dd>${esc(s.admit.no)} · ${fmtD(s.admit.date)} ${esc(s.admit.time)}</dd>`:''}
      ${s.score!=null?`<dt>Aptitude score</dt><dd>${esc(s.score)}</dd>`:''}
      ${s.batchId?`<dt>Batch / centre</dt><dd>${esc(s.batchId)} · ${esc(s.centreId)}</dd>`:''}</dl></div>
    <div><h3>Documents</h3><div id="docList">${(s.docs||[]).map(d=>`<div class="row" style="justify-content:space-between;padding:7px 0;border-bottom:1px dashed var(--line)"><span class="small"><b>${esc(d.label)}</b><br><span class="muted">${esc(d.name)}</span></span>
      <span class="row" style="gap:6px">${d.status==='ok'?'<span class="tag ok">OK</span>':d.status==='rejected'?'<span class="tag bad">Incorrect</span>':''}<button class="btn sm" onclick="viewDoc('${esc(d.docId)}','${esc(d.type)}')">View</button>
      ${can('dealing')&&s.status==='submitted'?`<button class="btn sm" onclick="markDoc('${id}','${d.key}','ok')">OK</button><button class="btn sm danger" onclick="markDoc('${id}','${d.key}','rejected')">Incorrect</button>`:''}</span></div>`).join('')}</div>
      <div id="docView" style="margin-top:12px"></div>
      <h3 style="margin-top:16px">History</h3><ul class="tl">${[...(s.history||[])].reverse().map(h=>`<li><b>${esc(h.action)}</b>${h.remark?`<div class="small">${esc(h.remark)}</div>`:''}<small>${fmtDT(h.at)} · ${esc(h.by)} (${esc(h.role)})</small></li>`).join('')}</ul></div>
  </div>
  ${actions.length?`<div class="field" style="margin-top:12px"><label>Remark</label><textarea id="appRemark" placeholder="Required when returning, rejecting, not shortlisting or not approving. The applicant sees this remark."></textarea></div>`:''}
  </div>${actions.length?`<div class="mf">${actions.join('')}</div>`:''}`,true);
}
/** Shows an uploaded document inside the open dialog. The server checks the viewer may see it. */
function viewDoc(docId,type){
  const box=$('#docView'); const url=docUrl(docId);
  box.innerHTML=(type==='application/pdf'?`<iframe src="${esc(url)}" title="Document" style="width:100%;height:440px;border:1px solid var(--line);border-radius:8px"></iframe>`
    :`<img class="docthumb" src="${esc(url)}" alt="Uploaded document">`)+`<p class="small" style="margin-top:6px"><a href="${esc(url)}" target="_blank" rel="noopener">Open in a new tab</a></p>`;
}
async function markDoc(id,key,status){if(await act('mark_doc',{kind:'student',id,key,status}))openApp(id)}
async function appAction(id,action){
  const s=S.students[id]; const remark=($('#appRemark')?.value||'').trim();
  if(['reject','return','notshortlist','notapprove'].includes(action)&&!remark){toast('Add a remark explaining the reason.');$('#appRemark').focus();return}
  if(action==='verify'&&s.docs.some(d=>d.status==='rejected')){toast('A document is marked incorrect. Return the application instead.');return}
  if(await act('app_action',{id,act:action,remark},'Saved. Applicant notified by SMS'+(s.email?' and email.':'.'))){closeModal();render()}
}

/* ---------- Selected list with Excel and PDF download (CR-06) ---------- */
let selF={course:''};
const approvedOn = s => (s.history||[]).find(h=>h.action.startsWith('Approved by the Joint Secretary'))?.at;
function selectedList(){
  return myStudents().filter(s=>SELECTED_ON.includes(s.status)&&(!selF.course||(s.skillId||s.pref1)===selF.course))
    .sort((a,b)=>courseName(a.skillId).localeCompare(courseName(b.skillId))||a.name.localeCompare(b.name));
}
const SEL_COLS=['Sl. no.','Application ID','Name','Father’s name','Gender','Category','District','Trade','Approved on'];
const selRow = (s,i) => [i+1,s.id,s.name,s.father,s.gender,s.category,s.district,courseName(s.skillId||s.pref1),fmtD(approvedOn(s))];
const selTitle = () => `List of candidates selected for skill training${selF.course?' — '+courseName(selF.course):''}, ${YEAR}`;
function sApproved(){
  const rows=selectedList();
  return `<h1>Selected list</h1><p class="muted">Candidates approved by the Joint Secretary. Download the list for file noting and for publishing in the newspaper.</p>
  <div class="row" style="margin-bottom:12px">
    <select style="max-width:280px" onchange="selF.course=this.value;render()"><option value="">All trades</option>${list('courses').map(c=>`<option value="${c.id}" ${selF.course===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select>
    <span class="muted small">${rows.length} selected</span>
    <span style="margin-left:auto" class="row"><button class="btn" onclick="downloadSelectedXlsx()" ${rows.length?'':'disabled'}>Download Excel</button><button class="btn primary" onclick="downloadSelectedPdf()" ${rows.length?'':'disabled'}>Download PDF</button></span>
  </div>
  <div class="tw"><table><thead><tr>${SEL_COLS.map(h=>`<th>${esc(h)}</th>`).join('')}<th>Current stage</th></tr></thead><tbody>
  ${rows.map((s,i)=>`<tr>${selRow(s,i).map((v,j)=>`<td class="${j===1?'id':j>3?'small':''}">${esc(v)}</td>`).join('')}<td>${statusTag(s.status)}</td></tr>`).join('')||'<tr><td colspan="10" class="muted">No candidates have been approved yet.</td></tr>'}
  </tbody></table></div>`;
}
function downloadSelectedXlsx(){
  saveBlob(`selected-candidates-${today()}.xlsx`,xlsxBlob('Selected',[selTitle()],SEL_COLS,selectedList().map(selRow)));
}
async function downloadSelectedPdf(){
  try{await loadScript('assets/vendor/jspdf-2.5.2.umd.min.js');await loadScript('assets/vendor/jspdf-autotable-3.8.4.min.js')}
  catch(e){toast(e.message);return}
  const {jsPDF}=window.jspdf; const doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'}); const st=settings(); const W=doc.internal.pageSize.getWidth();
  doc.setFont('helvetica','bold'); doc.setFontSize(14); doc.text(st.deptName,W/2,14,{align:'center'});
  doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.text(`${st.council}, ${st.address}`,W/2,20,{align:'center'});
  doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.text(selTitle(),W/2,29,{align:'center'});
  doc.autoTable({head:[SEL_COLS],body:selectedList().map(selRow),startY:34,styles:{fontSize:9,cellPadding:1.8},headStyles:{fillColor:[30,74,59]},
    didDrawPage:()=>{doc.setFont('helvetica','normal');doc.setFontSize(8);const p=doc.internal.getCurrentPageInfo().pageNumber;
      doc.text(`Generated on ${fmtDT(nowISO())} · Page ${p}`,W-14,doc.internal.pageSize.getHeight()-8,{align:'right'})}});
  doc.save(`selected-candidates-${today()}.pdf`);
}
/* SIDH data sheet: one row per trainee, with the identifiers and fields Skill India Digital Hub records,
   for uploading to SIDH or checking records against it. */
const SIDH_COLS=['TP ID','Project ID','Scheme','TC ID','Centre','Portal batch ID','SIDH batch ID','Batch start','Batch end','Job role','QP code','NSQF level','Sector Skill Council',
  'Trainer','SIDH trainer ID','Application ID','SIDH candidate ID','Name','Father’s name','Gender','Date of birth','Category','Religion','Person with disability','Employment status',
  'Highest qualification','Mobile','Email','District','PIN code','Aadhaar (last 4)','Stage','Result','Grade','Certificate no.'];
function downloadSidhSheet(batchIds){
  const st=settings(), rows=[];
  batchIds.map(id=>S.batches[id]).filter(Boolean).sort((a,b)=>a.id.localeCompare(b.id)).forEach(b=>{
    const c=S.courses[b.courseId]||{}, ce=S.centres[b.centreId]||{}, t=S.trainers[b.trainerId]||{};
    b.students.map(x=>S.students[x]).filter(Boolean).forEach(s=>rows.push([st.sidhTpId||'',st.sidhProjectId||'',st.sidhScheme||'',ce.sidhTcId||'',ce.name||b.centreId,b.id,b.sidhBatchId||'',b.start,b.end,
      c.jobRole||c.name||b.courseId,c.qpCode||'',c.nsqf??'',c.ssc||'',t.name||'',t.sidhId||'',s.id,s.sidhId||'',s.name,s.father,s.gender,s.dob,s.category,s.religion||'',s.pwd,s.employmentStatus||'',
      s.qual,s.mobile,s.email,s.district,s.pin,s.aadhaarLast4,STATUS[s.status]?.[0]||s.status,s.result?.result||'',s.result?.grade||'',s.cert?.no||'']));
  });
  if(!rows.length){toast('There are no trainees in these batches yet.');return}
  const missing=[!st.sidhTpId&&'Training Partner ID (Settings)',rows.some(r=>!r[3])&&'Training Centre IDs (Centres)',rows.some(r=>!r[10])&&'QP codes (Courses)',rows.some(r=>!r[6])&&'SIDH batch IDs'].filter(Boolean);
  saveBlob(`sidh-data-sheet-${today()}.xlsx`,xlsxBlob('SIDH',[`SIDH data sheet — ${settings().deptName}`,`Generated ${fmtDT(nowISO())}`],SIDH_COLS,rows));
  toast(missing.length?`Downloaded. Still blank: ${missing.join(', ')}.`:'SIDH data sheet downloaded.');
}
function loadScript(src){return new Promise((res,rej)=>{if(document.querySelector(`script[src="${src}"]`))return res();const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=()=>rej(new Error('Could not load the PDF tool. Check your connection and try again.'));document.head.appendChild(s)})}

/* A minimal .xlsx writer (one sheet, text and numbers, bold title and header) so Excel files need no library. */
function xlsxBlob(sheet,titleRows,header,rows){
  const x=v=>String(v??'').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g,'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const col=i=>{let s='';for(i++;i;i=Math.floor((i-1)/26))s=String.fromCharCode(65+(i-1)%26)+s;return s};
  const cell=(v,r,c,bold)=>typeof v==='number'?`<c r="${col(c)}${r}"${bold?' s="1"':''}><v>${v}</v></c>`:`<c r="${col(c)}${r}" t="inlineStr"${bold?' s="1"':''}><is><t xml:space="preserve">${x(v)}</t></is></c>`;
  const all=[...titleRows.map(t=>[t]),[],header,...rows]; const bold=new Set([...titleRows.keys(),titleRows.length+1]);
  const widths=header.map((h,i)=>Math.min(40,Math.max(String(h).length,...rows.map(r=>String(r[i]??'').length))+2));
  const sheetXml=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols>${widths.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('')}</cols><sheetData>${all.map((r,ri)=>`<row r="${ri+1}">${r.map((v,ci)=>cell(v,ri+1,ci,bold.has(ri))).join('')}</row>`).join('')}</sheetData></worksheet>`;
  const enc=new TextEncoder(); const f=(name,s)=>({name,data:enc.encode(s)});
  return zipStore([
    f('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'),
    f('_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'),
    f('xl/workbook.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${x(sheet)}" sheetId="1" r:id="rId1"/></sheets></workbook>`),
    f('xl/_rels/workbook.xml.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'),
    f('xl/styles.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>'),
    f('xl/worksheets/sheet1.xml',sheetXml),
  ]);
}
function crc32(b){let crc=-1;for(let i=0;i<b.length;i++){let c=(crc^b[i])&255;for(let k=0;k<8;k++)c=c&1?(c>>>1)^0xEDB88320:c>>>1;crc=(crc>>>8)^c}return (crc^-1)>>>0}
/** A ZIP archive with uncompressed ("stored") entries — all an .xlsx needs. */
function zipStore(files){
  const enc=new TextEncoder(), parts=[], central=[]; let offset=0;
  for(const f of files){
    const name=enc.encode(f.name), crc=crc32(f.data), n=f.data.length;
    const h=new DataView(new ArrayBuffer(30)); [[0,0x04034b50,4],[4,20,2],[6,0x0800,2],[12,0x21,2],[14,crc,4],[18,n,4],[22,n,4],[26,name.length,2]].forEach(([o,v,w])=>w===4?h.setUint32(o,v,true):h.setUint16(o,v,true));
    const c=new DataView(new ArrayBuffer(46)); [[0,0x02014b50,4],[4,20,2],[6,20,2],[8,0x0800,2],[14,0x21,2],[16,crc,4],[20,n,4],[24,n,4],[28,name.length,2],[42,offset,4]].forEach(([o,v,w])=>w===4?c.setUint32(o,v,true):c.setUint16(o,v,true));
    parts.push(new Uint8Array(h.buffer),name,f.data); central.push(new Uint8Array(c.buffer),name); offset+=30+name.length+n;
  }
  const size=central.reduce((a,b)=>a+b.length,0), e=new DataView(new ArrayBuffer(22));
  e.setUint32(0,0x06054b50,true); e.setUint16(8,files.length,true); e.setUint16(10,files.length,true); e.setUint32(12,size,true); e.setUint32(16,offset,true);
  return new Blob([...parts,...central,new Uint8Array(e.buffer)],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}

/* ---------- Centre allocation (CR-07) ---------- */
let allotF={course:''};
/* A Centre Manager linked to one centre works only with that centre; one with no centre manages all of them. */
const inMyCentre = id => ME.role!=='centre'||!ME.centreId||id===ME.centreId;
function sAllot(){
  const st=unbatched().filter(s=>!allotF.course||s.skillId===allotF.course).sort((a,b)=>(a.status===b.status?0:a.status==='approved'?-1:1)||a.name.localeCompare(b.name));
  const centres=list('centres').filter(x=>x.active&&(!ME.centreId||x.id===ME.centreId));
  return `<h1>Centre allocation</h1><p class="muted">Allot each selected candidate to a training centre that offers their trade. Candidates can be moved to another centre until they are placed in a batch. Then form batches on the Batches page.</p>
  <div class="row" style="margin-bottom:12px">
    <select style="max-width:280px" onchange="allotF.course=this.value;render()"><option value="">All trades</option>${list('courses').map(c=>`<option value="${c.id}" ${allotF.course===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select>
    <span class="muted small">${st.filter(s=>s.status==='approved').length} waiting · ${st.filter(s=>s.status==='allocated').length} allotted</span>
  </div>
  ${st.length?`<div class="panel flat row" style="margin-bottom:12px"><label for="allotCentre" style="margin:0">Allot the ticked candidates to</label>
    <select id="allotCentre" style="max-width:340px"><option value="">Choose a centre</option>${centres.map(x=>`<option value="${esc(x.id)}">${esc(x.name)} · ${x.capacity} per batch · ${esc(x.sectors.map(sectorName).join(', '))}</option>`).join('')}</select>
    <button class="btn primary" onclick="allotSelected()">Allot</button></div>`:''}
  <div class="tw"><table><thead><tr><th><input type="checkbox" aria-label="Select all" onchange="document.querySelectorAll('.allotPick').forEach(i=>i.checked=this.checked)"></th><th>Application ID</th><th>Name</th><th>Trade</th><th>Preferred centre</th><th>Allotted centre</th><th>Stage</th></tr></thead><tbody>
  ${st.map(s=>`<tr><td><input type="checkbox" class="allotPick" value="${esc(s.id)}" ${s.status==='approved'?'':''} aria-label="Select ${esc(s.name)}"></td><td class="id">${esc(s.id)}</td><td>${esc(s.name)}<div class="small muted">${esc(s.village)}, ${esc(s.district)}</div></td>
    <td>${esc(courseName(s.skillId))}</td><td class="small">${esc(s.prefCentre?centreName(s.prefCentre):'Any')}</td><td class="small">${s.centreId?esc(centreName(s.centreId)):'—'}</td><td>${statusTag(s.status)}</td></tr>`).join('')||'<tr><td colspan="7" class="muted">No selected candidates are waiting for a centre.</td></tr>'}
  </tbody></table></div>`;
}
async function allotSelected(){
  const ids=$$('.allotPick:checked').map(i=>i.value), centre=$('#allotCentre').value;
  if(!ids.length){toast('Tick at least one candidate.');return}
  if(!centre){toast('Choose a centre.');return}
  const c=S.centres[centre], wrong=ids.filter(id=>!c.sectors.includes(S.courses[S.students[id].skillId]?.sectorId));
  if(wrong.length){toast(`${c.name} does not offer the trade of ${wrong.length} ticked candidate(s).`);return}
  const r=await act('allocate',{ids,centre});
  if(r){toast(`${r.done} candidate(s) allotted to ${c.name}. They have been notified.`);render()}
}

/* ---------- Batches: formed by the Centre Manager, trainers assigned by the Training Manager (CR-07, CR-08) ---------- */
const batchLimit = centreId => Math.min(MAXBATCH, S.centres[centreId]?.capacity||MAXBATCH);
function sBatches(){
  const bs=list('batches').sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  const groups={}; myStudents().filter(s=>s.status==='allocated').forEach(s=>{const k=s.centreId+'|'+s.skillId;(groups[k]=groups[k]||[]).push(s)});
  const hint=can('centre')&&!can('training')?`Form batches from candidates allotted to a centre. One batch has candidates of a single trade, at most ${MAXBATCH} or what the centre can hold.`
    :'Batches formed by the Centre Manager. Assign an empanelled trainer to each batch.';
  return `<h1>Batches</h1><p class="muted">${hint}</p>
  ${can('centre')?`<div class="panel" style="margin-bottom:18px"><h3>Allotted candidates waiting for a batch</h3>
  ${Object.keys(groups).length?`<div class="tw"><table><thead><tr><th>Centre</th><th>Trade</th><th>Waiting</th><th>Batch limit</th><th></th></tr></thead><tbody>${Object.entries(groups).map(([k,arr])=>{const [cen,cid]=k.split('|');return `<tr><td>${esc(centreName(cen))}</td><td>${esc(courseName(cid))}</td><td><b>${arr.length}</b></td><td>${batchLimit(cen)}</td><td><button class="btn sm primary" onclick="batchDialog('${esc(cid)}','${esc(cen)}')">Form batch</button></td></tr>`}).join('')}</tbody></table></div>`
    :'<p class="muted small">No one is waiting. Allot selected candidates to centres first.</p>'}</div>`:''}
  ${bs.length?`<div class="row" style="justify-content:flex-end;margin-bottom:10px"><button class="btn" onclick="downloadSidhSheet(list('batches').map(b=>b.id))">SIDH data sheet, all batches (Excel)</button></div>`:''}
  <div class="tw"><table><thead><tr><th>Batch ID</th><th>Trade</th><th>Centre</th><th>Trainer</th><th>Dates</th><th>Trainees</th><th>Status</th><th></th></tr></thead><tbody>
  ${bs.map(b=>`<tr><td class="id">${esc(b.id)}${b.sidhBatchId?`<div class="small muted">SIDH ${esc(b.sidhBatchId)}</div>`:''}</td><td>${esc(courseName(b.courseId))}<div class="small muted">${esc(b.courseId)}</div></td><td>${esc(centreName(b.centreId))}<div class="small muted">${esc(b.centreId)}</div></td><td>${trainerLabel(b)}</td><td class="small">${fmtD(b.start)} – ${fmtD(b.end)}</td><td>${b.students.length}/${b.capacity}</td><td><span class="tag ${b.status==='completed'?'':'ok'}">${esc(b.status)}</span></td>
    <td class="row" style="gap:6px">${can('training')&&!b.trainerId&&b.status!=='completed'?`<button class="btn sm primary" onclick="assignDialog('${esc(b.id)}')">Assign trainer</button>`:''}<button class="btn sm" onclick="openBatch('${esc(b.id)}')">Open</button></td></tr>`).join('')||'<tr><td colspan="8" class="muted">No batches yet.</td></tr>'}
  </tbody></table></div>`;
}
function batchDialog(courseId,centreId){
  const c=S.courses[courseId], limit=batchLimit(centreId);
  const ss=myStudents().filter(s=>s.status==='allocated'&&s.centreId===centreId&&s.skillId===courseId).sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
  const start=new Date(Date.now()+14*864e5).toISOString().slice(0,10), end=new Date(Date.now()+(14+Math.round(c.hours/120*30))*864e5).toISOString().slice(0,10);
  openModal(`<div class="mh"><h3 style="margin:0">Form a batch</h3><button class="btn sm" onclick="closeModal()">Close</button></div>
  <form class="mb" id="batchForm" onsubmit="event.preventDefault();createBatch(this,'${esc(courseId)}','${esc(centreId)}',${limit})">
  <dl class="kv"><dt>Trade</dt><dd>${esc(c.name)} (${esc(c.id)})</dd><dt>Centre</dt><dd>${esc(centreName(centreId))} — up to ${limit} trainees per batch</dd></dl>
  <div class="grid g2" style="margin-top:10px"><div class="field"><label>Start date</label><input name="start" type="date" min="${today()}" required value="${start}"></div>
  <div class="field"><label>End date</label><input name="end" type="date" required value="${end}"></div></div>
  <h3>Trainees <span class="small muted" id="bpCount"></span></h3>
  <div class="tw"><table><thead><tr><th></th><th>Application ID</th><th>Name</th><th>Applied</th></tr></thead><tbody>${ss.map((s,i)=>`<tr><td><input type="checkbox" class="bpick" value="${esc(s.id)}" ${i<limit?'checked':''} onchange="bpCount(${limit})"></td><td class="id">${esc(s.id)}</td><td>${esc(s.name)}</td><td class="small">${fmtD(s.createdAt)}</td></tr>`).join('')}</tbody></table></div>
  <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn primary">Create batch and notify trainees</button></div></form>`,true);
  bpCount(limit);
}
function bpCount(limit){const n=$$('.bpick:checked').length;$('#bpCount').textContent=`${n} of at most ${limit} selected`;$('#bpCount').className='small '+(n>limit?'err':'muted')}
async function createBatch(f,course,centre,limit){
  const ids=$$('.bpick:checked').map(i=>i.value);
  if(!ids.length){toast('Choose at least one trainee.');return}
  if(ids.length>limit){toast(`This centre can take at most ${limit} trainees in one batch.`);return}
  if(f.end.value<=f.start.value){toast('End date must be after the start date.');return}
  const r=await act('create_batch',{course,centre,start:f.start.value,end:f.end.value,ids});
  if(r){toast(`Batch ${r.id} created with ${ids.length} trainees. The Training Manager will assign a trainer.`);closeModal();render()}
}
function openBatch(id){
  const b=S.batches[id]; const st=b.students.map(x=>S.students[x]).filter(Boolean);
  openModal(`<div class="mh"><h3 style="margin:0">Batch ${esc(b.id)}</h3><button class="btn sm" onclick="closeModal()">Close</button></div>
  <div class="mb"><dl class="kv"><dt>Skill</dt><dd>${esc(courseName(b.courseId))} (${esc(b.courseId)})</dd><dt>Centre</dt><dd>${esc(centreName(b.centreId))} (${esc(b.centreId)})</dd><dt>Dates</dt><dd>${fmtD(b.start)} – ${fmtD(b.end)}</dd><dt>Trainer</dt><dd>${trainerLabel(b)}</dd><dt>Status</dt><dd>${esc(b.status)}</dd><dt>Created by</dt><dd>${esc(b.createdBy)} on ${fmtD(b.createdAt)}</dd>
  <dt>SIDH batch ID</dt><dd>${sidhField('batch',b.id,b.sidhBatchId,can('centre','training'))}</dd></dl>
  <h3 style="margin-top:16px">Trainees (${st.length})</h3><div class="tw"><table><thead><tr><th>Student ID</th><th>Name</th><th>Mobile</th><th>Status</th></tr></thead><tbody>${st.map(s=>`<tr><td class="id">${esc(s.id)}</td><td>${esc(s.name)}</td><td>${esc(s.mobile)}</td><td>${statusTag(s.status)}</td></tr>`).join('')}</tbody></table></div></div>
  <div class="mf">${b.status!=='completed'&&can('training')?`<button class="btn" onclick="assignDialog('${id}')">${b.trainerId?'Change trainer':'Assign trainer'}</button>`:''}${b.status==='planned'&&can('training','centre')?`<button class="btn primary" onclick="startBatch('${id}')">Start training</button>`:''}<button class="btn" onclick="exportBatch('${id}')">Download list (CSV)</button><button class="btn" onclick="downloadSidhSheet(['${esc(id)}'])">SIDH data sheet (Excel)</button></div>`,true);
}
/* An ID from Skill India Digital Hub, shown with a small form for officers who may record it. */
function sidhField(kind,id,val,editable){
  if(!editable) return val?`<span class="id">${esc(val)}</span>`:'<span class="muted">Not linked yet</span>';
  return `<form class="row" style="gap:6px" onsubmit="event.preventDefault();saveSidhId('${kind}','${esc(id)}',this.v.value.trim(),this)"><input name="v" value="${esc(val||'')}" maxlength="40" placeholder="Not linked yet" style="max-width:200px;padding:5px 8px" aria-label="SIDH ID"><button class="btn sm">Save</button></form>`;
}
async function saveSidhId(kind,id,v,form){
  if(v&&!/^[A-Za-z0-9\/_.-]{1,40}$/.test(v)){toast('Use letters, numbers, / _ . - only.');return}
  if(await act('set_sidh_id',{kind,id,sidhId:v},v?'SIDH ID saved.':'SIDH ID removed.')) form.v.value=v;
}
async function startBatch(id){
  if(!S.batches[id].trainerId){toast('Assign a trainer before starting the batch.');return}
  if(await act('start_batch',{id},'Batch started. Trainees notified.')){closeModal();render()}
}

/* ---------- Trainers: registration, verification, empanelment, assignment ---------- */
const TSTATUS={submitted:['Submitted','info'],returned:['Returned for correction','warn'],verified:['Documents verified','info'],empanelled:['Empanelled','ok'],rejected:['Rejected','bad'],inactive:['Inactive','']};
const tStatusTag=s=>`<span class="tag ${TSTATUS[s]?.[1]||''}">${esc(TSTATUS[s]?.[0]||s)}</span>`;
/* Documents required by the trainer recruitment advertisement; the rest are optional. */
const TRAINER_DOCS=[
  {key:'photo',label:'Passport-size photograph',req:true,img:true},
  {key:'aadhaar',label:'Aadhaar card (copy)',req:true},
  {key:'qual',label:'Educational qualification certificates (Class X onwards)',req:true},
  {key:'caste',label:'Tribe / caste certificate',req:true},
  {key:'prc',label:'Proof of residence in the KAAC area',req:true},
  {key:'exp',label:'Experience certificate(s), if any',req:false},
  {key:'tot',label:'Training of Trainers (ToT) certificate',req:false},
  {key:'resume',label:'Résumé / CV',req:false},
  {key:'bank',label:'Bank passbook first page (for honorarium)',req:false}
];
const trainerBatches = tid => list('batches').filter(b=>b.trainerId===tid).sort((a,b)=>b.start.localeCompare(a.start));
const eligibleTrainers = courseId => list('trainers').filter(t=>t.status==='empanelled'&&(t.courses||[]).includes(courseId));
const trainerClash = (tid,start,end,except) => list('batches').find(b=>b.id!==except&&b.trainerId===tid&&b.status!=='completed'&&b.start<=end&&start<=b.end);
function trainerLabel(b){const t=S.trainers[b.trainerId];return t?`${esc(t.name)} <span class="muted small">(${esc(t.id)})</span>`:(b.trainer?esc(b.trainer):'<span class="tag warn">Not assigned</span>')}

/* Public registration form */
/* Trainers apply against an open recruitment advertisement (#trainer/<recruitment ID>). */
function vTrainerReg(){
  const centres=list('centres').filter(c=>c.active); const open=openRecruitments();
  const r=S.recruitments[routeArg]?.open?S.recruitments[routeArg]:(open.length===1?open[0]:null);
  if(!r) return `${pageHead('Trainer application')}${open.length?`<div class="panel"><h3>Choose the recruitment you are applying for</h3>${open.map(x=>`<div class="row" style="justify-content:space-between;padding:8px 0;border-bottom:1px dashed var(--line)"><span><b>${esc(x.title)}</b><span class="small muted"> · last date ${esc(fmtD(x.lastDate))}</span></span><a class="btn sm primary" href="#trainer/${esc(x.id)}">Apply</a></div>`).join('')}</div>`
    :'<div class="panel">Trainer applications are accepted only while a recruitment is open. There is none open right now. See <a href="#recruitment">Recruitment</a> for past and upcoming advertisements.</div>'}`;
  const lo=new Date(r.lastDate); const maxDob=new Date(lo.getFullYear()-r.minAge,lo.getMonth(),lo.getDate()).toISOString().slice(0,10);
  return `${pageHead('Trainer application',r.title)}
  <div class="panel flat" style="margin-bottom:16px"><div class="row" style="justify-content:space-between"><div><b>${esc(r.title)}</b> <span class="small muted">${esc(r.id)}</span>
    <div class="small">Eligibility: ${esc(r.minQual)} pass or above · age ${r.minAge}–${r.maxAge} years as on ${esc(fmtD(r.lastDate))}${r.remuneration?' · '+esc(r.remuneration):''}</div>
    <div class="small rt-last">Last date for applications: ${esc(fmtD(r.lastDate))}</div></div><a class="btn sm" href="#recruitment">Read the advertisement</a></div></div>
  <p class="muted">Shortlisted candidates are called for an interview / personality test. Fields marked <span style="color:var(--bad)">*</span> are required.</p>
  <form id="trForm" novalidate><input type="hidden" name="recruitmentId" value="${esc(r.id)}">
  <fieldset><legend>Aadhaar and contact</legend><div class="grid g3">
    <div class="field"><label>Aadhaar number <span class="req">*</span></label><input name="aadhaar" inputmode="numeric" maxlength="14" placeholder="12-digit number" autocomplete="off"><div class="hint">Only the last 4 digits are stored on record.${DEMO?` <a href="#" onclick="event.preventDefault();document.querySelector('#trForm [name=aadhaar]').value=testAadhaar()">Fill a test number</a>`:''}</div></div>
    <div class="field"><label>Mobile number <span class="req">*</span></label><input name="mobile" inputmode="numeric" maxlength="10" placeholder="10 digits"></div>
    <div class="field"><label>Email <span class="req">*</span></label><input name="email" type="email" placeholder="name@example.com"><div class="hint">Batch assignments are sent here and by SMS</div></div>
  </div></fieldset>
  <fieldset><legend>Personal details</legend><div class="grid g4">
    <div class="field"><label>Full name (as in Aadhaar) <span class="req">*</span></label><input name="name"></div>
    <div class="field"><label>Father’s / spouse’s name <span class="req">*</span></label><input name="father"></div>
    <div class="field"><label>Date of birth <span class="req">*</span></label><input name="dob" type="date" max="${maxDob}"><div class="hint">Age ${r.minAge}–${r.maxAge} as on ${esc(fmtD(r.lastDate))}</div></div>
    <div class="field"><label>Gender <span class="req">*</span></label><select name="gender"><option value="">Select</option><option>Female</option><option>Male</option><option>Transgender</option></select></div>
  </div></fieldset>
  <fieldset><legend>Address</legend><div class="grid g3">
    <div class="field"><label>House, village / town <span class="req">*</span></label><input name="address"></div>
    <div class="field"><label>District <span class="req">*</span></label><select name="district"><option value="">Select</option><option>Karbi Anglong</option><option>West Karbi Anglong</option><option>Other</option></select></div>
    <div class="field"><label>PIN code <span class="req">*</span></label><input name="pin" inputmode="numeric" maxlength="6"></div>
  </div></fieldset>
  <fieldset><legend>Qualification and experience</legend><div class="grid g3">
    <div class="field"><label>Highest qualification <span class="req">*</span></label><select name="qual"><option value="">Select</option>${QUALS.map(q=>`<option>${q}</option>`).join('')}</select></div>
    <div class="field"><label>Subject / trade specialisation <span class="req">*</span></label><input name="specialisation" placeholder="e.g. Computer applications, Hotel management"></div>
    <div class="field"><label>Industry experience (years) <span class="req">*</span></label><input name="indExp" type="number" min="0" max="50" step="0.5"></div>
    <div class="field"><label>Training experience (years) <span class="req">*</span></label><input name="trnExp" type="number" min="0" max="50" step="0.5"></div>
    <div class="field"><label>ToT certificate number</label><input name="totNo" placeholder="If certified"></div>
    <div class="field"><label>ToT certifying body</label><input name="totBody" placeholder="e.g. NSDC / Sector Skill Council"></div>
    <div class="field"><label>SIDH trainer ID (if registered)</label><input name="sidhId" maxlength="40" autocomplete="off"><div class="hint">Your trainer ID on ${sidhLink()}</div></div>
  </div></fieldset>
  <fieldset><legend>Skills you can teach <span class="req">*</span></legend>
    <p class="small muted">Tick every course you are qualified to train. You are only assigned to batches of these skills.</p>
    ${list('sectors').map(s=>{const cs=list('courses').filter(c=>c.active&&c.sectorId===s.id);return cs.length?`<div style="margin-bottom:12px"><b class="small">${esc(s.name)}</b><div class="chips" style="margin-top:6px">${cs.map(c=>`<label class="chip" style="font-weight:500"><input type="checkbox" name="skill" value="${c.id}"> ${esc(c.name)}</label>`).join('')}</div></div>`:''}).join('')}
  </fieldset>
  <fieldset><legend>Preferred centres</legend>
    <div class="chips" style="margin-bottom:12px">${centres.map(c=>`<label class="chip" style="font-weight:500"><input type="checkbox" name="pc" value="${c.id}"> ${esc(c.name)}</label>`).join('')}</div>
  </fieldset>
  <fieldset><legend>Documents</legend>
    <p class="small muted">JPG, PNG or PDF. Photos are resized automatically. PDFs can be up to 2 MB.</p>
    <div class="grid g2">${TRAINER_DOCS.map(d=>`<div class="field"><label>${d.label} ${d.req?'<span class="req">*</span>':''}</label><input type="file" name="doc_${d.key}" accept="${d.img?'image/*':'image/*,application/pdf'}"></div>`).join('')}</div>
  </fieldset>
  <div class="panel flat" style="margin-bottom:16px"><label style="display:flex;gap:10px;font-weight:500"><input type="checkbox" name="declare"> I declare that the information and documents are genuine. I consent to the use of my Aadhaar number for identity verification for empanelment only.</label></div>
  <div id="trErr" class="err" style="font-size:14px;margin-bottom:12px"></div>
  <div class="row"><button class="btn primary" type="submit" id="trBtn">Submit application</button><a class="btn" href="#recruitment">Cancel</a></div>
  </form>`;
}
function wireTrainer(){
  const f=$('#trForm'); if(!f) return; const a=f.elements.aadhaar;
  a.addEventListener('input',()=>{const v=a.value.replace(/\D/g,'').slice(0,12);a.value=v.replace(/(\d{4})(?=\d)/g,'$1 ')});
  f.addEventListener('submit',submitTrainer);
}
async function submitTrainer(e){
  e.preventDefault(); const f=e.target, err=$('#trErr'); err.textContent='';
  const v=n=>f.elements[n].value.trim(); const aadhaar=v('aadhaar').replace(/\s/g,'');
  const skills=[...f.querySelectorAll('[name=skill]:checked')].map(i=>i.value);
  const pcs=[...f.querySelectorAll('[name=pc]:checked')].map(i=>i.value);
  const p=[];
  if(!validAadhaar(aadhaar)) p.push('Enter a valid 12-digit Aadhaar number (the check digit does not match).');
  if(!/^[6-9]\d{9}$/.test(v('mobile'))) p.push('Enter a valid 10-digit mobile number starting with 6–9.');
  if(!/^\S+@\S+\.\S+$/.test(v('email'))) p.push('Enter a valid email address.');
  [['name','full name'],['father','father’s / spouse’s name'],['dob','date of birth'],['gender','gender'],['address','address'],['district','district'],['qual','highest qualification'],['specialisation','specialisation']].forEach(([n,l])=>{if(!v(n))p.push('Fill in '+l+'.')});
  const rec=S.recruitments[v('recruitmentId')];
  if(v('dob')&&rec){const a=ageOn(v('dob'),rec.lastDate);if(a<rec.minAge||a>rec.maxAge)p.push(`Age must be ${rec.minAge} to ${rec.maxAge} years as on ${fmtD(rec.lastDate)} (yours: ${a}).`)}
  if(v('qual')&&rec&&QUALS.indexOf(v('qual'))<QUALS.indexOf(rec.minQual)) p.push(`The minimum qualification is ${rec.minQual} pass.`);
  if(!/^\d{6}$/.test(v('pin'))) p.push('Enter a 6-digit PIN code.');
  if(v('indExp')===''||+v('indExp')<0) p.push('Enter industry experience in years (0 if none).');
  if(v('trnExp')===''||+v('trnExp')<0) p.push('Enter training experience in years (0 if none).');
  if(!skills.length) p.push('Tick at least one skill you can teach.');
  TRAINER_DOCS.filter(d=>d.req).forEach(d=>{if(!f.elements['doc_'+d.key].files[0])p.push('Upload '+d.label.toLowerCase()+'.')});
  if(!f.elements.declare.checked) p.push('Tick the declaration to continue.');
  if(p.length){showErrors(err,p.join('\n'));return}
  const btn=$('#trBtn'); btn.disabled=true; btn.textContent='Uploading documents…';
  try{
    const fd=new FormData();
    ['recruitmentId','mobile','email','name','father','dob','gender','address','district','pin','qual','specialisation','indExp','trnExp','totNo','totBody','sidhId'].forEach(n=>fd.append(n,v(n)));
    fd.append('aadhaar',aadhaar); fd.append('declare','1');
    skills.forEach(c=>fd.append('skill[]',c)); pcs.forEach(c=>fd.append('pc[]',c));
    await addFiles(fd,f,TRAINER_DOCS);
    const d=await api('trainer_register',{method:'POST',form:fd});
    route='track'; history.replaceState(null,'','#track'); render();
    showTracked(d,v('dob'),true);
  }catch(ex){showErrors(err,ex.message||'Could not submit. Try again.');btn.disabled=false;btn.textContent='Submit trainer registration'}
}

/* Trainer status page (via Track application) */
function trainerTrackHTML(t){
  const bs=trainerBatches(t.id);
  return `<div class="grid g2"><div class="panel">
    <div class="row" style="align-items:flex-start">${t.photo?`<img class="photo" src="${esc(t.photo)}" alt="">`:''}<div><h2 style="margin-bottom:4px">${esc(t.name)}</h2><div class="muted small">${esc(t.id)} · Trainer</div><div style="margin-top:8px">${tStatusTag(t.status)}</div></div></div>
    <hr class="sep"><dl class="kv">${t.recruitmentId?`<dt>Applied for</dt><dd>${esc(S.recruitments[t.recruitmentId]?.title||t.recruitmentId)}</dd>`:''}${t.empanelNo?`<dt>Empanelment no.</dt><dd>${esc(t.empanelNo)}</dd>`:''}<dt>Skills</dt><dd>${(t.courses||[]).map(c=>esc(courseName(c))).join(', ')}</dd><dt>Experience</dt><dd>${t.indExp} yrs industry, ${t.trnExp} yrs training</dd></dl>
    ${bs.length?`<h3 style="margin-top:16px">Assigned batches</h3><div class="tw"><table><thead><tr><th>Batch</th><th>Skill</th><th>Centre</th><th>Dates</th><th>Status</th></tr></thead><tbody>${bs.map(b=>`<tr><td class="id">${esc(b.id)}</td><td>${esc(courseName(b.courseId))}</td><td>${esc(centreName(b.centreId))}<div class="small muted">${esc(b.centreId)}</div></td><td class="small">${fmtD(b.start)} – ${fmtD(b.end)}</td><td><span class="tag">${esc(b.status)}</span></td></tr>`).join('')}</tbody></table></div>`:''}
    ${t.status==='returned'?tResubmitHTML(t):''}
  </div>
  <div class="panel"><h3>Progress</h3><ul class="tl">${[...(t.history||[])].reverse().map(h=>`<li><b>${esc(h.action)}</b>${h.remark?`<div>${esc(h.remark)}</div>`:''}<small>${fmtDT(h.at)} · ${esc(h.role)}</small></li>`).join('')}</ul></div></div>`;
}
function tResubmitHTML(t){
  const flagged=(t.docs||[]).filter(d=>d.status==='rejected');
  const keys=flagged.length?flagged.map(d=>d.key):TRAINER_DOCS.map(d=>d.key);
  return `<hr class="sep"><h3>Correct and resubmit</h3><p class="small">${esc(t.history.slice(-1)[0]?.remark||'')}</p>
  <form onsubmit="event.preventDefault();resubmit(this,TRAINER_DOCS)">${keys.map(k=>{const d=TRAINER_DOCS.find(x=>x.key===k);return `<div class="field"><label>${d.label}</label><input type="file" name="doc_${k}" accept="${d.img?'image/*':'image/*,application/pdf'}"></div>`}).join('')}
  <button class="btn primary">Resubmit registration</button></form>`;
}
/* Staff: trainer list, verification and empanelment */
let trF={status:'',course:'',q:''};
function sTrainers(){
  let ts=list('trainers');
  if(ME.role==='centre'){const mine=new Set(list('batches').filter(b=>inMyCentre(b.centreId)).map(b=>b.trainerId));ts=ts.filter(t=>mine.has(t.id))}
  if(trF.status) ts=ts.filter(t=>t.status===trF.status);
  if(trF.course) ts=ts.filter(t=>(t.courses||[]).includes(trF.course));
  if(trF.q){const q=trF.q.toLowerCase();ts=ts.filter(t=>(t.id+t.name+t.mobile+t.specialisation).toLowerCase().includes(q))}
  ts.sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  const hint={dealing:'Open a registration to check documents, then mark it verified, return it for correction or reject it.',training:'Empanel verified trainers. Only empanelled trainers can be assigned to batches.',centre:'Trainers assigned to batches at your centre.'}[ME.role]||'';
  return `<h1>Trainers</h1>${hint?`<p class="muted">${hint}</p>`:''}
  <p class="small muted">Trainers apply online against a <a href="#recruitment">recruitment advertisement</a>, which you publish under Recruitment.</p>
  <div class="row" style="margin-bottom:12px">
    <select style="max-width:200px" onchange="trF.status=this.value;render()"><option value="">All statuses</option>${Object.entries(TSTATUS).map(([k,v])=>`<option value="${k}" ${trF.status===k?'selected':''}>${v[0]}</option>`).join('')}</select>
    <select style="max-width:260px" onchange="trF.course=this.value;render()"><option value="">All skills</option>${list('courses').map(c=>`<option value="${c.id}" ${trF.course===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select>
    <input style="max-width:240px" placeholder="Search name, ID, mobile" value="${esc(trF.q)}" onchange="trF.q=this.value;render()">
    <span class="muted small" style="margin-left:auto">${ts.length} shown</span>
  </div>
  <div class="tw"><table><thead><tr><th>Trainer ID</th><th>Name</th><th>Skills</th><th>Experience</th><th>ToT</th><th>Batches</th><th>Status</th><th></th></tr></thead><tbody>
  ${ts.map(t=>{const cs=(t.courses||[]);const bs=trainerBatches(t.id);const act=bs.filter(b=>b.status!=='completed').length;return `<tr><td class="id">${esc(t.id)}</td><td>${esc(t.name)}<div class="small muted">${esc(t.specialisation)}</div></td>
    <td class="small">${cs.slice(0,2).map(c=>esc(courseName(c))).join(', ')}${cs.length>2?` +${cs.length-2} more`:''}</td><td class="small">${t.indExp} yrs industry<br>${t.trnExp} yrs training</td>
    <td>${t.totNo?'<span class="tag ok">Yes</span>':'<span class="tag">No</span>'}</td><td class="small">${act} active<br>${bs.length-act} completed</td><td>${tStatusTag(t.status)}</td><td><button class="btn sm" onclick="openTrainer('${t.id}')">Open</button></td></tr>`}).join('')||'<tr><td colspan="8" class="muted">No trainers match these filters.</td></tr>'}
  </tbody></table></div>`;
}
function openTrainer(id){
  const t=S.trainers[id]; const bs=trainerBatches(id); const actions=[];
  if(can('dealing')&&t.status==='submitted') actions.push(`<button class="btn danger" onclick="trainerAction('${id}','reject')">Reject</button><button class="btn" onclick="trainerAction('${id}','return')">Return for correction</button><button class="btn primary" onclick="trainerAction('${id}','verify')">Mark documents verified</button>`);
  if(can('training')&&t.status==='verified') actions.push(`<button class="btn danger" onclick="trainerAction('${id}','reject')">Reject</button><button class="btn primary" onclick="trainerAction('${id}','empanel')">Empanel trainer</button>`);
  if(can('training')&&t.status==='empanelled') actions.push(`<button class="btn danger" onclick="trainerAction('${id}','inactive')">Mark inactive</button>`);
  if(can('training')&&t.status==='inactive') actions.push(`<button class="btn primary" onclick="trainerAction('${id}','reactivate')">Reactivate</button>`);
  openModal(`<div class="mh"><h3 style="margin:0">${esc(t.name)} · ${esc(t.id)}</h3><button class="btn sm" onclick="closeModal()">Close</button></div>
  <div class="mb"><div class="grid g2">
    <div><div class="row" style="align-items:flex-start;margin-bottom:12px">${t.photo?`<img class="photo" src="${esc(t.photo)}" alt="">`:''}<div>${tStatusTag(t.status)}<div class="small muted" style="margin-top:6px">Registered ${fmtDT(t.createdAt)}</div></div></div>
      <dl class="kv">${t.recruitmentId?`<dt>Recruitment</dt><dd>${esc(S.recruitments[t.recruitmentId]?.title||'')} (${esc(t.recruitmentId)})</dd>`:''}<dt>Aadhaar</dt><dd>XXXX XXXX ${esc(t.aadhaarLast4)}</dd><dt>Father / spouse</dt><dd>${esc(t.father)}</dd><dt>Date of birth</dt><dd>${fmtD(t.dob)} (age ${age(t.dob)})</dd><dt>Gender</dt><dd>${esc(t.gender)}</dd>
      <dt>Mobile / email</dt><dd>${esc(t.mobile)}<br>${esc(t.email)}</dd><dt>Address</dt><dd>${esc([t.address,t.district,t.pin].filter(Boolean).join(', '))}</dd>
      <dt>Qualification</dt><dd>${esc(t.qual)} · ${esc(t.specialisation)}</dd><dt>Experience</dt><dd>${t.indExp} yrs industry, ${t.trnExp} yrs training</dd>
      <dt>ToT certificate</dt><dd>${t.totNo?esc(t.totNo)+(t.totBody?' · '+esc(t.totBody):''):'Not certified'}</dd>
      <dt>SIDH trainer ID</dt><dd>${sidhField('trainer',t.id,t.sidhId,can('dealing','training'))}</dd>
      ${t.empanelNo?`<dt>Empanelment no.</dt><dd>${esc(t.empanelNo)}</dd>`:''}
      <dt>Skills</dt><dd>${(t.courses||[]).map(c=>`${esc(courseName(c))} <span class="muted small">(${esc(c)})</span>`).join('<br>')}</dd>
      <dt>Preferred centres</dt><dd>${(t.prefCentres||[]).map(c=>esc(c)).join(', ')||'Any'}</dd></dl>
      ${bs.length?`<h3 style="margin-top:16px">Batches</h3>${bs.map(b=>`<div class="small" style="padding:5px 0;border-bottom:1px dashed var(--line)"><b>${esc(b.id)}</b> · ${esc(courseName(b.courseId))} · ${esc(b.centreId)}<div class="muted">${fmtD(b.start)} – ${fmtD(b.end)} · ${esc(b.status)}</div></div>`).join('')}`:''}
    </div>
    <div><h3>Documents</h3>${(t.docs||[]).map(d=>`<div class="row" style="justify-content:space-between;padding:7px 0;border-bottom:1px dashed var(--line)"><span class="small"><b>${esc(d.label)}</b><br><span class="muted">${esc(d.name)}</span></span>
      <span class="row" style="gap:6px">${d.status==='ok'?'<span class="tag ok">OK</span>':d.status==='rejected'?'<span class="tag bad">Incorrect</span>':''}<button class="btn sm" onclick="viewDoc('${esc(d.docId)}','${esc(d.type)}')">View</button>
      ${can('dealing')&&t.status==='submitted'?`<button class="btn sm" onclick="markTDoc('${id}','${d.key}','ok')">OK</button><button class="btn sm danger" onclick="markTDoc('${id}','${d.key}','rejected')">Incorrect</button>`:''}</span></div>`).join('')}
      <div id="docView" style="margin-top:12px"></div>
      <h3 style="margin-top:16px">History</h3><ul class="tl">${[...(t.history||[])].reverse().map(h=>`<li><b>${esc(h.action)}</b>${h.remark?`<div class="small">${esc(h.remark)}</div>`:''}<small>${fmtDT(h.at)} · ${esc(h.by)} (${esc(h.role)})</small></li>`).join('')}</ul></div>
  </div>
  ${actions.length?`<div class="field" style="margin-top:12px"><label>Remark</label><textarea id="trRemark" placeholder="Required when returning, rejecting or marking inactive"></textarea></div>`:''}
  </div>${actions.length?`<div class="mf">${actions.join('')}</div>`:''}`,true);
}
async function markTDoc(id,key,status){if(await act('mark_doc',{kind:'trainer',id,key,status}))openTrainer(id)}
async function trainerAction(id,action){
  const t=S.trainers[id]; const remark=($('#trRemark')?.value||'').trim();
  if(['reject','return','inactive'].includes(action)&&!remark){toast('Add a remark explaining the reason.');$('#trRemark').focus();return}
  if(action==='inactive'&&trainerBatches(id).some(b=>b.status!=='completed')){toast('Reassign this trainer’s active batches first.');return}
  if(action==='verify'&&t.docs.some(d=>d.status==='rejected')){toast('A document is marked incorrect. Return the registration instead.');return}
  if(await act('trainer_action',{id,act:action,remark},'Saved. Trainer notified by SMS and email.')){closeModal();render()}
}

/* Assigning trainers to batches */
function assignDialog(bid){
  const b=S.batches[bid];
  const ts=eligibleTrainers(b.courseId).map(t=>({t,clash:trainerClash(t.id,b.start,b.end,bid),pref:(t.prefCentres||[]).includes(b.centreId),active:trainerBatches(t.id).filter(x=>x.status!=='completed').length}))
    .sort((x,y)=>(!!x.clash-!!y.clash)||(y.pref-x.pref)||(x.active-y.active)||(y.t.trnExp-x.t.trnExp));
  openModal(`<div class="mh"><h3 style="margin:0">${b.trainerId?'Change':'Assign'} trainer · ${esc(b.id)}</h3><button class="btn sm" onclick="closeModal()">Close</button></div>
  <form class="mb" onsubmit="event.preventDefault();assignTrainer('${bid}',this)">
  <p class="small muted">${esc(courseName(b.courseId))} (${esc(b.courseId)}) at ${esc(centreName(b.centreId))} (${esc(b.centreId)}), ${fmtD(b.start)} – ${fmtD(b.end)}. Only empanelled trainers for this skill are listed. Trainers already teaching another batch on these dates can’t be chosen.</p>
  ${ts.length?`<div class="tw"><table><thead><tr><th></th><th>Trainer</th><th>Experience</th><th>Prefers this centre</th><th>Active batches</th><th>Availability</th></tr></thead><tbody>
  ${ts.map(({t,clash,pref,active})=>`<tr><td><input type="radio" name="tid" value="${esc(t.id)}" ${clash?'disabled':''} ${b.trainerId===t.id?'checked':''} aria-label="Choose ${esc(t.name)}"></td><td>${esc(t.name)}<div class="small muted">${esc(t.id)}${t.totNo?' · ToT certified':''}</div></td><td class="small">${t.trnExp} yrs training<br>${t.indExp} yrs industry</td><td>${pref?'<span class="tag ok">Yes</span>':'—'}</td><td>${active}</td>
    <td class="small">${clash?`<span class="tag bad">Busy</span><div class="muted">${esc(clash.id)} until ${fmtD(clash.end)}</div>`:'<span class="tag ok">Available</span>'}</td></tr>`).join('')}</tbody></table></div>`
  :'<div class="callout">No empanelled trainer is registered for this skill yet. Empanel a trainer from the Trainers page first.</div>'}
  <div class="row" style="justify-content:flex-end;margin-top:14px">${b.trainerId?`<button type="button" class="btn danger" onclick="unassignTrainer('${bid}')">Remove current trainer</button>`:''}${ts.length?`<button class="btn primary">Assign and notify trainer</button>`:''}</div></form>`,true);
}
async function assignTrainer(bid,f){
  const tid=(f.querySelector('[name=tid]:checked')||{}).value; if(!tid){toast('Choose a trainer.');return}
  const b=S.batches[bid]; if(tid===b.trainerId){closeModal();return}
  const c=trainerClash(tid,b.start,b.end,bid); if(c){toast(`This trainer is busy with ${c.id} on those dates.`);return}
  const name=S.trainers[tid].name;
  if(await act('assign_trainer',{bid,tid},`${name} assigned to ${bid}. Trainer notified.`)){closeModal();render()}
}
async function unassignTrainer(bid){
  const b=S.batches[bid]; if(!b.trainerId) return;
  if(b.status==='ongoing'&&!confirm('This batch is in training. Remove its trainer anyway?')) return;
  if(await act('unassign_trainer',{bid},'Trainer removed from batch.')){closeModal();render()}
}

/* ---------- Results ---------- */
function sResults(){
  const bs=list('batches').filter(b=>b.status==='ongoing'&&inMyCentre(b.centreId));
  const done=list('batches').filter(b=>b.status==='completed'&&inMyCentre(b.centreId));
  return `<h1>Attendance & results</h1><p class="muted">Record attendance and assessment marks when a batch finishes. Trainees with at least 70% attendance and 50 marks pass.</p>
  ${bs.map(b=>{const st=b.students.map(x=>S.students[x]).filter(Boolean);return `<div class="panel" style="margin-bottom:16px"><div class="row" style="justify-content:space-between"><h3 style="margin:0">${esc(b.id)} · ${esc(courseName(b.courseId))}</h3><span class="small muted">${esc(centreName(b.centreId))} · Trainer: ${S.trainers[b.trainerId]?esc(S.trainers[b.trainerId].name):'not assigned'} · ends ${fmtD(b.end)}</span></div>
    <form onsubmit="event.preventDefault();saveResults('${b.id}',this)"><div class="tw" style="margin-top:10px"><table><thead><tr><th>Student ID</th><th>Name</th><th>Attendance %</th><th>Marks /100</th></tr></thead><tbody>
    ${st.map(s=>`<tr><td class="id">${esc(s.id)}</td><td>${esc(s.name)}</td><td><input name="att_${s.id}" type="number" min="0" max="100" value="${s.result?.attendance??''}" style="max-width:110px" ${can('centre')?'':'disabled'}></td><td><input name="mk_${s.id}" type="number" min="0" max="100" value="${s.result?.marks??''}" style="max-width:110px" ${can('centre')?'':'disabled'}></td></tr>`).join('')}
    </tbody></table></div>${can('centre')?`<div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn primary">Save results and close batch</button></div>`:''}</form></div>`}).join('')||'<div class="panel">No batches in training right now. Start a planned batch from Batches.</div>'}
  ${done.length?`<h3 style="margin-top:20px">Completed batches</h3><div class="tw"><table><thead><tr><th>Batch</th><th>Skill</th><th>Passed</th><th>Not passed</th></tr></thead><tbody>${done.map(b=>{const st=b.students.map(x=>S.students[x]).filter(Boolean);const p=st.filter(s=>s.result?.result==='Pass').length;return `<tr><td class="id">${esc(b.id)}</td><td>${esc(courseName(b.courseId))}</td><td>${p}</td><td>${st.length-p}</td></tr>`}).join('')}</tbody></table></div>`:''}`;
}
async function saveResults(bid,f){
  const b=S.batches[bid]; const rows=[];
  for(const sid of b.students){const a=f.elements['att_'+sid].value, m=f.elements['mk_'+sid].value;if(a===''||m===''){toast('Enter attendance and marks for every trainee.');return}rows.push({sid,att:+a,marks:+m})}
  if(!confirm('Save these results and close the batch? Results cannot be changed afterwards.')) return;
  if(await act('save_results',{bid,rows},'Results saved and batch closed.')) render();
}

/* ---------- Certificates ---------- */
function sCerts(){
  const st=myStudents(); const passed=st.filter(s=>s.status==='passed'); const certs=st.filter(s=>s.cert).sort((a,b)=>b.cert.issuedAt.localeCompare(a.cert.issuedAt));
  return `<h1>Certificates</h1>
  ${can('training')?`<div class="panel" style="margin-bottom:18px"><div class="row" style="justify-content:space-between"><h3 style="margin:0">Passed, waiting for certificate (${passed.length})</h3>${passed.length?`<button class="btn primary" onclick="issueCerts(${esc(JSON.stringify(passed.map(s=>s.id)))})">Generate all certificates</button>`:''}</div>
  <div class="tw" style="margin-top:10px"><table><thead><tr><th>Student ID</th><th>Name</th><th>Skill</th><th>Grade</th><th></th></tr></thead><tbody>${passed.map(s=>`<tr><td class="id">${esc(s.id)}</td><td>${esc(s.name)}</td><td>${esc(courseName(s.skillId))}</td><td>${esc(s.result.grade)}</td><td><button class="btn sm primary" onclick="issueCerts(['${esc(s.id)}'])">Generate</button></td></tr>`).join('')||'<tr><td colspan="5" class="muted">No one is waiting.</td></tr>'}</tbody></table></div></div>`:''}
  <h3>Issued certificates</h3><div class="tw"><table><thead><tr><th>Certificate no.</th><th>Student</th><th>Skill ID</th><th>Centre ID</th><th>Issued</th><th></th></tr></thead><tbody>
  ${certs.map(s=>`<tr><td class="id">${esc(s.cert.no)}</td><td>${esc(s.name)}<div class="small muted">${esc(s.id)}</div></td><td>${esc(s.skillId)}</td><td>${esc(s.centreId)}</td><td class="small">${fmtD(s.cert.issuedAt)}</td><td><button class="btn sm" onclick="openDoc('cert','${s.id}')">View</button></td></tr>`).join('')||'<tr><td colspan="6" class="muted">No certificates issued yet.</td></tr>'}
  </tbody></table></div>`;
}
async function issueCerts(ids){
  const r=await act('issue_certs',{ids});
  if(r){toast(`${r.issued} certificate(s) generated.`);render()}
}

/* ---------- OJT letters ---------- */
function sOjt(){
  const os=list('ojt').filter(o=>inMyCentre(S.students[o.studentId]?.centreId)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  return `<h1>OJT recommendation letters</h1><p class="muted">Certified trainees can be recommended for on-the-job training. The Joint Secretary signs each letter.</p>
  ${can('training','centre')?`<button class="btn primary" style="margin-bottom:14px" onclick="ojtDialog()">Draft a recommendation letter</button>`:''}
  <div class="tw"><table><thead><tr><th>Letter no.</th><th>Trainee</th><th>Employer</th><th>Start</th><th>Status</th><th></th></tr></thead><tbody>
  ${os.map(o=>{const s=S.students[o.studentId]||{};return `<tr><td class="id">${esc(o.letterNo)}</td><td>${esc(s.name)}<div class="small muted">${esc(o.studentId)}</div></td><td>${esc(o.employer)}<div class="small muted">${esc(o.role)}</div></td><td class="small">${fmtD(o.start)} · ${esc(o.duration)}</td>
    <td>${o.status==='signed'?`<span class="tag ok">Signed</span><div class="small muted">${fmtD(o.signedAt)}</div>`:'<span class="tag warn">Awaiting signature</span>'}</td>
    <td class="row" style="gap:6px"><button class="btn sm" onclick="openDoc('ojt','${o.id}')">View</button>${o.status==='pending'&&can('jts')?`<button class="btn sm primary" onclick="signDialog('${o.id}')">Sign</button>`:''}</td></tr>`}).join('')||'<tr><td colspan="6" class="muted">No letters yet.</td></tr>'}
  </tbody></table></div>`;
}
function ojtDialog(){
  const certs=myStudents().filter(s=>s.status==='certified');
  if(!certs.length){toast('No certified trainees yet. Certificates come first.');return}
  openModal(`<div class="mh"><h3 style="margin:0">Draft OJT recommendation</h3><button class="btn sm" onclick="closeModal()">Close</button></div>
  <form class="mb" onsubmit="event.preventDefault();createOjt(this)"><div class="grid g2">
  <div class="field"><label>Trainee</label><select name="sid" required>${certs.map(s=>`<option value="${esc(s.id)}">${esc(s.name)} · ${esc(s.id)} · ${esc(courseName(s.skillId))}</option>`).join('')}</select></div>
  <div class="field"><label>Employer / establishment</label><input name="employer" required></div>
  <div class="field"><label>Employer address</label><input name="address" required></div>
  <div class="field"><label>OJT role</label><input name="role" required placeholder="e.g. Trainee front office associate"></div>
  <div class="field"><label>Start date</label><input name="start" type="date" required min="${today()}"></div>
  <div class="field"><label>Duration</label><select name="duration"><option>1 month</option><option>2 months</option><option>3 months</option><option>6 months</option></select></div>
  </div><div class="row" style="justify-content:flex-end"><button class="btn primary">Send to Joint Secretary for signature</button></div></form>`);
}
async function createOjt(f){
  const data={sid:f.sid.value,employer:f.employer.value.trim(),address:f.address.value.trim(),role:f.role.value.trim(),start:f.start.value,duration:f.duration.value};
  if(await act('create_ojt',data,'Letter drafted and sent for signature.')){closeModal();render()}
}
function signDialog(id){
  openModal(`<div class="mh"><h3 style="margin:0">Sign recommendation letter</h3><button class="btn sm" onclick="closeModal()">Close</button></div>
  <form class="mb" onsubmit="event.preventDefault();signOjt('${id}',this)"><p>Review the letter, then confirm with your password to sign it as ${esc(settings().jtsDesignation)}.</p>
  <button type="button" class="btn" onclick="openDoc('ojt','${id}',true)">Preview letter</button>
  <div class="field" style="margin-top:14px;max-width:300px"><label>Your password</label><input type="password" name="p" required autocomplete="current-password"></div>
  <div id="signErr" class="err"></div><div class="row" style="justify-content:flex-end"><button class="btn primary">Sign letter</button></div></form>`);
}
async function signOjt(id,f){
  $('#signErr').textContent='';
  try{await api('sign_ojt',{method:'POST',data:{id,password:f.p.value}})}catch(e){$('#signErr').textContent=e.message;return}
  toast('Letter signed. Trainee notified.'); closeModal(); await refresh();
}

/* ---------- Mapping ---------- */
function sMapping(){
  const st=myStudents().filter(s=>s.centreId);
  return `<h1>Centre mapping</h1><p class="muted">Every trainee placed in a batch is mapped to a Skill ID, a Centre ID and the batch’s trainer.</p>
  <div class="grid g3" style="margin-bottom:18px">${list('centres').filter(c=>inMyCentre(c.id)).map(c=>`<div class="panel flat"><b>${esc(c.id)}</b><div>${esc(c.name)}</div><div class="small muted">${c.sectors.map(sectorName).join(', ')}</div><div class="small" style="margin-top:6px">${st.filter(s=>s.centreId===c.id).length} trainees mapped</div></div>`).join('')}</div>
  <div class="tw"><table><thead><tr><th>Student ID</th><th>Name</th><th>Skill ID</th><th>Skill</th><th>Centre ID</th><th>Batch ID</th><th>Trainer ID</th><th>Status</th></tr></thead><tbody>
  ${st.map(s=>`<tr><td class="id">${esc(s.id)}</td><td>${esc(s.name)}</td><td class="id">${esc(s.skillId)}</td><td>${esc(courseName(s.skillId))}</td><td class="id">${esc(s.centreId)}</td><td>${esc(s.batchId)}</td><td class="id">${esc(S.batches[s.batchId]?.trainerId||'—')}</td><td>${statusTag(s.status)}</td></tr>`).join('')||'<tr><td colspan="8" class="muted">No trainees mapped yet. Mapping happens when a batch is formed.</td></tr>'}
  </tbody></table></div>`;
}

/* ---------- Notifications log ---------- */
let notifCh='';
function sNotifs(){
  const ns=list('notifs').filter(n=>!notifCh||n.channel===notifCh).sort((a,b)=>b.at.localeCompare(a.at)).slice(0,300);
  const st=settings();
  return `<h1>SMS & email log</h1>
  <div class="callout" style="margin-bottom:14px">A message is generated for every status change. Emails are sent by the mail worker: <b>Sent</b> means the mail server accepted it, <b>Queued</b> means it is waiting, and <b>Logged</b> means no mail server is configured yet. ${!st.smsGateway?'SMS messages are logged only, because no SMS gateway is connected.':''}</div>
  <div class="chips" style="margin-bottom:12px">${['','SMS','Email'].map(c=>`<button class="chip" aria-pressed="${notifCh===c}" onclick="notifCh='${c}';render()">${c||'All'}</button>`).join('')}</div>
  <div class="tw"><table><thead><tr><th>Time</th><th>Channel</th><th>To</th><th>Message</th><th>Status</th></tr></thead><tbody>
  ${ns.map(n=>`<tr><td class="small" style="white-space:nowrap">${fmtDT(n.at)}</td><td><span class="tag">${n.channel}</span></td><td class="small">${esc(n.to)}<div class="muted">${esc(n.studentId)}</div></td><td class="small">${n.subject?`<b>${esc(n.subject)}</b><br>`:''}${esc(n.body)}</td><td class="small">${esc(n.status)}</td></tr>`).join('')||'<tr><td colspan="5" class="muted">No messages yet.</td></tr>'}
  </tbody></table></div>`;
}

/* ---------- Master data (admin) ---------- */
let masterTab='courses';
function sMaster(){
  const tabs=[['courses','Courses'],['sectors','Sectors'],['centres','Centres']];
  let body='';
  if(masterTab==='courses') body=`<div class="tw"><table><thead><tr><th>Skill ID</th><th>Course</th><th>Sector</th><th>QP code</th><th>NSQF</th><th>Hours</th><th>Min. qualification</th><th>Age</th><th>Seats</th><th>Active</th><th></th></tr></thead><tbody>${list('courses').sort((a,b)=>a.id.localeCompare(b.id)).map(c=>`<tr><td class="id">${esc(c.id)}</td><td>${esc(c.name)}${c.jobRole&&c.jobRole!==c.name?`<div class="small muted">${esc(c.jobRole)}</div>`:''}</td><td>${esc(sectorName(c.sectorId))}</td><td class="small">${esc(c.qpCode||'—')}</td><td>${c.nsqf}</td><td>${c.hours}</td><td>${esc(c.minQual)}</td><td>${c.minAge}–${c.maxAge}</td><td>${c.seats}</td><td>${c.active?'Yes':'No'}</td><td><button class="btn sm" onclick="editRec('courses','${c.id}')">Edit</button></td></tr>`).join('')}</tbody></table></div>`;
  if(masterTab==='sectors') body=`<div class="tw"><table><thead><tr><th>Sector ID</th><th>Name</th><th>Description</th><th>Courses</th><th></th></tr></thead><tbody>${list('sectors').map(s=>`<tr><td class="id">${esc(s.id)}</td><td>${esc(s.name)}</td><td class="small">${esc(s.desc)}</td><td>${list('courses').filter(c=>c.sectorId===s.id).length}</td><td><button class="btn sm" onclick="editRec('sectors','${s.id}')">Edit</button></td></tr>`).join('')}</tbody></table></div>`;
  if(masterTab==='centres') body=`<div class="tw"><table><thead><tr><th>Centre ID</th><th>Name</th><th>Type</th><th>Nearby town</th><th>Sectors</th><th>Per batch</th><th>Facilities</th><th>Active</th><th></th></tr></thead><tbody>${list('centres').sort((a,b)=>a.id.localeCompare(b.id)).map(c=>`<tr><td class="id">${esc(c.id)}</td><td>${esc(c.name)}<div class="small muted">${esc(c.address)}, ${esc(c.district)}</div></td><td class="small">${esc(c.type)}${c.hod?`<div class="muted">HoD: ${esc(c.hod)}</div>`:''}</td><td class="small">${esc(c.nearbyTown||'—')}${c.sidhTcId?`<div class="muted">TC ID ${esc(c.sidhTcId)}</div>`:''}</td><td class="small">${c.sectors.map(sectorName).join(', ')}</td><td>${c.capacity}</td><td class="small">${esc(c.facilities||'—')}</td><td>${c.active?'Yes':'No'}</td><td><button class="btn sm" onclick="editRec('centres','${esc(c.id)}')">Edit</button></td></tr>`).join('')}</tbody></table></div>`;
  return `<h1>Courses, sectors & centres</h1>
  <div class="row" style="margin-bottom:14px"><div class="chips">${tabs.map(([k,l])=>`<button class="chip" aria-pressed="${masterTab===k}" onclick="masterTab='${k}';render()">${l}</button>`).join('')}</div>
  <button class="btn primary" style="margin-left:auto" onclick="editRec('${masterTab}')">Add ${masterTab.slice(0,-1)}</button></div>${body}`;
}
function editRec(coll,id){
  const r=id?S[coll][id]:null; const isNew=!r; let f='';
  if(coll==='courses') f=`<div class="grid g3">
    <div class="field"><label>Skill ID</label><input name="id" value="${esc(r?.id||'')}" ${r?'readonly':''} placeholder="SKL-IT-04" required></div>
    <div class="field"><label>Course name</label><input name="name" value="${esc(r?.name||'')}" required></div>
    <div class="field"><label>Sector</label><select name="sectorId">${list('sectors').map(s=>`<option value="${s.id}" ${r?.sectorId===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}</select></div>
    <div class="field"><label>NSQF level</label><input name="nsqf" type="number" min="1" max="10" value="${r?.nsqf||4}"></div>
    <div class="field"><label>Duration (hours)</label><input name="hours" type="number" min="1" value="${r?.hours||300}"></div>
    <div class="field"><label>Minimum qualification</label><select name="minQual">${QUALS.map(q=>`<option ${r?.minQual===q?'selected':''}>${q}</option>`).join('')}</select></div>
    <div class="field"><label>Minimum age</label><input name="minAge" type="number" value="${r?.minAge||18}"></div>
    <div class="field"><label>Maximum age</label><input name="maxAge" type="number" value="${r?.maxAge||35}"></div>
    <div class="field"><label>Seats per session</label><input name="seats" type="number" value="${r?.seats||30}"></div>
    <div class="field"><label>Active</label><select name="active"><option value="1">Yes</option><option value="0" ${r&&!r.active?'selected':''}>No</option></select></div></div>
    <h3 style="margin-top:6px">Skill India Digital Hub</h3><p class="small muted">As listed in SIDH’s Qualification Pack listing for this job role.</p>
    <div class="grid g3"><div class="field"><label>Job role (official name)</label><input name="jobRole" value="${esc(r?.jobRole||'')}"></div>
    <div class="field"><label>QP code</label><input name="qpCode" value="${esc(r?.qpCode||'')}" placeholder="e.g. ELE/Q3101"></div>
    <div class="field"><label>Sector Skill Council</label><input name="ssc" value="${esc(r?.ssc||'')}" placeholder="e.g. Electronics Sector Skills Council"></div></div>`;
  if(coll==='sectors') f=`<div class="grid g2"><div class="field"><label>Sector ID</label><input name="id" value="${esc(r?.id||'')}" ${r?'readonly':''} placeholder="Short code, e.g. LOG" required></div><div class="field"><label>Name</label><input name="name" value="${esc(r?.name||'')}" required></div></div><div class="field"><label>Description</label><textarea name="desc">${esc(r?.desc||'')}</textarea></div>`;
  if(coll==='centres'){const next='KAAC-C-'+String(list('centres').length+1).padStart(3,'0');f=`<div class="grid g3">
    <div class="field"><label>Centre ID</label><input name="id" value="${esc(r?.id||next)}" ${r?'readonly':''} required><div class="hint">Unique and permanent once created</div></div>
    <div class="field"><label>Centre name</label><input name="name" value="${esc(r?.name||'')}" required></div>
    <div class="field"><label>District</label><select name="district"><option ${r?.district==='Karbi Anglong'?'selected':''}>Karbi Anglong</option><option ${r?.district==='West Karbi Anglong'?'selected':''}>West Karbi Anglong</option></select></div>
    <div class="field"><label>Address</label><input name="address" value="${esc(r?.address||'')}"></div>
    <div class="field"><label>Nearby town</label><input name="nearbyTown" value="${esc(r?.nearbyTown||'')}"></div>
    <div class="field"><label>SIDH Training Centre ID</label><input name="sidhTcId" value="${esc(r?.sidhTcId||'')}" placeholder="TC ID issued on SIDH"></div>
    <div class="field"><label>Phone</label><input name="phone" value="${esc(r?.phone||'')}"></div>
    <div class="field"><label>Type</label><select name="type" onchange="document.getElementById('hodField').hidden=this.value!=='Government institute'"><option ${r?.type!=='Private'?'selected':''}>Government institute</option><option ${r?.type==='Private'?'selected':''}>Private</option></select></div>
    <div class="field" id="hodField" ${r?.type==='Private'?'hidden':''}><label>Head of Department</label><input name="hod" value="${esc(r?.hod||'')}" placeholder="Name and designation"><div class="hint">Required for Government institutes</div></div>
    <div class="field"><label>Capacity (trainees per batch)</label><input name="capacity" type="number" min="1" max="500" value="${r?.capacity||30}" required><div class="hint">Batches here are limited to this, and never more than ${MAXBATCH}</div></div>
    <div class="field"><label>Active</label><select name="active"><option value="1">Yes</option><option value="0" ${r&&!r.active?'selected':''}>No</option></select></div></div>
    <div class="field"><label>Facilities</label><textarea name="facilities" rows="2" placeholder="e.g. computer lab with 30 systems, workshop, hostel">${esc(r?.facilities||'')}</textarea></div>
    <div class="field"><label>Sectors offered</label><div class="chips">${list('sectors').map(s=>`<label class="chip" style="font-weight:500"><input type="checkbox" name="sec" value="${s.id}" ${r?.sectors?.includes(s.id)?'checked':''}> ${esc(s.name)}</label>`).join('')}</div></div>`}
  openModal(`<div class="mh"><h3 style="margin:0">${isNew?'Add':'Edit'} ${coll.slice(0,-1)}</h3><button class="btn sm" onclick="closeModal()">Close</button></div>
  <form class="mb" onsubmit="event.preventDefault();saveRec('${coll}',this,${isNew})">${f}
  <div class="row" style="justify-content:flex-end">${!isNew&&coll!=='centres'?`<button type="button" class="btn danger" onclick="removeRec('${coll}','${id}')">Delete</button>`:''}<button class="btn primary">Save</button></div></form>`,true);
}
async function saveRec(coll,f,isNew){
  const id=f.id.value.trim().toUpperCase(); if(!/^[A-Z0-9-]+$/.test(id)){toast('IDs can use letters, numbers and hyphens only.');return}
  if(isNew&&S[coll][id]){toast('That ID already exists.');return}
  const o={id};
  if(coll==='courses') Object.assign(o,{name:f.name.value,sectorId:f.sectorId.value,nsqf:+f.nsqf.value,hours:+f.hours.value,minQual:f.minQual.value,minAge:+f.minAge.value,maxAge:+f.maxAge.value,seats:+f.seats.value,active:f.active.value==='1',jobRole:f.jobRole.value.trim(),qpCode:f.qpCode.value.trim(),ssc:f.ssc.value.trim()});
  if(coll==='sectors') Object.assign(o,{name:f.name.value,desc:f.desc.value});
  if(coll==='centres') Object.assign(o,{name:f.name.value,district:f.district.value,address:f.address.value,phone:f.phone.value,capacity:+f.capacity.value,active:f.active.value==='1',sectors:[...f.querySelectorAll('[name=sec]:checked')].map(i=>i.value),
    type:f.type.value,hod:f.type.value==='Government institute'?f.hod.value.trim():'',nearbyTown:f.nearbyTown.value.trim(),facilities:f.facilities.value.trim(),sidhTcId:f.sidhTcId.value.trim()});
  if(await act('save_master',{coll,isNew,data:o},'Saved.')){closeModal();render()}
}
async function removeRec(coll,id){
  if(coll==='sectors'&&list('courses').some(c=>c.sectorId===id)){toast('Move or delete this sector’s courses first.');return}
  if(!confirm('Delete this record? This cannot be undone.')) return;
  if(await act('remove_master',{coll,id},'Deleted.')){closeModal();render()}
}

/* ---------- Users ---------- */
function sUsers(){
  return `<h1>Users & roles</h1><div class="row" style="margin-bottom:14px"><span class="muted">Each officer logs in with their own account. Centre Managers see only their centre.</span><button class="btn primary" style="margin-left:auto" onclick="editUser()">Add user</button></div>
  <div class="tw"><table><thead><tr><th>Username</th><th>Name</th><th>Role</th><th>Centre</th><th>Last login</th><th>Status</th><th></th></tr></thead><tbody>
  ${list('users').sort((a,b)=>a.role.localeCompare(b.role)).map(u=>`<tr><td class="id">${esc(u.id)}</td><td>${esc(u.name)}</td><td>${ROLES[u.role]}</td><td>${esc(u.centreId||'—')}</td><td class="small">${u.lastLogin?fmtDT(u.lastLogin):'Never'}</td><td>${u.active?'<span class="tag ok">Active</span>':'<span class="tag">Disabled</span>'}</td><td><button class="btn sm" onclick="editUser('${esc(u.id)}')">Edit</button></td></tr>`).join('')}
  </tbody></table></div>`;
}
function editUser(id){
  const u=id?S.users[id]:null;
  openModal(`<div class="mh"><h3 style="margin:0">${u?'Edit':'Add'} user</h3><button class="btn sm" onclick="closeModal()">Close</button></div>
  <form class="mb" onsubmit="event.preventDefault();saveUser(this,${!u})"><div class="grid g2">
  <div class="field"><label>Username</label><input name="id" value="${esc(u?.id||'')}" ${u?'readonly':''} required></div>
  <div class="field"><label>Full name</label><input name="name" value="${esc(u?.name||'')}" required></div>
  <div class="field"><label>Role</label><select name="role">${Object.entries(ROLES).map(([k,v])=>`<option value="${k}" ${u?.role===k?'selected':''}>${v}</option>`).join('')}</select></div>
  <div class="field"><label>Centre (Centre Manager only, optional)</label><select name="centreId"><option value="">All centres</option>${list('centres').map(c=>`<option value="${c.id}" ${u?.centreId===c.id?'selected':''}>${esc(c.name)} (${c.id})</option>`).join('')}</select></div>
  <div class="field"><label>${u?'New password (leave blank to keep)':'Password'}</label><input name="pw" type="password" ${u?'':'required'} minlength="10" autocomplete="new-password"><div class="hint">At least 10 characters, with letters and numbers.</div></div>
  <div class="field"><label>Status</label><select name="active"><option value="1">Active</option><option value="0" ${u&&!u.active?'selected':''}>Disabled</option></select></div>
  </div><div class="row" style="justify-content:flex-end"><button class="btn primary">Save user</button></div></form>`);
}
async function saveUser(f,isNew){
  const id=f.id.value.trim().toLowerCase(); if(!/^[a-z0-9._-]+$/.test(id)){toast('Username can use lowercase letters, numbers, dot, dash and underscore.');return}
  if(isNew&&S.users[id]){toast('That username is taken.');return}
  if(f.role.value==='centre'&&!f.centreId.value){toast('Choose a centre for the Centre Manager.');return}
  if(id===ME.id&&f.active.value==='0'){toast('You cannot disable your own account.');return}
  const data={isNew,id,name:f.name.value.trim(),role:f.role.value,centreId:f.role.value==='centre'?f.centreId.value:'',active:f.active.value==='1',pw:f.pw.value};
  if(await act('save_user',data,'User saved.')){closeModal();render()}
}
/* Any officer can change their own password. */
function passwordDialog(){
  openModal(`<div class="mh"><h3 style="margin:0">Change my password</h3><button class="btn sm" onclick="closeModal()">Close</button></div>
  <form class="mb" onsubmit="event.preventDefault();changePassword(this)">
  <div class="field"><label>Current password</label><input name="current" type="password" required autocomplete="current-password"></div>
  <div class="field"><label>New password</label><input name="pw" type="password" required minlength="10" autocomplete="new-password"><div class="hint">At least 10 characters, with letters and numbers.</div></div>
  <div class="field"><label>Repeat new password</label><input name="pw2" type="password" required autocomplete="new-password"></div>
  <div id="pwErr" class="err"></div><div class="row" style="justify-content:flex-end"><button class="btn primary">Change password</button></div></form>`);
}
async function changePassword(f){
  const err=$('#pwErr'); err.textContent='';
  if(f.pw.value!==f.pw2.value){err.textContent='The new passwords do not match.';return}
  try{await api('change_password',{method:'POST',data:{current:f.current.value,pw:f.pw.value}});toast('Password changed.');closeModal()}
  catch(e){err.textContent=e.message}
}

/* ---------- Settings ---------- */
function sSettings(){
  const s=settings();
  return `<h1>Settings</h1><form class="panel" onsubmit="event.preventDefault();saveSettings(this)">
  <h3>Letterhead and signatory</h3><div class="grid g2">
  <div class="field"><label>Department name</label><input name="deptName" value="${esc(s.deptName)}"></div>
  <div class="field"><label>Council</label><input name="council" value="${esc(s.council)}"></div>
  <div class="field"><label>Office address</label><input name="address" value="${esc(s.address)}"></div>
  <div class="field"><label>Joint Secretary’s name (printed on OJT letters)</label><input name="jtsName" value="${esc(s.jtsName)}"></div>
  <div class="field"><label>Signatory designation</label><input name="jtsDesignation" value="${esc(s.jtsDesignation)}"></div></div>
  <h3>Website</h3><div class="grid g2">
  <div class="field"><label>Council logo</label><div class="row"><span class="logo-slot" style="width:56px;height:56px"><img src="${esc(s.logo||LOGO_KAACLOGO)}" alt=""></span><input type="file" id="logoFile" accept="image/*" style="max-width:260px"></div>
    <div class="hint">The KAAC logo is used by default. Upload a different one only if needed. <label style="display:inline;font-weight:500"><input type="checkbox" id="logoRemove"> Remove current logo</label></div></div>
  <div class="field"><label>Helpline phone</label><input name="phone" value="${esc(s.phone)}"></div>
  <div class="field"><label>Contact email</label><input name="email" value="${esc(s.email)}"></div>
  <div class="field"><label>Office hours</label><input name="officeHours" value="${esc(s.officeHours)}"></div></div>
  <div class="field"><label>About the department (one paragraph per line)</label><textarea name="aboutText" rows="6">${esc(s.aboutText)}</textarea></div>
  <h3>Applications and batches</h3>
  <div class="field" style="max-width:260px"><label>Maximum trainees in one batch</label><input name="maxBatchSize" type="number" min="1" max="200" value="${esc(s.maxBatchSize||45)}"><div class="hint">A centre with a lower capacity takes fewer</div></div>
  <div class="field"><label>Extra message in the application acknowledgement email</label><textarea name="ackEmailText" rows="3">${esc(s.ackEmailText)}</textarea><div class="hint">Sent with the application number when a student applies</div></div>
  <div class="field"><label>Extra message in the selection email</label><textarea name="selectionEmailText" rows="3">${esc(s.selectionEmailText)}</textarea><div class="hint">Sent to every candidate the Joint Secretary approves</div></div>
  <h3>Skill India Digital Hub</h3><p class="small muted">The department’s identifiers on ${sidhLink()}. They are included in the SIDH data sheets downloaded from Batches.</p><div class="grid g3">
  <div class="field"><label>Training Partner ID (TP ID)</label><input name="sidhTpId" value="${esc(s.sidhTpId||'')}"></div>
  <div class="field"><label>Project ID</label><input name="sidhProjectId" value="${esc(s.sidhProjectId||'')}"></div>
  <div class="field"><label>Scheme name on SIDH</label><input name="sidhScheme" value="${esc(s.sidhScheme||'')}" placeholder="e.g. state scheme name"></div></div>
  <h3>Notifications</h3><p class="small muted">Email is sent through the mail server set in the server’s <code>.env</code> file (SMTP_HOST and related settings). Record the SMS gateway details here; its API keys also belong in <code>.env</code> — never put secret keys in this page.</p><div class="grid g2">
  <div class="field"><label>SMS sender ID (DLT header)</label><input name="smsSender" value="${esc(s.smsSender)}" placeholder="e.g. KAACSD"></div>
  <div class="field"><label>SMS gateway name</label><input name="smsGateway" value="${esc(s.smsGateway)}" placeholder="Leave blank if not connected"></div></div>
  <h3>Fallback highlights</h3><div class="field"><label>Shown in the ticker only when no notices are published (one per line)</label><textarea name="notices" rows="4">${esc(s.notices)}</textarea></div>
  <button class="btn primary">Save settings</button></form>`;
}
async function saveSettings(f){const o={};[...f.elements].forEach(el=>{if(el.name)o[el.name]=el.value});
  const lf=$('#logoFile').files[0]; if(lf){try{o.logo=await readImage(lf,240,.92,'image/png')}catch(e){toast('Could not read the logo image.');return}} else if($('#logoRemove').checked) o.logoRemove=true;
  if(await act('save_settings',o,'Settings saved.')) render()}

/* ---------- CSV export ---------- */
function saveFile(filename,data){
  const url=URL.createObjectURL(new Blob([data]));
  const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),10000);
}
// A leading = + - @ would make spreadsheet programs run the cell as a formula.
const csvCell=v=>{let t=String(v??'');if(/^[=+\-@\t\r]/.test(t))t="'"+t;return `"${t.replace(/"/g,'""')}"`};
function saveBlob(filename,blob){
  const url=URL.createObjectURL(blob); const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),10000);
}
function exportCSV(){
  const cols=['id','name','father','dob','gender','category','mobile','email','village','district','qual','pref1','skillId','centreId','batchId','status','admitNo','certNo','createdAt'];
  const rows=[cols.join(',')].concat(myStudents().map(s=>cols.map(c=>csvCell(c==='status'?STATUS[s.status]?.[0]:s[c])).join(',')));
  saveFile(`kaac-sde-applications-${today()}.csv`,rows.join('\n'));
}
function exportBatch(id){const b=S.batches[id];const rows=['Student ID,Name,Mobile,Skill ID,Centre ID,Batch ID,Status'].concat(b.students.map(x=>S.students[x]).filter(Boolean).map(s=>[s.id,s.name,s.mobile,b.courseId,b.centreId,b.id,STATUS[s.status]?.[0]].map(csvCell).join(',')));saveFile(`${id}.csv`,rows.join('\n'))}

/* ============================== Printable documents ============================== */
const DOC_CSS=`
.d{font-family:"Noto Sans",Arial,sans-serif;color:#1A2321;background:#fff;width:100%;max-width:780px;margin:0 auto;padding:34px 40px;box-sizing:border-box;position:relative}
.d h1,.d h2{font-family:"Source Serif 4",Georgia,serif;margin:0}
.d .wv{height:9px;background:repeating-linear-gradient(90deg,#A8322A 0 22px,#1A2321 22px 26px,#C98F12 26px 30px,#1A2321 30px 34px,#F4F1E8 34px 36px,#1A2321 36px 48px,#2B6550 48px 52px,#1A2321 52px 58px);-webkit-print-color-adjust:exact;print-color-adjust:exact}
.d .lh{display:flex;gap:14px;align-items:center;padding:14px 0;border-bottom:2px solid #1E4A3B}
.d .sl{width:54px;height:54px;border-radius:50%;background:#1E4A3B;color:#fff;display:flex;align-items:center;justify-content:center;font:700 14px Georgia,serif;-webkit-print-color-adjust:exact;print-color-adjust:exact;flex:none}
.d .lh b{display:block;font:600 17px "Source Serif 4",Georgia,serif}.d .lh span{font-size:12px;color:#4a5753}
.d table{width:100%;border-collapse:collapse;font-size:13.5px;margin:14px 0}.d td{border:1px solid #c9d2ce;padding:7px 10px;vertical-align:top}.d td.k{width:34%;color:#4a5753;background:#f3f6f5;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.d .ttl{text-align:center;margin:18px 0 6px;font:600 20px "Source Serif 4",Georgia,serif;letter-spacing:.02em}
.d .sig{display:flex;justify-content:space-between;align-items:flex-end;margin-top:34px;font-size:13px;gap:20px}
.d .sig div{text-align:center;min-width:180px}.d .sig .ln{border-top:1px solid #1A2321;padding-top:5px}
.d .small{font-size:12px;color:#4a5753}.d ol{font-size:13px;padding-left:20px}.d p{font-size:14px;line-height:1.65;margin:0 0 12px}
.d.cert{border:12px solid #1E4A3B;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}.d.cert .in{padding:30px 44px;text-align:center}
.d.cert .name{font:600 30px "Source Serif 4",Georgia,serif;color:#1E4A3B;margin:10px 0 4px}
.d .stamp{border:2px solid #1E4A3B;color:#1E4A3B;padding:8px 12px;border-radius:6px;font-size:11.5px;text-align:left;display:inline-block;max-width:320px}
.d .draft{position:absolute;top:40%;left:0;right:0;text-align:center;font:700 64px Georgia,serif;color:rgba(168,50,42,.15);transform:rotate(-18deg);pointer-events:none}
.d .qr svg{width:84px;height:84px}
`;
function qrSVG(text){try{const q=qrcode(0,'M');q.addData(text);q.make();return q.createSvgTag(3,2)}catch(e){return ''}}
/* Absolute URLs, so downloaded copies of these documents still show the logo. */
const absUrl = u => new URL(u, location.href).href;
const docLogo = () => esc(settings().logo || absUrl(LOGO_KAACLOGO));
function letterhead(){const s=settings();return `<div class="wv"></div><div class="lh"><img src="${docLogo()}" alt="" style="width:62px;height:62px;object-fit:contain;flex:none"><div><b>${esc(s.deptName)}</b><span>${esc(s.council)} · ${esc(s.address)}</span></div></div>`}
function docAdmit(s){
  return `<div class="d">${letterhead()}<div class="ttl">ADMIT CARD — Aptitude Test &amp; Counselling, ${YEAR}</div>
  <div style="display:flex;gap:18px;align-items:flex-start"><table style="flex:1">
   <tr><td class="k">Admit card no.</td><td><b>${esc(s.admit.no)}</b></td></tr><tr><td class="k">Application / Student ID</td><td>${esc(s.id)}</td></tr>
   <tr><td class="k">Name</td><td><b>${esc(s.name)}</b></td></tr><tr><td class="k">Father’s name</td><td>${esc(s.father)}</td></tr>
   <tr><td class="k">Date of birth</td><td>${fmtD(s.dob)}</td></tr><tr><td class="k">Aadhaar</td><td>XXXX XXXX ${esc(s.aadhaarLast4)}</td></tr>
   <tr><td class="k">Course applied</td><td>${esc(courseName(s.pref1))} (${esc(s.pref1)})</td></tr><tr><td class="k">Category</td><td>${esc(s.category)}</td></tr>
   <tr><td class="k">Test date &amp; time</td><td><b>${fmtD(s.admit.date)}, ${esc(s.admit.time)}</b></td></tr><tr><td class="k">Venue</td><td><b>${esc(s.admit.venue)}</b></td></tr></table>
   <div style="text-align:center;padding-top:14px">${s.photo?`<img src="${esc(s.photo)}" style="width:110px;height:136px;object-fit:cover;border:1px solid #999">`:'<div style="width:110px;height:136px;border:1px dashed #999;font-size:11px;display:flex;align-items:center;justify-content:center">Affix photo</div>'}<div class="qr" style="margin-top:8px">${qrSVG('KAAC-SDE ADMIT '+s.admit.no+' '+s.id)}</div></div></div>
  <b style="font-size:13px">Instructions</b><ol><li>Report 30 minutes before the reporting time with this admit card.</li><li>Bring your original Aadhaar card and qualification certificate for verification.</li><li>Mobile phones are not allowed in the test hall.</li><li>This admit card does not guarantee selection. Selection depends on the test and counselling.</li></ol>
  <div class="sig"><div><div class="ln">Signature of candidate</div></div><div><div class="small">Issued electronically on ${fmtD(s.admit.issuedAt)}</div><div class="ln">${esc(s.admit.by||'')}<br>Supervising Officer</div></div></div></div>`;
}
function docCert(s){
  const c=S.courses[s.skillId]||{}; const b=S.batches[s.batchId]||{}; const st=settings();
  return `<div class="d cert"><div class="wv"></div><div class="in">
  <img src="${docLogo()}" alt="" style="display:block;margin:0 auto 8px;width:78px;height:78px;object-fit:contain">
  <div style="font:600 15px 'Source Serif 4',Georgia,serif">${esc(st.deptName)}</div><div class="small">${esc(st.council)}</div>
  <h1 style="font-size:32px;margin:22px 0 4px;color:#1A2321">Certificate of Skill Training</h1><div class="small">Certificate no. ${esc(s.cert.no)}</div>
  <p style="margin-top:22px">This is to certify that</p><div class="name">${esc(s.name)}</div>
  <p>${s.gender==='Female'?'daughter':s.gender==='Male'?'son':'child'} of ${esc(s.father)}, Student ID ${esc(s.id)}, has successfully completed the training programme in</p>
  <div style="font:600 21px 'Source Serif 4',Georgia,serif;margin:4px 0">${esc(c.name||s.skillId)}</div>
  <p>Skill ID ${esc(s.skillId)}${c.qpCode?` · QP ${esc(c.qpCode)}`:''} · NSQF Level ${esc(c.nsqf||'')} · ${esc(c.hours||'')} hours<br>at ${esc(centreName(s.centreId))} (Centre ID ${esc(s.centreId)}), batch ${esc(s.batchId)}, from ${fmtD(b.start)} to ${fmtD(b.end)},<br>and has been awarded <b>Grade ${esc(s.result?.grade||'')}</b>.</p>
  <div class="sig" style="margin-top:40px"><div class="qr">${qrSVG(absUrl('#verify/'+encodeURIComponent(s.cert.no)))}<div class="small">Scan to verify on the portal</div></div>
  <div><div class="small">Date of issue: ${fmtD(s.cert.issuedAt)}</div><div class="ln">${esc(s.cert.by||'')}<br>Training Manager</div></div></div></div><div class="wv"></div></div>`;
}
function docOjt(o){
  const s=S.students[o.studentId]||{}; const st=settings(); const c=S.courses[s.skillId]||{};
  return `<div class="d">${o.status!=='signed'?'<div class="draft">DRAFT</div>':''}${letterhead()}
  <div style="display:flex;justify-content:space-between;font-size:13px;margin:16px 0"><span>No. ${esc(o.letterNo)}</span><span>Dated: ${fmtD(o.signedAt||o.createdAt)}</span></div>
  <p>To<br>The Manager / HR Head<br><b>${esc(o.employer)}</b><br>${esc(o.address)}</p>
  <p><b>Subject: Recommendation for On-the-Job Training of ${esc(s.name)}</b></p>
  <p>Sir / Madam,</p>
  <p>This is to recommend <b>${esc(s.name)}</b>, ${s.gender==='Female'?'daughter':s.gender==='Male'?'son':'child'} of ${esc(s.father)}, resident of ${esc([s.village,s.district].filter(Boolean).join(', '))}, Student ID ${esc(s.id)}, who has successfully completed training in <b>${esc(c.name||s.skillId)}</b> (Skill ID ${esc(s.skillId)}, NSQF Level ${esc(c.nsqf||'')}) at ${esc(centreName(s.centreId))} (Centre ID ${esc(s.centreId)}) under the ${esc(st.deptName)}, ${esc(st.council)}. The candidate holds certificate no. ${esc(s.cert?.no||'—')} with Grade ${esc(s.result?.grade||'—')}.</p>
  <p>You are requested to kindly engage the candidate for On-the-Job Training as <b>${esc(o.role)}</b> for a period of <b>${esc(o.duration)}</b> commencing from <b>${fmtD(o.start)}</b>. The department will be grateful for a short feedback report on the candidate’s performance at the end of the training.</p>
  <p>Thanking you.</p>
  <div class="sig"><div class="qr">${o.status==='signed'?qrSVG('KAAC-SDE OJT '+o.letterNo+' SIG '+o.sigRef):''}</div>
  <div style="text-align:left">${o.status==='signed'?`<div class="stamp"><b>Digitally signed by ${esc(o.signedBy)}</b><br>${esc(st.jtsDesignation)}, ${esc(st.deptName)}<br>${fmtDT(o.signedAt)}<br>Signature ref. ${esc(o.sigRef)}</div>`:'<div class="small" style="min-height:60px">Awaiting signature</div>'}
  <div style="margin-top:8px;font-size:13px"><b>${esc(o.signedBy||st.jtsName)}</b><br>${esc(st.jtsDesignation)}<br>${esc(st.deptName)}<br>${esc(st.council)}</div></div></div>
  <p class="small" style="margin-top:24px">Copy to: ${esc(centreName(s.centreId))}, for information. · The candidate, for information.</p></div>`;
}
let currentDoc=null;
async function openDoc(kind,id,preview){
  let html,name;
  // Staff lists carry a link to the photo; fetch the record with the photo itself so printed and downloaded copies include it.
  if(kind==='admit'&&ME&&S.students[id]?.photo&&!S.students[id].photo.startsWith('data:')){try{const r=await api('student',{query:{id}});S.students[id]={...S.students[id],photo:r.student.photo}}catch(e){}}
  if(kind==='admit'){const s=S.students[id];html=docAdmit(s);name=`Admit-card-${s.admit.no}`}
  if(kind==='cert'){const s=S.students[id];html=docCert(s);name=`Certificate-${s.cert.no}`}
  if(kind==='ojt'){const o=S.ojt[id];html=docOjt(o);name=`OJT-letter-${o.letterNo}`}
  currentDoc={html,name};
  openModal(`<div class="mh"><h3 style="margin:0">${esc(name.replace(/-/g,' ').replace(/^(\w+) (\w+)/,'$1 $2'))}</h3><button class="btn sm" onclick="${preview?`signDialog('${esc(id)}')`:'closeModal()'}">${preview?'Back':'Close'}</button></div>
  <div class="mb"><div class="docpreview"><style>${DOC_CSS}</style>${html}</div></div>
  <div class="mf"><button class="btn" onclick="printDoc()">Print</button><button class="btn primary" onclick="downloadDoc()">Download</button></div>`,true);
}
function printDoc(){$('#printArea').innerHTML=`<style>${DOC_CSS} @page{margin:10mm}</style>${currentDoc.html}`;setTimeout(()=>{try{window.print()}catch(e){toast('Printing is blocked here. Use Download, then print the file.')}},50)}
function downloadDoc(){
  const full=`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${esc(currentDoc.name)}</title><link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@600&family=Noto+Sans:wght@400;600&display=swap" rel="stylesheet"><style>body{margin:0;background:#eee;padding:20px}${DOC_CSS}@media print{body{background:#fff;padding:0}}</style></head><body>${currentDoc.html}<script>window.onload=()=>setTimeout(()=>window.print(),400)<\/script></body></html>`;
  saveFile(currentDoc.name+'.html',full);
}

/* ============================== Start ============================== */
async function init(){
  LOAD_ERROR=''; render();
  try{await loadPublic()}
  catch(e){LOAD_ERROR=e.message;render();return}
  try{const m=await api('me');if(m.me){ME=m.me;await loadStaff()}else if(m.student){STU=m.student;await loadStudent()}}catch(e){ME=null;STU=null}
  LOADED=true; readHash();
}
init();
