/* motion.js — (1) colour a muscle's origin (green) and insertion (blue) on the 3D model,
   (2) movement view for shoulder / elbow / hip / knee: the bones rotate about the joint, the muscle's end follows, its belly stays on the body.
   Approximate: ends and joint centre are derived from the meshes themselves, not from hand-made attachment data.
   Self-contained (own styles, no changes to features.js). Needs the spot + animation uniforms in gl.js. */
'use strict';
if (!window.__motionLoaded) (() => {
  window.__motionLoaded = 1;
  const { S, P, $, esc } = A;
  const X = () => window.__anat || {};
  const ar = () => S.lang === 'ar';
  const T = (en, a) => (ar() ? a : en);
  S.att = false; S.mov = null;
  const swapped = new Set();

  const css = document.createElement('style');
  css.textContent = `
#movbar{position:absolute;left:50%;transform:translateX(-50%);top:112px;z-index:30;display:flex;flex-direction:column;align-items:center;gap:6px;padding:8px 14px;border-radius:16px;background:var(--surface);border:1px solid var(--line);box-shadow:0 6px 24px rgba(0,0,0,.35);max-width:calc(100vw - 24px)}
#movbar .mvt{font-weight:700;font-size:13px;text-align:center}#movbar .mvr{display:flex;align-items:center;gap:10px}
#movbar button{border:0;background:var(--surface2);color:inherit;width:34px;height:34px;border-radius:50%;font-size:15px;cursor:pointer}
#movbar input{width:150px;direction:ltr}#movbar b{min-width:42px;text-align:center;font-variant-numeric:tabular-nums}
.legend2 div{display:flex;gap:8px;align-items:flex-start;margin:4px 0;font-size:13px}.legend2 i{flex:none;width:12px;height:12px;border-radius:50%;margin-top:4px}`;
  document.head.appendChild(css);

  /* ───────────── vector helpers + mesh access ───────────── */
  const vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const vlen = (a) => Math.hypot(a[0], a[1], a[2]), vnorm = (a) => { const l = vlen(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const vadd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], vmul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const vworld = (it, step) => { const p = it.vpos, n = p.length / 3, out = [], k = Math.max(1, Math.floor(n / step)); for (let i = 0; i < n; i += k) out.push([it.lo[0] + p[i * 3] / 65535 * it.span[0], it.lo[1] + p[i * 3 + 1] / 65535 * it.span[1], it.lo[2] + p[i * 3 + 2] / 65535 * it.span[2]]); return out; };
  const bverts = (q) => { const it = X().itemOf[q.i]; if (!it._bv) it._bv = vworld(it, 220); return it._bv; };
  const mind = (V, p) => { let m = 9; for (const v of V) { const d = vlen(vsub(v, p)); if (d < m) m = d; } return m; };
  const rotM = (k, th) => { const c = Math.cos(th), s = Math.sin(th), t = 1 - c, [x, y, z] = k;
    return new Float32Array([t * x * x + c, t * x * y + s * z, t * x * z - s * y, t * x * y - s * z, t * y * y + c, t * y * z + s * x, t * x * z + s * y, t * y * z - s * x, t * z * z + c]); };
  const sideOf = (q) => Math.sign(q.c[0]) || 1;
  const groupItems = (e) => P.filter((q) => q.sys === 'muscle' && q.grp === e.grp && sideOf(q) === sideOf(e) && X().itemOf[q.i] && X().itemOf[q.i].visible);

  /* ends of a muscle = the two caps along its main axis (PCA of the mesh) */
  function endsOf(q) {
    const it = X().itemOf[q.i]; if (!it || !it.vpos) return null;
    if (!it._ends) {
      const V = vworld(it, 2000), n = V.length; if (n < 8) return null;
      const m = [0, 0, 0]; V.forEach((v) => { m[0] += v[0]; m[1] += v[1]; m[2] += v[2]; }); m[0] /= n; m[1] /= n; m[2] /= n;
      let ax = vnorm([0.3, 1, 0.2]);
      for (let k = 0; k < 14; k++) { const nx = [0, 0, 0]; V.forEach((v) => { const d = vsub(v, m), pr = vdot(d, ax); nx[0] += d[0] * pr; nx[1] += d[1] * pr; nx[2] += d[2] * pr; }); ax = vnorm(nx); }
      const pr = V.map((v) => vdot(vsub(v, m), ax)), lo = Math.min(...pr), hi = Math.max(...pr), L = hi - lo || 0.01;
      const cen = (test) => { const c = [0, 0, 0]; let z = 0; V.forEach((v, i) => { if (test(pr[i])) { c[0] += v[0]; c[1] += v[1]; c[2] += v[2]; z++; } }); return z ? vmul(c, 1 / z) : m; };
      it._ends = { a: cen((t) => t <= lo + L * 0.16), b: cen((t) => t >= hi - L * 0.16), len: L };
    }
    const E = it._ends, o = it.offset; let org = vadd(E.a, o), ins = vadd(E.b, o);
    const REF = [0, q.c[1] >= 1.05 ? 1.35 : 0.95, 0.02];   // origin = the end nearer the trunk
    if (vlen(vsub(ins, REF)) < vlen(vsub(org, REF))) { const t = org; org = ins; ins = t; }
    if (swapped.has(q.i)) { const t = org; org = ins; ins = t; }
    return { org, ins, len: E.len };
  }

  /* ───────────── 1. origin (green) / insertion (blue) on the model ───────────── */
  const ORG = [0.16, 0.82, 0.36], INS = [0.2, 0.5, 1.0];
  const sig = () => (S.att && S.sel >= 0 && P[S.sel] && P[S.sel].k === 'muscle' ? S.sel : -1) + '|' + [...swapped].join(',');
  let lastSig = '';
  function syncSpots() {
    const R = X().R || A.R; if (!R || !R.nsp || !X().itemOf) return;
    const am = S.att && S.sel >= 0 && P[S.sel] && P[S.sel].k === 'muscle' ? P[S.sel] : null, s = sig();
    const mine = am ? groupItems(am).map((q) => X().itemOf[q.i]) : [];
    const ok = am && mine.length && mine.every((it) => it.spots && it.spots._att === s);
    if (s === lastSig && (ok || !am)) return;
    if (lastSig && !ok) R.items.forEach((it) => { if (it.spots && it.spots._att) it.spots = null; });
    lastSig = s; if (!am) { A.redraw(); return; }
    groupItems(am).forEach((q) => {
      const E = endsOf(q), it = X().itemOf[q.i]; if (!E) return;
      const r = Math.max(0.018, E.len * 0.3), pos = new Float32Array(R.nsp * 4), col = new Float32Array(R.nsp * 3);
      pos.set([...E.org, r], 0); pos.set([...E.ins, r], 4); col.set(ORG, 0); col.set(INS, 3);
      it.spots = { n: 2, pos, col, _att: s };
    });
    A.redraw();
  }
  A.acts.att = () => {
    S.att = !S.att; lastSig = '';
    if (S.att && !(S.sel >= 0 && P[S.sel].k === 'muscle')) A.toast(T('Select a muscle to see its origin (green) and insertion (blue)', 'اختار عضلة عشان تشوف بدايتها (أخضر) ونهايتها (أزرق)'), 4200);
    if (S.att && S.layers.muscle === 'off') { S.layers.muscle = 'on'; A.ensure('muscle').then(() => A.apply()); }
    if (A.renderChips) A.renderChips(); if (S.sel >= 0 && A.renderPanel) A.renderPanel(); A.redraw();
  };
  A.acts.attswap = () => { if (S.sel < 0) return; groupItems(P[S.sel]).forEach((q) => { if (swapped.has(q.i)) swapped.delete(q.i); else swapped.add(q.i); }); lastSig = ''; if (S.mov) A.acts.movend(); A.redraw(); };

  /* ───────────── 2. movement view ───────────── */
  const MOVECFG = {   // j = joint, ax = rotation axis (x = left–right, z = front–back), s = sign for x-axis moves, a = [from, to] degrees (signed); "to" is where the muscle is shortest
    shoulder_flex: { j: 'shoulder', ax: 'x', s: -1, a: [0, 110] }, shoulder_ext: { j: 'shoulder', ax: 'x', s: -1, a: [0, -45] },
    shoulder_abd: { j: 'shoulder', ax: 'z', a: [0, 110] }, shoulder_add: { j: 'shoulder', ax: 'z', a: [70, 0] },
    elbow_flex: { j: 'elbow', ax: 'x', s: -1, a: [0, 120] }, elbow_ext: { j: 'elbow', ax: 'x', s: -1, a: [100, 0] },
    hip_flex: { j: 'hip', ax: 'x', s: -1, a: [0, 90] }, hip_ext: { j: 'hip', ax: 'x', s: -1, a: [0, -20] },
    hip_abd: { j: 'hip', ax: 'z', a: [0, 40] }, hip_add: { j: 'hip', ax: 'z', a: [35, 0] },
    knee_flex: { j: 'knee', ax: 'x', s: 1, a: [0, 120] }, knee_ext: { j: 'knee', ax: 'x', s: 1, a: [100, 0] },
  };
  const JOINT = {
    shoulder: { prox: /scapula/i, mv: (q) => q.reg === 'upper' && !/scapula|clavicle/i.test(q.en), dist: 1.5 },
    elbow: { prox: /humerus/i, mv: (q) => q.reg === 'upper' && !/scapula|clavicle|humerus/i.test(q.en), dist: 1.1 },
    hip: { prox: /hip bone/i, mv: (q) => q.reg === 'lower', dist: 2.3 },
    knee: { prox: /femur/i, mv: (q) => q.reg === 'lower' && !/femur/i.test(q.en), dist: 1.8 },
  };
  const REACH = 0.55;   // only the part of the muscle beyond this fraction (towards the insertion) follows the moving bone; the belly stays anchored to the body
  let movRaf = 0;
  function stopMove() { if (movRaf) cancelAnimationFrame(movRaf); movRaf = 0; X().R.items.forEach((it) => { it.anim = null; }); S.mov = null; const b = $('movbar'); if (b) b.remove(); A.redraw(); }
  function applyMove(k) {
    const M = S.mov; if (!M) return; const a = M.a0 + (M.a1 - M.a0) * k;
    const phi = (M.cfg.ax === 'x' ? M.cfg.s : M.side < 0 ? -1 : 1) * a * Math.PI / 180, m = rotM(M.ax, phi);
    M.bones.forEach((i) => { const it = X().itemOf[i]; if (it) it.anim = { mode: 1, rot: m, piv: M.piv, a: [0, 0, 0], dl: [0, 0, 1, 1] }; });
    M.muscles.forEach((r) => {
      const it = X().itemOf[r.q.i]; if (!it) return; const d = vsub(r.ins, r.org);
      it.anim = r.rigid ? { mode: 1, rot: m, piv: M.piv, a: [0, 0, 0], dl: [0, 0, 1, 1] } : { mode: 2, k: REACH, rot: m, piv: M.piv, a: r.org, dl: [...vnorm(d), Math.max(0.01, vlen(d))] };
      const s = M.agonist ? 1 - k : k;   // the muscle that performs the movement is shortest (red) at the end of the range, stretched (pale) at the start; antagonists the opposite
      it.tint = [1, 0.22 + 0.62 * s, 0.22 + 0.6 * s, 0.12 + 0.6 * s];
    });
    M.th = k; const rd = $('movdeg'); if (rd) rd.textContent = Math.abs(Math.round(a)) + '°';
    const sl = $('movsl'); if (sl && document.activeElement !== sl) sl.value = Math.round(k * 100);
    A.redraw();
  }
  async function startMove(mvId) {
    const e = P[S.sel]; if (!e || e.k !== 'muscle') return;
    const cfg = MOVECFG[mvId], mvo = (window.MOVES || []).find((x) => x.id === mvId);
    if (!cfg) { A.toast(T('This movement is not available in the animation yet', 'الحركة دي لسه مش متاحة في الأنيميشن'), 3200); return; }
    if (S.mov) stopMove();
    A.toast(T('Preparing the movement…', 'بجهّز الحركة…'), 1400);
    for (const k of ['bone', 'muscle']) { if (S.layers[k] === 'off') S.layers[k] = 'on'; await A.ensure(k); }
    S.explode = 0; S.hidden.delete(e.i); A.apply(); await new Promise((r) => setTimeout(r, 60));
    const J = JOINT[cfg.j], side = sideOf(e), bones = P.filter((q) => q.k === 'bone' && X().itemOf[q.i] && X().itemOf[q.i].vpos && sideOf(q) === side);
    const prox = bones.filter((q) => J.prox.test(q.en)), moving = bones.filter(J.mv);
    if (!prox.length || !moving.length) { A.toast(T('Could not set up this joint', 'مش قادر أجهّز المفصل ده'), 3200); return; }
    const pv = prox.flatMap(bverts); let best = null;   // joint centre = midpoint of the closest pair of surface points between the proximal bone and the moving bones
    moving.filter((q) => !/patella/i.test(q.en)).forEach((q) => { const V = bverts(q); let m = 9, pa = null, pb = null; V.forEach((a) => { for (const b of pv) { const d = vlen(vsub(a, b)); if (d < m) { m = d; pa = a; pb = b; } } }); if (pa && (!best || m < best.m)) best = { m, p: vmul(vadd(pa, pb), 0.5) }; });
    if (!best) { A.toast(T('Could not find the joint', 'ملقيتش المفصل'), 3200); return; }
    const piv = best.p, dm = (p) => Math.min(...moving.map((b) => mind(bverts(b), p)));
    const mus = groupItems(e).map((q) => {
      const E = endsOf(q); if (!E) return null; let { org, ins } = E;
      if (dm(org) < dm(ins)) { const t = org; org = ins; ins = t; }   // the insertion is the end that lies on the moving bones
      return { q, org, ins, rigid: dm(org) < 0.03 };
    }).filter(Boolean);
    if (!mus.length) { A.toast(T('Cannot animate this muscle', 'مش قادر أحرّك العضلة دي'), 3000); return; }
    S.focus = new Set([...mus.map((r) => r.q.i), ...prox.map((q) => q.i), ...moving.map((q) => q.i)]); S.att = true; lastSig = '';
    S.mov = { id: mvId, cfg, ax: cfg.ax === 'x' ? [1, 0, 0] : [0, 0, 1], piv, side, a0: cfg.a[0], a1: cfg.a[1], bones: moving.map((q) => q.i), muscles: mus, th: 0, t0: performance.now(),
      play: true, agonist: ((mvo && mvo.m) || []).some((n) => (e.grp || '').toLowerCase().includes(n)) };
    A.apply(); if (A.renderChips) A.renderChips();
    const post = e.c[2] < 0.0; X().cam.flyTo(piv, J.dist, post ? Math.PI + (side < 0 ? 0.4 : -0.4) : (side < 0 ? -0.4 : 0.4), 0.12);   // look at the side of the body the muscle is on
    $('app').classList.remove('psel'); $('panel').classList.add('closed'); $('panel').classList.remove('peek');
    const bar = document.createElement('div'); bar.id = 'movbar';
    bar.innerHTML = `<div class="mvt">${esc(mvo ? T(mvo.en, mvo.ar) : '')}</div><div class="mvr"><button data-act="movplay" id="movpl">⏸</button><input id="movsl" type="range" min="0" max="100" value="0"><b id="movdeg">0°</b><button data-act="movend">✕</button></div>`;
    $('app').appendChild(bar);
    $('movsl').addEventListener('input', (ev) => { S.mov.play = false; $('movpl').textContent = '▶'; applyMove(+ev.target.value / 100); });
    const tick = (now) => { if (!S.mov) return; if (S.mov.play) { const ph = ((now - S.mov.t0) / 3000) % 2, k = ph < 1 ? ph : 2 - ph; applyMove(k * k * (3 - 2 * k)); } movRaf = requestAnimationFrame(tick); };
    movRaf = requestAnimationFrame(tick);
  }
  A.acts.actmv = (el) => startMove(el.dataset.id);
  A.acts.movplay = () => { if (!S.mov) return; S.mov.play = !S.mov.play; if (S.mov.play) S.mov.t0 = performance.now() - 1500 * S.mov.th; $('movpl').textContent = S.mov.play ? '⏸' : '▶'; };
  A.acts.movend = () => { stopMove(); S.focus = null; A.apply(); if (A.renderChips) A.renderChips(); };

  /* ───────────── hooks: panel section, chip, spot sync ───────────── */
  const movesOf = (e) => (e.mv || []).map((id) => (window.MOVES || []).find((m) => m.id === id)).filter(Boolean);
  const waitFor = (fn, cb) => { const t0 = setInterval(() => { if (fn()) { clearInterval(t0); cb(); } }, 200); setTimeout(() => clearInterval(t0), 15000); };
  waitFor(() => A.panelExtra && A.extraChips && A.afterDraw, () => {
    const prevPanel = A.panelExtra, prevChips = A.extraChips, prevDraw = A.afterDraw;
    A.panelExtra = (e) => {
      let h = prevPanel(e);
      if (e.k === 'muscle' && e.mu) {
        h += `<h4>${T('Origin & insertion on the model (approximate)', 'البداية والنهاية على المجسم (تقريبي)')}</h4>
          <div class="legend2"><div><i style="background:#2ad45c"></i><b>${T('Origin', 'البداية')}</b> ${esc(T(e.mu[0], e.mu[1]) || '')}</div><div><i style="background:#4d8dff"></i><b>${T('Insertion', 'النهاية')}</b> ${esc(T(e.mu[2], e.mu[3]) || '')}</div></div>
          <div class="actions" style="margin-top:8px"><button class="act ${S.att ? 'on' : ''}" data-act="att">🟢🔵 ${T('Color origin / insertion', 'لوّن البداية والنهاية')}</button><button class="act" data-act="attswap">⇄ ${T('Swap ends', 'اعكس البداية/النهاية')}</button></div>`;
        const ms = movesOf(e);
        if (ms.length) h += `<h4>${T('See the movement on the model', 'شوف الحركة على المجسم')}</h4><div class="pills">${ms.map((m) => `<span class="pill2" data-act="actmv" data-id="${m.id}">▶ ${esc(T(m.en, m.ar))}</span>`).join('')}</div>`;
      }
      return h;
    };
    A.extraChips = () => prevChips() + `<button class="chip ${S.att ? 'active' : ''}" data-act="att">🟢🔵 ${T('Origin / Insertion', 'بداية ونهاية العضلة')}</button>`;
    A.afterDraw = () => { syncSpots(); prevDraw(); };
    if (A.renderChips) A.renderChips();
  });
  const prevLang = A.onLang; A.onLang = () => { if (prevLang) prevLang(); };
})();
