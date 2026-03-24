(function() {
  // Set the target date: April 1, 2026 (adjust year if needed)
  const targetDate = new Date(2026, 3, 01, 0, 0, 0); // Month is 0-indexed: 3 = april
  let countdownInterval = null;
  const countdownContainer = document.getElementById('countdown-container');
  const birthdayContent = document.getElementById('birthday-content');

  // Function to check if current date is on or after the target
  function isBirthdayReached() {
    const now = new Date();
    return now >= targetDate;
  }

  // Update countdown timer
  function updateCountdown() {
    const now = new Date();
    const diff = targetDate - now;

    if (diff <= 0) {
      // Time has come: hide countdown, show birthday content
      clearInterval(countdownInterval);
      countdownContainer.style.display = 'none';
      birthdayContent.style.display = 'block';
      // Optionally start confetti if you want an immediate burst
      // startConfetti(); (can be called later by button)
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    document.getElementById('days').textContent = String(days).padStart(2, '0');
    document.getElementById('hours').textContent = String(hours).padStart(2, '0');
    document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
  }

  // Initialize: check if birthday already reached or if we have preview query param
  const urlParams = new URLSearchParams(window.location.search);
  const preview = urlParams.get('preview') !== null; // if ?preview is present, force show content

  if (preview || isBirthdayReached()) {
    // Hide countdown and show content immediately
    countdownContainer.style.display = 'none';
    birthdayContent.style.display = 'block';
  } else {
    // Show countdown and start timer
    countdownContainer.style.display = 'flex';
    birthdayContent.style.display = 'none';
    updateCountdown(); // initial call
    countdownInterval = setInterval(updateCountdown, 1000);
  }

  // ----- Confetti logic (unchanged) -----
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];
  const PARTICLE_COUNT = 130;
  let animationId = null;

  function initConfetti() {
    resizeCanvas();
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height * 0.2 - height * 0.2,
        size: Math.random() * 7 + 4,
        speedY: Math.random() * 6 + 5,
        speedX: Math.random() * 2 - 1,
        color: getConfettiColor(),
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 0.8,
      });
    }
  }

  function getConfettiColor() {
    const colors = [
      '#F8C150',
      '#CF9F3F',
      '#E5E9F0',
      '#2D4055',
      '#1E2B3A',
      '#A67C45',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
  }

  function drawConfetti() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.shadowColor = '#00000030';
      ctx.shadowBlur = 6;
      ctx.fillRect(-p.size/2, -p.size/4, p.size, p.size/2);
      ctx.restore();

      p.y += p.speedY * 0.6;
      p.x += p.speedX * 0.4;
      p.rotation += p.rotationSpeed;

      if (p.y > height + 50) {
        p.y = -30;
        p.x = Math.random() * width;
        p.speedY = Math.random() * 6 + 4;
        p.speedX = Math.random() * 2 - 1;
        p.color = getConfettiColor();
      }
      if (p.x > width + 30) p.x = -30;
      if (p.x < -30) p.x = width + 30;
    });
    animationId = requestAnimationFrame(drawConfetti);
  }

  function startConfetti() {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    initConfetti();
    drawConfetti();

    setTimeout(() => {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
        ctx.clearRect(0, 0, width, height);
      }
    }, 4000);
  }

  window.addEventListener('resize', () => {
    resizeCanvas();
  });

  // Attach confetti to the button (only if the button exists)
  const celebrateBtn = document.getElementById('celebrateBtn');
  if (celebrateBtn) {
    celebrateBtn.addEventListener('click', (e) => {
      e.preventDefault();
      startConfetti();
    });
  }
})();