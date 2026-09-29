// The home page's threads of light, without the DOM so it can be tested in Node.
// Movement paints its velocity into a coarse field that drifts on and fades; a few thousand
// free threads ride the field, and each is drawn as its last TRAIL positions. While the field
// flows the threads stretch into lines; once it fades they shrink back to specks of dust.

export const TRAIL = 16;
export const CELL = 22;
const RADIUS = 100;
const MAX_SPEED = 2400;
const FADE = 1.25;
const RIDE = 0.8;
const AMBIENT = 5;
const MARGIN = 30;

const finite = value => Number.isFinite(value);
const clampStep = dt => (finite(dt) ? Math.min(Math.max(dt, 0), 1 / 30) : 0);

export function createField(width, height) {
  const columns = Math.ceil(width / CELL) + 2, rows = Math.ceil(height / CELL) + 2, size = columns * rows;
  return {
    width, height, columns, rows,
    x: new Float32Array(size), y: new Float32Array(size),
    nextX: new Float32Array(size), nextY: new Float32Array(size),
  };
}

// Blends the stroke's velocity into the cells around it, so a sustained movement writes its own
// speed rather than piling up without bound.
export function paint(field, x0, y0, x1, y1, dt) {
  if (![x0, y0, x1, y1, dt].every(finite) || dt <= 0) return;
  let vx = (x1 - x0) / dt, vy = (y1 - y0) / dt;
  const speed = Math.hypot(vx, vy);
  if (speed < 2) return;
  if (speed > MAX_SPEED) { vx *= MAX_SPEED / speed; vy *= MAX_SPEED / speed; }
  const { columns, rows } = field;
  const steps = Math.min(200, Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 12)));
  const spread = 2 * (RADIUS * 0.42) ** 2;
  for (let s = 1; s <= steps; s++) {
    const x = x0 + (x1 - x0) * s / steps, y = y0 + (y1 - y0) * s / steps;
    const i0 = Math.max(0, Math.floor((x - RADIUS) / CELL) + 1), i1 = Math.min(columns - 1, Math.ceil((x + RADIUS) / CELL) + 1);
    const j0 = Math.max(0, Math.floor((y - RADIUS) / CELL) + 1), j1 = Math.min(rows - 1, Math.ceil((y + RADIUS) / CELL) + 1);
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        const dx = (i - 1) * CELL - x, dy = (j - 1) * CELL - y;
        const weight = Math.exp(-(dx * dx + dy * dy) / spread) * 0.55;
        const k = j * columns + i;
        field.x[k] += (vx - field.x[k]) * weight;
        field.y[k] += (vy - field.y[k]) * weight;
      }
    }
  }
}

// The current spreads a little into its neighbours and fades with a 1.25 s time constant.
export function relax(field, dt) {
  dt = clampStep(dt);
  const { columns, rows } = field;
  const fade = Math.exp(-dt / FADE), keep = 1 - 0.2 * Math.min(1, dt * 60), share = (1 - keep) / 4;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < columns; i++) {
      const k = j * columns + i;
      const l = i > 0 ? k - 1 : k, r = i < columns - 1 ? k + 1 : k;
      const u = j > 0 ? k - columns : k, d = j < rows - 1 ? k + columns : k;
      field.nextX[k] = (field.x[k] * keep + (field.x[l] + field.x[r] + field.x[u] + field.x[d]) * share) * fade;
      field.nextY[k] = (field.y[k] * keep + (field.y[l] + field.y[r] + field.y[u] + field.y[d]) * share) * fade;
    }
  }
  [field.x, field.nextX] = [field.nextX, field.x];
  [field.y, field.nextY] = [field.nextY, field.y];
}

function sample(field, values, x, y) {
  const gx = Math.min(Math.max(x / CELL + 1, 0), field.columns - 1.001);
  const gy = Math.min(Math.max(y / CELL + 1, 0), field.rows - 1.001);
  const i = gx | 0, j = gy | 0, u = gx - i, v = gy - j, k = j * field.columns + i, below = k + field.columns;
  return (values[k] * (1 - u) + values[k + 1] * u) * (1 - v) + (values[below] * (1 - u) + values[below + 1] * u) * v;
}

export function velocityAt(field, x, y) {
  return [sample(field, field.x, x, y), sample(field, field.y, x, y)];
}

export function createThreads(count, width, height, random = Math.random) {
  const threads = {
    count, width, height, head: 0, random,
    x: new Float32Array(count), y: new Float32Array(count),
    trailX: new Float32Array(count * TRAIL), trailY: new Float32Array(count * TRAIL),
  };
  for (let i = 0; i < count; i++) respawn(threads, i);
  return threads;
}

function respawn(threads, i) {
  const x = threads.random() * threads.width, y = threads.random() * threads.height;
  threads.x[i] = x; threads.y[i] = y;
  threads.trailX.fill(x, i * TRAIL, i * TRAIL + TRAIL);
  threads.trailY.fill(y, i * TRAIL, i * TRAIL + TRAIL);
}

// Moves every thread with the current plus a slow ambient drift too small to draw a line,
// and records the position as the newest point of its trail.
export function advance(threads, field, dt, time) {
  dt = clampStep(dt);
  if (!finite(time)) time = 0;
  const { width, height, head } = threads;
  for (let i = 0; i < threads.count; i++) {
    const x = threads.x[i], y = threads.y[i];
    const ax = Math.sin(y * 0.011 + time * 0.3 + i) * AMBIENT, ay = Math.cos(x * 0.009 - time * 0.25 + i) * AMBIENT;
    const nx = x + (sample(field, field.x, x, y) * RIDE + ax) * dt;
    const ny = y + (sample(field, field.y, x, y) * RIDE + ay) * dt;
    if (!finite(nx) || !finite(ny) || nx < -MARGIN || nx > width + MARGIN || ny < -MARGIN || ny > height + MARGIN) {
      respawn(threads, i);
    } else {
      threads.x[i] = nx; threads.y[i] = ny;
    }
    threads.trailX[i * TRAIL + head] = threads.x[i];
    threads.trailY[i * TRAIL + head] = threads.y[i];
  }
  threads.head = (head + 1) % TRAIL;
}

// Distance between a thread's oldest and newest trail points: how long it is drawn.
export function threadLength(threads, i) {
  const o = i * TRAIL, oldest = threads.head, newest = (threads.head + TRAIL - 1) % TRAIL;
  return Math.hypot(threads.trailX[o + newest] - threads.trailX[o + oldest], threads.trailY[o + newest] - threads.trailY[o + oldest]);
}
