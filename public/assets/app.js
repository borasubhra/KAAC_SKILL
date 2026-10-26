const LOGO_EMBLEM="assets/img/emblem.png";
const LOGO_KAACLOGO="assets/img/kaac-logo.png";
const LOGO_DIGITAL="assets/img/digital-india.png";
const IMG_GATE="assets/img/gate.jpg";
const IMG_RENDER="assets/img/render.jpg";
const IMG_PEOPLE="assets/img/people.jpg";
const IMG_MUSEUM="assets/img/museum.jpg";
const IMG_GAMSA="assets/img/gamsa.png";
const PH_BG={learn:'bg-museum',jobs:'bg-gate',courses:'bg-render',register:'bg-gate',trainer:'bg-render',track:'bg-museum',verify:'bg-gate',notices:'bg-render',about:'bg-museum',contact:'bg-gate',login:'bg-museum'};
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
async function sha256(text){
  try{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
  catch(e){let h=5381;for(const c of text)h=((h<<5)+h+c.charCodeAt(0))|0;return 'x'+(h>>>0).toString(16).padStart(8,'0')}
}
function age(dob){if(!dob)return 0;const d=new Date(dob),n=new Date();let a=n.getFullYear()-d.getFullYear();if(n<new Date(n.getFullYear(),d.getMonth(),d.getDate()))a--;return a}

/* Aadhaar: Verhoeff checksum (UIDAI uses this for the 12th digit) */
const VD=[[0,1,2,3,4,5,6,7,8,9],[1,2,3,4,0,6,7,8,9,5],[2,3,4,0,1,7,8,9,5,6],[3,4,0,1,2,8,9,5,6,7],[4,0,1,2,3,9,5,6,7,8],[5,9,8,7,6,0,4,3,2,1],[6,5,9,8,7,1,0,4,3,2],[7,6,5,9,8,2,1,0,4,3],[8,7,6,5,9,3,2,1,0,4],[9,8,7,6,5,4,3,2,1,0]];
const VP=[[0,1,2,3,4,5,6,7,8,9],[1,5,7,6,2,8,3,0,9,4],[5,8,0,3,7,9,6,1,4,2],[8,9,1,6,0,4,3,5,2,7],[9,4,5,3,1,2,7,6,8,0],[4,2,8,6,5,7,3,9,0,1],[2,7,9,3,8,0,6,4,1,5],[7,0,4,6,9,1,3,2,5,8]];
const VINV=[0,4,3,2,1,5,6,7,8,9];
const verhoeffOk = n => {let c=0;[...n].reverse().forEach((d,i)=>{c=VD[c][VP[i%8][+d]]});return c===0};
const validAadhaar = a => /^[2-9]\d{11}$/.test(a) && verhoeffOk(a);
function testAadhaar(){let n=String(2+Math.floor(Math.random()*8));for(let i=0;i<10;i++)n+=Math.floor(Math.random()*10);let c=0;[...n].reverse().forEach((d,i)=>{c=VD[c][VP[(i+1)%8][+d]]});return n+VINV[c]}

/* ============================== Reference data ============================== */
const ROLES = {admin:'Administrator',dealing:'Dealing Officer',supervising:'Supervising Officer',monitoring:'Monitoring Officer',training:'Training Manager',jts:'Joint Secretary',centre:'Centre Manager'};
const QUALS = ['Class 5','Class 8','Class 10','Class 12','ITI','Diploma','Graduate','Post Graduate'];
const STATUS = {
  submitted:['Submitted','info'], returned:['Returned for correction','warn'], verified:['Documents verified','info'],
  admit:['Admit card issued','info'], selected:['Selected','ok'], notselected:['Not selected','bad'],
  batched:['Batch allotted','ok'], training:['In training','ok'], passed:['Passed assessment','ok'],
  failed:['Not passed','bad'], certified:['Certified','ok'], rejected:['Rejected','bad']
};
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

const SEED = {
  sectors:[
    {id:'IT',name:'IT & ITeS',desc:'Computer operations, customer service and software basics'},
    {id:'HOS',name:'Hospitality',desc:'Hotels, restaurants and food service'},
    {id:'TOU',name:'Tourism',desc:'Guiding and visitor services for Karbi Anglong’s heritage and hill tourism'},
    {id:'HLT',name:'Healthcare',desc:'Patient care and home health'},
    {id:'CON',name:'Construction',desc:'Electrical and plumbing trades'},
    {id:'ELE',name:'Electronics & Solar',desc:'Repair, installation and renewable energy'},
    {id:'AUT',name:'Automotive',desc:'Vehicle servicing'},
    {id:'AGR',name:'Agriculture & Food Processing',desc:'Organic farming, ginger, turmeric and value addition'},
    {id:'APP',name:'Apparel & Handloom',desc:'Traditional weaving and tailoring'},
    {id:'BWS',name:'Beauty & Wellness',desc:'Beauty and personal care services'}
  ],
  courses:[
    ['SKL-IT-01','IT','Domestic Data Entry Operator',4,400,'Class 10',18,35,30],
    ['SKL-IT-02','IT','CRM Domestic Voice',4,400,'Class 12',18,35,30],
    ['SKL-IT-03','IT','Junior Software Developer',4,600,'Class 12',18,30,25],
    ['SKL-HOS-01','HOS','Food & Beverage Service Steward',4,390,'Class 10',18,35,30],
    ['SKL-HOS-02','HOS','Front Office Associate',4,450,'Class 12',18,35,25],
    ['SKL-HOS-03','HOS','Multi Cuisine Cook',4,450,'Class 8',18,40,25],
    ['SKL-TOU-01','TOU','Local Tour Guide',4,300,'Class 10',18,40,25],
    ['SKL-HLT-01','HLT','General Duty Assistant',4,420,'Class 10',18,35,30],
    ['SKL-HLT-02','HLT','Home Health Aide',4,300,'Class 8',18,40,30],
    ['SKL-CON-01','CON','Assistant Electrician',3,360,'Class 8',18,40,30],
    ['SKL-CON-02','CON','Plumber (General)',3,360,'Class 8',18,40,30],
    ['SKL-ELE-01','ELE','Solar PV Installer',4,300,'Class 10',18,35,25],
    ['SKL-ELE-02','ELE','Mobile Phone Hardware Repair Technician',4,400,'Class 10',18,35,25],
    ['SKL-AUT-01','AUT','Two-Wheeler Service Technician',4,390,'Class 8',18,35,25],
    ['SKL-AGR-01','AGR','Organic Grower (Ginger & Turmeric)',4,240,'Class 5',18,45,40],
    ['SKL-AGR-02','AGR','Fruit & Vegetable Processing Technician',4,300,'Class 8',18,45,30],
    ['SKL-APP-01','APP','Handloom Weaver (Traditional Karbi Textiles)',3,300,'Class 5',18,45,30],
    ['SKL-APP-02','APP','Self-Employed Tailor',4,390,'Class 5',18,45,30],
    ['SKL-BWS-01','BWS','Assistant Beauty Therapist',4,350,'Class 10',18,35,25]
  ].map(([id,sectorId,name,nsqf,hours,minQual,minAge,maxAge,seats])=>({id,sectorId,name,nsqf,hours,minQual,minAge,maxAge,seats,fee:'Free',active:true})),
  centres:[
    {id:'KAAC-C-001',name:'Diphu Skill Centre',address:'Near District Library, Diphu',district:'Karbi Anglong',sectors:['IT','HOS','HLT','BWS'],capacity:240,phone:'',active:true},
    {id:'KAAC-C-002',name:'Hamren Skill Centre',address:'Hamren Town',district:'West Karbi Anglong',sectors:['IT','CON','AGR','APP'],capacity:180,phone:'',active:true},
    {id:'KAAC-C-003',name:'Bokajan Skill Centre',address:'Bokajan',district:'Karbi Anglong',sectors:['AUT','CON','ELE','HOS'],capacity:160,phone:'',active:true},
    {id:'KAAC-C-004',name:'Howraghat Rural Skill Centre',address:'Howraghat',district:'Karbi Anglong',sectors:['AGR','APP','TOU','BWS'],capacity:150,phone:'',active:true},
    {id:'KAAC-C-005',name:'Donka Skill Centre',address:'Donka, Kheroni',district:'West Karbi Anglong',sectors:['IT','ELE','HLT'],capacity:140,phone:'',active:true}
  ],
  users:[
    ['admin','Admin@123','System Administrator','admin',''],
    ['dealing','Deal@123','Arjun Teron','dealing',''],
    ['supervising','Super@123','Monica Ingti','supervising',''],
    ['monitoring','Monitor@123','Ramesh Timung','monitoring',''],
    ['training','Train@123','Joseph Rongpi','training',''],
    ['jtsecy','Jts@123','Dr. Bidyut Terang','jts',''],
    ['centre1','Centre@123','Lily Hanse','centre','KAAC-C-001'],
    ['centre2','Centre@123','Sarbajit Engti','centre','KAAC-C-002']
  ],
  settings:{id:'main',deptName:'Skill Development & Entrepreneurship Department',council:'Karbi Anglong Autonomous Council',address:'Diphu, Karbi Anglong, Assam – 782460',jtsName:'Dr. Bidyut Terang',jtsDesignation:'Joint Secretary',defaultVenue:'Diphu Skill Centre, Diphu',defaultTime:'10:00 AM',phone:'',email:'',officeHours:'10:00 AM – 4:00 PM, Monday to Friday (except holidays)',logo:'',aboutText:'The Skill Development & Entrepreneurship Department of the Karbi Anglong Autonomous Council works to give the youth of Karbi Anglong and West Karbi Anglong the skills they need for jobs and self-employment.\nThe department runs free, short-term training courses in sectors such as IT, hospitality, healthcare, construction, agriculture and traditional handloom, through skill centres across the two districts. Training follows national skill standards (NSQF), and every trainee who passes the final assessment receives a certificate that employers can verify online.\nAfter certification, the department helps trainees take the next step through on-the-job training with employers and support for starting their own small enterprises.',smsSender:'',smsGateway:'',emailFrom:'',notices:'Registration is open for all courses for the current session.\nCarry the printed admit card and original Aadhaar to the aptitude test.'}
};

/* ============================== Data store ==============================
   Uses the shared artifact database when available (so applicants and officers
   see the same records); otherwise falls back to this browser's storage. */
const COLLS = ['students','docs','sectors','courses','centres','batches','users','notifs','ojt','settings','trainers','notices','extcourses','jobs'];
const S = {}; COLLS.forEach(c => S[c] = {});
let DB = null, MODE = 'local', LKEY = 'kaac-sde-v1';
function saveLocal(){try{localStorage.setItem(LKEY,JSON.stringify(S))}catch(e){toast('Browser storage is full. Remove old records or use smaller files.')}}
function loadLocal(){try{const r=localStorage.getItem(LKEY);if(r){const o=JSON.parse(r);COLLS.forEach(c=>S[c]=o[c]||{});return true}}catch(e){}return false}
async function seedObjects(){
  const out=[];
  SEED.sectors.forEach(x=>out.push(['sectors',x.id,x]));
  SEED.courses.forEach(x=>out.push(['courses',x.id,x]));
  SEED.centres.forEach(x=>out.push(['centres',x.id,x]));
  for(const [id,pw,name,role,centreId] of SEED.users) out.push(['users',id,{id,name,role,centreId,active:true,pwHash:await sha256(id+':'+pw)}]);
  out.push(['settings','main',SEED.settings]);
  out.push(['notices','NT-welcome',{id:'NT-welcome',title:`Registration open for skill training courses, session ${YEAR}`,category:'Admission',date:today(),body:'Online registration is open for all courses. Apply with your Aadhaar number and scanned documents. Training is free.',active:true,createdAt:nowISO()}]);
  return out;
}
async function put(coll,id,obj){
  S[coll][id]=obj; scheduleRefresh();
  if(DB){try{await DB.collection(coll).doc(id).set(JSON.parse(JSON.stringify(obj)))}catch(e){toast('Could not save: '+(e.message||e.code));throw e}}
  else saveLocal();
}
async function del(coll,id){
  delete S[coll][id]; scheduleRefresh();
  if(DB){try{await DB.collection(coll).doc(id).delete()}catch(e){toast('Could not delete: '+(e.message||e.code))}}
  else saveLocal();
}
const list = c => Object.values(S[c]);
const settings = () => ({...SEED.settings,...(S.settings.main||{})});

async function initStore(){
  if(!loadLocal()){for(const [c,id,o] of await seedObjects()) S[c][id]=o; saveLocal()}
  setMode(); render();
  if(!window.claude || !window.claude.use) return;
  let db=null; try{db=await window.claude.use('db')}catch(e){}
  if(!db) return;
  try{
    const meta=await db.doc('meta/init').get();
    if(!meta.exists){
      for(const [c,id,o] of await seedObjects()) await db.collection(c).doc(id).set(o);
      await db.doc('meta/init').set({at:nowISO()});
    }
  }catch(e){ return } // no write/read access: stay local
  DB=db; MODE='shared'; COLLS.forEach(c=>S[c]={});
  COLLS.filter(c=>c!=='docs').forEach(c=>{
    db.collection(c).onSnapshot(snap=>{const o={};snap.docs.forEach(d=>o[d.id]=d.data());S[c]=o;scheduleRefresh()},()=>{});
  });
  setMode();
}
function setMode(){$('#modeNote').textContent = MODE==='shared' ? 'Records are stored in the shared portal database.' : 'Demo mode: records are stored in this browser only.'}
async function getDocFile(id){
  if(S.docs[id]) return S.docs[id];
  if(DB){try{const d=await DB.collection('docs').doc(id).get();if(d.exists){S.docs[id]=d.data();return S.docs[id]}}catch(e){}}
  return null;
}

/* Refresh on data change, but never while someone is typing */
let refreshTimer=null, pendingRefresh=false;
function scheduleRefresh(){clearTimeout(refreshTimer);refreshTimer=setTimeout(()=>{
  const a=document.activeElement;
  if(FORM_ROUTES.includes(route) || (a && $('#main').contains(a) && a.matches('input,textarea,select'))){pendingRefresh=true;return}
  render();
},120)}
document.addEventListener('focusout',()=>{if(pendingRefresh && !FORM_ROUTES.includes(route)){pendingRefresh=false;setTimeout(render,50)}});

/* ============================== Session & routing ============================== */
let route='home', staffView='dash', ME=null;
const FORM_ROUTES=['register','trainer'];
try{const u=sessionStorage.getItem('kaac-user');if(u)ME=JSON.parse(u)}catch(e){}
function go(r){location.hash=r}
function readHash(){const h=(location.hash||'#home').slice(1);route=['home','about','courses','learn','jobs','register','trainer','track','verify','notices','contact','login','staff'].includes(h)?h:'home';if(route==='staff'&&!ME)route='login';render();window.scrollTo(0,0)}
window.addEventListener('hashchange',readHash);
const can = (...roles) => ME && (ME.role==='admin' || roles.includes(ME.role));
const courseName = id => S.courses[id]?.name || id || '—';
const centreName = id => S.centres[id]?.name || id || '—';
const sectorName = id => S.sectors[id]?.name || id || '—';

/* ============================== Notifications ============================== */
const TPL = {
  submitted: s=>`Dear ${s.name}, your application ${s.id} for ${courseName(s.pref1)} has been received by SDE Dept, KAAC. Track it on the portal with your date of birth.`,
  returned:  (s,x)=>`Dear ${s.name}, application ${s.id} needs correction: ${x.remark||'see portal'}. Please re-upload documents on the portal.`,
  verified:  s=>`Dear ${s.name}, documents for application ${s.id} have been verified. Your admit card will be issued shortly.`,
  admit:     s=>`Dear ${s.name}, admit card ${s.admit?.no} is issued. Aptitude test on ${fmtD(s.admit?.date)} at ${s.admit?.time}, ${s.admit?.venue}. Download it from the portal.`,
  selected:  s=>`Congratulations ${s.name}! You are selected for ${courseName(s.skillId||s.pref1)}. Batch details will follow.`,
  notselected: s=>`Dear ${s.name}, you were not selected for ${courseName(s.pref1)} this session. You may apply again in the next session.`,
  batched:   s=>{const b=S.batches[s.batchId]||{};return `Dear ${s.name}, you are allotted batch ${s.batchId} (${courseName(s.skillId)}) at ${centreName(s.centreId)} [${s.centreId}], starting ${fmtD(b.start)}.`},
  training:  s=>`Dear ${s.name}, your training in batch ${s.batchId} has started at ${centreName(s.centreId)}.`,
  passed:    s=>`Dear ${s.name}, you have passed the assessment for ${courseName(s.skillId)}. Your certificate will be issued soon.`,
  failed:    s=>`Dear ${s.name}, you did not clear the assessment for ${courseName(s.skillId)}. Contact your centre for re-assessment.`,
  certified: s=>`Dear ${s.name}, certificate ${s.cert?.no} for ${courseName(s.skillId)} is issued. Download it from the portal.`,
  rejected:  (s,x)=>`Dear ${s.name}, application ${s.id} was not accepted. Reason: ${x.remark||'see portal'}.`,
  ojt:       (s,x)=>`Dear ${s.name}, your OJT recommendation letter ${x.letterNo} for ${x.employer} has been signed by the Joint Secretary. Download it from the portal.`
};
async function notify(s,key,extra={}){
  const body=(s.kind==='trainer'?TTPL:TPL)[key]?.(s,extra); if(!body) return;
  const st=settings(); const at=nowISO();
  const smsStatus = st.smsGateway ? 'Queued for gateway' : 'Logged (no SMS gateway connected)';
  const mailStatus = st.emailFrom ? 'Queued for mail server' : 'Logged (no mail server connected)';
  const base=Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  await put('notifs','N'+base+'s',{id:'N'+base+'s',at,studentId:s.id,channel:'SMS',to:'+91 '+s.mobile,body,status:smsStatus,event:key});
  if(s.email) await put('notifs','N'+base+'e',{id:'N'+base+'e',at,studentId:s.id,channel:'Email',to:s.email,subject:'SDE Dept, KAAC: '+(extra.subject||((s.kind==='trainer'?TSTATUS:STATUS)[key]||[])[0]||'Update'),body,status:mailStatus,event:key});
}
async function setStatus(s,status,action,remark='',patch={},notifyKey=status){
  const ns={...s,...patch,status,history:[...(s.history||[]),{at:nowISO(),by:ME?ME.name:'Applicant',role:ME?ROLES[ME.role]:'Applicant',action,remark}]};
  await put('students',s.id,ns);
  if(notifyKey) await notify(ns,notifyKey,{remark});
  return ns;
}

/* ============================== Render ============================== */
function render(){
  renderChrome();
  $$('#pubnav a').forEach(a=>a.toggleAttribute('aria-current',a.getAttribute('href')==='#'+route||(route==='staff'&&a.id==='staffLink')));
  if(route==='staff'||route==='login') $('#pubnav a[aria-current]')?.setAttribute('aria-current','page');
  $$('#pubnav a[aria-current]').forEach(a=>a.setAttribute('aria-current','page'));
  $('#staffLink').textContent = ME ? 'Staff area' : 'Staff login';
  $('#staffLink').setAttribute('href', ME ? '#staff' : '#login');
  const m=$('#main');
  m.innerHTML = ({learn:vLearn,jobs:vJobs,about:vAbout,notices:vNotices,contact:vContact,trainer:vTrainerReg,home:vHome,courses:vCourses,register:vRegister,track:vTrack,verify:vVerify,login:vLogin,staff:vStaff}[route]||vHome)();
  if(route==='register') wireRegister();
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
  const st=settings(); const logo=`<img src="${st.logo||LOGO_KAACLOGO}" alt="${esc(st.council)} logo">`;
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
    <div><b class="h">Services</b><a href="#register">Student registration</a><a href="#trainer">Trainer registration</a><a href="#track">Track status</a><a href="#verify">Verify certificate</a><a href="#login">Staff login</a></div>
    <div><b class="h">Important links</b>${ext('https://karbianglong.co.in/','KAAC official website')}${ext('https://artpskaac.in/stipend/','Stipend for ST(H) students')}${ext('https://karbiyouthfestival.com/','Karbi Youth Festival')}${ext('https://assam.gov.in/','Assam State Portal')}${ext('https://www.skillindiadigital.gov.in/','Skill India Digital Hub')}${ext('https://www.india.gov.in/','National Portal of India')}</div>
  </div>
  <div class="ft-bottom"><span>© ${YEAR} ${esc(st.deptName)}, ${esc(st.council)} · Last updated ${fmtD(last||nowISO())} · <span id="modeNote">${MODE==='shared'?'Records are stored in the shared portal database.':'Demo mode: records are stored in this browser only.'}</span></span>
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
  if(u.includes('CERT')){verifyQ=u;go('verify');return}
  if(/^KAAC-SDE-/.test(u)){trackPrefill=u;go('track');return}
  courseQ=q; courseSector='all'; go('courses');
}
function gSuggest(v){
  const box=$('#gsug'); if(!box) return; v=v.trim(); const lv=v.toLowerCase();
  if(!v){box.hidden=true;box.innerHTML='';return}
  const rows=[];
  if(/^kaac/i.test(v)) rows.push(`<button type="button" onmousedown="event.preventDefault()" onclick="${/cert/i.test(v)?`verifyQ='${esc(v.toUpperCase())}';go('verify')`:`trackPrefill='${esc(v.toUpperCase())}';go('track')`}">${ic('search')}<span>${/cert/i.test(v)?'Verify certificate':'Track application'} ${esc(v.toUpperCase())}</span></button>`);
  list('courses').filter(c=>c.active&&(c.name+' '+c.id+' '+sectorName(c.sectorId)).toLowerCase().includes(lv)).slice(0,6)
    .forEach(c=>rows.push(`<button type="button" onmousedown="event.preventDefault()" onclick="courseQ='${c.id}';courseSector='all';go('courses')">${ic('search')}<span>${esc(c.name)}</span><small>${esc(sectorName(c.sectorId))}</small></button>`));
  box.innerHTML=rows.join(''); box.hidden=!rows.length;
}
function vHome(){
  const st=settings(), courses=list('courses').filter(c=>c.active), sectors=list('sectors'), centres=list('centres').filter(c=>c.active);
  const ns=latestNotices(4); const top=ns[0]; const logo=st.logo?`<img src="${st.logo}" alt="">`:'KAAC';
  const slides=[
    {t:'t1',bg:'bg-render',alt:'Karbi-style ceremonial gateway',icon:'userplus',h:`Registration open for the ${YEAR} session`,p:`Free training in ${courses.length} courses across ${sectors.length} sectors for the youth of Karbi Anglong and West Karbi Anglong.`,a:['#register','Register now']},
    {t:'t2',bg:'bg-museum',alt:'Nothengpi Karbi Heritage Museum lit at night',icon:'book',h:'Stipend for ST (Hills) students',p:'The council gives stipends to ST (Hills) students pursuing professional courses. Applications are made on the council’s stipend portal.',a:['https://artpskaac.in/stipend/','Visit the stipend portal',1]},
    {t:'t3',bg:'bg-people',alt:'Young people of Karbi Anglong in traditional attire',icon:'sparkle',h:'Karbi Youth Festival',p:'The council’s annual festival celebrating Karbi music, dance and culture, with young people from across the region.',a:['https://karbiyouthfestival.com/','Visit the festival website',1]},
    {t:'t4',icon:'trainer',h:'Trainers and subject experts wanted',p:'Register with your qualifications and experience to join the department’s trainer panel and teach at our skill centres.',a:['#trainer','Register as a trainer']}
  ];
  const fc0=extCourses().find(c=>c.featured), fj0=jobList().find(j=>j.featured);
  if(fj0) slides.splice(1,0,{t:'t2',icon:'building',h:`Now hiring: ${fj0.title}`,p:`${fj0.employer}, ${fj0.location} · ${fj0.pay}. See this and more openings on our Jobs page.`,a:['#jobs','See job openings']});
  if(fc0) slides.splice(1,0,{t:'t1',icon:'book',h:`Learn online: ${fc0.title}`,p:`${fc0.by}. ${fc0.duration}. ${fc0.cost}.`,a:[fc0.url,'Go to course',1]});
  slideIdx%=slides.length;
  const steps=[['Register online','Aadhaar, details and documents'],['Verification','Documents checked by the department'],['Admit card','Download it and take the aptitude test'],['Batch and centre','Selected candidates join a batch'],['Certificate','Issued after you pass the assessment'],['On-the-job training','Recommendation letter for employers']];
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
    ${[['#register','userplus','Register for a course','Apply online with Aadhaar','#0b6e4f'],['#trainer','trainer','Become a trainer','Join the trainer panel','#2563eb'],['#track','search','Track status','Admit card and progress','#d97706'],['#verify','badge','Verify certificate','For employers','#be185d']]
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
    <div class="row"><a class="btn primary lg" href="#register">Register now</a><a class="btn lg" href="#courses">Browse courses</a></div></div></section>`;
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
  const chips=(arr,cur,set)=>['',...arr].map(v=>`<button class="chip" aria-pressed="${cur===v}" onclick="${set}='${esc(v)}';render()">${esc(v||'All')}</button>`).join('');
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
  const isJobs=kind==='jobs'; const coll=isJobs?'jobs':'extcourses'; const el=form.elements; const v=n=>el[n]?el[n].value.trim():'';
  if(!v('title')){toast('Add a title.');return}
  if(!/^https:\/\/\S+$/.test(v('url'))){toast('Add a full link starting with https://');return}
  id=id||(isJobs?'J':'X')+Date.now().toString(36);
  const o=isJobs?{id,title:v('title'),employer:v('employer'),location:v('location'),pay:v('pay'),req:v('req'),posted:v('posted'),source:v('source')||'Job site',url:v('url'),course:v('course'),featured:el.featured.checked}
    :{id,title:v('title'),provider:v('provider')||'Other',topic:v('topic')||'General',by:v('by'),level:v('level'),duration:v('duration'),cost:v('cost'),url:v('url'),points:v('points').split('\n').map(s=>s.trim()).filter(Boolean),featured:el.featured.checked};
  await put(coll,id,o); toast('Saved.'); closeModal(); render();
}
async function removeExt(kind,id){
  const coll=kind==='jobs'?'jobs':'extcourses'; const isDef=(kind==='jobs'?DEF_JOBS:DEF_EXT).some(d=>d.id===id);
  if(!confirm('Remove this from the website?')) return;
  if(isDef) await put(coll,id,{id,hidden:true}); else await del(coll,id);
  toast('Removed.'); closeModal(); render();
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
async function downloadAttachment(id){
  const d=await getDocFile(id); if(!d){toast('This file is not available.');return}
  const bin=atob(d.data.split(',')[1]); const u=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
  saveFile((d.name||'attachment').replace(/\.[^.]+$/,'')+(d.type==='application/pdf'?'.pdf':'.jpg'),u);
}

/* Contact */
function vContact(){
  const st=settings();
  return `${pageHead('Contact us')}
  <div class="two"><section class="panel"><h3>${esc(st.deptName)}</h3><p>${esc(st.council)}<br>${esc(st.address)}</p>
    <dl class="kv"><dt>Phone</dt><dd>${esc(st.phone||'To be updated')}</dd><dt>Email</dt><dd>${st.email?`<a href="mailto:${esc(st.email)}">${esc(st.email)}</a>`:'To be updated'}</dd><dt>Office hours</dt><dd>${esc(st.officeHours||'—')}</dd></dl></section>
  <section class="panel"><h3>Questions about an application?</h3><p class="small">Quote your application ID or trainer registration ID when you call or write. You can check most updates yourself on <a href="#track">Track status</a>.</p></section></div>
  <section class="sec"><div class="sec-h"><h2>Training centres</h2></div><div class="tw"><table><thead><tr><th>Centre ID</th><th>Centre</th><th>District</th><th>Sectors</th><th>Phone</th></tr></thead><tbody>
  ${list('centres').filter(c=>c.active).sort((a,b)=>a.id.localeCompare(b.id)).map(c=>`<tr><td class="id">${esc(c.id)}</td><td>${esc(c.name)}<div class="small muted">${esc(c.address)}</div></td><td>${esc(c.district)}</td><td class="small">${c.sectors.map(sectorName).join(', ')}</td><td class="small">${esc(c.phone||'—')}</td></tr>`).join('')}
  </tbody></table></div></section>`;
}

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
  <div class="field"><label>Attachment (PDF under 180 KB, or an image)</label><input type="file" id="noticeFile" accept="image/*,application/pdf">${n?.attachName?`<div class="hint">Current file: ${esc(n.attachName)} · <label style="display:inline;font-weight:500"><input type="checkbox" id="noticeRemove"> Remove it</label></div>`:''}</div>
  <div class="row" style="justify-content:flex-end">${n?`<button type="button" class="btn danger" onclick="delNotice('${id}')">Delete</button>`:''}<button class="btn primary">${n?'Save notice':'Publish notice'}</button></div></form>`);
}
async function saveNotice(f,id){
  const isNewN=!id; id=id||'NT'+Date.now().toString(36);
  const old=S.notices[id]||{}; const el=f.elements;
  const o={...old,id,title:el.title.value.trim(),category:el.category.value,date:el.date.value,body:el.body.value,active:el.active.value==='1',createdAt:old.createdAt||nowISO(),updatedAt:nowISO(),by:ME.name};
  if(!o.title){toast('Add a title for the notice.');return}
  const file=$('#noticeFile').files[0];
  if(file){try{const p=await processFile(file);const did=id+'-file';await put('docs',did,{id:did,noticeId:id,name:file.name,type:p.type,data:p.data});Object.assign(o,{attachDocId:did,attachName:file.name,attachType:p.type})}catch(e){toast(e.message);return}}
  else if($('#noticeRemove')?.checked){if(o.attachDocId)await del('docs',o.attachDocId);Object.assign(o,{attachDocId:'',attachName:'',attachType:''})}
  await put('notices',id,o); toast(isNewN?'Notice published.':'Notice saved.'); closeModal(); render();
}
async function delNotice(id){const n=S.notices[id];if(!confirm('Delete this notice?'))return;if(n.attachDocId)await del('docs',n.attachDocId);await del('notices',id);toast('Notice deleted.');closeModal();render()}

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
      ${arr.map(c=>`<tr><td class="id">${esc(c.id)}</td><td>${esc(c.name)}</td><td>Level ${esc(c.nsqf)}</td><td>${c.hours} hrs<div class="small muted">≈ ${Math.max(1,Math.round(c.hours/120))} months</div></td>
        <td>${esc(c.minQual)} pass<div class="small muted">Age ${c.minAge}–${c.maxAge}</div></td><td>${c.seats}</td>
        <td class="small">${list('centres').filter(x=>x.active&&x.sectors.includes(c.sectorId)).map(x=>esc(x.name)).join(', ')||'—'}</td>
        <td><button class="btn sm primary" onclick="applyFor='${c.id}';go('register')">Apply</button></td></tr>`).join('')}
      </tbody></table></div>
    </section>`).join(''):'<div class="panel">No courses match. Clear the search or choose another sector.</div>'}`;
}

/* ---------- Registration ---------- */
let applyFor='';
function courseOptions(sel){
  return `<option value="">Select a course</option>`+list('sectors').map(s=>{const cs=list('courses').filter(c=>c.active&&c.sectorId===s.id);return cs.length?`<optgroup label="${esc(s.name)}">${cs.map(c=>`<option value="${c.id}" ${sel===c.id?'selected':''}>${esc(c.name)} (${c.id})</option>`).join('')}</optgroup>`:''}).join('');
}
function vRegister(){
  return `${pageHead('Student registration')}
  <p class="muted">Fields marked <span style="color:var(--bad)">*</span> are required. Keep scanned copies of your documents ready (JPG, PNG or PDF).</p>
  <form id="regForm" novalidate>
  <fieldset><legend>Aadhaar and contact</legend>
    <div class="grid g3">
      <div class="field"><label>Aadhaar number <span class="req">*</span></label><input name="aadhaar" inputmode="numeric" maxlength="14" placeholder="12-digit number" autocomplete="off"><div class="hint">Only the last 4 digits are stored on record. <a href="#" onclick="event.preventDefault();document.querySelector('[name=aadhaar]').value=testAadhaar()">Fill a test number</a></div></div>
      <div class="field"><label>Mobile number <span class="req">*</span></label><input name="mobile" inputmode="numeric" maxlength="10" placeholder="10 digits"><div class="hint">Status updates are sent by SMS</div></div>
      <div class="field"><label>Email</label><input name="email" type="email" placeholder="name@example.com"></div>
    </div>
  </fieldset>
  <fieldset><legend>Personal details</legend>
    <div class="grid g3">
      <div class="field"><label>Full name (as in Aadhaar) <span class="req">*</span></label><input name="name"></div>
      <div class="field"><label>Father’s name <span class="req">*</span></label><input name="father"></div>
      <div class="field"><label>Mother’s name</label><input name="mother"></div>
      <div class="field"><label>Date of birth <span class="req">*</span></label><input name="dob" type="date" max="${today()}"></div>
      <div class="field"><label>Gender <span class="req">*</span></label><select name="gender"><option value="">Select</option><option>Female</option><option>Male</option><option>Transgender</option></select></div>
      <div class="field"><label>Category <span class="req">*</span></label><select name="category"><option value="">Select</option><option>ST (Hills)</option><option>ST (Plains)</option><option>SC</option><option>OBC/MOBC</option><option>General</option><option>EWS</option></select></div>
      <div class="field"><label>Person with disability</label><select name="pwd"><option>No</option><option>Yes</option></select></div>
    </div>
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
      <div class="field"><label>Highest qualification <span class="req">*</span></label><select name="qual"><option value="">Select</option>${QUALS.map(q=>`<option>${q}</option>`).join('')}</select></div>
      <div class="field"><label>Board / university</label><input name="board"></div>
      <div class="field"><label>Year of passing</label><input name="year" inputmode="numeric" maxlength="4"></div>
      <div class="field"><label>Percentage / grade</label><input name="pct"></div>
    </div>
  </fieldset>
  <fieldset><legend>Course preference</legend>
    <div class="grid g3">
      <div class="field"><label>First choice <span class="req">*</span></label><select name="pref1">${courseOptions(applyFor)}</select><div id="eligNote" class="hint"></div></div>
      <div class="field"><label>Second choice</label><select name="pref2">${courseOptions('')}</select></div>
      <div class="field"><label>Preferred centre</label><select name="prefCentre"><option value="">Any centre</option>${list('centres').filter(c=>c.active).map(c=>`<option value="${c.id}">${esc(c.name)} (${c.id})</option>`).join('')}</select></div>
    </div>
  </fieldset>
  <fieldset><legend>Documents</legend>
    <p class="small muted">Images are compressed automatically. PDFs must be under 180 KB.</p>
    <div class="grid g2">${DOC_TYPES.map(d=>`<div class="field"><label>${d.label} ${d.req?'<span class="req">*</span>':''}</label><input type="file" name="doc_${d.key}" accept="${d.img?'image/*':'image/*,application/pdf'}"></div>`).join('')}</div>
  </fieldset>
  <div class="panel flat" style="margin-bottom:16px"><label style="display:flex;gap:10px;font-weight:500"><input type="checkbox" name="declare"> I declare that the information given is true. I consent to the use of my Aadhaar number for identity verification for this scheme only.</label></div>
  <div id="regErr" class="err" style="font-size:14px;margin-bottom:12px"></div>
  <div class="row"><button class="btn primary" type="submit" id="regBtn">Submit application</button><a class="btn" href="#courses">Back to courses</a></div>
  </form>`;
}
function eligibility(s, courseId){
  const c=S.courses[courseId]; if(!c) return {ok:false,issues:['Course not found']};
  const issues=[]; const a=age(s.dob);
  if(a<c.minAge||a>c.maxAge) issues.push(`Age ${a} is outside ${c.minAge}–${c.maxAge}`);
  if(QUALS.indexOf(s.qual)<QUALS.indexOf(c.minQual)) issues.push(`Needs ${c.minQual} pass (has ${s.qual||'none'})`);
  return {ok:!issues.length,issues};
}
function wireRegister(){
  const f=$('#regForm'); const note=$('#eligNote');
  const upd=()=>{const s={dob:f.dob.value,qual:f.qual.value};const c=S.courses[f.pref1.value];if(!c){note.textContent='';return}
    if(!s.dob||!s.qual){note.textContent=`Needs ${c.minQual} pass, age ${c.minAge}–${c.maxAge}.`;note.className='hint';return}
    const e=eligibility(s,c.id);note.textContent=e.ok?'You meet the eligibility for this course.':e.issues.join('. ')+'.';note.className=e.ok?'hint':'err'};
  ['pref1','dob','qual'].forEach(n=>f[n].addEventListener('change',upd)); upd();
  f.aadhaar.addEventListener('input',()=>{const v=f.aadhaar.value.replace(/\D/g,'').slice(0,12);f.aadhaar.value=v.replace(/(\d{4})(?=\d)/g,'$1 ')});
  f.addEventListener('submit',submitRegistration);
}
function readImage(file,max=900,q=.7,type='image/jpeg'){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,max/Math.max(im.width,im.height));const c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);res(c.toDataURL(type,q))};im.onerror=rej;im.src=r.result};r.onerror=rej;r.readAsDataURL(file)})}
function readRaw(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)})}
async function processFile(file){
  if(file.type.startsWith('image/')) return {data:await readImage(file),type:'image/jpeg'};
  if(file.type==='application/pdf'){if(file.size>180*1024) throw new Error(file.name+' is larger than 180 KB. Compress the PDF or upload a photo of it instead.');return {data:await readRaw(file),type:file.type}}
  throw new Error(file.name+' is not a JPG, PNG or PDF file.');
}
function nextId(prefix,coll,field='id'){
  const nums=list(coll).map(x=>String(x[field]||'')).filter(v=>v.startsWith(prefix)).map(v=>parseInt(v.slice(prefix.length))||0);
  return prefix+String((nums.length?Math.max(...nums):0)+1).padStart(5,'0');
}
async function submitRegistration(e){
  e.preventDefault(); const f=e.target, err=$('#regErr'); err.textContent='';
  const v=n=>f[n].value.trim(); const aadhaar=v('aadhaar').replace(/\s/g,'');
  const problems=[];
  if(!validAadhaar(aadhaar)) problems.push('Enter a valid 12-digit Aadhaar number (the check digit does not match).');
  if(!/^[6-9]\d{9}$/.test(v('mobile'))) problems.push('Enter a valid 10-digit mobile number starting with 6–9.');
  if(v('email')&&!/^\S+@\S+\.\S+$/.test(v('email'))) problems.push('Enter a valid email address or leave it blank.');
  ['name','father','dob','gender','category','village','district','qual','pref1'].forEach(n=>{if(!v(n))problems.push('Fill in '+f[n].closest('.field').querySelector('label').childNodes[0].textContent.trim().toLowerCase()+'.')});
  if(v('pin')&&!/^\d{6}$/.test(v('pin'))||!v('pin')) problems.push('Enter a 6-digit PIN code.');
  DOC_TYPES.filter(d=>d.req).forEach(d=>{if(!f['doc_'+d.key].files[0])problems.push('Upload '+d.label.toLowerCase()+'.')});
  if(!f.declare.checked) problems.push('Tick the declaration to continue.');
  if(problems.length){err.innerHTML=problems.map(esc).join('<br>');err.scrollIntoView({behavior:'smooth',block:'center'});return}
  const hash=await sha256('aadhaar:'+aadhaar);
  const dup=list('students').find(s=>s.aadhaarHash===hash&&!['rejected','notselected','certified','failed'].includes(s.status));
  if(dup){err.textContent=`An active application (${dup.id}) already exists for this Aadhaar number. Use Track application to check it.`;return}
  const btn=$('#regBtn'); btn.disabled=true; btn.textContent='Uploading documents…';
  try{
    const id=nextId(`KAAC-SDE-${YEAR}-`,'students');
    const docs=[]; let photo='';
    for(const d of DOC_TYPES){const file=f['doc_'+d.key].files[0]; if(!file) continue;
      const p=await processFile(file); const docId=id+'-'+d.key;
      await put('docs',docId,{id:docId,studentId:id,key:d.key,name:file.name,type:p.type,data:p.data});
      docs.push({key:d.key,label:d.label,name:file.name,type:p.type,docId,status:'pending'});
      if(d.key==='photo') photo=await readImage(file,160,.75);
    }
    const s={id,name:v('name'),father:v('father'),mother:v('mother'),dob:v('dob'),gender:v('gender'),category:v('category'),pwd:v('pwd'),
      aadhaarLast4:aadhaar.slice(-4),aadhaarHash:hash,mobile:v('mobile'),email:v('email'),village:v('village'),block:v('block'),district:v('district'),pin:v('pin'),
      qual:v('qual'),board:v('board'),year:v('year'),pct:v('pct'),pref1:v('pref1'),pref2:v('pref2'),prefCentre:v('prefCentre'),
      docs,photo,status:'submitted',createdAt:nowISO(),history:[{at:nowISO(),by:v('name'),role:'Applicant',action:'Application submitted',remark:''}]};
    await put('students',id,s); await notify(s,'submitted');
    applyFor=''; route='track'; history.replaceState(null,'','#track'); render();
    trackResult(s.id,s.dob,true);
  }catch(ex){err.textContent=ex.message||'Could not submit. Try again.';btn.disabled=false;btn.textContent='Submit application'}
}

/* ---------- Track ---------- */
let trackFound=null;
function vTrack(){
  return `${pageHead('Track status','Students and trainers can both check their status and download documents here.')}
  <div class="panel" style="max-width:640px"><form onsubmit="event.preventDefault();trackResult(this.aid.value.trim(),this.dob.value)">
    <div class="grid g2"><div class="field"><label>Application or trainer ID</label><input name="aid" placeholder="KAAC-SDE-${YEAR}-00001" value="${esc(trackFound?.id||trackPrefill||'')}"></div>
    <div class="field"><label>Date of birth</label><input name="dob" type="date" value="${esc(trackFound?.dob||'')}"></div></div>
    <button class="btn primary">Show status</button></form></div>
  <div id="trackOut" style="margin-top:20px">${trackFound?(trackFound.trainer?trainerTrackHTML(S.trainers[trackFound.id]):trackHTML(S.students[trackFound.id]||trackFound)):''}</div>`;
}
function trackResult(id,dob,fresh){
  const tr=S.trainers[id.toUpperCase()];
  if(tr&&tr.dob===dob){trackFound={id:tr.id,dob:tr.dob,trainer:true};$('#trackOut').innerHTML=(fresh?`<div class="callout" style="margin-bottom:16px"><b>Registration submitted.</b> Your trainer registration ID is <b>${esc(tr.id)}</b>. Save it — you need it with your date of birth to check status.</div>`:'')+trainerTrackHTML(tr);return}
  const s=S.students[id.toUpperCase()]||S.students[id];
  if(!s||s.dob!==dob){trackFound=null;$('#trackOut').innerHTML='<div class="panel">No application matches that ID and date of birth. Check both and try again.</div>';return}
  trackFound={id:s.id,dob:s.dob};
  $('#trackOut').innerHTML=(fresh?`<div class="callout" style="margin-bottom:16px"><b>Application submitted.</b> Your application ID is <b>${esc(s.id)}</b>. Save it — you need it with your date of birth to track status and download documents.</div>`:'')+trackHTML(s);
}
function trackHTML(s){
  const b=S.batches[s.batchId]; const ojts=list('ojt').filter(o=>o.studentId===s.id&&o.status==='signed');
  return `<div class="grid g2">
    <div class="panel"><div class="row" style="align-items:flex-start">${s.photo?`<img class="photo" src="${s.photo}" alt="">`:''}<div><h2 style="margin-bottom:4px">${esc(s.name)}</h2><div class="muted small">${esc(s.id)}</div><div style="margin-top:8px">${statusTag(s.status)}</div></div></div>
      <hr class="sep"><dl class="kv"><dt>Course</dt><dd>${esc(courseName(s.skillId||s.pref1))} <span class="muted">(${esc(s.skillId||s.pref1)})</span></dd>
      ${s.admit?`<dt>Aptitude test</dt><dd>${fmtD(s.admit.date)}, ${esc(s.admit.time)} at ${esc(s.admit.venue)}</dd>`:''}
      ${b?`<dt>Batch</dt><dd>${esc(b.id)}, ${fmtD(b.start)} to ${fmtD(b.end)}</dd><dt>Centre</dt><dd>${esc(centreName(b.centreId))} (${esc(b.centreId)})</dd>`:''}
      ${s.cert?`<dt>Certificate</dt><dd>${esc(s.cert.no)}</dd>`:''}</dl>
      <div class="row" style="margin-top:16px">
        ${s.admit?`<button class="btn primary" onclick="openDoc('admit','${s.id}')">Download admit card</button>`:''}
        ${s.cert?`<button class="btn primary" onclick="openDoc('cert','${s.id}')">Download certificate</button>`:''}
        ${ojts.map(o=>`<button class="btn" onclick="openDoc('ojt','${o.id}')">OJT letter: ${esc(o.employer)}</button>`).join('')}
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
  <form onsubmit="event.preventDefault();resubmit('${s.id}',this)">${keys.map(k=>{const d=DOC_TYPES.find(x=>x.key===k);return `<div class="field"><label>${d.label}</label><input type="file" name="doc_${k}" accept="image/*,application/pdf"></div>`}).join('')}
  <button class="btn primary">Resubmit application</button></form>`;
}
async function resubmit(id,f){
  const s=S.students[id]; const docs=[...s.docs]; let photo=s.photo, n=0;
  try{for(const inp of f.querySelectorAll('input[type=file]')){const file=inp.files[0];if(!file)continue;const key=inp.name.slice(4);const p=await processFile(file);const docId=id+'-'+key;
    await put('docs',docId,{id:docId,studentId:id,key,name:file.name,type:p.type,data:p.data});
    const i=docs.findIndex(d=>d.key===key);const rec={key,label:DOC_TYPES.find(d=>d.key===key).label,name:file.name,type:p.type,docId,status:'pending'};if(i>=0)docs[i]=rec;else docs.push(rec);
    if(key==='photo')photo=await readImage(file,160,.75);n++}
  }catch(ex){toast(ex.message);return}
  if(!n){toast('Choose at least one corrected document.');return}
  await setStatus(s,'submitted','Resubmitted with corrected documents','',{docs,photo},null);
  toast('Application resubmitted.'); trackResult(id,s.dob);
}

/* ---------- Verify certificate ---------- */
let verifyQ='';
function vVerify(){
  const s=verifyQ?list('students').find(x=>x.cert&&x.cert.no.toUpperCase()===verifyQ.toUpperCase()):null;
  return `${pageHead('Verify a certificate','Employers can confirm a certificate issued by the department by its number.')}
  <div class="panel" style="max-width:560px"><form onsubmit="event.preventDefault();verifyQ=this.q.value.trim();render()"><div class="field"><label>Certificate number</label><input name="q" value="${esc(verifyQ)}" placeholder="KAAC-SDE-CERT-${YEAR}-00001"></div><button class="btn primary">Verify</button></form></div>
  ${verifyQ?`<div class="panel" style="max-width:560px;margin-top:16px">${s?`<span class="tag ok">Valid certificate</span><dl class="kv" style="margin-top:12px"><dt>Name</dt><dd>${esc(s.name)}</dd><dt>Student ID</dt><dd>${esc(s.id)}</dd><dt>Course</dt><dd>${esc(courseName(s.skillId))} (${esc(s.skillId)})</dd><dt>Centre</dt><dd>${esc(centreName(s.centreId))} (${esc(s.centreId)})</dd><dt>Grade</dt><dd>${esc(s.result?.grade||'—')}</dd><dt>Issued</dt><dd>${fmtD(s.cert.issuedAt)}</dd></dl>`:'<span class="tag bad">Not found</span><p style="margin-top:10px">No certificate with this number was issued by the department.</p>'}</div>`:''}`;
}

/* ---------- Login ---------- */
function vLogin(){
  return `${pageHead('Staff login','For officers of the department and centre managers.')}<div style="max-width:440px">
  <div class="panel"><form onsubmit="event.preventDefault();doLogin(this)">
    <div class="field"><label>Username</label><input name="u" autocomplete="username"></div>
    <div class="field"><label>Password</label><input name="p" type="password" autocomplete="current-password"></div>
    <div id="loginErr" class="err"></div>
    <button class="btn primary" style="margin-top:8px">Log in</button></form></div>
  <details class="panel flat" style="margin-top:16px"><summary style="cursor:pointer;font-weight:600">Demo accounts</summary>
    <div class="tw" style="margin-top:10px"><table><thead><tr><th>Role</th><th>Username</th><th>Password</th></tr></thead><tbody>
    ${SEED.users.map(u=>`<tr><td>${ROLES[u[3]]}${u[4]?' ('+u[4]+')':''}</td><td>${u[0]}</td><td>${u[1]}</td></tr>`).join('')}</tbody></table></div>
    <p class="small muted" style="margin-top:8px">Change these passwords in Users &amp; roles before real use.</p></details></div>`;
}
async function doLogin(f){
  const u=f.u.value.trim().toLowerCase(), user=S.users[u];
  if(!user||!user.active||user.pwHash!==await sha256(u+':'+f.p.value)){$('#loginErr').textContent='Username or password is incorrect, or the account is disabled.';return}
  ME={id:user.id,name:user.name,role:user.role,centreId:user.centreId||''};
  try{sessionStorage.setItem('kaac-user',JSON.stringify(ME))}catch(e){}
  staffView='dash'; go('staff');
}
function logout(){ME=null;try{sessionStorage.removeItem('kaac-user')}catch(e){};go('home')}

/* ============================== Staff area ============================== */
const MENU=[
  ['dash','Dashboard',null],
  ['apps','Applications',['dealing','supervising','monitoring','training','jts']],
  ['admit','Admit cards',['supervising','monitoring']],
  ['batches','Batches',['training','monitoring','jts','centre']],
  ['trainers','Trainers',['dealing','training','monitoring','jts','centre']],
  ['results','Attendance & results',['centre','training','monitoring']],
  ['certs','Certificates',['training','jts','monitoring','centre']],
  ['ojt','OJT letters',['training','centre','jts','monitoring']],
  ['mapping','Centre mapping',null],
  ['notifs','SMS & email log',['monitoring']],
  ['noticesAdm','Notices & updates',['training']],
  ['extAdm','Online learning & jobs',['training']],
  ['master','Courses, sectors & centres',[]],
  ['users','Users & roles',[]],
  ['settings','Settings',[]]
];
function myStudents(){const all=list('students');return ME.role==='centre'?all.filter(s=>s.centreId===ME.centreId):all}
function pendingCount(v){
  const s=myStudents();
  if(v==='apps'){if(ME.role==='dealing')return s.filter(x=>x.status==='submitted').length;if(ME.role==='training')return s.filter(x=>x.status==='admit').length}
  if(v==='admit'&&ME.role==='supervising')return s.filter(x=>x.status==='verified').length;
  if(v==='ojt'&&ME.role==='jts')return list('ojt').filter(o=>o.status==='pending').length;
  if(v==='certs'&&ME.role==='training')return s.filter(x=>x.status==='passed').length;
  if(v==='batches'&&ME.role==='training')return s.filter(x=>x.status==='selected').length+list('batches').filter(b=>b.status!=='completed'&&!b.trainerId).length;
  if(v==='trainers'){if(ME.role==='dealing')return list('trainers').filter(t=>t.status==='submitted').length;if(ME.role==='training')return list('trainers').filter(t=>t.status==='verified').length}
  return 0;
}
function vStaff(){
  const items=MENU.filter(([k,,r])=>r===null||can(...r));
  if(!items.find(i=>i[0]===staffView)) staffView='dash';
  const views={extAdm:sExtAdm,noticesAdm:sNoticesAdm,trainers:sTrainers,dash:sDash,apps:sApps,admit:sAdmit,batches:sBatches,results:sResults,certs:sCerts,ojt:sOjt,mapping:sMapping,notifs:sNotifs,master:sMaster,users:sUsers,settings:sSettings};
  return `<div class="staff"><aside class="side">
    <div class="who"><b>${esc(ME.name)}</b><span class="small muted">${ROLES[ME.role]}${ME.centreId?' · '+esc(ME.centreId):''}</span></div>
    ${items.map(([k,l])=>{const n=pendingCount(k);return `<button class="nav" aria-current="${staffView===k}" onclick="staffView='${k}';render()"><span>${l}</span>${n?`<span class="badge">${n}</span>`:''}</button>`}).join('')}
    <hr class="sep" style="margin:10px 0"><button class="nav" onclick="logout()">Log out</button>
  </aside><section>${views[staffView]()}</section></div>`;
}

/* ---------- Dashboard ---------- */
function bars(rows){const max=Math.max(1,...rows.map(r=>r[1]));return rows.map(([l,n])=>`<div class="barrow"><span>${esc(l)}</span><div class="bar"><i style="width:${n/max*100}%"></i></div><b>${n}</b></div>`).join('')||'<p class="muted small">No data yet.</p>'}
function sDash(){
  const st=myStudents(); const c=k=>st.filter(s=>s.status===k).length;
  const bySector={}; st.forEach(s=>{const sec=S.courses[s.skillId||s.pref1]?.sectorId;bySector[sec]=(bySector[sec]||0)+1});
  const centres=list('centres').filter(x=>ME.role!=='centre'||x.id===ME.centreId);
  const tasks=[];
  if(can('dealing')&&c('submitted')) tasks.push([`${c('submitted')} applications waiting for document verification`,'apps']);
  if(can('supervising')&&c('verified')) tasks.push([`${c('verified')} verified candidates need admit cards`,'admit']);
  if(can('training')&&c('admit')) tasks.push([`${c('admit')} candidates awaiting selection after the aptitude test`,'apps']);
  if(can('training')&&c('selected')) tasks.push([`${c('selected')} selected candidates not yet in a batch`,'batches']);
  if(can('dealing')){const n=list('trainers').filter(t=>t.status==='submitted').length;if(n)tasks.push([`${n} trainer registrations waiting for document verification`,'trainers'])}
  if(can('training')){const n=list('trainers').filter(t=>t.status==='verified').length;if(n)tasks.push([`${n} verified trainers waiting to be empanelled`,'trainers']);const nb=list('batches').filter(b=>b.status!=='completed'&&!b.trainerId).length;if(nb)tasks.push([`${nb} batches have no trainer assigned`,'batches'])}
  if(can('centre','training')&&c('training')) tasks.push([`${c('training')} trainees in progress — record results when batches finish`,'results']);
  if(can('training')&&c('passed')) tasks.push([`${c('passed')} passed trainees need certificates`,'certs']);
  if(can('jts')){const p=list('ojt').filter(o=>o.status==='pending').length;if(p)tasks.push([`${p} OJT recommendation letters waiting for your signature`,'ojt'])}
  return `<h1>Dashboard</h1>
  ${tasks.length?`<div class="panel" style="margin-bottom:18px"><h3>Waiting for you</h3>${tasks.map(([t,v])=>`<div class="row" style="justify-content:space-between;padding:6px 0;border-bottom:1px dashed var(--line)"><span>${t}</span><button class="btn sm" onclick="staffView='${v}';render()">Open</button></div>`).join('')}</div>`:''}
  <div class="grid g4">
    <div class="stat"><div class="n">${st.length}</div><div class="l">${ME.role==='centre'?'Trainees at this centre':'Total registrations'}</div></div>
    <div class="stat"><div class="n">${c('submitted')+c('verified')+c('admit')}</div><div class="l">Under process</div></div>
    <div class="stat"><div class="n">${c('batched')+c('training')}</div><div class="l">In batches / training</div></div>
    <div class="stat"><div class="n">${c('certified')}</div><div class="l">Certified</div></div>
    ${ME.role!=='centre'?`<div class="stat"><div class="n">${list('trainers').filter(t=>t.status==='empanelled').length}</div><div class="l">Empanelled trainers</div></div>`:''}
  </div>
  <div class="grid g2" style="margin-top:18px">
    <div class="panel"><h3>Applications by status</h3>${bars(Object.keys(STATUS).map(k=>[STATUS[k][0],c(k)]).filter(r=>r[1]))}</div>
    <div class="panel"><h3>Registrations by sector</h3>${bars(Object.entries(bySector).map(([k,n])=>[sectorName(k),n]))}</div>
    <div class="panel"><h3>Centre utilisation</h3>${bars(centres.map(x=>[x.name,list('batches').filter(b=>b.centreId===x.id&&b.status!=='completed').reduce((a,b)=>a+b.students.length,0)]))}<p class="small muted">Trainees in active batches.</p></div>
    <div class="panel"><h3>Recent activity</h3>${st.flatMap(s=>(s.history||[]).map(h=>({...h,s}))).sort((a,b)=>b.at.localeCompare(a.at)).slice(0,8).map(h=>`<div class="small" style="padding:5px 0;border-bottom:1px dashed var(--line)"><b>${esc(h.s.id)}</b> ${esc(h.action)}<div class="muted">${fmtDT(h.at)} · ${esc(h.by)}</div></div>`).join('')||'<p class="muted small">No activity yet.</p>'}</div>
  </div>
  ${can('monitoring')?`<div class="row" style="margin-top:18px"><button class="btn" onclick="exportCSV()">Export all applications (CSV)</button></div>`:''}`;
}

/* ---------- Applications ---------- */
let appF={status:'',course:'',q:''};
function sApps(){
  let st=myStudents();
  if(appF.status) st=st.filter(s=>s.status===appF.status);
  if(appF.course) st=st.filter(s=>(s.skillId||s.pref1)===appF.course);
  if(appF.q){const q=appF.q.toLowerCase();st=st.filter(s=>(s.id+s.name+s.mobile+s.village).toLowerCase().includes(q))}
  st.sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  const hint={dealing:'Open an application to check documents, then mark it verified, return it for correction or reject it.',supervising:'Verified applications get admit cards from the Admit cards page.',training:'After the aptitude test, open candidates with admit cards to record the score and select them.'}[ME.role]||'';
  return `<h1>Applications</h1>${hint?`<p class="muted">${hint}</p>`:''}
  <div class="row" style="margin-bottom:12px">
    <select style="max-width:210px" onchange="appF.status=this.value;render()"><option value="">All statuses</option>${Object.entries(STATUS).map(([k,v])=>`<option value="${k}" ${appF.status===k?'selected':''}>${v[0]}</option>`).join('')}</select>
    <select style="max-width:260px" onchange="appF.course=this.value;render()"><option value="">All courses</option>${list('courses').map(c=>`<option value="${c.id}" ${appF.course===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select>
    <input style="max-width:240px" placeholder="Search name, ID, mobile" value="${esc(appF.q)}" onchange="appF.q=this.value;render()">
    <span class="muted small" style="margin-left:auto">${st.length} shown</span>
  </div>
  <div class="tw"><table><thead><tr><th>Student ID</th><th>Name</th><th>Course (1st choice)</th><th>Eligibility</th><th>Submitted</th><th>Status</th><th></th></tr></thead><tbody>
  ${st.map(s=>{const e=eligibility(s,s.pref1);return `<tr><td class="id">${esc(s.id)}</td><td>${esc(s.name)}<div class="small muted">${esc(s.village)}, ${esc(s.district)}</div></td><td>${esc(courseName(s.pref1))}<div class="small muted">${esc(s.pref1)}</div></td>
    <td>${e.ok?'<span class="tag ok">Eligible</span>':`<span class="tag warn" title="${esc(e.issues.join('; '))}">Check</span>`}</td><td class="small">${fmtD(s.createdAt)}</td><td>${statusTag(s.status)}</td>
    <td><button class="btn sm" onclick="openApp('${s.id}')">Open</button></td></tr>`}).join('')||'<tr><td colspan="7" class="muted">No applications match these filters.</td></tr>'}
  </tbody></table></div>`;
}
function openModal(html,wide){$('#modalBox').className='box'+(wide?' wide':'');$('#modalBox').innerHTML=html;$('#modal').classList.add('open');setTimeout(()=>$('#modalBox').querySelector('input,select,textarea,button')?.focus(),30)}
function closeModal(){$('#modal').classList.remove('open');if(pendingRefresh){pendingRefresh=false;render()}}
$('#modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});

async function openApp(id){
  const s=S.students[id]; const e=eligibility(s,s.pref1);
  const actions=[];
  if(can('dealing')&&s.status==='submitted') actions.push(`<button class="btn danger" onclick="appAction('${id}','reject')">Reject</button><button class="btn" onclick="appAction('${id}','return')">Return for correction</button><button class="btn primary" onclick="appAction('${id}','verify')">Mark documents verified</button>`);
  if(can('supervising')&&s.status==='verified') actions.push(`<button class="btn danger" onclick="appAction('${id}','reject')">Reject</button><button class="btn primary" onclick="closeModal();issueAdmitDialog(['${id}'])">Issue admit card</button>`);
  if(can('training')&&s.status==='admit') actions.push(`<button class="btn danger" onclick="appAction('${id}','notselect')">Not selected</button><button class="btn primary" onclick="appAction('${id}','select')">Select candidate</button>`);
  openModal(`<div class="mh"><h3 style="margin:0">${esc(s.name)} · ${esc(s.id)}</h3><button class="btn sm" onclick="closeModal()">Close</button></div>
  <div class="mb"><div class="grid g2">
    <div><div class="row" style="align-items:flex-start;margin-bottom:12px">${s.photo?`<img class="photo" src="${s.photo}" alt="">`:''}<div>${statusTag(s.status)}<div class="small muted" style="margin-top:6px">Submitted ${fmtDT(s.createdAt)}</div></div></div>
      <dl class="kv"><dt>Aadhaar</dt><dd>XXXX XXXX ${esc(s.aadhaarLast4)}</dd><dt>Father / mother</dt><dd>${esc(s.father)}${s.mother?' / '+esc(s.mother):''}</dd><dt>Date of birth</dt><dd>${fmtD(s.dob)} (age ${age(s.dob)})</dd><dt>Gender / category</dt><dd>${esc(s.gender)} · ${esc(s.category)}${s.pwd==='Yes'?' · PwD':''}</dd>
      <dt>Mobile / email</dt><dd>${esc(s.mobile)}${s.email?'<br>'+esc(s.email):''}</dd><dt>Address</dt><dd>${esc([s.village,s.block,s.district,s.pin].filter(Boolean).join(', '))}</dd>
      <dt>Qualification</dt><dd>${esc(s.qual)}${s.board?', '+esc(s.board):''}${s.year?' ('+esc(s.year)+')':''}${s.pct?', '+esc(s.pct):''}</dd>
      <dt>1st choice</dt><dd>${esc(courseName(s.pref1))} (${esc(s.pref1)}) ${e.ok?'<span class="tag ok">Eligible</span>':`<span class="tag warn">${esc(e.issues.join('; '))}</span>`}</dd>
      <dt>2nd choice</dt><dd>${esc(courseName(s.pref2))}</dd><dt>Preferred centre</dt><dd>${esc(s.prefCentre?centreName(s.prefCentre)+' ('+s.prefCentre+')':'Any')}</dd>
      ${s.admit?`<dt>Admit card</dt><dd>${esc(s.admit.no)} · ${fmtD(s.admit.date)} ${esc(s.admit.time)}</dd>`:''}
      ${s.score!=null?`<dt>Aptitude score</dt><dd>${esc(s.score)}</dd>`:''}
      ${s.batchId?`<dt>Batch / centre</dt><dd>${esc(s.batchId)} · ${esc(s.centreId)}</dd>`:''}</dl></div>
    <div><h3>Documents</h3><div id="docList">${(s.docs||[]).map(d=>`<div class="row" style="justify-content:space-between;padding:7px 0;border-bottom:1px dashed var(--line)"><span class="small"><b>${esc(d.label)}</b><br><span class="muted">${esc(d.name)}</span></span>
      <span class="row" style="gap:6px">${d.status==='ok'?'<span class="tag ok">OK</span>':d.status==='rejected'?'<span class="tag bad">Incorrect</span>':''}<button class="btn sm" onclick="viewDoc('${d.docId}')">View</button>
      ${can('dealing')&&s.status==='submitted'?`<button class="btn sm" onclick="markDoc('${id}','${d.key}','ok')">OK</button><button class="btn sm danger" onclick="markDoc('${id}','${d.key}','rejected')">Incorrect</button>`:''}</span></div>`).join('')}</div>
      <div id="docView" style="margin-top:12px"></div>
      <h3 style="margin-top:16px">History</h3><ul class="tl">${[...(s.history||[])].reverse().map(h=>`<li><b>${esc(h.action)}</b>${h.remark?`<div class="small">${esc(h.remark)}</div>`:''}<small>${fmtDT(h.at)} · ${esc(h.by)} (${esc(h.role)})</small></li>`).join('')}</ul></div>
  </div>
  ${actions.length?`<div class="field" style="margin-top:12px"><label>Remark</label><textarea id="appRemark" placeholder="Required when returning, rejecting or not selecting"></textarea></div>${s.status==='admit'?`<div class="field" style="max-width:220px"><label>Aptitude test score (out of 100)</label><input id="appScore" type="number" min="0" max="100"></div>`:''}`:''}
  </div>${actions.length?`<div class="mf">${actions.join('')}</div>`:''}`,true);
}
async function viewDoc(docId){
  const box=$('#docView'); box.innerHTML='<p class="muted small">Loading…</p>';
  const d=await getDocFile(docId); if(!d){box.innerHTML='<p class="err">This file is not available.</p>';return}
  box.innerHTML=d.type==='application/pdf'?`<object data="${d.data}" type="application/pdf" style="width:100%;height:420px"><p class="small">PDF preview not supported here.</p></object>`:`<img class="docthumb" src="${d.data}" alt="${esc(d.name)}">`;
}
async function markDoc(id,key,status){const s=S.students[id];await put('students',id,{...s,docs:s.docs.map(d=>d.key===key?{...d,status}:d)});openApp(id)}
async function appAction(id,act){
  const s=S.students[id]; const remark=($('#appRemark')?.value||'').trim();
  if(['reject','return','notselect'].includes(act)&&!remark){toast('Add a remark explaining the reason.');$('#appRemark').focus();return}
  if(act==='verify'){if(s.docs.some(d=>d.status==='rejected')){toast('A document is marked incorrect. Return the application instead.');return}
    await setStatus(s,'verified','Documents verified',remark,{docs:s.docs.map(d=>({...d,status:'ok'}))})}
  if(act==='return') await setStatus(s,'returned','Returned for correction',remark);
  if(act==='reject') await setStatus(s,'rejected','Application rejected',remark);
  if(act==='select'){const sc=$('#appScore').value;await setStatus(s,'selected','Selected after aptitude test',remark,{score:sc===''?null:+sc,skillId:s.pref1})}
  if(act==='notselect'){const sc=$('#appScore').value;await setStatus(s,'notselected','Not selected',remark,{score:sc===''?null:+sc})}
  toast('Saved. Applicant notified by SMS'+(s.email?' and email.':'.')); closeModal(); render();
}

/* ---------- Admit cards ---------- */
function sAdmit(){
  const ver=myStudents().filter(s=>s.status==='verified'); const issued=myStudents().filter(s=>s.admit).sort((a,b)=>b.admit.issuedAt.localeCompare(a.admit.issuedAt));
  return `<h1>Admit cards</h1><p class="muted">Issue admit cards to candidates whose documents are verified. Candidates can download them from Track application.</p>
  <div class="panel" style="margin-bottom:18px"><div class="row" style="justify-content:space-between"><h3 style="margin:0">Eligible for admit card (${ver.length})</h3>
  ${can('supervising')&&ver.length?`<button class="btn primary" onclick="issueAdmitDialog([...document.querySelectorAll('.admitPick:checked')].map(i=>i.value))">Issue to selected</button>`:''}</div>
  <div class="tw" style="margin-top:12px"><table><thead><tr><th><input type="checkbox" aria-label="Select all" onchange="document.querySelectorAll('.admitPick').forEach(i=>i.checked=this.checked)"></th><th>Student ID</th><th>Name</th><th>Course</th><th>Eligibility</th></tr></thead><tbody>
  ${ver.map(s=>{const e=eligibility(s,s.pref1);return `<tr><td><input type="checkbox" class="admitPick" value="${s.id}" ${e.ok?'checked':''}></td><td class="id">${esc(s.id)}</td><td>${esc(s.name)}</td><td>${esc(courseName(s.pref1))}</td><td>${e.ok?'<span class="tag ok">Eligible</span>':`<span class="tag warn">${esc(e.issues.join('; '))}</span>`}</td></tr>`}).join('')||'<tr><td colspan="5" class="muted">No verified candidates waiting.</td></tr>'}
  </tbody></table></div></div>
  <h3>Issued admit cards</h3><div class="tw"><table><thead><tr><th>Admit card no.</th><th>Student</th><th>Test</th><th>Venue</th><th>Status</th><th></th></tr></thead><tbody>
  ${issued.map(s=>`<tr><td class="id">${esc(s.admit.no)}</td><td>${esc(s.name)}<div class="small muted">${esc(s.id)}</div></td><td>${fmtD(s.admit.date)} ${esc(s.admit.time)}</td><td class="small">${esc(s.admit.venue)}</td><td>${statusTag(s.status)}</td><td><button class="btn sm" onclick="openDoc('admit','${s.id}')">View</button></td></tr>`).join('')||'<tr><td colspan="6" class="muted">No admit cards issued yet.</td></tr>'}
  </tbody></table></div>`;
}
function issueAdmitDialog(ids){
  if(!ids.length){toast('Select at least one candidate.');return}
  const st=settings(); const d=new Date(Date.now()+7*864e5).toISOString().slice(0,10);
  openModal(`<div class="mh"><h3 style="margin:0">Issue admit cards (${ids.length})</h3><button class="btn sm" onclick="closeModal()">Close</button></div>
  <form class="mb" onsubmit="event.preventDefault();issueAdmit(${esc(JSON.stringify(ids))},this)">
  <div class="grid g3"><div class="field"><label>Test date</label><input name="date" type="date" min="${today()}" value="${d}" required></div>
  <div class="field"><label>Reporting time</label><input name="time" value="${esc(st.defaultTime)}" required></div>
  <div class="field"><label>Venue</label><input name="venue" value="${esc(st.defaultVenue)}" required></div></div>
  <div class="row" style="justify-content:flex-end"><button class="btn primary">Issue and notify</button></div></form>`);
}
async function issueAdmit(ids,f){
  for(const id of ids){const s=S.students[id];if(!s||s.status!=='verified')continue;
    const no=nextId(`ADM-${YEAR}-`,'students','admitNo');
    await setStatus(s,'admit','Admit card issued',`Test on ${fmtD(f.date.value)} at ${f.venue.value}`,{admitNo:no,admit:{no,date:f.date.value,time:f.time.value,venue:f.venue.value,issuedAt:nowISO(),by:ME.name}})}
  toast(`${ids.length} admit card(s) issued and candidates notified.`); closeModal(); render();
}

/* ---------- Batches ---------- */
function sBatches(){
  const bs=list('batches').filter(b=>ME.role!=='centre'||b.centreId===ME.centreId).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  const waiting={}; myStudents().filter(s=>s.status==='selected').forEach(s=>waiting[s.skillId]=(waiting[s.skillId]||0)+1);
  return `<h1>Batches</h1><p class="muted">Selected candidates are grouped by skill into batches at a training centre. Each batch links Student IDs, the Skill ID and the Centre ID.</p>
  ${can('training')?`<div class="panel" style="margin-bottom:18px"><div class="row" style="justify-content:space-between"><h3 style="margin:0">Selected candidates waiting for a batch</h3><button class="btn primary" onclick="batchDialog()">Form a new batch</button></div>
  <div style="margin-top:10px">${Object.keys(waiting).length?Object.entries(waiting).map(([k,n])=>`<div class="row" style="justify-content:space-between;padding:5px 0;border-bottom:1px dashed var(--line)"><span>${esc(courseName(k))} <span class="muted small">${esc(k)}</span></span><span class="row"><b>${n}</b><button class="btn sm" onclick="batchDialog('${k}')">Form batch</button></span></div>`).join(''):'<p class="muted small">No one is waiting.</p>'}</div></div>`:''}
  <div class="tw"><table><thead><tr><th>Batch ID</th><th>Skill</th><th>Centre</th><th>Trainer</th><th>Dates</th><th>Trainees</th><th>Status</th><th></th></tr></thead><tbody>
  ${bs.map(b=>`<tr><td class="id">${esc(b.id)}</td><td>${esc(courseName(b.courseId))}<div class="small muted">${esc(b.courseId)}</div></td><td>${esc(centreName(b.centreId))}<div class="small muted">${esc(b.centreId)}</div></td><td>${trainerLabel(b)}</td><td class="small">${fmtD(b.start)} – ${fmtD(b.end)}</td><td>${b.students.length}/${b.capacity}</td><td><span class="tag ${b.status==='completed'?'':'ok'}">${esc(b.status)}</span></td><td><button class="btn sm" onclick="openBatch('${b.id}')">Open</button></td></tr>`).join('')||'<tr><td colspan="8" class="muted">No batches yet.</td></tr>'}
  </tbody></table></div>`;
}
function batchDialog(courseId=''){
  const c=S.courses[courseId];
  openModal(`<div class="mh"><h3 style="margin:0">Form a new batch</h3><button class="btn sm" onclick="closeModal()">Close</button></div>
  <form class="mb" id="batchForm" onsubmit="event.preventDefault();createBatch(this)">
  <div class="grid g3">
    <div class="field"><label>Skill / course</label><select name="course" onchange="batchDialog(this.value)">${courseOptions(courseId)}</select></div>
    <div class="field"><label>Training centre</label><select name="centre" onchange="batchPickList()" required><option value="">Select</option>${list('centres').filter(x=>x.active&&(!c||x.sectors.includes(c.sectorId))).map(x=>`<option value="${x.id}">${esc(x.name)} (${x.id})</option>`).join('')}</select><div class="hint">Only centres offering this sector are listed.</div></div>
    <div class="field"><label>Capacity</label><input name="cap" type="number" min="1" value="${c?Math.min(30,c.seats):30}"></div>
    <div class="field"><label>Start date</label><input name="start" type="date" required value="${new Date(Date.now()+14*864e5).toISOString().slice(0,10)}"></div>
    <div class="field"><label>End date</label><input name="end" type="date" required value="${c?new Date(Date.now()+(14+Math.round(c.hours/120*30))*864e5).toISOString().slice(0,10):''}"></div>
    <div class="field"><label>Trainer</label><select name="trainerId"><option value="">Assign later</option>${courseId?eligibleTrainers(courseId).map(t=>`<option value="${t.id}">${esc(t.name)} (${t.id}) · ${t.trnExp} yrs</option>`).join(''):''}</select><div class="hint">${courseId&&!eligibleTrainers(courseId).length?'No empanelled trainer for this skill yet':'Empanelled trainers for this skill'}</div></div>
  </div>
  <h3>Choose trainees</h3><div id="pickList">${courseId?'<p class="muted small">Choose a centre to list candidates.</p>':'<p class="muted small">Choose a course first.</p>'}</div>
  <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn primary">Create batch and notify trainees</button></div></form>`,true);
}
function batchPickList(){
  const f=$('#batchForm'); const cid=f.course.value, cen=f.centre.value;
  const ss=myStudents().filter(s=>s.status==='selected'&&s.skillId===cid).sort((a,b)=>(b.prefCentre===cen)-(a.prefCentre===cen)||(b.score||0)-(a.score||0));
  $('#pickList').innerHTML=ss.length?`<div class="tw"><table><thead><tr><th></th><th>Student ID</th><th>Name</th><th>Score</th><th>Preferred centre</th></tr></thead><tbody>${ss.map(s=>`<tr><td><input type="checkbox" class="bpick" value="${s.id}" ${(!s.prefCentre||s.prefCentre===cen)?'checked':''}></td><td class="id">${esc(s.id)}</td><td>${esc(s.name)}</td><td>${s.score??'—'}</td><td class="small">${esc(s.prefCentre||'Any')}</td></tr>`).join('')}</tbody></table></div>`:'<p class="muted small">No selected candidates for this skill.</p>';
}
async function createBatch(f){
  const ids=$$('.bpick:checked').map(i=>i.value); const cap=+f.cap.value;
  if(!f.course.value||!f.centre.value){toast('Choose a course and centre.');return}
  if(!ids.length){toast('Choose at least one trainee.');return}
  if(ids.length>cap){toast(`You picked ${ids.length} trainees but capacity is ${cap}.`);return}
  if(f.end.value<=f.start.value){toast('End date must be after the start date.');return}
  if(f.trainerId.value){const c=trainerClash(f.trainerId.value,f.start.value,f.end.value);if(c){toast(`The chosen trainer is busy with ${c.id} on those dates. Pick another or assign later.`);return}}
  const pre=`BAT-${YEAR}-${f.course.value.replace('SKL-','')}-`; const n=list('batches').filter(b=>b.id.startsWith(pre)).length+1;
  const id=pre+String(n).padStart(3,'0');
  const b={id,courseId:f.course.value,centreId:f.centre.value,start:f.start.value,end:f.end.value,trainerId:f.trainerId.value,trainer:'',capacity:cap,students:ids,status:'planned',createdAt:nowISO(),createdBy:ME.name};
  await put('batches',id,b);
  if(b.trainerId) await notify(S.trainers[b.trainerId],'assigned',{batch:b,subject:'Batch assignment'});
  for(const sid of ids){await setStatus(S.students[sid],'batched',`Allotted to batch ${id}`,`${centreName(b.centreId)} (${b.centreId})`,{batchId:id,centreId:b.centreId,skillId:b.courseId})}
  toast(`Batch ${id} created with ${ids.length} trainees.`); closeModal(); render();
}
function openBatch(id){
  const b=S.batches[id]; const st=b.students.map(x=>S.students[x]).filter(Boolean);
  openModal(`<div class="mh"><h3 style="margin:0">Batch ${esc(b.id)}</h3><button class="btn sm" onclick="closeModal()">Close</button></div>
  <div class="mb"><dl class="kv"><dt>Skill</dt><dd>${esc(courseName(b.courseId))} (${esc(b.courseId)})</dd><dt>Centre</dt><dd>${esc(centreName(b.centreId))} (${esc(b.centreId)})</dd><dt>Dates</dt><dd>${fmtD(b.start)} – ${fmtD(b.end)}</dd><dt>Trainer</dt><dd>${trainerLabel(b)}</dd><dt>Status</dt><dd>${esc(b.status)}</dd><dt>Created by</dt><dd>${esc(b.createdBy)} on ${fmtD(b.createdAt)}</dd></dl>
  <h3 style="margin-top:16px">Trainees (${st.length})</h3><div class="tw"><table><thead><tr><th>Student ID</th><th>Name</th><th>Mobile</th><th>Status</th></tr></thead><tbody>${st.map(s=>`<tr><td class="id">${esc(s.id)}</td><td>${esc(s.name)}</td><td>${esc(s.mobile)}</td><td>${statusTag(s.status)}</td></tr>`).join('')}</tbody></table></div></div>
  <div class="mf">${b.status!=='completed'&&can('training')?`<button class="btn" onclick="assignDialog('${id}')">${b.trainerId?'Change trainer':'Assign trainer'}</button>`:''}${b.status==='planned'&&can('training','centre')?`<button class="btn primary" onclick="startBatch('${id}')">Start training</button>`:''}<button class="btn" onclick="exportBatch('${id}')">Download list (CSV)</button></div>`,true);
}
async function startBatch(id){
  const b=S.batches[id]; if(!b.trainerId){toast('Assign a trainer before starting the batch.');return}
  await put('batches',id,{...b,status:'ongoing',startedAt:nowISO()});
  for(const sid of b.students){const s=S.students[sid];if(s&&s.status==='batched')await setStatus(s,'training','Training started',`Batch ${id}`)}
  toast('Batch started. Trainees notified.'); closeModal(); render();
}

/* ---------- Trainers: registration, verification, empanelment, assignment ---------- */
const TSTATUS={submitted:['Submitted','info'],returned:['Returned for correction','warn'],verified:['Documents verified','info'],empanelled:['Empanelled','ok'],rejected:['Rejected','bad'],inactive:['Inactive','']};
const tStatusTag=s=>`<span class="tag ${TSTATUS[s]?.[1]||''}">${esc(TSTATUS[s]?.[0]||s)}</span>`;
const TRAINER_DOCS=[
  {key:'photo',label:'Passport-size photograph',req:true,img:true},
  {key:'aadhaar',label:'Aadhaar card (copy)',req:true},
  {key:'qual',label:'Highest qualification certificate',req:true},
  {key:'exp',label:'Experience certificate(s)',req:true},
  {key:'tot',label:'Training of Trainers (ToT) certificate',req:false},
  {key:'resume',label:'Résumé / CV',req:false},
  {key:'bank',label:'Bank passbook first page (for honorarium)',req:false}
];
const TTPL={
  submitted:t=>`Dear ${t.name}, your trainer registration ${t.id} has been received by SDE Dept, KAAC. Track it on the portal with your date of birth.`,
  returned:(t,x)=>`Dear ${t.name}, trainer registration ${t.id} needs correction: ${x.remark||'see portal'}. Please re-upload documents on the portal.`,
  verified:t=>`Dear ${t.name}, documents for trainer registration ${t.id} are verified. Your empanelment is under review.`,
  empanelled:t=>`Dear ${t.name}, you are empanelled as a trainer of SDE Dept, KAAC (No. ${t.empanelNo}) for ${(t.courses||[]).length} skill(s). You will be informed when assigned to a batch.`,
  rejected:(t,x)=>`Dear ${t.name}, trainer registration ${t.id} was not accepted. Reason: ${x.remark||'see portal'}.`,
  inactive:t=>`Dear ${t.name}, your trainer empanelment ${t.empanelNo} is marked inactive. Contact the Training Manager for details.`,
  assigned:(t,x)=>`Dear ${t.name}, you are assigned as trainer for batch ${x.batch.id} (${courseName(x.batch.courseId)}) at ${centreName(x.batch.centreId)} [${x.batch.centreId}], ${fmtD(x.batch.start)} to ${fmtD(x.batch.end)}.`,
  released:(t,x)=>`Dear ${t.name}, you are no longer assigned to batch ${x.batch.id}. Contact the Training Manager for details.`
};
async function setTStatus(t,status,action,remark='',patch={},nk=status){
  const nt={...t,...patch,status,history:[...(t.history||[]),{at:nowISO(),by:ME?ME.name:t.name,role:ME?ROLES[ME.role]:'Trainer',action,remark}]};
  await put('trainers',t.id,nt); if(nk) await notify(nt,nk,{remark}); return nt;
}
const trainerBatches = tid => list('batches').filter(b=>b.trainerId===tid).sort((a,b)=>b.start.localeCompare(a.start));
const eligibleTrainers = courseId => list('trainers').filter(t=>t.status==='empanelled'&&(t.courses||[]).includes(courseId));
const trainerClash = (tid,start,end,except) => list('batches').find(b=>b.id!==except&&b.trainerId===tid&&b.status!=='completed'&&b.start<=end&&start<=b.end);
function trainerLabel(b){const t=S.trainers[b.trainerId];return t?`${esc(t.name)} <span class="muted small">(${esc(t.id)})</span>`:(b.trainer?esc(b.trainer):'<span class="tag warn">Not assigned</span>')}

/* Public registration form */
function vTrainerReg(){
  const centres=list('centres').filter(c=>c.active);
  return `${pageHead('Trainer registration')}
  <p class="muted">Join the department’s trainer panel. After document verification and empanelment, trainers are assigned to batches at our centres. Fields marked <span style="color:var(--bad)">*</span> are required.</p>
  <form id="trForm" novalidate>
  <fieldset><legend>Aadhaar and contact</legend><div class="grid g3">
    <div class="field"><label>Aadhaar number <span class="req">*</span></label><input name="aadhaar" inputmode="numeric" maxlength="14" placeholder="12-digit number" autocomplete="off"><div class="hint">Only the last 4 digits are stored on record. <a href="#" onclick="event.preventDefault();document.querySelector('#trForm [name=aadhaar]').value=testAadhaar()">Fill a test number</a></div></div>
    <div class="field"><label>Mobile number <span class="req">*</span></label><input name="mobile" inputmode="numeric" maxlength="10" placeholder="10 digits"></div>
    <div class="field"><label>Email <span class="req">*</span></label><input name="email" type="email" placeholder="name@example.com"><div class="hint">Batch assignments are sent here and by SMS</div></div>
  </div></fieldset>
  <fieldset><legend>Personal details</legend><div class="grid g4">
    <div class="field"><label>Full name (as in Aadhaar) <span class="req">*</span></label><input name="name"></div>
    <div class="field"><label>Father’s / spouse’s name <span class="req">*</span></label><input name="father"></div>
    <div class="field"><label>Date of birth <span class="req">*</span></label><input name="dob" type="date" max="${today()}"></div>
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
  </div></fieldset>
  <fieldset><legend>Skills you can teach <span class="req">*</span></legend>
    <p class="small muted">Tick every course you are qualified to train. You are only assigned to batches of these skills.</p>
    ${list('sectors').map(s=>{const cs=list('courses').filter(c=>c.active&&c.sectorId===s.id);return cs.length?`<div style="margin-bottom:12px"><b class="small">${esc(s.name)}</b><div class="chips" style="margin-top:6px">${cs.map(c=>`<label class="chip" style="font-weight:500"><input type="checkbox" name="skill" value="${c.id}"> ${esc(c.name)}</label>`).join('')}</div></div>`:''}).join('')}
  </fieldset>
  <fieldset><legend>Preferred centres</legend>
    <div class="chips" style="margin-bottom:12px">${centres.map(c=>`<label class="chip" style="font-weight:500"><input type="checkbox" name="pc" value="${c.id}"> ${esc(c.name)}</label>`).join('')}</div>
  </fieldset>
  <fieldset><legend>Documents</legend>
    <p class="small muted">Images are compressed automatically. PDFs must be under 180 KB.</p>
    <div class="grid g2">${TRAINER_DOCS.map(d=>`<div class="field"><label>${d.label} ${d.req?'<span class="req">*</span>':''}</label><input type="file" name="doc_${d.key}" accept="${d.img?'image/*':'image/*,application/pdf'}"></div>`).join('')}</div>
  </fieldset>
  <div class="panel flat" style="margin-bottom:16px"><label style="display:flex;gap:10px;font-weight:500"><input type="checkbox" name="declare"> I declare that the information and documents are genuine. I consent to the use of my Aadhaar number for identity verification for empanelment only.</label></div>
  <div id="trErr" class="err" style="font-size:14px;margin-bottom:12px"></div>
  <div class="row"><button class="btn primary" type="submit" id="trBtn">Submit trainer registration</button><a class="btn" href="#home">Cancel</a></div>
  </form>`;
}
function wireTrainer(){
  const f=$('#trForm'); const a=f.elements.aadhaar;
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
  if(v('dob')&&age(v('dob'))<21) p.push('Trainers must be at least 21 years old.');
  if(!/^\d{6}$/.test(v('pin'))) p.push('Enter a 6-digit PIN code.');
  if(v('indExp')===''||+v('indExp')<0) p.push('Enter industry experience in years (0 if none).');
  if(v('trnExp')===''||+v('trnExp')<0) p.push('Enter training experience in years (0 if none).');
  if(!skills.length) p.push('Tick at least one skill you can teach.');
  TRAINER_DOCS.filter(d=>d.req).forEach(d=>{if(!f.elements['doc_'+d.key].files[0])p.push('Upload '+d.label.toLowerCase()+'.')});
  if(!f.elements.declare.checked) p.push('Tick the declaration to continue.');
  if(p.length){err.innerHTML=p.map(esc).join('<br>');err.scrollIntoView({behavior:'smooth',block:'center'});return}
  const hash=await sha256('aadhaar:'+aadhaar);
  const dup=list('trainers').find(t=>t.aadhaarHash===hash&&t.status!=='rejected');
  if(dup){err.textContent=`A trainer registration (${dup.id}) already exists for this Aadhaar number. Use Track application to check it.`;return}
  const btn=$('#trBtn'); btn.disabled=true; btn.textContent='Uploading documents…';
  try{
    const id=nextId(`KAAC-SDE-TR-${YEAR}-`,'trainers');
    const docs=[]; let photo='';
    for(const d of TRAINER_DOCS){const file=f.elements['doc_'+d.key].files[0]; if(!file) continue;
      const pf=await processFile(file); const docId=id+'-'+d.key;
      await put('docs',docId,{id:docId,trainerId:id,key:d.key,name:file.name,type:pf.type,data:pf.data});
      docs.push({key:d.key,label:d.label,name:file.name,type:pf.type,docId,status:'pending'});
      if(d.key==='photo') photo=await readImage(file,160,.75);
    }
    const t={id,kind:'trainer',name:v('name'),father:v('father'),dob:v('dob'),gender:v('gender'),aadhaarLast4:aadhaar.slice(-4),aadhaarHash:hash,
      mobile:v('mobile'),email:v('email'),address:v('address'),district:v('district'),pin:v('pin'),qual:v('qual'),specialisation:v('specialisation'),
      indExp:+v('indExp'),trnExp:+v('trnExp'),totNo:v('totNo'),totBody:v('totBody'),courses:skills,sectors:[...new Set(skills.map(c=>S.courses[c]?.sectorId))],prefCentres:pcs,
      docs,photo,status:'submitted',createdAt:nowISO(),history:[{at:nowISO(),by:v('name'),role:'Trainer',action:'Trainer registration submitted',remark:''}]};
    await put('trainers',id,t); await notify(t,'submitted');
    route='track'; history.replaceState(null,'','#track'); render();
    trackResult(t.id,t.dob,true);
  }catch(ex){err.textContent=ex.message||'Could not submit. Try again.';btn.disabled=false;btn.textContent='Submit trainer registration'}
}

/* Trainer status page (via Track application) */
function trainerTrackHTML(t){
  const bs=trainerBatches(t.id);
  return `<div class="grid g2"><div class="panel">
    <div class="row" style="align-items:flex-start">${t.photo?`<img class="photo" src="${t.photo}" alt="">`:''}<div><h2 style="margin-bottom:4px">${esc(t.name)}</h2><div class="muted small">${esc(t.id)} · Trainer</div><div style="margin-top:8px">${tStatusTag(t.status)}</div></div></div>
    <hr class="sep"><dl class="kv">${t.empanelNo?`<dt>Empanelment no.</dt><dd>${esc(t.empanelNo)}</dd>`:''}<dt>Skills</dt><dd>${(t.courses||[]).map(c=>esc(courseName(c))).join(', ')}</dd><dt>Experience</dt><dd>${t.indExp} yrs industry, ${t.trnExp} yrs training</dd></dl>
    ${bs.length?`<h3 style="margin-top:16px">Assigned batches</h3><div class="tw"><table><thead><tr><th>Batch</th><th>Skill</th><th>Centre</th><th>Dates</th><th>Status</th></tr></thead><tbody>${bs.map(b=>`<tr><td class="id">${esc(b.id)}</td><td>${esc(courseName(b.courseId))}</td><td>${esc(centreName(b.centreId))}<div class="small muted">${esc(b.centreId)}</div></td><td class="small">${fmtD(b.start)} – ${fmtD(b.end)}</td><td><span class="tag">${esc(b.status)}</span></td></tr>`).join('')}</tbody></table></div>`:''}
    ${t.status==='returned'?tResubmitHTML(t):''}
  </div>
  <div class="panel"><h3>Progress</h3><ul class="tl">${[...(t.history||[])].reverse().map(h=>`<li><b>${esc(h.action)}</b>${h.remark?`<div>${esc(h.remark)}</div>`:''}<small>${fmtDT(h.at)} · ${esc(h.role)}</small></li>`).join('')}</ul></div></div>`;
}
function tResubmitHTML(t){
  const flagged=(t.docs||[]).filter(d=>d.status==='rejected');
  const keys=flagged.length?flagged.map(d=>d.key):TRAINER_DOCS.map(d=>d.key);
  return `<hr class="sep"><h3>Correct and resubmit</h3><p class="small">${esc(t.history.slice(-1)[0]?.remark||'')}</p>
  <form onsubmit="event.preventDefault();resubmitTrainer('${t.id}',this)">${keys.map(k=>{const d=TRAINER_DOCS.find(x=>x.key===k);return `<div class="field"><label>${d.label}</label><input type="file" name="doc_${k}" accept="image/*,application/pdf"></div>`}).join('')}
  <button class="btn primary">Resubmit registration</button></form>`;
}
async function resubmitTrainer(id,f){
  const t=S.trainers[id]; const docs=[...t.docs]; let photo=t.photo, n=0;
  try{for(const inp of f.querySelectorAll('input[type=file]')){const file=inp.files[0];if(!file)continue;const key=inp.name.slice(4);const pf=await processFile(file);const docId=id+'-'+key;
    await put('docs',docId,{id:docId,trainerId:id,key,name:file.name,type:pf.type,data:pf.data});
    const i=docs.findIndex(d=>d.key===key);const rec={key,label:TRAINER_DOCS.find(d=>d.key===key).label,name:file.name,type:pf.type,docId,status:'pending'};if(i>=0)docs[i]=rec;else docs.push(rec);
    if(key==='photo')photo=await readImage(file,160,.75);n++}
  }catch(ex){toast(ex.message);return}
  if(!n){toast('Choose at least one corrected document.');return}
  await setTStatus(t,'submitted','Resubmitted with corrected documents','',{docs,photo},null);
  toast('Registration resubmitted.'); trackResult(id,t.dob);
}

/* Staff: trainer list, verification and empanelment */
let trF={status:'',course:'',q:''};
function sTrainers(){
  let ts=list('trainers');
  if(ME.role==='centre'){const mine=new Set(list('batches').filter(b=>b.centreId===ME.centreId).map(b=>b.trainerId));ts=ts.filter(t=>mine.has(t.id))}
  if(trF.status) ts=ts.filter(t=>t.status===trF.status);
  if(trF.course) ts=ts.filter(t=>(t.courses||[]).includes(trF.course));
  if(trF.q){const q=trF.q.toLowerCase();ts=ts.filter(t=>(t.id+t.name+t.mobile+t.specialisation).toLowerCase().includes(q))}
  ts.sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  const hint={dealing:'Open a registration to check documents, then mark it verified, return it for correction or reject it.',training:'Empanel verified trainers. Only empanelled trainers can be assigned to batches.',centre:'Trainers assigned to batches at your centre.'}[ME.role]||'';
  return `<h1>Trainers</h1>${hint?`<p class="muted">${hint}</p>`:''}
  <p class="small muted">New trainers register from the public <a href="#trainer">Trainer registration</a> page.</p>
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
    <div><div class="row" style="align-items:flex-start;margin-bottom:12px">${t.photo?`<img class="photo" src="${t.photo}" alt="">`:''}<div>${tStatusTag(t.status)}<div class="small muted" style="margin-top:6px">Registered ${fmtDT(t.createdAt)}</div></div></div>
      <dl class="kv"><dt>Aadhaar</dt><dd>XXXX XXXX ${esc(t.aadhaarLast4)}</dd><dt>Father / spouse</dt><dd>${esc(t.father)}</dd><dt>Date of birth</dt><dd>${fmtD(t.dob)} (age ${age(t.dob)})</dd><dt>Gender</dt><dd>${esc(t.gender)}</dd>
      <dt>Mobile / email</dt><dd>${esc(t.mobile)}<br>${esc(t.email)}</dd><dt>Address</dt><dd>${esc([t.address,t.district,t.pin].filter(Boolean).join(', '))}</dd>
      <dt>Qualification</dt><dd>${esc(t.qual)} · ${esc(t.specialisation)}</dd><dt>Experience</dt><dd>${t.indExp} yrs industry, ${t.trnExp} yrs training</dd>
      <dt>ToT certificate</dt><dd>${t.totNo?esc(t.totNo)+(t.totBody?' · '+esc(t.totBody):''):'Not certified'}</dd>
      ${t.empanelNo?`<dt>Empanelment no.</dt><dd>${esc(t.empanelNo)}</dd>`:''}
      <dt>Skills</dt><dd>${(t.courses||[]).map(c=>`${esc(courseName(c))} <span class="muted small">(${esc(c)})</span>`).join('<br>')}</dd>
      <dt>Preferred centres</dt><dd>${(t.prefCentres||[]).map(c=>esc(c)).join(', ')||'Any'}</dd></dl>
      ${bs.length?`<h3 style="margin-top:16px">Batches</h3>${bs.map(b=>`<div class="small" style="padding:5px 0;border-bottom:1px dashed var(--line)"><b>${esc(b.id)}</b> · ${esc(courseName(b.courseId))} · ${esc(b.centreId)}<div class="muted">${fmtD(b.start)} – ${fmtD(b.end)} · ${esc(b.status)}</div></div>`).join('')}`:''}
    </div>
    <div><h3>Documents</h3>${(t.docs||[]).map(d=>`<div class="row" style="justify-content:space-between;padding:7px 0;border-bottom:1px dashed var(--line)"><span class="small"><b>${esc(d.label)}</b><br><span class="muted">${esc(d.name)}</span></span>
      <span class="row" style="gap:6px">${d.status==='ok'?'<span class="tag ok">OK</span>':d.status==='rejected'?'<span class="tag bad">Incorrect</span>':''}<button class="btn sm" onclick="viewDoc('${d.docId}')">View</button>
      ${can('dealing')&&t.status==='submitted'?`<button class="btn sm" onclick="markTDoc('${id}','${d.key}','ok')">OK</button><button class="btn sm danger" onclick="markTDoc('${id}','${d.key}','rejected')">Incorrect</button>`:''}</span></div>`).join('')}
      <div id="docView" style="margin-top:12px"></div>
      <h3 style="margin-top:16px">History</h3><ul class="tl">${[...(t.history||[])].reverse().map(h=>`<li><b>${esc(h.action)}</b>${h.remark?`<div class="small">${esc(h.remark)}</div>`:''}<small>${fmtDT(h.at)} · ${esc(h.by)} (${esc(h.role)})</small></li>`).join('')}</ul></div>
  </div>
  ${actions.length?`<div class="field" style="margin-top:12px"><label>Remark</label><textarea id="trRemark" placeholder="Required when returning, rejecting or marking inactive"></textarea></div>`:''}
  </div>${actions.length?`<div class="mf">${actions.join('')}</div>`:''}`,true);
}
async function markTDoc(id,key,status){const t=S.trainers[id];await put('trainers',id,{...t,docs:t.docs.map(d=>d.key===key?{...d,status}:d)});openTrainer(id)}
async function trainerAction(id,act){
  const t=S.trainers[id]; const remark=($('#trRemark')?.value||'').trim();
  if(['reject','return','inactive'].includes(act)&&!remark){toast('Add a remark explaining the reason.');$('#trRemark').focus();return}
  if(act==='inactive'&&trainerBatches(id).some(b=>b.status!=='completed')){toast('Reassign this trainer’s active batches first.');return}
  if(act==='verify'){if(t.docs.some(d=>d.status==='rejected')){toast('A document is marked incorrect. Return the registration instead.');return}
    await setTStatus(t,'verified','Documents verified',remark,{docs:t.docs.map(d=>({...d,status:'ok'}))})}
  if(act==='return') await setTStatus(t,'returned','Returned for correction',remark);
  if(act==='reject') await setTStatus(t,'rejected','Registration rejected',remark);
  if(act==='empanel'){const no=t.empanelNo||nextId(`KAAC-SDE-EMP-${YEAR}-`,'trainers','empanelNo');await setTStatus(t,'empanelled','Empanelled as trainer',remark,{empanelNo:no,empanelledAt:nowISO()})}
  if(act==='inactive') await setTStatus(t,'inactive','Marked inactive',remark);
  if(act==='reactivate') await setTStatus(t,'empanelled','Reactivated',remark);
  toast('Saved. Trainer notified by SMS and email.'); closeModal(); render();
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
  ${ts.map(({t,clash,pref,active})=>`<tr><td><input type="radio" name="tid" value="${t.id}" ${clash?'disabled':''} ${b.trainerId===t.id?'checked':''} aria-label="Choose ${esc(t.name)}"></td><td>${esc(t.name)}<div class="small muted">${esc(t.id)}${t.totNo?' · ToT certified':''}</div></td><td class="small">${t.trnExp} yrs training<br>${t.indExp} yrs industry</td><td>${pref?'<span class="tag ok">Yes</span>':'—'}</td><td>${active}</td>
    <td class="small">${clash?`<span class="tag bad">Busy</span><div class="muted">${esc(clash.id)} until ${fmtD(clash.end)}</div>`:'<span class="tag ok">Available</span>'}</td></tr>`).join('')}</tbody></table></div>`
  :'<div class="callout">No empanelled trainer is registered for this skill yet. Empanel a trainer from the Trainers page first.</div>'}
  <div class="row" style="justify-content:flex-end;margin-top:14px">${b.trainerId?`<button type="button" class="btn danger" onclick="unassignTrainer('${bid}')">Remove current trainer</button>`:''}${ts.length?`<button class="btn primary">Assign and notify trainer</button>`:''}</div></form>`,true);
}
async function assignTrainer(bid,f){
  const tid=(f.querySelector('[name=tid]:checked')||{}).value; if(!tid){toast('Choose a trainer.');return}
  const b=S.batches[bid]; if(tid===b.trainerId){closeModal();return}
  const c=trainerClash(tid,b.start,b.end,bid); if(c){toast(`This trainer is busy with ${c.id} on those dates.`);return}
  const prev=b.trainerId;
  const nb={...b,trainerId:tid,trainer:'',trainerLog:[...(b.trainerLog||[]),{at:nowISO(),by:ME.name,trainerId:tid,action:prev?'Trainer changed':'Trainer assigned'}]};
  await put('batches',bid,nb);
  if(prev&&S.trainers[prev]) await notify(S.trainers[prev],'released',{batch:nb,subject:'Batch assignment withdrawn'});
  await notify(S.trainers[tid],'assigned',{batch:nb,subject:'Batch assignment'});
  toast(`${S.trainers[tid].name} assigned to ${bid}. Trainer notified.`); closeModal(); render();
}
async function unassignTrainer(bid){
  const b=S.batches[bid]; const prev=b.trainerId; if(!prev) return;
  if(b.status==='ongoing'&&!confirm('This batch is in training. Remove its trainer anyway?')) return;
  const nb={...b,trainerId:'',trainerLog:[...(b.trainerLog||[]),{at:nowISO(),by:ME.name,trainerId:prev,action:'Trainer removed'}]};
  await put('batches',bid,nb);
  if(S.trainers[prev]) await notify(S.trainers[prev],'released',{batch:nb,subject:'Batch assignment withdrawn'});
  toast('Trainer removed from batch.'); closeModal(); render();
}

/* ---------- Results ---------- */
function sResults(){
  const bs=list('batches').filter(b=>b.status==='ongoing'&&(ME.role!=='centre'||b.centreId===ME.centreId));
  const done=list('batches').filter(b=>b.status==='completed'&&(ME.role!=='centre'||b.centreId===ME.centreId));
  return `<h1>Attendance & results</h1><p class="muted">Record attendance and assessment marks when a batch finishes. Trainees with at least 70% attendance and 50 marks pass.</p>
  ${bs.map(b=>{const st=b.students.map(x=>S.students[x]).filter(Boolean);return `<div class="panel" style="margin-bottom:16px"><div class="row" style="justify-content:space-between"><h3 style="margin:0">${esc(b.id)} · ${esc(courseName(b.courseId))}</h3><span class="small muted">${esc(centreName(b.centreId))} · Trainer: ${S.trainers[b.trainerId]?esc(S.trainers[b.trainerId].name):'not assigned'} · ends ${fmtD(b.end)}</span></div>
    <form onsubmit="event.preventDefault();saveResults('${b.id}',this)"><div class="tw" style="margin-top:10px"><table><thead><tr><th>Student ID</th><th>Name</th><th>Attendance %</th><th>Marks /100</th></tr></thead><tbody>
    ${st.map(s=>`<tr><td class="id">${esc(s.id)}</td><td>${esc(s.name)}</td><td><input name="att_${s.id}" type="number" min="0" max="100" value="${s.result?.attendance??''}" style="max-width:110px" ${can('centre')?'':'disabled'}></td><td><input name="mk_${s.id}" type="number" min="0" max="100" value="${s.result?.marks??''}" style="max-width:110px" ${can('centre')?'':'disabled'}></td></tr>`).join('')}
    </tbody></table></div>${can('centre')?`<div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn primary">Save results and close batch</button></div>`:''}</form></div>`}).join('')||'<div class="panel">No batches in training right now. Start a planned batch from Batches.</div>'}
  ${done.length?`<h3 style="margin-top:20px">Completed batches</h3><div class="tw"><table><thead><tr><th>Batch</th><th>Skill</th><th>Passed</th><th>Not passed</th></tr></thead><tbody>${done.map(b=>{const st=b.students.map(x=>S.students[x]).filter(Boolean);const p=st.filter(s=>s.result?.result==='Pass').length;return `<tr><td class="id">${esc(b.id)}</td><td>${esc(courseName(b.courseId))}</td><td>${p}</td><td>${st.length-p}</td></tr>`}).join('')}</tbody></table></div>`:''}`;
}
const grade=m=>m>=85?'A+':m>=70?'A':m>=60?'B':m>=50?'C':'—';
async function saveResults(bid,f){
  const b=S.batches[bid]; const rows=[];
  for(const sid of b.students){const a=f['att_'+sid].value, m=f['mk_'+sid].value;if(a===''||m===''){toast('Enter attendance and marks for every trainee.');return}rows.push([sid,+a,+m])}
  for(const [sid,a,m] of rows){const pass=a>=70&&m>=50;const s=S.students[sid];
    await setStatus(s,pass?'passed':'failed',pass?'Passed final assessment':'Did not pass final assessment',`Attendance ${a}%, marks ${m}`,{result:{attendance:a,marks:m,grade:grade(m),result:pass?'Pass':'Fail',by:ME.name,at:nowISO()}})}
  await put('batches',bid,{...b,status:'completed',completedAt:nowISO()});
  toast('Results saved and batch closed.'); render();
}

/* ---------- Certificates ---------- */
function sCerts(){
  const st=myStudents(); const passed=st.filter(s=>s.status==='passed'); const certs=st.filter(s=>s.cert).sort((a,b)=>b.cert.issuedAt.localeCompare(a.cert.issuedAt));
  return `<h1>Certificates</h1>
  ${can('training')?`<div class="panel" style="margin-bottom:18px"><div class="row" style="justify-content:space-between"><h3 style="margin:0">Passed, waiting for certificate (${passed.length})</h3>${passed.length?`<button class="btn primary" onclick="issueCerts(${esc(JSON.stringify(passed.map(s=>s.id)))})">Generate all certificates</button>`:''}</div>
  <div class="tw" style="margin-top:10px"><table><thead><tr><th>Student ID</th><th>Name</th><th>Skill</th><th>Grade</th><th></th></tr></thead><tbody>${passed.map(s=>`<tr><td class="id">${esc(s.id)}</td><td>${esc(s.name)}</td><td>${esc(courseName(s.skillId))}</td><td>${esc(s.result.grade)}</td><td><button class="btn sm primary" onclick="issueCerts(['${s.id}'])">Generate</button></td></tr>`).join('')||'<tr><td colspan="5" class="muted">No one is waiting.</td></tr>'}</tbody></table></div></div>`:''}
  <h3>Issued certificates</h3><div class="tw"><table><thead><tr><th>Certificate no.</th><th>Student</th><th>Skill ID</th><th>Centre ID</th><th>Issued</th><th></th></tr></thead><tbody>
  ${certs.map(s=>`<tr><td class="id">${esc(s.cert.no)}</td><td>${esc(s.name)}<div class="small muted">${esc(s.id)}</div></td><td>${esc(s.skillId)}</td><td>${esc(s.centreId)}</td><td class="small">${fmtD(s.cert.issuedAt)}</td><td><button class="btn sm" onclick="openDoc('cert','${s.id}')">View</button></td></tr>`).join('')||'<tr><td colspan="6" class="muted">No certificates issued yet.</td></tr>'}
  </tbody></table></div>`;
}
async function issueCerts(ids){
  for(const id of ids){const s=S.students[id];if(s.status!=='passed')continue;const no=nextId(`KAAC-SDE-CERT-${YEAR}-`,'students','certNo');
    await setStatus(s,'certified','Certificate generated',no,{certNo:no,cert:{no,issuedAt:nowISO(),by:ME.name}})}
  toast(`${ids.length} certificate(s) generated.`); render();
}

/* ---------- OJT letters ---------- */
function sOjt(){
  const os=list('ojt').filter(o=>ME.role!=='centre'||S.students[o.studentId]?.centreId===ME.centreId).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
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
  <div class="field"><label>Trainee</label><select name="sid" required>${certs.map(s=>`<option value="${s.id}">${esc(s.name)} · ${esc(s.id)} · ${esc(courseName(s.skillId))}</option>`).join('')}</select></div>
  <div class="field"><label>Employer / establishment</label><input name="employer" required></div>
  <div class="field"><label>Employer address</label><input name="address" required></div>
  <div class="field"><label>OJT role</label><input name="role" required placeholder="e.g. Trainee front office associate"></div>
  <div class="field"><label>Start date</label><input name="start" type="date" required min="${today()}"></div>
  <div class="field"><label>Duration</label><select name="duration"><option>1 month</option><option>2 months</option><option>3 months</option><option>6 months</option></select></div>
  </div><div class="row" style="justify-content:flex-end"><button class="btn primary">Send to Joint Secretary for signature</button></div></form>`);
}
async function createOjt(f){
  const id='OJT'+Date.now().toString(36); const letterNo=nextId(`KAAC-SDE-OJT-${YEAR}-`,'ojt','letterNo');
  await put('ojt',id,{id,letterNo,studentId:f.sid.value,employer:f.employer.value,address:f.address.value,role:f.role.value,start:f.start.value,duration:f.duration.value,status:'pending',createdAt:nowISO(),requestedBy:ME.name,requestedRole:ROLES[ME.role]});
  toast('Letter drafted and sent for signature.'); closeModal(); render();
}
function signDialog(id){
  openModal(`<div class="mh"><h3 style="margin:0">Sign recommendation letter</h3><button class="btn sm" onclick="closeModal()">Close</button></div>
  <form class="mb" onsubmit="event.preventDefault();signOjt('${id}',this)"><p>Review the letter, then confirm with your password to sign it as ${esc(settings().jtsDesignation)}.</p>
  <button type="button" class="btn" onclick="openDoc('ojt','${id}',true)">Preview letter</button>
  <div class="field" style="margin-top:14px;max-width:300px"><label>Your password</label><input type="password" name="p" required autocomplete="current-password"></div>
  <div id="signErr" class="err"></div><div class="row" style="justify-content:flex-end"><button class="btn primary">Sign letter</button></div></form>`);
}
async function signOjt(id,f){
  const u=S.users[ME.id]; if(u.pwHash!==await sha256(ME.id+':'+f.p.value)){$('#signErr').textContent='Password is incorrect.';return}
  const o=S.ojt[id]; const at=nowISO(); const sig=(await sha256([o.letterNo,o.studentId,o.employer,o.start,ME.id,at].join('|'))).slice(0,20).toUpperCase();
  const no={...o,status:'signed',signedAt:at,signedBy:ME.name,signedById:ME.id,sigRef:sig};
  await put('ojt',id,no);
  const s=S.students[o.studentId]; await notify(s,'ojt',no);
  await put('students',s.id,{...s,history:[...s.history,{at,by:ME.name,role:ROLES[ME.role],action:'OJT recommendation letter signed',remark:`${no.letterNo} · ${o.employer}`}]});
  toast('Letter signed. Trainee notified.'); closeModal(); render();
}

/* ---------- Mapping ---------- */
function sMapping(){
  const st=myStudents().filter(s=>s.centreId);
  return `<h1>Centre mapping</h1><p class="muted">Every trainee placed in a batch is mapped to a Skill ID, a Centre ID and the batch’s trainer.</p>
  <div class="grid g3" style="margin-bottom:18px">${list('centres').filter(c=>ME.role!=='centre'||c.id===ME.centreId).map(c=>`<div class="panel flat"><b>${esc(c.id)}</b><div>${esc(c.name)}</div><div class="small muted">${c.sectors.map(sectorName).join(', ')}</div><div class="small" style="margin-top:6px">${st.filter(s=>s.centreId===c.id).length} trainees mapped</div></div>`).join('')}</div>
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
  ${!st.smsGateway||!st.emailFrom?`<div class="callout" style="margin-bottom:14px">Messages are generated and logged for every status change. ${!st.smsGateway?'No SMS gateway is connected. ':''}${!st.emailFrom?'No mail server is connected. ':''}Delivery starts once the department’s DLT-registered SMS gateway and mail server are connected on the server side.</div>`:''}
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
  if(masterTab==='courses') body=`<div class="tw"><table><thead><tr><th>Skill ID</th><th>Course</th><th>Sector</th><th>NSQF</th><th>Hours</th><th>Min. qualification</th><th>Age</th><th>Seats</th><th>Active</th><th></th></tr></thead><tbody>${list('courses').sort((a,b)=>a.id.localeCompare(b.id)).map(c=>`<tr><td class="id">${esc(c.id)}</td><td>${esc(c.name)}</td><td>${esc(sectorName(c.sectorId))}</td><td>${c.nsqf}</td><td>${c.hours}</td><td>${esc(c.minQual)}</td><td>${c.minAge}–${c.maxAge}</td><td>${c.seats}</td><td>${c.active?'Yes':'No'}</td><td><button class="btn sm" onclick="editRec('courses','${c.id}')">Edit</button></td></tr>`).join('')}</tbody></table></div>`;
  if(masterTab==='sectors') body=`<div class="tw"><table><thead><tr><th>Sector ID</th><th>Name</th><th>Description</th><th>Courses</th><th></th></tr></thead><tbody>${list('sectors').map(s=>`<tr><td class="id">${esc(s.id)}</td><td>${esc(s.name)}</td><td class="small">${esc(s.desc)}</td><td>${list('courses').filter(c=>c.sectorId===s.id).length}</td><td><button class="btn sm" onclick="editRec('sectors','${s.id}')">Edit</button></td></tr>`).join('')}</tbody></table></div>`;
  if(masterTab==='centres') body=`<div class="tw"><table><thead><tr><th>Centre ID</th><th>Name</th><th>District</th><th>Sectors</th><th>Capacity</th><th>Manager</th><th>Active</th><th></th></tr></thead><tbody>${list('centres').sort((a,b)=>a.id.localeCompare(b.id)).map(c=>`<tr><td class="id">${esc(c.id)}</td><td>${esc(c.name)}<div class="small muted">${esc(c.address)}</div></td><td>${esc(c.district)}</td><td class="small">${c.sectors.map(sectorName).join(', ')}</td><td>${c.capacity}</td><td class="small">${list('users').filter(u=>u.role==='centre'&&u.centreId===c.id).map(u=>esc(u.name)).join(', ')||'—'}</td><td>${c.active?'Yes':'No'}</td><td><button class="btn sm" onclick="editRec('centres','${c.id}')">Edit</button></td></tr>`).join('')}</tbody></table></div>`;
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
    <div class="field"><label>Active</label><select name="active"><option value="1">Yes</option><option value="0" ${r&&!r.active?'selected':''}>No</option></select></div></div>`;
  if(coll==='sectors') f=`<div class="grid g2"><div class="field"><label>Sector ID</label><input name="id" value="${esc(r?.id||'')}" ${r?'readonly':''} placeholder="Short code, e.g. LOG" required></div><div class="field"><label>Name</label><input name="name" value="${esc(r?.name||'')}" required></div></div><div class="field"><label>Description</label><textarea name="desc">${esc(r?.desc||'')}</textarea></div>`;
  if(coll==='centres'){const next='KAAC-C-'+String(list('centres').length+1).padStart(3,'0');f=`<div class="grid g3">
    <div class="field"><label>Centre ID</label><input name="id" value="${esc(r?.id||next)}" ${r?'readonly':''} required><div class="hint">Unique and permanent once created</div></div>
    <div class="field"><label>Centre name</label><input name="name" value="${esc(r?.name||'')}" required></div>
    <div class="field"><label>District</label><select name="district"><option ${r?.district==='Karbi Anglong'?'selected':''}>Karbi Anglong</option><option ${r?.district==='West Karbi Anglong'?'selected':''}>West Karbi Anglong</option></select></div>
    <div class="field"><label>Address</label><input name="address" value="${esc(r?.address||'')}"></div>
    <div class="field"><label>Phone</label><input name="phone" value="${esc(r?.phone||'')}"></div>
    <div class="field"><label>Capacity (trainees)</label><input name="capacity" type="number" value="${r?.capacity||100}"></div>
    <div class="field"><label>Active</label><select name="active"><option value="1">Yes</option><option value="0" ${r&&!r.active?'selected':''}>No</option></select></div></div>
    <div class="field"><label>Sectors offered</label><div class="chips">${list('sectors').map(s=>`<label class="chip" style="font-weight:500"><input type="checkbox" name="sec" value="${s.id}" ${r?.sectors?.includes(s.id)?'checked':''}> ${esc(s.name)}</label>`).join('')}</div></div>`}
  openModal(`<div class="mh"><h3 style="margin:0">${isNew?'Add':'Edit'} ${coll.slice(0,-1)}</h3><button class="btn sm" onclick="closeModal()">Close</button></div>
  <form class="mb" onsubmit="event.preventDefault();saveRec('${coll}',this,${isNew})">${f}
  <div class="row" style="justify-content:flex-end">${!isNew&&coll!=='centres'?`<button type="button" class="btn danger" onclick="removeRec('${coll}','${id}')">Delete</button>`:''}<button class="btn primary">Save</button></div></form>`,true);
}
async function saveRec(coll,f,isNew){
  const id=f.id.value.trim().toUpperCase(); if(!/^[A-Z0-9-]+$/.test(id)){toast('IDs can use letters, numbers and hyphens only.');return}
  if(isNew&&S[coll][id]){toast('That ID already exists.');return}
  let o={...(S[coll][id]||{}),id};
  if(coll==='courses') Object.assign(o,{name:f.name.value,sectorId:f.sectorId.value,nsqf:+f.nsqf.value,hours:+f.hours.value,minQual:f.minQual.value,minAge:+f.minAge.value,maxAge:+f.maxAge.value,seats:+f.seats.value,active:f.active.value==='1',fee:'Free'});
  if(coll==='sectors') Object.assign(o,{name:f.name.value,desc:f.desc.value});
  if(coll==='centres') Object.assign(o,{name:f.name.value,district:f.district.value,address:f.address.value,phone:f.phone.value,capacity:+f.capacity.value,active:f.active.value==='1',sectors:[...f.querySelectorAll('[name=sec]:checked')].map(i=>i.value)});
  await put(coll,id,o); toast('Saved.'); closeModal(); render();
}
async function removeRec(coll,id){
  if(coll==='sectors'&&list('courses').some(c=>c.sectorId===id)){toast('Move or delete this sector’s courses first.');return}
  if(coll==='courses'&&list('students').some(s=>s.pref1===id||s.skillId===id)){toast('Students are linked to this course. Mark it inactive instead.');return}
  await del(coll,id); toast('Deleted.'); closeModal(); render();
}

/* ---------- Users ---------- */
function sUsers(){
  return `<h1>Users & roles</h1><div class="row" style="margin-bottom:14px"><span class="muted">Each officer logs in with their own account. Centre Managers see only their centre.</span><button class="btn primary" style="margin-left:auto" onclick="editUser()">Add user</button></div>
  <div class="tw"><table><thead><tr><th>Username</th><th>Name</th><th>Role</th><th>Centre</th><th>Status</th><th></th></tr></thead><tbody>
  ${list('users').sort((a,b)=>a.role.localeCompare(b.role)).map(u=>`<tr><td class="id">${esc(u.id)}</td><td>${esc(u.name)}</td><td>${ROLES[u.role]}</td><td>${esc(u.centreId||'—')}</td><td>${u.active?'<span class="tag ok">Active</span>':'<span class="tag">Disabled</span>'}</td><td><button class="btn sm" onclick="editUser('${u.id}')">Edit</button></td></tr>`).join('')}
  </tbody></table></div>`;
}
function editUser(id){
  const u=id?S.users[id]:null;
  openModal(`<div class="mh"><h3 style="margin:0">${u?'Edit':'Add'} user</h3><button class="btn sm" onclick="closeModal()">Close</button></div>
  <form class="mb" onsubmit="event.preventDefault();saveUser(this,${!u})"><div class="grid g2">
  <div class="field"><label>Username</label><input name="id" value="${esc(u?.id||'')}" ${u?'readonly':''} required></div>
  <div class="field"><label>Full name</label><input name="name" value="${esc(u?.name||'')}" required></div>
  <div class="field"><label>Role</label><select name="role">${Object.entries(ROLES).map(([k,v])=>`<option value="${k}" ${u?.role===k?'selected':''}>${v}</option>`).join('')}</select></div>
  <div class="field"><label>Centre (Centre Manager only)</label><select name="centreId"><option value="">—</option>${list('centres').map(c=>`<option value="${c.id}" ${u?.centreId===c.id?'selected':''}>${esc(c.name)} (${c.id})</option>`).join('')}</select></div>
  <div class="field"><label>${u?'New password (leave blank to keep)':'Password'}</label><input name="pw" type="password" ${u?'':'required'} minlength="8" autocomplete="new-password"></div>
  <div class="field"><label>Status</label><select name="active"><option value="1">Active</option><option value="0" ${u&&!u.active?'selected':''}>Disabled</option></select></div>
  </div><div class="row" style="justify-content:flex-end"><button class="btn primary">Save user</button></div></form>`);
}
async function saveUser(f,isNew){
  const id=f.id.value.trim().toLowerCase(); if(!/^[a-z0-9._-]+$/.test(id)){toast('Username can use lowercase letters, numbers, dot, dash and underscore.');return}
  if(isNew&&S.users[id]){toast('That username is taken.');return}
  if(f.role.value==='centre'&&!f.centreId.value){toast('Choose a centre for the Centre Manager.');return}
  if(id===ME.id&&f.active.value==='0'){toast('You cannot disable your own account.');return}
  const o={...(S.users[id]||{}),id,name:f.name.value,role:f.role.value,centreId:f.role.value==='centre'?f.centreId.value:'',active:f.active.value==='1'};
  if(f.pw.value) o.pwHash=await sha256(id+':'+f.pw.value);
  await put('users',id,o); toast('User saved.'); closeModal(); render();
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
  <div class="field"><label>Council logo</label><div class="row"><span class="logo-slot" style="width:56px;height:56px"><img src="${s.logo||LOGO_KAACLOGO}" alt=""></span><input type="file" id="logoFile" accept="image/*" style="max-width:260px"></div>
    <div class="hint">The KAAC logo is used by default. Upload a different one only if needed. <label style="display:inline;font-weight:500"><input type="checkbox" id="logoRemove"> Remove current logo</label></div></div>
  <div class="field"><label>Helpline phone</label><input name="phone" value="${esc(s.phone)}"></div>
  <div class="field"><label>Contact email</label><input name="email" value="${esc(s.email)}"></div>
  <div class="field"><label>Office hours</label><input name="officeHours" value="${esc(s.officeHours)}"></div></div>
  <div class="field"><label>About the department (one paragraph per line)</label><textarea name="aboutText" rows="6">${esc(s.aboutText)}</textarea></div>
  <h3>Aptitude test defaults</h3><div class="grid g2">
  <div class="field"><label>Default venue</label><input name="defaultVenue" value="${esc(s.defaultVenue)}"></div>
  <div class="field"><label>Default reporting time</label><input name="defaultTime" value="${esc(s.defaultTime)}"></div></div>
  <h3>Notifications</h3><p class="small muted">Record the gateway details here. Actual sending requires a server-side connector holding the API keys — never put secret keys in this page.</p><div class="grid g3">
  <div class="field"><label>SMS sender ID (DLT header)</label><input name="smsSender" value="${esc(s.smsSender)}" placeholder="e.g. KAACSD"></div>
  <div class="field"><label>SMS gateway name</label><input name="smsGateway" value="${esc(s.smsGateway)}" placeholder="Leave blank if not connected"></div>
  <div class="field"><label>Email sender address</label><input name="emailFrom" value="${esc(s.emailFrom)}" placeholder="Leave blank if not connected"></div></div>
  <h3>Fallback highlights</h3><div class="field"><label>Shown in the ticker only when no notices are published (one per line)</label><textarea name="notices" rows="4">${esc(s.notices)}</textarea></div>
  <button class="btn primary">Save settings</button></form>`;
}
async function saveSettings(f){const o={...settings(),id:'main'};[...f.elements].forEach(el=>{if(el.name)o[el.name]=el.value});
  const lf=$('#logoFile').files[0]; if(lf){try{o.logo=await readImage(lf,240,.92,'image/png')}catch(e){toast('Could not read the logo image.');return}} else if($('#logoRemove').checked) o.logo='';
  await put('settings','main',o);toast('Settings saved.');render()}

/* ---------- CSV export ---------- */
async function saveFile(filename,data){
  let dl=null; try{dl=window.claude?.use?await window.claude.use('downloads'):null}catch(e){}
  if(dl){try{await dl.save({filename,data});return}catch(e){if(e.code!=='declined')toast('Download not available here: '+(e.message||e.code));return}}
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data]));a.download=filename;document.body.appendChild(a);a.click();a.remove();
}
const csvCell=v=>`"${String(v??'').replace(/"/g,'""')}"`;
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
function letterhead(){const s=settings();return `<div class="wv"></div><div class="lh"><img src="${s.logo||LOGO_KAACLOGO}" alt="" style="width:62px;height:62px;object-fit:contain;flex:none"><div><b>${esc(s.deptName)}</b><span>${esc(s.council)} · ${esc(s.address)}</span></div></div>`}
function docAdmit(s){
  return `<div class="d">${letterhead()}<div class="ttl">ADMIT CARD — Aptitude Test &amp; Counselling, ${YEAR}</div>
  <div style="display:flex;gap:18px;align-items:flex-start"><table style="flex:1">
   <tr><td class="k">Admit card no.</td><td><b>${esc(s.admit.no)}</b></td></tr><tr><td class="k">Application / Student ID</td><td>${esc(s.id)}</td></tr>
   <tr><td class="k">Name</td><td><b>${esc(s.name)}</b></td></tr><tr><td class="k">Father’s name</td><td>${esc(s.father)}</td></tr>
   <tr><td class="k">Date of birth</td><td>${fmtD(s.dob)}</td></tr><tr><td class="k">Aadhaar</td><td>XXXX XXXX ${esc(s.aadhaarLast4)}</td></tr>
   <tr><td class="k">Course applied</td><td>${esc(courseName(s.pref1))} (${esc(s.pref1)})</td></tr><tr><td class="k">Category</td><td>${esc(s.category)}</td></tr>
   <tr><td class="k">Test date &amp; time</td><td><b>${fmtD(s.admit.date)}, ${esc(s.admit.time)}</b></td></tr><tr><td class="k">Venue</td><td><b>${esc(s.admit.venue)}</b></td></tr></table>
   <div style="text-align:center;padding-top:14px">${s.photo?`<img src="${s.photo}" style="width:110px;height:136px;object-fit:cover;border:1px solid #999">`:'<div style="width:110px;height:136px;border:1px dashed #999;font-size:11px;display:flex;align-items:center;justify-content:center">Affix photo</div>'}<div class="qr" style="margin-top:8px">${qrSVG('KAAC-SDE ADMIT '+s.admit.no+' '+s.id)}</div></div></div>
  <b style="font-size:13px">Instructions</b><ol><li>Report 30 minutes before the reporting time with this admit card.</li><li>Bring your original Aadhaar card and qualification certificate for verification.</li><li>Mobile phones are not allowed in the test hall.</li><li>This admit card does not guarantee selection. Selection depends on the test and counselling.</li></ol>
  <div class="sig"><div><div class="ln">Signature of candidate</div></div><div><div class="small">Issued electronically on ${fmtD(s.admit.issuedAt)}</div><div class="ln">${esc(s.admit.by||'')}<br>Supervising Officer</div></div></div></div>`;
}
function docCert(s){
  const c=S.courses[s.skillId]||{}; const b=S.batches[s.batchId]||{}; const st=settings();
  return `<div class="d cert"><div class="wv"></div><div class="in">
  <img src="${st.logo||LOGO_KAACLOGO}" alt="" style="display:block;margin:0 auto 8px;width:78px;height:78px;object-fit:contain">
  <div style="font:600 15px 'Source Serif 4',Georgia,serif">${esc(st.deptName)}</div><div class="small">${esc(st.council)}</div>
  <h1 style="font-size:32px;margin:22px 0 4px;color:#1A2321">Certificate of Skill Training</h1><div class="small">Certificate no. ${esc(s.cert.no)}</div>
  <p style="margin-top:22px">This is to certify that</p><div class="name">${esc(s.name)}</div>
  <p>${s.gender==='Female'?'daughter':s.gender==='Male'?'son':'child'} of ${esc(s.father)}, Student ID ${esc(s.id)}, has successfully completed the training programme in</p>
  <div style="font:600 21px 'Source Serif 4',Georgia,serif;margin:4px 0">${esc(c.name||s.skillId)}</div>
  <p>Skill ID ${esc(s.skillId)} · NSQF Level ${esc(c.nsqf||'')} · ${esc(c.hours||'')} hours<br>at ${esc(centreName(s.centreId))} (Centre ID ${esc(s.centreId)}), batch ${esc(s.batchId)}, from ${fmtD(b.start)} to ${fmtD(b.end)},<br>and has been awarded <b>Grade ${esc(s.result?.grade||'')}</b>.</p>
  <div class="sig" style="margin-top:40px"><div class="qr">${qrSVG('KAAC-SDE CERT '+s.cert.no)}<div class="small">Verify at the portal</div></div>
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
function openDoc(kind,id,preview){
  let html,name;
  if(kind==='admit'){const s=S.students[id];html=docAdmit(s);name=`Admit-card-${s.admit.no}`}
  if(kind==='cert'){const s=S.students[id];html=docCert(s);name=`Certificate-${s.cert.no}`}
  if(kind==='ojt'){const o=S.ojt[id];html=docOjt(o);name=`OJT-letter-${o.letterNo}`}
  currentDoc={html,name};
  openModal(`<div class="mh"><h3 style="margin:0">${esc(name.replace(/-/g,' ').replace(/^(\w+) (\w+)/,'$1 $2'))}</h3><button class="btn sm" onclick="${preview?`signDialog('${id}')`:'closeModal()'}">${preview?'Back':'Close'}</button></div>
  <div class="mb"><div class="docpreview"><style>${DOC_CSS}</style>${html}</div></div>
  <div class="mf"><button class="btn" onclick="printDoc()">Print</button><button class="btn primary" onclick="downloadDoc()">Download</button></div>`,true);
}
function printDoc(){$('#printArea').innerHTML=`<style>${DOC_CSS} @page{margin:10mm}</style>${currentDoc.html}`;setTimeout(()=>{try{window.print()}catch(e){toast('Printing is blocked here. Use Download, then print the file.')}},50)}
function downloadDoc(){
  const full=`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${esc(currentDoc.name)}</title><link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@600&family=Noto+Sans:wght@400;600&display=swap" rel="stylesheet"><style>body{margin:0;background:#eee;padding:20px}${DOC_CSS}@media print{body{background:#fff;padding:0}}</style></head><body>${currentDoc.html}<script>window.onload=()=>setTimeout(()=>window.print(),400)<\/script></body></html>`;
  saveFile(currentDoc.name+'.html',full);
}

/* ============================== Start ============================== */
readHash();
initStore();
