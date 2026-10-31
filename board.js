/* board.js — weekly leaderboard (top 10) + weekly medals 🥇🥈🥉. Needs a signed-in, e-mail-verified account; the student joins with a nickname.
   Points = correct answers (max 40 / day). Week starts on Saturday. Data: Firestore weeks/{weekId}/scores/{uid}; prize text: config/board. */
'use strict';
if (!window.__boardLoaded) (() => {
  window.__boardLoaded = 1;
  const { S, esc } = A;
  const ar = () => S.lang === 'ar';
  const T = (en, a) => (ar() ? a : en);
  const CAP = 40, WA = 'https://wa.me/201050761015?text=';
  const ymd = (d) => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  const weekStart = () => { const x = new Date(); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 1) % 7)); return x; };   // Saturday
  const wkId = (off = 0) => { const s = weekStart(); s.setDate(s.getDate() - 7 * off); return String(ymd(s)); };
  const wkLabel = (id) => { const y = +id.slice(0, 4), m = +id.slice(4, 6) - 1, d = +id.slice(6); return new Date(y, m, d).toLocaleDateString(ar() ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short' }); };
  const B = () => { const d = Store.d; return d.board || (d.board = { on: false, name: '', meds: {}, cele: [], last: 0, sent: -1 }); };
  const DEF = { p1: 'خصم 20% على أي باقة', e1: '20% off any plan', p2: '', e2: '', p3: '', e3: '' };

  function weekPts() {
    const d = Store.d, act = d.act || {}, hist = d.hist || [], s = weekStart(); let pts = 0, c = 0, q = 0;
    for (let i = 0; i < 7; i++) {
      const dd = new Date(s); dd.setDate(s.getDate() + i); const k = ymd(dd); let n = 0, cc = 0;
      if (act[k]) { n += act[k].n; cc += act[k].c; }
      for (const h of hist) if (ymd(new Date(h.t)) === k) { n += h.n; cc += h.c; }
      pts += Math.min(cc, CAP); c += cc; q += n;
    }
    return { pts, c, q: Math.max(q, c) };
  }
  const scoresRef = (db, wk) => db.collection('weeks').doc(wk).collection('scores');

  /* ───────── sync my score ───────── */
  let pushing = false;
  async function push(force) {
    const b = B(); if (!b.on || !b.name || pushing) return;
    if (!force && Date.now() - (b.last || 0) < 100000) return;
    const w = weekPts(); if (!force && w.pts === b.sent) return;
    pushing = true;
    try {
      const g = await A.getDb(); if (!g || !g.user || !g.verified) return;
      if ((await config(g.db)).open !== true) return;   // leaderboard not launched yet
      const ref = scoresRef(g.db, wkId()).doc(g.uid), FV = firebase.firestore.FieldValue, s = await ref.get(), fx = A.acct && A.acct.uni && A.acct.fac ? { uni: A.acct.uni, fac: A.acct.fac } : {};
      b.last = Date.now();
      if (s.exists) {
        const d = s.data(), lt = d.t && d.t.toMillis ? d.t.toMillis() : Date.now(), allow = Math.floor((Date.now() - lt) / 3000) + 5;
        const send = Math.max(d.pts, Math.min(w.pts, d.pts + allow));
        await ref.update(Object.assign({ name: b.name, pts: send, c: Math.max(d.c || 0, Math.min(w.c, (d.c || 0) + allow)), q: Math.max(d.q || 0, Math.min(w.q, (d.q || 0) + allow)), t: FV.serverTimestamp() }, fx));
        b.sent = send === w.pts ? w.pts : -1;
      } else {
        const send = Math.min(w.pts, 40);
        await ref.set(Object.assign({ uid: g.uid, name: b.name, pts: send, c: Math.min(w.c, send), q: Math.min(Math.max(w.q, w.c), send), t: FV.serverTimestamp() }, fx));
        b.sent = send === w.pts ? w.pts : -1;
      }
      Store.save();
    } catch (e) { /* offline / rules — try again later */ } finally { pushing = false; }
  }
  const oldLog = A.logAct; if (oldLog) A.logAct = (n, c) => { oldLog(n, c); setTimeout(push, 400); };
  setInterval(() => { if (!document.hidden) push(); }, 120000);

  /* ───────── prize config + medals ───────── */
  let CFG = null;
  async function config(db) { if (CFG) return CFG; try { const s = await db.collection('config').doc('board').get(); CFG = Object.assign({}, DEF, s.exists ? s.data() : {}); } catch (e) { CFG = Object.assign({}, DEF); } return CFG; }
  const prizeOf = (c, r) => (ar() ? c['p' + r] : c['e' + r]) || (ar() ? c['p' + r] : '') || '';
  const MED = ['', '🥇', '🥈', '🥉'];
  A.medalsHtml = () => {
    const m = Object.values(B().meds || {}), n = (r) => m.filter((x) => x === r).length;
    if (!n(1) && !n(2) && !n(3)) return '';
    return `<h4>${T('Weekly medals', 'ميداليات المتصدرين')}</h4><div class="stat3"><div><b>🥇 ×${n(1)}</b><small>${T('1st place', 'المركز الأول')}</small></div><div><b>🥈 ×${n(2)}</b><small>${T('2nd place', 'المركز الثاني')}</small></div><div><b>🥉 ×${n(3)}</b><small>${T('3rd place', 'المركز الثالث')}</small></div></div>`;
  };
  async function checkMedals() {
    const b = B(), g = await A.getDb(); if (!g || !g.user || !g.verified) return;
    if ((await config(g.db)).open !== true) return;
    let any = false;
    for (let off = 1; off <= 4; off++) {
      const id = wkId(off); if (b.meds[id] !== undefined) continue;
      try {
        const q = await scoresRef(g.db, id).orderBy('pts', 'desc').limit(3).get(), rows = q.docs.map((d) => d.data());
        const i = rows.findIndex((r) => r.uid === g.uid && r.pts >= 10); b.meds[id] = i >= 0 ? i + 1 : 0;
        if (i >= 0) { b.cele = b.cele || []; b.cele.push({ id, r: i + 1 }); any = true; }
      } catch (e) { return; }
    }
    Store.save(); if (any) celebrate();
  }
  async function celebrate() {
    const b = B(); if (!b.cele || !b.cele.length) return; const g = await A.getDb(); const cfg = g && g.db ? await config(g.db) : DEF;
    const best = b.cele.slice().sort((x, y) => x.r - y.r)[0]; b.cele = []; Store.save();
    const prize = prizeOf(cfg, best.r), wa = T(`Hello, I got place ${best.r} in the Anatovia weekly leaderboard (week of ${wkLabel(best.id)}). My nickname: ${b.name}. My e-mail: ${(g && g.email) || ''}. ${prize ? 'I would like to claim: ' + prize : ''}`,
      `السلام عليكم، جبت المركز ${best.r} في متصدري Anatovia (أسبوع ${wkLabel(best.id)}). اسمي المستعار: ${b.name}. إيميلي: ${(g && g.email) || ''}. ${prize ? 'عايز أستلم هديتي: ' + prize : ''}`);
    A.modal(() => `<h2>${MED[best.r]} ${T('Congratulations!', 'مبروك!')}</h2><p class="lead">${T('You finished #' + best.r + ' in last week\'s leaderboard.', 'جبت المركز ' + best.r + ' في متصدري الأسبوع اللي فات.')}</p>` +
      (prize ? `<div class="advice">🎁 ${esc(prize)}</div><a class="btn primary wide" style="margin-top:10px" target="_blank" rel="noopener" href="${WA + encodeURIComponent(wa)}">💬 ${T('Claim my gift on WhatsApp', 'استلم هديتك على واتساب')}</a>` : '') +
      `<button class="btn wide" style="margin-top:8px" data-act="board">🏅 ${T('Open the leaderboard', 'افتح المتصدرين')}</button>`);
  }
  /* faculty competition: the admin publishes config/facrank (rows of {u,f,s,n}); if MY university+faculty finished #1 among its faculty type
     in a finished week, and I was a real contributor (>= 50 pts that week, faculty chosen BEFORE that week), offer the gift claim on WhatsApp */
  const wkDate = (id) => new Date(+id.slice(0, 4), +id.slice(4, 6) - 1, +id.slice(6));
  async function checkFacWin() {
    const a = A.acct || {}; if (!a.uni || !a.fac || a.uni === 'other' || a.fac === 'other') return;
    const g = await A.getDb(); if (!g || !g.user || !g.verified) return;
    const cfg = await config(g.db); if (cfg.open !== true) return;
    const b = B(); b.fw = b.fw || {};
    const d = (await g.db.collection('config').doc('facrank').get()).data(); if (!d || !d.wk || !d.rows || String(d.wk) >= wkId() || b.fw[d.wk] !== undefined) return;
    const top = d.rows.filter((r) => r.f === a.fac).sort((x, y) => y.s - x.s)[0];
    if (!top || top.u !== a.uni) { b.fw[d.wk] = 0; return Store.save(); }
    const me = await scoresRef(g.db, String(d.wk)).doc(g.uid).get(), mp = me.exists ? me.data().pts : 0;
    if (mp < 50 || !a.facAt || a.facAt >= wkDate(String(d.wk)).getTime()) { b.fw[d.wk] = 0; return Store.save(); }
    b.fw[d.wk] = 1; Store.save();
    const prize = (ar() ? cfg.pf1 : cfg.ef1) || cfg.pf1 || '', lab = A.facLabel(a.uni, a.fac);
    const wa = T(`Hello, my faculty won the Anatovia faculty competition (week of ${wkLabel(String(d.wk))}): ${lab}. Nickname: ${b.name}. E-mail: ${g.email}. ${prize ? 'I would like to claim: ' + prize : ''}`,
      `السلام عليكم، كليتنا كسبت منافسة الكليات في Anatovia (أسبوع ${wkLabel(String(d.wk))}): ${lab}. الاسم المستعار: ${b.name}. إيميلي: ${g.email}. ${prize ? 'عايز أستلم الهدية: ' + prize : ''}`);
    A.modal(() => `<h2>🏆 ${T('Your faculty won!', 'كليتك كسبت!')}</h2><p class="lead">${esc(lab)}</p>` +
      (prize ? `<div class="advice">🎁 ${esc(prize)}</div>` : '') +
      `<p class="tiny">${T('Send us a photo of your student ID with your message so we can confirm.', 'ابعتلنا صورة كارنيه الكلية مع الرسالة علشان نتأكد.')}</p>` +
      `<a class="btn primary wide" style="margin-top:10px" target="_blank" rel="noopener" href="${WA + encodeURIComponent(wa)}">💬 ${T('Claim on WhatsApp', 'استلم على واتساب')}</a>`);
  }
  setTimeout(() => { try { checkMedals().then(() => checkFacWin()).catch(() => {}); } catch (e) { /* ignore */ } }, 5000);

  /* ───────── UI ───────── */
  const BS = { tab: 0, rows: null, me: null, busy: false, err: '', cfg: null, uid: null, open: undefined, war: undefined, ff: '' };
  function render() {
    const b = B(), a = A.acct || {};
    let h = `<h2>🏅 ${T('Weekly leaderboard', 'متصدرو الأسبوع')}</h2>`;
    if (!window.FIREBASE_CONFIG) return h + `<p class="lead">${T('Not available yet.', 'مش متاح لسه.')}</p>`;
    if (BS.open === undefined) return h + `<p class="lead">${BS.err ? esc(BS.err) : T('Loading…', 'جارِ التحميل…')}</p>`;
    if (BS.open === false) return h + `<div class="advice" style="text-align:center;font-size:17px">🏅 ${T('Coming soon!', 'قريبًا!')}</div><p class="lead">${T('The weekly leaderboard opens soon — top students win medals and gifts. Keep studying!', 'متصدرو الأسبوع هيفتحوا قريب — أعلى الطلاب بياخدوا ميداليات وهدايا. كمّل مذاكرة!')}</p>`;
    if (!a.email) return h + `<p class="lead">${T('Sign in (free) to join the weekly leaderboard.', 'سجّل دخولك (مجانًا) علشان تشترك في متصدري الأسبوع.')}</p><button class="btn primary wide" data-act="pwacc">👤 ${T('Sign in / create a free account', 'سجّل دخول / حساب مجاني')}</button>`;
    if (a.unverified) return h + `<p class="lead">${T('Verify your e-mail first, then come back.', 'أكّد بريدك الأول وبعدين ارجع.')}</p><button class="btn primary wide" data-act="pwacc">✉️ ${T('Verify e-mail', 'تأكيد البريد')}</button>`;
    h += A.medalsHtml();
    if (!b.on) return h + `<p class="lead">${T('Top 10 students this week win medals 🥇🥈🥉. Points = correct answers (max 40 a day). Choose a nickname — your real name and e-mail stay private.', 'أعلى 10 طلاب في الأسبوع، والأوائل بياخدوا ميداليات 🥇🥈🥉. النقاط = إجابات صح (حد أقصى 40 في اليوم). اختار اسم مستعار — اسمك الحقيقي وإيميلك مش بيظهروا.')}</p>` +
      `<div class="acc-form"><input id="bdName" maxlength="20" placeholder="${T('Nickname (2–20 characters)', 'الاسم المستعار (2–20 حرف)')}" value="${esc(b.name || '')}"><button class="btn primary wide" data-act="bdjoin">${T('Join the leaderboard', 'انضم للمتصدرين')}</button></div>${BS.err ? `<div class="acc-msg bad">${esc(BS.err)}</div>` : ''}`;
    const w = weekPts();
    h += `<div class="row"><button class="opt ${BS.tab === 0 ? 'sel' : ''}" data-act="bdtab" data-k="0">${T('This week', 'الأسبوع ده')}</button><button class="opt ${BS.tab === 1 ? 'sel' : ''}" data-act="bdtab" data-k="1">${T('Last week', 'الأسبوع اللي فات')}</button><button class="opt ${BS.tab === 2 ? 'sel' : ''}" data-act="bdtab" data-k="2">🎓 ${T('Faculties', 'الكليات')}</button></div>`;
    const c = BS.cfg || DEF, pr = prizeOf(c, 1);
    if (BS.tab === 2) return h + warHtml();
    if (pr) h += `<div class="advice">🎁 ${T('Champion gift', 'هدية البطل')}: <b>${esc(pr)}</b></div>`;
    h += `<p class="tiny">${T('Week of ', 'أسبوع ')}${wkLabel(wkId(BS.tab))} · ${T('You', 'أنت')}: <b>${esc(b.name)}</b> · ${T('your points this week', 'نقاطك الأسبوع ده')}: <b>${w.pts}</b></p>`;
    if (BS.busy) h += `<p class="lead">${T('Loading…', 'جارِ التحميل…')}</p>`;
    else if (BS.err) h += `<div class="acc-msg bad">${esc(BS.err)}</div>`;
    else if (!BS.rows || !BS.rows.length) h += `<p class="lead">${T('Nobody yet — be the first!', 'لسه محدش — كن أول واحد!')}</p>`;
    else h += '<div class="bd">' + BS.rows.map((r, i) => `<div class="bdr ${r.uid === BS.uid ? 'me' : ''}"><span class="bdk">${MED[i + 1] || i + 1}</span><span class="bdn">${esc(r.name)}</span><b>${r.pts}</b></div>`).join('') + '</div>';
    h += `<div class="row" style="margin-top:10px"><button class="btn" data-act="bdrefresh">🔄 ${T('Refresh', 'تحديث')}</button><button class="btn" data-act="bdleave">${T('Leave', 'خروج من المتصدرين')}</button></div>`;
    return h + `<p class="tiny">${T('Points: correct answers, max 40 a day. The week starts on Saturday and resets automatically.', 'النقاط: إجابات صح، بحد أقصى 40 في اليوم. الأسبوع بيبدأ السبت وبيتصفّر لوحده.')}</p>`;
  }
  function warHtml() {
    const a = A.acct || {}, c = BS.cfg || {};
    if (!window.__facLoaded) return `<p class="lead">${T('Loading…', 'جارِ التحميل…')}</p>`;
    let h = '';
    const pf = (ar() ? c.pf1 : c.ef1) || c.pf1 || ''; if (pf) h += `<div class="advice">🎁 ${T('Winning faculty gift', 'هدية الكلية الفايزة')}: <b>${esc(pf)}</b></div>`;
    if (!a.uni || !a.fac) h += `<div class="advice">${T('Choose your university and faculty to take part.', 'اختار جامعتك وكليتك علشان تشترك.')}</div><button class="btn primary wide" style="margin:8px 0" data-act="bdfac">🎓 ${T('Choose now', 'اختار دلوقتي')}</button>`;
    else if (a.uni === 'other' || a.fac === 'other') h += `<p class="tiny">${T('Your faculty is not part of the competition.', 'كليتك مش داخلة في المنافسة.')}</p>`;
    else h += `<p class="tiny">${T('Your faculty', 'كليتك')}: <b>${esc(A.facLabel(a.uni, a.fac))}</b></p>`;
    if (BS.busy) return h + `<p class="lead">${T('Loading…', 'جارِ التحميل…')}</p>`;
    if (BS.err) return h + `<div class="acc-msg bad">${esc(BS.err)}</div>`;
    const d = BS.war;
    if (!d || !d.rows || !d.rows.length) return h + `<p class="lead">${T('The first faculty ranking has not been published yet.', 'أول ترتيب للكليات لسه ما اتنشرش.')}</p><p class="tiny">${T('A faculty ranks by the points of its top 10 active students (10+ points in the week), and needs at least 5 active students.', 'ترتيب الكلية = مجموع نقاط أعلى 10 طلاب نشيطين (10 نقاط فأكتر في الأسبوع)، ولازم يكون فيها 5 طلاب نشيطين على الأقل.')}</p>`;
    const types = [...new Set(d.rows.map((r) => r.f))], ff = BS.ff && types.includes(BS.ff) ? BS.ff : '';
    h += `<div class="row" style="flex-wrap:wrap"><button class="opt ${ff ? '' : 'sel'}" data-act="bdff" data-k="">${T('All', 'الكل')}</button>` + types.map((f) => `<button class="opt ${ff === f ? 'sel' : ''}" data-act="bdff" data-k="${esc(f)}">${esc(A.facName(f))}</button>`).join('') + '</div>';
    const list = d.rows.filter((r) => !ff || r.f === ff).sort((x, y) => y.s - x.s).slice(0, 20);
    h += `<p class="tiny">${T('Week of ', 'أسبوع ')}${wkLabel(String(d.wk))}</p><div class="bd">` + list.map((r, i) => `<div class="bdr ${r.u === a.uni && r.f === a.fac ? 'me' : ''}"><span class="bdk">${MED[i + 1] || i + 1}</span><span class="bdn">${esc(ff ? A.uniName(r.u) : A.facLabel(r.u, r.f))}<small style="display:block;color:var(--muted)">${r.n} ${T('active students', 'طالب نشيط')}</small></span><b>${r.s}</b></div>`).join('') + '</div>' +
      `<p class="tiny">${T('Ranking = points of the top 10 active students (10+ points); at least 5 active students needed. Updated by the team, not live.', 'الترتيب = نقاط أعلى 10 طلاب نشيطين (10 نقاط فأكتر)، ولازم 5 نشيطين على الأقل. بيتحدّث من إدارة التطبيق، مش لحظي.')}</p>`;
    return h;
  }
  const redraw = () => { if (A.modalFn === render) A.modal(render); };
  async function load() {
    const b = B(); if (!b.on) return;
    BS.busy = true; BS.err = ''; redraw();
    try {
      const g = await A.getDb(); if (!g || !g.user) throw new Error('auth');
      BS.uid = g.uid; if (BS.tab === 0) await push(true);
      BS.cfg = await config(g.db);
      if (BS.tab === 2) { const fs = await g.db.collection('config').doc('facrank').get(); BS.war = fs.exists ? fs.data() : null; }
      else { const q = await scoresRef(g.db, wkId(BS.tab)).orderBy('pts', 'desc').limit(10).get(); BS.rows = q.docs.map((d) => d.data()).filter((r) => r.pts > 0); }
    } catch (e) { BS.err = T('Could not load — check your connection.', 'تعذّر التحميل — اتأكد من الإنترنت.'); }
    BS.busy = false; redraw();
  }
  const open = async () => {
    BS.err = ''; BS.open = undefined; A.modal(render);
    if (!window.__facLoaded) { const sc = document.createElement('script'); sc.src = 'faculty.js'; sc.onload = redraw; document.body.appendChild(sc); }
    try {
      const g = await A.getDb(); if (!g || !g.db) throw new Error('net');
      BS.cfg = await config(g.db); BS.open = BS.cfg.open === true;
    } catch (e) { BS.err = T('Could not load — check your connection.', 'تعذّر التحميل — اتأكد من الإنترنت.'); redraw(); return; }
    redraw(); if (BS.open && B().on) load();
  };
  A.acts.board = open;
  A.hubExtra = A.hubExtra || {}; A.hubExtra.board = open;
  A.acts.bdtab = (el) => { BS.tab = +el.dataset.k; BS.rows = null; load(); };
  A.acts.bdff = (el) => { BS.ff = el.dataset.k || ''; redraw(); };
  A.acts.bdfac = () => { if (A.facPrompt) A.facPrompt(); };
  A.acts.bdrefresh = () => load();
  A.acts.bdjoin = () => {
    const el = document.getElementById('bdName'), v = (el && el.value || '').trim().replace(/\s+/g, ' ');
    if (v.length < 2 || v.length > 20) { BS.err = T('Nickname must be 2–20 characters.', 'الاسم المستعار لازم يكون من 2 لـ 20 حرف.'); return redraw(); }
    const b = B(); b.on = true; b.name = v; b.sent = -1; b.last = 0; Store.save(); BS.err = ''; open();
  };
  A.acts.bdleave = async () => {
    if (!confirm(T('Leave the leaderboard? Your entry for this week will be removed.', 'تخرج من المتصدرين؟ هيتشال اسمك من الأسبوع ده.'))) return;
    const b = B(); b.on = false; b.sent = -1; Store.save();
    try { const g = await A.getDb(); if (g && g.user) await scoresRef(g.db, wkId()).doc(g.uid).delete(); } catch (e) { /* ignore */ }
    BS.rows = null; redraw();
  };
})();
