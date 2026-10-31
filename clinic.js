/* clinic.js — clinical assessment (ROM / MMT / special tests), exercises per muscle, landmark quiz.
   Content is DRAFT educational material (see clinic-data.js) and must be reviewed by a physiotherapist. */
'use strict';
(() => {
  const { S, P, $, t, L, esc, name1, base1 } = A;
  const X = () => window.__anat || {};
  const ar = () => S.lang === 'ar';
  const T = (en, a) => (ar() ? a : en);
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0);

  Object.assign(STR, {
    exam: { en: 'Clinical assessment', ar: 'الفحص السريري' },
    examSub: { en: 'Normal ROM · muscle grading (MMT) · special tests', ar: 'المدى الطبيعي · قوة العضلات (MMT) · الاختبارات الخاصة' },
    lmq: { en: 'Landmark quiz', ar: 'اختبار المعالم' },
    lmqSub: { en: 'Name the arrow or tap the bony landmark', ar: 'سمِّ المعلم المشار إليه أو اضغط عليه' },
  });
  const DISCLAIMER = T('Draft educational content – values differ between sources and patients; confirm with your supervisor / current textbooks.',
    'محتوى تعليمي مبدئي — القيم تختلف بين المراجع والمرضى؛ راجعها مع المشرف أو المراجع الحديثة.');

  /* ───────────── hub entries ───────────── */
  A.hubExtra = { exam: () => openExam(), lmq: () => openLmqSetup() };

  /* ───────────── helpers ───────────── */
  const baseNm = (e) => e.baseEn;
  const sideOK = (e) => e.side !== 'l';
  const find = (sys, rx) => P.filter((e) => e.sys === sys && sideOK(e) && rx.test(e.baseEn));
  const uniq = (arr) => { const s = new Set(); return arr.filter((e) => (s.has(e.baseEn) ? false : (s.add(e.baseEn), true))); };
  const pill = (act, i, txt) => `<span class="pill2" data-act="${act}" data-i="${i}">${esc(txt)}</span>`;
  const jOf = (id) => JOINTS.find((j) => j.id === id);

  /* ───────────── ASSESSMENT ───────────── */
  const EXS = { j: null, tab: 'rom' };
  function openExam() {
    A.modal(() => {
      if (!EXS.j) {
        return `<h2>🩺 ${t('exam')}</h2><p class="lead">${t('examSub')}</p><div class="hub">` +
          JOINTS.map((j) => `<button type="button" data-act="exj" data-j="${j.id}"><span class="em">${{ upper: '💪', lower: '🦵', spine: '🦴' }[j.reg] || '🩺'}</span><span><b>${esc(T(j.en, j.ar))}</b><small>${j.rom.length} ROM · ${j.mmt.length} MMT · ${j.tests.length} ${T('tests', 'اختبارات')}</small></span></button>`).join('') +
          `</div><button type="button" class="btn wide" style="margin-top:12px" data-act="mmtscale">${T('MMT grading scale (0–5)', 'تدريج قوة العضلات (0–5)')}</button><p class="tiny">${DISCLAIMER}</p>`;
      }
      const j = jOf(EXS.j);
      let h = `<div class="row" style="justify-content:space-between;align-items:center"><button class="opt" data-act="exj" data-j="">${ar() ? '→' : '←'} ${T('Joints', 'المفاصل')}</button><button class="opt sel" data-act="exshow" data-j="${j.id}">◎ ${T('Show in 3D', 'اعرض في 3D')}</button></div>` +
        `<h2>${esc(T(j.en, j.ar))}</h2><div class="row">` + [['rom', 'ROM'], ['mmt', 'MMT'], ['tests', T('Special tests', 'اختبارات خاصة')]].map(([k, n]) => `<button class="opt ${EXS.tab === k ? 'sel' : ''}" data-act="extab" data-k="${k}">${n}</button>`).join('') + '</div>';
      if (EXS.tab === 'rom') {
        h += `<table class="tbl"><tr><th>${T('Movement', 'الحركة')}</th><th>${T('Normal active ROM', 'المدى الطبيعي')}</th></tr>` + j.rom.map((r) => `<tr><td>${esc(T(r[0], r[1]))}</td><td dir="ltr">${esc(r[2])}</td></tr>`).join('') + '</table>' +
          `<p class="tiny">${T('Goniometer: fulcrum on the joint axis, stationary arm on the proximal segment, moving arm on the distal segment. Reference values: AAOS / Norkin & White (differ slightly between sources).', 'الجونيوميتر: المحور على محور المفصل، الذراع الثابتة على الجزء القريب، والمتحركة على الجزء البعيد. القيم من AAOS و Norkin & White (تختلف قليلاً بين المراجع).')}</p>`;
      } else if (EXS.tab === 'mmt') {
        h += j.mmt.map((m) => {
          const ms = uniq(P.filter((e) => e.sys === 'muscle' && sideOK(e) && m[5].test(e.baseEn))).slice(0, 5);
          return `<div class="exc"><b>${esc(T(m[0], m[1]))}</b><div>${esc(T(m[2], m[3]))}</div><div class="tiny" dir="ltr">${T('Root', 'الجذر')}: ${esc(m[4])}</div>` +
            (ms.length ? `<div class="pills">${ms.map((e) => pill('goto', e.i, name1(e))).join('')}</div>` : '') + '</div>';
        }).join('') + `<button type="button" class="btn wide" data-act="mmtscale">${T('Grading scale 0–5', 'تدريج 0–5')}</button>`;
      } else {
        h += j.tests.map((x) => {
          if (!A.isPremium() && !(A.FREE_TESTS && A.FREE_TESTS.has(x[0]))) return `<div class="exc" data-act="pwtest"><b>🔒 ${esc(T(x[0], x[1]))}</b><div class="tiny">${T('Part of Premium', 'ضمن النسخة المميزة')}</div></div>`;
          const r = x[6] && uniq(find(x[6][0], x[6][1]))[0];
          return `<div class="exc"><b>${esc(T(x[0], x[1]))}</b><div><span class="tiny">${T('Assesses', 'يفحص')}:</span> ${esc(T(x[2], x[3]))}</div><div><span class="tiny">${T('Positive', 'الإيجابي')}:</span> ${esc(T(x[4], x[5]))}</div>` +
            (r ? `<div class="pills">${pill('goto', r.i, '◎ ' + name1(r))}</div>` : '') + (A.testBtn ? A.testBtn(j.id, x[0]) : '') + '</div>';
        }).join('');
      }
      return h + `<p class="tiny">${DISCLAIMER}</p>`;
    });
  }
  A.acts.pwtest = () => A.paywall('All special tests are part of Premium. Free: Neer, Lachman, McMurray, SLR and Trendelenburg.', 'كل الاختبارات الخاصة ضمن النسخة المميزة. المجاني: Neer وLachman وMcMurray وSLR وTrendelenburg.');
  A.acts.exj = (el) => { EXS.j = el.dataset.j || null; EXS.tab = 'rom'; openExam(); };
  A.acts.extab = (el) => { EXS.tab = el.dataset.k; openExam(); };
  A.acts.mmtscale = () => A.modal(() => `<h2>${T('Manual muscle testing (Oxford / Kendall)', 'اختبار القوة العضلية اليدوي')}</h2><table class="tbl">` +
    MMT_SCALE.map((r) => `<tr><td><b>${r[0]}</b></td><td><b>${esc(T(r[1], r[2]))}</b><br><span class="tiny">${esc(T(r[3], r[4]))}</span></td></tr>`).join('') + '</table>' +
    `<button class="btn wide" data-act="exj" data-j="${EXS.j || ''}">${T('Back', 'رجوع')}</button>`);

  A.acts.exshow = async (el) => {
    const j = jOf(el.dataset.j); A.closeModal();
    const bones = P.filter((e) => e.sys === 'bone' && e.k === 'bone' && sideOK(e) && j.bones.test(e.baseEn));
    S.layers.bone = 'on'; S.layers.ligament = 'on'; S.layers.muscle = 'off';
    await A.ensure('bone'); await A.ensure('ligament');
    const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
    for (const e of bones) for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], e.c[k] - e.r * 0.6); hi[k] = Math.max(hi[k], e.c[k] + e.r * 0.6); }
    const inBox = (e) => e.c.every((v, k) => v >= lo[k] - 0.03 && v <= hi[k] + 0.03);
    const ligs = P.filter((e) => e.sys === 'ligament' && sideOK(e) && inBox(e));
    S.focus = new Set([...bones, ...ligs].map((e) => e.i)); S.sel = -1; A.deselect();
    const c = [0, 1, 2].map((k) => (lo[k] + hi[k]) / 2), ext = Math.max(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]);
    X().cam.flyTo([c[0], Math.max(0.05, c[1]), c[2]], Math.max(0.5, ext * 1.7 + 0.3), null, 0.1);
    A.apply(); A.toast(T('Showing the joint bones and ligaments – "Show all" restores the view', 'عرض عظام المفصل وأربطته — زر «إظهار الكل» يرجّع العرض'), 4200);
  };

  /* ───────────── muscle / bone panel extras ───────────── */
  const prevExtra = A.panelExtra;
  A.panelExtra = (e) => {
    let h = prevExtra ? prevExtra(e) : '';
    if (e.sys === 'muscle' && e.k === 'muscle') {
      const ex = EXERCISES.find(([rx]) => rx.test(e.baseEn));
      if (ex) {
        const d = ex[1], li = (a) => a.map((x) => `<li>${esc(T(x[0], x[1]))}</li>`).join('');
        h += `<h4>🏋️ ${T('Exercises', 'التمارين')}</h4><div class="exc"><b>${T('Strengthening', 'تقوية')}</b><ul class="facts">${li(d.s)}</ul><b>${T('Stretching', 'إطالة')}</b><ul class="facts">${li(d.t)}</ul><div class="tiny">${esc(T(EX_NOTE[0], EX_NOTE[1]))}</div></div>`;
      }
      const tested = [];
      for (const j of JOINTS) for (const m of j.mmt) if (m[5].test(e.baseEn)) tested.push([j, m]);
      if (tested.length) h += `<h4>🩺 ${T('Tested in MMT', 'يُفحص في MMT')}</h4><div class="pills">${tested.map(([j, m]) => `<span class="pill2" data-act="exopen" data-j="${j.id}" data-tab="mmt">${esc(T(j.en, j.ar))} – ${esc(T(m[0], m[1]))} (${esc(m[4])})</span>`).join('')}</div>`;
    }
    if (e.k === 'bone') {
      const js = JOINTS.filter((j) => j.bones.test(e.baseEn));
      if (js.length) h += `<h4>🩺 ${T('Joint assessment', 'فحص المفصل')}</h4><div class="pills">${js.map((j) => `<span class="pill2" data-act="exopen" data-j="${j.id}" data-tab="rom">${esc(T(j.en, j.ar))}</span>`).join('')}</div>`;
    }
    return h;
  };
  A.acts.exopen = (el) => { EXS.j = el.dataset.j; EXS.tab = el.dataset.tab || 'rom'; openExam(); };

  /* ───────────── LANDMARK QUIZ ───────────── */
  const SIDE_RE = / – (left|right)$| \((يسار|يمين)\)$/;
  const LM = (window.LANDMARKS || []).map((l) => ({ ...l, bi: P.findIndex((e) => e.id === l.bn) })).filter((l) => l.bi >= 0 && P[l.bi].side !== 'l')
    .map((l) => ({ ...l, nm: [l.en.replace(SIDE_RE, ''), l.ar.replace(SIDE_RE, '')] }));
  const LC = { mode: 'mix', reg: 'all', n: 10 };
  const lname = (l) => T(l.nm[0], l.nm[1]);
  function openLmqSetup() {
    A.modal(() => {
      const pool = LM.filter((l) => LC.reg === 'all' || P[l.bi].reg === LC.reg).length;
      return `<h2>📍 ${t('lmq')}</h2><p class="lead">${t('lmqSub')}</p>` +
        `<div class="lab">${t('mode')}</div><div class="row">` + [['mix', T('Mixed', 'مختلط')], ['name', T('Name the arrow', 'سمِّ السهم')], ['tap', T('Tap the landmark', 'اضغط على المعلم')]].map(([k, n]) => `<button class="opt ${LC.mode === k ? 'sel' : ''}" data-act="lmqcfg" data-k="mode" data-v="${k}">${n}</button>`).join('') + '</div>' +
        `<div class="lab">${t('regions')}</div><div class="row"><button class="opt ${LC.reg === 'all' ? 'sel' : ''}" data-act="lmqcfg" data-k="reg" data-v="all">${t('allBody')}</button>` + REGIONS.map((r) => `<button class="opt ${LC.reg === r ? 'sel' : ''}" data-act="lmqcfg" data-k="reg" data-v="${r}">${t(r)}</button>`).join('') + '</div>' +
        `<div class="lab">${t('length')}</div><div class="row">` + [5, 10, 20].map((n) => `<button class="opt ${LC.n === n ? 'sel' : ''}" data-act="lmqcfg" data-k="n" data-v="${n}">${n}</button>`).join('') + '</div>' +
        `<button class="btn primary wide" data-act="lmqstart" ${pool < 6 ? 'disabled' : ''}>${t('start')}</button>`;
    });
  }
  A.acts.lmqcfg = (el) => { const k = el.dataset.k; LC[k] = k === 'n' ? +el.dataset.v : el.dataset.v; openLmqSetup(); };

  let Q = null, prev = null;
  A.acts.lmqstart = () => {
    A.closeModal();
    const pool = shuffle(LM.filter((l) => LC.reg === 'all' || P[l.bi].reg === LC.reg)); const seen = new Set(), picks = [];
    for (const l of pool) { const k = l.nm[0] + '|' + l.bn; if (seen.has(k)) continue; seen.add(k); picks.push(l); if (picks.length >= LC.n) break; }
    if (picks.length < 3) { A.toast(T('Not enough landmarks in this scope', 'لا توجد معالم كافية في هذا النطاق')); return; }
    const types = LC.mode === 'mix' ? null : LC.mode;
    Q = { qs: picks.map((l, i) => ({ l, type: types || (i % 2 ? 'tap' : 'name') })), idx: 0, results: [], answered: false, t0: Date.now() };
    prev = { layers: { ...S.layers }, iso: S.iso, region: S.region, hidden: new Set(S.hidden), explode: S.explode, focus: S.focus, lm: S.lm };
    S.explode = 0; $('explodeBar').hidden = true; S.hidden = new Set(); S.pulled.clear(); S.focus = null; S.lm = false; S.lmSel = -1; S.moveSet = null; $('moveBar').hidden = true;
    S.sel = -1; A.deselect(); $('app').classList.add('quiz'); $('quizBar').hidden = false;
    S.quiz = { onTap: onTap };
    ask();
  };
  function distract(l) {
    const same = LM.filter((x) => x.bn === l.bn && x.nm[0] !== l.nm[0]);
    const nm = new Set([l.nm[0]]), out = [];
    const add = (arr) => { for (const x of shuffle(arr)) { if (out.length >= 3) break; if (nm.has(x.nm[0])) continue; nm.add(x.nm[0]); out.push(x); } };
    add(same); add(LM.filter((x) => P[x.bi].reg === P[l.bi].reg && P[x.bi].k === 'bone')); add(LM);
    return out;
  }
  async function ask() {
    const q = Q.qs[Q.idx], l = q.l; Q.answered = false; q.t0 = Date.now(); q.tapped = null;
    for (const s of SYSTEMS) S.layers[s] = s === 'bone' ? 'on' : 'off';
    S.region = null; S.hl = null; S.sel = -1; S.iso = l.bi; S.lmSel = -1;
    await A.ensure('bone');
    if (q.type === 'name') { q.opts = shuffle([l, ...distract(l)]); lookAt(l, true); }
    else { q.opts = null; A.flyToPart(P[l.bi]); }
    A.apply(); bar();
  }
  function lookAt(l, close) {
    const it = X().itemOf[l.bi], o = it ? it.offset : [0, 0, 0];
    X().cam.flyTo([l.p[0] + o[0], l.p[1] + o[1], l.p[2] + o[2]], close ? 0.34 : 0.5, Math.atan2(l.n[0], l.n[2]), 0.15);
  }
  function bar() {
    const b = $('quizBar'), q = Q.qs[Q.idx], l = q.l, n = Q.qs.length, e = P[l.bi];
    let h = `<div class="qtop"><span dir="ltr">${Q.idx + 1} / ${n}</span><span>${t('score')}: <b>${Q.results.filter((r) => r.ok).length}</b></span></div><div class="qprog"><i style="width:${(Q.idx / n) * 100}%"></i></div>`;
    if (q.type === 'name') h += `<div class="qq">${T('What is the structure the arrow points to?', 'ما اسم المعلم الذي يشير إليه السهم؟')}<small>${esc(name1(e))}</small></div>`;
    else h += `<div class="qq">${T('Tap on', 'اضغط على')} <span style="color:var(--gold)">${esc(lname(l))}</span><small>${esc(name1(e))} · ${T('rotate and zoom to find it', 'دوّر وقرّب للعثور عليه')}</small></div>`;
    if (q.opts) h += '<div class="qopts">' + q.opts.map((o, k) => { let c = ''; if (Q.answered) { if (o === l) c = 'ok'; else if (k === q.chosen) c = 'no'; } return `<button type="button" class="${c}" data-act="lmqopt" data-k="${k}" ${Q.answered ? 'disabled' : ''}>${esc(lname(o))}</button>`; }).join('') + '</div>';
    if (Q.answered) {
      const r = Q.results[Q.results.length - 1];
      h += `<div class="qfb ${r.ok ? 'ok' : 'no'}"><span>${r.ok ? '✔ ' + t('correct') : '✘ ' + t('wrong') + ' ' + esc(lname(l))}</span><button class="btn primary" data-act="lmqnext">${Q.idx + 1 >= n ? t('finish') : t('next')}</button></div>`;
    } else h += `<div class="qrow"><button class="opt" data-act="lmqexit">${t('exit')}</button></div>`;
    b.innerHTML = h; requestAnimationFrame(() => $('app').style.setProperty('--qh', b.offsetHeight + 'px')); A.redraw();
  }
  function record(ok, tapped) { const q = Q.qs[Q.idx]; Q.results.push({ ok, l: q.l, type: q.type, reg: P[q.l.bi].reg, tapped }); Q.answered = true; try { Store.touchDay(); } catch (e) {} }
  A.acts.lmqopt = (el) => { if (!Q || Q.answered) return; const q = Q.qs[Q.idx]; q.chosen = +el.dataset.k; record(q.opts[q.chosen] === q.l); bar(); };
  A.acts.lmqnext = () => { if (Q.idx + 1 >= Q.qs.length) finish(); else { Q.idx++; ask(); } };
  A.acts.lmqexit = () => { if (!Q.results.length) { endUI(); return; } if (confirm(T('End the quiz now? Answered questions will be scored.', 'إنهاء الاختبار الآن؟ سيتم احتساب ما أجبت عنه.'))) finish(); };
  const proj = (p, vp, W, H) => { const x = vp[0] * p[0] + vp[4] * p[1] + vp[8] * p[2] + vp[12], y = vp[1] * p[0] + vp[5] * p[1] + vp[9] * p[2] + vp[13], w = vp[3] * p[0] + vp[7] * p[1] + vp[11] * p[2] + vp[15]; return w <= 0.01 ? null : [(x / w * 0.5 + 0.5) * W, (1 - (y / w * 0.5 + 0.5)) * H]; };
  function screenOf(l) {
    const x = X(), cv = $('lm'), W = cv.clientWidth, H = cv.clientHeight, { vp, eye } = x.cam.matrices();
    const it = x.itemOf[l.bi], o = it ? it.offset : [0, 0, 0], p = [l.p[0] + o[0], l.p[1] + o[1], l.p[2] + o[2]];
    const ex = eye[0] - p[0], ey = eye[1] - p[1], ez = eye[2] - p[2], dl = Math.hypot(ex, ey, ez) || 1;
    const s = proj(p, vp, W, H); return s && { x: s[0], y: s[1], front: (l.n[0] * ex + l.n[1] * ey + l.n[2] * ez) / dl > 0.0, W, H };
  }
  function onTap(idx, x, y) {
    if (!Q || Q.answered) return; const q = Q.qs[Q.idx]; if (q.type !== 'tap') return;
    const s = screenOf(q.l); if (!s) return;
    const ok = s.front && Math.hypot(x - s.x, y - s.y) < Math.max(34, Math.min(70, 22 / Math.max(0.2, X().cam.dist) * 1.4 + 14));
    q.tapAt = [x, y]; record(ok, null); lookAt(q.l, true); bar();
  }
  /* overlay: arrow for "name" questions; marker + label after answering */
  const baseDraw = A.afterDraw;
  A.afterDraw = () => {
    if (baseDraw) baseDraw();
    if (!Q || Q.done) return;
    const cv = $('lm'); if (!cv) return; const q = Q.qs[Q.idx], l = q.l; const s = screenOf(l); if (!s) return;
    const c = cv.getContext('2d'), dk = document.documentElement.dataset.theme !== 'light';
    const col = Q.answered ? (Q.results[Q.results.length - 1].ok ? '#3ddc84' : '#ff6b6b') : '#19e3f2';
    if (q.type === 'name' || Q.answered) {
      const dx = s.x < s.W / 2 ? 78 : -78, x0 = s.x + dx, y0 = Math.max(120, s.y - 78), a = Math.atan2(s.y - y0, s.x - x0);
      c.save(); c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 3; c.setLineDash(s.front ? [] : [6, 5]);
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(s.x - Math.cos(a) * 9, s.y - Math.sin(a) * 9); c.stroke(); c.setLineDash([]);
      c.beginPath(); c.moveTo(s.x, s.y); c.lineTo(s.x - Math.cos(a - 0.45) * 15, s.y - Math.sin(a - 0.45) * 15); c.lineTo(s.x - Math.cos(a + 0.45) * 15, s.y - Math.sin(a + 0.45) * 15); c.closePath(); c.fill();
      if (Q.answered) {
        c.font = '700 14px system-ui,-apple-system,"Segoe UI",Tahoma,"Noto Naskh Arabic",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        const txt = lname(l), w = Math.min(s.W - 16, c.measureText(txt).width + 22), lx = Math.max(8, Math.min(s.W - 8 - w, x0 - w / 2));
        c.fillStyle = dk ? 'rgba(14,20,44,.92)' : 'rgba(255,255,255,.95)'; c.strokeStyle = col; c.lineWidth = 2;
        c.beginPath(); c.roundRect ? c.roundRect(lx, y0 - 30, w, 26, 9) : c.rect(lx, y0 - 30, w, 26); c.fill(); c.stroke();
        c.fillStyle = dk ? '#fff' : '#18204a'; c.fillText(txt, lx + w / 2, y0 - 16, w - 8);
      }
      c.restore();
    }
    if (q.type === 'tap' && Q.answered && q.tapAt) { c.save(); c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); c.arc(q.tapAt[0], q.tapAt[1], 10, 0, 6.3); c.stroke(); c.restore(); }
  };
  function endUI() {
    $('quizBar').hidden = true; $('app').classList.remove('quiz'); S.quiz = null; const was = Q; Q = null;
    if (prev) { Object.assign(S.layers, prev.layers); S.iso = prev.iso; S.region = prev.region; S.hidden = prev.hidden; S.explode = prev.explode; S.focus = prev.focus; S.lm = prev.lm; }
    S.hl = null; S.sel = -1; A.apply(); X().cam.reset(); A.redraw(); return was;
  }
  function finish() {
    Q.done = true; const rs = Q.results, c = rs.filter((r) => r.ok).length, s = pct(c, rs.length), secs = Math.round((Date.now() - Q.t0) / 1000), wrongs = rs.filter((r) => !r.ok);
    let best = s; try { const d = Store.d; d.lmq = d.lmq || { best: 0, runs: 0 }; best = Math.max(d.lmq.best, s); d.lmq.best = best; d.lmq.runs++; Store.save(); } catch (e) {}
    if (A.logAct) A.logAct(rs.length, c); if (A.checkBadges) A.checkBadges();
    endUI();
    A.modal(() => `<h2>${t('result')}</h2><div class="score-ring"><div><div class="big">${s}%</div><div>${c} / ${rs.length}</div></div><div><b>${t(s >= 90 ? 'g_great' : s >= 70 ? 'g_good' : s >= 50 ? 'g_ok' : 'g_low')}</b><div class="lab">${t('timeTaken')}: ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')} · ${T('best', 'الأفضل')} ${best}%</div></div></div>` +
      (wrongs.length ? `<h4>${t('mistakes')}</h4>` + wrongs.map((r) => `<div class="mist" data-act="lmqreview" data-i="${r.l.i}"><span>${esc(lname(r.l))}<small>${esc(name1(P[r.l.bi]))}</small></span><small>${T('show', 'اعرض')}</small></div>`).join('') : `<div class="advice">${t('perfect')}</div>`) +
      `<div class="row" style="margin-top:14px"><button class="btn primary" data-act="lmqagain">${t('retry')}</button></div>`);
  }
  A.acts.lmqagain = () => openLmqSetup();
  A.acts.lmqreview = (el) => { A.closeModal(); const l = LM.find((x) => x.i === +el.dataset.i); if (l && A.acts.lmgo) { S.layers.bone = 'on'; A.ensure('bone').then(() => A.acts.lmgo({ dataset: { i: l.i } })); } };
})();
