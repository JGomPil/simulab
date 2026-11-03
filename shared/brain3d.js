/* SimuLab UVa · cerebro 3D de las portadas: ilustración holográfica, no un atlas.
   mkBrain(N) crea la figura; drawBrain(ctx,B,cx,cy,escala,giro,inclinación,t,opacidad) la dibuja. */
(function () {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rng = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const ell = (x, y, z, c, r) => Math.hypot((x - c[0]) / r[0], (y - c[1]) / r[1], (z - c[2]) / r[2]) - 1;
  const smin = (a, b, k) => -k * Math.log(Math.exp(-a / k) + Math.exp(-b / k));
  // Forma de un hemisferio (x > 0 hacia fuera, y arriba, z > 0 hacia delante)
  const fTemp = (x, y, z) => ell(x, y, z, [.55, -.27, .22], [.22, .20, .50]);
  const fRest = (x, y, z) => smin(smin(ell(x, y, z, [.25, .10, -.04], [.51, .56, .90]), ell(x, y, z, [.18, .06, .50], [.41, .43, .46]), .07), ell(x, y, z, [.16, .05, -.66], [.37, .37, .32]), .07);
  const fHemi = (x, y, z) => smin(fRest(x, y, z), fTemp(x, y, z), .03);
  const fCere = (x, y, z) => ell(x, y, z, [.14, -.40, -.60], [.34, .20, .28]);
  const grad = (f, x, y, z) => { const e = .01, a = f(x + e, y, z) - f(x - e, y, z), b = f(x, y + e, z) - f(x, y - e, z), c = f(x, y, z + e) - f(x, y, z - e), l = Math.hypot(a, b, c) || 1; return [a / l, b / l, c / l]; };
  function hit(f, c, d) { let t = 1.7; while (t > 0 && f(c[0] + d[0] * t, c[1] + d[1] * t, c[2] + d[2] * t) > 0) t -= .02; if (t <= 0) return null; let lo = t, hi = t + .02; for (let i = 0; i < 6; i++) { const m = (lo + hi) / 2; f(c[0] + d[0] * m, c[1] + d[1] * m, c[2] + d[2] * m) > 0 ? hi = m : lo = m; } return [c[0] + d[0] * lo, c[1] + d[1] * lo, c[2] + d[2] * lo]; }
  const fibo = (i, n, o) => { const y = 1 - 2 * (i + .5) / n, r = Math.sqrt(1 - y * y), a = i * 2.399963 + o; return [r * Math.cos(a), y, r * Math.sin(a)]; };
  // Las líneas donde este campo vale cero dibujan los surcos
  function folds(x, y, z, s) {
    const qx = x + .10 * Math.sin(7 * y + 3 * z + s), qy = y + .10 * Math.sin(6 * z + 4 * x + 2 * s), qz = z + .10 * Math.sin(6 * x + 5 * y);
    return Math.sin(13 * qy + 7 * qz + s) + Math.sin(12 * qz - 6 * qx + 1.3) + .8 * Math.sin(15 * qx + 8 * qy - 5 * qz + s);
  }
  // Paleta única y continua de delante hacia atrás
  const STOPS = [[34, 211, 238], [96, 165, 250], [129, 140, 248], [192, 132, 252]], NC = 12;
  const PAL = Array.from({ length: NC }, (_, i) => { const t = i / (NC - 1) * (STOPS.length - 1), k = Math.min(STOPS.length - 2, t | 0), f = t - k; return STOPS[k].map((v, j) => Math.round(v + (STOPS[k + 1][j] - v) * f)).join(','); });
  const palOf = z => clamp(Math.floor((.95 - z) / 1.9 * NC), 0, NC - 1);

  window.mkBrain = function (N) {
    const P = [], rnd = rng(11), M = Math.round(N * .52), C = Math.round(N * .07);
    for (let h = 0; h < 2; h++) {
      const s = h ? 1 : -1;
      for (let i = 0; i < M; i++) {
        const q = hit(fHemi, [.34, 0, 0], fibo(i, M, h * .9)); if (!q || q[0] < .012) continue;
        const nm = grad(fHemi, q[0], q[1], q[2]), a = folds(q[0], q[1], q[2], s);
        const syl = Math.abs(fTemp(q[0], q[1], q[2]) - fRest(q[0], q[1], q[2])), cen = Math.abs(q[2] - (.08 - .22 * q[1]) - .025 * Math.sin(16 * q[1]));
        const big = Math.min(q[1] < .12 && q[0] > .3 ? syl / .05 : 9, q[1] > -.02 ? cen / .022 : 9);
        const g = clamp(Math.min(Math.abs(a) / .34, big), 0, 1), d = .05 * (1 - g);
        const x = q[0] - nm[0] * d, y = q[1] - nm[1] * d, z = q[2] - nm[2] * d;
        P.push({ x: s * x, y, z, nx: s * nm[0], ny: nm[1], nz: nm[2], g, h, part: 0, rg: (a > 0 ? 1 : 0) + (fTemp(q[0], q[1], q[2]) < fRest(q[0], q[1], q[2]) ? 2 : 0) + (q[1] > -.02 && q[2] > .08 - .22 * q[1] ? 4 : 0), c: palOf(z) });
      }
      for (let i = 0; i < C; i++) {
        const q = hit(fCere, [.20, -.40, -.60], fibo(i, C, h)); if (!q || q[0] < .012 || fHemi(q[0], q[1], q[2]) < .01) continue;
        const nm = grad(fCere, q[0], q[1], q[2]), a = Math.sin(46 * q[1] + 6 * q[2]), g = clamp(Math.abs(a) / .5, 0, 1), d = .02 * (1 - g);
        P.push({ x: s * (q[0] - nm[0] * d), y: q[1] - nm[1] * d, z: q[2] - nm[2] * d, nx: s * nm[0], ny: nm[1], nz: nm[2], g, h, part: 1, rg: a > 0 ? 1 : 0, c: NC - 1 });
      }
    }
    const J = Math.max(8, Math.round(N / 190));
    for (let r = 0; r < 14; r++) { const f = r / 13, y = -.24 - f * .40, z = -.14 - f * .12, R = .12 - .045 * f; for (let j = 0; j < J; j++) { const a = j / J * 2 * Math.PI + r * .4, cx = Math.cos(a), sz = Math.sin(a); P.push({ x: cx * R, y, z: z + sz * R, nx: cx, ny: 0, nz: sz, g: .7, h: 2, part: 2, rg: 0, c: NC - 2 }); } }
    let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9, c0 = 1e9, c1 = -1e9;
    P.forEach(p => { a0 = Math.min(a0, p.x); a1 = Math.max(a1, p.x); b0 = Math.min(b0, p.y); b1 = Math.max(b1, p.y); c0 = Math.min(c0, p.z); c1 = Math.max(c1, p.z); });
    const mx = (a0 + a1) / 2, my = (b0 + b1) / 2, mz = (c0 + c1) / 2; P.forEach(p => { p.x -= mx; p.y -= my; p.z -= mz; });
    // Enlaces entre vecinos, sin cruzar nunca un surco
    const n = P.length, dm = 2.6 * Math.sqrt(5.5 / n), cell = new Map(), K = (a, b, c) => a * 73856093 ^ b * 19349663 ^ c * 83492791;
    P.forEach((p, i) => { const k = K(Math.floor(p.x / dm), Math.floor(p.y / dm), Math.floor(p.z / dm)); (cell.get(k) || cell.set(k, []).get(k)).push(i); });
    const E = [], seen = new Set(), adj = P.map(() => []);
    P.forEach((a, i) => {
      const ax = Math.floor(a.x / dm), ay = Math.floor(a.y / dm), az = Math.floor(a.z / dm), d = [];
      for (let u = -1; u <= 1; u++) for (let v = -1; v <= 1; v++) for (let w = -1; w <= 1; w++) (cell.get(K(ax + u, ay + v, az + w)) || []).forEach(j => {
        if (j === i) return; const b = P[j]; if (a.part !== b.part || a.h !== b.h || a.rg !== b.rg) return;
        const q = (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2; if (q < dm * dm) d.push([q, j]);
      });
      d.sort((u, v) => u[0] - v[0]);
      d.slice(0, 4).forEach(([, j]) => { const key = i < j ? i * n + j : j * n + i; if (seen.has(key)) return; seen.add(key); adj[i].push(E.length); adj[j].push(E.length); E.push([i, j]); });
    });
    const pulses = []; for (let i = 0; i < Math.max(14, Math.round(n / 70)); i++) pulses.push({ e: Math.floor(rnd() * E.length), f: rnd(), dir: rnd() < .5 ? 1 : -1, sp: .8 + rnd() * .9 });
    return { P, E, adj, pulses, act: new Float32Array(n), X: new Float32Array(n), Y: new Float32Array(n), Z: new Float32Array(n), F: new Float32Array(n), lt: null };
  };

  window.drawBrain = function (ctx, B, cx, cy, sc, yaw, tilt, t, am) {
    const dt = B.lt == null ? 0 : Math.min(.1, Math.max(0, t - B.lt)); B.lt = t;
    const cY = Math.cos(yaw), sY = Math.sin(yaw), cX = Math.cos(tilt), sX = Math.sin(tilt), P = B.P, n = P.length, { X, Y, Z, F, act } = B;
    const scan = Math.sin(t * .55) * 1.05;
    for (let i = 0; i < n; i++) {
      const p = P[i], x1 = p.x * cY - p.z * sY, z1 = p.x * sY + p.z * cY, y1 = p.y * cX - z1 * sX, z2 = p.y * sX + z1 * cX, k = 3.2 / (3.2 + z2);
      X[i] = cx + x1 * sc * k; Y[i] = cy - y1 * sc * k; Z[i] = k;
      F[i] = -(p.ny * sX + (p.nx * sY + p.nz * cY) * cX);   // 1 = mira al observador
    }
    ctx.save(); ctx.globalAlpha = am;
    const halo = ctx.createRadialGradient(cx, cy, sc * .1, cx, cy, sc * 1.12);
    halo.addColorStop(0, 'rgba(99,102,241,.13)'); halo.addColorStop(.65, 'rgba(34,211,238,.04)'); halo.addColorStop(1, 'rgba(34,211,238,0)');
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(cx, cy, sc * 1.12, 0, 6.2832); ctx.fill();
    ctx.globalCompositeOperation = 'lighter';
    const vis = i => { const f = F[i], g = P[i].g, b = f > 0 ? .13 + .34 * f * g + .62 * (1 - f) ** 3 : .035, s = Math.exp(-(((P[i].z - scan) / .055) ** 2)); return clamp(b * (.35 + .65 * g) + .6 * s * (f > 0 ? 1 : .15) + act[i] * .8, 0, 1); };
    ctx.lineWidth = Math.max(.55, sc / 300); ctx.lineCap = 'round';
    const bk = new Map();
    B.E.forEach(([a, b]) => { const v = (vis(a) + vis(b)) / 2; if (v < .05) return; const key = P[a].c * 8 + Math.min(7, v * 8 | 0); let l = bk.get(key); if (!l) bk.set(key, l = []); l.push(a, b); });
    bk.forEach((l, key) => { ctx.strokeStyle = `rgba(${PAL[key >> 3]},${((key & 7) + .6) / 8})`; ctx.beginPath(); for (let i = 0; i < l.length; i += 2) { ctx.moveTo(X[l[i]], Y[l[i]]); ctx.lineTo(X[l[i + 1]], Y[l[i + 1]]); } ctx.stroke(); });
    const dec = Math.exp(-3 * dt), bp = new Map();
    for (let i = 0; i < n; i++) { const v = vis(i); act[i] *= dec; if (v < .1) continue; const key = P[i].c * 8 + Math.min(7, v * 8 | 0); let l = bp.get(key); if (!l) bp.set(key, l = []); l.push(i); }
    bp.forEach((l, key) => { ctx.fillStyle = `rgba(${PAL[key >> 3]},${((key & 7) + .6) / 8})`; ctx.beginPath(); l.forEach(i => { const r = Math.max(.6, (.0042 + act[i] * .012) * sc * Z[i]); ctx.moveTo(X[i] + r, Y[i]); ctx.arc(X[i], Y[i], r, 0, 6.2832); }); ctx.fill(); });
    ctx.shadowColor = '#a5f3fc'; ctx.shadowBlur = Math.max(4, sc / 22); ctx.fillStyle = 'rgba(255,255,255,.95)';
    B.pulses.forEach(pl => {
      pl.f += pl.dir * pl.sp * dt * 3.4;
      if (pl.f >= 1 || pl.f <= 0) { const node = pl.f >= 1 ? B.E[pl.e][1] : B.E[pl.e][0]; act[node] = 1; const L = B.adj[node]; let e2 = L[Math.floor(Math.random() * L.length)]; if (L.length > 1 && e2 === pl.e) e2 = L[(L.indexOf(e2) + 1) % L.length]; pl.e = e2; if (B.E[e2][0] === node) { pl.f = 0; pl.dir = 1; } else { pl.f = 1; pl.dir = -1; } }
      const [a, b] = B.E[pl.e]; if (F[a] < -.1) return; ctx.beginPath(); ctx.arc(X[a] + (X[b] - X[a]) * pl.f, Y[a] + (Y[b] - Y[a]) * pl.f, Math.max(1, .008 * sc * Z[a]), 0, 6.2832); ctx.fill();
    });
    ctx.restore();
  };
})();
