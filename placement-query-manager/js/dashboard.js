function saveState(){
  // Sync user object back into students if student role
  if(S.role==='student' && S.user && S.user.tok){
    S.students[S.user.tok] = S.user;
  }
  localStorage.setItem(STORE_KEY, JSON.stringify({
    students:S.students, queue:S.queue, resolved:S.resolved, notes:S.notes,
    qCount:S.qCount, sCount:S.sCount,
    prRes:S.prRes, prEsc:S.prEsc, coRes:S.coRes, coEsc:S.coEsc, ofRes:S.ofRes
  }));
}

/* ══ BOOT — load session & data ══ */
const _sess = (function(){
  try{ return JSON.parse(localStorage.getItem(SESSION_KEY)||'null'); }catch(e){ return null; }
})();
if(!_sess || !_sess.user){
  window.location.href = 'login.html';
  throw new Error('no session');
}
const _d = loadData() || {
  students:{}, queue:[], resolved:[], notes:{},
  qCount:1, sCount:1,
  prRes:0, prEsc:0, coRes:0, coEsc:0, ofRes:0
};

/* ══════════════════════════════════════
   STATE
══════════════════════════════════════ */
const S={
  role: _sess.role,
  user: _sess.user,
  students: _d.students,
  queue: _d.queue,
  resolved: _d.resolved,
  notes: _d.notes,
  qCount: _d.qCount,
  sCount: _d.sCount,
  prRes: _d.prRes,  prEsc: _d.prEsc,
  coRes: _d.coRes,  coEsc: _d.coEsc,
  ofRes: _d.ofRes,
  coords:{
    'Ananya Sharma':     {name:'Ananya Sharma',     mob:'9000000001',role:'Placement Rep.',   tier:1},
    'Prof. Rakesh Mehta':{name:'Prof. Rakesh Mehta',mob:'9000000002',role:'Coordinator',      tier:2},
    'Dr. Priya Nair':    {name:'Dr. Priya Nair',    mob:'9000000003',role:'Placement Officer', tier:3},
  }
};
function doLogout(){
  localStorage.removeItem(SESSION_KEY);
  window.location.href = 'login.html';
}

const L1=['form','venue','eligibility','dress_code','faq'];
const L2=['resume_review','shortlist','interview_reschedule','document'];

const GUIDANCE={
  form:"Log in to the AIT placement portal using your college email, navigate to the company listing, and click Apply. Fill all mandatory fields before submitting. If the portal shows an error, clear browser cache and retry.",
  venue:"Venue and PPT timings are posted on the official notice board and the T&P WhatsApp group at least 24 hours in advance. Arrive 15 minutes early with your college ID.",
  eligibility:"Eligibility criteria (CGPA, branch, backlogs) are listed in the Job Description on the portal. Visit the T&P office with your marksheet for verification if needed.",
  dress_code:"Default to business formals: formal shirt/blouse, trousers/skirt, closed-toe shoes. Avoid jeans and casual wear unless smart casuals are explicitly permitted.",
  faq:"Company-specific details (role, CTC, bond, location) are in the Job Description on the portal. Bring your questions to the Pre-Placement Talk and ask HR during Q&A.",
};
const C_RESP={
  resume_review:"Resume reviewed. Suggestions have been sent. Focus on quantifying your project impact and keeping it to one page.",
  shortlist:"Shortlist verified with company HR. Your name appears on the confirmed list. Check your email for further instructions.",
  interview_reschedule:"Rescheduling request forwarded to company POC. Expect confirmation within 24 hours.",
  document:"Required documents: Updated resume, Aadhar card, all-semester marksheets, college ID. Carry originals + 2 photocopies.",
};
const O_RESP={
  offer_letter:"Offer letter issue escalated to company HR by Placement Officer. Resolution expected within 3 working days. You will be notified.",
  policy:"Policy exception reviewed by Placement Officer and Dean. Decision communicated via email within 48 hours.",
};

const PL=['','CRITICAL','URGENT','MODERATE','LOW'];
const PC=['','critical','urgent','moderate','low'];

/* ══ PRIORITY ══ */
function prio(type,days,mins,cgpa){
  if(type==='offer_letter')return 1;
  if(type==='venue'&&mins<=30)return 1;
  if(days<=0)return 1;
  if(type==='form'&&days<=1)return 2;
  if(type==='venue'&&mins<=120)return 2;
  if(type==='shortlist')return 2;
  if(type==='resume_review'&&cgpa>=8)return 2;
  if(days<=3)return 2;
  if(type==='resume_review')return 3;
  if(['eligibility','faq'].includes(type))return 3;
  if(type==='interview_reschedule')return 3;
  if(days<=7)return 3;
  return 4;
}
function ppill(p){return`<span class="pill pill-${PC[p]}">${PL[p]}</span>`}
function tpill(t){return`<span class="pill pill-t${t}">Tier ${t}</span>`}
function dtagHtml(d){return d==='internship'?'<span class="dtag-intern">💼 Internship</span>':'<span class="dtag-placement">🏢 Placement</span>'}
function ttag(type){const t=L1.includes(type)?1:L2.includes(type)?2:3;return`<span class="tier-tag">T${t}</span>`}
function ts(){return new Date().toLocaleString('en-IN',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})}
function gTok(n){return'P'+String(n).padStart(7,'0')}
function gQid(n){return'Q'+String(n).padStart(5,'0')}
function esc(s){return(s||'').replace(/</g,'&lt;').replace(/>/g,'&gt;')}


/* ══ LAUNCH DASHBOARD ══ */
function launch(role){
  const u=S.user;
  document.getElementById('sb-av').textContent=u.name.charAt(0).toUpperCase();
  document.getElementById('sb-nm').textContent=u.name;
  document.getElementById('sb-rl').textContent=role==='student'
    ?`${u.branch||''} · Year ${u.year||''} · ${u.tok||''}`
    :`${u.role||''} · Tier ${u.tier||''}`;
  buildNav(role);
  showPage(role==='student'?'s-home':'c-home');
}

function buildNav(role){
  const nav=document.getElementById('sidebar-nav');
  const groups=role==='student'
    ?[{sec:'Overview',items:[{id:'s-home',ico:'◈',lbl:'Dashboard'}]},
      {sec:'Queries',items:[{id:'s-submit',ico:'✎',lbl:'Submit Query'},{id:'s-history',ico:'📋',lbl:'My Queries'}]}]
    :[{sec:'Overview',items:[{id:'c-home',ico:'◈',lbl:'Dashboard'}]},
      {sec:'Queries',items:[{id:'c-queue',ico:'⊟',lbl:'Query Queue',badge:true},{id:'c-resolved',ico:'✓',lbl:'Resolved Log'}]},
      {sec:'Management',items:[{id:'c-students',ico:'👥',lbl:'Students'},{id:'c-briefing',ico:'📌',lbl:'Briefing Notes'},{id:'c-analytics',ico:'◎',lbl:'Analytics'}]}];
  nav.innerHTML=groups.map(g=>`
    <div class="nav-sec">${g.sec}</div>
    ${g.items.map(it=>`<button class="nav-item" id="ni-${it.id}" onclick="showPage('${it.id}')">
      <span class="nav-ico">${it.ico}</span>${it.lbl}
      ${it.badge?`<span class="nav-badge" id="nb-q">${S.queue.length}</span>`:''}
    </button>`).join('')}
  `).join('');
}

let activePg='';
function showPage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  const pg=document.getElementById('page-'+id);
  const ni=document.getElementById('ni-'+id);
  if(pg)pg.classList.add('active');
  if(ni)ni.classList.add('active');
  activePg=id;
  if(id==='s-home')rfStudentDash();
  if(id==='s-history')rfStudentHist();
  if(id==='c-home')rfCoordDash();
  if(id==='c-queue')rfSplitQueue();
  if(id==='c-resolved')rfResolved();
  if(id==='c-students')rfStudents();
  if(id==='c-analytics')rfAnalytics();
  previewPrio();
}

/* ══ PRIORITY PREVIEW ══ */
function previewPrio(){
  const el=document.getElementById('sq-type');
  if(!el)return;
  const type=el.value;
  const days=parseInt(document.getElementById('sq-days').value)||99;
  const mins=parseInt(document.getElementById('sq-mins').value)||999;
  const cgpa=S.user&&S.user.cgpa?S.user.cgpa:0;
  const p=prio(type,days,mins,cgpa);
  document.getElementById('prio-pill').innerHTML=ppill(p);
  const tier=L1.includes(type)?1:L2.includes(type)?2:3;
  const tnames=['','PR (Tier 1)','Coordinator (Tier 2)','Officer (Tier 3)'];
  document.getElementById('prio-tier').textContent=`→ Assigned to ${tnames[tier]}`;
}

/* ══ SUBMIT QUERY ══ */
function doSubmitQuery(){
  const u=S.user;
  if(!u||!u.tok){toast('Not logged in as student','err');return}
  const driveEl=document.querySelector('input[name="drive"]:checked');
  const drive=driveEl?driveEl.value:'placement';
  const co=document.getElementById('sq-co').value.trim();
  const type=document.getElementById('sq-type').value;
  const desc=document.getElementById('sq-desc').value.trim();
  const days=parseInt(document.getElementById('sq-days').value)||99;
  const mins=parseInt(document.getElementById('sq-mins').value)||999;
  if(!co){toast('Please enter a company name','err');return}
  const p=prio(type,days,mins,u.cgpa);
  const qid=gQid(S.qCount++);
  // thread: array of {from:'student'|'coordinator', text, at}
  const q={qid,sTok:u.tok,sName:u.name,branch:u.branch,co,drive,type,desc,p,days,mins,
            status:'SUBMITTED',at:ts(),tier:0,by:'',resp:'',rat:'',
            thread:[{from:'student',text:desc||'(no description)',at:ts()}]};
  S.queue.push(q);
  S.queue.sort((a,b)=>a.p-b.p);
  u.queries.push(qid);
  saveState();
  toast(`Query ${qid} submitted — ${PL[p]} priority`,'ok');
  document.getElementById('sq-co').value='';
  document.getElementById('sq-desc').value='';
  document.getElementById('sq-days').value='7';
  document.getElementById('sq-mins').value='999';
  updBadge();
  showPage('s-home');
}

/* ══ AUTO-RESOLVE (process next / all) ══ */
function autoResolve(q){
  // Auto-process: resolves without a message (coordinator must use modal for custom responses)
  if(L1.includes(q.type)){q.by='PR: Ananya Sharma';q.tier=1;S.prRes++;}
  else if(L2.includes(q.type)){S.prEsc++;q.by='Coordinator: Prof. Rakesh Mehta';q.tier=2;S.coRes++;}
  else{S.prEsc++;S.coEsc++;q.by='Officer: Dr. Priya Nair';q.tier=3;S.ofRes++;}
  q.resp='[Auto-resolved — no message provided]';
  q.status='RESOLVED';q.rat=ts();
  S.resolved.push(q);
}

function processNext(){
  if(!S.queue.length){toast('Queue is empty!','inf');return}
  const q=S.queue.shift();autoResolve(q);
  toast(`${q.qid} resolved at Tier ${q.tier}`,'ok');
  saveState();updBadge();rfIfActive(['c-home','c-queue','c-resolved']);
}
function processAll(){
  if(!S.queue.length){toast('Queue is empty!','inf');return}
  const n=S.queue.length;
  while(S.queue.length){const q=S.queue.shift();autoResolve(q);}
  saveState();toast(`${n} queries processed!`,'ok');
  updBadge();rfIfActive(['c-home','c-queue','c-resolved']);
}
function updBadge(){const nb=document.getElementById('nb-q');if(nb)nb.textContent=S.queue.length;}
function rfIfActive(ids){ids.forEach(id=>{if(activePg===id)showPage(id);})}

/* ══ COORDINATOR: SEND FEEDBACK (keeps in queue, awaiting student) ══ */
function coordFeedback(qid){
  const txt=document.getElementById('fb-txt-'+qid).value.trim();
  if(!txt){toast('Please type a feedback message','err');return}
  const q=S.queue.find(x=>x.qid===qid);
  if(!q)return;
  q.thread.push({from:'coordinator',text:txt,at:ts()});
  q.status='AWAITING_STUDENT';
  saveState();toast('Feedback sent to student','ok');
  closeModal();
  rfIfActive(['c-queue','c-home']);
}

/* ══ COORDINATOR: RESOLVE WITH CUSTOM RESPONSE ══ */
function coordResolve(qid){
  const txtEl=document.getElementById('res-txt-'+qid);
  const txt=txtEl?txtEl.value.trim():'';
  if(!txt){toast('Please write a resolution response before marking as resolved','err');return}
  const i=S.queue.findIndex(x=>x.qid===qid);
  if(i<0)return;
  const q=S.queue.splice(i,1)[0];
  q.thread.push({from:'coordinator',text:txt,at:ts()});
  q.resp=txt;q.status='RESOLVED';q.rat=ts();
  if(L1.includes(q.type)){q.by='PR: Ananya Sharma';q.tier=1;S.prRes++;}
  else if(L2.includes(q.type)){S.prEsc++;q.by='Coordinator: Prof. Rakesh Mehta';q.tier=2;S.coRes++;}
  else{S.prEsc++;S.coEsc++;q.by='Officer: Dr. Priya Nair';q.tier=3;S.ofRes++;}
  S.resolved.push(q);
  saveState();
  toast(`${q.qid} resolved at Tier ${q.tier}`,'ok');
  updBadge();closeModal();
  rfIfActive(['c-home','c-queue','c-resolved']);
}

/* ══ STUDENT REPLY ══ */
function studentReply(qid){
  const txt=document.getElementById('sr-txt-'+qid);
  if(!txt||!txt.value.trim()){toast('Please type your reply first','err');return}
  const q=S.queue.find(x=>x.qid===qid);
  if(!q){toast('Query not found','err');return}
  q.thread.push({from:'student',text:txt.value.trim(),at:ts()});
  // move status back to SUBMITTED so coordinator knows there's a new reply
  q.status='SUBMITTED';
  saveState();toast('Reply sent to coordinator','ok');
  closeModal();
  // refresh whichever page the student is on
  if(activePg==='s-home')rfStudentDash();
  if(activePg==='s-history')rfStudentHist();
}

/* ══ RENDER HELPERS ══ */
function rfStudentDash(){
  const u=S.user;
  const myQ=[...S.queue,...S.resolved].filter(q=>u.queries.includes(q.qid));
  document.getElementById('s-dsub').textContent=`Welcome back, ${u.name} · AIT Pune`;
  document.getElementById('ss-total').textContent=myQ.length;
  document.getElementById('ss-pend').textContent=myQ.filter(q=>q.status!=='RESOLVED').length;
  document.getElementById('ss-res').textContent=myQ.filter(q=>q.status==='RESOLVED').length;
  document.getElementById('ss-crit').textContent=myQ.filter(q=>q.p===1).length;
  const c=document.getElementById('s-recent');
  if(!myQ.length){c.innerHTML='<div class="empty"><div class="empty-ico">📋</div><div class="empty-txt">No queries yet. Go to Submit Query to get started.</div></div>';return}
  c.innerHTML=myQ.slice().reverse().slice(0,6).map(q=>`
    <div class="qi p-${PC[q.p]}">
      <div class="qi-body">
        <div class="qi-name">${esc(q.co)} <span class="mono">${q.qid}</span> ${dtagHtml(q.drive)}</div>
        <div class="qi-meta">${q.type.replace(/_/g,' ')} · ${q.at}</div>
      </div>
      ${ppill(q.p)}
      <span class="pill ${q.status==='RESOLVED'?'pill-res':q.status==='AWAITING_STUDENT'?'pill-awstud':'pill-sub'}">${q.status==='AWAITING_STUDENT'?'REPLY NEEDED':q.status}</span>
      <div class="qi-acts"><button class="btn btn-outline btn-sm" onclick="openModal('${q.qid}')">View</button></div>
    </div>`).join('');
}

function rfStudentHist(){
  const u=S.user;
  const all=[...S.queue,...S.resolved].filter(q=>u.queries.includes(q.qid));
  document.getElementById('s-hsub').textContent=`${all.length} total queries`;
  const c=document.getElementById('s-hist-tbl');
  if(!all.length){c.innerHTML='<div class="empty" style="padding:48px"><div class="empty-ico">📂</div><div class="empty-txt">No queries yet.</div></div>';return}
  c.innerHTML=`<table class="tbl"><thead><tr><th>ID</th><th>Drive</th><th>Company</th><th>Type</th><th>Priority</th><th>Status</th><th>Submitted</th><th></th></tr></thead><tbody>
    ${all.slice().reverse().map(q=>`<tr>
      <td class="mono">${q.qid}</td>
      <td>${dtagHtml(q.drive)}</td>
      <td>${esc(q.co)}</td>
      <td>${q.type.replace(/_/g,' ')}</td>
      <td>${ppill(q.p)}</td>
      <td><span class="pill ${q.status==='RESOLVED'?'pill-res':q.status==='AWAITING_STUDENT'?'pill-awstud':'pill-sub'}">${q.status==='AWAITING_STUDENT'?'REPLY NEEDED':q.status}</span></td>
      <td>${q.at}</td>
      <td><button class="btn btn-outline btn-sm" onclick="openModal('${q.qid}')">View</button></td>
    </tr>`).join('')}
  </tbody></table>`;
}

function rfCoordDash(){
  const tot=S.queue.length+S.resolved.length;
  document.getElementById('cs-total').textContent=tot;
  document.getElementById('cs-queue').textContent=S.queue.length;
  document.getElementById('cs-intern').textContent=[...S.queue,...S.resolved].filter(q=>q.drive==='internship').length;
  document.getElementById('cs-place').textContent=[...S.queue,...S.resolved].filter(q=>q.drive==='placement').length;
  document.getElementById('c-dsub').textContent=`AIT Pune · ${S.queue.length} in queue · ${S.resolved.length} resolved`;
  document.getElementById('tf1').textContent=`${S.prRes} resolved`;
  document.getElementById('tf2').textContent=`${S.coRes} resolved`;
  document.getElementById('tf3').textContent=`${S.ofRes} resolved`;
}

function qiHtml(q,i){
  return`<div class="qi p-${PC[q.p]}">
    ${i!==undefined?`<div class="qi-rank">${i+1}</div>`:''}
    <div class="qi-body">
      <div class="qi-name">${esc(q.sName)} <span class="mono">${q.qid}</span></div>
      <div class="qi-meta">${esc(q.co)} · ${q.type.replace(/_/g,' ')} · ${q.at}</div>
    </div>
    ${ppill(q.p)} ${ttag(q.type)}
    ${q.status==='AWAITING_STUDENT'?'<span class="pill pill-awstud">AWAITING REPLY</span>':''}
    <div class="qi-acts">
      <button class="btn btn-outline btn-sm" onclick="openModal('${q.qid}')">Feedback / Resolve</button>
    </div>
  </div>`;
}

function rfSplitQueue(){
  const internQ=S.queue.filter(q=>q.drive==='internship');
  const placeQ=S.queue.filter(q=>q.drive==='placement');
  document.getElementById('sq-intern-count').textContent=internQ.length;
  document.getElementById('sq-place-count').textContent=placeQ.length;
  const ic=document.getElementById('sq-intern-list');
  const pc=document.getElementById('sq-place-list');
  ic.innerHTML=internQ.length?internQ.map((q,i)=>qiHtml(q,i)).join(''):'<div class="empty"><div class="empty-ico">💼</div><div class="empty-txt">No internship queries.</div></div>';
  pc.innerHTML=placeQ.length?placeQ.map((q,i)=>qiHtml(q,i)).join(''):'<div class="empty"><div class="empty-ico">🏢</div><div class="empty-txt">No placement queries.</div></div>';
}

function rfResolved(){
  document.getElementById('c-rsub').textContent=`${S.resolved.length} queries resolved`;
  const c=document.getElementById('c-res-tbl');
  if(!S.resolved.length){c.innerHTML='<div class="empty" style="padding:48px"><div class="empty-ico">✅</div><div class="empty-txt">No resolved queries yet.</div></div>';return}
  c.innerHTML=`<table class="tbl"><thead><tr><th>ID</th><th>Drive</th><th>Student</th><th>Company</th><th>Type</th><th>Priority</th><th>Tier</th><th>Resolved At</th><th></th></tr></thead><tbody>
    ${S.resolved.slice().reverse().map(q=>`<tr>
      <td class="mono">${q.qid}</td><td>${dtagHtml(q.drive)}</td><td>${esc(q.sName)}</td><td>${esc(q.co)}</td>
      <td>${q.type.replace(/_/g,' ')}</td><td>${ppill(q.p)}</td><td>${tpill(q.tier)}</td><td>${q.rat}</td>
      <td><button class="btn btn-outline btn-sm" onclick="openModal('${q.qid}')">View</button></td>
    </tr>`).join('')}
  </tbody></table>`;
}

function rfStudents(){
  const list=Object.values(S.students);
  document.getElementById('c-ssub').textContent=`${list.length} students registered`;
  const c=document.getElementById('c-stud-tbl');
  if(!list.length){c.innerHTML='<div class="empty" style="padding:48px"><div class="empty-ico">👥</div><div class="empty-txt">No students registered yet.</div></div>';return}
  c.innerHTML=`<table class="tbl"><thead><tr><th>Token</th><th>Name</th><th>Branch</th><th>Year</th><th>CGPA</th><th>Mobile</th><th>Queries</th></tr></thead><tbody>
    ${list.map(s=>`<tr><td class="mono">${s.tok}</td><td><strong>${esc(s.name)}</strong></td><td>${s.branch}</td><td>Year ${s.year}</td><td>${s.cgpa}</td><td>${s.mob}</td><td>${s.queries.length}</td></tr>`).join('')}
  </tbody></table>`;
}

function addNote(){
  const co=document.getElementById('bn-co').value.trim();
  const tp=document.getElementById('bn-tp').value;
  const note=document.getElementById('bn-note').value.trim();
  if(!co||!note){toast('Fill company name and note','err');return}
  S.notes[co+'|'+tp]=note;
  saveState();
  toast(`Note saved for ${co} / ${tp}`,'ok');
  document.getElementById('bn-co').value='';
  document.getElementById('bn-note').value='';
  rfNotes();
}
function rfNotes(){
  const keys=Object.keys(S.notes);
  const c=document.getElementById('bn-list');
  if(!keys.length){c.innerHTML='<div class="empty"><div class="empty-ico">📌</div><div class="empty-txt">No notes added yet.</div></div>';return}
  c.innerHTML=keys.map(k=>{const[co,tp]=k.split('|');return`<div style="padding:12px 0;border-bottom:1px solid var(--ivory2)">
    <div style="display:flex;gap:10px;align-items:center;margin-bottom:5px"><strong style="font-size:.87rem">${esc(co)}</strong><span class="pill pill-t1">${tp}</span></div>
    <p style="font-size:.8rem;color:var(--text2);line-height:1.5">${esc(S.notes[k])}</p>
  </div>`}).join('');
}

function rfAnalytics(){
  const log=S.resolved;const tot=log.length;if(!tot)return;
  const t1=log.filter(q=>q.tier===1).length,t2=log.filter(q=>q.tier===2).length,t3=log.filter(q=>q.tier===3).length;
  document.getElementById('an-tiers').innerHTML=abar('Tier 1 (PR)',t1,tot,'#1b2a4a')+abar('Tier 2 (Coordinator)',t2,tot,'#c88b2f')+abar('Tier 3 (Officer)',t3,tot,'#d95f3b');
  const p1=log.filter(q=>q.p===1).length,p2=log.filter(q=>q.p===2).length,p3=log.filter(q=>q.p===3).length,p4=log.filter(q=>q.p===4).length;
  document.getElementById('an-prio').innerHTML=abar('Critical',p1,tot,'#c0392b')+abar('Urgent',p2,tot,'#d4650a')+abar('Moderate',p3,tot,'#b8860b')+abar('Low',p4,tot,'#2d6a4f');
  const ia=log.filter(q=>q.drive==='internship').length,pa=log.filter(q=>q.drive==='placement').length;
  document.getElementById('an-drive').innerHTML=abar('Internship',ia,tot,'#5b3d8a')+abar('Placement',pa,tot,'#1b5e7a');
  const tc={};log.forEach(q=>tc[q.type]=(tc[q.type]||0)+1);
  document.getElementById('an-types').innerHTML=Object.entries(tc).sort((a,b)=>b[1]-a[1]).map(([t,n])=>abar(t.replace(/_/g,' '),n,tot,'#4a7c6f')).join('');
}
function abar(lbl,val,tot,col){
  const p=tot?Math.round(val/tot*100):0;
  return`<div class="ab"><div class="ab-top"><span>${lbl}</span><span>${val} (${p}%)</span></div><div class="ab-track"><div class="ab-fill" style="width:${p}%;background:${col}"></div></div></div>`;
}

/* ══ MODAL — with feedback thread ══ */
function openModal(qid){
  const q=[...S.queue,...S.resolved].find(x=>x.qid===qid);if(!q)return;
  const isCoord=(S.role==='coordinator');
  const inQueue=S.queue.some(x=>x.qid===qid);

  // Build thread HTML
  const threadHtml=q.thread.map(msg=>`
    <div class="thread-msg ${msg.from}">
      <div class="tm-av ${msg.from==='student'?'stud':'coord'}">${msg.from==='student'?'S':'C'}</div>
      <div class="tm-bubble">
        <div class="tm-meta">${msg.from==='student'?esc(q.sName):'Coordinator'} · ${msg.at}</div>
        <div class="tm-text">${esc(msg.text)}</div>
      </div>
    </div>`).join('');

  // Input area — depends on role and status
  let inputHtml='';
  const isStudent=(S.role==='student');

  if(isCoord&&inQueue){
    inputHtml=`
    <div class="fb-input-area">
      <div class="fb-input-label">📨 Send Feedback to Student</div>
      <textarea class="fb-textarea" id="fb-txt-${qid}" placeholder="Ask for more documents, clarify details, or provide guidance..."></textarea>
      <div class="fb-actions">
        <button class="btn btn-outline btn-sm" onclick="coordFeedback('${qid}')">Send Feedback</button>
      </div>
    </div>
    <div class="resolve-section">
      <div class="resolve-label">✓ Mark as Resolved</div>
      <textarea class="resolve-textarea" id="res-txt-${qid}" placeholder="Write your final resolution response (leave blank to use the default for this query type)..."></textarea>
      <div class="fb-actions" style="margin-top:10px">
        <button class="btn btn-sage btn-sm" onclick="coordResolve('${qid}')">✓ Resolve Query</button>
      </div>
    </div>`;
  } else if(isStudent&&inQueue&&q.status!=='RESOLVED'){
    inputHtml=`
    <div class="fb-input-area" style="border-color:rgba(217,95,59,.4);background:rgba(217,95,59,.03)">
      <div class="fb-input-label" style="color:var(--coral)">✏️ Reply to Coordinator</div>
      <textarea class="fb-textarea" id="sr-txt-${qid}" placeholder="${q.status==='AWAITING_STUDENT'?'The coordinator is waiting for your reply — provide the requested information...':'Add more information or a follow-up message...'}"></textarea>
      <div class="fb-actions">
        <button class="btn btn-coral btn-sm" onclick="studentReply('${qid}')">Send Reply →</button>
      </div>
    </div>`;
  }

  document.getElementById('modal-title').innerHTML=`Query ${q.qid} ${dtagHtml(q.drive)}`;
  document.getElementById('modal-body').innerHTML=`
    <div class="dr"><div class="dk">Student</div><div class="dv">${esc(q.sName)} <span class="mono">${q.sTok}</span></div></div>
    <div class="dr"><div class="dk">Company</div><div class="dv">${esc(q.co)}</div></div>
    <div class="dr"><div class="dk">Type</div><div class="dv">${q.type.replace(/_/g,' ')}</div></div>
    <div class="dr"><div class="dk">Priority</div><div class="dv">${ppill(q.p)}</div></div>
    <div class="dr"><div class="dk">Status</div><div class="dv"><span class="pill ${q.status==='RESOLVED'?'pill-res':q.status==='AWAITING_STUDENT'?'pill-awstud':'pill-sub'}">${q.status}</span></div></div>
    <div class="dr"><div class="dk">Submitted</div><div class="dv">${q.at}</div></div>
    <hr class="s"/>
    <div style="font-family:'JetBrains Mono',monospace;font-size:.65rem;color:var(--text3);text-transform:uppercase;letter-spacing:.1em;margin-bottom:10px">💬 Conversation Thread</div>
    <div class="thread">${threadHtml}</div>
    ${q.status==='RESOLVED'?`<div class="resp-box"><div class="resp-head">✓ Resolved ${tpill(q.tier)} · ${esc(q.by)}</div>${esc(q.resp)}</div><div style="font-size:.7rem;color:var(--text3);margin-top:8px;font-family:'JetBrains Mono',monospace">Resolved: ${q.rat}</div>`:''}
    ${inputHtml}`;
  document.getElementById('overlay').classList.add('open');
}
function closeModal(){document.getElementById('overlay').classList.remove('open')}
document.getElementById('overlay').addEventListener('click',e=>{if(e.target===document.getElementById('overlay'))closeModal()})

/* ══ TOAST ══ */
function toast(msg,type='ok'){
  const c=document.getElementById('toasts');
  const t=document.createElement('div');
  t.className=`toast ${type}`;
  t.innerHTML=`<span>${type==='ok'?'✓':type==='err'?'✗':'·'}</span><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(()=>t.remove(),3500);
}

// Auto-launch on page load
(function(){
  launch(_sess.role);
})();