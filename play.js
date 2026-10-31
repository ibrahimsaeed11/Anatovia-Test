/* play.js — spinal-nerve tables (myotomes / dermatomes / reflexes) with cards + quiz,
   daily challenge, timed exam mode, friend challenge by link, achievements and weekly tracking. */
'use strict';
(() => {
  const { S, P, $, esc, name1 } = A;
  const ar = () => S.lang === 'ar';
  const T = (en, a) => (ar() ? a : en);
  const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0);
  const rngOf = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const shuf = (arr, r) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const today = () => { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };
  const txt = (x) => (ar() ? x[1] : x[0]);

  Object.assign(STR, {
    spinal: { en: 'Spinal nerve tables', ar: 'جداول الأعصاب الشوكية' },
    spinalSub: { en: 'Myotomes · dermatomes · reflexes + cards & quiz', ar: 'Myotomes · Dermatomes · المنعكسات + بطاقات واختبار' },
    play: { en: 'Challenges', ar: 'التحديات' },
    playSub: { en: 'Daily challenge · timed exam · challenge a friend', ar: 'تحدّي اليوم · امتحان بوقت · تحدَّ صديقك برابط' },
    badges: { en: 'Achievements & week', ar: 'الإنجازات والأسبوع' },
    badgesSub: { en: 'Badges and your progress over the last 7 days', ar: 'شارات وتقدمك خلال آخر 7 أيام' },
  });
  A.hubExtra = Object.assign(A.hubExtra || {}, { spinal: () => openSpinal(), play: () => openPlay(), badges: () => openBadges() });

  /* ───────────── activity log (weekly tracking) ───────────── */
  A.logAct = (n, c) => {
    const d = Store.d; d.act = d.act || {}; const k = today(), o = (d.act[k] = d.act[k] || { n: 0, c: 0 }); o.n += n; o.c += c;
    const keys = Object.keys(d.act).sort(); while (keys.length > 120) delete d.act[keys.shift()];
    Store.touchDay(); Store.save();
  };
  const flag = (k) => { const d = Store.d; d.flags = d.flags || {}; d.flags[k] = true; Store.save(); };

  /* ───────────── helpers for 3D links ───────────── */
  const sideOK = (e) => e.side !== 'l';
  const findRef = (ref) => ref && P.find((e) => e.sys === ref[0] && sideOK(e) && ref[1].test(e.baseEn));
  const refPill = (ref) => { const e = findRef(ref); return e ? `<span class="pill2" data-act="goto" data-i="${e.i}">◎ ${esc(name1(e))}</span>` : ''; };

  /* ───────────── spinal tables ───────────── */
  const SP = { tab: 'myo' };
  function openSpinal() {
    A.modal(() => {
      const tabs = [['myo', 'Myotomes'], ['derm', 'Dermatomes'], ['refl', T('Reflexes', 'المنعكسات')], ['cards', T('Cards', 'بطاقات')], ['quiz', T('Quiz', 'اختبار')]];
      let h = `<h2>🧬 ${T('Spinal nerve tables', 'جداول الأعصاب الشوكية')}</h2><div class="row">` + tabs.map(([k, n]) => `<button class="opt ${SP.tab === k ? 'sel' : ''}" data-act="sptab" data-k="${k}">${n}</button>`).join('') + '</div>';
      if (SP.tab === 'myo') {
        h += `<p class="tiny">${T('Myotome = the group of muscles supplied by one spinal root. Test by resisted isometric movement and compare sides.', 'الـ Myotome مجموعة العضلات التي يغذيها جذر شوكي واحد. يُفحص بحركة مقاومة ثابتة مع مقارنة الجانبين.')}</p>` +
          '<table class="tbl"><tr><th>' + T('Level', 'المستوى') + '</th><th>' + T('Key movement', 'الحركة الأساسية') + '</th></tr>' +
          MYOTOMES.map((m) => `<tr><td dir="ltr"><b>${m[0]}</b></td><td>${esc(T(m[1], m[2]))}<div class="pills" style="margin-top:6px">${refPill(m[3])}</div></td></tr>`).join('') + '</table>';
      } else if (SP.tab === 'derm') {
        h += `<p class="tiny">${T('Key sensory points (ASIA). Dermatome maps differ slightly between sources and overlap between neighbours. The model has no skin, so the link jumps to the structure at that point.', 'نقاط الإحساس الأساسية (ASIA). خرائط الـ Dermatomes تختلف قليلاً بين المراجع وتتداخل بين المستويات المتجاورة. المجسم بدون جلد، فالرابط يذهب إلى التركيب الموجود عند النقطة.')}</p>` +
          '<table class="tbl"><tr><th>' + T('Level', 'المستوى') + '</th><th>' + T('Key point', 'النقطة') + '</th></tr>' +
          DERMATOMES.map((m) => `<tr><td dir="ltr"><b>${m[0]}</b></td><td>${esc(T(m[1], m[2]))}<div class="pills" style="margin-top:6px">${refPill(m[3])}</div></td></tr>`).join('') + '</table>';
      } else if (SP.tab === 'refl') {
        h += REFLEXES.map((r) => `<div class="exc"><b>${esc(T(r[0], r[1]))}</b><div class="tiny" dir="ltr">${T('Root', 'الجذر')}: ${esc(r[2])}</div><div>${esc(T(r[3], r[4]))}</div><div class="pills">${refPill(r[5])}</div></div>`).join('') +
          `<h4>${T('Grading (0–4+)', 'التدريج (0–4+)')}</h4><table class="tbl">` + REFLEX_GRADES.map((g) => `<tr><td dir="ltr"><b>${g[0]}</b></td><td>${esc(T(g[1], g[2]))}</td></tr>`).join('') + '</table>';
      } else if (SP.tab === 'cards') {
        h += cardsHtml();
      } else {
        h += `<p class="lead">${T('10 questions from the three tables.', '10 أسئلة من الجداول الثلاثة.')}</p><button class="btn primary wide" data-act="spquiz">${T('Start', 'ابدأ')}</button>`;
      }
      return h + `<p class="tiny">${T('Draft educational content – verify against your course reference.', 'محتوى تعليمي مبدئي — راجعه مع مرجع المادة.')}</p>`;
    });
  }
  A.acts.sptab = (el) => { SP.tab = el.dataset.k; if (SP.tab === 'cards') startCards(); openSpinal(); };
  A.acts.spquiz = () => startTQ({ mode: 'spinal', seed: (Math.random() * 1e9) | 0, n: 10, src: 'spin' });

  /* ───────────── text question bank ───────────── */
  let BANK = null;
  function bank() {
    if (BANK) return BANK; const B = [];
    const add = (src, pool, q, a) => B.push({ src, pool, q, a });
    MYOTOMES.forEach((m) => add('spin', 'lvl', [`Which spinal level mainly tests: ${m[1]}?`, `أي مستوى نخاعي يفحص: ${m[2]}؟`], [m[0], m[0]]));
    DERMATOMES.forEach((m) => { add('spin', 'pt', [`Key sensory point of ${m[0]}?`, `نقطة الإحساس الأساسية للمستوى ${m[0]}؟`], [m[1], m[2]]); add('spin', 'lvl', [`Which dermatome supplies: ${m[1]}?`, `أي dermatome يغذي: ${m[2]}؟`], [m[0], m[0]]); });
    REFLEXES.forEach((r) => add('spin', 'root', [`Spinal root of the ${r[0]}?`, `الجذر الشوكي لـ ${r[1]}؟`], [r[2], r[2]]));
    const seen = new Set();
    for (const e of P) {
      if (e.sys !== 'muscle' || !e.mu || e.side === 'l' || seen.has(e.baseEn) || !e.mu[6] || e.mu[6].length > 70) continue; seen.add(e.baseEn);
      add('anat', 'nerve', [`Nerve supply of ${e.baseEn}?`, `تعصيب: ${e.baseAr}؟`], [e.mu[6], e.mu[7]]);
      if (e.mu[4] && e.mu[4].length < 70) add('anat', 'act', [`Main action of ${e.baseEn}?`, `الحركة الأساسية: ${e.baseAr}؟`], [e.mu[4], e.mu[5]]);
    }
    /* ── generated from the app's own data (muscles, vessels, organs, nerves, brain, bones) ── */
    const rg = (r) => [STR[r] ? STR[r].en : r, STR[r] ? STR[r].ar : r];
    const leak = (e) => { const f = e.baseEn.split(/[\s(]/)[0].toLowerCase(), a = (e.baseAr || '').split(' ')[0]; const s0 = (e.sum[0] || '').toLowerCase(); return (f.length > 3 && s0.includes(f)) || (a.length > 4 && (e.sum[1] || '').includes(a)); };
    const once = new Set(); const first = (k) => (once.has(k) ? false : (once.add(k), true));
    const muscSeen = new Set();
    for (const e of P) {
      if (e.sys !== 'muscle' || !e.mu || e.side === 'l' || muscSeen.has(e.baseEn)) continue; muscSeen.add(e.baseEn);
      if (e.mu[0] && e.mu[0].length < 90) add('anat', 'origin', [`Origin of ${e.baseEn}?`, `منشأ ${e.baseAr}؟`], [e.mu[0], e.mu[1]]);
      if (e.mu[2] && e.mu[2].length < 90) add('anat', 'insertion', [`Insertion of ${e.baseEn}?`, `نقطة انغراس ${e.baseAr}؟`], [e.mu[2], e.mu[3]]);
    }
    for (const e of P) {
      if (!e.sum || e.side === 'l' || !first(e.sys + '|' + e.baseEn)) continue;
      if (e.sys === 'vessel') {
        if (/^Branch of/.test(e.sum[0])) continue;
        if (!/^(Artery of|Vein of)/.test(e.sum[0]) && !leak(e)) add('anat', 'vclue-' + e.k, [`Which ${e.k === 'vein' ? 'vein' : 'artery'}: ${e.sum[0]}`, `أي ${e.k === 'vein' ? 'وريد' : 'شريان'}: ${e.sum[1]}`], [e.baseEn, e.baseAr]);
      } else if (e.sys === 'organ') {
        if (['head', 'neck', 'thorax', 'abdomen', 'pelvis'].includes(e.reg)) add('anat', 'oreg', [`In which region is the ${e.baseEn} located?`, `في أي منطقة يقع: ${e.baseAr}؟`], rg(e.reg));
        if (!leak(e)) add('anat', 'oclue', [`Which organ/structure: ${e.sum[0]}`, `أي عضو/تركيب: ${e.sum[1]}`], [e.baseEn, e.baseAr]);
      } else if (e.sys === 'nerve' && !leak(e)) {
        add('anat', 'nclue', [`Which nerve: ${e.sum[0]}`, `أي عصب: ${e.sum[1]}`], [e.baseEn, e.baseAr]);
      } else if (e.sys === 'brain' && !leak(e)) {
        add('anat', 'bclue', [`Which brain structure: ${e.sum[0]}`, `أي جزء من الدماغ: ${e.sum[1]}`], [e.baseEn, e.baseAr]);
      } else if (e.sys === 'bone' && e.k === 'bone' && e.reg && !/vertebra|\brib\b|phalanx|metacarpal|metatarsal|carpal|tarsal|sesamoid/i.test(e.baseEn)) {
        add('anat', 'breg', [`In which part of the body is the ${e.baseEn}?`, `في أي جزء من الجسم يقع: ${e.baseAr}؟`], rg(e.reg));
      }
    }
    const tcount = {}; JOINTS.forEach((j) => j.tests.forEach((t) => { tcount[t[2]] = (tcount[t[2]] || 0) + 1; }));
    JOINTS.forEach((j) => {
      j.rom.forEach((r) => add('exam', 'rom', [`Normal ROM – ${j.en} ${r[0].toLowerCase()}?`, `المدى الطبيعي – ${j.ar}: ${r[1]}؟`], [r[2], r[2]]));
      j.mmt.forEach((m) => { if (/^[CTLS]\d/.test(m[4])) add('exam', 'root', [`Spinal root for ${j.en} – ${m[0].toLowerCase()} (MMT)?`, `الجذر العصبي لـ ${j.ar} – ${m[1]} (MMT)؟`], [m[4], m[4]]); });
      j.tests.forEach((t) => { if (tcount[t[2]] === 1) add('exam', 'test', [`Which special test assesses: ${t[2]}?`, `أي اختبار خاص يفحص: ${t[3]}؟`], [t[0], t[1]]); });
    });
    return (BANK = B);
  }
  A.qBank = () => bank();
  /* deterministic set from a seed */
  function makeSet(seed, n, src) {
    const B = bank(), r = rngOf(seed), idx = B.map((_, i) => i).filter((i) => src === 'all' || B[i].src === src);
    const picked = shuf(idx, r).slice(0, n), qs = [];
    for (const i of picked) {
      const it = B[i], same = idx.filter((k) => B[k].pool === it.pool && B[k].a[0] !== it.a[0]);
      const opts = []; const used = new Set([it.a[0]]);
      for (const k of shuf(same, r)) { if (opts.length >= 3) break; if (used.has(B[k].a[0])) continue; used.add(B[k].a[0]); opts.push(k); }
      if (opts.length < 3) continue;
      const all = shuf([i, ...opts], r); qs.push({ i, opts: all, c: all.indexOf(i) });
    }
    return qs;
  }

  /* ───────────── question engine (modal) ───────────── */
  let G = null, timer = null;
  const stopTimer = () => { if (timer) { clearInterval(timer); timer = null; } };
  function startTQ(cfg) {
    const qs = makeSet(cfg.seed, cfg.n, cfg.src || 'all'); if (qs.length < 3) { A.toast(T('Not enough questions', 'لا توجد أسئلة كافية')); return; }
    G = { cfg, qs, idx: 0, res: [], answered: false, chosen: -1, t0: Date.now(), limit: cfg.limit || 0, done: false };
    stopTimer(); if (G.limit) timer = setInterval(tick, 500);
    drawTQ();
  }
  function tick() {
    if (!G || G.done || !G.limit || $('modal').hidden) { stopTimer(); return; }
    const left = Math.max(0, G.limit - (Date.now() - G.t0) / 1000), el = document.getElementById('tqTimer');
    if (el) { el.textContent = Math.floor(left / 60) + ':' + String(Math.floor(left % 60)).padStart(2, '0'); el.classList.toggle('low', left < 30); }
    if (left <= 0) finishTQ();
  }
  function drawTQ() {
    const B = bank(); A.modal(() => {
      const q = G.qs[G.idx], it = B[q.i], n = G.qs.length;
      let h = `<div class="qtop"><span dir="ltr">${G.idx + 1} / ${n}</span>${G.limit ? '<span class="tmr" id="tqTimer" dir="ltr"></span>' : ''}<span>${T('Score', 'الدرجة')}: <b>${G.res.filter((r) => r.ok).length}</b></span></div><div class="qprog"><i style="width:${(G.idx / n) * 100}%"></i></div>` +
        `<div class="qq" style="margin:12px 0">${esc(txt(it.q))}</div><div class="qopts one">` +
        q.opts.map((k, j) => { let c = ''; if (G.answered) { if (j === q.c) c = 'ok'; else if (j === G.chosen) c = 'no'; } return `<button type="button" class="${c}" data-act="tqopt" data-k="${j}" ${G.answered ? 'disabled' : ''}>${esc(txt(B[k].a))}</button>`; }).join('') + '</div>';
      if (G.answered) h += `<div class="qfb ${G.res[G.res.length - 1].ok ? 'ok' : 'no'}"><span>${G.res[G.res.length - 1].ok ? '✔ ' + T('Correct', 'صحيح') : '✘ ' + T('Wrong', 'خطأ')}</span><button class="btn primary" data-act="tqnext">${G.idx + 1 >= n ? T('Finish', 'إنهاء') : T('Next', 'التالي')}</button></div>`;
      else h += `<div class="qrow"><button class="opt" data-act="tqexit">${T('Exit', 'خروج')}</button></div>`;
      return h;
    });
    tick();
  }
  A.acts.tqopt = (el) => { if (!G || G.answered) return; const q = G.qs[G.idx]; G.chosen = +el.dataset.k; G.answered = true; G.res.push({ i: q.i, ok: G.chosen === q.c }); drawTQ(); };
  A.acts.tqnext = () => { if (G.idx + 1 >= G.qs.length) finishTQ(); else { G.idx++; G.answered = false; G.chosen = -1; drawTQ(); } };
  A.acts.tqexit = () => { if (G.res.length && !confirm(T('End now? Answered questions are scored.', 'إنهاء الآن؟ سيتم احتساب ما أجبت عنه.'))) return; stopTimer(); if (G.res.length) finishTQ(); else { G = null; A.closeModal(); } };
  let lastRes = null;
  const b36 = (v) => Math.max(0, v | 0).toString(36).padStart(2, '0');
  const mkLink = (seed, n, c) => location.origin + location.pathname + '#c=' + b36(n) + b36(c) + (seed | 0).toString(36);
  const LRM = '\u200E';
  const shareText = (c, n) => (ar() ? `جبت ${c} من ${n} في تحدي التشريح 🦴 — تقدر تغلبني؟` : `I scored ${c}/${n} in the anatomy challenge 🦴 — can you beat me?`);
  function finishTQ() {
    if (!G || G.done) return; G.done = true; stopTimer();
    const B = bank(), n = G.qs.length, c = G.res.filter((r) => r.ok).length, s = pct(c, n), secs = Math.round((Date.now() - G.t0) / 1000), cfg = G.cfg;
    A.logAct(G.res.length, c);
    if (s === 100 && n >= 5) flag('perfect');
    if (cfg.mode === 'timed') flag('timed');
    if (cfg.mode === 'friend') flag('friend');
    if (cfg.mode === 'spinal' && s >= 90) flag('spinal');
    if (cfg.mode === 'daily') { const d = Store.d; d.daily = { d: today(), s: c, n }; d.dailyDays = d.dailyDays || []; if (!d.dailyDays.includes(today())) d.dailyDays.push(today()); Store.save(); }
    const wrongs = G.qs.filter((q, k) => !(G.res[k] && G.res[k].ok));
    const link = mkLink(cfg.seed, n, c), fs = cfg.fs;
    lastRes = { c, n, s, secs, link, fs: isFinite(fs) ? fs : null };
    const newB = checkBadges();
    A.modal(() => `<h2>${T('Result', 'النتيجة')}</h2><div class="score-ring"><div><div class="big">${s}%</div><div>${c} / ${n}</div></div><div><b>${s >= 90 ? T('Excellent!', 'ممتاز!') : s >= 70 ? T('Good', 'جيد') : s >= 50 ? T('Fair – review more', 'مقبول — راجع أكتر') : T('Needs review', 'يحتاج مراجعة')}</b><div class="lab">${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}${G.limit && G.res.length < n ? ' · ' + T('time ran out', 'انتهى الوقت') : ''}</div></div></div>` +
      (lastRes.fs != null ? `<div class="advice">${c > lastRes.fs ? '🎉 ' + T('You beat your friend!', 'غلبت صاحبك!') : c === lastRes.fs ? '🤝 ' + T('Tie!', 'تعادل!') : '💪 ' + T('Your friend wins — try again!', 'صاحبك كسب — جرّب تاني!')} <b>(${c} : ${lastRes.fs})</b></div>` : '') +
      (newB.length ? `<div class="advice">🏆 ${T('New badge', 'شارة جديدة')}: ${newB.map((b) => b.i + ' ' + esc(txt(b.n))).join(' · ')}</div>` : '') +
      (wrongs.length ? `<h4>${T('Review', 'للمراجعة')}</h4>` + wrongs.map((q) => `<div class="exc"><div>${esc(txt(B[q.i].q))}</div><b>${esc(txt(B[q.i].a))}</b></div>`).join('') : '') +
      `<div class="row" style="margin-top:12px"><button class="btn primary" data-act="tqcard">📸 ${T('Share my result', 'شارك نتيجتي')}</button></div><div class="row" style="margin-top:8px"><button class="btn" data-act="play">${T('Challenges', 'التحديات')}</button><button class="btn" data-act="tqshare" data-link="${esc(link)}" data-s="${c}" data-n="${n}">🤝 ${T('Challenge a friend', 'تحدَّ صديقك')}</button></div>`);
  }
  A.acts.play = () => openPlay();
  A.acts.tqshare = async (el) => {
    const c = el.dataset.s, n = el.dataset.n, link = el.dataset.link;
    const text = shareText(c, n);
    try { if (navigator.share) { await navigator.share({ title: document.title, text: text + '\n' + LRM + link }); return; } } catch (e) { return; }
    try { await navigator.clipboard.writeText(text + '\n' + LRM + link); A.toast(T('Link copied', 'تم نسخ الرابط')); } catch (e) { prompt(text, link); }
  };
  /* result card (JPEG) to share on WhatsApp / Instagram */
  function drawCard(r) {
    const W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d'), rtl = ar();
    const FAM = 'system-ui,-apple-system,"Segoe UI",Tahoma,"Noto Naskh Arabic",Arial,sans-serif';
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2a3a8c'); g.addColorStop(1, '#0f1636'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    const tx = (s, px, py, size, col, b) => { x.font = `${b ? 700 : 500} ${size}px ${FAM}`; x.fillStyle = col; x.textAlign = 'center'; x.textBaseline = 'middle'; x.direction = /[\u0600-\u06FF]/.test(s) ? 'rtl' : 'ltr'; x.fillText(s, px, py, W - 120); };
    tx('Anatovia', W / 2, 130, 84, '#fff', 1); tx(T('Anatomy challenge', 'تحدّي التشريح'), W / 2, 215, 46, '#b9c4ff');
    const cx = W / 2, cy = 640, R = 270, p = r.n ? r.c / r.n : 0, col = p >= 0.9 ? '#46d68a' : p >= 0.6 ? '#ffc84a' : '#ff6b78';
    x.lineWidth = 46; x.lineCap = 'round'; x.strokeStyle = 'rgba(255,255,255,.14)'; x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2); x.stroke();
    if (p > 0) { x.strokeStyle = col; x.beginPath(); x.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p); x.stroke(); }
    tx(`${r.c} / ${r.n}`, cx, cy - 20, 170, '#fff', 1); tx(Math.round(p * 100) + '%', cx, cy + 105, 64, col, 1);
    let y = 1010;
    if (r.fs != null) { const msg = r.c > r.fs ? T('I beat my friend! 🎉', 'غلبت صاحبي! 🎉') : r.c === r.fs ? T('Tie with my friend 🤝', 'تعادل مع صاحبي 🤝') : T('My friend won this round 💪', 'صاحبي كسب الجولة 💪'); tx(msg, cx, y, 54, '#fff', 1); tx(`${r.c} : ${r.fs}`, cx, y + 70, 50, '#b9c4ff'); y += 140; }
    else { tx(T('Can you beat me?', 'تقدر تغلبني؟'), cx, y + 20, 66, '#fff', 1); y += 120; }
    const m = Math.floor(r.secs / 60) + ':' + String(r.secs % 60).padStart(2, '0'); tx('⏱ ' + m, cx, y, 40, '#b9c4ff');
    x.fillStyle = 'rgba(255,255,255,.1)'; x.fillRect(0, H - 130, W, 130); tx('ibrahimsaeed11.github.io/Anatovia', cx, H - 65, 40, '#fff', 1);
    return cv;
  }
  A.acts.tqcard = async () => {
    if (!lastRes) return;
    const cv = drawCard(lastRes), blob = await new Promise((res) => cv.toBlob(res, 'image/jpeg', 0.9)); if (!blob) return A.toast(T('Could not build the card', 'تعذّر إنشاء الصورة'));
    const text = shareText(lastRes.c, lastRes.n) + '\n' + LRM + lastRes.link;
    A.fileOut(blob, 'anatovia-result.jpg', 'image/jpeg', { text, head: T('🏆 Result card', '🏆 كارت النتيجة') });
  };

  /* ───────────── challenges hub ───────────── */
  function openPlay() {
    A.modal(() => {
      const d = Store.d.daily, done = d && d.d === today();
      return `<h2>📅 ${T('Challenges', 'التحديات')}</h2><div class="hub">` +
        `<button type="button" data-act="pdaily"><span class="em">📅</span><span><b>${T('Daily challenge', 'تحدّي اليوم')}</b><small>${done ? '✔ ' + T('Done today', 'أنجزته اليوم') + ` ${d.s}/${d.n}` : T('5 questions – the same for everyone today', '5 أسئلة — نفسها للجميع اليوم')}</small></span></button>` +
        `<button type="button" data-act="ptimed"><span class="em">⏱</span><span><b>${T('Timed exam', 'امتحان بوقت')}</b><small>${T('30 seconds per question, one total clock', '30 ثانية لكل سؤال بعدّاد واحد')}</small></span></button>` +
        `<button type="button" data-act="pfriend"><span class="em">🤝</span><span><b>${T('Challenge a friend', 'تحدَّ صديقك')}</b><small>${T('Same questions via a link, compare scores', 'نفس الأسئلة عبر رابط وقارنوا النتيجة')}</small></span></button></div>`;
    });
  }
  A.acts.pdaily = () => {
    const d = Store.d.daily;
    if (d && d.d === today()) {
      A.modal(() => `<h2>📅 ${T('Daily challenge', 'تحدّي اليوم')}</h2><div class="score-ring"><div><div class="big">${pct(d.s, d.n)}%</div><div>${d.s} / ${d.n}</div></div><div><b>${T('Come back tomorrow for a new one', 'ارجع بكرة لتحدي جديد')}</b><div class="lab">🔥 ${Store.streak()} ${T('day streak', 'يوم متتالٍ')}</div></div></div><div class="row" style="margin-top:12px"><button class="btn" data-act="pfriend">🤝 ${T('Challenge a friend', 'تحدَّ صديقك')}</button><button class="btn" data-act="ptimed">⏱ ${T('Timed exam', 'امتحان بوقت')}</button></div>`);
      return;
    }
    startTQ({ mode: 'daily', seed: today(), n: 5, src: 'all' });
  };
  const TC = { n: 20 };
  A.acts.ptimed = () => !A.isPremium() ? A.paywall('The timed exam is part of Premium. Free: daily and friend challenges.', 'الامتحان بوقت ضمن النسخة المميزة. المجاني: تحدّي اليوم وتحدّي الصديق.') : A.modal(() => `<h2>⏱ ${T('Timed exam', 'امتحان بوقت')}</h2><p class="lead">${T('Questions from anatomy, exam and spinal tables. Unanswered questions count as wrong when time ends.', 'أسئلة من التشريح والفحص والأعصاب الشوكية. الأسئلة غير المجابة تُحتسب خطأ عند انتهاء الوقت.')}</p><div class="row">` +
    [10, 20, 40].map((n) => `<button class="opt ${TC.n === n ? 'sel' : ''}" data-act="ptn" data-n="${n}">${n} · ${Math.round(n / 2)} ${T('min', 'د')}</button>`).join('') + `</div><button class="btn primary wide" data-act="ptstart">${T('Start', 'ابدأ')}</button>`);
  A.acts.ptn = (el) => { TC.n = +el.dataset.n; A.acts.ptimed(); };
  A.acts.ptstart = () => startTQ({ mode: 'timed', seed: (Math.random() * 1e9) | 0, n: TC.n, src: 'all', limit: TC.n * 30 });
  A.acts.pfriend = () => startTQ({ mode: 'friend', seed: 1 + ((Math.random() * 1e9) | 0), n: 10, src: 'all' });

  /* open a challenge link (#ch=seed.n.score) */
  function checkHash() {
    let seed, n, fs; const h = location.hash;
    const m2 = /#c=([0-9a-z]{2})([0-9a-z]{2})([0-9a-z]+)/.exec(h), m1 = /#ch=([0-9a-z]+)\.(\d+)(?:\.(\d+))?/.exec(h);
    if (m2) { n = Math.min(40, parseInt(m2[1], 36) || 10); fs = String(parseInt(m2[2], 36)); seed = parseInt(m2[3], 36); }
    else if (m1) { seed = parseInt(m1[1], 36); n = Math.min(40, +m1[2] || 10); fs = m1[3]; } else return;
    if (!isFinite(seed)) return;
    A.modal(() => `<h2>🤝 ${T('A friend challenged you!', 'صديقك يتحداك!')}</h2><p class="lead">${fs ? T(`Your friend scored ${fs} / ${n}. Can you beat it?`, `صديقك جاب ${fs} من ${n}. تقدر تغلبه؟`) : T('Answer the same questions and compare scores.', 'جاوب نفس الأسئلة وقارنوا النتيجة.')}</p><button class="btn primary wide" data-act="chgo" data-seed="${seed}" data-n="${n}" data-fs="${fs == null ? '' : fs}">${T('Accept', 'اقبل التحدي')}</button>`);
  }
  A.acts.chgo = (el) => { history.replaceState(null, '', location.pathname); startTQ({ mode: 'friend', seed: +el.dataset.seed, n: +el.dataset.n, src: 'all', fs: el.dataset.fs === '' ? NaN : +el.dataset.fs }); };
  setTimeout(checkHash, 900);

  /* ───────────── spinal flashcards ───────────── */
  let CD = null;
  function startCards() { const B = bank(); CD = { q: shuf(B.map((_, i) => i).filter((i) => B[i].src === 'spin'), Math.random), show: false, total: 0, known: 0 }; CD.total = CD.q.length; }
  function cardsHtml() {
    if (!CD) startCards(); const B = bank();
    if (!CD.q.length) { logCards(); return `<div class="advice">✔ ${T('Deck finished!', 'خلّصت المجموعة!')}</div><button class="btn primary wide" data-act="cdrestart">${T('Again', 'من جديد')}</button>`; }
    const it = B[CD.q[0]];
    return `<div class="qtop"><span dir="ltr">${CD.known} / ${CD.total}</span></div><div class="qprog"><i style="width:${pct(CD.known, CD.total)}%"></i></div>` +
      `<div class="exc fcard" data-act="cdflip"><div class="qq">${esc(txt(it.q))}</div>${CD.show ? `<hr><b style="font-size:17px">${esc(txt(it.a))}</b>` : `<div class="tiny">${T('Tap to reveal', 'اضغط لإظهار الإجابة')}</div>`}</div>` +
      (CD.show ? `<div class="row"><button class="btn primary" data-act="cdknow">✓ ${T('Knew it', 'عرفتها')}</button><button class="btn" data-act="cdagain">↻ ${T('Again', 'أعدها')}</button></div>` : '');
  }
  let cardLogged = false;
  const logCards = () => { if (!cardLogged && CD && CD.known) { cardLogged = true; A.logAct(CD.known, CD.known); } };
  A.acts.cdflip = () => { CD.show = true; openSpinal(); };
  A.acts.cdknow = () => { CD.q.shift(); CD.known++; CD.show = false; openSpinal(); };
  A.acts.cdagain = () => { CD.q.push(CD.q.shift()); CD.show = false; openSpinal(); };
  A.acts.cdrestart = () => { startCards(); cardLogged = false; openSpinal(); };

  /* ───────────── achievements + weekly progress ───────────── */
  const dkey = (dt) => dt.getFullYear() * 10000 + (dt.getMonth() + 1) * 100 + dt.getDate();
  function totals() {
    const d = Store.d; let n = 0, c = 0;
    for (const v of Object.values(d.act || {})) { n += v.n; c += v.c; }
    for (const h of d.hist || []) { n += h.n; c += h.c; }
    return { n, c };
  }
  const sysBest = (sy) => (Store.d.hist || []).some((h) => h.sys === sy && h.s >= 90 && h.n >= 10);
  const BADGES = [
    { id: 'first', i: '🎯', n: ['First answers', 'أول إجابات'], d: ['Answer your first questions', 'أجب عن أول أسئلتك'], ok: () => totals().n >= 1 },
    { id: 'a100', i: '📚', n: ['100 answers', '100 إجابة'], d: ['Answer 100 questions in total', 'أجب عن 100 سؤال إجمالاً'], ok: () => totals().n >= 100 },
    { id: 'a500', i: '🧠', n: ['500 answers', '500 إجابة'], d: ['Answer 500 questions in total', 'أجب عن 500 سؤال إجمالاً'], ok: () => totals().n >= 500 },
    { id: 's3', i: '🔥', n: ['3-day streak', '3 أيام متتالية'], d: ['Study 3 days in a row', 'ذاكر 3 أيام متتالية'], ok: () => Store.streak() >= 3 },
    { id: 's7', i: '🔥', n: ['7-day streak', '7 أيام متتالية'], d: ['Study 7 days in a row', 'ذاكر 7 أيام متتالية'], ok: () => Store.streak() >= 7 },
    { id: 'perfect', i: '💯', n: ['Perfect score', 'درجة كاملة'], d: ['100% in a quiz of 5+ questions', '100% في اختبار من 5 أسئلة أو أكثر'], ok: () => (Store.d.flags || {}).perfect || (Store.d.hist || []).some((h) => h.s === 100 && h.n >= 5) },
    { id: 'daily7', i: '📅', n: ['7 daily challenges', '7 تحديات يومية'], d: ['Finish the daily challenge on 7 days', 'أنهِ تحدي اليوم في 7 أيام'], ok: () => (Store.d.dailyDays || []).length >= 7 },
    { id: 'timed', i: '⏱', n: ['Timed exam', 'امتحان بوقت'], d: ['Finish a timed exam', 'أنهِ امتحاناً بوقت'], ok: () => (Store.d.flags || {}).timed },
    { id: 'friend', i: '🤝', n: ['Friendly rival', 'منافس ودود'], d: ['Finish a friend challenge', 'أنهِ تحدياً مع صديق'], ok: () => (Store.d.flags || {}).friend },
    { id: 'lm', i: '📍', n: ['Landmark master', 'خبير المعالم'], d: ['90%+ in the landmark quiz', '90% أو أكثر في اختبار المعالم'], ok: () => ((Store.d.lmq || {}).best || 0) >= 90 },
    { id: 's14', i: '🔥', n: ['14-day streak', '14 يوم متتالي'], d: ['Study 14 days in a row', 'ذاكر 14 يوم متتالي'], ok: () => Store.streak() >= 14 },
    { id: 's30', i: '🌋', n: ['30-day streak', 'شهر متواصل'], d: ['Study 30 days in a row', 'ذاكر 30 يوم متتالي'], ok: () => Store.streak() >= 30 },
    { id: 'a1000', i: '🏅', n: ['1000 answers', '1000 إجابة'], d: ['Answer 1000 questions in total', 'أجب عن 1000 سؤال إجمالاً'], ok: () => totals().n >= 1000 },
    { id: 'perfect3', i: '💎', n: ['Perfectionist', 'الدقيق'], d: ['Get 100% in 3 different quizzes', 'احصل على 100% في 3 اختبارات'], ok: () => (Store.d.hist || []).filter((h) => h.s === 100 && h.n >= 5).length >= 3 },
    { id: 'xbone', i: '🦴', n: ['Bone expert', 'خبير العظام'], d: ['90%+ in a 10+ question bones quiz', '90% أو أكثر في اختبار عظام من 10 أسئلة'], ok: () => sysBest('bone') },
    { id: 'xmuscle', i: '💪', n: ['Muscle expert', 'خبير العضلات'], d: ['90%+ in a 10+ question muscles quiz', '90% أو أكثر في اختبار عضلات من 10 أسئلة'], ok: () => sysBest('muscle') },
    { id: 'xvessel', i: '🩸', n: ['Vessel expert', 'خبير الأوعية'], d: ['90%+ in a 10+ question vessels quiz', '90% أو أكثر في اختبار أوعية من 10 أسئلة'], ok: () => sysBest('vessel') },
    { id: 'xnerve', i: '⚡', n: ['Nerve expert', 'خبير الأعصاب'], d: ['90%+ in a 10+ question nerves quiz', '90% أو أكثر في اختبار أعصاب من 10 أسئلة'], ok: () => sysBest('nerve') },
    { id: 'xorgan', i: '🫀', n: ['Organ expert', 'خبير الأعضاء'], d: ['90%+ in a 10+ question organs quiz', '90% أو أكثر في اختبار أعضاء من 10 أسئلة'], ok: () => sysBest('organ') },
    { id: 'round', i: '🌍', n: ['All-rounder', 'متعدد المجالات'], d: ['Take quizzes in 4 different systems', 'خض اختبارات في 4 أجهزة مختلفة'], ok: () => new Set((Store.d.hist || []).filter((h) => h.sys && h.sys !== 'all').map((h) => h.sys)).size >= 4 },
    { id: 'learn50', i: '🧩', n: ['50 learned', 'تعلّمت 50'], d: ['Mark 50 structures as learned', 'علّم 50 تركيباً كمتعلَّم'], ok: () => Object.keys(Store.d.learned || {}).length >= 50 },
    { id: 'fav10', i: '⭐', n: ['Collector', 'جامع المفضلة'], d: ['Add 10 favourites', 'أضف 10 عناصر للمفضلة'], ok: () => Object.keys(Store.d.fav || {}).length >= 10 },
    { id: 'spinal', i: '🧬', n: ['Spinal expert', 'خبير الأعصاب الشوكية'], d: ['90%+ in the spinal-nerve quiz', '90% أو أكثر في اختبار الأعصاب الشوكية'], ok: () => (Store.d.flags || {}).spinal },
  ];
  function checkBadges() {
    const d = Store.d; d.earned = d.earned || []; const fresh = [];
    for (const b of BADGES) if (!d.earned.includes(b.id) && b.ok()) { d.earned.push(b.id); fresh.push(b); }
    if (fresh.length) Store.save(); return fresh;
  }
  A.badgeInfo = () => { checkBadges(); const e = Store.d.earned || []; return { total: BADGES.length, earned: BADGES.filter((b) => e.includes(b.id)).map((b) => ({ i: b.i, n: txt(b.n) })) }; };
  A.checkBadges = () => { const f = checkBadges(); if (f.length) A.toast('🏆 ' + f.map((b) => b.i + ' ' + txt(b.n)).join(' · '), 4500); };
  function openBadges() {
    checkBadges();
    A.modal(() => {
      const d = Store.d, days = [], now = new Date();
      for (let k = 6; k >= 0; k--) { const dt = new Date(now.getFullYear(), now.getMonth(), now.getDate() - k); days.push({ dt, key: dkey(dt), n: 0, c: 0 }); }
      for (const x of days) { const a = (d.act || {})[x.key]; if (a) { x.n += a.n; x.c += a.c; } for (const h of d.hist || []) { const hd = new Date(h.t); if (dkey(hd) === x.key) { x.n += h.n; x.c += h.c; } } }
      const mx = Math.max(10, ...days.map((x) => x.n)), tot = days.reduce((a, x) => a + x.n, 0), cor = days.reduce((a, x) => a + x.c, 0), t = totals();
      let h = `<h2>🏆 ${T('Achievements & week', 'الإنجازات والأسبوع')}</h2><div class="stat3"><div><b>🔥 ${Store.streak()}</b><small>${T('day streak', 'يوم متتالٍ')}</small></div><div><b>${tot}</b><small>${T('answers this week', 'إجابة هذا الأسبوع')}${tot ? ' · ' + pct(cor, tot) + '%' : ''}</small></div><div><b>${t.n}</b><small>${T('answers in total', 'إجابة إجمالاً')}</small></div></div>` +
        `<h4>${T('Last 7 days', 'آخر 7 أيام')}</h4><div class="week">` + days.map((x) => `<div><i style="height:${Math.max(3, (x.n / mx) * 100)}%;background:var(--${!x.n ? 'line' : pct(x.c, x.n) >= 70 ? 'good' : pct(x.c, x.n) >= 50 ? 'gold' : 'bad'})" title="${x.n}"></i><small>${x.n || ''}</small><span>${x.dt.toLocaleDateString(ar() ? 'ar-EG' : 'en', { weekday: 'short' })}</span></div>`).join('') + '</div>' +
        (A.medalsHtml ? A.medalsHtml() : '') + `<h4>${T('Badges', 'الشارات')} (${(d.earned || []).length}/${BADGES.length})</h4><div class="badges">` +
        BADGES.map((b) => { const got = (d.earned || []).includes(b.id); return `<div class="badge ${got ? 'got' : ''}"><span>${b.i}</span><b>${esc(txt(b.n))}</b><small>${esc(txt(b.d))}</small></div>`; }).join('') + '</div>';
      return h;
    });
  }
})();
