import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createParticles, scatter, stepParticles } from '../assets/particle-motion.mjs';

const targets = Array.from({ length: 80 }, (_, i) => ({ x: 90 + i % 20 * 6, y: 40 + Math.floor(i / 20) * 8 }));
const distance = particles => particles.reduce((sum, p) => sum + Math.hypot(p.x - p.homeX, p.y - p.homeY), 0) / particles.length;

test('particles fly away and reform their original letters', () => {
  const particles = createParticles(targets);
  scatter(particles);
  for (let i = 0; i < 72; i++) stepParticles(particles, 1 / 60, i / 60, 340, 120, true, null);
  assert.ok(distance(particles) > 30, 'A burst must visibly separate the particles');
  for (let i = 0; i < 240; i++) stepParticles(particles, 1 / 60, i / 60, 340, 120, false, null);
  assert.ok(distance(particles) < 1, 'The word must become readable again');
});

test('particles bounce inward at all four edges without leaving the canvas', () => {
  for (const [x, y, vx, vy] of [[2, 60, -300, 0], [338, 60, 300, 0], [150, 2, 0, -300], [150, 118, 0, 300]]) {
    const [particle] = createParticles([{x, y}]);
    Object.assign(particle, {vx, vy});
    stepParticles([particle], 1 / 30, 0, 340, 120, true, null);
    assert.ok(particle.x >= particle.radius && particle.x <= 340 - particle.radius);
    assert.ok(particle.y >= particle.radius && particle.y <= 120 - particle.radius);
    if (vx) assert.ok(particle.vx * vx < 0);
    if (vy) assert.ok(particle.vy * vy < 0);
  }
});

test('pointer repels nearby particles and a direct hit remains finite', () => {
  const particles = createParticles([{x: 150, y: 60}, {x: 160, y: 60}, {x: 300, y: 60}]);
  stepParticles(particles, 1 / 60, 0, 340, 120, true, {x: 150, y: 60});
  assert.ok(particles[1].x > 160);
  assert.equal(particles[2].x, 300);
  assert.ok(particles.every(p => Number.isFinite(p.x) && Number.isFinite(p.y)));
});

test('long frame gaps cannot fling particles outside the drawing area', () => {
  const particles = createParticles(targets);
  scatter(particles);
  stepParticles(particles, 60, 60, 340, 120, true, null);
  assert.ok(particles.every(p => p.x >= 0 && p.x <= 340 && p.y >= 0 && p.y <= 120));
  assert.ok(distance(particles) < 5);
});
