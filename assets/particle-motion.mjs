export function createParticles(targets) {
  return targets.map((target, index) => ({
    ...target, homeX: target.x, homeY: target.y, vx: 0, vy: 0,
    phase: index * 2.399963, radius: 0.7 + (index % 5) * 0.07,
  }));
}

export function scatter(particles) {
  for (const p of particles) {
    const speed = 45 + (p.phase % 70);
    p.vx = Math.cos(p.phase) * speed;
    p.vy = Math.sin(p.phase) * speed;
  }
}

export function stepParticles(particles, dt, time, width, height, flying, pointer) {
  dt = Math.min(Math.max(dt, 0), 1 / 30);
  for (const p of particles) {
    if (!flying) {
      const x = p.homeX + Math.sin(time * 1.7 + p.phase) * 0.45;
      const y = p.homeY + Math.cos(time * 1.3 + p.phase) * 0.45;
      p.vx += (x - p.x) * 38 * dt;
      p.vy += (y - p.y) * 38 * dt;
      const damping = Math.exp(-8 * dt);
      p.vx *= damping;
      p.vy *= damping;
    }
    if (pointer) {
      const dx = p.x - pointer.x, dy = p.y - pointer.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 38) {
        const angle = distance > 0.1 ? Math.atan2(dy, dx) : p.phase;
        const force = (1 - distance / 38) * 650 * dt;
        p.vx += Math.cos(angle) * force;
        p.vy += Math.sin(angle) * force;
      }
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    const padding = p.radius + 1;
    if (p.x < padding || p.x > width - padding) {
      p.x = Math.max(padding, Math.min(width - padding, p.x));
      p.vx *= -0.85;
    }
    if (p.y < padding || p.y > height - padding) {
      p.y = Math.max(padding, Math.min(height - padding, p.y));
      p.vy *= -0.85;
    }
  }
}
