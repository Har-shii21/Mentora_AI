/* =========================================================
   Mentora AI — script.js
   Background stars + Career Constellation + IndexedDB
   ========================================================= */

/* ---------- Background star canvas (both pages) ---------- */
(function backgroundStars(){
  const canvas = document.getElementById('bg-stars');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let stars = [], shootingStars = [], w, h, dpr;

  function resize(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.width = innerWidth * dpr;
    h = canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    const count = Math.floor((innerWidth * innerHeight) / 4500);
    stars = Array.from({length: count}, () => ({
      x: Math.random()*w, y: Math.random()*h,
      r: Math.random()*1.4*dpr + 0.2*dpr,
      a: Math.random()*0.8 + 0.2,
      tw: Math.random()*0.02 + 0.005,
      dir: Math.random()<.5?1:-1
    }));
  }

  function spawnShooting(){
    if(Math.random() < 0.004 && shootingStars.length < 2){
      shootingStars.push({
        x: Math.random()*w*0.7,
        y: Math.random()*h*0.4,
        vx: (4 + Math.random()*3)*dpr,
        vy: (2 + Math.random()*2)*dpr,
        life: 1
      });
    }
  }

  function draw(){
    ctx.clearRect(0,0,w,h);
    // stars
    for(const s of stars){
      s.a += s.tw * s.dir;
      if(s.a > 1 || s.a < 0.15) s.dir *= -1;
      ctx.beginPath();
      ctx.fillStyle = `rgba(220,225,255,${s.a})`;
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
    }
    // shooting
    spawnShooting();
    for(let i=shootingStars.length-1;i>=0;i--){
      const s = shootingStars[i];
      const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.vx*8, s.y - s.vy*8);
      grad.addColorStop(0, `rgba(255,255,255,${s.life})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2*dpr;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.vx*8, s.y - s.vy*8);
      ctx.stroke();
      s.x += s.vx; s.y += s.vy; s.life -= 0.012;
      if(s.life <= 0 || s.x > w || s.y > h) shootingStars.splice(i,1);
    }
    requestAnimationFrame(draw);
  }

  addEventListener('resize', resize, {passive:true});
  resize(); draw();
})();

/* ---------- IndexedDB persistence ---------- */
const DB_NAME = 'mentora-ai';
const STORE = 'state';
const KEY = 'journey';

function openDB(){
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function saveState(state){
  try{
    const db = await openDB();
    return new Promise((res, rej) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(state, KEY);
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
  }catch(e){ /* fallback */ localStorage.setItem('mentora-state', JSON.stringify(state)); }
}
async function loadState(){
  try{
    const db = await openDB();
    return new Promise((res) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(KEY);
      req.onsuccess = () => res(req.result || null);
      req.onerror = () => res(null);
    });
  }catch(e){
    const raw = localStorage.getItem('mentora-state');
    return raw ? JSON.parse(raw) : null;
  }
}
async function clearState(){
  try{
    const db = await openDB();
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(KEY);
  }catch(e){}
  localStorage.removeItem('mentora-state');
}

/* ---------- Skill roadmaps ---------- */
const ROADMAPS = {
  'Frontend Developer': ['HTML Basics','CSS Mastery','JavaScript Core','Responsive Design','Git & GitHub','React Fundamentals','State Management','APIs & Fetch','Performance','Portfolio Launch'],
  'Data Scientist':     ['Python Basics','NumPy & Pandas','Statistics','Data Viz','SQL','Machine Learning','Deep Learning','NLP','Big Data','Capstone Project'],
  'AI Engineer':        ['Python','Linear Algebra','ML Foundations','Neural Networks','PyTorch','Transformers','LLMs','RAG Systems','MLOps','AI Product Build'],
  'Product Designer':   ['Design Principles','Color & Type','Figma Mastery','User Research','Wireframing','Prototyping','Design Systems','Interaction Design','Portfolio','Case Study'],
  'Mobile Developer':   ['UI Basics','Dart / Swift / Kotlin','Flutter / Native','State Mgmt','APIs','Local Storage','Animations','Testing','Publishing','First App Live'],
  'Cybersecurity Analyst':['Networking','Linux Basics','Crypto Fundamentals','Threat Models','OWASP Top 10','Pen Testing','SIEM','Incident Response','Cloud Security','Certification']
};
const DEFAULT_SKILLS = ['Foundations','Core Concepts','Tooling','Practice 1','Intermediate','Practice 2','Advanced Topic','Real Project','Community','Showcase'];

const MENTOR_LINES = [
  "Welcome aboard. Tap your first star to ignite the journey.",
  "Brilliant start. Momentum is everything.",
  "Two down — your rocket is fueling up.",
  "You're shaping the constellation. Keep going.",
  "Halfway in spirit. Each star sharpens your craft.",
  "Six stars lit — you're orbiting mastery.",
  "Past the midpoint. The next leap is the biggest.",
  "Eight bright stars. Graduation is in sight.",
  "Almost there — one final push.",
  "The last star awaits. Make it shine."
];
const TIPS = [
  "Tip: revisit the previous star — repetition deepens skill.",
  "Tip: build a tiny project applying what you just learned.",
  "Tip: teach this concept to someone — the best test of mastery.",
  "Tip: write notes in your own words.",
  "Tip: pair this skill with a real-world challenge.",
];

/* ---------- Constellation app ---------- */
const constellationCanvas = document.getElementById('constellation-canvas');
if(constellationCanvas){
  initConstellation();
}

function initConstellation(){
  const canvas = constellationCanvas;
  const ctx = canvas.getContext('2d');
  let dpr = 1, W = 0, H = 0;

  // State
  let state = { goal: null, skills: [], completed: [], rocketsShown: [] };
  let stars = []; // {x,y,label,index,glow}
  let hoverIndex = -1;
  let animTime = 0;

  // DOM refs
  const onboard = document.getElementById('onboard');
  const goalLabel = document.getElementById('goal-label');
  const ringFg = document.getElementById('ring-fg');
  const progressCount = document.getElementById('progress-count');
  const mentorMsg = document.getElementById('mentor-message');
  const mentorTip = document.getElementById('mentor-tip');
  const rocketModal = document.getElementById('rocket-modal');
  const rocketMessage = document.getElementById('rocket-message');
  const gradModal = document.getElementById('graduation-modal');
  const resetBtn = document.getElementById('reset-btn');
  const restartBtn = document.getElementById('restart-journey');

  /* ----- Boot ----- */
  (async () => {
    const saved = await loadState();
    if(saved && saved.goal){
      state = Object.assign({rocketsShown:[]}, saved);
      onboard.style.display = 'none';
      buildStars();
      updateUI();
    }else{
      onboard.style.display = 'grid';
    }
    resize();
    render();
  })();

  /* ----- Onboarding ----- */
  document.querySelectorAll('.goal-card').forEach(btn => {
    btn.addEventListener('click', () => chooseGoal(btn.dataset.goal));
  });
  document.getElementById('custom-goal-btn').addEventListener('click', () => {
    const v = document.getElementById('custom-goal-input').value.trim();
    if(v) chooseGoal(v);
  });
  document.getElementById('custom-goal-input').addEventListener('keydown', e => {
    if(e.key === 'Enter'){
      const v = e.target.value.trim();
      if(v) chooseGoal(v);
    }
  });

  function chooseGoal(goal){
    const skills = ROADMAPS[goal] || DEFAULT_SKILLS;
    state = { goal, skills, completed: [], rocketsShown: [] };
    saveState(state);
    onboard.style.display = 'none';
    buildStars();
    updateUI();
  }

  /* ----- Stars layout: gentle curved constellation path ----- */
  function buildStars(){
    stars = [];
    const n = 10;
    for(let i=0;i<n;i++){
      stars.push({
        index: i,
        label: state.skills[i] || `Skill ${i+1}`,
        nx: 0, ny: 0, // normalized 0..1
        glow: 0
      });
    }
    layoutStars();
  }

  function layoutStars(){
    // Sinusoidal path across canvas
    const n = stars.length;
    for(let i=0;i<n;i++){
      const t = i / (n - 1);
      // slight horizontal serpentine
      const nx = 0.08 + t * 0.84;
      const ny = 0.5 + Math.sin(t * Math.PI * 2.2) * 0.28;
      stars[i].nx = nx;
      stars[i].ny = ny;
    }
  }

  /* ----- Resize ----- */
  function resize(){
    const wrap = canvas.parentElement;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = wrap.getBoundingClientRect();
    W = rect.width; H = rect.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  addEventListener('resize', () => { resize(); }, {passive:true});

  /* ----- Render loop ----- */
  function render(){
    animTime += 0.016;
    ctx.clearRect(0,0,W,H);

    // Connection lines
    ctx.lineWidth = 1.2;
    for(let i=0;i<stars.length-1;i++){
      const a = stars[i], b = stars[i+1];
      const ax = a.nx*W, ay = a.ny*H, bx = b.nx*W, by = b.ny*H;
      const completed = state.completed.includes(i) && state.completed.includes(i+1);
      const grad = ctx.createLinearGradient(ax, ay, bx, by);
      if(completed){
        grad.addColorStop(0, 'rgba(255, 209, 102, 0.7)');
        grad.addColorStop(1, 'rgba(255, 183, 3, 0.7)');
      }else{
        grad.addColorStop(0, 'rgba(140,160,255,0.18)');
        grad.addColorStop(1, 'rgba(140,160,255,0.05)');
      }
      ctx.strokeStyle = grad;
      ctx.setLineDash(completed ? [] : [4,6]);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Stars
    for(let i=0;i<stars.length;i++){
      const s = stars[i];
      const x = s.nx*W, y = s.ny*H;
      const done = state.completed.includes(i);
      const target = done ? 1 : (hoverIndex === i ? 0.6 : 0);
      s.glow += (target - s.glow) * 0.15;

      const pulse = done ? (Math.sin(animTime*2 + i)*0.5 + 0.5) : 0;
      const baseR = 9;
      const r = baseR + pulse*2;

      // Outer glow
      const glowR = 38 + s.glow*22;
      const gr = ctx.createRadialGradient(x,y,0, x,y,glowR);
      if(done){
        gr.addColorStop(0, 'rgba(255, 209, 102, 0.55)');
        gr.addColorStop(0.4,'rgba(255, 183, 3, 0.25)');
        gr.addColorStop(1, 'rgba(255, 183, 3, 0)');
      }else{
        gr.addColorStop(0, `rgba(124,92,255,${0.25 + s.glow*0.4})`);
        gr.addColorStop(1, 'rgba(124,92,255,0)');
      }
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.arc(x,y,glowR,0,Math.PI*2); ctx.fill();

      // Star body
      ctx.beginPath();
      ctx.arc(x,y,r,0,Math.PI*2);
      ctx.fillStyle = done ? '#ffd166' : '#e8ecff';
      ctx.shadowColor = done ? '#ffb703' : '#7c5cff';
      ctx.shadowBlur = done ? 24 : 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Inner highlight
      ctx.beginPath();
      ctx.arc(x - r*0.3, y - r*0.3, r*0.4, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fill();

      // Label
      ctx.font = '600 12px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const labelY = y + r + 10;
      const text = s.label;
      const tw = ctx.measureText(text).width;
      // pill background
      ctx.fillStyle = 'rgba(10, 12, 30, 0.7)';
      const padX = 8, padY = 4;
      roundRect(ctx, x - tw/2 - padX, labelY - padY, tw + padX*2, 22, 8);
      ctx.fill();
      ctx.strokeStyle = done ? 'rgba(255,209,102,0.5)' : 'rgba(140,160,255,0.25)';
      ctx.stroke();

      ctx.fillStyle = done ? '#ffd166' : '#e8ecff';
      ctx.fillText(text, x, labelY);

      // Number
      ctx.font = '700 10px Inter, sans-serif';
      ctx.fillStyle = done ? '#3a2400' : '#1a1b3a';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i+1), x, y);
    }

    requestAnimationFrame(render);
  }

  function roundRect(ctx, x, y, w, h, r){
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.arcTo(x+w, y, x+w, y+h, r);
    ctx.arcTo(x+w, y+h, x, y+h, r);
    ctx.arcTo(x, y+h, x, y, r);
    ctx.arcTo(x, y, x+w, y, r);
    ctx.closePath();
  }

  /* ----- Interaction ----- */
  function getEventPos(e){
    const rect = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX - rect.left, y: t.clientY - rect.top };
  }
  function hitTest(pos){
    for(let i=stars.length-1;i>=0;i--){
      const s = stars[i];
      const dx = pos.x - s.nx*W, dy = pos.y - s.ny*H;
      if(dx*dx + dy*dy < 30*30) return i;
    }
    return -1;
  }
  canvas.addEventListener('mousemove', e => {
    hoverIndex = hitTest(getEventPos(e));
    canvas.style.cursor = hoverIndex >= 0 ? 'pointer' : 'default';
  });
  canvas.addEventListener('mouseleave', () => hoverIndex = -1);
  canvas.addEventListener('click', e => handleTap(getEventPos(e)));
  canvas.addEventListener('touchend', e => {
    if(e.changedTouches && e.changedTouches[0]){
      const t = e.changedTouches[0];
      const rect = canvas.getBoundingClientRect();
      handleTap({ x: t.clientX - rect.left, y: t.clientY - rect.top });
    }
  });

  function handleTap(pos){
    const i = hitTest(pos);
    if(i < 0) return;
    if(state.completed.includes(i)){
      // toggle off only if it's the latest, to keep order meaningful
      const max = Math.max(...state.completed);
      if(i === max){
        state.completed = state.completed.filter(x => x !== i);
        saveState(state); updateUI();
      }
      return;
    }
    // Must complete in order? Allow sequential only for nicer storytelling
    // But be lenient: allow any if previous done OR it's the first remaining.
    const next = nextSkillIndex();
    if(i !== next){
      flashMentor(`Light star #${next+1} first — "${stars[next].label}".`);
      return;
    }
    state.completed.push(i);
    state.completed.sort((a,b)=>a-b);
    saveState(state);
    updateUI({justCompleted: i});
  }

  function nextSkillIndex(){
    for(let i=0;i<10;i++) if(!state.completed.includes(i)) return i;
    return 9;
  }

  /* ----- UI update ----- */
  function updateUI(opts = {}){
    goalLabel.textContent = state.goal || '—';
    const count = state.completed.length;
    progressCount.textContent = `${count}/10`;
    const circumference = 2 * Math.PI * 36;
    const offset = circumference * (1 - count/10);
    ringFg.style.strokeDasharray = circumference;
    ringFg.style.strokeDashoffset = offset;

    // Mentor message
    mentorMsg.textContent = MENTOR_LINES[count] || MENTOR_LINES[MENTOR_LINES.length-1];
    if(count > 0 && count < 10){
      const next = nextSkillIndex();
      mentorTip.textContent = `Next up: ${stars[next].label}. ${TIPS[count % TIPS.length]}`;
      mentorTip.classList.add('show');
    }else if(count === 10){
      mentorTip.textContent = "You've lit every star. Bask in the glow — you earned it.";
      mentorTip.classList.add('show');
    }else{
      mentorTip.classList.remove('show');
    }

    // Rocket milestones at completion counts 1,3,5,7,9 (i.e. after completing stars at indices 0,2,4,6,8)
    if(opts.justCompleted !== undefined){
      const idx = opts.justCompleted;
      if([0,2,4,6,8].includes(idx) && !state.rocketsShown.includes(idx)){
        state.rocketsShown.push(idx);
        saveState(state);
        showRocket(idx);
      }
    }

    // Graduation
    if(count === 10){
      setTimeout(showGraduation, 600);
    }
  }

  function flashMentor(msg){
    const original = mentorMsg.textContent;
    mentorMsg.textContent = msg;
    mentorMsg.style.color = 'var(--gold)';
    setTimeout(() => {
      mentorMsg.style.color = '';
      mentorMsg.textContent = original;
    }, 1800);
  }

  /* ----- Rocket modal ----- */
  function showRocket(idx){
    const milestoneNum = [0,2,4,6,8].indexOf(idx) + 1;
    rocketMessage.textContent = `Milestone ${milestoneNum} of 5 unlocked. ${5 - milestoneNum} rocket${5-milestoneNum===1?'':'s'} to go.`;
    rocketModal.classList.remove('hidden');
  }

  /* ----- Graduation ----- */
  function showGraduation(){
    gradModal.classList.remove('hidden');
    launchConfetti();
  }

  /* ----- Confetti ----- */
  function launchConfetti(){
    const c = document.getElementById('confetti-canvas');
    const cx = c.getContext('2d');
    function size(){ c.width = c.offsetWidth; c.height = c.offsetHeight; }
    size();
    const colors = ['#ffd166','#7c5cff','#19d2ff','#ff5d8f','#b388ff','#fff'];
    const pieces = Array.from({length: 160}, () => ({
      x: c.width/2, y: c.height/3,
      vx: (Math.random()-0.5)*10,
      vy: Math.random()*-10 - 4,
      g: 0.25 + Math.random()*0.15,
      r: 3 + Math.random()*4,
      rot: Math.random()*Math.PI,
      vr: (Math.random()-0.5)*0.3,
      color: colors[Math.floor(Math.random()*colors.length)],
      life: 1
    }));
    let frames = 0;
    function step(){
      cx.clearRect(0,0,c.width,c.height);
      for(const p of pieces){
        p.vy += p.g;
        p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        cx.save();
        cx.translate(p.x, p.y); cx.rotate(p.rot);
        cx.fillStyle = p.color;
        cx.fillRect(-p.r, -p.r/2, p.r*2, p.r);
        cx.restore();
      }
      frames++;
      if(frames < 300 && !gradModal.classList.contains('hidden')) requestAnimationFrame(step);
    }
    step();
  }

  /* ----- Modal close ----- */
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.modal-overlay').classList.add('hidden');
    });
  });

  /* ----- Reset / Restart ----- */
  resetBtn?.addEventListener('click', async () => {
    if(!confirm('Reset your journey? All progress will be lost.')) return;
    await clearState();
    state = { goal: null, skills: [], completed: [], rocketsShown: [] };
    stars = [];
    onboard.style.display = 'grid';
    updateUIEmpty();
  });
  restartBtn?.addEventListener('click', async () => {
    await clearState();
    location.reload();
  });

  function updateUIEmpty(){
    goalLabel.textContent = '—';
    progressCount.textContent = '0/10';
    ringFg.style.strokeDashoffset = 2*Math.PI*36;
    mentorMsg.textContent = 'Tap a star to begin lighting your path.';
    mentorTip.classList.remove('show');
  }
}