// Initialise shared data if not present
let D = loadData();
if(!D){
  D = {
    students:{}, queue:[], resolved:[], notes:{},
    qCount:1, sCount:1,
    prRes:0, prEsc:0, coRes:0, coEsc:0, ofRes:0
  };
  saveData(D);
}

const COORDS = {
  'Ananya Sharma':     {name:'Ananya Sharma',     mob:'9000000001', role:'Placement Rep.',    tier:1},
  'Prof. Rakesh Mehta':{name:'Prof. Rakesh Mehta',mob:'9000000002', role:'Coordinator',       tier:2},
  'Dr. Priya Nair':    {name:'Dr. Priya Nair',    mob:'9000000003', role:'Placement Officer',  tier:3},
};

let currentRole = null;

/* ── VIEWS ── */
function showView(id){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function pickRole(role){
  currentRole = role;
  document.getElementById('auth-title').textContent = role==='student' ? 'Student Portal' : 'Coordinator Portal';
  document.getElementById('auth-sub').textContent = role==='student'
    ? 'Login with your name & mobile, or register if new'
    : 'Select an account or enter credentials manually';
  document.getElementById('auth-tabs').style.display = role==='student' ? 'flex' : 'none';
  document.getElementById('coord-hint').style.display = role==='coordinator' ? 'block' : 'none';
  switchTab('login');
  showView('v-auth');
}

function switchTab(t){
  document.getElementById('form-login').style.display = t==='login' ? 'block' : 'none';
  document.getElementById('form-reg').style.display = t==='reg' ? 'block' : 'none';
  document.getElementById('tab-login').classList.toggle('active', t==='login');
  document.getElementById('tab-reg').classList.toggle('active', t==='reg');
}

function fillCred(name, mob){
  document.getElementById('ln-name').value = name;
  document.getElementById('ln-mob').value = mob;
  toast('Credentials filled — click Login to continue', 'inf');
}

/* ── AUTH ── */
function doLogin(){
  D = loadData(); // always fresh
  const name = document.getElementById('ln-name').value.trim();
  const mob  = document.getElementById('ln-mob').value.trim();
  if(!name || !mob){ toast('Please enter name and mobile', 'err'); return; }

  if(currentRole === 'coordinator'){
    const c = COORDS[name];
    if(!c || c.mob !== mob){ toast('Coordinator not found — check credentials', 'err'); return; }
    saveSession({ role:'coordinator', user: c });
    toast('Logging in...', 'ok');
    setTimeout(()=>{ window.location.href = 'dashboard.html'; }, 600);
  } else {
    const s = Object.values(D.students).find(x => x.name===name && x.mob===mob);
    if(!s){ toast('Student not found — please register first', 'err'); return; }
    saveSession({ role:'student', user: s });
    toast('Logging in...', 'ok');
    setTimeout(()=>{ window.location.href = 'dashboard.html'; }, 600);
  }
}

function doRegister(){
  D = loadData();
  const name   = document.getElementById('rn').value.trim();
  const mob    = document.getElementById('rm').value.trim();
  const branch = document.getElementById('rb').value;
  const year   = parseInt(document.getElementById('ry').value);
  const cgpa   = parseFloat(document.getElementById('rc').value);

  if(!name){ toast('Please enter your name', 'err'); return; }
  if(!mob || mob.length < 10){ toast('Enter a valid 10-digit mobile number', 'err'); return; }
  if(isNaN(cgpa) || cgpa < 0 || cgpa > 10){ toast('Enter valid CGPA (0–10)', 'err'); return; }
  if(Object.values(D.students).find(x => x.name===name && x.mob===mob)){
    toast('Already registered! Use the Login tab.', 'err'); return;
  }

  const tok = 'P' + String(D.sCount++).padStart(7,'0');
  const s = { tok, name, mob, branch, year, cgpa, queries:[] };
  D.students[tok] = s;
  saveData(D);
  saveSession({ role:'student', user: s });
  toast(`Registered! Token: ${tok}`, 'ok');
  setTimeout(()=>{ window.location.href = 'dashboard.html'; }, 700);
}

/* ── TOAST ── */
function toast(msg, type='ok'){
  const c = document.getElementById('toasts');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${type==='ok'?'✓':type==='err'?'✗':'·'}</span><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(()=>t.remove(), 3500);
}

// If already logged in, skip straight to dashboard
(function checkSession(){
  try{
    const sess = JSON.parse(localStorage.getItem(SESSION_KEY)||'null');
    if(sess && sess.user){ window.location.href = 'dashboard.html'; }
  }catch(e){}
})();