/* dental.js — standalone quiz for dentistry students: only teeth are shown (permanent / deciduous), FDI numbering,
   tap-the-tooth, name-the-tooth, number→tooth and tooth→number questions. Self-contained: it reuses the quiz bar and
   the quiz tap hook but none of the anatomy-quiz internals. */
'use strict';
window.__dentLoaded = true;
(function () {
  const T = (en, ar) => (S.lang === 'ar' ? ar : en);
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0);
  const waitFor = (fn, cb) => { const t0 = setInterval(() => { if (fn()) { clearInterval(t0); cb(); } }, 200); setTimeout(() => clearInterval(t0), 20000); };

  Object.assign(STR, {
    dent: { en: 'Dentistry', ar: 'أسنان' },
    dentSub: { en: 'Teeth quizzes: FDI numbers, names, permanent & deciduous', ar: 'اختبارات الأسنان: أرقام FDI والأسماء، دائمة ولبنية' },
  });

  /* ───────── tooth helpers ───────── */
  const GROUPS = { incisor: ['Incisors', 'قواطع'], canine: ['Canines', 'أنياب'], premolar: ['Premolars', 'ضواحك'], molar: ['Molars', 'أضراس'] };
  const jawOf = (e) => (e.id.includes('_upper_') ? 'up' : 'lo');
  const groupOf = (e) => (/incisor/.test(e.id) ? 'incisor' : /canine/.test(e.id) ? 'canine' : /premolar/.test(e.id) ? 'premolar' : 'molar');
  const teeth = () => P.filter((e) => e.k === 'tooth' && e.fdi);
  const nm = (e) => (S.lang === 'ar' ? e.ar : e.en).replace(/\s*\(FDI \d+\)/, '');
  const nm2 = (e) => (S.lang === 'ar' ? e.en : e.ar).replace(/\s*\(FDI \d+\)/, '');

  /* ───────── config + state ───────── */
  const D = () => (Store.d.dent = Store.d.dent || { hist: [], wrong: {}, cfg: null });
  const DC = Object.assign({ mode: 'mix', den: 'perm', jaw: 'all', grp: 'all', n: 10 }, (Store.d.dent && Store.d.dent.cfg) || {});
  let Qd = null, prev = null;

  const pool = (cfg) => teeth().filter((e) => (cfg.den === 'both' || (cfg.den === 'dec') === !!e.dec) && (cfg.jaw === 'all' || jawOf(e) === cfg.jaw) && (cfg.grp === 'all' || groupOf(e) === cfg.grp) && (!cfg.only || cfg.only.has(e.id)));

  /* ───────── setup screen ───────── */
  const MODES = [['mix', '🎲', 'Mixed', 'مختلط'], ['tap', '🎯', 'Tap the tooth', 'اضغط على السن'], ['name', '🏷️', 'Name the tooth', 'اسم السن'], ['fdi', '🔢', 'FDI number → tooth', 'رقم FDI ← السن'], ['num', '🔤', 'Tooth → FDI number', 'السن ← رقم FDI']];
  function openSetup() {
    A.modal(() => {
      const n = pool(DC).length, opt = (k, v, label) => `<button class="opt ${DC[k] === v ? 'sel' : ''}" data-act="dqcfg" data-k="${k}" data-v="${v}">${label}</button>`;
      const hist = D().hist, last = hist[hist.length - 1], wn = Object.keys(D().wrong).length;
      return `<h2>🦷 ${T('Dentistry quiz', 'اختبار الأسنان')}</h2><p class="lead">${T('Only teeth are shown — practise names, positions and FDI numbers.', 'بيظهر الأسنان بس — تدرّب على الأسماء والأماكن وأرقام FDI.')}</p>` +
        `<div class="lab">${T('Question type', 'نوع الأسئلة')}</div><div class="row">${MODES.map((m) => opt('mode', m[0], `${m[1]} ${T(m[2], m[3])}`)).join('')}</div>` +
        `<div class="lab">${T('Teeth', 'الأسنان')}</div><div class="row">${opt('den', 'perm', T('Permanent (32)', 'دائمة (32)'))}${opt('den', 'dec', T('Deciduous (20)', 'لبنية (20)'))}${opt('den', 'both', T('Both', 'الاتنين'))}</div>` +
        `<div class="lab">${T('Jaw', 'الفك')}</div><div class="row">${opt('jaw', 'all', T('Both', 'الاتنين'))}${opt('jaw', 'up', T('Upper', 'علوي'))}${opt('jaw', 'lo', T('Lower', 'سفلي'))}</div>` +
        `<div class="lab">${T('Tooth type', 'نوع السن')}</div><div class="row">${opt('grp', 'all', T('All', 'الكل'))}${Object.keys(GROUPS).map((g) => opt('grp', g, T(GROUPS[g][0], GROUPS[g][1]))).join('')}</div>` +
        `<div class="lab">${T('Questions', 'عدد الأسئلة')}</div><div class="row">${[10, 20, 30].map((v) => opt('n', v, v)).join('')}</div>` +
        `<p class="tiny">${T(`${n} teeth match your choice.`, `${n} سن مطابق لاختيارك.`)}${n < 4 ? ' ' + T('Choose a wider selection (at least 4).', 'وسّع الاختيار (4 على الأقل).') : ''}</p>` +
        `<button class="btn primary wide" data-act="dqstart" ${n < 4 ? 'disabled' : ''}>${T('Start', 'ابدأ')}</button>` +
        `<button class="btn wide" style="margin-top:8px" data-act="dqmist" ${wn < 4 ? 'disabled' : ''}>🔁 ${T('Review my mistakes', 'راجع اللي غلطت فيه')} (${wn})</button>` +
        (last ? `<p class="tiny">${T('Last score', 'آخر نتيجة')}: <b>${last.s}%</b> (${last.c}/${last.n})</p>` : '') +
        `<h4>${T('How FDI numbering works', 'إزاي نظام FDI بيشتغل')}</h4><div class="advice">${T(
          'Two digits: the first is the quadrant, the second is the tooth counted from the midline. Permanent: 1 upper right, 2 upper left, 3 lower left, 4 lower right; teeth 1–8 (1 central incisor … 8 wisdom tooth). Deciduous: quadrants 5–8 (same order) and teeth 1–5 (1 central incisor, 2 lateral, 3 canine, 4 first molar, 5 second molar).',
          'رقمين: الأول هو الربع، والتاني ترتيب السن من الخط الوسط. الدائمة: 1 علوي أيمن، 2 علوي أيسر، 3 سفلي أيسر، 4 سفلي أيمن؛ والأسنان من 1 لـ8 (1 قاطع مركزي … 8 ضرس العقل). اللبنية: الأرباع من 5 لـ8 (بنفس الترتيب) والأسنان من 1 لـ5 (1 قاطع مركزي، 2 جانبي، 3 ناب، 4 رحى أولى، 5 رحى ثانية).')}</div>`;
    });
  }
  A.acts.dqcfg = (el) => {
    const k = el.dataset.k, v = el.dataset.v; DC[k] = k === 'n' ? +v : v;
    if (DC.den === 'dec' && DC.grp === 'premolar') DC.grp = 'all';
    D().cfg = { ...DC }; Store.save(); A.rerenderModal();
  };
  A.acts.dqstart = () => { A.closeModal(); start({ ...DC }); };
  A.acts.dqmist = () => {
    const w = new Set(Object.keys(D().wrong)); A.closeModal();
    start({ ...DC, mode: DC.mode, den: 'both', jaw: 'all', grp: 'all', only: w, n: Math.min(w.size, 20) });
  };

  /* ───────── quiz engine ───────── */
  function start(cfg) {
    const pl = pool(cfg);
    if (pl.length < 4) return A.toast(T('Not enough teeth for this choice', 'مفيش أسنان كفاية للاختيار ده'));
    const modes = cfg.mode === 'mix' ? ['tap', 'name', 'fdi', 'num'] : [cfg.mode];
    const n = Math.min(cfg.n, cfg.only ? pl.length : cfg.n), picks = [];
    let bag = [];
    while (picks.length < n) { if (!bag.length) bag = shuffle(pl); picks.push(bag.pop()); }
    const qs = picks.map((e, i) => ({ e, type: modes[i % modes.length] }));
    Qd = { cfg, qs: cfg.mode === 'mix' ? shuffle(qs) : qs, idx: 0, results: [], answered: false, t0: Date.now() };
    prev = { layers: { ...S.layers }, region: S.region, hidden: new Set(S.hidden), iso: S.iso, explode: S.explode, sel: S.sel, move: S.moveSet, dent: S.dent, focus: S.focus };
    S.moveSet = null; $('moveBar').hidden = true; $('explodeBar').hidden = true; S.explode = 0; S.hidden = new Set(); S.pulled.clear(); S.focus = null;
    S.sel = -1; A.deselect(); $('app').classList.add('quiz');
    S.quiz = { onTap }; $('quizBar').hidden = false;
    ask();
  }
  const archCenter = {};
  function center(e) {
    const key = jawOf(e) + (e.dec ? 'd' : 'p'); if (archCenter[key]) return archCenter[key];
    const l = teeth().filter((x) => jawOf(x) === jawOf(e) && !!x.dec === !!e.dec), c = [0, 0, 0];
    l.forEach((x) => { c[0] += x.c[0]; c[1] += x.c[1]; c[2] += x.c[2]; }); return (archCenter[key] = c.map((v) => v / l.length));
  }
  async function ask() {
    const q = Qd.qs[Qd.idx], e = q.e; Qd.answered = false; q.t0 = Date.now();
    for (const s of Object.keys(S.layers)) S.layers[s] = s === 'bone' ? 'on' : 'off';
    S.region = null; S.iso = -1; S.sel = -1; S.dent = e.dec ? 'dec' : 'perm'; S.hl = null;
    const jw = jawOf(e), dec = !!e.dec;
    S.quizOnly = (x) => x.k === 'tooth' && !!x.dec === dec && jawOf(x) === jw;
    await A.ensure('bone');
    if (q.type === 'name' || q.type === 'num') S.hl = new Map([[e.i, [1, 0.78, 0.18, 0.6]]]);
    const c = center(e);
    A.cam.flyTo([c[0], c[1], c[2]], dec ? 0.2 : 0.24, 0, jw === 'up' ? -0.95 : 0.95);
    if (q.type === 'name') { q.opts = options(e, 'name'); }
    else if (q.type === 'num') { q.opts = options(e, 'num'); }
    A.apply(); render();
  }
  function options(e, kind) {
    const same = teeth().filter((x) => x.i !== e.i && !!x.dec === !!e.dec);
    const scored = same.map((x) => ({ x, s: (groupOf(x) === groupOf(e) ? 3 : 0) + (jawOf(x) === jawOf(e) ? 2 : 0) + (x.side === e.side ? 1 : 0) + Math.random() * 1.6 })).sort((a, b) => b.s - a.s);
    const out = [], seen = new Set([kind === 'name' ? nm(e) : String(e.fdi)]);
    for (const { x } of scored) { const key = kind === 'name' ? nm(x) : String(x.fdi); if (seen.has(key)) continue; seen.add(key); out.push(x); if (out.length >= 3) break; }
    const all = shuffle([e, ...out]); return { list: all.map((x) => x.i), correct: all.indexOf(e) };
  }
  function render() {
    const bar = $('quizBar'), q = Qd.qs[Qd.idx], e = q.e, n = Qd.qs.length, ok = Qd.results.filter((r) => r.ok).length;
    let h = `<div class="qtop"><span dir="ltr">${Qd.idx + 1} / ${n}</span><span>${T('Score', 'النتيجة')}: <b>${ok}</b></span></div><div class="qprog"><i style="width:${(Qd.idx / n) * 100}%"></i></div>`;
    if (q.type === 'tap') h += `<div class="qq">${T('Tap', 'اضغط على')} <span style="color:var(--gold)">${esc(nm(e))}</span><small>${esc(nm2(e))}</small></div>`;
    else if (q.type === 'fdi') h += `<div class="qq">${T('Tap tooth number', 'اضغط على السن رقم')} <span dir="ltr" style="color:var(--gold);font-size:26px">${e.fdi}</span><small>${T('FDI numbering', 'نظام FDI')}</small></div>`;
    else if (q.type === 'name') h += `<div class="qq">${T('What is the highlighted tooth?', 'إيه اسم السن المعلّم؟')}</div>`;
    else h += `<div class="qq">${T('What is its FDI number?', 'إيه رقم السن المعلّم في نظام FDI؟')}</div>`;
    if (q.opts) {
      h += '<div class="qopts">' + q.opts.list.map((i, k) => {
        let cls = ''; if (Qd.answered) cls = k === q.opts.correct ? 'ok' : k === q.chosen ? 'no' : '';
        const lab = q.type === 'name' ? esc(nm(P[i])) : `<span dir="ltr">${P[i].fdi}</span>`;
        return `<button type="button" class="${cls}" data-act="dqopt" data-k="${k}" ${Qd.answered ? 'disabled' : ''}>${lab}</button>`;
      }).join('') + '</div>';
    }
    if (Qd.answered) {
      const r = Qd.results[Qd.results.length - 1];
      h += `<div class="qfb ${r.ok ? 'ok' : 'no'}"><span>${r.ok ? '✔ ' + T('Correct', 'صح') : '✘ ' + T('Wrong', 'غلط') + ' — ' + esc(nm(e)) + ' (FDI ' + e.fdi + ')' + (r.tapped ? ` · ${T('you tapped', 'ضغطت على')}: ${esc(r.tapped)}` : '')}</span><button class="btn primary" data-act="dqnext">${Qd.idx + 1 >= n ? T('Finish', 'إنهاء') : T('Next', 'التالي')}</button></div>`;
    } else h += `<div class="qrow"><button class="opt" data-act="dqexit">${T('Exit', 'خروج')}</button></div>`;
    bar.innerHTML = h;
    requestAnimationFrame(() => $('app').style.setProperty('--qh', bar.offsetHeight + 'px'));
  }
  function record(ok, tapped) {
    const q = Qd.qs[Qd.idx], e = q.e, d = D();
    Qd.results.push({ id: e.id, i: e.i, ok, type: q.type, grp: groupOf(e), jaw: jawOf(e), dec: !!e.dec, tapped: tapped || null, ms: Date.now() - q.t0 });
    Qd.answered = true;
    if (!ok) d.wrong[e.id] = (d.wrong[e.id] || 0) + 1; else if (d.wrong[e.id]) { d.wrong[e.id]--; if (d.wrong[e.id] <= 0) delete d.wrong[e.id]; }
    Store.save(); Store.touchDay();
  }
  function onTap(idx) {
    if (!Qd || Qd.answered) return; const q = Qd.qs[Qd.idx]; if (q.type !== 'tap' && q.type !== 'fdi') return;
    if (idx < 0 || !P[idx] || P[idx].k !== 'tooth') return;
    const ok = idx === q.e.i;
    S.hl = new Map([[q.e.i, [0.25, 0.85, 0.5, 0.65]]]); if (!ok) S.hl.set(idx, [0.95, 0.3, 0.3, 0.6]);
    record(ok, ok ? null : nm(P[idx]) + ' (' + P[idx].fdi + ')'); A.apply(); render();
  }
  A.acts.dqopt = (el) => {
    if (!Qd || Qd.answered) return; const q = Qd.qs[Qd.idx]; q.chosen = +el.dataset.k;
    S.hl = new Map([[q.e.i, [0.25, 0.85, 0.5, 0.65]]]);
    record(q.chosen === q.opts.correct, null); A.apply(); render();
  };
  A.acts.dqnext = () => { if (Qd.idx + 1 >= Qd.qs.length) finish(); else { Qd.idx++; ask(); } };
  A.acts.dqexit = () => {
    if (Qd.results.length >= 3 && !confirm(T('End the quiz now? Answered questions will be scored.', 'إنهاء الاختبار الآن؟ هيتم احتساب اللي جاوبت عليه.'))) return;
    if (!Qd.results.length) endUI(); else finish();
  };
  function endUI() {
    $('quizBar').hidden = true; $('app').classList.remove('quiz'); S.quiz = null; S.quizOnly = null;
    if (prev) { Object.assign(S.layers, prev.layers); S.region = prev.region; S.hidden = prev.hidden; S.iso = prev.iso; S.explode = prev.explode; S.moveSet = prev.move; S.dent = prev.dent; S.focus = prev.focus; }
    S.hl = null; S.sel = -1; A.apply(); A.cam.reset(); A.redraw();
  }
  function finish() {
    const rs = Qd.results, total = rs.length, correct = rs.filter((r) => r.ok).length, secs = Math.round((Date.now() - Qd.t0) / 1000);
    const by = (key) => { const o = {}; rs.forEach((r) => { const a = (o[r[key]] = o[r[key]] || { c: 0, n: 0 }); a.n++; if (r.ok) a.c++; }); return o; };
    const rec = { t: Date.now(), n: total, c: correct, s: pct(correct, total), secs, grp: by('grp'), type: by('type'), jaw: by('jaw') };
    const d = D(), last = d.hist[d.hist.length - 1]; d.hist.push(rec); if (d.hist.length > 60) d.hist.shift(); Store.save();
    const wrongs = rs.filter((r) => !r.ok); endUI(); Qd.done = true;
    A.modal(() => result(rec, last, wrongs));
  }
  const TYPE_LAB = { tap: ['Tap the tooth', 'اضغط على السن'], fdi: ['FDI → tooth', 'رقم ← سن'], name: ['Name the tooth', 'اسم السن'], num: ['Tooth → FDI', 'سن ← رقم'] };
  function result(rec, last, wrongs) {
    const g = rec.s >= 90 ? T('Excellent!', 'ممتاز!') : rec.s >= 70 ? T('Good', 'كويس') : rec.s >= 50 ? T('Fair — keep practising', 'مقبول — كمّل تدريب') : T('Needs more practice', 'محتاج مذاكرة أكتر');
    const col = rec.s >= 70 ? 'good' : rec.s >= 50 ? 'mid' : 'bad', dlt = last ? rec.s - last.s : null, mm = Math.floor(rec.secs / 60), ss = rec.secs % 60;
    const rows = (o, lab) => Object.entries(o).map(([k, a]) => { const p = pct(a.c, a.n); return `<div class="area"><span>${lab(k)}</span><div class="bar"><i class="${p >= 70 ? 'good' : p >= 50 ? 'mid' : 'bad'}" style="width:${p}%"></i></div><span>${a.c}/${a.n}</span></div>`; }).join('');
    let h = `<h2>🦷 ${T('Result', 'النتيجة')}</h2><div class="score-ring"><div><div class="big">${rec.s}%</div><div>${rec.c} / ${rec.n}</div></div><div><b>${g}</b>${dlt !== null ? `<div class="delta ${dlt >= 0 ? 'up' : 'down'}">${dlt >= 0 ? '▲' : '▼'} ${Math.abs(dlt)}% ${T('vs last time', 'عن آخر مرة')}</div>` : ''}<div class="lab">${T('Time', 'الوقت')}: ${mm}:${String(ss).padStart(2, '0')}</div></div></div><div class="bar"><i class="${col}" style="width:${rec.s}%"></i></div>`;
    h += `<h4>${T('By tooth type', 'حسب نوع السن')}</h4>` + rows(rec.grp, (k) => T(GROUPS[k][0], GROUPS[k][1]));
    h += `<h4>${T('By question type', 'حسب نوع السؤال')}</h4>` + rows(rec.type, (k) => T(TYPE_LAB[k][0], TYPE_LAB[k][1]));
    if (wrongs.length) {
      const lows = Object.entries(rec.grp).filter(([, a]) => a.c < a.n).sort((a, b) => a[1].c / a[1].n - b[1].c / b[1].n);
      h += `<div class="advice">${lows[0] ? T(`Weakest: <b>${GROUPS[lows[0][0]][0]}</b>.`, `أضعف نوع: <b>${GROUPS[lows[0][0]][1]}</b>.`) + '<br>' : ''}${T('Tap a mistake below to open that tooth, then use “Review my mistakes”.', 'اضغط على أي غلطة تحت عشان تفتح السن، وبعدين استخدم «راجع اللي غلطت فيه».')}</div>`;
      h += `<h4>${T('Mistakes', 'الأخطاء')}</h4>` + wrongs.map((r) => { const e = P[r.i]; return `<div class="mist" data-act="dqopen" data-i="${r.i}"><span>${esc(nm(e))}<small>${esc(nm2(e))}</small></span><small dir="ltr">FDI ${e.fdi}</small></div>`; }).join('');
    } else h += `<div class="advice">🎉 ${T('Perfect score!', 'نتيجة كاملة!')}</div>`;
    h += `<div class="row" style="margin-top:14px"><button class="btn primary" data-act="dqagain">${T('Try again', 'اختبار تاني')}</button></div>`;
    return h;
  }
  A.acts.dqopen = (el) => { A.closeModal(); A.select(+el.dataset.i); };
  A.acts.dqagain = () => openSetup();

  /* hub + language */
  waitFor(() => A.hubExtra && A.ensure && A.cam, () => {
    A.hubExtra.dent = openSetup;
    const pl = A.onLang; A.onLang = () => { if (pl) pl(); if (Qd && !Qd.done && S.quiz && S.quiz.onTap === onTap) render(); };
  });
})();
