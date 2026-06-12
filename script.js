document.addEventListener("DOMContentLoaded", function () {
  const canvas = document.getElementById("starCanvas");
  const degreeSelect = document.getElementById("degreeSelect");
  const fieldSelect = document.getElementById("fieldSelect");
  const levelSelect = document.getElementById("levelSelect");
  const progressText = document.getElementById("progressText");
  const recList = document.getElementById("recList");
  const generateButton = document.getElementById("generateBtn");

  if (
    !canvas ||
    !canvas.getContext ||
    !degreeSelect ||
    !fieldSelect ||
    !levelSelect ||
    !progressText ||
    !recList
  ) {
    return;
  }

  canvas.width = 600;
  canvas.height = 400;

  const ctx = canvas.getContext("2d");
  const starPositions = [
    { x: 80, y: 70 },
    { x: 180, y: 50 },
    { x: 280, y: 90 },
    { x: 380, y: 60 },
    { x: 480, y: 100 },
    { x: 520, y: 200 },
    { x: 440, y: 280 },
    { x: 320, y: 320 },
    { x: 200, y: 300 },
    { x: 80, y: 250 }
  ];

  let starLabels = Array.from({ length: 10 }, function (_, index) {
    return "Skill " + (index + 1);
  });

  let completed = Array(10).fill(false);
  const rocketIndices = [0, 2, 4, 6, 8];

  let dbPromise = null;
  let confettiTimeoutId = null;

  function openDatabase() {
    if (dbPromise) {
      return dbPromise;
    }

    dbPromise = new Promise(function (resolve) {
      if (!("indexedDB" in window)) {
        resolve(null);
        return;
      }

      const request = indexedDB.open("MentoraDB", 1);

      request.onupgradeneeded = function (event) {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("progress")) {
          db.createObjectStore("progress", { keyPath: "profileKey" });
        }
      };

      request.onsuccess = function () {
        resolve(request.result);
      };

      request.onerror = function () {
        resolve(null);
      };
    });

    return dbPromise;
  }

  function getProfileKey(degree, field, level) {
    return degree + "_" + field + "_" + level;
  }

  async function saveCompleted(profileKey, completedArray) {
    const db = await openDatabase();

    if (!db || !profileKey) {
      return false;
    }

    return new Promise(function (resolve) {
      try {
        const tx = db.transaction("progress", "readwrite");
        const store = tx.objectStore("progress");

        store.put({
          profileKey: profileKey,
          completed: completedArray.slice(0, 10).map(Boolean)
        });

        tx.oncomplete = function () {
          resolve(true);
        };

        tx.onerror = function () {
          resolve(false);
        };
      } catch (_error) {
        resolve(false);
      }
    });
  }

  async function loadCompleted(profileKey) {
    const db = await openDatabase();

    if (!db || !profileKey) {
      return null;
    }

    return new Promise(function (resolve) {
      try {
        const tx = db.transaction("progress", "readonly");
        const store = tx.objectStore("progress");
        const request = store.get(profileKey);

        request.onsuccess = function () {
          const saved = request.result && Array.isArray(request.result.completed)
            ? request.result.completed.slice(0, 10).map(Boolean)
            : null;

          resolve(saved && saved.length === 10 ? saved : null);
        };

        request.onerror = function () {
          resolve(null);
        };
      } catch (_error) {
        resolve(null);
      }
    });
  }

  function getFallbackRoadmap(_degree, field, level) {
    const skillPools = {
      "AI/ML": [
        "Python",
        "Data Analysis",
        "Machine Learning",
        "Neural Networks",
        "Deep Learning",
        "NLP",
        "Computer Vision",
        "LLMs",
        "AI Ethics",
        "Model Deployment"
      ],
      "Frontend Development": [
        "HTML5",
        "CSS3",
        "JavaScript",
        "React",
        "Tailwind",
        "Git",
        "Responsive Design",
        "Web Performance",
        "TypeScript",
        "Next.js"
      ],
      "Full Stack": [
        "HTML/CSS",
        "JavaScript",
        "React",
        "Node.js",
        "Express",
        "MongoDB",
        "SQL",
        "REST APIs",
        "Git",
        "Docker"
      ]
    };

    const selectedPool = skillPools[field] || skillPools["AI/ML"];

    if (level === "beginner") {
      return selectedPool.slice(0, 10);
    }

    return selectedPool.slice(0, 10);
  }

  function truncateLabel(label) {
    return String(label || "").slice(0, 12);
  }

  function triggerConfetti() {
    if (!recList) {
      return;
    }

    const existing = document.getElementById("mentora-confetti-item");
    if (existing) {
      existing.remove();
    }

    if (confettiTimeoutId) {
      clearTimeout(confettiTimeoutId);
      confettiTimeoutId = null;
    }

    setTimeout(function () {
      const li = document.createElement("li");
      li.id = "mentora-confetti-item";
      li.textContent = "🎉 CONGRATULATIONS! Constellation completed! 🎉";
      recList.prepend(li);

      confettiTimeoutId = window.setTimeout(function () {
        const tempItem = document.getElementById("mentora-confetti-item");
        if (tempItem) {
          tempItem.remove();
        }
        confettiTimeoutId = null;
      }, 5000);
    }, 0);
  }

  function drawConstellation() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.strokeStyle = "#ffdd9944";
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(starPositions[0].x, starPositions[0].y);
    for (let i = 1; i < starPositions.length; i += 1) {
      ctx.lineTo(starPositions[i].x, starPositions[i].y);
    }
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(starPositions[4].x, starPositions[4].y);
    ctx.lineTo(starPositions[5].x, starPositions[5].y);
    ctx.moveTo(starPositions[9].x, starPositions[9].y);
    ctx.lineTo(starPositions[0].x, starPositions[0].y);
    ctx.stroke();
    ctx.restore();

    starPositions.forEach(function (star, index) {
      ctx.save();

      const gradient = ctx.createRadialGradient(
        star.x - 4,
        star.y - 4,
        2,
        star.x,
        star.y,
        14
      );

      if (completed[index]) {
        gradient.addColorStop(0, "#FFD966");
        gradient.addColorStop(1, "#FFA500");
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#FFD966";
      } else {
        gradient.addColorStop(0, "#B8B8B8");
        gradient.addColorStop(1, "#6E6E6E");
        ctx.shadowBlur = 0;
        ctx.shadowColor = "transparent";
      }

      ctx.beginPath();
      ctx.arc(star.x, star.y, 12, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = completed[index] ? "#FFC000" : "#8A8A8A";
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.font = "16px Arial, sans-serif";
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText("⭐", star.x - 8, star.y + 6);
      ctx.restore();

      ctx.save();
      ctx.font = "12px Arial, sans-serif";
      ctx.fillStyle = "#F9E7C3";
      ctx.fillText(truncateLabel(starLabels[index]), star.x + 16, star.y - 14);
      ctx.restore();
    });

    const rocketReady = rocketIndices.every(function (index) {
      return completed[index];
    });

    if (rocketReady) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(300, 20);
      ctx.lineTo(320, 70);
      ctx.lineTo(280, 70);
      ctx.closePath();
      ctx.fillStyle = "#FFD8A8";
      ctx.strokeStyle = "orange";
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();
      ctx.font = "24px Arial, sans-serif";
      ctx.fillStyle = "orange";
      ctx.fillText("🚀", 295, 45);
      ctx.restore();
    }

    if (completed.every(Boolean)) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(250, 340);
      ctx.lineTo(300, 310);
      ctx.lineTo(350, 340);
      ctx.lineTo(300, 355);
      ctx.closePath();
      ctx.fillStyle = "gold";
      ctx.strokeStyle = "#C09000";
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "gold";
      ctx.fillRect(288, 298, 24, 10);
      ctx.strokeRect(288, 298, 24, 10);
      ctx.restore();

      triggerConfetti();
    }
  }

  function updateRecommendations() {
    const completedCount = completed.filter(Boolean).length;
    const field = fieldSelect.value;

    progressText.textContent =
      "Progress: " + completedCount + "/10 skills completed";

    const recommendationMap = {
      "AI/ML": [
        "Kaggle Competition",
        "Build a Chatbot",
        "Google AI Hackathon"
      ],
      "Frontend Development": [
        "Frontend Mentor",
        "Portfolio Project",
        "Open Source Contribution"
      ],
      "Full Stack": [
        "Fullstack Project",
        "DevOps Hackathon",
        "Freelance Gig"
      ]
    };

    const recommendations = (recommendationMap[field] || recommendationMap["AI/ML"]).slice();

    if (completedCount >= 5) {
      recommendations.push("🔥 Rocket milestone – apply for internships!");
    }

    if (completedCount === 10) {
      recommendations.push("🎓 GRADUATION READY – placement prep");
    }

    recList.innerHTML = "";

    recommendations.forEach(function (item) {
      const li = document.createElement("li");
      li.textContent = item;
      recList.appendChild(li);
    });
  }

  function getCanvasCoordinates(event) {
    const rect = canvas.getBoundingClientRect();
    const point =
      (event.touches && event.touches[0]) ||
      (event.changedTouches && event.changedTouches[0]) ||
      event;

    if (!point) {
      return null;
    }

    return {
      x: ((point.clientX - rect.left) / rect.width) * canvas.width,
      y: ((point.clientY - rect.top) / rect.height) * canvas.height
    };
  }

  async function handleStarClick(index) {
    if (completed[index]) {
      alert("Already completed");
      return;
    }

    const skillName = starLabels[index] || ("Skill " + (index + 1));
    const shouldComplete = window.confirm(
      skillName + "\n\nComplete this skill?"
    );

    if (!shouldComplete) {
      return;
    }

    completed[index] = true;
    drawConstellation();
    updateRecommendations();
    await saveCompleted(
      getProfileKey(degreeSelect.value, fieldSelect.value, levelSelect.value),
      completed
    );
  }

  function handleCanvasInteraction(event) {
    const coords = getCanvasCoordinates(event);

    if (!coords) {
      return;
    }

    for (let i = 0; i < starPositions.length; i += 1) {
      const star = starPositions[i];
      const distance = Math.hypot(coords.x - star.x, coords.y - star.y);

      if (distance < 20) {
        handleStarClick(i);
        break;
      }
    }
  }

  async function loadRoadmap(degree, field, level) {
    const selectedDegree = degree || degreeSelect.value || "BCA";
    const selectedField = field || fieldSelect.value || "AI/ML";
    const selectedLevel = level || levelSelect.value || "beginner";

    if (
      Array.from(degreeSelect.options).some(function (option) {
        return option.value === selectedDegree;
      })
    ) {
      degreeSelect.value = selectedDegree;
    }

    if (
      Array.from(fieldSelect.options).some(function (option) {
        return option.value === selectedField;
      })
    ) {
      fieldSelect.value = selectedField;
    }

    if (
      Array.from(levelSelect.options).some(function (option) {
        return option.value === selectedLevel;
      })
    ) {
      levelSelect.value = selectedLevel;
    }

    starLabels = getFallbackRoadmap(selectedDegree, selectedField, selectedLevel);
    completed = Array(10).fill(false);

    const profileKey = getProfileKey(selectedDegree, selectedField, selectedLevel);
    const savedCompleted = await loadCompleted(profileKey);

    if (savedCompleted) {
      completed = savedCompleted.slice(0, 10);
    }

    drawConstellation();
    updateRecommendations();
    await saveCompleted(profileKey, completed);
  }

  canvas.addEventListener("click", handleCanvasInteraction);

  canvas.addEventListener(
    "touchstart",
    function (event) {
      event.preventDefault();
      handleCanvasInteraction(event);
    },
    { passive: false }
  );

  if (generateButton) {
    generateButton.addEventListener("click", function () {
      loadRoadmap(degreeSelect.value, fieldSelect.value, levelSelect.value);
    });
  }

  if (
    Array.from(degreeSelect.options).some(function (option) {
      return option.value === "BCA";
    })
  ) {
    degreeSelect.value = "BCA";
  }

  if (
    Array.from(fieldSelect.options).some(function (option) {
      return option.value === "AI/ML";
    })
  ) {
    fieldSelect.value = "AI/ML";
  }

  if (
    Array.from(levelSelect.options).some(function (option) {
      return option.value === "beginner";
    })
  ) {
    levelSelect.value = "beginner";
  }

  loadRoadmap("BCA", "AI/ML", "beginner");
});