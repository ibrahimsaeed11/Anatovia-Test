/* study.js — Study hub: quiz (finite, scored, with weak-area analysis), flashcards (spaced repetition),
   movement finder, progress, favourites/notes, about. */
'use strict';
(() => {
  const { S, P, $, t, L, esc, name1, name2, base1 } = A;
  const INTERVALS = [0, 1, 2, 4, 8, 16, 32];
  const dayNo = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 6e4) / 864e5);
  const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0);
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  /* representative entry per L/R pair (so flashcards / progress count each structure once) */
  const repKey = (e) => e.sys + '|' + e.k + '|' + e.baseEn;
  const reps = new Map();
  for (const e of P) { const k = repKey(e), cur = reps.get(k); if (!cur) reps.set(k, e); else if (e.side === 'r' && cur.side !== 'r') reps.set(k, e); }
  const repOf = (e) => reps.get(repKey(e));
  const repList = [...reps.values()];

  const contactHtml = () => `<div class="row contact-row"><a class="btn contact wa" href="https://wa.me/201050761015?text=${encodeURIComponent(S.lang === 'ar' ? 'السلام عليكم، عندي استفسار عن Anatovia' : 'Hello, I have a question about Anatovia')}" target="_blank" rel="noopener">💬 ${S.lang === 'ar' ? 'واتساب' : 'WhatsApp'}</a><a class="btn contact ig" href="https://www.instagram.com/anatovia.eg" target="_blank" rel="noopener">📸 ${S.lang === 'ar' ? 'آخر التحديثات' : 'Latest updates'}</a></div>`;
  /* ───────── hub ───────── */
  A.openHub = () => A.modal(() => {
    let items = [['account', '👤'], ['daily', '🔥'], ['nb', '📓'], ['ready', '📊'], ['quiz', '🎯'], ['dent', '🦷'], ['dent3d', '🦷'], ['splan', '🗓️'], ['lmq', '📍'], ['exam', '🩺'], ['tcards', '🧪'], ['nmap', '🗺️'], ['calc', '🧮'], ['board', '🏅'], ['duel', '⚔️'], ['spinal', '🧬'], ['play', '📅'], ['badges', '🏆'], ['cards', '🧠'], ['moves', '🏃'], ['progress', '📈'], ['stats', '⏱️'], ['mnem', '📝'], ['favs', '⭐'], ['tour', '🧭'], ['about', 'ℹ️']];
    if (A.facHub) items = A.facHub(items);
    const ac = A.acct || {}, dl = Math.max(0, Math.ceil(((ac.until || 0) - Date.now()) / 864e5));
    const trialBar = ac.trial ? `<div class="advice">🎁 ${TT('Free trial — ' + dl + ' day(s) left', 'التجربة المجانية — باقي ' + dl + ' يوم')}</div>` : !ac.premium ? `<button type="button" class="btn wide" style="margin-bottom:10px" data-act="pwacc">🎁 ${TT('Try Premium free for 3 days', 'جرّب النسخة المميزة 3 أيام مجانًا')}</button>` : '';
    return `<h2>${t('study')}</h2><p class="lead">${t('tagline')}</p>${A.facBadge ? A.facBadge() : ''}${trialBar}<div class="hub">` +
      items.map(([k, em]) => `<button type="button" data-act="hub" data-k="${k}"><span class="em">${em}</span><span><b>${t(k)}</b><small>${t(k + 'Sub')}</small></span></button>`).join('') + '</div>'+ `<div class="contact-bar">${contactHtml()}</div>`;
  });
  const HUB_PAID = { splan: ['Study plan is part of Premium.', 'خطة المذاكرة ضمن النسخة المميزة.'], spinal: ['Spinal nerve tables are part of Premium.', 'جداول الأعصاب الشوكية ضمن النسخة المميزة.'] };
  A.acts.hub = (el) => { const g = HUB_PAID[el.dataset.k]; if (g && !A.isPremium()) return A.paywall(g[0], g[1]); return hubGo(el); };
  const hubGo = (el) => ({ quiz: openQuizSetup, splan: openPlan, cards: openCardsSetup, daily: openDaily, ready: openReady, moves: openMoves, progress: openProgress, favs: openFavs, about: openAbout, ...(A.hubExtra || {}) })[el.dataset.k]();

  /* scope helpers shared by quiz + flashcards */
  const scopeRow = (cfg, act) => {
    const sysOpts = ['all', ...SYSTEMS];
    return `<div class="lab">${t('scope')}</div><div class="row">` + sysOpts.map((s) => `<button class="opt ${cfg.sys === s ? 'sel' : ''}" data-act="${act}" data-k="sys" data-v="${s}">${s === 'all' ? t('allSys') : t(s)}</button>`).join('') + '</div>' +
      `<div class="lab">${t('regions')}</div><div class="row"><button class="opt ${cfg.reg === 'all' ? 'sel' : ''}" data-act="${act}" data-k="reg" data-v="all">${t('allBody')}</button>` +
      REGIONS.map((r) => `<button class="opt ${cfg.reg === r ? 'sel' : ''}" data-act="${act}" data-k="reg" data-v="${r}">${t(r)}</button>`).join('') + '</div>';
  };
  const inScope = (e, cfg) => (cfg.sys === 'all' || e.sys === cfg.sys) && (cfg.reg === 'all' || e.reg === cfg.reg);

  /* ───────── QUIZ ───────── */
  const QC = { mode: 'mix', sys: 'all', reg: 'all', n: 10 };
  function openQuizSetup() {
    if (!A.isPremium() && ['clue', 'mix', 'silent', 'ospe'].includes(QC.mode)) QC.mode = 'tap';
    A.modal(() => {
      const modes = ['tap', 'name', 'silent', 'clue', 'mix', 'ospe'], mn = mistakeIds().size;
      const pool = quizPool(QC, QC.mode === 'mix' ? 'any' : QC.mode === 'silent' || QC.mode === 'ospe' ? 'name' : QC.mode).length;
      return `<h2>${t('quizSetup')}</h2><p class="lead">${t('quizSub')}</p>` +
        `<div class="lab">${t('mode')}</div><div class="row">` + modes.map((m) => `<button class="opt ${QC.mode === m ? 'sel' : ''}" data-act="qcfg" data-k="mode" data-v="${m}">${t('m_' + m)}${PAID_MODES.includes(m) && !A.isPremium() ? ' 🔒' : ''}</button>`).join('') + '</div>' +
        (A.isPremium() ? '' : `<p class="tiny">${TT('Free plan: ' + Math.max(0, A.FREE_Q - fq().n) + ' of ' + A.FREE_Q + ' questions left today.', 'الخطة المجانية: باقي ' + Math.max(0, A.FREE_Q - fq().n) + ' من ' + A.FREE_Q + ' أسئلة النهارده.')}</p>`) +
        scopeRow(QC, 'qcfg') +
        `<div class="lab">${t('length')}</div><div class="row">` + [5, 10, 20].map((n) => `<button class="opt ${QC.n === n ? 'sel' : ''}" data-act="qcfg" data-k="n" data-v="${n}">${n}</button>`).join('') + '</div>' +
        (QC.mode === 'silent' ? `<p class="tiny">${TT('The structure stays in context among its neighbours (no isolation, no labels) — identify it from its position and shape.', 'التركيب بيفضل وسط اللي حواليه (من غير عزل ولا تسميات) — اتعرف عليه من مكانه وشكله.')}</p>` : '') + (QC.mode === 'ospe' ? `<p class="tiny">${TT('Station-style exam: each structure is highlighted, you have 30 seconds to pick its name, then it moves on. No feedback until the end.', 'نظام محطات: يُضاء تركيب وعندك 30 ثانية لاختيار اسمه ثم ينتقل للتالي. لا تظهر الإجابات إلا في النهاية.')}</p>` : '') +
        `<button class="btn primary wide" data-act="qstart" ${pool < 4 ? 'disabled' : ''}>${t('start')}</button>` +
        `<button class="btn wide" style="margin-top:8px" data-act="qmistakes" ${mn < 3 ? 'disabled' : ''}>🔁 ${TT('Review my mistakes', 'راجع اللي غلطت فيه')} (${mn})</button>`;
    });
  }
  const PAID_MODES = ['clue', 'mix', 'silent', 'ospe'];
  const fq = () => { const d = Store.d, k = new Date().toDateString(); if (!d.fq || d.fq.d !== k) d.fq = { d: k, n: 0 }; return d.fq; };
  A.acts.qcfg = (el) => { const k = el.dataset.k; if (k === 'mode' && PAID_MODES.includes(el.dataset.v) && !A.isPremium()) return A.paywall('This quiz mode is part of Premium. Free: tap & name quizzes.', 'وضع الاختبار ده ضمن النسخة المميزة. المجاني: اختبار «اضغط» و«اسم».');  QC[k] = k === 'n' ? +el.dataset.v : el.dataset.v; openQuizSetup(); };
  A.acts.qstart = () => { A.closeModal(); startQuiz({ ...QC }); };

  const clueOf = (e) => {
    if (e.mu) return L([e.mu[4], e.mu[5]]);
    if (e.sum) { const s = L(e.sum); const cut = s.search(/[.。]\s|۔/); const first = cut > 20 ? s.slice(0, cut + 1) : s; const b = e.baseEn.split(' ')[0].toLowerCase(); if (b.length > 3 && first.toLowerCase().includes(b)) return null; if (S.lang === 'ar' && first.includes(e.baseAr.split(' ')[0]) && e.baseAr.split(' ')[0].length > 4) return null; return first; }
    return null;
  };
  function quizPool(cfg, type) {
    return repList.filter((e) => inScope(e, cfg) && (!cfg.only || cfg.only.has(e.id)) && (!e.lk || A.isPremium()) && (type === 'tap' ? e.r >= 0.014 && e.k !== 'tendon' : type === 'clue' ? !!clueOf(e) : true));
  }
  function weight(e) { const s = Store.d.srs[e.id]; if (s) return s.b <= 1 ? 3 : 1; return Store.d.learned[e.id] ? 0.5 : 1.4; }
  function sample(pool, n) {
    const out = [], items = pool.map((e) => ({ e, w: weight(e) * (0.5 + Math.random()) })).sort((a, b) => b.w - a.w);
    const seen = new Set();
    for (const it of items) { if (out.length >= n) break; if (seen.has(it.e.baseEn)) continue; seen.add(it.e.baseEn); out.push(it.e); }
    return out;
  }
  function distractors(e, n = 3) {
    const sameReg = repList.filter((x) => x.sys === e.sys && x.k === e.k && x.reg === e.reg && x.baseEn !== e.baseEn);
    const sameSys = repList.filter((x) => x.sys === e.sys && x.baseEn !== e.baseEn && !sameReg.includes(x));
    const out = shuffle(sameReg).slice(0, n); if (out.length < n) out.push(...shuffle(sameSys).slice(0, n - out.length));
    return out;
  }

  let Q = null, prevView = null;
  function startQuiz(cfg) {
    if (!A.isPremium()) {
      if (PAID_MODES.includes(cfg.mode) || cfg.only) return A.paywall('This quiz option is part of Premium.', 'الخيار ده ضمن النسخة المميزة.');
      const left = A.FREE_Q - fq().n;
      if (left < 3) return A.paywall('You finished today\'s free quiz questions (' + A.FREE_Q + '). Come back tomorrow or go Premium for unlimited quizzes.', 'خلّصت أسئلة الكويز المجانية النهارده (' + A.FREE_Q + '). ارجع بكرة أو اشترك لكويز بلا حد.');
      cfg = { ...cfg, n: Math.min(cfg.n, left) };
    }
    const types = cfg.mode === 'ospe' || cfg.mode === 'silent' ? ['name'] : cfg.mode === 'mix' ? ['tap', 'name', 'clue'] : [cfg.mode];
    // build question list
    const list = []; const used = new Set();
    const per = Math.ceil(cfg.n / types.length);
    let spare = [];
    types.forEach((ty, ti) => {
      const pool = quizPool(cfg, ty).filter((e) => !used.has(e.baseEn));
      const need = ti === types.length - 1 ? cfg.n - list.length : per;
      const picks = sample(pool, need + 3);
      picks.slice(0, need).forEach((e) => { used.add(e.baseEn); list.push({ e, type: ty }); });
      spare.push(...picks.slice(need).map((e) => ({ e, type: ty })));
    });
    while (list.length < cfg.n && spare.length) list.push(spare.shift());
    if (list.length < 3) { A.toast(S.lang === 'ar' ? 'لا توجد أسئلة كافية في هذا النطاق' : 'Not enough items in this scope'); return; }
    Q = { cfg, qs: shuffle(list), spare, idx: 0, skips: 0, t0: Date.now(), results: [], done: false, answered: false };
    prevView = { layers: { ...S.layers }, region: S.region, hidden: new Set(S.hidden), iso: S.iso, explode: S.explode, sel: S.sel, move: S.moveSet };
    S.moveSet = null; $('moveBar').hidden = true; $('explodeBar').hidden = true; S.explode = 0; S.hidden = new Set(); S.pulled.clear();
    S.sel = -1; A.deselect(); document.getElementById('app').classList.add('quiz');
    S.quiz = { onTap: onQuizTap }; $('quizBar').hidden = false;
    askQuestion();
  }
  const SIL_ON = [1, 0.1, 0.85, 0.9]; let silTimer = null;
  function silentBlink(i) {
    clearInterval(silTimer); let on = true;
    silTimer = setInterval(() => {
      if (!Q || Q.done || Q.cfg.mode !== 'silent' || Q.answered || !Q.qs[Q.idx] || Q.qs[Q.idx].e.i !== i) { clearInterval(silTimer); if (Q && !Q.done && Q.answered && Q.cfg.mode === 'silent') { S.hl = new Map([[i, SIL_ON]]); A.apply(); A.redraw(); } return; }
      on = !on; S.hl = on ? new Map([[i, SIL_ON]]) : null; A.apply(); A.redraw();
    }, 420);
  }
  async function askQuestion() {
    const q = Q.qs[Q.idx]; q.t0 = Date.now(); Q.answered = false; q.opts = null;
    const e = q.e;
    for (const s of SYSTEMS) S.layers[s] = s === e.sys ? 'on' : 'off';
    S.region = null; S.hl = null; S.iso = -1; S.sel = -1;
    await A.ensure(e.sys);
    // use the left/right entry nearest to what the bar says; for a pair pick the exact side
    const target = e;
    q.target = target;
    if (q.type === 'tap') { A.flyRegion(target.reg); }
    else if (Q.cfg.mode === 'silent') { S.iso = -1; S.hl = new Map([[target.i, SIL_ON]]); silentBlink(target.i); A.flyToPart(target); if (A.cam.goal) A.cam.flyTo(A.cam.goal.target, Math.min(3.4, A.cam.goal.dist * 2.6 + 0.4), A.cam.goal.yaw, A.cam.goal.pitch); }
    else { S.iso = target.i; S.hl = new Map([[target.i, [1, 0.78, 0.18, 0.55]]]); A.flyToPart(target); }
    if (q.type !== 'tap') {
      const opts = shuffle([e, ...distractors(e)]); q.opts = opts.map((x) => x.i); q.correctIdx = q.opts.indexOf(e.i);
    }
    A.apply(); renderQuizBar(); ospeStart();
  }
  function renderQuizBar() {
    const bar = $('quizBar'), q = Q.qs[Q.idx], e = q.e, n = Q.qs.length;
    let h = `<div class="qtop"><span dir="ltr">${Q.idx + 1} / ${n}</span>${Q.cfg.mode === 'ospe' ? '' : `<span>${t('score')}: <b>${Q.results.filter((r) => r.ok).length}</b></span>`}</div>
      <div class="qprog"><i style="width:${(Q.idx / n) * 100}%"></i></div>` +
      (Q.cfg.mode === 'ospe' ? `<div class="ospe"><div class="ospe-bar"><i id="ospeB" style="width:${Q.answered ? 0 : 100}%"></i></div><b id="ospeT">${OSPE_SECS}</b></div>` : '');
    if (q.type === 'tap') {
      h += `<div class="qq">${t('qFind')} <span style="color:var(--gold)">${esc(name1(e))}</span><small>${esc(name2(e))}</small></div>`;
    } else if (q.type === 'name') {
      h += `<div class="qq">${t('qName')}</div>`;
    } else {
      h += `<div class="qq">${t('qClue')}<small>${esc(clueOf(e) || '')}</small></div>`;
    }
    if (q.opts) {
      h += '<div class="qopts">' + q.opts.map((i, k) => {
        const x = P[i]; let cls = '';
        if (Q.answered) { if (Q.cfg.mode === 'ospe') cls = k === q.chosen ? 'sel' : ''; else if (k === q.correctIdx) cls = 'ok'; else if (k === q.chosen) cls = 'no'; }
        return `<button type="button" class="${cls}" data-act="qopt" data-k="${k}" ${Q.answered ? 'disabled' : ''}>${esc(base1(x))}</button>`;
      }).join('') + '</div>';
    }
    if (Q.answered && Q.cfg.mode === 'ospe') {
      const r = Q.results[Q.results.length - 1];
      h += `<div class="qfb"><span>${r.timeout ? '⏱ ' + TT('Time is up', 'انتهى الوقت') : '✓ ' + TT('Answer saved', 'تم حفظ إجابتك')}</span></div>`;
    } else if (Q.answered) {
      const r = Q.results[Q.results.length - 1];
      h += `<div class="qfb ${r.ok ? 'ok' : 'no'}"><span>${r.ok ? '✔ ' + t('correct') : '✘ ' + t('wrong') + ' ' + esc(base1(e)) + (r.tapped ? ` (${S.lang === 'ar' ? 'ضغطت على' : 'you tapped'}: ${esc(r.tapped)})` : '')}</span><button class="btn primary" data-act="qnext">${Q.idx + 1 >= n ? t('finish') : t('next')}</button></div>`;
    } else {
      h += `<div class="qrow">${q.type === 'tap' && Q.skips < 3 && Q.spare.length ? `<button class="opt" data-act="qskip">${t('skip')}</button>` : ''}<button class="opt" data-act="qexit">${t('exit')}</button></div>`;
    }
    bar.innerHTML = h;
    requestAnimationFrame(() => document.getElementById('app').style.setProperty('--qh', bar.offsetHeight + 'px'));
  }
  function record(ok, tapped) {
    const q = Q.qs[Q.idx], e = q.e;
    Q.results.push({ i: e.i, id: repOf(e).id, ok, type: q.type, sys: e.sys, reg: e.reg, ms: Date.now() - q.t0, tapped });
    Q.answered = true;
    if (!A.isPremium()) { fq().n++; Store.save(); }
    // spaced repetition feedback
    const s = Store.d.srs, id = repOf(e).id, cur = s[id];
    if (!ok) s[id] = { b: 0, d: dayNo() }; else if (cur) s[id] = { b: Math.min(6, cur.b + 1), d: dayNo() + INTERVALS[Math.min(6, cur.b + 1)] };
    Store.save(); Store.touchDay();
  }
  function onQuizTap(idx) {
    if (!Q || Q.answered || Q.done) return;
    const q = Q.qs[Q.idx]; if (q.type !== 'tap') return;
    if (idx < 0) return;
    const ok = idx === q.e.i;
    if (!ok) { S.hl = new Map([[q.e.i, [1, 0.78, 0.18, 0.7]]]); A.flyToPart(q.e); }
    else { S.hl = new Map([[q.e.i, [0.25, 0.85, 0.5, 0.6]]]); }
    record(ok, ok ? null : base1(P[idx])); A.apply(); renderQuizBar();
  }
  A.acts.qopt = (el) => {
    if (!Q || Q.answered) return; const q = Q.qs[Q.idx]; q.chosen = +el.dataset.k;
    record(q.chosen === q.correctIdx, null); renderQuizBar();
    if (Q.cfg.mode === 'ospe') { ospeStop(); setTimeout(ospeNext, 450); }
  };
  A.acts.qskip = () => {
    if (!Q || Q.answered || !Q.spare.length) return; Q.skips++;
    Q.qs[Q.idx] = Q.spare.shift(); askQuestion();
  };
  A.acts.qnext = () => { if (Q.idx + 1 >= Q.qs.length) finishQuiz(); else { Q.idx++; askQuestion(); } };
  A.acts.qexit = () => { if (Q.results.length >= 3 && !confirm(S.lang === 'ar' ? 'إنهاء الاختبار الآن؟ سيتم احتساب ما أجبت عنه.' : 'End the quiz now? Answered questions will be scored.')) return; if (Q.results.length === 0) { endQuizUI(); return; } finishQuiz(); };
  function endQuizUI() {
    ospeStop();
    $('quizBar').hidden = true; document.getElementById('app').classList.remove('quiz'); S.quiz = null;
    if (prevView) { Object.assign(S.layers, prevView.layers); S.region = prevView.region; S.hidden = prevView.hidden; S.iso = prevView.iso; S.explode = prevView.explode; S.moveSet = prevView.move; }
    S.hl = null; S.sel = -1; A.apply(); A.cam.reset(); A.redraw();
  }
  function finishQuiz() {
    ospeStop(); Q.done = true; const total = Q.results.length, correct = Q.results.filter((r) => r.ok).length;
    const secs = Math.round((Date.now() - Q.t0) / 1000);
    const area = {}; for (const r of Q.results) { const a = (area[r.reg] = area[r.reg] || { c: 0, n: 0 }); a.n++; if (r.ok) a.c++; }
    const sysA = {}; for (const r of Q.results) { const a = (sysA[r.sys] = sysA[r.sys] || { c: 0, n: 0 }); a.n++; if (r.ok) a.c++; }
    const typeA = {}; for (const r of Q.results) { const a = (typeA[r.type] = typeA[r.type] || { c: 0, n: 0 }); a.n++; if (r.ok) a.c++; }
    const prev = Store.d.hist[Store.d.hist.length - 1];
    const rec = { t: Date.now(), n: total, c: correct, s: pct(correct, total), secs, mode: Q.cfg.mode, sys: Q.cfg.sys, reg: Q.cfg.reg, area, sysA, typeA };
    Store.d.hist.push(rec); if (Store.d.hist.length > 60) Store.d.hist.shift(); Store.save(); if (A.checkBadges) setTimeout(A.checkBadges, 300);
    const wrongs = Q.results.filter((r) => !r.ok);
    endQuizUI();
    A.modal(() => resultHtml(rec, prev, wrongs));
  }
  function advice(rec, wrongs) {
    const ar = S.lang === 'ar';
    if (!wrongs.length) return t('perfect');
    const lows = Object.entries(rec.area).filter(([, a]) => a.c < a.n).sort((a, b) => a[1].c / a[1].n - b[1].c / b[1].n || b[1].n - a[1].n);
    const worstReg = lows[0] && lows[0][0];
    const types = Object.entries(rec.typeA).filter(([, a]) => a.c < a.n).sort((a, b) => a[1].c / a[1].n - b[1].c / b[1].n);
    const tip = { tap: ar ? 'تحديد المكان على المجسم (تدرّب بالدوران والتقريب)' : 'locating structures on the model (rotate and zoom more)', name: ar ? 'ربط الشكل بالاسم' : 'matching shapes to names', clue: ar ? 'الوظيفة والتعصيب والمعلومات' : 'functions, nerves and facts' };
    const parts = [];
    if (worstReg) parts.push(ar ? `أضعف منطقة: <b>${t(worstReg)}</b> (${rec.area[worstReg].c}/${rec.area[worstReg].n}).` : `Weakest area: <b>${t(worstReg)}</b> (${rec.area[worstReg].c}/${rec.area[worstReg].n}).`);
    if (types[0]) parts.push(ar ? `ركّز على: ${tip[types[0][0]]}.` : `Focus on: ${tip[types[0][0]]}.`);
    parts.push(ar ? `راجع الأجزاء الـ ${wrongs.length} التي أخطأت فيها — أضفناها لبطاقات المراجعة وستظهر لك أكثر.` : `Review the ${wrongs.length} parts you missed — they were added to your flashcards and will come back more often.`);
    return parts.join('<br>');
  }
  function resultHtml(rec, prev, wrongs) {
    const g = rec.s >= 90 ? 'g_great' : rec.s >= 70 ? 'g_good' : rec.s >= 50 ? 'g_ok' : 'g_low';
    const col = rec.s >= 70 ? 'good' : rec.s >= 50 ? 'mid' : 'bad';
    const d = prev ? rec.s - prev.s : null;
    const mm = Math.floor(rec.secs / 60), ss = rec.secs % 60;
    let h = `<h2>${t('result')}</h2><div class="score-ring"><div><div class="big">${rec.s}%</div><div>${rec.c} / ${rec.n}</div></div><div><b>${t(g)}</b>` +
      (d !== null ? `<div class="delta ${d >= 0 ? 'up' : 'down'}">${d >= 0 ? '▲' : '▼'} ${Math.abs(d)}% ${t('vsPrev')}</div>` : '') + `<div class="lab">${t('timeTaken')}: ${mm}:${String(ss).padStart(2, '0')}</div></div></div>`;
    h += `<div class="bar"><i class="${col}" style="width:${rec.s}%"></i></div>`;
    h += `<h4>${t('byArea')}</h4>` + Object.entries(rec.area).map(([r, a]) => { const p = pct(a.c, a.n); return `<div class="area"><span>${t(r)}</span><div class="bar"><i class="${p >= 70 ? 'good' : p >= 50 ? 'mid' : 'bad'}" style="width:${p}%"></i></div><span>${a.c}/${a.n}</span></div>`; }).join('');
    h += `<h4>${t('improve')}</h4><div class="advice">${advice(rec, wrongs)}</div>`;
    if (wrongs.length) {
      h += `<h4>${t('mistakes')}</h4>` + wrongs.map((r) => { const e = P[r.i]; return `<div class="mist" data-act="mistake" data-i="${r.i}"><span>${esc(name1(e))}<small>${esc(name2(e))}</small></span><small>${t(e.reg)}</small></div>`; }).join('');
    }
    h += `<div class="row" style="margin-top:14px"><button class="btn primary" data-act="qagain">${t('retry')}</button><button class="btn" data-act="hub" data-k="progress">${t('progress')}</button></div>`;
    return h;
  }
  A.acts.mistake = (el) => { A.closeModal(); A.select(+el.dataset.i); };
  A.acts.qagain = () => openQuizSetup();


  /* ───────── OSPE (station exam) ───────── */
  const TT = (en, a) => (S.lang === 'ar' ? a : en);
  const OSPE_SECS = 30;
  let otimer = null;
  function ospeStop() { if (otimer) { clearInterval(otimer); otimer = null; } }
  function ospeStart() {
    ospeStop(); if (!Q || Q.cfg.mode !== 'ospe') return;
    const t0 = Date.now();
    otimer = setInterval(() => {
      if (!Q || Q.answered || Q.done) { ospeStop(); return; }
      const left = Math.max(0, OSPE_SECS - (Date.now() - t0) / 1000), el = document.getElementById('ospeT'), b = document.getElementById('ospeB');
      if (el) { el.textContent = Math.ceil(left); el.classList.toggle('low', left <= 8); }
      if (b) b.style.width = (left / OSPE_SECS) * 100 + '%';
      if (left <= 0) { ospeStop(); ospeTimeout(); }
    }, 200);
  }
  function ospeTimeout() {
    if (!Q || Q.answered || Q.done) return;
    Q.qs[Q.idx].chosen = -1; record(false, null); Q.results[Q.results.length - 1].timeout = true; renderQuizBar();
    setTimeout(ospeNext, 700);
  }
  function ospeNext() {
    if (!Q || Q.done) return;
    if (Q.idx + 1 >= Q.qs.length) finishQuiz(); else { Q.idx++; askQuestion(); }
  }

  /* ───────── review my mistakes ───────── */
  function mistakeIds() { const s = Store.d.srs; return new Set(repList.filter((e) => s[e.id] && s[e.id].b <= 1).map((e) => e.id)); }
  A.acts.qmistakes = () => {
    const ids = mistakeIds();
    if (ids.size < 3) { A.toast(TT('Not enough mistakes yet', 'لا توجد أخطاء كافية بعد')); return; }
    A.closeModal(); startQuiz({ mode: 'mix', sys: 'all', reg: 'all', n: Math.min(15, ids.size), only: ids });
  };

  /* ───────── exam study plan ───────── */
  Object.assign(STR, {
    splan: { en: 'Exam study plan', ar: 'خطة المذاكرة للامتحان' },
    splanSub: { en: 'Pick the exam date, get a daily plan', ar: 'اختر تاريخ الامتحان واحصل على خطة يومية' },
    tcards: { en: 'Special test cards', ar: 'كروت الاختبارات الخاصة' },
    tcardsSub: { en: 'Steps, positive result, related muscles on the model', ar: 'الخطوات والنتيجة الإيجابية والعضلات المرتبطة على المجسم' },
    m_silent: { en: 'Silent image – no labels, in context', ar: 'صورة صامتة – بدون تسميات' },
    nmap: { en: 'Peripheral nerve map', ar: 'خريطة الأعصاب المحيطية' },
    nmapSub: { en: 'If a nerve is cut: weak muscles + sensory loss', ar: 'لو العصب اتقطع: العضلات الضعيفة ومنطقة فقدان الإحساس' },
    calc: { en: 'ROM & MMT calculator', ar: 'حاسبة ROM و MMT' },
    calcSub: { en: 'Record a patient\'s measurements and export a PDF', ar: 'سجّل قياسات مريض واطلع ملف PDF' },
    board: { en: 'Weekly leaderboard', ar: 'متصدرو الأسبوع' },
    boardSub: { en: 'Top 10 students · weekly medals', ar: 'أعلى 10 طلاب · ميداليات أسبوعية' },
    duel: { en: 'Split-screen duel', ar: 'تحدّي على نفس الشاشة' },
    duelSub: { en: 'Two students, one device — first correct tap wins', ar: 'اتنين طلاب وموبايل واحد — أول واحد يجاوب صح ياخد النقطة' },
    m_ospe: { en: 'Practical exam (OSPE) – 30 s per station', ar: 'امتحان عملي (OSPE) – 30 ثانية لكل محطة' },
  });
  const ymd = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const PL = (() => { const p = Store.d.plan; return { date: (p && p.date) || '', sys: (p && p.sys) || ['bone', 'muscle'], msg: '' }; })();
  const savePlan = () => { Store.d.plan = { date: PL.date, sys: PL.sys }; Store.save(); };
  function openPlan() { if (Store.d.plan && Store.d.plan.date && Math.round((new Date(Store.d.plan.date + 'T00:00:00') - new Date(new Date().setHours(0, 0, 0, 0))) / 864e5) >= 2) planView(); else planSetup(); }
  function planSetup() {
    A.modal(() => {
      const tm = new Date(); tm.setDate(tm.getDate() + 2);
      return `<h2>🗓️ ${t('splan')}</h2><p class="lead">${TT('Tell us when your exam is and what it covers. We split the structures you have not marked as learned across the days left, and keep the last days for revision.', 'قولنا امتحانك امتى وبيغطي إيه. هنوزّع التراكيب اللي لسه ما علّمتها «متعلَّمة» على الأيام المتبقية، ونسيب آخر يومين للمراجعة.')}</p>` +
        `<div class="lab">${TT('Exam date', 'تاريخ الامتحان')}</div><input type="date" id="plDate" class="pl-date" min="${ymd(tm)}" value="${esc(PL.date)}">` +
        `<div class="lab">${TT('What does it cover?', 'الامتحان بيغطي إيه؟')}</div><div class="row">` +
        SYSTEMS.map((s) => `<button class="opt ${PL.sys.includes(s) ? 'sel' : ''}" data-act="plsys" data-v="${s}">${t(s)}</button>`).join('') + '</div>' +
        (PL.msg ? `<div class="advice">${esc(PL.msg)}</div>` : '') +
        `<button class="btn primary wide" style="margin-top:12px" data-act="plgo">${TT('Make my plan', 'اعمل الخطة')}</button>`;
    });
  }
  const readDate = () => { const el = document.getElementById('plDate'); if (el && el.value) PL.date = el.value; };
  A.acts.plsys = (el) => { readDate(); const v = el.dataset.v, i = PL.sys.indexOf(v); if (i >= 0) PL.sys.splice(i, 1); else PL.sys.push(v); planSetup(); };
  A.acts.plgo = () => {
    readDate(); PL.msg = '';
    const days = PL.date ? Math.round((new Date(PL.date + 'T00:00:00') - new Date(new Date().setHours(0, 0, 0, 0))) / 864e5) : -1;
    if (!PL.date) PL.msg = TT('Pick the exam date first.', 'اختر تاريخ الامتحان أولاً.');
    else if (days < 2) PL.msg = TT('The exam must be at least 2 days away.', 'لازم يكون الامتحان بعد يومين على الأقل.');
    else if (!PL.sys.length) PL.msg = TT('Pick at least one system.', 'اختر جهازاً واحداً على الأقل.');
    if (PL.msg) { planSetup(); return; }
    savePlan(); planView();
  };
  A.acts.pledit = () => planSetup();
  A.acts.pldel = () => { if (!confirm(TT('Delete the plan?', 'حذف الخطة؟'))) return; delete Store.d.plan; Store.save(); PL.date = ''; PL.msg = ''; planSetup(); };
  let PLAN = null;
  function buildPlan() {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const D = Math.round((new Date(PL.date + 'T00:00:00') - today) / 864e5);
    const learned = Store.d.learned || {};
    const items = [];
    for (const s of SYSTEMS) if (PL.sys.includes(s)) for (const r of REGIONS) for (const e of repList) if (e.sys === s && e.reg === r && !learned[e.id]) items.push(e);
    const rev = D >= 5 ? 2 : D >= 3 ? 1 : 0, sd = D - rev, per = Math.max(1, Math.ceil(items.length / sd));
    const out = [];
    for (let i = 0; i < D; i++) {
      const d = new Date(today); d.setDate(d.getDate() + i);
      if (i < sd) {
        const part = items.slice(i * per, (i + 1) * per), g = new Map();
        for (const e of part) { const k = e.sys + '|' + e.reg; g.set(k, (g.get(k) || 0) + 1); }
        out.push({ d, kind: 'study', ids: part.map((e) => e.id), groups: [...g].map(([k, n]) => ({ sys: k.split('|')[0], reg: k.split('|')[1], n })) });
      } else out.push({ d, kind: 'rev', ids: [], groups: [] });
    }
    const scope = new Set(repList.filter((e) => PL.sys.includes(e.sys)).map((e) => e.id));
    return { D, per, total: items.length, days: out, scope };
  }
  function planView() {
    PLAN = buildPlan();
    A.modal(() => {
      const p = PLAN, loc = S.lang === 'ar' ? 'ar-EG' : 'en-GB';
      const fd = (d, o) => d.toLocaleDateString(loc, o || { weekday: 'long', day: 'numeric', month: 'short' });
      let h = `<h2>🗓️ ${t('splan')}</h2><div class="stat3"><div><b>${p.D}</b><small>${TT('days left', 'يوم متبقي')}</small></div><div><b>${p.total}</b><small>${TT('structures to learn', 'تركيب للمذاكرة')}</small></div><div><b>${p.total ? p.per : 0}</b><small>${TT('per day', 'في اليوم')}</small></div></div>`;
      h += `<p class="lead">${TT('Exam', 'الامتحان')}: <b>${fd(new Date(PL.date + 'T00:00:00'), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</b> · ${PL.sys.map((s) => t(s)).join(' · ')}</p>`;
      if (p.per > 60) h += `<div class="advice">⚠️ ${TT('That is a heavy daily load. Consider a closer scope or an earlier start.', 'ده حمل يومي تقيل. فكّر تقلّل المواد أو تبدأ بدري.')}</div>`;
      p.days.forEach((x, i) => {
        const today = i === 0, lines = x.kind === 'rev' ? TT('Revision day: mixed quiz + your mistakes', 'يوم مراجعة: اختبار شامل + الأخطاء') : (x.groups.length ? x.groups.map((g) => `${t(g.sys)} – ${t(g.reg)} (${g.n})`).join(' · ') : TT('Nothing left to learn ✓', 'مفيش حاجة متبقية ✓'));
        h += `<div class="plday ${today ? 'today' : ''} ${x.kind}"><div class="pd-h"><b>${today ? TT('Today', 'النهارده') + ' · ' : ''}${fd(x.d)}</b>${x.kind === 'rev' ? '<span class="tag">🔁</span>' : `<small>${x.ids.length}</small>`}</div><div class="pd-t">${esc(lines)}</div>`;
        if (today || x.kind === 'rev') h += `<div class="row">${x.kind === 'study' && x.ids.length ? `<button class="btn" data-act="plstudy" data-d="${i}">📖 ${TT('Study on the model', 'ذاكر على المجسم')}</button><button class="btn" data-act="plquiz" data-d="${i}">🎯 ${TT('Quiz me', 'اختبرني')}</button>` : ''}${x.kind === 'rev' ? `<button class="btn" data-act="plquiz" data-d="${i}">🎯 ${TT('Full quiz', 'اختبار شامل')}</button><button class="btn" data-act="qmistakes">🔁 ${TT('My mistakes', 'أخطائي')}</button>` : ''}</div>`;
        h += '</div>';
      });
      h += `<div class="row" style="margin-top:14px"><button class="btn" data-act="pledit">${TT('Edit', 'تعديل')}</button><button class="btn danger" data-act="pldel">${TT('Delete plan', 'حذف الخطة')}</button></div>`;
      return h;
    });
  }
  A.acts.plquiz = (el) => {
    const x = PLAN && PLAN.days[+el.dataset.d]; if (!x) return;
    const ids = new Set(x.kind === 'rev' ? PLAN.scope : x.ids);
    if (ids.size < 4) { A.toast(TT('Not enough structures', 'التراكيب غير كافية')); return; }
    A.closeModal(); startQuiz({ mode: 'mix', sys: 'all', reg: 'all', n: Math.min(15, ids.size), only: ids });
  };
  A.acts.plstudy = async (el) => {
    const x = PLAN && PLAN.days[+el.dataset.d]; if (!x || !x.ids.length) return;
    const set = new Set(x.ids), sys = new Set(x.groups.map((g) => g.sys)), regs = new Set(x.groups.map((g) => g.reg));
    for (const s of SYSTEMS) S.layers[s] = sys.has(s) ? 'on' : 'off';
    A.closeModal();
    for (const s of sys) await A.ensure(s);
    S.hl = new Map(); for (const e of P) if (set.has(repOf(e).id)) S.hl.set(e.i, [0.25, 0.85, 0.5, 0.45]);
    S.region = regs.size === 1 ? [...regs][0] : null;
    A.apply(); if (S.region) A.flyRegion(S.region); else A.cam.reset(); A.redraw();
    A.toast(TT('Highlighted: today\'s structures. Tap each one and mark it learned.', 'اتعلّمت بالأخضر تراكيب النهارده. دوس على كل واحد وعلّمه «متعلَّم».'), 5200);
  };

  /* ───────── FLASHCARDS ───────── */
  const CC = { sys: 'all', reg: 'all' };
  let deck = null;
  function buildDeck() {
    const today = dayNo(), srs = Store.d.srs;
    const pool = repList.filter((e) => inScope(e, CC) && (!e.lk || A.isPremium()));
    const due = pool.filter((e) => srs[e.id] && srs[e.id].d <= today);
    const fresh = shuffle(pool.filter((e) => !srs[e.id])).slice(0, 10);
    return { due, fresh };
  }
  function openCardsSetup() {
    A.modal(() => {
      const { due, fresh } = buildDeck();
      return `<h2>${t('cardsSetup')}</h2><p class="lead">${t('cardsSub')}</p>${scopeRow(CC, 'ccfg')}` +
        `<div class="stat3"><div><b>${due.length}</b><small>${t('dueNow')}</small></div><div><b>${fresh.length}</b><small>${t('newCards')}</small></div><div><b>${Object.keys(Store.d.srs).length}</b><small>${t('cards')}</small></div></div>` +
        `<button class="btn primary wide" data-act="cstart" ${due.length + fresh.length ? '' : 'disabled'}>${t('start')}</button>` + (due.length + fresh.length ? '' : `<p class="lead">${t('noCards')}</p>`);
    });
  }
  A.acts.ccfg = (el) => { CC[el.dataset.k] = el.dataset.v; openCardsSetup(); };
  A.acts.cstart = () => { const { due, fresh } = buildDeck(); deck = { q: shuffle([...due, ...fresh]), total: due.length + fresh.length, done: 0, back: false, again: 0 }; showCard(); };
  function showCard() { A.modal(cardHtml); }
  function cardHtml() {
    if (!deck.q.length && deck.daily) return dailyDoneHtml();
    if (!deck.q.length) return `<h2>${t('cardDone')}</h2><div class="card3"><div class="nm">🎉</div><div>${deck.done} ${t('cards')}</div></div><div class="row" style="margin-top:14px"><button class="btn primary" data-act="hub" data-k="cards">${t('cards')}</button></div>`;
    const e = deck.q[0];
    let h = `<h2>${deck.daily ? '🔥 ' + TT('Today\'s session', 'جلسة اليوم') : t('cards')}</h2><div class="qtop"><span dir="ltr">${deck.done} / ${deck.total}</span><span>${t(e.reg)} · ${t('kind_' + e.k)}</span></div><div class="qprog"><i style="width:${pct(deck.done, deck.total)}%"></i></div>`;
    h += `<div class="card3"><div class="nm">${esc(base1(e))}</div>`;
    if (!deck.back) h += `<div class="lead">${t('whatIsThis')}</div></div><button class="btn primary wide" style="margin-top:12px" data-act="cflip">${t('showAnswer')}</button>`;
    else {
      h += `<div class="nm2">${esc(S.lang === 'ar' ? e.baseEn : e.baseAr)}</div><div class="bk">`;
      if (e.mu) h += `<p><b>${t('origin')}:</b> ${esc(L([e.mu[0], e.mu[1]]))}</p><p><b>${t('insertion')}:</b> ${esc(L([e.mu[2], e.mu[3]]))}</p><p><b>${t('action')}:</b> ${esc(L([e.mu[4], e.mu[5]]))}</p><p><b>${t('nerve')}:</b> ${esc(L([e.mu[6], e.mu[7]]))}</p>`;
      else { if (e.sum) h += `<p>${esc(L(e.sum))}</p>`; if (e.facts && e.facts[0]) h += `<p>• ${esc(L(e.facts[0]))}</p>`; }
      h += `</div></div><div class="rate"><button class="btn a" data-act="crate" data-r="0">${t('again')}</button><button class="btn g" data-act="crate" data-r="1">${t('good')}</button><button class="btn e" data-act="crate" data-r="2">${t('easy')}</button></div>` +
        `<div class="row" style="margin-top:10px"><button class="opt" data-act="cshow">${t('showIn3d')}</button></div>`;
    }
    return h;
  }
  A.acts.cflip = () => { deck.back = true; showCard(); };
  A.acts.cshow = () => { const e = deck.q[0]; A.closeModal(); A.select(e.i); };
  A.acts.crate = (el) => {
    const r = +el.dataset.r, e = deck.q.shift(), s = Store.d.srs, cur = s[e.id] || { b: 0 };
    if (r === 0) { if (deck.missed) deck.missed.add(e.id); s[e.id] = { b: 0, d: dayNo() }; if (deck.again < 25) { deck.again++; deck.q.push(e); } else deck.done++; }
    else { const b = Math.min(6, cur.b + (r === 2 ? 2 : 1)); s[e.id] = { b, d: dayNo() + INTERVALS[b] }; deck.done++; Store.d.learned[e.id] = Store.d.learned[e.id] || (b >= 3 ? 1 : 0); if (!Store.d.learned[e.id]) delete Store.d.learned[e.id]; }
    Store.save(); Store.touchDay(); deck.back = false; showCard();
  };


  /* ───────── daily session ───────── */
  Object.assign(STR, {
    daily: { en: 'Today\'s session', ar: 'جلسة اليوم' },
    dailySub: { en: '10 minutes: review, mistakes, new parts', ar: '10 دقايق: مراجعة وأخطاء وأجزاء جديدة' },
  });
  const dsDays = () => { const d = Store.d; if (!Array.isArray(d.dsDays)) d.dsDays = []; return d.dsDays; };
  function dsStreak() {
    const a = dsDays(), t0 = dayNo(); let n = 0, d = a.includes(t0) ? t0 : t0 - 1;
    while (a.includes(d)) { n++; d--; }
    return n;
  }
  function buildDaily() {
    const today = dayNo(), srs = Store.d.srs;
    const pool = repList.filter((e) => (!e.lk || A.isPremium()));
    const byOld = (a, b) => srs[a.id].d - srs[b.id].d;
    const mist = pool.filter((e) => srs[e.id] && srs[e.id].b === 0).sort(byOld);
    const rev = pool.filter((e) => srs[e.id] && srs[e.id].b >= 1 && srs[e.id].d <= today).sort(byOld);
    let fresh = shuffle(pool.filter((e) => !srs[e.id]));
    if (fresh.length) { const f = fresh[0]; fresh = [f, ...fresh.slice(1).filter((x) => x.reg === f.reg && x.sys === f.sys), ...fresh.slice(1).filter((x) => !(x.reg === f.reg && x.sys === f.sys))]; }
    const pick = { m: mist.slice(0, 3), r: rev.slice(0, 5), n: fresh.slice(0, 4) };
    let left = 12 - pick.m.length - pick.r.length - pick.n.length;
    if (left > 0) { pick.r.push(...rev.slice(5, 5 + left)); left = 12 - pick.m.length - pick.r.length - pick.n.length; }
    if (left > 0) { pick.m.push(...mist.slice(3, 3 + left)); left = 12 - pick.m.length - pick.r.length - pick.n.length; }
    if (left > 0) pick.n.push(...fresh.slice(pick.n.length, pick.n.length + left));
    return pick;
  }
  function openDaily() {
    A.modal(() => {
      const st = dsStreak(), doneToday = dsDays().includes(dayNo()), p = buildDaily(), tot = p.m.length + p.r.length + p.n.length;
      const resume = deck && deck.daily && deck.day === dayNo() && deck.q.length;
      let dots = ''; for (let i = 6; i >= 0; i--) dots += `<span style="display:inline-block;width:26px;height:26px;line-height:26px;border-radius:50%;margin:0 3px;font-size:13px;background:${dsDays().includes(dayNo() - i) ? '#2e9d5b' : 'rgba(128,128,128,.25)'}">${dsDays().includes(dayNo() - i) ? '✓' : ''}</span>`;
      let h = `<h2>🔥 ${TT('Today\'s session', 'جلسة اليوم')}</h2><div class="card3"><div class="nm">${st} ${TT('day streak', 'يوم متتالي')} 🔥</div><div style="margin-top:8px" dir="ltr">${dots}</div></div>`;
      if (doneToday) h += `<div class="advice">✅ ${TT('You finished today\'s session. See you tomorrow!', 'خلّصت جلسة النهاردة. نشوفك بكرة!')}</div>`;
      h += `<div class="stat3"><div><b>${p.r.length}</b><small>${TT('review', 'مراجعة')}</small></div><div><b>${p.m.length}</b><small>${TT('mistakes', 'أخطاء')}</small></div><div><b>${p.n.length}</b><small>${TT('new', 'جديد')}</small></div></div>`;
      if (resume) h += `<button class="btn primary wide" data-act="dresume">▶ ${TT('Continue session', 'كمّل الجلسة')} (${deck.q.length})</button>`;
      else if (tot) h += `<button class="btn primary wide" data-act="dstart">▶ ${doneToday ? TT('Another session', 'جلسة تانية') : TT('Start today\'s session', 'ابدأ جلسة اليوم')}</button><p class="tiny">${TT('About ' + Math.max(3, Math.round(tot * 0.8)) + ' minutes', 'حوالي ' + Math.max(3, Math.round(tot * 0.8)) + ' دقايق')}</p>`;
      else h += `<p class="lead">${TT('Nothing to review yet.', 'مفيش حاجة للمراجعة لسه.')}</p>`;
      return h;
    });
  }
  A.acts.dstart = () => {
    const p = buildDaily(), q = [...shuffle(p.r), ...shuffle(p.m), ...p.n], mixed = shuffle(q.slice(0, q.length - p.n.length)).concat(q.slice(q.length - p.n.length));
    if (!mixed.length) return;
    deck = { q: mixed, total: mixed.length, done: 0, back: false, again: 0, daily: true, day: dayNo(), missed: new Set(), fin: false, c: { r: p.r.length, m: p.m.length, n: p.n.length } };
    showCard();
  };
  A.acts.dresume = () => showCard();
  function dailyDoneHtml() {
    if (!deck.fin) { deck.fin = true; const a = dsDays(), d = dayNo(); if (!a.includes(d)) { a.push(d); a.sort((x, y) => x - y); if (a.length > 400) a.shift(); } Store.save(); Store.touchDay(); }
    const ok = deck.total - deck.missed.size, st = dsStreak();
    return `<h2>✅ ${TT('Session complete', 'خلّصت جلسة اليوم')}</h2><div class="card3"><div class="nm">🎉</div><div>${TT('Correct', 'صح')} ${ok} ${TT('of', 'من')} ${deck.total}</div><div style="margin-top:6px">🔥 ${st} ${TT('day streak', 'يوم متتالي')}</div></div>` +
      (deck.missed.size ? `<p class="lead">${TT(deck.missed.size + ' part(s) will come back in your next session.', deck.missed.size + ' جزء هيرجعولك في الجلسة الجاية.')}</p>` : '') +
      `<div class="row" style="margin-top:14px"><button class="btn primary" data-act="hub" data-k="daily">🔥 ${TT('Back', 'رجوع')}</button></div>`;
  }


  /* ───────── exam readiness ───────── */
  Object.assign(STR, {
    ready: { en: 'Exam readiness', ar: 'جاهزيتي للامتحان' },
    readySub: { en: 'Your % per system — aim for 90%', ar: 'نسبتك في كل نظام — الهدف 90%' },
  });
  const STRN = [0, 0.3, 0.5, 0.7, 0.85, 1, 1];
  function readiness() {
    const st = Store.d, out = {};
    const hist = st.hist.slice(-8);
    for (const sy of SYSTEMS) {
      const items = repList.filter((e) => e.sys === sy && (!e.lk || A.isPremium()));
      if (!items.length) continue;
      let sum = 0, got = 0;
      for (const e of items) { const r = st.srs[e.id]; const v = r ? STRN[Math.min(6, r.b)] : st.learned[e.id] ? 0.5 : 0; sum += v; if (r || st.learned[e.id]) got++; }
      const mast = sum / items.length; let c = 0, n = 0;
      for (const h of hist) { const a = h.sysA && h.sysA[sy]; if (a) { c += a.c; n += a.n; } }
      const pc = n >= 8 ? Math.round((0.65 * mast + 0.35 * (c / n)) * 100) : Math.round(mast * 100);
      out[sy] = { p: Math.min(100, pc), n: items.length, got, need: Math.max(0, Math.ceil((0.9 - mast) * items.length)) };
    }
    return out;
  }
  function openReady() {
    A.modal(() => {
      const R = readiness(), pl = Store.d.plan, keys = Object.keys(R);
      const sel = pl && pl.sys && pl.sys.some((x) => R[x]) ? pl.sys.filter((x) => R[x]) : keys.filter((x) => R[x].got > 0);
      const list = sel.length ? sel : keys.filter((x) => ['bone', 'muscle'].includes(x));
      const tot = list.length ? Math.round(list.reduce((a, k) => a + R[k].p, 0) / list.length) : 0;
      let days = null; if (pl && pl.date) days = Math.round((new Date(pl.date + 'T00:00:00') - new Date(new Date().setHours(0, 0, 0, 0))) / 864e5);
      const col = (p) => p >= 90 ? 'var(--good)' : p >= 60 ? 'var(--gold)' : 'var(--bad)';
      let h = `<h2>📊 ${t('ready')}</h2><div class="card3"><div class="nm" style="font-size:44px;color:${col(tot)}">${tot}%</div><div>${TT('Overall readiness', 'جاهزيتك الكلية')}</div>` +
        (days !== null && days >= 0 ? `<div style="margin-top:6px">⏳ ${days} ${TT('day(s) to the exam', 'يوم على الامتحان')}</div>` : '') + '</div>';
      h += `<div class="area" style="opacity:.7"><span></span><div class="bar" style="position:relative"><i style="width:0"></i><b style="position:absolute;inset-inline-start:90%;top:-2px;bottom:-2px;width:2px;background:var(--gold)"></b></div><span>90%</span></div>`;
      for (const k of keys) { const o = R[k]; h += `<div class="area"><span>${t(k)}</span><div class="bar"><i style="width:${o.p}%;background:${col(o.p)}"></i></div><span>${o.p}%</span></div>`; }
      const weak = list.slice().sort((a, b) => R[a].p - R[b].p)[0];
      if (weak && R[weak].p < 90) h += `<div class="advice">🎯 ${TT('Weakest: ', 'أضعف نظام: ')}<b>${t(weak)}</b> (${R[weak].p}%) — ${TT('master about ' + R[weak].need + ' more part(s) to reach 90%.', 'محتاج تتقن حوالي ' + R[weak].need + ' جزء كمان عشان توصل 90%.')}</div>`;
      else if (weak) h += `<div class="advice">🏆 ${TT('You are above 90% — exam ready!', 'فوق 90% — جاهز للامتحان!')}</div>`;
      if (days !== null && days >= 1 && weak && R[weak].need) h += `<p class="tiny">${TT('About ' + Math.ceil(R[weak].need / days) + ' part(s)/day to get there in time.', 'يعني حوالي ' + Math.ceil(R[weak].need / days) + ' جزء في اليوم عشان تلحق.')}</p>`;
      h += `<p class="tiny">${TT('Based on your flashcards, quizzes and learned parts.', 'محسوبة من بطاقات المراجعة والاختبارات وما علّمته متعلَّم.')}</p>`;
      h += `<div class="row" style="margin-top:12px"><button class="btn primary" data-act="hub" data-k="daily">🔥 ${TT('Today\'s session', 'جلسة اليوم')}</button><button class="btn" data-act="readysh" data-t="${tot}" data-w="${weak || ''}">📤 ${TT('Share on WhatsApp', 'شارك على واتساب')}</button></div>`;
      return h;
    });
  }
  A.acts.readysh = (el) => {
    const p = el.dataset.t;
    const msg = S.lang === 'ar' ? `أنا جاهز ${p}% للامتحان على Anatovia 🧠\nجرّب تشوف نسبتك: https://ibrahimsaeed11.github.io/Anatovia/` : `I'm ${p}% ready for my anatomy exam on Anatovia 🧠\nCheck your own score: https://ibrahimsaeed11.github.io/Anatovia/`;
    window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank', 'noopener');
  };

  /* ───────── MOVEMENT FINDER ───────── */
  const GROUP_NAMES = { shoulder: ['Shoulder', 'الكتف'], scap: ['Scapula', 'اللوح'], elbow: ['Elbow', 'المرفق'], forearm: ['Forearm', 'الساعد'], wrist: ['Wrist', 'الرسغ'], finger: ['Hand', 'اليد'], thumb: ['Hand', 'اليد'], hip: ['Hip', 'الورك'], knee: ['Knee', 'الركبة'], ankle: ['Ankle & foot', 'الكاحل والقدم'], foot: ['Ankle & foot', 'الكاحل والقدم'], trunk: ['Trunk', 'الجذع'], neck: ['Neck & jaw', 'الرقبة والفك'], jaw: ['Neck & jaw', 'الرقبة والفك'], breath: ['Breathing', 'التنفس'] };
  function openMoves() {
    A.modal(() => {
      const groups = []; const idx = {};
      for (const m of MOVES) { const g = GROUP_NAMES[m.id.split('_')[0]]; const key = g[0]; if (!(key in idx)) { idx[key] = groups.length; groups.push({ g, list: [] }); } groups[idx[key]].list.push(m); }
      return `<h2>${t('moves')}</h2><p class="lead">${t('movesSub')}</p>` + groups.map((gr) => `<div class="mgroup">${S.lang === 'ar' ? gr.g[1] : gr.g[0]}</div><div class="row">` + gr.list.map((m) => `<button class="opt" data-act="mv" data-id="${m.id}">${esc(S.lang === 'ar' ? m.ar : m.en)}</button>`).join('') + '</div>').join('');
    });
  }
  let moveSaved = null;
  A.startMove = async (id) => {
    const m = MOVES.find((x) => x.id === id); if (!m) return;
    A.closeModal(); S.sel = -1; A.deselect();
    if (!moveSaved) moveSaved = { ...S.layers };
    S.layers.muscle = 'on'; S.layers.bone = 'ghost'; S.layers.vessel = 'off'; S.layers.organ = 'off';
    await A.ensure('muscle'); await A.ensure('bone');
    S.moveSet = new Set(m.m); S.moveId = id; S.region = null; S.iso = -1;
    const first = P.find((e) => e.sys === 'muscle' && m.m.includes(e.grp));
    A.apply(); if (first) A.flyRegion(first.reg);
    const bar = $('moveBar'); bar.hidden = false;
    bar.innerHTML = `<div class="t"><span>${esc(S.lang === 'ar' ? m.ar : m.en)}</span><button class="mini" data-act="moveclear">✕ ${t('clear')}</button></div><div class="pills" style="width:100%">` +
      m.m.map((g) => { const e = P.find((x) => x.sys === 'muscle' && x.grp === g && x.side !== 'l'); return e ? `<span class="pill" data-act="movepick" data-i="${e.i}">${esc(base1(e))}</span>` : ''; }).join('') + '</div>';
  };
  A.clearMove = (silent) => {
    S.moveSet = null; S.moveId = null; $('moveBar').hidden = true;
    if (moveSaved) { Object.assign(S.layers, moveSaved); moveSaved = null; }
    if (!silent) A.apply();
  };
  A.acts.mv = (el) => A.startMove(el.dataset.id);
  A.acts.moveclear = () => A.clearMove();
  A.acts.movepick = (el) => A.select(+el.dataset.i);

  /* ───────── PROGRESS ───────── */
  function learnedStats() {
    const st = Store.d, by = { sys: {}, reg: {} }; let L1 = 0;
    const learnedKeys = new Set(); for (const e of P) if (st.learned[e.id]) learnedKeys.add(repKey(e));
    for (const e of repList) {
      const got = learnedKeys.has(repKey(e)) ? 1 : 0; L1 += got;
      for (const [d, k] of [['sys', e.sys], ['reg', e.reg]]) { const o = (by[d][k] = by[d][k] || { c: 0, n: 0 }); o.n++; o.c += got; }
    }
    return { by, learned: L1, total: repList.length };
  }
  function openProgress() {
    A.modal(() => {
      const st = Store.d, ls = learnedStats(), hist = st.hist, last = hist.slice(-12);
      const avg = hist.length ? Math.round(hist.reduce((a, b) => a + b.s, 0) / hist.length) : 0;
      let h = `<h2>${t('progress')}</h2><div class="stat3"><div><b>🔥 ${Store.streak()}</b><small>${t('streak')}</small></div><div><b>${ls.learned}</b><small>${t('learnedParts')}</small></div><div><b>${hist.length}</b><small>${t('quizzes')}${hist.length ? ' · ' + avg + '%' : ''}</small></div></div>`;
      h += `<h4>${t('learnedParts')} (${ls.learned}/${ls.total})</h4>`;
      for (const s of SYSTEMS) { const o = ls.by.sys[s] || { c: 0, n: 0 }; h += `<div class="area"><span>${t(s)}</span><div class="bar"><i style="width:${pct(o.c, o.n)}%"></i></div><span>${o.c}/${o.n}</span></div>`; }
      h += `<h4>${t('byArea')}</h4>`;
      for (const r of REGIONS) { const o = ls.by.reg[r] || { c: 0, n: 0 }; h += `<div class="area"><span>${t(r)}</span><div class="bar"><i style="width:${pct(o.c, o.n)}%"></i></div><span>${o.c}/${o.n}</span></div>`; }
      h += `<h4>${t('history')}</h4>`;
      if (!hist.length) h += `<p class="lead">${t('noHistory')}</p>`;
      else {
        h += `<div class="hist">` + last.map((x) => `<i title="${x.s}%" style="height:${Math.max(4, x.s)}%;background:var(--${x.s >= 70 ? 'good' : x.s >= 50 ? 'gold' : 'bad'})"></i>`).join('') + '</div>';
        const agg = {}; for (const x of hist) for (const [r, a] of Object.entries(x.area || {})) { const o = (agg[r] = agg[r] || { c: 0, n: 0 }); o.c += a.c; o.n += a.n; }
        const weak = Object.entries(agg).filter(([, a]) => a.n >= 2).sort((a, b) => a[1].c / a[1].n - b[1].c / b[1].n).slice(0, 3);
        if (weak.length) h += `<div class="advice"><b>${t('focusOn')}:</b> ` + weak.map(([r, a]) => `${t(r)} (${pct(a.c, a.n)}%)`).join(' · ') + '</div>';
      }
      h += `<div class="row" style="margin-top:12px"><button class="btn primary" data-act="hub" data-k="quiz">${t('quiz')}</button>${A.reportReady ? `<button class="btn" data-act="report">📄 ${S.lang === 'ar' ? 'تقرير PDF' : 'PDF report'}</button>` : ''}<button class="btn danger" data-act="resetprog">${t('resetProgress')}</button></div>`;
      return h;
    });
  }
  A.acts.resetprog = () => { if (confirm(t('confirmReset'))) { Store.reset(); const lang = S.lang, th = S.theme; Store.d.lang = lang; Store.d.theme = th; Store.save(); A.renderPanel && S.sel >= 0 && A.renderPanel(); openProgress(); } };

  /* ───────── FAVOURITES & NOTES ───────── */
  function openFavs() {
    A.modal(() => {
      const st = Store.d, ids = new Set([...Object.keys(st.fav), ...Object.keys(st.notes)]);
      const list = P.filter((e) => ids.has(e.id));
      if (!list.length) return `<h2>${t('favs')}</h2><p class="lead">${t('noFavs')}</p>`;
      return `<h2>${t('favs')}</h2>` + list.map((e) => `<div class="mist" data-act="mistake" data-i="${e.i}"><span>${st.fav[e.id] ? '★ ' : ''}${esc(name1(e))}<small>${esc(name2(e))}${st.notes[e.id] ? ' — 📝 ' + esc(st.notes[e.id].slice(0, 60)) : ''}</small></span><small>${t(e.reg)}</small></div>`).join('');
    });
  }

  /* ───────── ABOUT ───────── */
  function openAbout() {
    A.modal(() => `<div style="text-align:center"><img src="icons/icon-192.png" alt="Anatovia" width="84" height="84" style="border-radius:20px"><h2 style="margin:8px 0 0">Anatovia</h2></div><p class="lead">${t('tagline')}</p>` +
      `<div class="row">${A.deferredPrompt ? `<button class="btn primary" data-act="doinstall">${t('install')}</button>` : ''}<button class="btn" data-act="offline" id="offBtn">${t('offline')}</button></div><p class="lead">${t('installHelp')}</p>` +
      `<h4>${S.lang === 'ar' ? 'تواصل معنا' : 'Contact us'}</h4>${contactHtml()}` +
      `<h4>${t('importantNotes')}</h4><div class="pt">${t('limits')}</div><h4>BodyParts3D</h4><p class="pn-sum">${t('credits')}</p>` +
      `<p class="lead" style="font-size:12px">${P.length} parts · v7</p>`);
  }
  A.acts.doinstall = async () => { const p = A.deferredPrompt; if (!p) return; p.prompt(); try { await p.userChoice; } catch (e) { /* ignore */ } A.deferredPrompt = null; A.rerenderModal(); };
  A.acts.offline = async (el) => {
    el.disabled = true; el.textContent = '…';
    try { for (const s of SYSTEMS) { await A.ensure(s); } A.toast(t('offlineDone'), 4000); el.textContent = '✓ ' + t('offlineDone'); } catch (e) { el.textContent = '✕'; el.disabled = false; }
  };
  A.onLang = () => { if (Q && !Q.done && S.quiz) renderQuizBar(); };
  A.quizApi = { startQuiz, get Q() { return Q; }, finishQuiz, clueOf, repList };
  if (window.__anat) window.__anat.study = A.quizApi;
  /* tour.js is injected from here so a stale index.html can never leave the Study button dead */
  Object.assign(STR, { tour: { en: 'How to use', ar: 'شرح الاستخدام' }, tourSub: { en: 'A quick tour of the app', ar: 'جولة سريعة تعرّفك على التطبيق' } });
  if (!window.__fprofLoaded) { const sc14 = document.createElement('script'); sc14.src = 'fprof.js'; document.body.appendChild(sc14); }
  if (!window.__tooth3dLoaded) { const sc15 = document.createElement('script'); sc15.src = 'tooth3d.js'; document.body.appendChild(sc15); }
  if (!window.__dentLoaded) { const sc13 = document.createElement('script'); sc13.src = 'dental.js'; document.body.appendChild(sc13); }
  if (!window.__motionLoaded) { const sc12 = document.createElement('script'); sc12.src = 'motion.js'; document.body.appendChild(sc12); }
  if (!window.__extrasLoaded) { const sc11 = document.createElement('script'); sc11.src = 'extras.js'; document.body.appendChild(sc11); }
  if (!window.__nbLoaded) { const sc10 = document.createElement('script'); sc10.src = 'notebook.js'; document.body.appendChild(sc10); }
  if (!window.__voxLoaded) { const sc9 = document.createElement('script'); sc9.src = 'voice.js'; document.body.appendChild(sc9); }
  if (!window.__duelLoaded) { const sc8 = document.createElement('script'); sc8.src = 'duel.js'; document.body.appendChild(sc8); }
  if (!window.__boardLoaded) { const sc7 = document.createElement('script'); sc7.src = 'board.js'; document.body.appendChild(sc7); }
  if (!window.__calcLoaded) { const sc6 = document.createElement('script'); sc6.src = 'calc.js'; document.body.appendChild(sc6); }
  if (!window.__nervesLoaded) { const sc5 = document.createElement('script'); sc5.src = 'nerves.js'; document.body.appendChild(sc5); }
  if (!window.__testsLoaded) { const sc4 = document.createElement('script'); sc4.src = 'tests.js'; document.body.appendChild(sc4); }
  if (!window.__tourLoaded) { const sc = document.createElement('script'); sc.src = 'tour.js'; document.body.appendChild(sc); }
  if (!window.__reportLoaded) { const sc3 = document.createElement('script'); sc3.src = 'report.js'; document.body.appendChild(sc3); }
  if (!window.__shareLoaded) { const sc2 = document.createElement('script'); sc2.src = 'share.js'; document.body.appendChild(sc2); }
})();
