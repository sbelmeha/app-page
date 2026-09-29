import { TRAIL, advance, createField, createThreads, paint, relax, threadLength } from './silk-field.mjs';

// Draws the threads behind the home page and feeds them the visitor's movement. A short
// scripted stroke plays on load, and again after a long idle spell, so a visitor on a phone
// sees that the page answers before touching it.
const canvas = document.querySelector('.silk');
const context = canvas?.getContext('2d');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const COLORS = ['255,140,222', '168,150,255', '120,220,255', '255,200,140', '255,255,255', '236,232,255'];

if (context) {
  let width = 0, height = 0, field, threads, hues;
  let frame = 0, previous = 0, time = 0, slowFrames = 0, density = 1 / 330;
  let last = null, ghostStart = 0.7, lastInput = 0;

  function rebuild() {
    const w = innerWidth, h = innerHeight;
    if (w === width && h === height && threads) return;
    width = w; height = h;
    const scale = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    field = createField(width, height);
    threads = createThreads(Math.round(Math.min(3200, width * height * density)), width, height);
    hues = Uint8Array.from({ length: threads.count }, (_, i) => i % COLORS.length);
    draw();
  }

  function draw() {
    context.globalCompositeOperation = 'source-over';
    context.fillStyle = '#000';
    context.fillRect(0, 0, width, height);
    context.globalCompositeOperation = 'lighter';
    // Threads are batched by colour and brightness; each is split so its tail is fainter.
    const paths = new Map();
    const path = key => paths.get(key) ?? paths.set(key, new Path2D()).get(key);
    const dust = new Path2D();
    const { head, trailX, trailY } = threads, half = TRAIL >> 1;
    for (let i = 0; i < threads.count; i++) {
      const length = threadLength(threads, i), o = i * TRAIL;
      if (length < 2) { dust.rect(threads.x[i] - 0.5, threads.y[i] - 0.5, 1, 1); continue; }
      const level = Math.min(7, Math.floor(Math.min(1, length / 110) * 8));
      for (const [from, to, key] of [[0, half, hues[i] * 16 + (level >> 1)], [half - 1, TRAIL - 1, hues[i] * 16 + level + 8]]) {
        const line = path(key);
        let k = (head + from) % TRAIL;
        line.moveTo(trailX[o + k], trailY[o + k]);
        for (let j = from + 1; j <= to; j++) { k = (head + j) % TRAIL; line.lineTo(trailX[o + k], trailY[o + k]); }
      }
    }
    context.lineWidth = 0.8;
    context.lineCap = 'round';
    for (const [key, line] of paths) {
      const level = key % 16, strength = level >= 8 ? (level - 7) / 8 : (level + 1) / 16;
      context.strokeStyle = `rgba(${COLORS[key >> 4]},${(strength * 0.75).toFixed(3)})`;
      context.stroke(line);
    }
    context.fillStyle = 'rgba(255,255,255,.13)';
    context.fill(dust);
  }

  function feed(x, y, stamp) {
    if (last && stamp > last.stamp) paint(field, last.x, last.y, x, y, Math.max((stamp - last.stamp) / 1000, 1 / 240));
    last = { x, y, stamp };
  }

  function ghost() {
    if (ghostStart === null) {
      if (time - lastInput < 16) return;
      ghostStart = time; last = null;
    }
    const t = (time - ghostStart) / 2.4;
    if (t < 0) return;
    if (t > 1) { ghostStart = null; last = null; lastInput = time; return; }
    const eased = t * t * (3 - 2 * t);
    feed(width * (0.1 + 0.8 * eased), height * (0.42 + Math.sin(eased * Math.PI * 2.3) * 0.13), time * 1000);
  }

  function animate(timestamp) {
    const elapsed = previous ? (timestamp - previous) / 1000 : 1 / 60;
    previous = timestamp;
    const dt = Math.min(elapsed, 1 / 30);
    time += dt;
    // A device that cannot keep up gets fewer threads rather than a stuttering page.
    slowFrames = elapsed > 1 / 40 ? slowFrames + 1 : Math.max(0, slowFrames - 1);
    if (slowFrames > 45 && threads.count > 500) {
      slowFrames = 0; density *= 0.65; width = 0;
      rebuild();
    }
    ghost();
    relax(field, dt);
    advance(threads, field, dt, time);
    draw();
    frame = requestAnimationFrame(animate);
  }

  function updatePlayback() {
    cancelAnimationFrame(frame);
    previous = 0;
    last = null;
    if (!reducedMotion.matches && !document.hidden) frame = requestAnimationFrame(animate);
  }

  addEventListener('pointermove', event => {
    if (reducedMotion.matches) return;
    if (ghostStart !== null && time >= ghostStart) last = null;
    ghostStart = null;
    lastInput = time;
    document.documentElement.classList.add('moved');
    for (const e of event.getCoalescedEvents?.() ?? [event]) feed(e.clientX, e.clientY, e.timeStamp);
  }, { passive: true });
  for (const type of ['pointerdown', 'pointerup', 'pointercancel', 'pointerleave']) {
    addEventListener(type, () => { last = null; }, { passive: true });
  }
  addEventListener('resize', () => requestAnimationFrame(rebuild));
  document.addEventListener('visibilitychange', updatePlayback);
  reducedMotion.addEventListener('change', updatePlayback);
  rebuild();
  updatePlayback();
}
