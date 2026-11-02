/* report.js — student progress report (A4 image → PDF), built fully on the device. Share or save. */
'use strict';
if (!window.__reportLoaded) (() => {
  window.__reportLoaded = 1;
  const { S, P, $, t } = A;
  const ar = () => S.lang === 'ar';
  const T = (en, a) => (ar() ? a : en);
  const SYS = ['bone', 'muscle', 'vessel', 'nerve', 'brain', 'organ', 'ligament'];
  const REG = ['head', 'neck', 'spine', 'thorax', 'abdomen', 'pelvis', 'upper', 'lower'];
  const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0);
  const W = 1240, H = 1754, M = 70, CW = W - 2 * M;
  let last = null;   // { jpg: Blob, pdf: Blob, url }

  /* ───────── data ───────── */
  const dkey = (d) => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  function collect() {
    const st = Store.d, hist = st.hist || [], act = st.act || {};
    let n = 0, c = 0;
    for (const v of Object.values(act)) { n += v.n; c += v.c; }
    for (const h of hist) { n += h.n; c += h.c; }
    const now = new Date(), days = [];
    for (let k = 6; k >= 0; k--) { const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - k); days.push({ d, key: dkey(d), n: 0, c: 0 }); }
    for (const x of days) {
      const a = act[x.key]; if (a) { x.n += a.n; x.c += a.c; }
      for (const h of hist) if (dkey(new Date(h.t)) === x.key) { x.n += h.n; x.c += h.c; }
    }
    // learned per system
    const seen = new Map(), learned = new Set(Object.keys(st.learned || {}));
    for (const e of P) { const k = e.sys + '|' + e.k + '|' + e.baseEn; const cur = seen.get(k); if (!cur) seen.set(k, { e, l: learned.has(e.id) }); else if (learned.has(e.id)) cur.l = true; }
    const bySys = {}; let lt = 0, ln = 0;
    for (const { e, l } of seen.values()) { const o = (bySys[e.sys] = bySys[e.sys] || { c: 0, n: 0 }); o.n++; lt++; if (l) { o.c++; ln++; } }
    // quiz accuracy per system / region
    const qs = {}, qr = {};
    for (const h of hist) {
      for (const [k, a] of Object.entries(h.sysA || {})) { const o = (qs[k] = qs[k] || { c: 0, n: 0 }); o.c += a.c; o.n += a.n; }
      for (const [k, a] of Object.entries(h.area || {})) { const o = (qr[k] = qr[k] || { c: 0, n: 0 }); o.c += a.c; o.n += a.n; }
    }
    const byId = new Map(P.map((e) => [e.id, e]));
    const review = Object.entries(st.srs || {}).filter(([, s]) => s.b <= 1).sort((a, b) => a[1].b - b[1].b).map(([id]) => byId.get(id)).filter(Boolean).filter((e, i, a) => a.findIndex((z) => z.baseEn === e.baseEn) === i).slice(0, 12);
    const bi = A.badgeInfo ? A.badgeInfo() : { total: 0, earned: [] };
    return { n, c, days, bySys, lt, ln, qs, qr, review, hist, streak: Store.streak(), bi };
  }

  /* ───────── drawing ───────── */
  const FAM = 'system-ui,-apple-system,"Segoe UI",Tahoma,"Noto Naskh Arabic",Arial,sans-serif';
  const isAr = (s) => /[؀-ۿ]/.test(s);
  function render() {
    const D = collect(), rtl = ar();
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
    const ink = '#000B33', mut = '#4A5580', acc = '#4A5580', good = '#2e9e5b', gold = '#e69b00', bad = '#d64550', line = '#DDD6C4', soft = '#F8F4EA';
    x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
    const X = (px, w = 0) => (rtl ? W - px - w : px);            // mirror horizontally for Arabic
    const rect = (px, py, w, h, col, r = 0) => { x.fillStyle = col; if (r) { x.beginPath(); x.roundRect ? x.roundRect(X(px, w), py, w, h, r) : x.rect(X(px, w), py, w, h); x.fill(); } else x.fillRect(X(px, w), py, w, h); };
    const text = (s, px, py, o = {}) => {                           // px = distance from the leading edge
      x.font = `${o.b ? 700 : 500} ${o.s || 26}px ${FAM}`; x.fillStyle = o.c || ink; x.textBaseline = 'middle';
      const al = o.al || 'start'; x.direction = (isAr(s) ? 'rtl' : 'ltr');
      let ax, ta;
      if (al === 'center') { ax = rtl ? W - px : px; ta = 'center'; }
      else if (al === 'end') { ax = rtl ? px : W - px; ta = rtl ? 'left' : 'right'; }      // trailing edge, px from the trailing side
      else if (al === 'far') { ax = rtl ? W - px : px; ta = rtl ? 'left' : 'right'; }      // far edge of a block that starts at the leading side
      else { ax = rtl ? W - px : px; ta = rtl ? 'right' : 'left'; }
      x.textAlign = ta; x.fillText(s, ax, py, o.w);
    };
    const nm = (e) => (rtl ? e.baseAr : e.baseEn);

    // header
    rect(0, 0, W, 190, '#1b2550');
    text('Anatovia', M, 78, { s: 56, b: 1, c: '#fff' });
    text(T('Study progress report', 'تقرير التقدّم الدراسي'), M, 138, { s: 30, c: '#b9c4ff' });
    const who = A.acct && A.acct.email ? A.acct.email : '';
    text(new Date().toLocaleDateString(rtl ? 'ar-EG' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' }), M, 78, { s: 28, c: '#fff', al: 'end' });
    if (who) text(who, M, 130, { s: 24, c: '#b9c4ff', al: 'end' });

    // stat boxes
    const acc2 = pct(D.c, D.n), quizzes = D.hist.length;
    const stats = [[D.streak, T('day streak', 'يوم متتالٍ'), gold], [D.n, T('answers', 'إجابة'), acc], [D.n ? acc2 + '%' : '—', T('accuracy', 'نسبة الصح'), acc2 >= 70 ? good : acc2 >= 50 ? gold : bad], [quizzes, T('quizzes', 'اختبار'), acc]];
    stats.forEach((s, i) => { const px = M + i * 280; rect(px, 220, 260, 140, soft, 18); text(String(s[0]), px + 130, 276, { s: 54, b: 1, c: s[2], al: 'center' }); text(s[1], px + 130, 331, { s: 24, c: mut, al: 'center' }); });

    // weekly bars
    text(T('Last 7 days', 'آخر 7 أيام'), M, 410, { s: 32, b: 1 });
    const mx = Math.max(10, ...D.days.map((d) => d.n));
    D.days.forEach((d, i) => {
      const px = M + i * 158, bh = Math.max(d.n ? 8 : 4, (d.n / mx) * 150), col = !d.n ? line : pct(d.c, d.n) >= 70 ? good : pct(d.c, d.n) >= 50 ? gold : bad;
      rect(px + 30, 450 + 150 - bh, 80, bh, col, 8);
      if (d.n) text(String(d.n), px + 70, 450 + 150 - bh - 16, { s: 22, c: mut, al: 'center' });
      text(d.d.toLocaleDateString(rtl ? 'ar-EG' : 'en', { weekday: 'short' }), px + 70, 630, { s: 22, c: mut, al: 'center' });
    });

    // two columns: learned / quiz accuracy per system
    const col2 = (title, rows, px0, py0) => {
      text(title, px0, py0, { s: 32, b: 1 });
      rows.forEach((r, i) => {
        const py = py0 + 56 + i * 54;
        text(r.l, px0, py, { s: 24, w: 150 });
        rect(px0 + 160, py - 12, 280, 24, soft, 12);
        if (r.v !== null) rect(px0 + 160, py - 12, Math.max(6, 280 * r.v / 100), 24, r.col, 12);
        text(r.t, px0 + 540, py, { s: 22, c: mut, al: 'far' });
      });
    };
    const L = SYS.map((s) => { const o = D.bySys[s] || { c: 0, n: 0 }, v = pct(o.c, o.n); return { l: t(s), v, col: acc, t: `${o.c}/${o.n}` }; });
    const Q = SYS.map((s) => { const o = D.qs[s]; if (!o || !o.n) return { l: t(s), v: null, col: acc, t: '—' }; const v = pct(o.c, o.n); return { l: t(s), v, col: v >= 70 ? good : v >= 50 ? gold : bad, t: v + '%' }; });
    col2(`${T('Learned', 'ما تعلّمته')} (${D.ln}/${D.lt})`, L, M, 700);
    col2(T('Quiz accuracy by system', 'دقة الاختبارات حسب الجهاز'), Q, M + 560, 700);

    // focus areas
    const rank = (m, keys) => keys.map((k) => [k, m[k]]).filter(([, o]) => o && o.n >= 2 && o.c / o.n < 0.8).sort((a, b) => a[1].c / a[1].n - b[1].c / b[1].n).slice(0, 3);
    const ws = rank(D.qs, SYS), wr = rank(D.qr, REG);
    rect(M, 1110, CW, 150, '#fff6e5', 18);
    text(T('Focus on', 'ركّز على'), M + 24, 1146, { s: 30, b: 1, c: gold });
    const fl = (a) => a.map(([k, o]) => `${t(k)} (${pct(o.c, o.n)}%)`).join(' · ');
    text(ws.length ? `${T('Systems', 'الأجهزة')}: ${fl(ws)}` : T('Take a few quizzes and your weak systems will appear here.', 'خُض بعض الاختبارات وستظهر هنا الأجهزة التي تحتاج مراجعة.'), M + 24, 1192, { s: 25, w: CW - 48 });
    if (wr.length) text(`${T('Regions', 'المناطق')}: ${fl(wr)}`, M + 24, 1230, { s: 25, w: CW - 48 });

    // items to review
    text(T('Structures to review', 'تراكيب تحتاج مراجعة'), M, 1310, { s: 32, b: 1 });
    if (!D.review.length) text(T('Nothing flagged yet — keep taking quizzes.', 'لا يوجد شيء بعد — استمر في الاختبارات.'), M, 1362, { s: 24, c: mut });
    D.review.forEach((e, i) => { const px = M + (i % 2) * 560, py = 1362 + Math.floor(i / 2) * 44; text('• ' + nm(e), px, py, { s: 25, w: 520 }); });

    // badges
    const by = 1650;
    text(`${T('Badges', 'الشارات')}: ${D.bi.earned.length}/${D.bi.total}`, M, by, { s: 28, b: 1 });
    text(D.bi.earned.map((b) => b.i).join(' ') || '—', M + 250, by, { s: 30, w: CW - 260 });

    // footer
    rect(0, H - 70, W, 70, '#1b2550');
    text('ibrahimsaeed11.github.io/Anatovia', M, H - 35, { s: 22, c: '#b9c4ff' });
    text(T('Self-study report — not an academic transcript', 'تقرير دراسة ذاتية — ليس شهادة أكاديمية'), M, H - 35, { s: 22, c: '#b9c4ff', al: 'end' });
    return cv;
  }

  /* ───────── PDF (one A4 page holding the JPEG) ───────── */
  function makePdf(jpg, w, h) {
    const enc = new TextEncoder(), parts = [], offs = []; let len = 0;
    const push = (v) => { const u = typeof v === 'string' ? enc.encode(v) : v; parts.push(u); len += u.length; };
    push('%PDF-1.4\n');
    const obj = (n, body, stream) => { offs[n] = len; push(`${n} 0 obj\n${body}\n`); if (stream) { push('stream\n'); push(stream); push('\nendstream\n'); } push('endobj\n'); };
    obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
    obj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    obj(3, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>');
    obj(4, `<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>`, jpg);
    const cs = enc.encode('q 595 0 0 842 0 0 cm /Im0 Do Q');
    obj(5, `<< /Length ${cs.length} >>`, cs);
    const xr = len; let tab = `xref\n0 6\n0000000000 65535 f \n`;
    for (let i = 1; i <= 5; i++) tab += String(offs[i]).padStart(10, '0') + ' 00000 n \n';
    push(tab + `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xr}\n%%EOF`);
    return new Blob(parts, { type: 'application/pdf' });
  }
  const blobOf = (cv) => new Promise((res) => cv.toBlob((b) => res(b), 'image/jpeg', 0.92));

  async function build() {
    const cv = render(), jb = await blobOf(cv); if (!jb) throw new Error('jpg');
    const jpg = new Uint8Array(await jb.arrayBuffer());
    if (last && last.url) URL.revokeObjectURL(last.url);
    last = { jpg: jb, pdf: makePdf(jpg, cv.width, cv.height), url: URL.createObjectURL(jb) };
  }
  function save(blob, name, type) {
    const file = new File([blob], name, { type });
    const text = T('My Anatovia progress report', 'تقرير تقدّمي في Anatovia');
    const done = () => {
      const u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(u), 4000); A.toast(T('Saved', 'تم الحفظ'));
    };
    try { if (navigator.canShare && navigator.canShare({ files: [file] })) return navigator.share({ files: [file], title: 'Anatovia', text }).catch((e) => { if (!e || e.name !== 'AbortError') done(); }); } catch (e) { /* fall back */ }
    done();
  }

  A.acts.report = async () => {
    if (!A.isPremium()) return A.paywall('The progress report PDF is part of Premium.', 'تقرير التقدم PDF ضمن النسخة المميزة.');
    A.toast(T('Preparing the report…', 'جارِ تجهيز التقرير…'), 1500);
    try { await build(); } catch (e) { return A.toast(T('Could not build the report', 'تعذّر إنشاء التقرير')); }
    A.modal(() => `<h2>📄 ${T('Progress report', 'تقرير التقدّم')}</h2><p class="lead">${T('Show it to your doctor or keep it for yourself.', 'اعرضه على الدكتور أو احتفظ به لنفسك.')}</p>` +
      `<img src="${last.url}" alt="report" style="width:100%;border-radius:12px;border:1px solid var(--line);margin-bottom:12px">` +
      `<div class="row"><button class="btn primary" data-act="reportpdf">⬇️ ${T('Download PDF', 'تنزيل PDF')}</button><button class="btn" data-act="reportimg">⬇️ ${T('Download image', 'تنزيل صورة')}</button><button class="btn" data-act="reportsh">📤 ${T('Share', 'مشاركة')}</button></div>`);
  };
  A.acts.reportpdf = () => { if (last) A.dl(last.pdf, 'anatovia-report.pdf'); };
  A.acts.reportimg = () => { if (last) A.dl(last.jpg, 'anatovia-report.jpg'); };
  A.acts.reportsh = () => { if (last) A.shareFile(last.pdf, 'anatovia-report.pdf', 'application/pdf', T('My Anatovia progress report', 'تقرير تقدّمي في Anatovia')); };
  A.reportReady = true;
})();
