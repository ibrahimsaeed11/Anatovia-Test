/* voice.js — "Lab mode" 🧤: a hands-free conversation with the 3D model.
   «فين العصب الأوسط؟» → the model flies to it and the app answers by voice; unsure matches are confirmed by voice («أيوه» / «لأ» / «الأول» / «التاني»).
   Also: layers («اخفي العضلات», «العظام بس»), regions, origin / insertion / nerve questions, nerve-injury and special-test read-outs, an oral quiz, notes by voice and small helpers.
   Uses the browser's Web Speech API (SpeechRecognition + speechSynthesis): Chrome / Edge, internet needed (the audio is sent to Google by the browser). */
'use strict';
if (!window.__voxLoaded) (() => {
  window.__voxLoaded = 1;
  const { S, esc, P } = A;
  const ar = () => S.lang === 'ar';
  const T = (en, a) => (ar() ? a : en);
  const getSR = () => window.SpeechRecognition || window.webkitSpeechRecognition;
  const canTalk = () => 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
  const FREE_PER_DAY = 5, IDLE_MS = 180000;

  /* ───────── text helpers ───────── */
  const words = (s) => norm(String(s || '')).replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean);
  const stem = (w) => (w.length > 4 && w.startsWith('ال') ? w.slice(2) : w);
  const toks = (s) => words(s).map(stem);
  function lev(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i]; let min = i;
      for (let j = 1; j <= b.length; j++) { const v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); cur.push(v); if (v < min) min = v; }
      if (min > max) return max + 1; prev = cur;
    }
    return prev[b.length];
  }
  function tokScore(q, g) {            // 0..1 how well query token q matches name token g
    if (q === g) return 1;
    if (q.length >= 3 && (g.startsWith(q) || (g.length >= 3 && q.startsWith(g)))) return 0.9;
    if (q.length >= 4 && lev(q, g, 1) <= 1) return 0.85;
    if (q.length >= 7 && lev(q, g, 2) <= 2) return 0.75;
    return 0;
  }
  function setScore(q, g) {            // q, g: token arrays
    if (!q.length || !g.length) return 0;
    let sum = 0; for (const t of q) { let b = 0; for (const x of g) { const s = tokScore(t, x); if (s > b) b = s; } sum += b; }
    const base = sum / q.length, pen = Math.min(0.3, Math.max(0, g.length - q.length) * 0.03);
    return base < 0.7 ? 0 : base - pen;
  }

  /* groups = one entry per structure name (left + right merged) */
  let GROUPS = null;
  function groups() {
    if (GROUPS) return GROUPS;
    const m = new Map();
    for (const e of P) { let g = m.get(e.baseEn); if (!g) { g = { en: e.baseEn, ar: e.baseAr, items: [], tAr: toks(e.baseAr), tEn: toks(e.baseEn), sys: e.sys, grp: e.grp }; m.set(e.baseEn, g); } g.items.push(e); }
    GROUPS = [...m.values()]; return GROUPS;
  }
  function match1(q) {                  // → [{g, s}] best first (max 3, deduped)
    const out = [];
    for (const g of groups()) { let s = Math.max(setScore(q, g.tAr), setScore(q, g.tEn)); if (s > 0) { if (g.sys === 'bone' && s >= 0.85) s += 0.05; out.push({ g, s }); } }
    out.sort((a, b) => b.s - a.s || a.g.en.length - b.g.en.length);
    return out.slice(0, 3);
  }
  const TYPEW = new Set('عظمه عظم عضله عصب شريان وريد bone muscle nerve artery vein'.split(' '));
  function match(q) {                   // if nothing good, retry without generic words ("عظمة العضد" → "العضد")
    let c = match1(q);
    if (!c.length || c[0].s < 0.9) { const q2 = q.filter((x) => !TYPEW.has(x)); if (q2.length && q2.length < q.length) { const c2 = match1(q2); if (c2.length && (!c.length || c2[0].s > c[0].s)) c = c2; } }
    return c;
  }
  /* everyday names that the catalog spells differently, or that cover several structures at once */
  const ALIAS = [
    [/كوادر|رباعي|فخذ.*امام|امام.*فخذ|^quadriceps$/, ['Rectus femoris', 'Vastus lateralis', 'Vastus medialis', 'Vastus intermedius'], 'العضلة رباعية الرؤوس الفخذية', 'Quadriceps'],
    [/هامستر|فخذ.*خلف|خلف.*فخذ|^hamstrings?$/, ['Biceps femoris (Long head)', 'Biceps femoris (Short head)', 'Semitendinosus', 'Semimembranosus'], 'عضلات الفخذ الخلفية (الهامسترنج)', 'Hamstrings'],
    [/(^| )(سمان|سمانه)( |$)|ساق.*خلف|^calf$/, ['Gastrocnemius (Medial head)', 'Gastrocnemius (Lateral head)', 'Soleus'], 'عضلات السمانة', 'Calf muscles'],
    [/(^| )(ارداف|اليه|الويه|مؤخره|glutes?|gluteal)( |$)/, ['Gluteus maximus', 'Gluteus medius', 'Gluteus minimus'], 'العضلات الإلوية', 'Gluteal muscles'],
    [/بايسبس|بيسبس|^biceps$/, ['Biceps brachii (Long head)', 'Biceps brachii (Short head)'], 'العضلة ذات الرأسين العضدية', 'Biceps brachii'],
    [/ترايسبس|تريسبس|^triceps$/, ['Triceps brachii (Long head)', 'Triceps brachii (Lateral head)', 'Triceps brachii (Medial head)'], 'العضلة ثلاثية الرؤوس العضدية', 'Triceps brachii'],
    [/(^| )(كفه|cuff)( |$)|rotator cuff/, ['Supraspinatus', 'Infraspinatus', 'Teres minor', 'Subscapularis'], 'الكفة المدورة', 'Rotator cuff'],
    [/اكيليس|اخيل|achilles/, ['Calcaneal (Achilles) tendon'], 'وتر العرقوب (أخيل)', 'Achilles tendon'],
    [/(^| )(صدر|pecs?|pectorals?)( |$)/, ['Pectoralis major (Clavicular part)', 'Pectoralis major (Sternocostal part)', 'Pectoralis major (Abdominal part)'], 'العضلة الصدرية الكبرى', 'Pectoralis major'],
    [/(^| )(ضامه|ضامات|adductors)( |$)/, ['Adductor longus', 'Adductor brevis', 'Adductor magnus', 'Adductor minimus'], 'العضلات الضامة', 'Hip adductors'],
    [/لاتس|لاتيسيموس|latissimus/, ['Latissimus dorsi'], 'العضلة العريضة الظهرية', 'Latissimus dorsi'],
    [/ايليوبسواس|ايلوبسواس|حرقفيه قطنيه|iliopsoas/, ['Iliacus', 'Psoas major'], 'العضلة الحرقفية القطنية', 'Iliopsoas'],
    [/^عصب متوسط$|^متوسط عصب$/, ['Median nerve'], 'العصب الأوسط', 'Median nerve'],
  ];
  function aliasOf(q) {
    const j = q.join(' ');
    for (const [rx, names, lab, labEn] of ALIAS) if (rx.test(j)) { const gs = names.map((n) => groups().find((g) => g.en === n)).filter(Boolean); if (gs.length) return { gs, lab: ar() ? lab : labEn }; }
    return null;
  }
  const clear = (c) => {                // confident enough to act without asking?
    if (!c.length) return false;
    const t = c.filter((x) => x.s >= c[0].s - 0.045);
    if (t.length === 1) return c[0].s >= 0.92;
    return c[0].s >= 0.88 && t.every((x) => x.g.grp && x.g.grp === t[0].g.grp && x.g.sys === 'muscle');    // several parts of the same muscle
  };

  /* ───────── vocabulary ───────── */
  const SET = (s) => new Set(s.split(' '));
  const W = {
    stop: SET('وقف كفايه خلاص اقفل انهاء سلام stop exit quit bye'),
    hide: SET('اخفي اخفيه اخفيها شيل اخفى اقفل hide remove'),
    iso: SET('اعزل اعزلها اعزله عزل isolate'),
    info: SET('وظيفه اشرح اشرحلي معلومات قولي احكيلي عرفني info explain function'),
    find: SET('فين وين وريني ورينا اعرض اظهر اظهرلي اشوف ابحث دلني هات show find where افتح'),
  };
  const FILL = SET('عايز عاوز عايزه ممكن لو سمحت يا بقي بقى ده دي دا اللي هو هي علي على عن عني لي ليا انا ل لـ ايه اي the me please can you to of about where is is what whats the اسمه اسمها بتاع بتاعها بتاعه خلي خليه خليها خلى علمها علمه علم ضيفها ضيفه ضيف اضف يحصل حصل اللي ايه');
  const SIDE = { r: SET('يمين اليمين ايمن يمني right'), l: SET('شمال الشمال يسار اليسار ايسر يسري left') };
  const YES = SET('ايوه ايوا ايوة اه ماشي تمام صح اكيد ياس اجل ايوه yes yeah yep ok okay correct right');
  const NO = SET('لا لأ لاء غلط لالا مش no nope wrong');
  const hasAny = (ws, set) => ws.some((w) => set.has(w) || set.has(stem(w)));
  const isYes = (ws) => hasAny(ws, YES) && !hasAny(ws, NO);
  const isNo = (ws) => hasAny(ws, NO);
  const LAYERW = {
    bone: SET('عظام عظم عضم عضام هيكل bones skeleton'), muscle: SET('عضلات عضلات muscles'), vessel: SET('اوعيه اوعيه شرايين اوردة دموي دمويه vessels arteries veins'),
    nerve: SET('اعصاب nerves'), brain: SET('مخ المخ دماغ brain'), organ: SET('اعضاء احشاء organs viscera'), ligament: SET('اربطه اربطه ligaments'),
  };
  const LAYER_NAME = { bone: ['bones', 'العظام'], muscle: ['muscles', 'العضلات'], vessel: ['vessels', 'الأوعية الدموية'], nerve: ['nerves', 'الأعصاب'], brain: ['the brain', 'المخ'], organ: ['organs', 'الأعضاء'], ligament: ['ligaments', 'الأربطة'] };
  const LAYER_SINGLE = { عضله: 'muscle', عصب: 'nerve', muscle: 'muscle', nerve: 'nerve', bone: 'bone', ligament: 'ligament', organ: 'organ', vessel: 'vessel' };   // a lone singular noun also means the layer
  const GHOSTW = SET('شفاف شفافه شفافة باهت خفف ghost transparent');
  const SOLOW = SET('بس فقط لوحدها لوحده only just');
  const ALLW = SET('كل كله الكل حاجه الطبقات طبقات طبقه layers layer all everything');
  const REGW = {
    head: SET('راس راسي وش وجه head face'), neck: SET('رقبه عنق neck'), spine: SET('عمود فقري ظهر ضهر spine back'), thorax: SET('صدر قفص صدري thorax chest'),
    abdomen: SET('بطن abdomen'), pelvis: SET('حوض pelvis'), upper: SET('ذراع يد ايد upper arm'), lower: SET('رجل lower leg'),
  };
  const REG_NAME = { head: ['the head', 'الرأس'], neck: ['the neck', 'الرقبة'], spine: ['the spine', 'العمود الفقري'], thorax: ['the chest', 'الصدر'], abdomen: ['the abdomen', 'البطن'], pelvis: ['the pelvis', 'الحوض'], upper: ['the upper limb', 'الطرف العلوي'], lower: ['the lower limb', 'الطرف السفلي'] };
  const REGX = SET('طرف علوي سفلي جسم الجسم كله');       // region helper words
  const QA = {
    origin: SET('اصل اصلها منشا منشاها منشاه origin'), insertion: SET('ادخال ادخالها انغراس انغراسها اندغام insertion'),
    nerve: SET('تعصيب تعصيبها بتتغذي بتتغذى بيغذي بيغذيها تغذيه عصبها عصبه innervation supply supplied'),
  };
  const INJ = SET('اتقطع قطع تلف اصابه اصيب اتصاب اتاذي اذي شلل injury injured cut damage damaged palsy lesion');
  const TESTW = SET('اختبار علامه test sign tests');
  const MISC = {
    repeat: SET('كرر كررها اعد اعيد repeat'), slow: SET('ابطا ابطي بطيء ببطء بطي slower slow'), fast: SET('اسرع عادي normal faster'),
    english: SET('انجليزي انجليزى انجليزيه بالانجليزي بالانجليزيه english pronounce نطق'), learned: SET('محفوظه محفوظ حفظتها اتحفظت learned'),
    fav: SET('مفضله المفضله للمفضله للمفضلة favorite favourite favorites'), explode: SET('فرق فرقها تفريق explode'), spin: SET('لف لفه يلف spin rotate'),
    view: SET('الزاويه زاويه الكاميرا المنظر'), quizv: SET('اختبرني امتحني اسالني اسالنا شفهي'), quizapp: SET('كويز quiz'), skip: SET('تخطي تخطى بعده التالي التاليه skip next'), dunno: SET('معرفش مش عارف معرفش dunno'),
  };
  const ALLTRIG = [W.stop, W.hide, W.iso, W.info, W.find, FILL, GHOSTW, SOLOW, INJ, TESTW, ...Object.values(QA), ...Object.values(MISC)];
  const isTrig = (w) => ALLTRIG.some((s) => s.has(w));
  const rootTok = (w) => stem(w);

  function qOf(ws0) {                  // → { q: name tokens, side }
    let side = null; const q = [];
    for (const w of ws0) {
      if (SIDE.r.has(w)) { side = 'r'; continue; }
      if (SIDE.l.has(w)) { side = 'l'; continue; }
      if (isTrig(w)) continue;
      q.push(stem(w));
    }
    return { q, side };
  }
  const sysOf = (w) => { const s = stem(w); for (const k of Object.keys(LAYERW)) if (LAYERW[k].has(w) || LAYERW[k].has(s)) return k; return null; };
  const regOf = (w) => { const s = stem(w); for (const k of Object.keys(REGW)) if (REGW[k].has(w) || REGW[k].has(s)) return k; return null; };

  /* parse → intent. Works on one transcript. */
  function parse(text) {
    const raw = String(text || ''), ws0 = words(raw); if (!ws0.length) return { act: 'none' };
    const joined = ws0.join(' ');
    if (hasAny(ws0, W.stop) && ws0.length <= 3 && !ws0.some((w) => sysOf(w))) return { act: 'stop' };
    if (hasAny(ws0, MISC.quizv)) return { act: 'vquiz' };
    if (hasAny(ws0, MISC.quizapp)) return { act: 'quiz' };
    if (/ملاحظ|note/i.test(raw)) {                                  // note dictation: «سجّل ملاحظة: …»
      const m = /(?:ملاح[ظض][ةه]|note)\s*[:：،,-]?\s*(.*)$/i.exec(raw); return { act: 'note', text: m ? m[1].trim() : '' }; }
    if (/(رجع|ريسيت|reset).*(الزاويه|زاويه|الكاميرا|view|camera)|(الزاويه|زاويه).*(رجع|اول)/.test(joined)) return { act: 'view' };
    if (/(رجع|اظهر|show|reset)\s*(الكل|كل|all|everything)(?=\s|$)|رجعهم|^(الكل|ريسيت|reset)$/.test(joined) && !ws0.some((w) => sysOf(w)) && !/طبق|layer|حاجه/.test(joined)) return { act: 'reset' };
    if (hasAny(ws0, MISC.slow)) return { act: 'rate', v: 0.75 };
    if (hasAny(ws0, MISC.fast) && ws0.length <= 3) return { act: 'rate', v: 0.95 };
    if (hasAny(ws0, MISC.repeat) || /قول.*تاني/.test(joined)) return { act: 'repeat' };
    if (/(عملت|حليت|جاوبت).*(كام|كم)|تقدمي|نتيجتي|ادائي|progress|my score|how many/.test(joined)) return { act: 'progress' };
    if (hasAny(ws0, MISC.explode)) return { act: 'explode' };
    if (hasAny(ws0, MISC.spin) && ws0.length <= 3) return { act: 'spin' };
    if (hasAny(ws0, MISC.english)) { const o = qOf(ws0); return { act: 'english', q: o.q, side: o.side }; }
    if (hasAny(ws0, MISC.learned)) { const o = qOf(ws0); return { act: 'learned', q: o.q, side: o.side }; }
    if (hasAny(ws0, MISC.fav)) { const o = qOf(ws0); return { act: 'fav', q: o.q, side: o.side }; }
    // ----- regions & layers: only when the sentence is nothing but those words -----
    const o0 = qOf(ws0);
    const rest = ws0.filter((w) => !isTrig(w) && !SIDE.r.has(w) && !SIDE.l.has(w));
    if (rest.length === 1 && LAYER_SINGLE[stem(rest[0])]) { const op0 = hasAny(ws0, GHOSTW) ? 'ghost' : hasAny(ws0, W.hide) ? 'hide' : 'show'; return { act: 'layer', op: op0, sys: [LAYER_SINGLE[stem(rest[0])]], all: false }; }
    const nonLayer = rest.filter((w) => !sysOf(w) && !ALLW.has(w) && !ALLW.has(stem(w)) && !regOf(w) && !REGX.has(w) && !REGX.has(stem(w)));
    if (rest.length && !nonLayer.length) {
      const regs = [...new Set(rest.map(regOf).filter(Boolean))];
      const sy = [...new Set(rest.map(sysOf).filter(Boolean))];
      const hasUp = rest.some((w) => /^(علوي)$/.test(stem(w))), hasLow = rest.some((w) => /^(سفلي)$/.test(stem(w)));
      if (!sy.length && (regs.length || hasUp || hasLow || rest.some((w) => /جسم|كله/.test(w)))) {
        let reg = regs[0] || (hasUp ? 'upper' : hasLow ? 'lower' : null);
        if (hasUp) reg = 'upper'; if (hasLow) reg = 'lower';
        return { act: 'region', reg };
      }
      if (sy.length || rest.some((w) => ALLW.has(w) || ALLW.has(stem(w)))) {
        const op = hasAny(ws0, GHOSTW) ? 'ghost' : hasAny(ws0, W.hide) ? 'hide' : hasAny(ws0, SOLOW) ? 'solo' : 'show';
        return { act: 'layer', op, sys: sy, all: !sy.length };
      }
    }
    // ----- nerve injury / tests / questions -----
    if (hasAny(ws0, INJ) && o0.q.length) return { act: 'nerveinj', q: o0.q };
    if (hasAny(ws0, TESTW) && o0.q.length) return { act: 'test', q: o0.q };
    if (hasAny(ws0, TESTW) && !o0.q.length) return { act: 'vquiz' };
    const qaK = hasAny(ws0, QA.origin) ? 'origin' : hasAny(ws0, QA.insertion) ? 'insertion' : (hasAny(ws0, QA.nerve) || (ws0.some((w) => stem(w) === 'عصب') && ws0.some((w) => /^بتاع/.test(w)))) ? 'nerve' : null;
    if (qaK) return { act: 'qa', f: qaK, q: o0.q.filter((x) => x !== 'عصب' || qaK !== 'nerve'), side: o0.side };
    let act = 'find';
    for (const k of ['hide', 'iso', 'info', 'find']) if (hasAny(ws0, W[k])) { act = k; break; }
    if (!o0.q.length && act === 'find') return { act: 'none' };
    return { act, q: o0.q, side: o0.side };
  }

  /* ───────── state ───────── */
  const V = { on: false, st: 'idle', rec: null, silent: 0, bad: 0, opts: null, idle: 0, tmr: 0, heard: '', say: '', speaking: false, rate: 0.95, last: '', conf: 0 };
  const dayKey = () => new Date().toDateString();
  const used = () => { const c = Store.d.vc; return c && c.d === dayKey() ? c.n : 0; };
  const bump = () => { const c = Store.d.vc && Store.d.vc.d === dayKey() ? Store.d.vc : (Store.d.vc = { d: dayKey(), n: 0 }); c.n++; Store.save(); };
  const spoken = (t) => String(t || '').replace(/\s*\([^)]*\)/g, '').replace(/\s*[–-]\s*/g, '، ').trim();
  const gname = (g) => spoken(ar() ? g.ar : g.en);
  const sideWord = (s) => (s === 'r' ? T('right', 'الأيمن') : s === 'l' ? T('left', 'الأيسر') : '');
  const paidSys = (s) => A.PAID_SYS && A.PAID_SYS.has(s) && !A.isPremium();
  const ymdToday = () => { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };

  /* ───────── speaking ───────── */
  let voice = null, voiceFor = '';
  const pickVoice = (lang) => { try { const v = speechSynthesis.getVoices(), want = lang.slice(0, 2).toLowerCase(); voice = v.find((x) => x.lang.replace('_', '-').toLowerCase() === lang.toLowerCase()) || v.find((x) => x.lang.toLowerCase().startsWith(want)) || null; voiceFor = lang; } catch (e) { voice = null; } };
  if (canTalk()) { try { speechSynthesis.addEventListener('voiceschanged', () => { voiceFor = ''; }); } catch (e) { /* ignore */ } }
  function speak(text, cb, lang, ack) {
    text = String(text || ''); if (!lang && !ack) V.last = text;
    V.say = text; ui();
    if (!V.on) return;
    let done = false; const fin = () => { if (done) return; done = true; clearTimeout(guard); V.speaking = false; if (V.on && cb) cb(); };
    const guard = setTimeout(fin, Math.min(80000, 2500 + text.length * 110));
    if (!canTalk()) { setTimeout(fin, 700); return; }
    try {
      const L = lang || (ar() ? 'ar-EG' : 'en-US'); if (voiceFor !== L) pickVoice(L);
      speechSynthesis.cancel(); V.speaking = true;
      const u = new SpeechSynthesisUtterance(text); u.lang = L; u.rate = L.startsWith('ar') ? V.rate : Math.min(V.rate, 0.9); if (voice) u.voice = voice;
      u.onend = fin; u.onerror = fin; speechSynthesis.speak(u);
    } catch (e) { fin(); }
  }

  /* ───────── listening ───────── */
  function stopRec() { try { if (V.rec) { V.rec.onresult = V.rec.onerror = V.rec.onend = null; V.rec.abort(); } } catch (e) { /* ignore */ } V.rec = null; }
  function listen() {
    if (!V.on) return; stopRec();
    const SR = getSR(); if (!SR) return stopMode(T('Voice is not supported on this browser.', 'المتصفح ده مش بيدعم الصوت.'));
    const r = new SR(); V.rec = r; r.lang = ar() ? 'ar-EG' : 'en-US'; r.interimResults = false; r.maxAlternatives = 4; r.continuous = false;
    let got = false; V.heard = ''; ui('listen');
    r.onresult = (ev) => {
      got = true; const res = ev.results[ev.results.length - 1], alts = [];
      for (let i = 0; i < res.length; i++) alts.push(res[i].transcript);
      V.silent = 0; V.heard = alts[0] || ''; ui(); handle(alts);
    };
    r.onerror = (ev) => {
      const e = ev && ev.error;
      if (e === 'not-allowed' || e === 'service-not-allowed') { got = true; return stopMode(T('Allow the microphone for this site, then try again.', 'اسمح للميكروفون من إعدادات المتصفح وجرّب تاني.')); }
      if (e === 'network') { got = true; return stopMode(T('No internet — voice needs a connection.', 'مفيش إنترنت — الصوت محتاج اتصال.')); }
      if (e === 'audio-capture') { got = true; return stopMode(T('No microphone found.', 'مفيش ميكروفون شغال.')); }
    };
    r.onend = () => {
      if (got || !V.on || V.rec !== r) return;
      if (++V.silent >= 3) return stopMode(T('I did not hear anything, so I closed Lab mode.', 'ماسمعتش كلام، فقفلت وضع المعمل.'), true);
      setTimeout(listen, 250);
    };
    try { r.start(); } catch (e) { setTimeout(listen, 500); }
  }

  /* ───────── dialogue core ───────── */
  function handle(alts) {
    resetIdle();
    if (V.st === 'confirm') return handleConfirm(alts);
    if (V.st === 'quiz') return handleQuiz(alts);
    if (V.st === 'note') return handleNote(alts);
    let best = null;
    for (const a of alts) {
      const p = parse(a); if (p.act === 'none') continue;
      let c = [], sc = 1;
      if (p.q && p.q.length && ['find', 'iso', 'hide', 'info', 'qa', 'english', 'learned', 'fav'].includes(p.act)) { c = match(p.q); sc = c.length ? c[0].s : 0; }
      else if (p.act === 'nerveinj') sc = nerveCands(p.q)[0] ? nerveCands(p.q)[0].s : 0;
      else if (p.act === 'test') sc = testCands(p.q)[0] ? testCands(p.q)[0].s : 0;
      if (!best || sc > best.sc) best = { p, c, sc };
      if (sc >= 1) break;
      if (['stop', 'vquiz', 'quiz', 'reset', 'layer', 'region', 'note'].includes(p.act)) { best = { p, c: [], sc: 2 }; break; }
    }
    if (!best) { if (alts.some((a) => isNo(words(a)))) return speak(T('OK, say it again.', 'تمام، قول تاني.'), listen); return unknown(); }
    V.bad = 0; run(best.p, best.c);
  }
  function unknown() {
    V.bad++;
    const hint = V.bad >= 2 ? T(' Try: where is the median nerve? or: hide the muscles.', ' جرّب تقول: فين العصب الأوسط؟ أو: اخفي العضلات.') : '';
    speak(T('I did not get that, say it again.', 'مافهمتش، قولها تاني.') + hint, listen);
  }
  function limitHit() {
    if (A.isPremium() || used() < FREE_PER_DAY) return false;
    stopMode(); const msg = T('You used your free voice commands for today. Premium has no limit.', 'خلصت الأوامر الصوتية المجانية النهاردة. الاشتراك بيفتحها من غير حد.');
    A.toast(msg, 4500); setTimeout(() => A.paywall('Unlimited voice commands are part of Premium (5 free per day).', 'الأوامر الصوتية من غير حد ضمن النسخة المميزة (5 مجانية في اليوم).'), 600);
    return true;
  }
  function pickItem(g, side) {
    const s = side || (g.items.some((x) => x.side === 'r') ? 'r' : null);
    return g.items.find((x) => x.side === s) || g.items[0];
  }
  /* choose between options by voice: opts = [{ label, toks: [tokArrays], fn }] */
  function askChoice(opts, intro) {
    V.st = 'confirm'; V.opts = opts; V.conf = 0;
    const ns = opts.map((o) => o.label);
    speak((intro ? intro + ' ' : '') + (ns.length === 1 ? T(`Do you mean ${ns[0]}?`, `قصدك ${ns[0]}؟`) : T(`Do you mean ${ns.join(', or ')}?`, `قصدك ${ns.join('، ولا ')}؟`)), listen);
  }
  function handleConfirm(alts) {
    const opts = V.opts || [];
    for (const a of alts) {
      const ws = words(a), joined = ws.join(' ');
      if (isNo(ws) && !/(الاول|اول|التاني|ثاني|التالت|ثالث)/.test(joined)) { V.st = 'cmd'; V.opts = null; return speak(T('OK, say it again.', 'تمام، قولها تاني.'), listen); }
      let k = -1;
      if (/(^| )(الاول|اول|الاولي|first|1|واحد)( |$)/.test(joined)) k = 0;
      else if (/(^| )(التاني|ثاني|الثاني|تاني|second|2|اتنين|اثنين)( |$)/.test(joined)) k = 1;
      else if (/(^| )(التالت|ثالث|الثالث|third|3|تلاته|ثلاثه)( |$)/.test(joined)) k = 2;
      else if (isYes(ws)) k = 0;
      else { const q = toks(a); let bs = 0; opts.forEach((o, i) => { const s = Math.max(0, ...o.toks.map((t) => setScore(q, t))); if (s > bs) { bs = s; k = i; } }); if (bs < 0.8) k = -1; }
      if (k >= 0 && opts[k]) { V.st = 'cmd'; const o = opts[k]; V.opts = null; return o.fn(); }
    }
    if (++V.conf >= 2) { V.st = 'cmd'; V.opts = null; return speak(T('OK, say it again.', 'تمام، قولها تاني.'), listen); }
    speak(T('Say yes, no, first or second.', 'قول أيوه، أو لأ، أو الأول، أو التاني.'), listen);
  }

  /* resolve "which structure": named (alias / clear match / ask) or the current selection → fn(target, same, label) */
  function withTarget(p, c, fn) {
    if (!(p.q && p.q.length)) {
      if (S.sel < 0) return speak(T('Which structure?', 'أنهي تركيب؟'), listen);
      return fn(P[S.sel], null, null);
    }
    const al = aliasOf(p.q); if (al) return fn(al.gs[0], al.gs, al.lab);
    if (!c.length) return speak(T('I could not find that. Say the name again.', 'ملقيتش التركيب ده. قول الاسم تاني.'), listen);
    if (clear(c)) return fn(c[0].g, c.filter((x) => x.s >= c[0].s - 0.045).map((x) => x.g), null);
    askChoice(c.map((x) => ({ label: gname(x.g), toks: [x.g.tAr, x.g.tEn], fn: () => fn(x.g, null, null) })));
  }
  async function run(p, c) {
    V.st = 'cmd';
    switch (p.act) {
      case 'stop': return stopMode(T('Bye!', 'مع السلامة!'), true, true);
      case 'reset': S.hl = null; S.focus = null; A.acts.showall(); return speak(T('Everything is back.', 'رجّعت كل حاجة.'), listen);
      case 'quiz': stopMode(); A.toast(T('Opening the quiz…', 'بفتحلك الاختبار…'), 2000); setTimeout(() => A.acts.hub({ dataset: { k: 'quiz' } }), 300); return;
      case 'vquiz': return startVQuiz();
      case 'layer': return doLayer(p);
      case 'region': return doRegion(p);
      case 'explode': A.acts.explode(); return speak(T('Exploded view.', 'فرّقت الأجزاء.'), listen);
      case 'spin': A.acts.spin(); return speak(S.spin ? T('Spinning.', 'بلف المجسم.') : T('Stopped spinning.', 'وقفت اللف.'), listen);
      case 'view': A.acts.resetview(); return speak(T('View reset.', 'رجّعت الزاوية.'), listen);
      case 'repeat': return speak(V.last || T('Nothing to repeat yet.', 'لسه مفيش حاجة أكررها.'), listen);
      case 'rate': V.rate = p.v; return speak(p.v < 0.9 ? T('Slower now.', 'هتكلم أبطأ.') : T('Normal speed.', 'رجعت للسرعة العادية.'), listen, null, true);
      case 'progress': return doProgress();
      case 'note': return doNote(p);
      case 'nerveinj': return doNerveInj(p);
      case 'test': return doTest(p);
      case 'english': return withTarget(p, c, (t, same, label) => { const e = t.items ? pickItem(t, p.side) : t; speak(spoken((t.items ? t.en : e.baseEn) || e.baseEn), listen, 'en-US'); });
      case 'learned': case 'fav': return withTarget(p, c, (t) => doMark(p.act, t.items ? pickItem(t, p.side) : t));
      case 'qa': return withTarget(p, c, (t) => doQA(p.f, t.items ? (t.items.find((x) => x.mu) || pickItem(t, p.side)) : t));
      default: return withTarget(p, c, (t, same, label) => exec(p.act, t, same, p.side, label));
    }
  }
  async function exec(act, target, same, side, label) {
    if (limitHit()) return;
    V.st = 'cmd'; V.opts = null;
    const e = target.items ? pickItem(target, side) : target, g = target.items ? target : null;
    if (e.lk && !A.isPremium()) return speak(T('This structure is for Premium subscribers.', 'التركيب ده للمشتركين.'), listen);
    bump();
    try {
      if (act === 'info') await A.select(e.i); else await A.select(e.i, { noPanel: true });
      if (g && same && same.length > 1) {                          // all parts of one muscle: tint the others too
        S.hl = new Map(); same.forEach((x) => x.items.forEach((it) => { if (it.i !== e.i && (!e.side || it.side === e.side)) S.hl.set(it.i, [1, 0.78, 0.18, 0.55]); })); A.apply();
      } else if (S.hl && S.hl.size) { S.hl = null; A.apply(); }
      if (act === 'iso') { if (S.hl && S.hl.size) { S.focus = new Set([e.i, ...S.hl.keys()]); } else S.iso = e.i; A.apply(); }
      if (act === 'hide') { A.acts.hide(); return speak(T('Hidden.', 'اخفيته.'), listen); }
    } catch (er) { return speak(T('Something went wrong.', 'حصلت مشكلة.'), listen); }
    const nm = (label || (g ? gname(g) : spoken(ar() ? e.baseAr : e.baseEn))) + (e.side ? ' ' + sideWord(e.side) : '');
    if (act === 'info') return speak(label ? label + '. ' + describe(e) : describe(e), listen);
    speak(act === 'iso' ? T(`Isolated: ${nm}`, `عزلت ${nm}`) : nm, listen);
  }
  function describe(e) {
    const name = spoken(ar() ? e.baseAr : e.baseEn); let t = name + '. ';
    if (e.sum) t += (ar() ? e.sum[1] : e.sum[0]) + '. ';
    if (e.mu) { const m = e.mu; t += ar() ? `الوظيفة: ${m[5]}. العصب: ${m[7]}.` : `Action: ${m[4]}. Nerve: ${m[6]}.`; }
    else if (!e.sum && e.facts && e.facts[0]) t += ar() ? e.facts[0][1] : e.facts[0][0];
    return t.length > 420 ? t.slice(0, 420) : t;
  }

  /* ───────── layers & regions ───────── */
  async function doLayer(p) {
    const all = ['bone', 'muscle', 'vessel', 'nerve', 'brain', 'organ', 'ligament'];
    let sys = p.sys.slice(); if (p.all) sys = all.filter((s) => !paidSys(s) || p.op === 'hide');
    if (!sys.length) return speak(T('Which layer?', 'أنهي طبقة؟'), listen);
    const nm = (s) => T(LAYER_NAME[s][0], LAYER_NAME[s][1]), names = sys.map(nm).join(T(' and ', ' و'));
    const locked = sys.filter((s) => paidSys(s) && p.op !== 'hide');
    if (locked.length) return speak(T(`${locked.map(nm).join(', ')}: for Premium subscribers.`, `${locked.map(nm).join('، ')} للمشتركين فقط.`), listen);
    try {
      if (p.op === 'solo') { for (const s of all) S.layers[s] = sys.includes(s) ? 'on' : 'off'; for (const s of sys) await A.ensure(s); }
      else if (p.op === 'hide') { for (const s of sys) S.layers[s] = 'off'; }
      else { for (const s of sys) { await A.ensure(s); S.layers[s] = p.op === 'ghost' ? 'ghost' : 'on'; } }
      A.apply();
    } catch (e) { return speak(T('Something went wrong.', 'حصلت مشكلة.'), listen); }
    speak(p.op === 'hide' ? T(`Hid ${names}.`, `اخفيت ${names}.`) : p.op === 'ghost' ? T(`Made ${names} transparent.`, `خلّيت ${names} شفافة.`) : p.op === 'solo' ? T(`${names} only.`, `${names} بس.`) : T(`Showing ${names}.`, `ظهّرت ${names}.`), listen);
  }
  function doRegion(p) {
    try { S.region = p.reg || null; A.apply(); A.flyRegion(p.reg || null); } catch (e) { return speak(T('Something went wrong.', 'حصلت مشكلة.'), listen); }
    speak(p.reg ? T(`Showing ${REG_NAME[p.reg][0]}.`, `بركّز على ${REG_NAME[p.reg][1]}.`) : T('Whole body.', 'الجسم كله.'), listen);
  }
  /* highlight a set of structures on the model: entries = [[system, RegExp], …] */
  async function showSet(entries) {
    const hl = new Map(), syss = new Set(); let first = null;
    for (const e of P) {
      if (e.side === 'l') continue;
      for (const [s, rx] of entries) if (e.sys === s && rx.test(e.baseEn) && !(paidSys(s))) { hl.set(e.i, s === 'nerve' ? [0, 0.95, 1, 0.92] : [1, 0.35, 0.25, 0.65]); syss.add(s); if (!first || (s === 'nerve' && first.sys !== 'nerve')) first = e; }
    }
    if (!hl.size) return false;
    for (const s of syss) { await A.ensure(s); S.layers[s] = 'on'; }
    S.sel = -1; S.hl = hl; S.focus = new Set(hl.keys()); A.apply(); if (first) A.flyToPart(first);
    return true;
  }

  /* ───────── content questions ───────── */
  function doQA(f, e) {
    if (limitHit()) return; bump();
    const name = spoken(ar() ? e.baseAr : e.baseEn);
    if (!e.mu) return speak(T(`${name}: origin, insertion and nerve are available for muscles only.`, `${name}: الأصل والإدخال والعصب متاحين للعضلات بس.`), listen);
    const m = e.mu;
    const txt = f === 'origin' ? (ar() ? `أصلها: ${m[1]}` : `Origin: ${m[0]}`) : f === 'insertion' ? (ar() ? `إدخالها: ${m[3]}` : `Insertion: ${m[2]}`) : (ar() ? `العصب المغذي: ${m[7]}` : `Nerve supply: ${m[6]}`);
    A.select(e.i, { noPanel: true }); speak(`${name}. ${txt}`, listen);
  }
  const nerves = () => window.NERVE_MAP || null;
  function nerveCands(q) {
    const N = nerves(); if (!N) return [];
    const out = N.map((n) => { if (!n._t) n._t = [toks(n.ar), toks(n.en)]; return { n, s: Math.max(setScore(q, n._t[0]), setScore(q, n._t[1])) }; }).filter((x) => x.s >= 0.75);
    out.sort((a, b) => b.s - a.s); return out.length ? out.filter((x) => x.s >= out[0].s - 0.12).slice(0, 3) : [];
  }
  function doNerveInj(p) {
    if (!nerves()) return speak(T('The nerve map is still loading, try again.', 'خريطة الأعصاب لسه بتتحمل، جرّب تاني.'), listen);
    const c = nerveCands(p.q); if (!c.length) return speak(T('I could not find that nerve. Say its name again.', 'ملقيتش العصب ده. قول اسمه تاني.'), listen);
    if (!A.isPremium() && !c.some((x) => x.n.id === A.FREE_NERVE)) return speak(T('The nerve injury map is for Premium subscribers.', 'خريطة إصابات الأعصاب للمشتركين.'), listen);
    const go = (n) => async () => {
      if (limitHit()) return;
      if (n.id !== A.FREE_NERVE && !A.isPremium()) return speak(T('The nerve injury map is for Premium subscribers.', 'خريطة إصابات الأعصاب للمشتركين.'), listen);
      bump(); V.st = 'cmd';
      await showSet([['nerve', n.trunk], ...n.cut.map((r) => ['nerve', r]), ...n.mus.map((r) => ['muscle', r])]);
      speak(ar() ? `${n.ar}. الجذور ${n.roots}. السبب الشائع: ${n.siteAr}. ${n.mAr} ${n.sAr}` : `${n.en}. Roots ${n.roots}. Common cause: ${n.siteEn}. ${n.mEn} ${n.sEn}`, listen);
    };
    if (c.length === 1 || c[0].s - c[1].s > 0.06) return go(c[0].n)();
    askChoice(c.map((x) => ({ label: ar() ? x.n.ar : x.n.en, toks: [x.n._t[0], x.n._t[1]], fn: go(x.n) })), T('Which level?', 'الإصابة فين؟'));
  }
  /* special tests */
  let TL = null;
  function tests() {
    if (TL) return TL; const J = window.JOINTS, TC = window.TEST_CARDS; if (!J || !TC) return null;
    TL = []; for (const j of J) for (const x of j.tests || []) { const k = j.id + '|' + x[0]; if (TC[k]) TL.push({ k, j, x, tAr: toks(x[1]), tEn: toks(x[0]) }); }
    return TL;
  }
  function testCands(q) {
    const L = tests(); if (!L) return [];
    const out = L.map((t) => ({ t, s: Math.max(setScore(q, t.tAr), setScore(q, t.tEn)) })).filter((x) => x.s >= 0.75);
    out.sort((a, b) => b.s - a.s); return out.length ? out.filter((x) => x.s >= out[0].s - 0.06).slice(0, 3) : [];
  }
  function doTest(p) {
    if (!tests()) return speak(T('The tests are still loading, try again.', 'الاختبارات لسه بتتحمل، جرّب تاني.'), listen);
    const c = testCands(p.q); if (!c.length) return speak(T('I could not find that test. Say its name again.', 'ملقيتش الاختبار ده. قول اسمه تاني.'), listen);
    if (!A.isPremium() && !c.some((x) => A.FREE_TESTS.has(x.t.x[0]))) return speak(T('This special test is for Premium subscribers.', 'الاختبار ده للمشتركين.'), listen);
    const go = (t) => async () => {
      if (limitHit()) return;
      if (!A.FREE_TESTS.has(t.x[0]) && !A.isPremium()) return speak(T('This special test is for Premium subscribers.', 'الاختبار ده للمشتركين.'), listen);
      bump(); V.st = 'cmd';
      const card = window.TEST_CARDS[t.k], steps = (ar() ? card[1] : card[0]), x = t.x;
      try { await showSet(card[2] || []); } catch (e) { /* ignore */ }
      speak(ar() ? `${x[1]}. بيفحص ${x[3]}. الخطوات: ${steps.map((s, i) => `${i + 1}، ${s}`).join(' ')} النتيجة الإيجابية: ${x[5]}` : `${x[0]}. It checks ${x[2]}. Steps: ${steps.map((s, i) => `${i + 1}, ${s}`).join(' ')} Positive finding: ${x[4]}`, listen);
    };
    if (c.length === 1 || c[0].s - c[1].s > 0.06) return go(c[0].t)();
    askChoice(c.map((x) => ({ label: (ar() ? x.t.x[1] : x.t.x[0]) + ' — ' + (ar() ? x.t.j.ar : x.t.j.en), toks: [x.t.tAr, x.t.tEn], fn: go(x.t) })), T('Which test?', 'أنهي اختبار؟'));
  }

  /* ───────── small utilities ───────── */
  function doProgress() {
    const o = (Store.d.act || {})[ymdToday()] || { n: 0, c: 0 };
    if (!o.n) return speak(T('You have not answered any questions today yet.', 'لسه ما جاوبتش أسئلة النهاردة.'), listen);
    speak(T(`Today you answered ${o.n} questions, ${o.c} correct — ${Math.round(o.c / o.n * 100)} percent.`, `النهاردة جاوبت ${o.n} سؤال، منهم ${o.c} صح، يعني ${Math.round(o.c / o.n * 100)} في المية.`), listen);
  }
  function doMark(kind, e) {
    const d = Store.d, id = e.id; (kind === 'learned' ? (d.learned = d.learned || {}) : (d.fav = d.fav || {}))[id] = 1; Store.touchDay(); Store.save();
    const nm = spoken(ar() ? e.baseAr : e.baseEn);
    speak(kind === 'learned' ? T(`${nm} marked as learned.`, `علّمت ${nm} محفوظة.`) : T(`${nm} added to favourites.`, `ضفت ${nm} للمفضلة.`), listen);
  }
  function doNote(p) {
    if (S.sel < 0) return speak(T('Pick a structure first, then dictate the note.', 'اختار تركيب الأول وبعدين قول الملاحظة.'), listen);
    if (!p.text) { V.st = 'note'; return speak(T('Go ahead, say the note.', 'اتفضل، قول الملاحظة.'), listen); }
    saveNote(p.text);
  }
  function saveNote(text) {
    const e = P[S.sel]; if (!e) return speak(T('Pick a structure first.', 'اختار تركيب الأول.'), listen);
    const n = Store.d.notes = Store.d.notes || {}; n[e.id] = (n[e.id] ? n[e.id] + '\n' : '') + text; Store.save(); V.st = 'cmd';
    try { if (A.renderPanel && document.getElementById('app').classList.contains('psel')) A.renderPanel(); } catch (er) { /* ignore */ }
    speak(T('Note saved.', 'سجّلت الملاحظة.'), listen);
  }
  function handleNote(alts) {
    const ws = words(alts[0]); if (hasAny(ws, W.stop) || isNo(ws) && ws.length <= 2) { V.st = 'cmd'; return speak(T('Cancelled.', 'لغيت الملاحظة.'), listen); }
    saveNote(alts[0]);
  }

  /* ───────── oral quiz (hands-free) ───────── */
  const Q = { on: false, n: 0, i: 0, ok: 0, cur: null, seen: new Set() };
  function qPool() {
    const prem = A.isPremium(), sysOK = prem ? ['bone', 'muscle', 'nerve'] : ['bone', 'muscle'];
    const MAJOR = /^(Humerus|Radius|Ulna|Femur|Tibia|Fibula|Patella|Clavicle|Scapula|Sternum|Hip bone|Sacrum|Coccyx|Mandible|Frontal bone|Parietal bone|Occipital bone|Temporal bone|Maxilla|Calcaneus|Talus|Atlas|Axis|Scaphoid|Body of sternum|Manubrium)/i;
    return groups().filter((g) => sysOK.includes(g.sys) && (g.sys !== 'bone' || MAJOR.test(g.en)) && (prem || !g.items[0].lk) && !/[–-]/.test(g.en) && !/(vertebra|^Rib |bursa|ligament|tendon|part\)|head\)|belly\))/i.test(g.en) && g.ar && g.ar.length < 34);
  }
  function startVQuiz() {
    if (limitHit()) return; bump();
    const pool = qPool(); if (pool.length < 8) return speak(T('Not enough structures loaded yet.', 'لسه مفيش تراكيب كفاية.'), listen);
    Q.on = true; Q.n = A.isPremium() ? 10 : 5; Q.i = 0; Q.ok = 0; Q.cur = null; Q.seen = new Set(); Q.pool = pool; V.st = 'quiz';
    speak(T(`Oral quiz, ${Q.n} questions. Say the name, or say skip, or stop.`, `اختبار شفهي، ${Q.n} أسئلة. قول الاسم، أو قول تخطي، أو وقف.`), nextQ);
  }
  async function nextQ() {
    if (!V.on || !Q.on) return;
    if (Q.i >= Q.n) return endQuiz();
    let g, guard = 0; do { g = Q.pool[Math.floor(Math.random() * Q.pool.length)]; } while (Q.seen.has(g.en) && ++guard < 40);
    Q.seen.add(g.en); Q.i++;
    const e = pickItem(g), muscleQ = g.sys === 'muscle' && e.mu && Math.random() < 0.4;
    Q.cur = { g, e, kind: muscleQ ? 'nerve' : 'name' };
    try { await A.select(e.i, { noPanel: true }); if (S.hl && S.hl.size) { S.hl = null; A.apply(); } } catch (er) { /* ignore */ }
    if (muscleQ) { speak(T(`Question ${Q.i}. Which nerve supplies ${spoken(g.en)}?`, `السؤال ${Q.i}. إيه العصب اللي بيغذي ${gname(g)}؟`), listen); }
    else speak(T(`Question ${Q.i}. What is the highlighted structure?`, `السؤال ${Q.i}. إيه اسم التركيب اللي منوّر؟`), listen);
  }
  function handleQuiz(alts) {
    const cur = Q.cur; if (!cur) return;
    for (const a of alts) { const ws = words(a); if (hasAny(ws, W.stop)) { Q.on = false; V.st = 'cmd'; return endQuiz(true); } }
    for (const a of alts) { const ws = words(a); if (hasAny(ws, MISC.repeat)) return speak(V.last, listen); }
    for (const a of alts) { const ws = words(a); if (hasAny(ws, MISC.skip) || hasAny(ws, MISC.dunno)) return reveal(false, true); }
    let ok = false;
    for (const a of alts) {
      const q = qOf(words(a)).q.filter((x) => !['اسمه', 'اسمها', 'هو', 'هي'].includes(x)); if (!q.length) continue;
      if (cur.kind === 'name') {
        const al = aliasOf(q); if (al && al.gs.some((x) => x === cur.g)) { ok = true; break; }
        const c = match(q); if (c.slice(0, 2).some((x) => x.s >= 0.8 && (x.g === cur.g || (x.g.grp && x.g.grp === cur.g.grp && x.g.sys === cur.g.sys)))) { ok = true; break; }
      } else {
        const m = cur.e.mu, s = Math.max(setScore(q, toks(m[7])), setScore(q, toks(m[6]))); if (s >= 0.75) { ok = true; break; }
      }
    }
    reveal(ok, false);
  }
  function reveal(ok, skipped) {
    const cur = Q.cur; if (!ok) { /* keep going */ } else Q.ok++;
    const ans = cur.kind === 'name' ? gname(cur.g) : spoken(ar() ? cur.e.mu[7] : cur.e.mu[6]);
    const msg = ok ? T('Correct!', 'صح!') : (skipped ? T('Skipped. It was ', 'تخطينا. كان ') : T('Not quite. The answer is ', 'غلط. الإجابة ')) + ans + '.';
    speak(ok ? msg + ' ' + ans + '.' : msg, nextQ);
  }
  function endQuiz(early) {
    const done = Math.max(0, early ? Q.i - 1 : Q.i); Q.on = false; V.st = 'cmd';
    if (done > 0) { try { A.logAct(done, Q.ok); A.checkBadges && A.checkBadges(); } catch (e) { /* ignore */ } }
    const pct = done ? Math.round(Q.ok / done * 100) : 0;
    speak(done ? T(`You got ${Q.ok} out of ${done}. ${pct >= 80 ? 'Excellent!' : pct >= 50 ? 'Good, keep going.' : 'Review and try again.'}`, `جبت ${Q.ok} من ${done}. ${pct >= 80 ? 'ممتاز!' : pct >= 50 ? 'كويس، كمّل.' : 'راجع وجرّب تاني.'}`) : T('Quiz ended.', 'خلص الاختبار.'), listen);
  }

  /* ───────── mode on / off ───────── */
  function resetIdle() { clearTimeout(V.tmr); V.tmr = setTimeout(() => { if (V.on) stopMode(T('Closed Lab mode to save battery.', 'قفلت وضع المعمل لتوفير البطارية.'), true); }, IDLE_MS); }
  function startMode() {
    if (!getSR()) return A.toast(T('Voice is not supported on this browser (use Chrome).', 'الصوت مش مدعوم في المتصفح ده (استخدم Chrome).'), 3500);
    if (V.on) return;
    if (!navigator.onLine) return A.toast(T('Voice needs an internet connection.', 'الصوت محتاج إنترنت.'), 3000);
    if (limitHit()) return;
    V.on = true; V.st = 'cmd'; V.silent = 0; V.bad = 0; V.opts = null; V.heard = ''; V.say = ''; V.rate = 0.95; Q.on = false; resetIdle(); ui();
    try { A.closeModal(); } catch (e) { /* ignore */ }
    speak(T('Lab mode is on. Try: where is the median nerve? or: hide the muscles, or: quiz me.', 'وضع المعمل شغال. جرّب: فين العصب الأوسط؟ أو: اخفي العضلات، أو: اختبرني.'), listen);
  }
  function stopMode(msg, speakIt, quiet) {
    const was = V.on; V.on = false; V.st = 'idle'; Q.on = false; clearTimeout(V.tmr); stopRec();
    try { if (canTalk()) speechSynthesis.cancel(); } catch (e) { /* ignore */ }
    if (msg && !speakIt) A.toast(msg, 4000);
    if (msg && speakIt && was && canTalk() && !quiet) { try { const u = new SpeechSynthesisUtterance(msg); u.lang = ar() ? 'ar-EG' : 'en-US'; if (voice) u.voice = voice; speechSynthesis.speak(u); } catch (e) { /* ignore */ } }
    if (msg && speakIt) A.toast(msg, 3000);
    ui();
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden && V.on) stopMode(); });

  /* ───────── UI ───────── */
  let el = null;
  function ui(mode) {
    if (!el) { el = document.createElement('div'); el.id = 'vox'; el.hidden = true; document.body.appendChild(el); }
    if (!V.on) { el.hidden = true; return; }
    const st = V.speaking ? '🔊 ' + T('Speaking…', 'بتكلم…') : '🎤 ' + T('Listening…', 'بسمعك…');
    const c = V.st === 'confirm' && V.opts ? `<div class="vx-c">${V.opts.map((o, i) => `<button class="vx-b" data-act="voxpick" data-k="${i}">${esc(o.label)}</button>`).join('')}</div>` : '';
    const qz = Q.on ? `<div class="vx-h">${T('Quiz', 'اختبار')} ${Q.i}/${Q.n} · ${Q.ok} ✓</div>` : '';
    el.innerHTML = `<div class="vx-top"><b>🧤 ${T('Lab mode', 'وضع المعمل')}</b><span class="vx-st">${st}</span><button class="vx-x" data-act="voxstop" aria-label="stop">✕</button></div>` + qz +
      (V.heard ? `<div class="vx-h">“${esc(V.heard)}”</div>` : '') + (V.say ? `<div class="vx-s">${esc(V.say.length > 160 ? V.say.slice(0, 160) + '…' : V.say)}</div>` : '') + c +
      `<div class="vx-t">${T('Say: “where is the median nerve?” · “hide the muscles” · “bones only” · “quiz me” · “stop”', 'قول: «فين العصب الأوسط؟» · «اخفي العضلات» · «العظام بس» · «اختبرني» · «وقف»')}</div>`;
    el.hidden = false; void mode;
  }
  A.acts.vox = () => {
    if (V.on) return stopMode();
    if (!Store.d.vxOk) {
      return A.modal(() => `<h2>🧤 ${T('Lab mode', 'وضع المعمل')}</h2><p class="lead">${T('Talk to the 3D model hands-free: find a structure, hide layers, ask about origin / insertion / nerve, hear special tests, or get an oral quiz — and the app answers by voice.', 'كلّم المجسم من غير ما تلمس الشاشة: اطلب تركيب، اخفي طبقات، اسأل عن الأصل والإدخال والعصب، اسمع الاختبارات الخاصة، أو اطلب اختبار شفهي — والتطبيق بيرد بصوته.')}</p>` +
        `<div class="advice">${T('Needs internet. Your voice is converted to text by your browser (Google), not stored by Anatovia. Free: 5 commands a day.', 'محتاج إنترنت. صوتك بيتحوّل لنص عن طريق المتصفح (Google) ومش بنخزّنه. مجاني: 5 أوامر في اليوم (أوامر الطبقات والمناطق من غير حد).')}</div>` +
        `<button class="btn primary wide" style="margin-top:10px" data-act="voxgo">🎤 ${T('Start', 'ابدأ')}</button>`);
    }
    startMode();
  };
  A.acts.voxgo = () => { Store.d.vxOk = 1; Store.save(); startMode(); };
  A.acts.voxstop = () => stopMode();
  A.acts.voxpick = (b) => { if (V.st !== 'confirm' || !V.opts) return; stopRec(); const o = V.opts[+b.dataset.k]; V.st = 'cmd'; V.opts = null; if (o) o.fn(); };

  const prev = A.extraChips;
  A.extraChips = () => (prev ? prev() : '') + (getSR() ? `<button class="chip ${V.on ? 'active' : ''}" data-act="vox">🧤 ${T('Lab mode', 'وضع المعمل')}</button>` : '');
  if (A.renderChips) A.renderChips();
  A.vox = { parse, match, clear, aliasOf, words, toks, V, Q, handle, setScore, nerveCands, testCands };   // for tests
})();
