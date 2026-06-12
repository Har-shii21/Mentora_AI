document.addEventListener("DOMContentLoaded", function () {
  const canvas = document.getElementById("starCanvas");
  const progressText = document.getElementById("progressText");
  const recList = document.getElementById("recList");

  if (!canvas || !progressText || !recList) return;

  canvas.width = 600;
  canvas.height = 400;
  const ctx = canvas.getContext("2d");

  const starPositions = [
    { x: 80, y: 70 }, { x: 180, y: 50 }, { x: 280, y: 90 }, { x: 380, y: 60 }, { x: 480, y: 100 },
    { x: 520, y: 200 }, { x: 440, y: 280 }, { x: 320, y: 320 }, { x: 200, y: 300 }, { x: 80, y: 250 }
  ];

  let starLabels = [];
  let completed = new Array(10).fill(false);
  const rocketIndices = [0,2,4,6,8];

  // Get selected profile from window.MentoraConfig (set by constellation.html)
  const config = window.MentoraConfig || { degree: "BCA", field: "AI/ML", level: "beginner" };
  const degree = config.degree;
  const field = config.field;
  const level = config.level;

  // IndexedDB functions
  let db = null;
  function openDB() {
    return new Promise((resolve) => {
      const req = indexedDB.open("MentoraDB", 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("progress")) db.createObjectStore("progress");
      };
      req.onsuccess = () => { db = req.result; resolve(db); };
      req.onerror = () => resolve(null);
    });
  }
  async function saveCompleted(key, arr) {
    if (!db) await openDB();
    if (!db) return;
    const tx = db.transaction("progress", "readwrite");
    const store = tx.objectStore("progress");
    store.put(arr, key);
  }
  async function loadCompleted(key) {
    if (!db) await openDB();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction("progress", "readonly");
      const store = tx.objectStore("progress");
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
    });
  }
  function getProfileKey() {
    return `${degree}_${field}_${level}`;
  }

  function getFallbackRoadmap() {
    const pools = {
      "AI/ML": ["Python","Data Analysis","Machine Learning","Neural Networks","Deep Learning","NLP","Computer Vision","LLMs","AI Ethics","Model Deployment"],
      "Frontend Development": ["HTML5","CSS3","JavaScript","React","Tailwind","Git","Responsive Design","Web Performance","TypeScript","Next.js"],
      "Full Stack": ["HTML/CSS","JavaScript","React","Node.js","Express","MongoDB","SQL","REST APIs","Git","Docker"]
    };
    return (pools[field] || pools["AI/ML"]).slice(0,10);
  }

  function drawConstellation() {
    if (completed.every(v => v === true)) {
  // ... draw cap ...
  if (!confettiActive) startConfetti();
}
    ctx.clearRect(0,0,600,400);
    // draw connections
    ctx.beginPath();
    ctx.strokeStyle = "#ffdd9944";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < starPositions.length-1; i++) {
      ctx.beginPath();
      ctx.moveTo(starPositions[i].x, starPositions[i].y);
      ctx.lineTo(starPositions[i+1].x, starPositions[i+1].y);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(starPositions[4].x, starPositions[4].y);
    ctx.lineTo(starPositions[5].x, starPositions[5].y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(starPositions[9].x, starPositions[9].y);
    ctx.lineTo(starPositions[0].x, starPositions[0].y);
    ctx.stroke();

    // stars
    for (let i=0; i<starPositions.length; i++) {
      const p = starPositions[i];
      const isComplete = completed[i];
      ctx.shadowBlur = isComplete ? 20 : 0;
      ctx.shadowColor = "#FFD966";
      const grad = ctx.createRadialGradient(p.x-3,p.y-3,3,p.x,p.y,12);
      if (isComplete) {
        grad.addColorStop(0,"#FFD966");
        grad.addColorStop(1,"#FFA500");
      } else {
        grad.addColorStop(0,"#BBB");
        grad.addColorStop(1,"#6688aa");
      }
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 12, 0, Math.PI*2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = isComplete ? "#fff5e0" : "#eef";
      ctx.font = "bold 10px sans-serif";
      ctx.fillText(starLabels[i].slice(0,12), p.x-20, p.y-8);
      ctx.fillStyle = isComplete ? "gold" : "#ffd";
      ctx.font = "14px sans-serif";
      ctx.fillText("⭐", p.x-7, p.y+4);
    }

    // rocket
    if (rocketIndices.every(idx => completed[idx])) {
      ctx.beginPath();
      ctx.moveTo(300,30);
      ctx.lineTo(320,70);
      ctx.lineTo(280,70);
      ctx.closePath();
      ctx.fillStyle = "#FFB34733";
      ctx.fill();
      ctx.strokeStyle = "#FFB347";
      ctx.stroke();
      ctx.fillStyle = "white";
      ctx.font = "bold 16px monospace";
      ctx.fillText("🚀", 295, 45);
    }
    // cap & confetti
    if (completed.every(v=>v===true)) {
      ctx.beginPath();
      ctx.moveTo(250,340);
      ctx.lineTo(350,340);
      ctx.lineTo(300,310);
      ctx.closePath();
      ctx.fillStyle = "#FFD96688";
      ctx.fill();
      ctx.strokeStyle = "#FFD966";
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.font = "20px sans-serif";
      ctx.fillText("🎓", 285, 330);
      if (!document.getElementById("confetti-msg")) {
        const li = document.createElement("li");
        li.id = "confetti-msg";
        li.textContent = "🎉 CONGRATULATIONS! Constellation completed! 🎉";
        recList.prepend(li);
        setTimeout(() => li.remove(), 5000);
      }
    }
  }

  function updateRecommendations() {
    const completedCount = completed.filter(c=>c).length;
    progressText.textContent = `${completedCount} / 10 skills mastered`;
    let recs = [];
    if (field === "AI/ML") recs = ["Kaggle Competition", "Build a Chatbot", "Google AI Hackathon"];
    else if (field === "Frontend Development") recs = ["Frontend Mentor", "Portfolio Project", "Open Source Contribution"];
    else recs = ["Fullstack Project", "DevOps Hackathon", "Freelance Gig"];
    if (completedCount >= 5) recs.push("🔥 Rocket milestone – apply for internships!");
    if (completedCount === 10) recs.push("🎓 GRADUATION READY – placement prep");
    recList.innerHTML = recs.map(r => `<li>✨ ${r}</li>`).join('');
  }

  async function loadRoadmap() {
    starLabels = getFallbackRoadmap();
    completed = new Array(10).fill(false);
    const key = getProfileKey();
    const saved = await loadCompleted(key);
    if (saved && saved.length === 10) completed = saved;
    drawConstellation();
    let confettiActive = false;
let confettiParticles = [];

function startConfetti() {
  if (confettiActive) return;
  confettiActive = true;
  confettiParticles = [];
  for (let i = 0; i < 100; i++) {
    confettiParticles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 6 + 2,
      color: `hsl(${Math.random() * 360}, 100%, 60%)`,
      speedY: Math.random() * 3 + 1,
      speedX: (Math.random() - 0.5) * 2
    });
  }
  requestAnimationFrame(drawConfetti);
}

function drawConfetti() {
  if (!confettiActive) return;
  ctx.save();
  for (let i = 0; i < confettiParticles.length; i++) {
    const p = confettiParticles[i];
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
    p.x += p.speedX;
    p.y += p.speedY;
    if (p.y > canvas.height) p.y = -10;
    if (p.x > canvas.width) p.x = 0;
    if (p.x < 0) p.x = canvas.width;
  }
  ctx.restore();
  requestAnimationFrame(drawConfetti);
  // stop after 3 seconds
  if (confettiActive) setTimeout(() => { confettiActive = false; }, 3000);
}
    updateRecommendations();
    await saveCompleted(key, completed);
  }

  function handleStarClick(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let clientX, clientY;
    if (e.touches) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      e.preventDefault();
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const canvasX = (clientX - rect.left) * scaleX;
    const canvasY = (clientY - rect.top) * scaleY;
    for (let i = 0; i < starPositions.length; i++) {
      const dx = starPositions[i].x - canvasX;
      const dy = starPositions[i].y - canvasY;
      if (Math.hypot(dx, dy) < 20) {
        if (!completed[i]) {
          if (confirm(`📘 ${starLabels[i]}\n\nComplete this skill?`)) {
            completed[i] = true;
            drawConstellation();
            updateRecommendations();
            saveCompleted(getProfileKey(), completed);
            if (rocketIndices.every(idx => completed[idx])) alert("🚀 ROCKET UNLOCKED!");
            if (completed.every(v=>v)) alert("🎓 GRADUATION CAP UNLOCKED!");
          }
        } else {
          alert(`✅ Already completed: ${starLabels[i]}`);
        }
        break;
      }
    }
  }

  canvas.addEventListener("click", handleStarClick);
  canvas.addEventListener("touchstart", handleStarClick, { passive: false });
  openDB().then(() => loadRoadmap());
});