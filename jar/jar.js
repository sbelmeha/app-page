(() => {
  const stage = document.getElementById("main");
  const canvas = document.getElementById("jar");
  const ctx = canvas.getContext("2d");
  const page = document.getElementById("page");
  const jarbox = document.getElementById("jarbox");
  const caption = document.getElementById("caption");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const PAGE = ["A note you drop into a jar.", "Tap a line, and it falls in.", "Shake, and one comes back."];
  const SEEDED = ["plum jam on Sunday", "Mila said again!", "call grandma back", "the good bakery", "tram 18, window seat", "breathe out slower"];
  const MAX_ROWS = 4, G = 0.32;
  const PALETTE = ["--l-blue", "--l-amber", "--l-green", "--l-purple", "--l-red"];

  let colors = [], glass = "", ink = "", dark = false;
  function readColors() {
    const cs = getComputedStyle(document.documentElement);
    colors = PALETTE.map(v => cs.getPropertyValue(v).trim());
    glass = cs.getPropertyValue("--glass").trim();
    ink = cs.getPropertyValue("--ink").trim();
    dark = cs.colorScheme === "dark" || getComputedStyle(document.body).colorScheme === "dark";
  }

  let W = 0, H = 0, dpr = 1, J = null, FS = 24, R = 8.5;
  const parts = [], lines = new Map();
  let nextLine = 1, nextColor = 0;

  function layout() {
    const s = stage.getBoundingClientRect(), b = jarbox.getBoundingClientRect();
    W = s.width; H = s.height; dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    const row = page.querySelector(".row");
    FS = row ? parseFloat(getComputedStyle(row).fontSize) : 24;
    R = FS * 0.34;
    const w = Math.min(b.width, 330), x0 = b.left - s.left + (b.width - w) / 2, x1 = x0 + w;
    const rim = b.top - s.top + 30, bottom = b.bottom - s.top - 8, wall = 5;
    J = { x0, x1, rim, bottom, wall, L: x0 + wall, R: x1 - wall, floor: bottom - wall, rc: 30, neck: 16, shoulder: rim + 40 };
  }

  /* --- Particles --- */
  function addPart(ch, color, x, y, line) {
    const p = { ch, color, x, y, px: x, py: y, a: 0, va: (Math.random() - .5) * .25, inside: false, line, hold: 0, home: null, t: 0 };
    parts.push(p); return p;
  }
  function aimAt(p, delay) {
    const tx = (J.L + J.R) / 2 + (Math.random() - .5) * (J.R - J.L) * 0.4, ty = J.rim - 4;
    const T = 36 + Math.random() * 14;
    p.px = p.x - (tx - p.x) / T; p.py = p.y - (ty - p.y - 0.5 * G * T * T) / T; p.hold = delay;
  }

  function step() {
    const sub = 2, g = G / (sub * sub);
    for (let s = 0; s < sub; s++) {
      for (const p of parts) {
        if (p.home) continue;
        if (p.hold > 0) {
          if (s === 0 && --p.hold === 0) { const vx = p.x - p.px, vy = p.y - p.py; p.px = p.x - vx / sub; p.py = p.y - vy / sub; }
          continue;
        }
        let vx = (p.x - p.px) * .999, vy = (p.y - p.py) * .999;
        const sp = Math.hypot(vx, vy); if (sp > 10) { vx *= 10 / sp; vy *= 10 / sp; }
        p.px = p.x; p.py = p.y; p.x += vx; p.y += vy + g; p.a += p.va / sub;
        if (!p.inside && p.y > J.rim && p.x > J.L + 2 && p.x < J.R - 2 && vy > 0) p.inside = true;
        if (!p.inside && p.y > H + 40) { p.x = (J.L + J.R) / 2 + (Math.random() - .5) * 60; p.y = -30; aimAt(p, 1); }
      }
      for (let it = 0; it < 3; it++) { collide(); walls(); }
    }
    for (const p of parts) if (!p.home) p.va *= .985;
    for (const p of parts) {
      if (!p.home) continue;
      p.t += reduced ? .12 : .028;
      const t = Math.max(0, Math.min(1, p.t)), e = 1 - Math.pow(1 - t, 3);
      p.x = p.home.sx + (p.home.x - p.home.sx) * e;
      p.y = p.home.sy + (p.home.y - p.home.sy) * e - Math.sin(Math.PI * t) * 70;
      p.a = p.home.sa * (1 - e);
    }
  }
  function collide() {
    const n = parts.length, D = 2 * R, d2 = D * D;
    for (let i = 0; i < n; i++) {
      const a = parts[i]; if (!a.inside || a.hold || a.home) continue;
      for (let j = i + 1; j < n; j++) {
        const b = parts[j]; if (!b.inside || b.hold || b.home) continue;
        const dx = b.x - a.x; if (dx > D || dx < -D) continue;
        const dy = b.y - a.y, q = dx * dx + dy * dy;
        if (q >= d2 || q === 0) continue;
        const d = Math.sqrt(q), k = (D - d) / d * .5, ox = dx * k, oy = dy * k;
        a.x -= ox; a.y -= oy; b.x += ox; b.y += oy;
        const spin = (dx * (b.y - b.py - (a.y - a.py)) - dy * (b.x - b.px - (a.x - a.px))) * .0012;
        a.va = a.va * .92 + spin; b.va = b.va * .92 - spin;
      }
    }
  }
  function walls() {
    const { L, R: Rw, floor, rc } = J;
    for (const p of parts) {
      if (!p.inside || p.hold || p.home) continue;
      if (p.x < L + R) { p.x = L + R; p.py = p.y - (p.y - p.py) * .8; }
      if (p.x > Rw - R) { p.x = Rw - R; p.py = p.y - (p.y - p.py) * .8; }
      if (p.y > floor - R) { p.y = floor - R; p.px = p.x - (p.x - p.px) * .7; p.va *= .8; }
      if (p.y > floor - rc) {
        const cx = p.x < L + rc ? L + rc : p.x > Rw - rc ? Rw - rc : null;
        if (cx !== null) {
          const cy = floor - rc, dx = p.x - cx, dy = p.y - cy, d = Math.hypot(dx, dy), m = rc - R;
          if (d > m) { p.x = cx + dx / d * m; p.y = cy + dy / d * m; }
        }
      }
    }
  }

  /* --- Drawing --- */
  function jarPath(inset) {
    const { x0, x1, rim, bottom, neck, shoulder } = J;
    const l = x0 + inset, r = x1 - inset, b = bottom - inset, rc = 34 - inset * .5;
    ctx.beginPath();
    ctx.moveTo(l + neck, rim - 12);
    ctx.lineTo(l + neck, rim + 8);
    ctx.bezierCurveTo(l + neck, shoulder - 8, l, shoulder - 18, l, shoulder + 10);
    ctx.lineTo(l, b - rc); ctx.quadraticCurveTo(l, b, l + rc, b);
    ctx.lineTo(r - rc, b); ctx.quadraticCurveTo(r, b, r, b - rc);
    ctx.lineTo(r, shoulder + 10);
    ctx.bezierCurveTo(r, shoulder - 18, r - neck, shoulder - 8, r - neck, rim + 8);
    ctx.lineTo(r - neck, rim - 12);
  }
  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const cx = (J.x0 + J.x1) / 2;
    const sh = ctx.createRadialGradient(cx, J.bottom + 4, 4, cx, J.bottom + 4, (J.x1 - J.x0) * .6);
    sh.addColorStop(0, dark ? "rgba(0,0,0,.5)" : "rgba(20,40,35,.14)"); sh.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = sh; ctx.fillRect(J.x0 - 30, J.bottom - 10, J.x1 - J.x0 + 60, 26);
    jarPath(0); ctx.closePath(); ctx.fillStyle = dark ? "rgba(140,170,160,.05)" : "rgba(255,255,255,.45)"; ctx.fill();

    ctx.font = `800 ${FS}px Nunito, ui-rounded, system-ui, sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (const p of parts) {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a);
      if (p.hold) ctx.fillStyle = ink;
      else if (p.home) { ctx.fillStyle = ink; ctx.globalAlpha = .4 + .6 * Math.max(0, Math.min(1, p.t)); }
      else ctx.fillStyle = colors[p.color];
      ctx.fillText(p.ch, 0, 1);
      ctx.restore();
    }

    ctx.lineJoin = "round";
    jarPath(0); ctx.strokeStyle = glass; ctx.lineWidth = 2; ctx.stroke();
    jarPath(J.wall); ctx.strokeStyle = dark ? "rgba(160,190,180,.18)" : "rgba(150,170,165,.35)"; ctx.lineWidth = 1; ctx.stroke();
    const ll = J.x0 + J.neck - 3, lr = J.x1 - J.neck + 3;
    ctx.beginPath(); ctx.roundRect(ll, J.rim - 18, lr - ll, 9, 4.5); ctx.strokeStyle = glass; ctx.lineWidth = 1.5; ctx.stroke();
    const a = dark ? .08 : .6;
    const hl = ctx.createLinearGradient(J.x0 + 6, 0, J.x0 + 28, 0);
    hl.addColorStop(0, "rgba(255,255,255,0)"); hl.addColorStop(.5, `rgba(255,255,255,${a})`); hl.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = hl; ctx.fillRect(J.x0 + 6, J.shoulder + 24, 22, J.bottom - J.shoulder - 70);
    const hr = ctx.createLinearGradient(J.x1 - 24, 0, J.x1 - 8, 0);
    hr.addColorStop(0, "rgba(255,255,255,0)"); hr.addColorStop(.6, `rgba(255,255,255,${a * .7})`); hr.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = hr; ctx.fillRect(J.x1 - 24, J.shoulder + 36, 16, J.bottom - J.shoulder - 100);
  }

  /* --- Lines --- */
  function addLine(text, opts = {}) {
    const id = nextLine++;
    lines.set(id, { text, color: nextColor++ % PALETTE.length, parts: [], ...opts });
    return id;
  }
  function makeRow(id) {
    const line = lines.get(id), b = document.createElement("button");
    b.type = "button"; b.className = "row"; b.dataset.id = id;
    b.setAttribute("aria-label", `Drop “${line.text}” into the jar`);
    const span = document.createElement("span"); span.textContent = line.text; b.appendChild(span);
    b.addEventListener("click", () => dropRow(b));
    page.appendChild(b); return b;
  }
  const rows = () => page.querySelectorAll(".row").length;
  function charRects(node) {
    const out = [], range = document.createRange(), s = stage.getBoundingClientRect();
    let i = 0;
    for (const ch of node.textContent) {
      if (ch.trim()) {
        range.setStart(node, i); range.setEnd(node, i + ch.length);
        const r = range.getBoundingClientRect();
        out.push({ ch, x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height / 2 });
      }
      i += ch.length;
    }
    return out;
  }
  function dropText(id, textNode) {
    const line = lines.get(id);
    line.parts = charRects(textNode).map((r, k) => {
      const p = addPart(r.ch, line.color, r.x, r.y, id);
      aimAt(p, 1 + Math.round(k * (reduced ? .3 : 1.7)));
      return p;
    });
  }
  let hinted = false;
  function dropRow(row) {
    dropText(Number(row.dataset.id), row.firstChild.firstChild);
    row.remove();
    if (!hinted) { hinted = true; setTimeout(() => say("Tap the jar to shake one back out"), 1400); }
  }
  function say(text) { caption.textContent = text; }

  function shake() {
    for (const p of parts) if (p.inside && !p.home && !p.hold) { p.px = p.x - (Math.random() - .5) * 6; p.py = p.y + 2 + Math.random() * 4; }
    const ready = [...lines.entries()].filter(([, l]) => !l.stays && l.parts.length && l.parts.every(p => p.inside && !p.home && !p.hold));
    if (!ready.length) return;
    if (rows() >= MAX_ROWS) { say("The page is full. Drop a line first"); return; }
    const [id, line] = ready[Math.floor(Math.random() * ready.length)];
    const row = makeRow(id); row.classList.add("away");
    const rects = charRects(row.firstChild.firstChild);
    line.parts.forEach((p, k) => {
      const r = rects[k] || rects[rects.length - 1];
      p.home = { x: r.x, y: r.y, sx: p.x, sy: p.y, sa: p.a }; p.t = -k * .015;
    });
    const timer = setInterval(() => {
      if (!line.parts.every(p => p.t >= 1)) return;
      clearInterval(timer);
      for (const p of line.parts) parts.splice(parts.indexOf(p), 1);
      line.parts = []; row.classList.remove("away");
    }, 50);
  }
  document.getElementById("shake").addEventListener("click", () => {
    if (!reduced) jarbox.animate([{ transform: "none" }, { transform: "translateX(-5px)" }, { transform: "translateX(5px)" }, { transform: "none" }], { duration: 300 });
    shake();
  });

  /* --- Waitlist --- */
  // Google Apps Script web app that appends each signup to the waitlist sheet (scripts/jar-waitlist.gs).
  const ENDPOINT = "https://script.google.com/macros/s/AKfycbwM0haVn57iStqymBUlJqIybs-K-UnaUDZKR9pA4Kxe8m5EcLke5V5-0N2_kyEaz0vFzg/exec";
  const KEY = "jar.waitlist.email";
  const join = document.getElementById("join"), form = document.getElementById("form"), input = document.getElementById("email"), note = document.getElementById("note");
  const base = note.textContent;
  const store = (v) => { try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY); } catch {} };
  const saved = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
  function showDone(email) {
    join.classList.add("done");
    note.classList.remove("err");
    note.innerHTML = "You're on the list. The invite goes to <b></b>. <button type=\"button\" class=\"again\">Change</button>";
    note.querySelector("b").textContent = email;
    note.querySelector(".again").addEventListener("click", () => {
      store(null); join.classList.remove("done"); note.textContent = base; input.focus();
    });
  }
  input.addEventListener("input", () => { note.textContent = base; note.classList.remove("err"); });
  const submit = document.getElementById("submit"), trap = document.getElementById("website");
  async function send(email) {
    const res = await fetch(ENDPOINT, { method: "POST", body: new URLSearchParams({ email, app: "jar", website: trap.value }) });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "rejected");
  }
  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (submit.disabled) return;
    const email = input.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      note.textContent = email ? "Check the address. It should look like name@example.com" : "Enter your email to get an invite";
      note.classList.add("err"); input.focus(); return;
    }
    submit.disabled = true; note.classList.remove("err"); note.textContent = "Adding you to the list…";
    try { await send(email); }
    catch {
      note.textContent = "Couldn't reach the list. Check your connection and try again.";
      note.classList.add("err"); submit.disabled = false; return;
    }
    submit.disabled = false;
    // The address drops into the jar from where it was typed.
    const probe = document.createElement("span");
    probe.textContent = email;
    const cs = getComputedStyle(input);
    Object.assign(probe.style, { position: "absolute", whiteSpace: "pre", font: cs.font, visibility: "hidden" });
    stage.appendChild(probe);
    const ir = input.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    probe.style.left = (ir.left - sr.left + parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth)) + "px";
    probe.style.top = (ir.top - sr.top + (ir.height - probe.offsetHeight) / 2) + "px";
    const id = addLine(email, { stays: true });
    dropText(id, probe.firstChild);
    probe.remove();
    store(email); input.value = "";
    showDone(email);
    say("Your line is in the jar");
  });

  /* --- Start --- */
  function seed() {
    for (const text of SEEDED) {
      const id = addLine(text), line = lines.get(id);
      for (const ch of text) {
        if (!ch.trim()) continue;
        const p = addPart(ch, line.color, J.L + R + Math.random() * (J.R - J.L - 2 * R), J.floor - 20 - Math.random() * 150, id);
        p.inside = true; p.a = (Math.random() - .5) * 2.4; line.parts.push(p);
      }
    }
    for (let i = 0; i < 500; i++) step();
    for (const p of parts) { p.px = p.x; p.py = p.y; p.va = 0; }
  }
  let last = 0, acc = 0;
  function frame(t) {
    acc += Math.min(50, t - (last || t)); last = t;
    while (acc >= 1000 / 60) { step(); acc -= 1000 / 60; }
    draw(); requestAnimationFrame(frame);
  }
  function start() {
    readColors();
    for (const text of PAGE) makeRow(addLine(text));
    layout(); seed();
    const email = saved(); if (email) showDone(email);
    draw(); requestAnimationFrame(frame);
    new ResizeObserver(() => {
      const old = J; layout();
      const dx = (J.L + J.R) / 2 - (old.L + old.R) / 2, dy = J.floor - old.floor;
      if (dx || dy) for (const p of parts) if (p.inside && !p.home) { p.x += dx; p.y += dy; p.px += dx; p.py += dy; }
    }).observe(stage);
  }
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", readColors);
  new MutationObserver(readColors).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(start);
})();
