/* account.js — optional account (Firebase Auth) + premium activation codes (Firestore).
   The app works fully without an account; this only adds sign-in and the premium flag A.isPremium().
   The Firebase SDK is loaded lazily (only when online and only if the user opened the account page or was signed in before). */
'use strict';
(() => {
  const { S, $, esc } = A;
  const ar = () => S.lang === 'ar';
  const T = (en, a) => (ar() ? a : en);
  const CFG = window.FIREBASE_CONFIG;
  const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/firebase-';
  const MAXDEV = 2;
  const LS = 'anatovia_acct', DEV = 'anatovia_dev';
  const ls = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } } };

  Object.assign(STR, {
    account: { en: 'My account', ar: 'حسابي' },
    accountSub: { en: 'Profile · subscription · activation code', ar: 'بياناتك · الاشتراك · كود التفعيل' },
  });
  A.hubExtra = Object.assign(A.hubExtra || {}, { account: () => open() });

  const st = { ready: false, loading: false, err: '', user: null, data: null, authKnown: false, busy: false, msg: '', ok: false, mode: 'in', plan: 3 };
  let auth = null, db = null, sdkP = null, cache = null;
  try { cache = JSON.parse(ls.get(LS) || 'null'); } catch (e) { cache = null; }
  A.acct = { premium: false, email: null, until: 0, limited: false };
  A.isPremium = () => !!A.acct.premium;
  /* ── free / paid split ── */
  const MUS_PAID = /^(Frontalis|Occipitalis|Corrugator|Orbicularis|Procerus|Nasalis|Depressor|Levator labii|Levator anguli|Zygomaticus|Risorius|Buccinator|Mentalis|Platysma|Temporoparietalis|Epicranial|Lateral pterygoid|Medial pterygoid|Digastric|Mylohyoid|Geniohyoid|Stylohyoid|Sternohyoid|Sternothyroid|Thyrohyoid|Omohyoid|Rotators|Interspinales|Intertransversarii|Multifidus|Semispinalis|Levatores costarum|Obliquus capitis|Rectus capitis|Longus capitis|Longus colli|Spinalis|Serratus posterior|Coccygeus|Iliococcygeus|Pubococcygeus|Puborectalis|External anal|Tendinous arch|Pyramidalis|Linea alba|Intermediate tendon|Abductor pollicis brevis|Opponens|Flexor pollicis brevis|Adductor pollicis|Palmaris brevis|Lumbricals|Dorsal interossei|Palmar interossei|Plantar interossei|Abductor digiti|Flexor digiti|Abductor hallucis|Adductor hallucis|Flexor hallucis brevis|Flexor digitorum brevis|Extensor digitorum brevis|Extensor hallucis brevis|Flexor accessorius)/;
  A.PAID_SYS = new Set(['vessel', 'nerve', 'brain', 'organ', 'ligament']);
  A.FREE_TESTS = new Set(['Neer impingement', 'Lachman', 'McMurray', 'Straight leg raise (Lasègue)', 'Trendelenburg']);
  A.FREE_NERVE = 'median_wrist'; A.FREE_JOINT = 'shoulder'; A.FREE_Q = 10;
  A.lockOf = (e) => (e.sys === 'bone' ? false : e.sys === 'muscle' ? MUS_PAID.test(e.baseEn) : true);
  try { (A.P || []).forEach((e) => { e.lk = A.lockOf(e); }); } catch (e) { /* ignore */ }
  A.locked = (e) => !!(e && e.lk && !A.isPremium());

  const devId = () => { let d = ls.get(DEV); if (!d) { d = Math.random().toString(36).slice(2, 10) + Date.now().toString(36); ls.set(DEV, d); } return d; };
  const fmtDate = (ms) => new Date(ms).toLocaleDateString(ar() ? 'ar-EG' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
  const untilOf = (d) => (d && d.premiumUntil ? (d.premiumUntil.toMillis ? d.premiumUntil.toMillis() : +d.premiumUntil) : 0);

  /* ───────── derive premium state ───────── */
  function apply() {
    let until = 0, email = null, limited = false, tu = false, tl = false, fx = { uni: '', fac: '', facAt: 0 };
    if (st.authKnown && st.user && st.data) {
      email = st.user.email; until = untilOf(st.data); tu = !!st.data.trialUsed; tl = tu && !st.data.lastCode;
      fx = { uni: st.data.uni || '', fac: st.data.fac || '', facAt: st.data.facAt && st.data.facAt.toMillis ? st.data.facAt.toMillis() : 0 };
      const devs = st.data.devices || [];
      limited = until > Date.now() && !devs.some((d) => d.id === devId()) && devs.length >= MAXDEV;
    } else if (st.authKnown && st.user && !st.data && cache && cache.email === st.user.email) {
      email = cache.email; until = cache.until || 0; limited = !!cache.limited; tu = !!cache.tu; tl = !!cache.tl; fx = cache.fx || fx; // fetch failed — keep last known state
    } else if (!st.authKnown && cache) {
      email = cache.email; until = cache.until || 0; limited = !!cache.limited; tu = !!cache.tu; tl = !!cache.tl; fx = cache.fx || fx; // offline / SDK not loaded
    }
    const unverified = !!(st.authKnown && st.user && st.user.emailVerified === false);
    const prem = until > Date.now() && !limited && !unverified;
    A.acct = { email, until, limited, premium: prem, unverified, trialUsed: tu, trial: prem && tl, uni: fx.uni, fac: fx.fac, facAt: fx.facAt };
    if (st.authKnown && (st.data || !st.user)) { cache = st.user ? { email, until, limited, tu, tl, fx } : null; ls.set(LS, JSON.stringify(cache)); }
    facAsk();
    refresh();
    try { if (A.onAcct) A.onAcct(); } catch (e) { /* gate not ready */ }
    try { if (A.apply) A.apply(); } catch (e) { /* scene not ready yet */ }
    try { if (A.acct.trial && A.acct.until - Date.now() < 864e5 && ls.get('anatovia_tw') !== new Date().toDateString()) { ls.set('anatovia_tw', new Date().toDateString()); setTimeout(() => A.toast && A.toast(T('⏳ Your free trial ends within a day', '⏳ التجربة المجانية هتخلص خلال يوم')), 2500); } } catch (e) { /* ignore */ }
  }
  const refresh = () => { if (A.modalFn === render) A.modal(render); };
  /* one-time "choose your university & faculty" (saved once, locked by the rules) — asked at most once a day until chosen */
  let facTry = 0;
  function facAsk() {
    try {
      if (window.__gateOn || !(st.authKnown && st.user && st.data) || A.acct.unverified || A.acct.uni || facTry || ls.get('anatovia_fp') === new Date().toDateString()) return;
      facTry = 1;
      const go = (n) => setTimeout(() => {
        if (A.acct.uni) return;
        if (A.modalFn && n < 8) return go(n + 1);   // something else is open — wait a bit
        if (A.modalFn) return;
        ls.set('anatovia_fp', new Date().toDateString());
        if (window.__facLoaded) return A.facPrompt();
        const sc = document.createElement('script'); sc.src = 'faculty.js'; sc.onload = () => A.facPrompt && A.facPrompt(); document.body.appendChild(sc);
      }, n ? 10000 : 4500);
      go(0);
    } catch (e) { /* ignore */ }
  }
  /* save uni + fac ONCE (rules reject any later change by the student) */
  /* name + study year (optional fields — if the rules do not allow them yet we just keep them on this device) */
  A.setProfile = async (name, yr) => {
    ls.set('anatovia_prof', JSON.stringify({ name, yr }));
    if (!st.user || !db) return false;
    try { await db.collection('users').doc(st.user.uid).update({ name, yr }); const s = await db.collection('users').doc(st.user.uid).get(); st.data = s.data(); return true; } catch (e) { return false; }
  };
  A.profile = () => { let p = null; try { p = JSON.parse(ls.get('anatovia_prof') || 'null'); } catch (e) { p = null; } const d = st.data || {}; return { name: d.name || (p && p.name) || '', yr: d.yr || (p && p.yr) || '', email: A.acct.email || '' }; };
  A.setFac = async (uni, fac) => {
    if (!st.user || !db) throw new Error('auth');
    const ref = db.collection('users').doc(st.user.uid);
    await ref.update({ uni, fac, facAt: firebase.firestore.FieldValue.serverTimestamp() });
    const s = await ref.get(); st.data = s.data(); apply();
  };

  /* ───────── SDK loading ───────── */
  const loadScript = (src) => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('net')); document.head.appendChild(s); });
  function ensure() {
    if (!CFG) return Promise.resolve();
    if (st.ready) return Promise.resolve();
    if (sdkP) return sdkP;
    st.loading = true; st.err = ''; refresh();
    sdkP = (async () => {
      await loadScript(SDK + 'app-compat.js');
      await Promise.all([loadScript(SDK + 'auth-compat.js'), loadScript(SDK + 'firestore-compat.js')]);
      firebase.initializeApp(CFG);
      auth = firebase.auth(); db = firebase.firestore();
      st.ready = true;
      auth.onAuthStateChanged(async (u) => { st.user = u; st.authKnown = true; st.data = null; if (u) await loadUser(); apply(); });
    })().catch(() => { st.err = 'offline'; sdkP = null; }).finally(() => { st.loading = false; refresh(); });
    return sdkP;
  }

  async function loadUser() {
    const ref = db.collection('users').doc(st.user.uid);
    try {
      let s = await ref.get();
      const FV = firebase.firestore.FieldValue, prov = (st.user.providerData || []).map((p) => p.providerId).join(','), ver = st.user.emailVerified !== false;
      if (!s.exists) { await ref.set({ email: st.user.email || '', createdAt: FV.serverTimestamp(), devices: [], provider: prov, verified: ver, lastSeen: FV.serverTimestamp() }); s = await ref.get(); }
      st.data = s.data();
      { // keep admin-visible info fresh (provider / verified / last seen, at most every 6 h)
        const d = st.data, ls0 = d.lastSeen && d.lastSeen.toMillis ? d.lastSeen.toMillis() : 0, patch = {};
        if (d.provider !== prov) patch.provider = prov;
        if (d.verified !== ver) patch.verified = ver;
        if (Date.now() - ls0 > 6 * 36e5) patch.lastSeen = FV.serverTimestamp();
        if (Object.keys(patch).length) { try { await ref.update(patch); s = await ref.get(); st.data = s.data(); } catch (e2) { /* non-critical */ } }
      }
      const devs = st.data.devices || [];
      if (untilOf(st.data) > Date.now() && !devs.some((d) => d.id === devId()) && devs.length < MAXDEV) {
        await ref.update({ devices: firebase.firestore.FieldValue.arrayUnion({ id: devId(), ua: (navigator.platform || '').slice(0, 30), t: Date.now() }) });
        s = await ref.get(); st.data = s.data();
      }
    } catch (e) { st.data = null; }
  }

  /* ───────── messages ───────── */
  const ERR = {
    'auth/invalid-email': ['Invalid e-mail address.', 'البريد الإلكتروني غير صحيح.'],
    'auth/invalid-credential': ['Wrong e-mail or password.', 'البريد أو كلمة المرور غير صحيحة.'],
    'auth/wrong-password': ['Wrong e-mail or password.', 'البريد أو كلمة المرور غير صحيحة.'],
    'auth/user-not-found': ['No account with this e-mail.', 'لا يوجد حساب بهذا البريد.'],
    'auth/email-already-in-use': ['This e-mail already has an account — sign in instead.', 'هذا البريد مسجّل بالفعل — سجّل الدخول.'],
    'auth/weak-password': ['Password must be at least 6 characters.', 'كلمة المرور يجب ألا تقل عن 6 أحرف.'],
    'auth/too-many-requests': ['Too many attempts — try again later.', 'محاولات كثيرة، حاول لاحقاً.'],
    'auth/network-request-failed': ['No internet connection.', 'لا يوجد اتصال بالإنترنت.'],
    'auth/popup-closed-by-user': ['Sign-in window was closed.', 'تم إغلاق نافذة تسجيل الدخول.'],
    'auth/operation-not-allowed': ['This sign-in method is not enabled yet.', 'طريقة الدخول هذه غير مفعّلة بعد.'],
    'auth/unauthorized-domain': ['This website address is not authorised in Firebase.', 'عنوان الموقع غير مصرّح به في Firebase.'],
  };
  A.errText = (e) => errText(e);
  const errText = (e) => { const p = ERR[e && e.code]; return p ? T(p[0], p[1]) : T('Something went wrong, try again.', 'حدث خطأ، حاول مرة أخرى.'); };
  const say = (m, ok) => { st.msg = m || ''; st.ok = !!ok; st.busy = false; refresh(); };

  /* ───────── actions ───────── */
  async function doAuth(kind) {
    const email = ($('accEmail') || {}).value, pass = ($('accPass') || {}).value;
    if (!email || !pass) return say(T('Enter e-mail and password.', 'اكتب البريد وكلمة المرور.'));
    st.busy = true; st.msg = '';
    try { if (kind === 'up') { const cr = await auth.createUserWithEmailAndPassword(email.trim(), pass); try { await cr.user.sendEmailVerification(); st.sent = Date.now(); } catch (e2) { /* resend button available */ } } else await auth.signInWithEmailAndPassword(email.trim(), pass); st.busy = false; }
    catch (e) { say(errText(e)); }
  }
  async function google() {
    st.busy = true; st.msg = '';
    try { await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()); st.busy = false; } catch (e) { say(errText(e)); }
  }
  async function reset() {
    const email = ($('accEmail') || {}).value;
    if (!email) return say(T('Type your e-mail first.', 'اكتب بريدك أولاً.'));
    try { await auth.sendPasswordResetEmail(email.trim()); say(T('Reset link sent to your e-mail.', 'تم إرسال رابط إعادة التعيين إلى بريدك.'), true); } catch (e) { say(errText(e)); }
  }
  /* ───────── 3-day free trial (once per account and once per device) ───────── */
  async function startTrial() {
    if (!st.user || A.acct.unverified) return say(T('Sign in and verify your e-mail first.', 'سجّل دخولك وأكّد بريدك الأول.'));
    st.busy = true; st.msg = '';
    const uref = db.collection('users').doc(st.user.uid), tref = db.collection('trials').doc(devId());
    try {
      await db.runTransaction(async (tx) => {
        const [t0, u] = await Promise.all([tx.get(tref), tx.get(uref)]);
        if (t0.exists) throw new Error('dev');
        const d = u.exists ? u.data() : {};
        if (d.trialUsed) throw new Error('used');
        if (untilOf(d) > Date.now()) throw new Error('active');
        tx.set(tref, { uid: st.user.uid, at: firebase.firestore.FieldValue.serverTimestamp() });
        tx.update(uref, { premiumUntil: firebase.firestore.Timestamp.fromMillis(Date.now() + 3 * 864e5), trialUsed: true, trialAt: firebase.firestore.FieldValue.serverTimestamp(), trialDev: devId() });
      });
      await loadUser(); st.busy = false; apply();
      if (A.modalFn !== render) A.closeModal();
      A.toast(T('🎁 Free trial started — 3 days of Premium', '🎁 بدأت التجربة المجانية — 3 أيام مميزة'), 3500);
      say(T('Free trial started 🎉', 'بدأت التجربة المجانية 🎉'), true);
    } catch (e) {
      st.busy = false; const m = e && e.message;
      say(m === 'dev' ? T('A free trial was already used on this device.', 'التجربة المجانية اتاخدت قبل كده على الجهاز ده.') : m === 'used' ? T('You already used your free trial.', 'انت استخدمت التجربة المجانية قبل كده.') : m === 'active' ? T('You already have an active subscription.', 'عندك اشتراك شغال بالفعل.') : T('Could not start the trial. Check your connection.', 'تعذّر بدء التجربة. اتأكد من الإنترنت.'));
      if (A.modalFn !== render) A.toast(st.msg, 3500);
    }
  }
  A.startTrial = startTrial;
  const normCode = (raw) => {
    const a = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const b = a.length === 12 && a.startsWith('ANAT') ? a.slice(4) : a;
    return b.length === 8 ? `ANAT-${b.slice(0, 4)}-${b.slice(4)}` : null;
  };
  async function redeem() {
    const code = normCode(($('accCode') || {}).value);
    if (!code) return say(T('Code looks wrong — format ANAT-XXXX-XXXX.', 'شكل الكود غير صحيح — الصيغة ANAT-XXXX-XXXX.'));
    st.busy = true; st.msg = '';
    const cref = db.collection('codes').doc(code), uref = db.collection('users').doc(st.user.uid);
    try {
      await db.runTransaction(async (tx) => {
        const c = await tx.get(cref);
        if (!c.exists) throw new Error('invalid');
        if (c.data().used) throw new Error('used');
        const u = await tx.get(uref);
        const base = Math.max(untilOf(u.exists ? u.data() : null), Date.now());
        const until = base + Number(c.data().days || 0) * 864e5;
        tx.update(cref, { used: true, usedBy: st.user.uid, usedAt: firebase.firestore.FieldValue.serverTimestamp() });
        tx.update(uref, { premiumUntil: firebase.firestore.Timestamp.fromMillis(until), lastCode: code });
      });
      await loadUser(); apply();
      say(T('Premium activated 🎉', 'تم تفعيل الاشتراك 🎉'), true);
    } catch (e) {
      const m = e && e.message;
      say(m === 'used' ? T('This code was already used.', 'هذا الكود مستخدم من قبل.') : T('Invalid code.', 'الكود غير صحيح.'));
    }
  }
  async function resend() {
    if (!st.user) return;
    if (st.sent && Date.now() - st.sent < 45000) return say(T('Wait a little before sending again.', 'استنى شوية قبل ما تبعت تاني.'));
    st.busy = true;
    try { await st.user.sendEmailVerification(); st.sent = Date.now(); say(T('Verification link sent. Check your inbox and spam folder.', 'بعتنا رابط التحقق. بص في الوارد وفي الرسائل غير المرغوبة (Spam).'), true); } catch (e) { say(errText(e)); }
  }
  async function checkVerified() {
    if (!st.user) return;
    st.busy = true; refresh();
    try {
      await st.user.reload(); await st.user.getIdToken(true);
      if (st.user.emailVerified) { st.data = null; await loadUser(); st.msg = ''; st.busy = false; apply(); say(T('E-mail verified ✅', 'تم تأكيد البريد ✅'), true); }
      else say(T('Not verified yet — open the link we sent to your e-mail first.', 'لسه ما اتأكدش — افتح الرابط اللي بعتناه على بريدك الأول.'));
    } catch (e) { say(errText(e)); }
  }
  /* used by the sign-in gate (gate.js) */
  A.gateAuth = {
    ready: async () => { try { await ensure(); } catch (e) { return false; } for (let i = 0; i < 40 && !st.authKnown && st.ready; i++) await new Promise((r) => setTimeout(r, 150)); return st.ready; },
    state: () => ({ ready: st.ready, known: st.authKnown, user: st.user, data: st.data, loading: st.loading }),
    email: async (kind, email, pass) => { if (kind === 'up') { const cr = await auth.createUserWithEmailAndPassword(email, pass); try { await cr.user.sendEmailVerification(); st.sent = Date.now(); } catch (e2) { /* resend later */ } } else await auth.signInWithEmailAndPassword(email, pass); },
    google: async () => { await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()); },
    reset: async (email) => { await auth.sendPasswordResetEmail(email); },
    out: async () => { try { await auth.signOut(); } catch (e) { /* ignore */ } },
  };
  async function out() { try { await auth.signOut(); } catch (e) { /* ignore */ } st.msg = ''; }

  A.acts.acc = (el) => {
    const k = el.dataset.k;
    if (k === 'plan') { st.plan = +el.dataset.v; refresh(); }
    else if (k === 'mode') { st.mode = el.dataset.v; st.msg = ''; refresh(); }
    else if (k === 'in') doAuth('in'); else if (k === 'up') doAuth('up');
    else if (k === 'google') google(); else if (k === 'reset') reset();
    else if (k === 'resend') resend(); else if (k === 'verified') checkVerified();
    else if (k === 'trial') startTrial();
    else if (k === 'redeem') redeem(); else if (k === 'out') out(); else if (k === 'retry') { sdkP = null; ensure(); }
  };
  document.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Enter' || !ev.target.closest || !ev.target.closest('.acc-form')) return;
    const b = ev.target.closest('.acc-form').querySelector('[data-primary]'); if (b) b.click();
  });

  /* ───────── view ───────── */
  /* plans — keep in sync with the durations offered in admin.html (30 / 90 / 180 / 365 days) */
  const PLANS = [
    { m: 1, days: 30, egp: 75, en: '1 month', ar: 'شهر' },
    { m: 3, days: 90, egp: 180, en: '3 months', ar: '3 شهور', save: 45 },
    { m: 6, days: 180, egp: 300, en: '6 months', ar: '6 شهور', save: 150 },
    { m: 12, days: 365, egp: 450, en: '1 year', ar: 'سنة كاملة', save: 450 },
  ];
  const num = (n) => (ar() ? n.toLocaleString('ar-EG') : String(n));
  const plansHtml = (pick) => `<div class="lab">${T('Choose a plan', 'اختر الباقة')}</div><div class="plans">` + PLANS.map((p) => {
    const per = Math.round(p.egp / p.m);
    return `<${pick ? 'button type="button" data-act="acc" data-k="plan" data-v="' + p.m + '"' : 'div'} class="plan ${pick && st.plan === p.m ? 'sel' : ''}"><b>${T(p.en, p.ar)}</b><span class="pr">${num(p.egp)} ${T('EGP', 'جنيه')}</span>` +
      `<small>${p.m > 1 ? T('≈ ' + per + ' EGP / month', 'حوالي ' + num(per) + ' جنيه في الشهر') : T('Flexible, cancel any time', 'مرن، من غير التزام')}</small>` +
      (p.save ? `<em>${T('Save ' + p.save + ' EGP', 'وفّر ' + num(p.save) + ' جنيه')}</em>` : '') + `</${pick ? 'button' : 'div'}>`;
  }).join('') + `</div><p class="tiny plan-note">${T('Pay once, no auto-renewal. You receive an activation code on WhatsApp after payment.', 'الدفع مرة واحدة من غير تجديد تلقائي. بتوصلك كود التفعيل على واتساب بعد الدفع.')}</p>`;
  const waLink = (text) => `https://wa.me/201050761015?text=${encodeURIComponent(text)}`;
  const msgBox = () => (st.msg ? `<div class="acc-msg ${st.ok ? 'ok' : 'bad'}">${esc(st.msg)}</div>` : '');
  function render() {
    const head = `<h2>${t('account')}</h2>`;
    if (!CFG) return head + `<p class="lead">${T('Accounts are not set up yet.', 'نظام الحسابات غير مُعدّ بعد.')}</p>`;
    if (st.loading) return head + `<p class="lead">${T('Loading…', 'جارِ التحميل…')}</p>`;
    if (!st.ready) {
      const cached = A.acct.email ? `<p class="lead">${T('Last known account', 'آخر حساب معروف')}: <b dir="ltr">${esc(A.acct.email)}</b> — ${A.acct.premium ? T('Premium until ', 'مشترك حتى ') + fmtDate(A.acct.until) : T('Free', 'مجاني')}</p>` : '';
      return head + cached + `<p class="lead">${T('An internet connection is needed to sign in or activate a code. The rest of the app works offline.', 'تسجيل الدخول وتفعيل الكود يحتاجان إنترنت. باقي التطبيق يعمل بدون إنترنت.')}</p><button class="btn primary wide" data-act="acc" data-k="retry">${T('Try again', 'حاول مرة أخرى')}</button>`;
    }
    if (!st.authKnown) return head + `<p class="lead">${T('Loading…', 'جارِ التحميل…')}</p>`;
    if (!st.user) {
      const up = st.mode === 'up';
      return head + `<p class="lead">${T('Optional — the app is free to use without an account. An account lets you activate Premium.', 'اختياري — التطبيق مجاني بدون حساب. الحساب يتيح لك تفعيل الاشتراك المميز.')}</p>` +
        `<div class="row"><button class="opt ${up ? '' : 'sel'}" data-act="acc" data-k="mode" data-v="in">${T('Sign in', 'تسجيل الدخول')}</button><button class="opt ${up ? 'sel' : ''}" data-act="acc" data-k="mode" data-v="up">${T('Create account', 'حساب جديد')}</button></div>` +
        `<div class="acc-form"><input id="accEmail" type="email" dir="ltr" autocomplete="email" placeholder="${T('E-mail', 'البريد الإلكتروني')}"><input id="accPass" type="password" dir="ltr" autocomplete="${up ? 'new-password' : 'current-password'}" placeholder="${T('Password', 'كلمة المرور')}">` +
        `<button class="btn primary wide" data-primary data-act="acc" data-k="${up ? 'up' : 'in'}" ${st.busy ? 'disabled' : ''}>${up ? T('Create account', 'إنشاء الحساب') : T('Sign in', 'دخول')}</button>` +
        `<button class="btn wide" data-act="acc" data-k="google" ${st.busy ? 'disabled' : ''}>G&nbsp; ${T('Continue with Google', 'المتابعة بحساب Google')}</button>` +
        (up ? '' : `<button class="acc-link" data-act="acc" data-k="reset">${T('Forgot password?', 'نسيت كلمة المرور؟')}</button>`) + `</div>${msgBox()}` + plansHtml(false);
    }
    const A_ = A.acct;
    if (A_.unverified) {
      return head + `<div class="acc-card"><b dir="ltr">${esc(A_.email || '')}</b><span class="acc-badge">${T('E-mail not verified', 'البريد لسه ما اتأكدش')}</span></div>` +
        `<p class="lead">${T('We sent a verification link to your e-mail. Open it, then come back and tap the button below. Check the Spam folder if you do not see it.', 'بعتنا رابط تحقق على بريدك. افتحه وبعدين ارجع واضغط الزرار اللي تحت. لو مش لاقيه بص في الرسائل غير المرغوبة (Spam).')}</p>` +
        `<button class="btn primary wide" data-act="acc" data-k="verified" ${st.busy ? 'disabled' : ''}>${T("I've verified my e-mail", 'أكدت بريدي')}</button>` +
        `<div class="row" style="margin-top:10px"><button class="btn" data-act="acc" data-k="resend" ${st.busy ? 'disabled' : ''}>${T('Resend the link', 'ابعت الرابط تاني')}</button><button class="btn danger" data-act="acc" data-k="out">${T('Sign out', 'تسجيل الخروج')}</button></div>${msgBox()}`;
    }
    const badge = A_.premium ? `<span class="acc-badge ok">${A_.trial ? '🎁 ' + T('Free trial until ', 'تجربة مجانية حتى ') : '⭐ ' + T('Premium until ', 'مشترك حتى ')}${fmtDate(A_.until)}</span>` : `<span class="acc-badge">${T('Free plan', 'الخطة المجانية')}</span>`;
    const lim = A_.limited ? `<div class="acc-msg bad">${T('This premium account is already active on 2 other devices. Contact us to change a device.', 'هذا الاشتراك مفعّل بالفعل على جهازين آخرين. تواصل معنا لتغيير أحد الأجهزة.')}</div>` : '';
    const pl = PLANS.find((p) => p.m === st.plan) || PLANS[1];
    const buy = ar()
      ? `السلام عليكم، عايز أشترك في Anatovia.\nالباقة: ${pl.ar}\nالسعر: ${pl.egp} جنيه\nإيميلي على التطبيق: ${A_.email || ''}`
      : `Hello, I'd like to subscribe to Anatovia.\nPlan: ${pl.en}\nPrice: ${pl.egp} EGP\nMy e-mail in the app: ${A_.email || ''}`;
    const trialCard = (!A_.premium && !A_.trialUsed && !A_.limited) ? `<div class="advice" style="margin:10px 0">🎁 <b>${T('Try Premium free for 3 days', 'جرّب النسخة المميزة 3 أيام مجانًا')}</b><div class="tiny">${T('One time per account — no payment needed.', 'مرة واحدة لكل حساب — من غير دفع.')}</div><button class="btn primary wide" style="margin-top:8px" data-act="acc" data-k="trial" ${st.busy ? 'disabled' : ''}>${T('Start my free trial', 'ابدأ تجربتي المجانية')}</button></div>` : '';
    return head + `<div class="acc-card"><b dir="ltr">${esc(A_.email || '')}</b>${badge}</div>${A.profileBlock ? A.profileBlock() : ''}${lim}${msgBox()}` + trialCard +
      plansHtml(true) + `<div class="row contact-row" style="margin-top:8px"><a class="btn contact wa" href="${waLink(buy)}" target="_blank" rel="noopener">💬 ${T('Subscribe on WhatsApp — ', 'اشترك على واتساب — ')}${T(pl.en, pl.ar)} · ${num(pl.egp)} ${T('EGP', 'جنيه')}</a></div>` +
      `<div class="lab">${T('Already have a code?', 'عندك كود؟')}</div><div class="acc-form"><input id="accCode" dir="ltr" autocapitalize="characters" autocomplete="off" placeholder="ANAT-XXXX-XXXX"><button class="btn primary wide" data-primary data-act="acc" data-k="redeem" ${st.busy ? 'disabled' : ''}>${T('Activate', 'تفعيل')}</button></div>${msgBox()}` +
      `<div class="row" style="margin-top:14px"><button class="btn danger" data-act="acc" data-k="out">${T('Sign out', 'تسجيل الخروج')}</button></div>`;
  }
  const t = (k) => A.t(k);

  function open() { st.msg = ''; A.modal(render); ensure(); }
  A.openAccount = open;
  /* Firestore handle for other modules (leaderboard): waits for the SDK + the auth state */
  A.getDb = async () => {
    if (!CFG) return null;
    try { await ensure(); } catch (e) { return null; }
    for (let i = 0; i < 30 && !st.authKnown; i++) await new Promise((r) => setTimeout(r, 150));
    if (!st.ready) return null;
    return { db, user: st.user || null, uid: st.user ? st.user.uid : null, verified: !A.acct.unverified, email: st.user ? st.user.email : '' };
  };
  /* paywall shown when a free user taps a Premium feature */
  A.paywall = (en, a) => {
    ensure();
    A.modal(() => {
      const u = A.acct, signed = !!(st.user || u.email);
      let cta;
      if (u.premium) cta = '';
      else if (!signed) cta = `<button class="btn primary wide" data-act="pwacc" data-m="up">🎁 ${T('Create a free account & start the 3-day trial', 'اعمل حساب مجاني وابدأ تجربة 3 أيام')}</button><button class="btn wide" style="margin-top:8px" data-act="pwacc" data-m="in">${T('I already have an account', 'عندي حساب بالفعل')}</button>`;
      else if (u.unverified) cta = `<button class="btn primary wide" data-act="pwacc">✉️ ${T('Verify your e-mail to start the trial', 'أكّد بريدك علشان تبدأ التجربة')}</button>`;
      else if (!u.trialUsed && !u.limited) cta = `<button class="btn primary wide" data-act="acc" data-k="trial">🎁 ${T('Start my free trial — 3 days', 'ابدأ تجربتي المجانية — 3 أيام')}</button>`;
      else cta = `<button class="btn primary wide" data-act="pwacc">⭐ ${T('See plans & subscribe', 'شوف الباقات واشترك')}</button>`;
      return `<h2>🔒 ${T('Premium feature', 'ميزة للمشتركين')}</h2><p class="lead">${esc(T(en || 'This feature is part of Premium.', a || 'الميزة دي ضمن النسخة المميزة.'))}</p>` + cta +
        `<p class="tiny" style="margin-top:10px">${T('Free: all bones, main muscles, 3D, daily & friend challenges, 5 special tests, 10 quiz questions a day.', 'المجاني: كل العظام والعضلات الأساسية و3D والتحديات و5 اختبارات خاصة و10 أسئلة كويز في اليوم.')}</p>`;
    });
  };
  A.acts.pwacc = (el) => { if (el && el.dataset && el.dataset.m) st.mode = el.dataset.m; open(); };

  apply(); // restore cached premium state immediately (works offline)
  if (CFG && cache && navigator.onLine) setTimeout(ensure, 1500); // previously signed in → refresh in background
})();
