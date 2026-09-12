import { createParticles, scatter, stepParticles } from './particle-motion.mjs';

const heading = document.querySelector('.particle-wordmark');
const canvas = heading?.querySelector('canvas');
const context = canvas?.getContext('2d');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

if (context) {
  let particles = [], width = 0, height = 0, frame = 0, previous = 0;
  let elapsed = 0, lastBurst = 0, flyingUntil = 0, pointer = null;

  function rebuild() {
    width = heading.clientWidth;
    height = heading.clientHeight;
    if (!width || !height) return;
    const scale = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    const mask = document.createElement('canvas');
    mask.width = width;
    mask.height = height;
    const ink = mask.getContext('2d');
    if (!ink) return;
    ink.font = '500 56px "Space Grotesk", sans-serif';
    ink.textBaseline = 'middle';
    const textWidth = ink.measureText('reflex').width;
    const left = (width - textWidth - 12) / 2;
    ink.fillText('reflex', left, height / 2);
    heading.style.setProperty('--version-left', `${left + textWidth + 4}px`);
    const data = ink.getImageData(0, 0, width, height).data;
    const targets = [];
    for (let y = 2; y < height - 2; y += 2) {
      for (let x = 2; x < width - 2; x += 2) {
        if (data[(y * width + x) * 4 + 3] > 160) targets.push({ x, y });
      }
    }
    particles = createParticles(targets);
    heading.classList.toggle('particles-ready', particles.length > 0 && !reducedMotion.matches);
    draw();
  }

  function draw() {
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#171717';
    context.beginPath();
    for (const p of particles) {
      context.moveTo(p.x + p.radius, p.y);
      context.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    }
    context.fill();
  }

  function animate(timestamp) {
    const dt = previous ? Math.min((timestamp - previous) / 1000, 1 / 30) : 0;
    previous = timestamp;
    elapsed += dt;
    // A short burst of bouncing particles, then a soft return to legible letters.
    if (elapsed - lastBurst > 6) {
      scatter(particles);
      lastBurst = elapsed;
      flyingUntil = elapsed + 1.2;
    }
    stepParticles(particles, dt, elapsed, width, height, elapsed < flyingUntil, pointer);
    draw();
    frame = requestAnimationFrame(animate);
  }

  function updatePlayback() {
    cancelAnimationFrame(frame);
    previous = 0;
    heading.classList.toggle('particles-ready', particles.length > 0 && !reducedMotion.matches);
    if (!reducedMotion.matches && !document.hidden) frame = requestAnimationFrame(animate);
  }

  heading.addEventListener('pointermove', event => {
    const rect = heading.getBoundingClientRect();
    pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  });
  for (const event of ['pointerleave', 'pointercancel', 'pointerup']) {
    heading.addEventListener(event, () => { pointer = null; });
  }
  document.addEventListener('visibilitychange', updatePlayback);
  reducedMotion.addEventListener('change', updatePlayback);
  new ResizeObserver(rebuild).observe(heading);
  document.fonts.load('500 56px "Space Grotesk"').then(() => {
    rebuild();
    updatePlayback();
  }).catch(() => { /* Keep the ordinary wordmark if the font cannot load. */ });
}
