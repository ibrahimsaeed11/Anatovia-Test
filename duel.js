/* duel.js — split-screen duel for two students on ONE device: the first to tap the correct answer wins the point
   (a wrong tap gives the point to the opponent). Works fully offline, no account needed. Loaded by study.js. */
'use strict';
if (!window.__duelLoaded) (() => {
  window.__duelLoaded = 1;
  const { S, P, esc } = A;
  const ar = () => S.lang === 'ar';
  const T = (en, a) => (ar() ? a : en);
  const SEC = 20, LOCK = 1500;
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const CFG = { target: 5, n1: '', n2: '' };
  let D = null, prev = null, tmr = null;

  /* ───────── setup ───────── */
  function setup() {
    A.modal(() => `<h2>⚔️ ${T('Split-screen duel', 'تحدّي على نفس الشاشة')}</h2><p class="lead">${T('Two students, one device. Put it between you — the first to tap the correct answer takes the point. A wrong tap gives the point to your opponent!', 'اتنين طلاب وموبايل واحد. حطوه بينكم — أول واحد يضغط الإجابة الصح ياخد النقطة. والضغطة الغلط بتدّي النقطة للتاني!')}</p>` +
      `<div class="calc-pt"><input id="dn1" maxlength="14" placeholder="${T('Player 1 (bottom)', 'اللاعب 1 (تحت)')}" value="${esc(CFG.n1)}"><input id="dn2" maxlength="14" placeholder="${T('Player 2 (top)', 'اللاعب 2 (فوق)')}" value="${esc(CFG.n2)}"></div>` +
      `<div class="lab">${T('First to', 'أول واحد يوصل لـ')}</div><div class="row">` + [3, 5, 10].map((n) => `<button class="opt ${CFG.target === n ? 'sel' : ''}" data-act="dltarget" data-n="${n}">${n}</button>`).join('') + '</div>' +
      `<button class="btn primary wide" style="margin-top:12px" data-act="dlstart">⚔️ ${T('Start', 'ابدأ')}</button><p class="tiny">${T('Tip: a tablet or a large phone works best.', 'نصيحة: التابلت أو الموبايل الكبير أحسن.')}</p>`);
  }
  const grab = () => { const a = document.getElementById('dn1'), b = document.getElementById('dn2'); if (a) CFG.n1 = a.value.trim(); if (b) CFG.n2 = b.value.trim(); };
  A.acts.dltarget = (el) => { grab(); CFG.target = +el.dataset.n; setup(); };
  A.acts.dlstart = () => { grab(); A.closeModal(); start(); };
  A.hubExtra = A.hubExtra || {}; A.hubExtra.duel = setup;

  /* ───────── questions ───────── */
  const used = new Set();
  function modelQ() {
    const rl = (A.quizApi && A.quizApi.repList) || [], prem = A.isPremium();
    const pool = rl.filter((e) => (!e.lk || prem) && (e.sys === 'bone' || e.sys === 'muscle' || prem) && e.r >= 0.02 && e.k !== 'tendon' && !used.has(e.baseEn));
    if (pool.length < 8) return null;
    const e = pool[Math.floor(Math.random() * pool.length)]; used.add(e.baseEn);
    const same = rl.filter((x) => x.sys === e.sys && x.baseEn !== e.baseEn && (!x.lk || prem));
    const near = same.filter((x) => x.k === e.k && x.reg === e.reg), pick = shuffle(near).slice(0, 3);
    if (pick.length < 3) pick.push(...shuffle(same.filter((x) => !pick.includes(x))).slice(0, 3 - pick.length));
    if (pick.length < 3) return null;
    const opts = shuffle([e, ...pick]);
    return { t: 'm', e, opts: opts.map((x) => A.base1(x)), c: opts.indexOf(e) };
  }
  function textQ() {
    const B = A.qBank ? A.qBank() : []; if (!B.length) return null;
    for (let tries = 0; tries < 30; tries++) {
      const i = Math.floor(Math.random() * B.length), it = B[i], key = 'T' + i; if (used.has(key)) continue;
      const same = B.filter((x, k) => k !== i && x.pool === it.pool && x.a[0] !== it.a[0]), seen = new Set([it.a[0]]), wr = [];
      for (const x of shuffle(same)) { if (wr.length >= 3) break; if (seen.has(x.a[0])) continue; seen.add(x.a[0]); wr.push(x); }
      if (wr.length < 3) continue;
      used.add(key); const all = shuffle([it, ...wr]), L = (x) => (ar() ? x.a[1] : x.a[0]);
      return { t: 't', q: ar() ? it.q[1] : it.q[0], opts: all.map(L), c: all.indexOf(it) };
    }
    return null;
  }
  const nextQ = (k) => (k % 2 === 0 ? modelQ() || textQ() : textQ() || modelQ());

  /* ───────── game ───────── */
  function start() {
    used.clear();
    D = { sc: [0, 0], names: [CFG.n1 || T('Player 1', 'اللاعب 1'), CFG.n2 || T('Player 2', 'اللاعب 2')], k: 0, q: null, locked: false, over: false, rounds: 0 };
    prev = { layers: { ...S.layers }, region: S.region, iso: S.iso, hl: S.hl, sel: S.sel, hidden: new Set(S.hidden), explode: S.explode, focus: S.focus };
    S.explode = 0; S.hidden = new Set(); S.focus = null; S.region = null; S.sel = -1; A.deselect && A.deselect();
    document.getElementById('app').classList.add('quiz');
    let el = document.getElementById('duel'); if (el) el.remove();
    el = document.createElement('div'); el.id = 'duel'; el.dir = ar() ? 'rtl' : 'ltr'; document.body.appendChild(el);
    el.addEventListener('pointerdown', onTap);
    round();
  }
  async function round() {
    clearInterval(tmr); const q = nextQ(D.k++); if (!q) return finish(true);
    D.q = q; D.locked = false; D.rounds++; D.res = null; D.t0 = Date.now(); D.left = SEC;
    if (q.t === 'm') {
      const e = q.e; for (const s of SYSTEMS) S.layers[s] = s === e.sys ? 'on' : 'off';
      S.iso = e.i; S.hl = new Map([[e.i, [1, 0.78, 0.18, 0.6]]]); await A.ensure(e.sys); A.flyToPart(e);
      if (A.cam.goal) A.cam.flyTo(A.cam.goal.target, Math.min(3.4, A.cam.goal.dist * 1.9 + 0.2), A.cam.goal.yaw, A.cam.goal.pitch);
      A.apply();
    } else { S.iso = -1; S.hl = null; for (const s of SYSTEMS) S.layers[s] = 'off'; A.apply(); }
    draw();
    tmr = setInterval(() => { if (!D || D.locked || D.over) return; D.left--; const b = document.getElementById('dbar'); if (b) b.style.width = (100 * D.left / SEC) + '%'; if (D.left <= 0) resolve(-1, -1); }, 1000);
  }
  const panel = (p) => {          // p: 0 = bottom player 1, 1 = top player 2
    const q = D.q, rot = p === 1 ? ' top' : ' bot', col = p === 1 ? 'p2' : 'p1';
    const head = `<div class="dh"><b>${esc(D.names[p])}</b><span class="dsc">${D.sc[p]}</span></div>`;
    const prompt = q.t === 'm' ? T('Which part is highlighted?', 'ما هو الجزء المضيء؟') : esc(q.q);
    const opts = q.opts.map((o, k) => { let c = ''; if (D.res) { if (k === q.c) c = 'ok'; else if (k === D.res.k && D.res.p === p) c = 'no'; } return `<button type="button" class="${c}" data-p="${p}" data-k="${k}" ${D.locked ? 'disabled' : ''}>${esc(o)}</button>`; }).join('');
    const note = D.res ? `<div class="dnote ${D.res.win === p ? 'ok' : D.res.win === -1 ? '' : 'no'}">${D.res.win === p ? '+1 ✔' : D.res.win === -1 ? T('Time!', 'انتهى الوقت!') : ''}</div>` : '';
    return `<div class="dp ${col}${rot}">${head}<div class="dq ${q.t === 't' ? 'txt' : ''}">${prompt}</div><div class="dopts">${opts}</div>${note}</div>`;
  };
  function draw() {
    const el = document.getElementById('duel'); if (!el || !D) return;
    el.innerHTML = panel(1) + `<div class="dmid ${D.q.t === 't' ? 'solid' : ''}"><div class="dbarw"><i id="dbar" style="width:${100 * D.left / SEC}%"></i></div><div class="dbot"><div class="dsum"><span>${D.sc[1]}</span><b>⚔️</b><span>${D.sc[0]}</span></div><div class="dtg">${T('First to', 'أول واحد يوصل لـ')} ${CFG.target}</div></div></div>` + panel(0) +
      `<button type="button" class="dx" data-dx="1" aria-label="exit">✕</button>`;
  }
  function onTap(ev) {
    const x = ev.target.closest('[data-dx]'); if (x) { if (confirm(T('Quit the duel?', 'تخرج من التحدي؟'))) exit(); return; }
    const g = ev.target.closest('[data-dl]'); if (g) { const a = g.dataset.dl; if (a === 'again') start(); else if (a === 'exit') exit(); else if (a === 'share') share(); return; }
    const b = ev.target.closest('.dopts button'); if (!b || !D || D.locked || D.over) return;
    ev.preventDefault(); resolve(+b.dataset.p, +b.dataset.k);
  }
  function resolve(p, k) {
    if (D.locked) return; D.locked = true; clearInterval(tmr);
    let win = -1;
    if (p >= 0) win = k === D.q.c ? p : 1 - p;
    if (win >= 0) D.sc[win]++;
    D.res = { p, k, win }; try { navigator.vibrate && navigator.vibrate(win >= 0 ? 25 : 60); } catch (e) { /* ignore */ }
    draw();
    if (D.sc[0] >= CFG.target || D.sc[1] >= CFG.target) return setTimeout(() => finish(false), LOCK);
    setTimeout(() => { if (D && !D.over) round(); }, LOCK);
  }
  function finish(noMore) {
    clearInterval(tmr); if (!D) return; D.over = true;
    const el = document.getElementById('duel'); if (!el) return;
    const w = D.sc[0] > D.sc[1] ? 0 : D.sc[1] > D.sc[0] ? 1 : -1; D.w = w;
    const side = (p, rot) => `<div class="dp res ${rot} ${w === p ? 'win' : w === -1 ? '' : 'lose'}"><div class="dbig">${w === p ? '🏆' : w === -1 ? '🤝' : '💪'}</div><b>${esc(D.names[p])}</b><div class="dtxt">${w === p ? T('You win!', 'فزت!') : w === -1 ? T('Draw!', 'تعادل!') : T('Next time!', 'المرة الجاية!')}</div></div>`;
    el.innerHTML = side(1, 'top') + `<div class="dmid solid"><div class="dsum big"><span>${D.sc[1]}</span><b>:</b><span>${D.sc[0]}</span></div><div class="row"><button class="btn primary" data-dl="again">🔁 ${T('Again', 'العب تاني')}</button><button class="btn" data-dl="share">📸 ${T('Share', 'شارك')}</button><button class="btn" data-dl="exit">${T('Exit', 'خروج')}</button></div></div>` + side(0, 'bot');
  }
  function exit() {
    clearInterval(tmr); D = null; const el = document.getElementById('duel'); if (el) el.remove();
    document.getElementById('app').classList.remove('quiz');
    if (prev) { Object.assign(S.layers, prev.layers); S.region = prev.region; S.iso = -1; S.hl = null; S.hidden = prev.hidden; S.explode = prev.explode; S.focus = prev.focus; prev = null; }
    A.apply(); A.cam.reset(); if (A.redraw) A.redraw();
  }

  /* ───────── share card ───────── */
  async function share() {
    const W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d'), FAM = 'system-ui,-apple-system,"Segoe UI",Tahoma,"Noto Naskh Arabic",Arial,sans-serif';
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2a3a8c'); g.addColorStop(1, '#0f1636'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    const tx = (s, px, py, size, col, b) => { x.font = `${b ? 700 : 500} ${size}px ${FAM}`; x.fillStyle = col; x.textAlign = 'center'; x.textBaseline = 'middle'; x.direction = /[؀-ۿ]/.test(s) ? 'rtl' : 'ltr'; x.fillText(s, px, py, W - 120); };
    tx('Anatovia', W / 2, 130, 84, '#fff', 1); tx(T('Anatomy duel ⚔️', 'تحدّي التشريح ⚔️'), W / 2, 215, 50, '#b9c4ff');
    tx(D.names[1], W / 2 - 270, 520, 56, D.w === 1 ? '#ffc84a' : '#fff', 1); tx(D.names[0], W / 2 + 270, 520, 56, D.w === 0 ? '#ffc84a' : '#fff', 1);
    tx(String(D.sc[1]), W / 2 - 270, 700, 220, D.w === 1 ? '#46d68a' : '#fff', 1); tx(String(D.sc[0]), W / 2 + 270, 700, 220, D.w === 0 ? '#46d68a' : '#fff', 1); tx(':', W / 2, 690, 150, '#b9c4ff', 1);
    tx(D.w === -1 ? T('Draw 🤝', 'تعادل 🤝') : T(`${D.names[D.w]} wins 🏆`, `${D.names[D.w]} فاز 🏆`), W / 2, 960, 66, '#fff', 1);
    tx(T('Dare to beat us?', 'تقدر تغلبنا؟'), W / 2, 1060, 44, '#b9c4ff');
    x.fillStyle = 'rgba(255,255,255,.1)'; x.fillRect(0, H - 130, W, 130); tx('ibrahimsaeed11.github.io/Anatovia', W / 2, H - 65, 40, '#fff', 1);
    const blob = await new Promise((r) => cv.toBlob(r, 'image/jpeg', 0.9)); if (!blob) return;
    const text = T('Anatomy duel on Anatovia ⚔️', 'تحدّي تشريح على Anatovia ⚔️') + '\n‎https://ibrahimsaeed11.github.io/Anatovia/';
    A.fileOut(blob, 'anatovia-duel.jpg', 'image/jpeg', { text, head: T('⚔️ Duel card', '⚔️ كارت التحدي') });
  }
})();
