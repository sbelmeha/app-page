import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advance, createField, createThreads, paint, relax, threadLength, velocityAt } from '../assets/silk-field.mjs';

const W = 800, H = 500;
const seeded = (seed = 1) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const stroke = (field, y = 250) => { for (let x = 100; x < 700; x += 10) paint(field, x, y, x + 10, y, 1 / 120); };
const run = (threads, field, seconds, start = 0) => {
  for (let t = 0; t < seconds; t += 1 / 60) { relax(field, 1 / 60); advance(threads, field, 1 / 60, start + t); }
};
const longest = threads => Math.max(...Array.from({ length: threads.count }, (_, i) => threadLength(threads, i)));

test('movement paints a current along its path and nowhere else', () => {
  const field = createField(W, H);
  stroke(field);
  const [vx, vy] = velocityAt(field, 400, 250);
  assert.ok(vx > 400, `the current follows the stroke (${vx})`);
  assert.ok(Math.abs(vy) < vx * 0.05);
  assert.ok(Math.hypot(...velocityAt(field, 400, 20)) < 1, 'far from the stroke nothing moves');
});

test('a sustained stroke writes its own speed instead of piling up', () => {
  const field = createField(W, H);
  for (let i = 0; i < 30; i++) stroke(field);
  const [vx] = velocityAt(field, 400, 250);
  assert.ok(vx <= 1200 * 1.001, `blended towards 1200 px/s, got ${vx}`);
});

test('threads stretch into lines while the current flows and shrink to dust when still', () => {
  const field = createField(W, H), threads = createThreads(1500, W, H, seeded());
  run(threads, field, 1);
  assert.ok(longest(threads) < 2, 'at rest every thread is a speck');
  stroke(field);
  run(threads, field, 0.2);
  const drawn = Array.from({ length: threads.count }, (_, i) => threadLength(threads, i)).filter(l => l > 40).length;
  assert.ok(drawn > 20, `the stroke draws threads (${drawn})`);
  run(threads, field, 8, 2);
  assert.ok(longest(threads) < 2, 'the current fades and the lines shrink back');
});

test('threads carried off screen come back as specks, without a line across the page', () => {
  const field = createField(W, H), threads = createThreads(600, W, H, seeded(3));
  for (let i = 0; i < 20; i++) { stroke(field, 150); stroke(field, 350); run(threads, field, 0.1); }
  for (let i = 0; i < threads.count; i++) {
    assert.ok(threads.x[i] >= -30 && threads.x[i] <= W + 30 && threads.y[i] >= -30 && threads.y[i] <= H + 30);
  }
  assert.ok(longest(threads) < 600, 'no respawned thread keeps its old trail');
});

test('hostile input and long frame gaps stay finite and bounded', () => {
  const field = createField(W, H), threads = createThreads(200, W, H, seeded(5));
  for (const args of [[NaN, 0, 10, 10, 0.01], [0, 0, Infinity, 0, 0.01], [0, 0, 10, 0, 0], [0, 0, 10, 0, -1], [0, 0, 1e9, 0, 1e-9]]) {
    paint(field, ...args);
  }
  paint(field, 100, 250, 700, 250, 0.001);
  relax(field, NaN);
  advance(threads, field, NaN, NaN);
  advance(threads, field, 60, 1);
  assert.ok(field.x.every(Number.isFinite) && field.y.every(Number.isFinite));
  assert.ok(threads.x.every(Number.isFinite) && threads.y.every(Number.isFinite));
  assert.ok(Math.hypot(...velocityAt(field, 400, 250)) <= 2400 * 1.001, 'speed is capped');
  assert.ok(longest(threads) < 2400 / 30 + 10, 'one step moves at most 1/30 s of travel');
});
