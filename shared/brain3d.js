/* SimuLab UVa · cerebro 3D de las portadas: ilustración, no un atlas.
   Corteza azul de puntos finos, nodos ámbar, haces de fibras por el interior, y cerebelo y tronco dorados.
   mkBrain(N) crea la figura; drawBrain(ctx,B,cx,cy,escala,giro,inclinación,t,opacidad) la dibuja. */
(function () {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rng = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const ell = (x, y, z, c, r) => Math.hypot((x - c[0]) / r[0], (y - c[1]) / r[1], (z - c[2]) / r[2]) - 1;
  const smin = (a, b, k) => -k * Math.log(Math.exp(-a / k) + Math.exp(-b / k));
  // Forma de un hemisferio (x > 0 hacia fuera, y arriba, z > 0 hacia delante)
  const fTemp = (x, y, z) => ell(x, y, z, [.54, -.31, .20], [.22, .18, .46]);
  const fRest = (x, y, z) => smin(smin(ell(x, y, z, [.25, .15, -.06], [.51, .50, .76]), ell(x, y, z, [.18, .04, .47], [.41, .42, .43]), .07), ell(x, y, z, [.16, .00, -.62], [.37, .36, .30]), .07);
  const fHemi = (x, y, z) => smin(fRest(x, y, z), fTemp(x, y, z), .012);
  const fCere = (x, y, z) => ell(x, y, z, [.14, -.40, -.60], [.34, .20, .28]);
  const grad = (f, x, y, z) => { const e = .01, a = f(x + e, y, z) - f(x - e, y, z), b = f(x, y + e, z) - f(x, y - e, z), c = f(x, y, z + e) - f(x, y, z - e), l = Math.hypot(a, b, c) || 1; return [a / l, b / l, c / l]; };
  function hit(f, c, d) { let t = 1.7; while (t > 0 && f(c[0] + d[0] * t, c[1] + d[1] * t, c[2] + d[2] * t) > 0) t -= .02; if (t <= 0) return null; let lo = t, hi = t + .02; for (let i = 0; i < 6; i++) { const m = (lo + hi) / 2; f(c[0] + d[0] * m, c[1] + d[1] * m, c[2] + d[2] * m) > 0 ? hi = m : lo = m; } return [c[0] + d[0] * lo, c[1] + d[1] * lo, c[2] + d[2] * lo]; }
  const fibo = (i, n, o) => { const y = 1 - 2 * (i + .5) / n, r = Math.sqrt(1 - y * y), a = i * 2.399963 + o; return [r * Math.cos(a), y, r * Math.sin(a)]; };
  // Las líneas donde este campo vale cero dibujan los surcos
  function folds(x, y, z, s) {
    const qx = x + .10 * Math.sin(7 * y + 3 * z + s), qy = y + .10 * Math.sin(6 * z + 4 * x + 2 * s), qz = z + .10 * Math.sin(6 * x + 5 * y);
    return Math.sin(13 * qy + 7 * qz + s) + Math.sin(12 * qz - 6 * qx + 1.3) + .8 * Math.sin(15 * qx + 8 * qy - 5 * qz + s);
  }
  const BLUE = '56,189,248', GOLD = '251,191,36', FIB = ['236,72,153', '217,70,239', '251,191,36', '103,232,249', '244,114,182'];

  window.mkBrain = function (N) {
    const P = [], rnd = rng(11), M = Math.round(N * .52), C = Math.round(N * .16);
    for (let h = 0; h < 2; h++) {
      const s = h ? 1 : -1;
      for (let i = 0; i < M; i++) {
        const q = hit(fHemi, [.34, 0, 0], fibo(i, M, h * .9)); if (!q || q[0] < .012) continue;
        const nm = grad(fHemi, q[0], q[1], q[2]), a = folds(q[0], q[1], q[2], s);
        const syl = Math.abs(fTemp(q[0], q[1], q[2]) - fRest(q[0], q[1], q[2])), cen = Math.abs(q[2] - (.08 - .22 * q[1]) - .025 * Math.sin(16 * q[1]));
        const big = Math.min(q[1] < .12 && q[0] > .3 ? syl / .05 : 9, q[1] > -.02 ? cen / .022 : 9);
        const g = clamp(Math.min(Math.abs(a) / .34, big), 0, 1), d = .07 * (1 - g);
        P.push({ x: s * (q[0] - nm[0] * d), y: q[1] - nm[1] * d, z: q[2] - nm[2] * d, nx: s * nm[0], ny: nm[1], nz: nm[2], g, h, part: 0, rg: (a > 0 ? 1 : 0) + (fTemp(q[0], q[1], q[2]) < fRest(q[0], q[1], q[2]) ? 2 : 0) + (q[1] > -.02 && q[2] > .08 - .22 * q[1] ? 4 : 0) });
      }
      for (let i = 0; i < C; i++) {
        const q = hit(fCere, [.20, -.40, -.60], fibo(i, C, h)); if (!q || q[0] < .012 || fHemi(q[0], q[1], q[2]) < .01) continue;
        const nm = grad(fCere, q[0], q[1], q[2]), a = Math.sin(46 * q[1] + 6 * q[2]), g = clamp(Math.abs(a) / .5, 0, 1), d = .02 * (1 - g);
        P.push({ x: s * (q[0] - nm[0] * d), y: q[1] - nm[1] * d, z: q[2] - nm[2] * d, nx: s * nm[0], ny: nm[1], nz: nm[2], g, h, part: 1, rg: a > 0 ? 1 : 0 });
      }
    }
    // Centrado (se incluye la punta del tronco)
    let a0 = 1e9, a1 = -1e9, b0 = -.70, b1 = -1e9, c0 = 1e9, c1 = -1e9;
    P.forEach(p => { a0 = Math.min(a0, p.x); a1 = Math.max(a1, p.x); b0 = Math.min(b0, p.y); b1 = Math.max(b1, p.y); c0 = Math.min(c0, p.z); c1 = Math.max(c1, p.z); });
    const mx = (a0 + a1) / 2, my = (b0 + b1) / 2, mz = (c0 + c1) / 2; P.forEach(p => { p.x -= mx; p.y -= my; p.z -= mz; });
    // Malla fina: enlaces entre vecinos que no cruzan un surco
    const n = P.length, dm = 2.6 * Math.sqrt(5.5 / n), cell = new Map(), K = (a, b, c) => a * 73856093 ^ b * 19349663 ^ c * 83492791;
    P.forEach((p, i) => { const k = K(Math.floor(p.x / dm), Math.floor(p.y / dm), Math.floor(p.z / dm)); (cell.get(k) || cell.set(k, []).get(k)).push(i); });
    const E = [], seen = new Set();
    P.forEach((a, i) => {
      const ax = Math.floor(a.x / dm), ay = Math.floor(a.y / dm), az = Math.floor(a.z / dm), d = [];
      for (let u = -1; u <= 1; u++) for (let v = -1; v <= 1; v++) for (let w = -1; w <= 1; w++) (cell.get(K(ax + u, ay + v, az + w)) || []).forEach(j => {
        if (j === i) return; const b = P[j]; if (a.part !== b.part || a.h !== b.h || a.rg !== b.rg) return;
        const q = (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2; if (q < dm * dm) d.push([q, j]);
      });
      d.sort((u, v) => u[0] - v[0]);
      d.slice(0, 3).forEach(([, j]) => { const key = i < j ? i * n + j : j * n + i; if (!seen.has(key)) { seen.add(key); E.push([i, j]); } });
    });
    // Nodos ámbar repartidos, sobre la corteza y en el interior
    const nH = clamp(Math.round(N / 55), 34, 90), dH = .95 / Math.sqrt(nH), H = [], cort = P.filter(p => p.part === 0);
    for (let tries = 0; tries < nH * 40 && H.length < nH; tries++) {
      const p = cort[Math.floor(rnd() * cort.length)], k = rnd() < .85 ? .97 : .72 + .15 * rnd(), q = { x: p.x * k, y: p.y * k, z: p.z * k, r: .55 + rnd() * rnd() * 1.1, ph: rnd() * 6.28, act: 0 };
      if (H.every(o => Math.hypot(o.x - q.x, o.y - q.y, o.z - q.z) > dH)) H.push(q);
    }
    // Haces de fibras: cada uno se abre en abanico desde un nodo hacia otro
    const steps = 10, S = [], perB = clamp(Math.round(N / 900), 5, 12), nB = Math.round(H.length * .6), tip = [-mx, -.70 - my, -.26 - mz];
    const strand = (A, Bp, C0, col, bundle) => { const pts = new Float32Array((steps + 1) * 3); for (let i = 0; i <= steps; i++) { const f = i / steps, u = 1 - f; for (let k = 0; k < 3; k++) pts[i * 3 + k] = u * u * A[k] + 2 * u * f * C0[k] + f * f * Bp[k]; } S.push({ pts, col, bundle }); };
    const jit = v => (rnd() - .5) * 2 * v;
    const links = [];
    for (let b = 0; b < nB; b++) {
      const i = Math.floor(rnd() * H.length), a = H[i]; let j = -1, best = 1e9; const want = .6 + rnd() * .9;
      H.forEach((o, m) => { if (m === i) return; const d = Math.abs(Math.hypot(o.x - a.x, o.y - a.y, o.z - a.z) - want) + .55 * Math.abs(o.y - a.y) + .3 * Math.abs(o.x - a.x); if (d < best) { best = d; j = m; } });
      const c = H[j], col = Math.floor(rnd() * FIB.length), ctl = [(a.x + c.x) / 2 * .85 + jit(.10), (a.y + c.y) / 2 * .85 + jit(.10), (a.z + c.z) / 2 * .92 + jit(.10)], first = S.length, wide = .03 + rnd() * .09;
      for (let s = 0; s < perB; s++) strand([a.x, a.y, a.z], [(c.x + jit(wide)) * .93, (c.y + jit(wide)) * .93, (c.z + jit(wide)) * .93], [ctl[0] + jit(.035), ctl[1] + jit(.035), ctl[2] + jit(.035)], col, b);
      links.push({ first, n: perB, to: j });
    }
    // Tronco: abanico dorado que converge en la punta
    const stem = clamp(Math.round(N / 60), 30, 90);
    for (let s = 0; s < stem; s++) { const a = s / stem * 6.2832, R = .06 + rnd() * .14, top = [Math.cos(a) * R - mx, -.16 + jit(.05) - my, -.10 + Math.sin(a) * R - mz]; strand(top, [tip[0] + jit(.03), tip[1], tip[2] + jit(.03)], [Math.cos(a) * .075 - mx, -.42 - my, -.18 + Math.sin(a) * .075 - mz], -1, -1); }
    const NS = S.length, pulses = []; for (let i = 0; i < clamp(Math.round(N / 140), 14, 40); i++) pulses.push({ l: Math.floor(rnd() * links.length), s: Math.floor(rnd() * perB), f: rnd(), sp: .25 + rnd() * .35 });
    return { P, E, H, S, links, pulses, X: new Float32Array(P.length), Y: new Float32Array(P.length), Z: new Float32Array(P.length), F: new Float32Array(P.length), SX: new Float32Array(NS * (steps + 1)), SY: new Float32Array(NS * (steps + 1)), steps, lt: null };
  };

  window.drawBrain = function (ctx, B, cx, cy, sc, yaw, tilt, t, am) {
    const dt = B.lt == null ? 0 : Math.min(.1, Math.max(0, t - B.lt)); B.lt = t;
    const cY = Math.cos(yaw), sY = Math.sin(yaw), cX = Math.cos(tilt), sX = Math.sin(tilt), { P, X, Y, Z, F, S, SX, SY, H, steps } = B, n = P.length;
    const prx = (x, y, z) => { const x1 = x * cY - z * sY, z1 = x * sY + z * cY, y1 = y * cX - z1 * sX, z2 = y * sX + z1 * cX, k = 3.2 / (3.2 + z2); return [cx + x1 * sc * k, cy - y1 * sc * k, z2, k]; };
    for (let i = 0; i < n; i++) {
      const p = P[i], x1 = p.x * cY - p.z * sY, z1 = p.x * sY + p.z * cY, y1 = p.y * cX - z1 * sX, z2 = p.y * sX + z1 * cX, k = 3.2 / (3.2 + z2);
      X[i] = cx + x1 * sc * k; Y[i] = cy - y1 * sc * k; Z[i] = k;
      F[i] = -(p.ny * sX + (p.nx * sY + p.nz * cY) * cX);
    }
    ctx.save(); ctx.globalAlpha = am; ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    const vis = i => { const f = F[i], g = P[i].g; return f > 0 ? .13 + .17 * f + .55 * (1 - f) ** 3 + .75 * (1 - g) ** 1.5 : .025; };
    // Corteza y cerebelo: malla muy fina
    ctx.lineWidth = Math.max(.4, sc / 520);
    const bk = new Map();
    B.E.forEach(([a, b]) => { const v = (vis(a) + vis(b)) / 2 * (P[a].part ? 2.2 : .9); if (v < .05) return; const key = (P[a].part ? 8 : 0) + Math.min(7, v * 8 | 0); let l = bk.get(key); if (!l) bk.set(key, l = []); l.push(a, b); });
    bk.forEach((l, key) => { ctx.strokeStyle = `rgba(${key >= 8 ? GOLD : BLUE},${((key & 7) + .6) / 8})`; ctx.beginPath(); for (let i = 0; i < l.length; i += 2) { ctx.moveTo(X[l[i]], Y[l[i]]); ctx.lineTo(X[l[i + 1]], Y[l[i + 1]]); } ctx.stroke(); });
    // Puntos finos
    const r0 = Math.max(.45, sc * .0026), bp = new Map();
    for (let i = 0; i < n; i++) { const v = vis(i); if (v < .08) continue; const key = (P[i].part ? 8 : 0) + Math.min(7, v * 8 | 0); let l = bp.get(key); if (!l) bp.set(key, l = []); l.push(i); }
    bp.forEach((l, key) => { ctx.fillStyle = `rgba(${key >= 8 ? GOLD : BLUE},${((key & 7) + .6) / 8})`; l.forEach(i => { const r = r0 * Z[i] * 2; ctx.fillRect(X[i] - r / 2, Y[i] - r / 2, r, r); }); });
    // Haces de fibras
    ctx.lineWidth = Math.max(.45, sc / 480);
    const fb = new Map(), W = steps + 1;
    S.forEach((s, m) => {
      const o = m * W; let zm = 0;
      for (let i = 0; i < W; i++) { const q = i * 3, x = s.pts[q], y = s.pts[q + 1], z = s.pts[q + 2], x1 = x * cY - z * sY, z1 = x * sY + z * cY, y1 = y * cX - z1 * sX, z2 = y * sX + z1 * cX, k = 3.2 / (3.2 + z2); SX[o + i] = cx + x1 * sc * k; SY[o + i] = cy - y1 * sc * k; zm += z2; }
      const lv = zm / W < -.15 ? 2 : zm / W < .2 ? 1 : 0, key = (s.col + 1) * 3 + lv; let l = fb.get(key); if (!l) fb.set(key, l = []); l.push(o);
    });
    fb.forEach((l, key) => { const col = (key / 3 | 0) - 1, lv = key % 3; ctx.strokeStyle = `rgba(${col < 0 ? GOLD : FIB[col]},${[.10, .20, .34][lv] * (col < 0 ? 1.8 : 1)})`; ctx.beginPath(); l.forEach(o => { ctx.moveTo(SX[o], SY[o]); for (let i = 1; i < W; i++) ctx.lineTo(SX[o + i], SY[o + i]); }); ctx.stroke(); });
    // Señales que recorren los haces
    const f0 = Math.max(1, sc * .007);
    B.pulses.forEach(p => {
      p.f += p.sp * dt; if (p.f >= 1) { H[B.links[p.l].to].act = 1; p.f = 0; p.l = (p.l * 7 + 3 + (t * 10 | 0)) % B.links.length; }
      const L = B.links[p.l], o = (L.first + p.s % L.n) * W, u = p.f * steps, i = Math.min(steps - 1, u | 0), f = u - i, x = SX[o + i] + (SX[o + i + 1] - SX[o + i]) * f, y = SY[o + i] + (SY[o + i + 1] - SY[o + i]) * f;
      ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.beginPath(); ctx.arc(x, y, f0 * 2.4, 0, 6.2832); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.beginPath(); ctx.arc(x, y, f0, 0, 6.2832); ctx.fill();
    });
    // Nodos ámbar con halo
    const dec = Math.exp(-2.5 * dt);
    H.forEach(h => {
      const [x, y, z, k] = prx(h.x, h.y, h.z), tw = .75 + .25 * Math.sin(t * 1.6 + h.ph), dep = z > .25 ? .4 : 1, R = sc * .0115 * h.r * k * (1 + h.act * .7);
      h.act *= dec;
      const G = ctx.createRadialGradient(x, y, 0, x, y, R * 3.6); G.addColorStop(0, `rgba(251,191,36,${.55 * tw * dep})`); G.addColorStop(1, 'rgba(251,146,60,0)');
      ctx.fillStyle = G; ctx.beginPath(); ctx.arc(x, y, R * 3.6, 0, 6.2832); ctx.fill();
      ctx.fillStyle = `rgba(254,240,138,${(.7 + .3 * tw) * dep})`; ctx.beginPath(); ctx.arc(x, y, Math.max(.9, R), 0, 6.2832); ctx.fill();
    });
    ctx.restore();
  };
})();
