/* extras.js — study extras that need no server:
   1. "Hide the names" guessing mode on the 3D model   2. drawing on top of the model (export PNG)
   3. mnemonics (memory aids)                          4. read-aloud explanation
   5. study statistics (time per day, weakest systems, most-missed structures).
   Self-contained: injected from study.js, own styles, no changes to the core files. */
'use strict';
if (!window.__extrasLoaded) (() => {
  window.__extrasLoaded = 1;
  const { S, P, $, esc } = A;
  const ar = () => S.lang === 'ar';
  const T = (en, a) => (ar() ? a : en);
  const SYS = ['bone', 'muscle', 'vessel', 'nerve', 'brain', 'organ', 'ligament'];
  const sysName = (s) => (STR[s] ? STR[s][S.lang] : s);
  const dayNo = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 6e4) / 864e5);
  const INTERVALS = [0, 1, 2, 4, 8, 16, 32];
  const repKey = (e) => e.sys + '|' + e.k + '|' + e.baseEn;
  const reps = new Map();
  for (const e of P) { const k = repKey(e), cur = reps.get(k); if (!cur) reps.set(k, e); else if (e.side === 'r' && cur.side !== 'r') reps.set(k, e); }
  const repOf = (e) => reps.get(repKey(e)) || e;
  const nm = (e) => (ar() ? e.baseAr || e.ar : e.baseEn || e.en);

  Object.assign(STR, {
    mnem: { en: 'Memory aids', ar: 'قصص الحفظ' }, mnemSub: { en: 'Short mnemonics for the hard lists', ar: 'جُمل تساعدك تحفظ القوايم الصعبة' },
    stats: { en: 'My study stats', ar: 'إحصائيات المذاكرة' }, statsSub: { en: 'Time, weak systems, most-missed parts', ar: 'وقتك، أضعف الأنظمة، وأكتر حاجة بتنساها' },
  });
  const css = document.createElement('style');
  css.textContent = `
#covx{position:absolute;left:50%;transform:translateX(-50%);bottom:max(14px,env(safe-area-inset-bottom));z-index:36;width:min(440px,calc(100vw - 20px));padding:14px;border-radius:18px;background:var(--surface);border:1px solid var(--line);box-shadow:0 10px 36px rgba(0,0,0,.4);display:flex;flex-direction:column;gap:10px;text-align:center}
#covx .ct{font-weight:800;font-size:17px}#covx .cs{opacity:.75;font-size:13px}#covx .cn{font-size:22px;font-weight:800}#covx .ce{opacity:.8;font-size:14px}
#covx .cr{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}#covx .cr button{flex:1;min-width:92px;padding:10px 8px;border-radius:12px;border:1px solid var(--line);background:var(--surface2);color:inherit;font:inherit;cursor:pointer}
#covx .cr .ok{background:#2f9e44;color:#fff;border-color:transparent}#covx .cr .no{background:#e03131;color:#fff;border-color:transparent}
#covx .cc{font-size:12px;opacity:.7}
#drw{position:absolute;inset:0;z-index:33;touch-action:none;cursor:crosshair}#drw.mv{pointer-events:none}
#panel .rate-row,.rate-row{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:8px 0 2px;font-size:13px;opacity:.95}.rate-row .chip{height:30px;padding:0 10px;font-size:12.5px}.rate-row .chip.on{background:var(--accent);color:#fff;border-color:var(--accent)}
#drwfab{position:absolute;left:0;top:0;touch-action:none;z-index:35;width:50px;height:50px;border-radius:50%;border:2px solid var(--accent);background:var(--surface);color:inherit;font-size:22px;box-shadow:0 6px 20px rgba(0,0,0,.4);cursor:pointer;padding:0}#drwfab.on{background:var(--accent);color:#fff}
#drwbar{position:absolute;left:0;top:0;z-index:34;width:min(252px,calc(100vw - 24px));display:flex;flex-wrap:wrap;gap:6px;justify-content:center;align-items:center;padding:8px 10px;border-radius:16px;background:var(--surface);border:1px solid var(--line);box-shadow:0 6px 24px rgba(0,0,0,.35);max-width:calc(100vw - 20px)}
#drwbar button{border:2px solid transparent;background:var(--surface2);color:inherit;min-width:34px;height:34px;border-radius:10px;font-size:15px;cursor:pointer;padding:0 8px}
#drwtxtwrap{position:absolute;inset:0;z-index:36;pointer-events:none}#drwtxtwrap .tb{position:absolute;left:0;top:0;display:flex;flex-direction:column;gap:5px;align-items:center;padding:5px 6px;border-radius:12px;background:var(--surface);border:1px solid var(--line);box-shadow:0 6px 20px rgba(0,0,0,.4);pointer-events:auto;max-width:calc(100vw - 16px)}#drwtxtwrap .tb .r{display:flex;gap:4px;align-items:center;justify-content:center}#drwtxtwrap .tb button{border:2px solid transparent;background:var(--surface2);color:inherit;min-width:30px;height:30px;border-radius:9px;font-size:13px;font-weight:700;padding:0 7px;cursor:pointer}#drwtxtwrap .tb .sw{width:22px;min-width:22px;height:22px;border-radius:50%;padding:0;border:1.5px solid rgba(255,255,255,.5)}#drwtxtwrap textarea{pointer-events:auto;box-sizing:border-box;background:rgba(15,23,42,.55);border:1.5px dashed;border-radius:8px;padding:4px 8px;outline:none;resize:none;overflow:auto}
#drwbar button.on{border-color:var(--accent)}#drwbar .sw{width:26px;min-width:26px;height:26px;border-radius:50%;padding:0}
.mn-card{border:1px solid var(--line);background:var(--surface2);border-radius:14px;padding:12px;margin:10px 0}.mn-card b{display:block;margin-bottom:6px}
.mn-q{font-size:17px;font-weight:800;line-height:1.5;direction:ltr;text-align:left;color:var(--accent)}.mn-ex{font-size:13px;opacity:.85;margin-top:6px;line-height:1.7}
.st-bars{display:flex;align-items:flex-end;gap:6px;height:110px;margin:10px 0 4px}.st-bars div{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;font-size:11px}
.st-bars i{display:block;width:100%;border-radius:6px 6px 0 0;background:var(--accent);min-height:2px}.st-row{display:flex;align-items:center;gap:8px;margin:7px 0;font-size:13px}.st-row .bar{flex:1;height:9px;border-radius:9px;background:var(--surface2);overflow:hidden}.st-row .bar i{display:block;height:100%;background:var(--accent)}
.st-big{display:flex;gap:8px}.st-big div{flex:1;background:var(--surface2);border-radius:12px;padding:10px;text-align:center}.st-big b{display:block;font-size:20px}
`;
  document.head.appendChild(css);

  /* ───────────────────────── 1. hide the names (guess mode) ───────────────────────── */
  S.cover = false;
  const CV = { ok: 0, no: 0, idx: -1, shown: false };
  const hlSet = (i) => { S.hl = i >= 0 ? new Map([[i, [1, 0.78, 0.18, 0.85]]]) : null; A.apply(); };
  function covCard() {
    let c = $('covx'); if (!S.cover) { if (c) c.remove(); return; }
    if (!c) { c = document.createElement('div'); c.id = 'covx'; $('app').appendChild(c); }
    const e = CV.idx >= 0 ? P[CV.idx] : null, cnt = `<div class="cc">✅ ${CV.ok} &nbsp; ❌ ${CV.no}</div>`;
    if (!e) c.innerHTML = `<div class="ct">🙈 ${T('Guess the names', 'خمّن الأسامي')}</div><div class="cs">${T('Tap any part of the model and say its name in your head, then reveal it.', 'اضغط على أي جزء في المجسم وقول اسمه في دماغك، وبعدين اكشفه.')}</div>${cnt}<div class="cr"><button data-act="covend">✕ ${T('Finish', 'إنهاء')}</button></div>`;
    else if (!CV.shown) c.innerHTML = `<div class="ct">❓ ${T('What is this part called?', 'ايه اسم الجزء ده؟')}</div><div class="cs">${esc(sysName(e.sys))} · ${esc(t2(e.reg))}</div><div class="cr"><button data-act="covshow">👁️ ${T('Reveal', 'اكشف الاسم')}</button><button data-act="covskip">⏭️ ${T('Skip', 'تخطي')}</button></div>${cnt}`;
    else c.innerHTML = `<div class="cn">${esc(e.ar)}</div><div class="ce">${esc(e.en)}</div><div class="cr"><button class="ok" data-act="covok">✅ ${T('I knew it', 'عرفته')}</button><button class="no" data-act="covno">❌ ${T('I did not', 'ماعرفتوش')}</button></div><div class="cr"><button data-act="covinfo">📖 ${T('Details', 'تفاصيل')}</button><button data-act="covend">✕ ${T('Finish', 'إنهاء')}</button></div>${cnt}`;
  }
  const t2 = (reg) => (STR[reg] ? STR[reg][S.lang] : reg);
  function covRate(ok) {
    const e = P[CV.idx]; if (!e) return; const s = Store.d.srs, id = repOf(e).id, cur = s[id];
    if (!ok) { s[id] = { b: 0, d: dayNo() }; CV.no++; } else { CV.ok++; if (cur) s[id] = { b: Math.min(6, cur.b + 1), d: dayNo() + INTERVALS[Math.min(6, cur.b + 1)] }; }
    Store.save(); Store.touchDay(); CV.idx = -1; CV.shown = false; hlSet(-1); covCard();
  }
  A.acts.cover = () => {
    if (S.quiz) return A.toast(T('Finish the quiz first', 'خلّص الاختبار الأول'), 2500);
    if (S.cover) return A.acts.covend();
    S.cover = true; CV.ok = CV.no = 0; CV.idx = -1; CV.shown = false;
    if (S.lm) S.lm = false; if (S.sel >= 0 && A.deselect) A.deselect();
    if (A.apply) A.apply(); covCard(); if (A.renderChips) A.renderChips(); A.redraw();
  };
  A.acts.covend = () => { S.cover = false; CV.idx = -1; hlSet(-1); covCard(); if (A.renderChips) A.renderChips(); A.redraw(); if (CV.ok + CV.no) A.toast(T(`Done: ${CV.ok} known, ${CV.no} to review`, `خلصت: ${CV.ok} عرفتهم، ${CV.no} للمراجعة`), 4000); };
  A.acts.covshow = () => { CV.shown = true; covCard(); };
  A.acts.covskip = () => { CV.idx = -1; CV.shown = false; hlSet(-1); covCard(); };
  A.acts.covok = () => covRate(true); A.acts.covno = () => covRate(false);
  A.acts.covinfo = () => { const i = CV.idx; A.acts.covend(); if (i >= 0 && A.select) A.select(i, { fly: true }); };
  function coverTap(x, y) {
    const idx = A.R.pick(A.cam, x, y); if (idx < 0) return;
    CV.idx = idx; CV.shown = false; hlSet(idx); covCard();
  }

  /* ───────────────────────── 2. drawing on the model ───────────────────────── */
  const DR = { on: false, move: false, color: '#ff4d6d', w: 4, erase: false, strokes: [], cur: null };
  const DCOL = ['#ff4d6d', '#ffd23f', '#3ddc84', '#4dabf7', '#ffffff', '#111827'];
  const FONTS = { sans: "system-ui,'Segoe UI',Tahoma,sans-serif", serif: "Georgia,'Times New Roman',Amiri,serif", hand: "'Comic Sans MS','Segoe Print','Bradley Hand',cursive", mono: "ui-monospace,Consolas,'Courier New',monospace" };
  const FNAME = { sans: ['Normal', 'عادي'], serif: ['Formal', 'رسمي'], hand: ['Hand', 'يد'], mono: ['Mono', 'ثابت'] };
  DR.fs = 22; DR.ff = 'sans';
  function wrapLines(c, text, maxW) {
    const out = [];
    for (const para of text.split('\n')) {
      let line = '';
      for (const w of para.split(' ')) {
        const test = line ? line + ' ' + w : w;
        if (!line || c.measureText(test).width <= maxW) line = test; else { out.push(line); line = w; }
        while (c.measureText(line).width > maxW && line.length > 1) { let n = line.length; while (n > 1 && c.measureText(line.slice(0, n)).width > maxW) n--; out.push(line.slice(0, n)); line = line.slice(n); }
      }
      out.push(line);
    }
    return out;
  }
  function drawText(c, s, dpr) {
    c.save(); const fs = s.fs * dpr; c.font = `700 ${fs}px ${FONTS[s.ff] || FONTS.sans}`; c.textBaseline = 'top'; c.lineJoin = 'round'; c.lineWidth = fs * 0.16;
    const dark = '#111827', light = '#ffffff'; c.strokeStyle = s.c === dark ? light : dark; c.fillStyle = s.c;
    const lines = wrapLines(c, s.t, s.w * dpr); let mw = 0;
    lines.forEach((ln, i) => {
      const rtl = /[֐-ࣿ]/.test(ln); c.direction = rtl ? 'rtl' : 'ltr'; c.textAlign = rtl ? 'right' : 'left';
      const x = (rtl ? s.x + s.w : s.x) * dpr, y = s.y * dpr + i * fs * 1.25;
      c.strokeText(ln, x, y); c.fillText(ln, x, y); mw = Math.max(mw, c.measureText(ln).width);
    });
    s.bb = [s.x, s.y, s.w, lines.length * s.fs * 1.25]; c.restore();
  }
  function hitText(q) { for (let i = DR.strokes.length - 1; i >= 0; i--) { const s = DR.strokes[i]; if (s.t !== undefined && s.bb && q[0] >= s.bb[0] - 8 && q[0] <= s.bb[0] + s.bb[2] + 8 && q[1] >= s.bb[1] - 8 && q[1] <= s.bb[1] + s.bb[3] + 8) return s; } return null; }
  function drwRedraw() {
    const cv = $('drw'); if (!cv) return; const c = cv.getContext('2d'); c.clearRect(0, 0, cv.width, cv.height);
    const dpr = cv.width / cv.clientWidth;
    for (const s of DR.strokes.concat(DR.cur ? [DR.cur] : [])) {
      if (s.t !== undefined) { if (!s.edit) drawText(c, s, dpr); continue; }
      if (!s.p.length) continue; c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = s.w * dpr;
      if (s.e) c.globalCompositeOperation = 'destination-out'; else c.strokeStyle = s.c;
      c.beginPath(); c.moveTo(s.p[0][0] * dpr, s.p[0][1] * dpr);
      for (let i = 1; i < s.p.length - 1; i++) { const m = [(s.p[i][0] + s.p[i + 1][0]) / 2, (s.p[i][1] + s.p[i + 1][1]) / 2]; c.quadraticCurveTo(s.p[i][0] * dpr, s.p[i][1] * dpr, m[0] * dpr, m[1] * dpr); }
      if (s.p.length > 1) c.lineTo(s.p[s.p.length - 1][0] * dpr, s.p[s.p.length - 1][1] * dpr); else c.lineTo(s.p[0][0] * dpr + 0.1, s.p[0][1] * dpr);
      c.stroke(); c.restore();
    }
  }
  function drwBar() {
    let b = $('drwbar'), f = $('drwfab'); if (!DR.on) { if (b) b.remove(); if (f) f.remove(); DR.open = false; return; }
    if (!f) { f = document.createElement('button'); f.id = 'drwfab'; $('app').appendChild(f); fabInit(f); }
    f.className = DR.open ? 'on' : ''; f.textContent = DR.open ? '✕' : '🎨'; f.title = T('Drawing tools', 'أدوات الرسم');
    placeFab(f);
    if (!DR.open) { if (b) b.remove(); return; }
    if (!b) { b = document.createElement('div'); b.id = 'drwbar'; $('app').appendChild(b); }
    b.innerHTML = DCOL.map((c) => `<button class="sw ${!DR.erase && DR.color === c ? 'on' : ''}" style="background:${c}" data-act="drwcol" data-c="${c}"></button>`).join('') +
      [3, 6, 12].map((w) => `<button class="${DR.w === w ? 'on' : ''}" data-act="drww" data-w="${w}">${w === 3 ? '·' : w === 6 ? '•' : '●'}</button>`).join('') +
      `<button class="${DR.txt ? 'on' : ''}" data-act="drwtxt" title="${T('Type text', 'اكتب نص')}">Aa</button><button class="${DR.erase ? 'on' : ''}" data-act="drwer">🧽</button><button data-act="drwundo">↩️</button><button data-act="drwclr">🗑️</button>` +
      `<button class="${DR.move ? 'on' : ''}" data-act="drwmv" title="${T('Move the model', 'حرّك المجسم')}">🖐️</button><button data-act="drwsave">📤</button><button data-act="draw" title="${T('Close drawing', 'إنهاء الرسم')}">⏹️</button>`;
    placePanel(b, f);
  }
  /* the floating pencil button can be dragged anywhere; its position is remembered */
  function fabPos() { try { const p = JSON.parse(localStorage.getItem('anat_drwfab')); if (p && isFinite(p.x) && isFinite(p.y)) return p; } catch (e) {} return null; }
  function placeFab(f) {
    const app = $('app'), W = app.clientWidth, H = app.clientHeight; let p = DR.fab || fabPos() || { x: W - 62, y: H - 210 };
    p = { x: Math.max(6, Math.min(W - 56, p.x)), y: Math.max(6, Math.min(H - 56, p.y)) }; DR.fab = p; f.style.left = p.x + 'px'; f.style.top = p.y + 'px';
  }
  function placePanel(b, f) {
    if (!b || !f) return; const app = $('app'), W = app.clientWidth, H = app.clientHeight, p = DR.fab || { x: W - 62, y: H - 210 };
    const bw = b.offsetWidth || 250, bh = b.offsetHeight || 150;
    let x = Math.max(8, Math.min(W - bw - 8, p.x + 25 - bw / 2)), y = p.y - bh - 8; if (y < 8) y = Math.min(H - bh - 8, p.y + 58);
    b.style.left = x + 'px'; b.style.top = y + 'px';
  }
  function fabInit(f) {
    let sx = 0, sy = 0, ox = 0, oy = 0, moved = false, down = false;
    f.addEventListener('pointerdown', (ev) => { down = true; moved = false; sx = ev.clientX; sy = ev.clientY; ox = (DR.fab || fabPos() || { x: 0 }).x; oy = (DR.fab || fabPos() || { y: 0 }).y; f.setPointerCapture(ev.pointerId); ev.preventDefault(); });
    f.addEventListener('pointermove', (ev) => {
      if (!down) return; const dx = ev.clientX - sx, dy = ev.clientY - sy;
      if (!moved && Math.hypot(dx, dy) > 6) moved = true;
      if (moved) { DR.fab = { x: ox + dx, y: oy + dy }; placeFab(f); const b = $('drwbar'); if (b) placePanel(b, f); }
    });
    const up = () => { if (!down) return; down = false; if (moved) { try { localStorage.setItem('anat_drwfab', JSON.stringify(DR.fab)); } catch (e) {} } else { DR.open = !DR.open; drwBar(); } };
    f.addEventListener('pointerup', up); f.addEventListener('pointercancel', () => { down = false; });
  }
  function drwBind(cv) {
    const pos = (ev) => { const r = cv.getBoundingClientRect(); return [ev.clientX - r.left, ev.clientY - r.top]; };
    cv.addEventListener('pointerdown', (ev) => {
      if (DR.move) return;
      if (DR.txt && !DR.erase) {
        if (DR.open) { DR.open = false; drwBar(); }
        const q = pos(ev); ev.preventDefault();
        if ($('drwtxtwrap')) { document.activeElement && document.activeElement.blur && document.activeElement.blur(); return; }
        const h = hitText(q);
        if (h) { DR.tdrag = { s: h, dx: q[0] - h.x, dy: q[1] - h.y, moved: false, sx: q[0], sy: q[1] }; cv.setPointerCapture(ev.pointerId); }
        else textEdit(null, q[0], q[1]);
        return;
      }
      if (DR.open) { DR.open = false; drwBar(); }
      cv.setPointerCapture(ev.pointerId); DR.cur = { c: DR.color, w: DR.erase ? DR.w * 3 : DR.w, e: DR.erase, p: [pos(ev)] }; drwRedraw(); ev.preventDefault();
    });
    cv.addEventListener('pointermove', (ev) => {
      if (DR.tdrag) { const q = pos(ev), d = DR.tdrag; if (!d.moved && Math.hypot(q[0] - d.sx, q[1] - d.sy) > 6) d.moved = true; if (d.moved) { d.s.x = Math.max(0, Math.min(cv.clientWidth - 40, q[0] - d.dx)); d.s.y = Math.max(0, Math.min(cv.clientHeight - 24, q[1] - d.dy)); drwRedraw(); } return; }
      if (!DR.cur) return; const p = pos(ev), l = DR.cur.p[DR.cur.p.length - 1]; if (Math.hypot(p[0] - l[0], p[1] - l[1]) > 1.5) { DR.cur.p.push(p); drwRedraw(); }
    });
    const end = () => {
      if (DR.tdrag) { const d = DR.tdrag; DR.tdrag = null; if (!d.moved) textEdit(d.s); return; }
      if (DR.cur) { DR.strokes.push(DR.cur); DR.cur = null; drwRedraw(); }
    };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  }
  function drwFit() { const cv = $('drw'), v = $('view'); if (!cv || !v) return; const dpr = Math.min(2, window.devicePixelRatio || 1), w = v.clientWidth, h = v.clientHeight; if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); drwRedraw(); } }
  A.acts.draw = () => {
    DR.on = !DR.on;
    if (DR.on) {
      if (S.cover) A.acts.covend();
      let cv = $('drw'); if (!cv) { cv = document.createElement('canvas'); cv.id = 'drw'; $('view').appendChild(cv); drwBind(cv); }
      cv.className = DR.move ? 'mv' : ''; drwFit(); addEventListener('resize', drwFit);
      A.toast(T('Draw on the model. Tap 🖐️ to rotate it — your drawing stays on the screen, not on the model.', 'ارسم على المجسم. دوس 🖐️ عشان تحرّكه — الرسم بيفضل على الشاشة مش على المجسم.'), 5200);
    } else { const cv = $('drw'); if (cv) cv.remove(); DR.txt = false; const tw = $('drwtxtwrap'); if (tw) tw.remove(); DR.strokes = []; DR.cur = null; removeEventListener('resize', drwFit); }
    drwBar(); if (A.renderChips) A.renderChips();
  };
  /* typed text on the drawing layer: wraps inside the screen, font size / type / colour, tap a text to edit it, drag it to move it */
  function textEdit(s, x, y) {
    const v = $('view'); if (!v || $('drwtxtwrap')) return;
    const W = v.clientWidth, H = v.clientHeight, isNew = !s;
    if (isNew) { x = Math.max(6, Math.min(W - 120, x)); s = { t: '', x, y: Math.max(6, Math.min(H - 60, y)), fs: DR.fs, ff: DR.ff, c: DR.color, w: Math.min(280, W - x - 8) }; }
    s.edit = true; if (!isNew) drwRedraw();
    const wrap = document.createElement('div'); wrap.id = 'drwtxtwrap';
    const tb = document.createElement('div'); tb.className = 'tb';
    tb.innerHTML = `<div class="r"><button data-k="dn">A−</button><button data-k="up">A+</button><button data-k="ff"></button><button data-k="del">🗑️</button><button data-k="ok">✔</button></div><div class="r">` + DCOL.map((c) => `<button class="sw" data-k="c" data-c="${c}" style="background:${c}"></button>`).join('') + `</div>`;
    const ta = document.createElement('textarea'); ta.rows = 1; ta.value = s.t; ta.placeholder = T('Type here…', 'اكتب هنا…'); ta.setAttribute('dir', 'auto');
    wrap.appendChild(tb); wrap.appendChild(ta); v.appendChild(wrap);
    const style = () => {
      ta.style.cssText = `width:${s.w}px;font:700 ${Math.max(16, s.fs)}px ${FONTS[s.ff]};color:${s.c};border-color:${s.c}`;
      ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, H * 0.4) + 'px';
      tb.querySelector('[data-k=ff]').textContent = T(FNAME[s.ff][0], FNAME[s.ff][1]);
      const th = tb.offsetHeight || 80, top = s.y >= th + 12 ? s.y - th - 6 : s.y + ta.offsetHeight + 6; tb.style.left = Math.max(4, Math.min(W - tb.offsetWidth - 4, s.x)) + 'px'; tb.style.top = Math.max(4, Math.min(H - tb.offsetHeight - 4, top)) + 'px';
      ta.style.position = 'absolute'; ta.style.left = s.x + 'px'; ta.style.top = s.y + 'px';
    };
    let done = false;
    const commit = (remove) => {
      if (done) return; done = true; s.t = ta.value.replace(/\s+$/, ''); delete s.edit; wrap.remove();
      const k = DR.strokes.indexOf(s); if (!s.t || remove) { if (k >= 0) DR.strokes.splice(k, 1); } else if (k < 0) DR.strokes.push(s);
      DR.fs = s.fs; DR.ff = s.ff; drwRedraw();
    };
    tb.addEventListener('pointerdown', (e) => e.preventDefault());
    tb.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return; const k = b.dataset.k;
      if (k === 'dn') s.fs = Math.max(12, s.fs - 3); else if (k === 'up') s.fs = Math.min(72, s.fs + 3);
      else if (k === 'ff') { const ks = Object.keys(FONTS); s.ff = ks[(ks.indexOf(s.ff) + 1) % ks.length]; }
      else if (k === 'c') { s.c = b.dataset.c; DR.color = s.c; }
      else if (k === 'del') { commit(true); return; } else if (k === 'ok') { commit(); return; }
      style();
    });
    ta.addEventListener('input', style);
    ta.addEventListener('blur', () => setTimeout(() => { if (!done && document.activeElement !== ta) commit(); }, 0));
    ta.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (isNew) commit(true); else commit(); } });
    style(); setTimeout(() => { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }, 30);
  }
  A.acts.drwtxt = () => { DR.txt = !DR.txt; if (DR.txt) { DR.erase = false; DR.move = false; const cv = $('drw'); if (cv) { cv.className = ''; cv.style.cursor = 'text'; } A.toast(T('Tap where you want the text, type, then press Enter ✔', 'دوس مكان ما تحب تكتب، اكتب، وبعدين Enter ✔'), 4200); } else { const cv = $('drw'); if (cv) cv.style.cursor = ''; } drwBar(); };
  A.acts.drwopen = () => { DR.open = !DR.open; drwBar(); };
  A.acts.drwcol = (el) => { DR.color = el.dataset.c; DR.erase = false; drwBar(); };
  A.acts.drww = (el) => { DR.w = +el.dataset.w; drwBar(); };
  A.acts.drwer = () => { DR.erase = !DR.erase; if (DR.erase) DR.txt = false; drwBar(); };
  A.acts.drwundo = () => { DR.strokes.pop(); drwRedraw(); };
  A.acts.drwclr = () => { DR.strokes = []; drwRedraw(); };
  A.acts.drwmv = () => { DR.move = !DR.move; if (DR.move) DR.txt = false; const cv = $('drw'); if (cv) cv.className = DR.move ? 'mv' : ''; drwBar(); };
  A.acts.drwsave = () => {
    const gl = $('gl'), lm = $('lm'), dv = $('drw'); if (!gl) return;
    A.R.draw(A.cam); if (A.afterDraw) A.afterDraw();
    const W = gl.width, H = gl.height, bar = Math.round(Math.max(52, W * 0.085)), c = document.createElement('canvas'); c.width = W; c.height = H + bar;
    const g = c.getContext('2d'), dark = document.documentElement.dataset.theme !== 'light';
    g.fillStyle = dark ? '#000B33' : '#F8F4EA'; g.fillRect(0, 0, W, H + bar);
    g.drawImage(gl, 0, 0, W, H); if (lm) g.drawImage(lm, 0, 0, W, H); if (dv) g.drawImage(dv, 0, 0, W, H);
    g.fillStyle = dark ? '#0a1024' : '#dde5f7'; g.fillRect(0, H, W, bar); g.fillStyle = dark ? '#fff' : '#18204a'; g.font = `800 ${Math.round(bar * 0.42)}px system-ui,Arial`; g.textBaseline = 'middle'; g.textAlign = 'center';
    g.fillText('Anatovia · anatovia.eg', W / 2, H + bar / 2);
    c.toBlob((b) => { if (b) A.fileOut(b, 'anatovia-drawing.png', 'image/png', { text: T('My drawing on Anatovia', 'رسمتي على أناتوفيا'), head: T('Drawing ready ✔', 'الرسمة جاهزة ✔') }); }, 'image/png');
  };

  /* ───────────────────────── 3. mnemonics ───────────────────────── */
  const MN = [
    { t: ['Carpal bones', 'عظام الرسغ'], q: 'So Long To Pinky, Here Comes The Thumb', ex: ['Scaphoid, Lunate, Triquetrum, Pisiform (proximal row, lateral → medial) then Hamate, Capitate, Trapezoid, Trapezium (distal row, medial → lateral).', 'الزورقي، الهلالي، الهرمي، الحمّصي (الصف القريب من الخارج للداخل) وبعدين الكلّابي، الرأسي، شبه المنحرف، المنحرف (الصف البعيد من الداخل للخارج).'], re: /scaphoid|lunate|triquetrum|pisiform|hamate|capitate|trapezoid|trapezium/i },
    { t: ['Rotator cuff', 'الكفة المدوّرة'], q: 'SITS', ex: ['Supraspinatus, Infraspinatus, Teres minor, Subscapularis.', 'فوق الشوكة، تحت الشوكة، المدورة الصغرى، تحت اللوح.'], re: /supraspinatus|infraspinatus|teres minor|subscapularis/i },
    { t: ['Tarsal bones', 'عظام رسغ القدم'], q: 'Tiger Cubs Need MILC', ex: ['Talus, Calcaneus, Navicular, Medial / Intermediate / Lateral cuneiforms, Cuboid.', 'الكاحلي، العقبي، الزورقي، الإسفينية (الإنسية والمتوسطة والوحشية)، النردي.'], re: /talus|calcaneus|navicular|cuneiform|cuboid/i },
    { t: ['Cranial nerves (names)', 'الأعصاب القحفية (الأسامي)'], q: "On Old Olympus' Towering Top, A Finn And German Viewed Some Hops", ex: ['I Olfactory, II Optic, III Oculomotor, IV Trochlear, V Trigeminal, VI Abducens, VII Facial, VIII Vestibulocochlear, IX Glossopharyngeal, X Vagus, XI Accessory, XII Hypoglossal.', 'الشمّي، البصري، المحرّك للعين، البكري، ثلاثي التوائم، المبعِّد، الوجهي، الدهليزي القوقعي، اللساني البلعومي، المبهم، الإضافي، تحت اللسان.'], re: /olfactory|optic nerve|oculomotor|trochlear|trigeminal|abducens|facial nerve|vestibulocochlear|glossopharyngeal|vagus|accessory nerve|hypoglossal/i },
    { t: ['Cranial nerves (sensory / motor)', 'الأعصاب القحفية (حسّي / حركي)'], q: 'Some Say Marry Money, But My Brother Says Big Brains Matter More', ex: ['S = sensory, M = motor, B = both, in order I → XII: S S M M B M B S B B M M.', 'S حسّي، M حركي، B الاتنين، بالترتيب من الأول للثاني عشر: حسّي حسّي حركي حركي الاتنين حركي الاتنين حسّي الاتنين الاتنين حركي حركي.'], re: /olfactory|optic nerve|oculomotor|trochlear|trigeminal|abducens|facial nerve|vestibulocochlear|glossopharyngeal|vagus|accessory nerve|hypoglossal/i },
    { t: ['Brachial plexus', 'الضفيرة العضدية'], q: 'Randy Travis Drinks Cold Beer', ex: ['Roots → Trunks → Divisions → Cords → Branches.', 'جذور ← جذوع ← أقسام ← حبال ← فروع.'], re: /brachial plexus/i },
    { t: ['Terminal branches of the brachial plexus', 'الفروع الطرفية للضفيرة العضدية'], q: 'MARMU', ex: ['Musculocutaneous, Axillary, Radial, Median, Ulnar.', 'العضلي الجلدي، الإبطي، الكعبري، المتوسط، الزندي.'], re: /musculocutaneous|axillary nerve|radial nerve|median nerve|ulnar nerve/i },
    { t: ['Thenar muscles', 'عضلات الإبهام (الثينار)'], q: 'AOF', ex: ['Abductor pollicis brevis, Opponens pollicis, Flexor pollicis brevis.', 'المبعِّدة القصيرة، المقابِلة، الثانية القصيرة للإبهام.'], re: /abductor pollicis brevis|opponens pollicis|flexor pollicis brevis/i },
    { t: ['Interossei of the hand', 'العضلات بين العظام في اليد'], q: 'PAD and DAB', ex: ['Palmar interossei ADduct, Dorsal interossei ABduct (the fingers).', 'الراحية بتقرّب الأصابع، والظهرية بتبعّدها.'], re: /interossei/i },
    { t: ['Pes anserinus', 'الرِّجل الإوزّية'], q: 'Say Grace before Tea', ex: ['Sartorius, Gracilis, Semitendinosus — their tendons meet on the medial side of the tibia.', 'الخياطية، الرشيقة، نصف الوتري — أوتارها بتتجمّع على الجهة الإنسية من الظنبوب.'], re: /sartorius|gracilis|semitendinosus/i },
    { t: ['Arm flexor compartment', 'عضلات الذراع الأمامية'], q: 'BBC', ex: ['Biceps brachii, Brachialis, Coracobrachialis — all supplied by the musculocutaneous nerve.', 'ذات الرأسين، العضدية، الغرابية العضدية — كلها بالعصب العضلي الجلدي.'], re: /biceps brachii|brachialis|coracobrachialis/i },
    { t: ['Phrenic nerve', 'العصب الحجابي'], q: "C3, 4, 5 keeps the diaphragm alive", ex: ['The phrenic nerve comes from C3, C4, C5.', 'العصب الحجابي من الفقرات العنقية C3 وC4 وC5.'], re: /phrenic|diaphragm/i },
    { t: ['Branches of the external carotid', 'فروع الشريان السباتي الظاهر'], q: 'Some Anatomists Like Freaking Out Poor Medical Students', ex: ['Superior thyroid, Ascending pharyngeal, Lingual, Facial, Occipital, Posterior auricular, Maxillary, Superficial temporal.', 'الدرقي العلوي، البلعومي الصاعد، اللساني، الوجهي، القذالي، الأذني الخلفي، الفكي، الصدغي السطحي.'], re: /external carotid/i },
    { t: ['Layers of the scalp', 'طبقات فروة الرأس'], q: 'SCALP', ex: ['Skin, Connective tissue, Aponeurosis (galea), Loose areolar tissue, Pericranium.', 'الجلد، النسيج الضام، الصفاق (الجالِيا)، النسيج الرخو، السمحاق.'], re: null },
    { t: ['Contents of the femoral triangle', 'محتويات المثلث الفخذي'], q: 'NAVEL', ex: ['Lateral → medial: Nerve, Artery, Vein, Empty space, Lymphatics.', 'من الخارج للداخل: العصب، الشريان، الوريد، فراغ، الأوعية الليمفاوية.'], re: /femoral (nerve|artery|vein)/i },
  ];
  const mnFor = (e) => MN.filter((m) => m.re && m.re.test(e.en));
  const mnCard = (m) => `<div class="mn-card"><b>${esc(T(m.t[0], m.t[1]))}</b><div class="mn-q">${esc(m.q)}</div><div class="mn-ex">${esc(T(m.ex[0], m.ex[1]))}</div></div>`;
  A.hubExtra = A.hubExtra || {};
  A.hubExtra.mnem = () => A.modal(() => `<h2>📝 ${T('Memory aids', 'قصص الحفظ')}</h2><p class="lead">${T('Short phrases that make long lists easy to remember. Each one also appears on the matching part.', 'جُمل قصيرة بتسهّل حفظ القوايم الطويلة. وكل واحدة بتظهر كمان في بانل الجزء المرتبط بيها.')}</p>${MN.map(mnCard).join('')}`);

  /* ───────────────────────── 4. read-aloud ───────────────────────── */
  const canSpeak = 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
  let speaking = false;
  const RATES = [[0.65, 'Very slow', 'بطيء جداً'], [0.8, 'Slow', 'بطيء'], [0.95, 'Normal', 'عادي'], [1.15, 'Fast', 'سريع']];
  const getRate = () => { try { const r = parseFloat(localStorage.getItem('anat_rate')); if (r >= 0.5 && r <= 1.5) return r; } catch (err) { /* ignore */ } return 0.8; };
  let lastSaid = null;
  const pickVoice = (lang) => { try { const v = speechSynthesis.getVoices(), want = lang.slice(0, 2).toLowerCase(); return v.find((x) => x.lang.replace('_', '-').toLowerCase() === lang.toLowerCase()) || v.find((x) => x.lang.toLowerCase().startsWith(want)) || null; } catch (err) { return null; } };
  function textFor(e, lang) {
    const i = lang === 'ar' ? 1 : 0, parts = [(lang === 'ar' ? e.ar : e.en)];
    if (e.sum) parts.push(e.sum[i]);
    if (e.mu) { const m = e.mu; parts.push((lang === 'ar' ? 'المنشأ: ' : 'Origin: ') + m[i], (lang === 'ar' ? 'المرتكز: ' : 'Insertion: ') + m[2 + i], (lang === 'ar' ? 'الحركة: ' : 'Action: ') + m[4 + i], (lang === 'ar' ? 'العصب: ' : 'Nerve: ') + m[6 + i]); }
    if (e.pt) parts.push(e.pt[i]);
    return parts.filter(Boolean).join('. ').replace(/\s+/g, ' ');
  }
  function say(e, force) {
    if (!canSpeak) return A.toast(T('Voice is not available on this device', 'الصوت مش متاح على الجهاز ده'), 3000);
    if (speaking && !force) { try { speechSynthesis.cancel(); } catch (err) { /* ignore */ } speaking = false; return A.toast(T('Stopped', 'اتوقف'), 1500); }
    lastSaid = e;
    let lang = ar() ? 'ar' : 'en', v = pickVoice(lang === 'ar' ? 'ar-EG' : 'en-US');
    if (!v && lang === 'ar') { lang = 'en'; v = pickVoice('en-US'); A.toast(T('', 'جهازك مفيهوش صوت عربي، هقرأ بالإنجليزي. نزّل صوت عربي من إعدادات الجهاز.'), 4200); }
    const chunks = textFor(e, lang).match(/[^.؟!]+[.؟!]?/g) || [textFor(e, lang)];
    try {
      speechSynthesis.cancel(); speaking = true;
      chunks.forEach((c, k) => { const u = new SpeechSynthesisUtterance(c.trim()); u.lang = lang === 'ar' ? 'ar-EG' : 'en-US'; u.rate = getRate(); if (v) u.voice = v; if (k === chunks.length - 1) u.onend = () => { speaking = false; }; u.onerror = () => { speaking = false; }; speechSynthesis.speak(u); });
      A.toast('🔊 ' + T('Reading… tap again to stop', 'بقرأ… اضغط تاني للإيقاف'), 2500);
    } catch (err) { speaking = false; }
  }
  A.acts.listen = (el) => { const e = P[+el.dataset.i]; if (e) say(e); };
  A.acts.lrate = (el) => {
    const r = parseFloat(el.dataset.r); try { localStorage.setItem('anat_rate', String(r)); } catch (err) { /* ignore */ }
    document.querySelectorAll('[data-act="lrate"]').forEach((b) => b.classList.toggle('on', parseFloat(b.dataset.r) === r));
    if (speaking && lastSaid) { say(lastSaid, true); }   // re-read at the new speed
    else A.toast('🔊 ' + T('Reading speed: ', 'سرعة القراءة: ') + T(RATES.find((x) => x[0] === r)[1], RATES.find((x) => x[0] === r)[2]), 1600);
  };

  /* panel: mnemonics + listen button */
  const waitFor = (fn, cb) => { const t0 = setInterval(() => { if (fn()) { clearInterval(t0); cb(); } }, 200); setTimeout(() => clearInterval(t0), 15000); };
  waitFor(() => A.panelExtra, () => {
    const prev = A.panelExtra;
    A.panelExtra = (e) => {
      let h = prev ? prev(e) : '';
      const ms = mnFor(e);
      h += `<div class="actions" style="margin-top:10px"><button class="act" data-act="listen" data-i="${e.i}">🔊 ${T('Listen to the explanation', 'اسمع الشرح')}</button></div><div class="rate-row"><span>${T('Speed', 'السرعة')}</span>${RATES.map((x) => `<button class="chip ${getRate() === x[0] ? 'on' : ''}" data-act="lrate" data-r="${x[0]}">${T(x[1], x[2])}</button>`).join('')}</div>`;
      if (ms.length) h += `<h4>📝 ${T('Memory aid', 'قصة حفظ')}</h4>${ms.map(mnCard).join('')}`;
      return h;
    };
  });

  /* ───────────────────────── 5. study stats ───────────────────────── */
  let lastAct = Date.now(); const bump = () => { lastAct = Date.now(); };
  ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach((ev) => addEventListener(ev, bump, { passive: true }));
  let dirty = 0;
  setInterval(() => {
    if (document.hidden || Date.now() - lastAct > 45000) return;
    const d = Store.d, k = String(dayNo()); d.tm = d.tm || {}; d.tm[k] = (d.tm[k] || 0) + 5; dirty += 5;
    const ks = Object.keys(d.tm); if (ks.length > 60) ks.sort().slice(0, ks.length - 60).forEach((x) => delete d.tm[x]);
    if (dirty >= 30) { dirty = 0; Store.save(); }
  }, 5000);
  addEventListener('pagehide', () => { if (dirty) Store.save(); });
  const fmt = (s) => { const m = Math.round(s / 60); return m >= 60 ? (m / 60).toFixed(1) + T(' h', ' س') : m + T(' min', ' د'); };
  function statsHtml() {
    const d = Store.d, tm = d.tm || {}, today = dayNo(), days = [];
    for (let i = 6; i >= 0; i--) { const n = today - i, sec = tm[String(n)] || 0, dt = new Date(n * 864e5 + new Date().getTimezoneOffset() * 6e4); days.push({ sec, lbl: dt.toLocaleDateString(ar() ? 'ar-EG' : 'en-US', { weekday: 'short' }) }); }
    const max = Math.max(60, ...days.map((x) => x.sec)), tot = days.reduce((a, x) => a + x.sec, 0);
    // weak systems: quiz history (sysA) + mistakes in spaced repetition
    const agg = {}; (d.hist || []).forEach((h) => { for (const s in (h.sysA || {})) { const a = (agg[s] = agg[s] || { c: 0, n: 0 }); a.c += h.sysA[s].c; a.n += h.sysA[s].n; } });
    const sysRows = SYS.filter((s) => agg[s] && agg[s].n >= 3).map((s) => ({ s, p: Math.round(100 * agg[s].c / agg[s].n), n: agg[s].n })).sort((a, b) => a.p - b.p);
    const missed = Object.entries(d.srs || {}).filter(([, v]) => v.b === 0).map(([id]) => P.find((e) => e.id === id)).filter(Boolean);
    const seen = new Set(), top = []; for (const e of missed) { if (seen.has(e.baseEn)) continue; seen.add(e.baseEn); top.push(e); if (top.length >= 6) break; }
    const lrn = SYS.map((s) => { const all = [...reps.values()].filter((e) => e.sys === s), got = all.filter((e) => d.learned[e.id] || (d.srs[e.id] && d.srs[e.id].b >= 3)).length; return { s, got, n: all.length }; }).filter((x) => x.n);
    return `<h2>⏱️ ${T('My study stats', 'إحصائيات المذاكرة')}</h2>
      <div class="st-big"><div><b>${fmt(tot)}</b><small>${T('this week', 'الأسبوع ده')}</small></div><div><b>${fmt(tot / 7)}</b><small>${T('per day', 'في اليوم')}</small></div><div><b>${Store.streak()} 🔥</b><small>${T('day streak', 'أيام متتالية')}</small></div></div>
      <h4>${T('Time per day', 'الوقت كل يوم')}</h4><div class="st-bars">${days.map((x) => `<div><small>${x.sec ? fmt(x.sec) : ''}</small><i style="height:${Math.max(2, Math.round(80 * x.sec / max))}px"></i><small>${esc(x.lbl)}</small></div>`).join('')}</div>
      <small style="opacity:.7">${T('Counted only while you are using the app.', 'بيتحسب بس وانت بتستخدم التطبيق فعلاً.')}</small>
      <h4>${T('Weakest systems', 'أضعف الأنظمة عندك')}</h4>${sysRows.length ? sysRows.slice(0, 4).map((r) => `<div class="st-row"><span style="min-width:74px">${esc(sysName(r.s))}</span><div class="bar"><i style="width:${r.p}%"></i></div><b>${r.p}%</b></div>`).join('') : `<p class="lead">${T('Take a few quizzes and this will fill in.', 'خُد كام اختبار وهتظهر هنا.')}</p>`}
      <h4>${T('What you learned so far', 'اللي حفظته لحد دلوقتي')}</h4>${lrn.map((r) => `<div class="st-row"><span style="min-width:74px">${esc(sysName(r.s))}</span><div class="bar"><i style="width:${Math.round(100 * r.got / r.n)}%"></i></div><small>${r.got}/${r.n}</small></div>`).join('')}
      <h4>${T('Most-missed parts', 'أكتر حاجات بتنساها')}</h4>${top.length ? `<div class="pills">${top.map((e) => `<span class="pill2" data-act="stgo" data-i="${e.i}">${esc(nm(e))}</span>`).join('')}</div><div class="row" style="margin-top:12px"><button class="btn primary" data-act="hub" data-k="daily">🔥 ${T('Review them in today\'s session', 'راجعهم في جلسة النهاردة')}</button></div>` : `<p class="lead">${T('Nothing missed yet — great.', 'لسه مفيش حاجة غلطت فيها — تمام.')}</p>`}`;
  }
  A.hubExtra.stats = () => A.modal(statsHtml);
  A.acts.stgo = (el) => { A.closeModal(); if (A.select) A.select(+el.dataset.i, { fly: true }); };

  /* ───────────────────────── chips + tap hook ───────────────────────── */
  waitFor(() => A.extraChips && A.onTap, () => {
    const prevChips = A.extraChips, prevTap = A.onTap;
    A.extraChips = () => prevChips() + `<button class="chip ${S.cover ? 'active' : ''}" data-act="cover">🙈 ${T('Hide names', 'أخفي الأسامي')}</button><button class="chip ${DR.on ? 'active' : ''}" data-act="draw">✏️ ${T('Draw', 'رسم')}</button>`;
    A.onTap = (x, y) => { if (S.cover) { coverTap(x, y); return true; } return prevTap(x, y); };
    if (A.renderChips) A.renderChips();
  });
  const prevLang = A.onLang; A.onLang = () => { if (S.cover) covCard(); drwBar(); if (prevLang) prevLang(); };
})();
