/* calc.js — ROM & MMT recording calculator: enter a patient's measurements, see % of normal, export a PDF.
   Built fully on the device (canvas → JPEG → PDF). Normal values are textbook references (clinic-data.js) — practice tool, not a clinical record. */
'use strict';
if (!window.__calcLoaded) (() => {
  window.__calcLoaded = 1;
  const { S, $, esc } = A;
  const ar = () => S.lang === 'ar';
  const T = (en, a) => (ar() ? a : en);
  const J = () => window.JOINTS || [];
  const GRADES = ['0', '1', '2', '3', '3+', '4-', '4', '4+', '5'];
  const W = 1240, H = 1754, M = 70, CW = W - 2 * M;

  /* ───────── state (persisted) ───────── */
  const blank = () => ({ pt: { name: '', age: '', side: 'R', note: '' }, j: 'shoulder', data: {} });
  const st = () => { const d = Store.d; if (!d.calc) d.calc = blank(); return d.calc; };
  const jd = (id) => { const c = st(); if (!c.data[id]) c.data[id] = { rom: {}, mmt: {} }; return c.data[id]; };
  const normMax = (s) => { const m = /[–-]\s*(\d+)\s*°/.exec(s) || /^(\d+)\s*°/.exec(s); return m ? +m[1] : 0; };
  const num = (v) => { const n = parseFloat(v); return isNaN(n) ? null : n; };
  function status(norm, a, p) {
    const nm = normMax(norm);
    if (a == null) return { pct: null, k: '', txt: '—' };
    if (!nm) return { pct: null, k: '', txt: '—' };
    const pc = Math.round((100 * a) / nm);
    let k = pc >= 90 ? 'good' : pc >= 50 ? 'warn' : 'bad';
    let txt = pc >= 90 ? T('Normal', 'طبيعي') : pc >= 50 ? T('Limited', 'محدود') : T('Markedly limited', 'محدود جدًا');
    if (p != null && p - a >= 10) txt += ' · ' + T('A<P', 'نشط<سلبي');
    return { pct: pc, k, txt };
  }
  const normTxt = (s) => s.replace(/\s*\(.*\)/, '');

  /* ───────── UI ───────── */
  function open() {
    const c = st();
    A.modal(() => {
      const j = J().find((x) => x.id === c.j) || J()[0], d = jd(j.id);
      const sel = (v, o) => o.map(([k, l]) => `<option value="${k}" ${v === k ? 'selected' : ''}>${esc(l)}</option>`).join('');
      let h = `<h2>🧮 ${T('ROM & MMT calculator', 'حاسبة ROM و MMT')}</h2><p class="lead">${T('Record a patient\'s measurements, see % of normal, export a PDF.', 'سجّل قياسات المريض، شوف النسبة من الطبيعي، واطلع ملف PDF.')}</p>` +
        `<div class="calc-pt"><input data-calc="name" placeholder="${T('Patient name / code', 'اسم المريض أو كود')}" value="${esc(c.pt.name)}"><input data-calc="age" inputmode="numeric" placeholder="${T('Age', 'السن')}" value="${esc(c.pt.age)}" style="max-width:76px">` +
        `<select data-calc="side">${sel(c.pt.side, [['R', T('Right', 'يمين')], ['L', T('Left', 'شمال')], ['B', T('Both', 'الاتنين')]])}</select></div>` +
        `<div class="row calc-tabs">` + J().map((x) => { const has = Object.keys(jd(x.id).rom).length + Object.keys(jd(x.id).mmt).length; return `<button class="opt ${x.id === j.id ? 'sel' : ''}" data-act="calcj" data-id="${x.id}">${esc(T(x.en, x.ar))}${has ? ' •' : ''}</button>`; }).join('') + '</div>' +
        `<h4>${T('Range of motion (degrees)', 'مدى الحركة (بالدرجات)')}</h4><div class="calc-t"><div class="calc-r calc-h"><span>${T('Movement', 'الحركة')}</span><span>${T('Active', 'نشط')}</span><span>${T('Passive', 'سلبي')}</span><span>%</span></div>`;
      j.rom.forEach((r, i) => {
        const v = d.rom[i] || {}, s = status(r[2], num(v.a), num(v.p));
        h += `<div class="calc-r"><span><b>${esc(T(r[0], r[1]))}</b><small>${T('Normal', 'الطبيعي')}: ${esc(normTxt(r[2]))}</small></span>` +
          `<input data-calc="a" data-j="${j.id}" data-i="${i}" inputmode="decimal" value="${esc(v.a || '')}"><input data-calc="p" data-j="${j.id}" data-i="${i}" inputmode="decimal" value="${esc(v.p || '')}">` +
          `<span class="calc-pc ${s.k}" id="cp_${i}">${s.pct == null ? '—' : s.pct + '%'}</span></div>`;
      });
      h += `</div><h4>${T('Muscle strength (MMT 0–5)', 'القوة العضلية (MMT 0–5)')}</h4><div class="calc-t">`;
      j.mmt.forEach((m, i) => {
        const g = d.mmt[i] || '';
        h += `<div class="calc-r calc-m"><span><b>${esc(T(m[0], m[1]))}</b><small>${esc(T(m[2], m[3]))}</small></span><select data-calc="m" data-j="${j.id}" data-i="${i}"><option value="">—</option>${GRADES.map((x) => `<option ${g === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>`;
      });
      h += `</div><textarea data-calc="note" rows="2" placeholder="${T('Notes (pain, observations…)', 'ملاحظات (ألم، ملاحظات…)')}" style="width:100%;margin-top:10px">${esc(c.pt.note)}</textarea>` +
        `<button type="button" class="btn primary wide" style="margin-top:10px" data-act="calcpdf">📄 ${T('Create PDF', 'اطلع PDF')}</button>` +
        `<button type="button" class="btn wide" style="margin-top:8px" data-act="calcclear">🗑️ ${T('New patient (clear)', 'مريض جديد (مسح)')}</button>` +
        `<p class="tiny">${T('Normal values vary between sources and people — practice tool, confirm with your supervisor.', 'القيم الطبيعية بتختلف بين المراجع والأشخاص — أداة تدريب، راجعها مع المشرف.')}</p>`;
      return h;
    });
  }
  A.acts.calcj = (el) => { if (!A.isPremium() && el.dataset.id !== A.FREE_JOINT) return A.paywall('Only the shoulder is free in the calculator. All joints are part of Premium.', 'في الحاسبة الكتف بس مجاني. باقي المفاصل ضمن النسخة المميزة.'); st().j = el.dataset.id; Store.save(); open(); };
  A.acts.calcclear = () => { if (!confirm(T('Clear all the entered data?', 'مسح كل البيانات المدخلة؟'))) return; Store.d.calc = blank(); Store.save(); open(); };
  document.addEventListener('input', (ev) => {
    const el = ev.target; if (!el.dataset || !el.dataset.calc || !el.closest('#modalBody')) return;
    const c = st(), k = el.dataset.calc;
    if (k === 'name' || k === 'age' || k === 'side' || k === 'note') c.pt[k] = el.value;
    else {
      const d = jd(el.dataset.j), i = el.dataset.i;
      if (k === 'm') { if (el.value) d.mmt[i] = el.value; else delete d.mmt[i]; }
      else {
        const v = d.rom[i] || (d.rom[i] = {}); v[k] = el.value; if (!v.a && !v.p) delete d.rom[i];
        const j = J().find((x) => x.id === el.dataset.j), s = status(j.rom[i][2], num((d.rom[i] || {}).a), num((d.rom[i] || {}).p));
        const cell = document.getElementById('cp_' + i); if (cell) { cell.textContent = s.pct == null ? '—' : s.pct + '%'; cell.className = 'calc-pc ' + s.k; }
      }
    }
    Store.save();
  });

  /* ───────── PDF ───────── */
  const FAM = 'system-ui,-apple-system,"Segoe UI",Tahoma,"Noto Naskh Arabic",Arial,sans-serif';
  const isAr = (s) => /[؀-ۿ]/.test(s);
  const COL = { ink: '#000B33', mut: '#4A5580', acc: '#4A5580', good: '#2e9e5b', warn: '#c98200', bad: '#d64550', line: '#DDD6C4', soft: '#F8F4EA' };
  function items() {
    const c = st(), out = [];
    for (const j of J()) {
      const d = jd(j.id), rr = j.rom.map((r, i) => [r, d.rom[i]]).filter(([, v]) => v), mm = j.mmt.map((m, i) => [m, d.mmt[i]]).filter(([, g]) => g);
      if (!rr.length && !mm.length) continue;
      out.push({ t: 'joint', h: 76, j });
      if (rr.length) { out.push({ t: 'romh', h: 48 }); rr.forEach(([r, v]) => out.push({ t: 'rom', h: 52, r, v })); out.push({ t: 'gap', h: 14 }); }
      if (mm.length) { out.push({ t: 'mmth', h: 48 }); mm.forEach(([m, g]) => out.push({ t: 'mmt', h: 52, m, g })); out.push({ t: 'gap', h: 14 }); }
      out.push({ t: 'gap', h: 18 });
    }
    return out;
  }
  function renderPages() {
    const c = st(), rtl = ar(), list = items(); if (!list.length) return null;
    const pages = []; let cur = [], y = 470;
    for (const it of list) { if (y + it.h > H - 140) { pages.push(cur); cur = []; y = 150; } cur.push([it, y]); y += it.h; }
    pages.push(cur);
    return pages.map((pg, pi) => {
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
      const X = (px, w = 0) => (rtl ? W - px - w : px);
      const rect = (px, py, w, h, col) => { x.fillStyle = col; x.fillRect(X(px, w), py, w, h); };
      const text = (s, px, py, o = {}) => {
        s = String(s); x.font = `${o.b ? 700 : 500} ${o.s || 26}px ${FAM}`; x.fillStyle = o.c || COL.ink; x.textBaseline = 'middle'; x.direction = isAr(s) ? 'rtl' : 'ltr';
        const al = o.al || 'start'; let ax, ta;
        if (al === 'end') { ax = rtl ? px : W - px; ta = rtl ? 'left' : 'right'; } else { ax = rtl ? W - px : px; ta = rtl ? 'right' : 'left'; }
        x.textAlign = ta; x.fillText(s, ax, py, o.w);
      };
      x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
      rect(0, 0, W, pi === 0 ? 190 : 110, '#1b2550');
      text('Anatovia', M, pi === 0 ? 78 : 55, { s: pi === 0 ? 56 : 40, b: 1, c: '#fff' });
      text(T('ROM & MMT assessment', 'تقييم مدى الحركة والقوة العضلية'), M, pi === 0 ? 138 : 55, { s: 30, c: '#b9c4ff', al: pi === 0 ? 'start' : 'end' });
      if (pi === 0) {
        const side = { R: T('Right', 'يمين'), L: T('Left', 'شمال'), B: T('Both', 'الاتنين') }[c.pt.side];
        rect(M, 225, CW, 200, COL.soft);
        text(T('Patient', 'المريض'), M + 30, 262, { s: 24, c: COL.mut }); text(c.pt.name || '—', M + 30, 304, { s: 38, b: 1, w: 560 });
        text(T('Age', 'السن'), M + 640, 262, { s: 24, c: COL.mut }); text(c.pt.age || '—', M + 640, 304, { s: 34, b: 1 });
        text(T('Side', 'الجهة'), M + 800, 262, { s: 24, c: COL.mut }); text(side, M + 800, 304, { s: 34, b: 1 });
        text(T('Date', 'التاريخ'), M + 960, 262, { s: 24, c: COL.mut }); text(new Date().toLocaleDateString('en-GB'), M + 960, 304, { s: 30, b: 1 });
        text(c.pt.note ? c.pt.note.replace(/\s+/g, ' ').slice(0, 110) : '', M + 30, 372, { s: 26, c: COL.mut, w: CW - 60 });
      }
      for (const [it, yy] of pg) {
        const cy = yy + it.h / 2;
        if (it.t === 'joint') { rect(M, yy + 8, CW, it.h - 12, COL.acc); text(T(it.j.en, it.j.ar), M + 24, cy + 2, { s: 34, b: 1, c: '#fff' }); }
        else if (it.t === 'romh') { rect(M, yy, CW, it.h - 4, COL.soft); [[T('Movement', 'الحركة'), 16], [T('Normal', 'الطبيعي'), 400], [T('Active', 'نشط'), 640], [T('Passive', 'سلبي'), 770], ['%', 900], [T('Status', 'الحالة'), 980]].forEach(([s, px]) => text(s, M + px, cy, { s: 23, b: 1, c: COL.mut })); }
        else if (it.t === 'rom') {
          const s = status(it.r[2], num(it.v.a), num(it.v.p));
          rect(M, yy + it.h - 3, CW, 2, COL.line);
          text(T(it.r[0], it.r[1]), M + 16, cy, { s: 25, b: 1, w: 370 }); text(normTxt(it.r[2]), M + 400, cy, { s: 23, c: COL.mut, w: 225 });
          text(it.v.a ? it.v.a + '°' : '—', M + 640, cy, { s: 26, b: 1 }); text(it.v.p ? it.v.p + '°' : '—', M + 770, cy, { s: 26 });
          text(s.pct == null ? '—' : s.pct + '%', M + 900, cy, { s: 26, b: 1, c: COL[s.k] || COL.ink }); text(s.txt, M + 980, cy, { s: 21, c: COL[s.k] || COL.mut, w: 150 });
        } else if (it.t === 'mmth') { rect(M, yy, CW, it.h - 4, COL.soft); [[T('Movement', 'الحركة'), 16], [T('Main muscles', 'العضلات الرئيسية'), 300], [T('Roots', 'الجذور'), 830], [T('Grade', 'الدرجة'), 990]].forEach(([s, px]) => text(s, M + px, cy, { s: 23, b: 1, c: COL.mut })); }
        else if (it.t === 'mmt') {
          const g = parseFloat(it.g), col = g >= 4 ? COL.good : g >= 3 ? COL.warn : COL.bad;
          rect(M, yy + it.h - 3, CW, 2, COL.line);
          text(T(it.m[0], it.m[1]), M + 16, cy, { s: 25, b: 1, w: 270 }); text(T(it.m[2], it.m[3]), M + 300, cy, { s: 21, c: COL.mut, w: 510 });
          text(it.m[4], M + 830, cy, { s: 22, c: COL.mut, w: 140 }); text(it.g + ' / 5', M + 990, cy, { s: 28, b: 1, c: col });
        }
      }
      rect(0, H - 70, W, 70, '#1b2550');
      text('ibrahimsaeed11.github.io/Anatovia', M, H - 35, { s: 22, c: '#b9c4ff' });
      text(`${T('Practice record — not a clinical document', 'سجل تدريبي — مش وثيقة طبية')} · ${pi + 1}/${pages.length}`, M, H - 35, { s: 22, c: '#b9c4ff', al: 'end' });
      return cv;
    });
  }
  function makePdf(jpgs, w, h) {
    const enc = new TextEncoder(), parts = [], offs = []; let len = 0; const n = jpgs.length;
    const push = (v) => { const u = typeof v === 'string' ? enc.encode(v) : v; parts.push(u); len += u.length; };
    const obj = (id, body, stream) => { offs[id] = len; push(`${id} 0 obj\n${body}\n`); if (stream) { push('stream\n'); push(stream); push('\nendstream\n'); } push('endobj\n'); };
    push('%PDF-1.4\n');
    obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
    obj(2, `<< /Type /Pages /Kids [${jpgs.map((_, i) => `${3 + 3 * i} 0 R`).join(' ')}] /Count ${n} >>`);
    jpgs.forEach((jpg, i) => {
      const b = 3 + 3 * i, cs = enc.encode('q 595 0 0 842 0 0 cm /Im0 Do Q');
      obj(b, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im0 ${b + 1} 0 R >> >> /Contents ${b + 2} 0 R >>`);
      obj(b + 1, `<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>`, jpg);
      obj(b + 2, `<< /Length ${cs.length} >>`, cs);
    });
    const total = 3 + 3 * n, xr = len; let tab = `xref\n0 ${total}\n0000000000 65535 f \n`;
    for (let i = 1; i < total; i++) tab += String(offs[i]).padStart(10, '0') + ' 00000 n \n';
    push(tab + `trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xr}\n%%EOF`);
    return new Blob(parts, { type: 'application/pdf' });
  }
  const blobOf = (cv) => new Promise((res) => cv.toBlob((b) => res(b), 'image/jpeg', 0.92));
  function save(blob, name, type) {
    const file = new File([blob], name, { type });
    const done = () => { const u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); A.toast(T('Saved', 'تم الحفظ')); };
    try { if (navigator.canShare && navigator.canShare({ files: [file] })) return navigator.share({ files: [file], title: 'Anatovia' }).catch((e) => { if (!e || e.name !== 'AbortError') done(); }); } catch (e) { /* fall back */ }
    done();
  }
  let last = null;
  A.acts.calcpdf = async () => {
    if (!A.isPremium()) return A.paywall('Exporting the assessment PDF is part of Premium.', 'تصدير ملف PDF للتقييم ضمن النسخة المميزة.');
    const cvs = renderPages();
    if (!cvs) return A.toast(T('Enter at least one measurement first', 'أدخل قياس واحد على الأقل الأول'));
    A.toast(T('Preparing the PDF…', 'جارِ تجهيز الملف…'), 1500);
    try {
      const jbs = await Promise.all(cvs.map(blobOf)), jpgs = await Promise.all(jbs.map(async (b) => new Uint8Array(await b.arrayBuffer())));
      if (last && last.url) URL.revokeObjectURL(last.url);
      last = { pdf: makePdf(jpgs, W, H), url: URL.createObjectURL(jbs[0]), n: cvs.length };
    } catch (e) { return A.toast(T('Could not build the PDF', 'تعذّر إنشاء الملف')); }
    A.modal(() => `<h2>📄 ${T('Assessment PDF', 'ملف التقييم')}</h2><img src="${last.url}" alt="page 1" style="width:100%;border-radius:12px;border:1px solid var(--line);margin-bottom:12px">` +
      `<p class="tiny">${last.n} ${T('page(s)', 'صفحة')}</p><div class="row"><button class="btn primary" data-act="calcsave">⬇️ ${T('Download PDF', 'تنزيل PDF')}</button><button class="btn" data-act="calcsh">📤 ${T('Share', 'مشاركة')}</button><button class="btn" data-act="calc">‹ ${T('Back', 'رجوع')}</button></div>`);
  };
  A.acts.calcsave = () => { if (last) A.dl(last.pdf, 'anatovia-rom-mmt.pdf'); };
  A.acts.calcsh = () => { if (last) A.shareFile(last.pdf, 'anatovia-rom-mmt.pdf', 'application/pdf'); };
  A.acts.calc = open;
  A.hubExtra = A.hubExtra || {}; A.hubExtra.calc = open;
})();
