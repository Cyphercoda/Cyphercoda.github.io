const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.getElementById('year').textContent = new Date().getFullYear();

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('[data-reveal]').forEach((element) => revealObserver.observe(element));

function setupTilt(selector, maxTilt = 4) {
  if (reducedMotion || window.matchMedia('(pointer: coarse)').matches) return;
  document.querySelectorAll(selector).forEach((element) => {
    element.addEventListener('pointermove', (event) => {
      const rect = element.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      element.style.transform = `rotateX(${-y * maxTilt}deg) rotateY(${x * maxTilt}deg) translateZ(0)`;
    });
    element.addEventListener('pointerleave', () => { element.style.transform = ''; });
  });
}

setupTilt('#tilt-frame', 8);
setupTilt('.tilt-card', 2.2);

function setupOrb() {
  const canvas = document.getElementById('orb');
  const context = canvas.getContext('2d');
  const frame = document.getElementById('tilt-frame');
  const points = [];
  const count = 72;
  let rotationX = -0.18;
  let rotationY = 0;
  let targetX = rotationX;
  let targetY = rotationY;

  for (let i = 0; i < count; i += 1) {
    const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    points.push({ x: Math.cos(theta) * Math.sin(phi), y: Math.sin(theta) * Math.sin(phi), z: Math.cos(phi) });
  }

  frame.addEventListener('pointermove', (event) => {
    const rect = frame.getBoundingClientRect();
    targetY = ((event.clientX - rect.left) / rect.width - 0.5) * 0.9;
    targetX = ((event.clientY - rect.top) / rect.height - 0.5) * -0.7;
  });
  frame.addEventListener('pointerleave', () => { targetX = -0.18; targetY = rotationY; });

  function draw() {
    const width = canvas.width;
    const height = canvas.height;
    const radius = width * 0.31;
    context.clearRect(0, 0, width, height);
    rotationX += (targetX - rotationX) * 0.035;
    rotationY += (targetY - rotationY) * 0.035 + (reducedMotion ? 0 : 0.0014);

    const projected = points.map((point) => {
      const cy = Math.cos(rotationY); const sy = Math.sin(rotationY);
      const cx = Math.cos(rotationX); const sx = Math.sin(rotationX);
      const x1 = point.x * cy - point.z * sy;
      const z1 = point.x * sy + point.z * cy;
      const y2 = point.y * cx - z1 * sx;
      const z2 = point.y * sx + z1 * cx;
      const scale = 1.4 / (2.35 - z2);
      return { x: width / 2 + x1 * radius * scale, y: height / 2 + y2 * radius * scale, z: z2, scale };
    });

    projected.forEach((point, i) => {
      projected.slice(i + 1).forEach((other) => {
        const dx = point.x - other.x; const dy = point.y - other.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 92 && Math.abs(point.z - other.z) < 0.55) {
          context.beginPath();
          context.moveTo(point.x, point.y); context.lineTo(other.x, other.y);
          context.strokeStyle = `rgba(103,232,249,${Math.max(0, (1 - distance / 92) * .28 * (point.z + 1.25))})`;
          context.lineWidth = 1;
          context.stroke();
        }
      });
      context.beginPath();
      context.arc(point.x, point.y, Math.max(1.4, 3.2 * point.scale), 0, Math.PI * 2);
      const hot = i % 17 === 0;
      context.fillStyle = hot ? `rgba(255,91,77,${.55 + point.z * .25})` : `rgba(103,232,249,${.45 + point.z * .25})`;
      context.fill();
    });

    if (!reducedMotion) requestAnimationFrame(draw);
  }
  draw();
}

setupOrb();

function setupSignalField() {
  if (reducedMotion) return;
  const canvas = document.getElementById('signal-field');
  const context = canvas.getContext('2d');
  const particles = Array.from({ length: 42 }, (_, index) => ({
    x: Math.random(), y: Math.random(), z: Math.random(), speed: 0.00018 + (index % 5) * 0.00004
  }));

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr; canvas.height = window.innerHeight * dpr;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize, { passive: true }); resize();

  function draw() {
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    particles.forEach((p) => {
      p.y -= p.speed; if (p.y < -0.05) p.y = 1.05;
      const x = p.x * window.innerWidth; const y = p.y * window.innerHeight;
      context.fillStyle = p.z > .8 ? 'rgba(255,91,77,.7)' : 'rgba(79,124,255,.5)';
      context.fillRect(x, y, p.z > .8 ? 2 : 1, p.z > .8 ? 18 : 8);
    });
    requestAnimationFrame(draw);
  }
  draw();
}

setupSignalField();
