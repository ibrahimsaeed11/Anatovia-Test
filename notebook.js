/* notebook.js — "Bono's notebook" (دفتر بونو): freehand notes, text, stickers, arrows, cut-out 3D parts, designable pages,
   autosave on the device (works offline), export to PDF / image. Everything is built on the device. */
'use strict';
if (!window.__nbLoaded) (() => {
  window.__nbLoaded = 1;
  const { S, P, $, name1, name2 } = A;
  const ar = () => S.lang === 'ar';
  const T = (en, a) => (ar() ? a : en);
  const PW = 800, PH = 1100, FREE_PAGES = 3;
  const SANS = 'Tahoma,"Segoe UI",system-ui,Arial,sans-serif';
  const HAND = '"Segoe Print","Bradley Hand","Comic Sans MS","Noto Naskh Arabic",cursive,Tahoma,sans-serif';
  const COLORS = ['#1b2a4a', '#e03131', '#f08c00', '#2f9e44', '#1971c2', '#7048e8', '#d6336c', '#0c8599', '#868e96', '#000000', '#ffffff', '#ffd43b'];
  const HLC = ['#ffe066', '#ffa8c5', '#a5f3c4', '#9fd3ff', '#d0b8ff', '#ffc078'];
  const BGS = ['#fffaf0', '#ffffff', '#fff3e0', '#e8f4ff', '#f3ecff', '#e9f9ef', '#ffeef3', '#f4f1ea', '#1d2440', '#101826'];
  const FCS = ['#9ec5ee', '#4a5fbf', '#ff8fb1', '#d6336c', '#ffd23f', '#f08c00', '#6dd58c', '#2f9e44', '#b197fc', '#7048e8', '#74c0fc', '#1b2a4a'];
  const PAPERS = [['ruled', 'مسطّر', 'Ruled'], ['grid', 'مربعات', 'Grid'], ['dots', 'نقط', 'Dots'], ['plain', 'سادة', 'Plain']];
  const FRAMES = [['waves', 'موجات', 'Waves'], ['bubbles', 'فقاعات', 'Bubbles'], ['dashed', 'منقّط', 'Dashed'], ['corners', 'أركان', 'Corners'], ['stripe', 'شريط', 'Banner'], ['none', 'بدون', 'None']];
  const uid = () => Math.random().toString(36).slice(2, 9);
  const newPage = () => ({ id: uid(), paper: 'ruled', bg: '#fffaf0', frame: 'waves', c1: '#9ec5ee', c2: '#4a5fbf', items: [] });
  const ST = { tool: 'select', c: '#1b2a4a', w: 4, hc: '#ffe066', hw: 22, sel: null, sheet: '', smooth: (typeof Store !== 'undefined' && Store.d.nbSm === 0) ? false : true };
  const V = { z: 1, ox: 0, oy: 0 };
  const PICK = { rep: null };
  const resetView = () => { V.z = 1; V.ox = 0; V.oy = 0; };
  function clampView() { V.z = Math.max(1, Math.min(5, V.z)); V.ox = Math.min(0, Math.max(PW * (1 - V.z), V.ox)); V.oy = Math.min(0, Math.max(PH * (1 - V.z), V.oy)); }
  function zoomAt(sx, sy, f) { const z0 = V.z, nz = Math.max(1, Math.min(5, z0 * f)), px = (sx - V.ox) / z0, py = (sy - V.oy) / z0; V.z = nz; V.ox = sx - px * nz; V.oy = sy - py * nz; clampView(); draw(); }
  let NB = null, ov = null, cv = null, cx = null, K = 1, cur = null, undo = [], redo = [], saveT = 0, rafId = 0, bonoReady = null;

  /* ───────── storage (IndexedDB, fallback localStorage) ───────── */
  const idb = () => new Promise((res, rej) => { const r = indexedDB.open('anatovia-nb', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  async function kvGet(key) {
    try { const d = await idb(); return await new Promise((res) => { const q = d.transaction('kv').objectStore('kv').get(key); q.onsuccess = () => res(q.result || null); q.onerror = () => res(null); }); }
    catch (e) { try { return JSON.parse(localStorage.getItem('anat_nb_' + key) || 'null'); } catch (e2) { return null; } }
  }
  async function kvSet(key, val) {
    try { const d = await idb(); await new Promise((res, rej) => { const tx = d.transaction('kv', 'readwrite'); tx.objectStore('kv').put(val, key); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); }
    catch (e) { try { localStorage.setItem('anat_nb_' + key, JSON.stringify(val)); } catch (e2) { /* storage unavailable */ } }
  }
  async function kvDel(key) {
    try { const d = await idb(); await new Promise((res) => { const tx = d.transaction('kv', 'readwrite'); tx.objectStore('kv').delete(key); tx.oncomplete = res; tx.onerror = res; }); } catch (e) { try { localStorage.removeItem('anat_nb_' + key); } catch (e2) { /* ignore */ } }
  }
  let LIB = null, BOOK = null;
  function thumbOf() { try { const c = document.createElement('canvas'); c.width = 240; c.height = Math.round(240 * PH / PW); const x = c.getContext('2d'); x.scale(240 / PW, 240 / PW); renderTo(x, NB.pages[0]); return c.toDataURL('image/jpeg', 0.6); } catch (e) { return ''; } }
  async function flush() { if (!NB || !BOOK) return; BOOK.updated = Date.now(); BOOK.n = NB.pages.length; BOOK.thumb = thumbOf(); await kvSet('bk:' + BOOK.id, NB); await kvSet('lib', LIB); }
  const save = () => { clearTimeout(saveT); saveT = setTimeout(flush, 600); };
  window.addEventListener('pagehide', () => { if (NB) flush(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && NB) flush(); });
  async function loadLib() {
    if (LIB) return; let l = await kvGet('lib');
    if (!l || !l.books) {
      l = { v: 2, books: [], last: null }; const old = await kvGet('nb');   // v1 had a single notebook under "nb": keep it as the first book
      if (old && old.pages && old.pages.length) { const id = uid(); old.imgs = old.imgs || {}; l.books.push({ id, title: T('My notebook', 'دفتري'), created: Date.now(), updated: Date.now(), n: old.pages.length, thumb: '' }); l.last = id; await kvSet('bk:' + id, old); await kvSet('lib', l); }
    }
    LIB = l;
  }
  async function newBook(title) { const id = uid(), d = { pages: [newPage()], cur: 0, imgs: {} }, m = { id, title, created: Date.now(), updated: Date.now(), n: 1, thumb: '' }; LIB.books.push(m); await kvSet('bk:' + id, d); await kvSet('lib', LIB); return m; }
  function canBook() { if (LIB.books.length >= 1 && !(A.isPremium && A.isPremium())) { A.paywall('The free plan includes one notebook. Premium gives you unlimited notebooks.', 'النسخة المجانية فيها دفتر واحد. النسخة المميزة تدّيك دفاتر بلا حدود.'); return false; } return true; }
  async function openBook(id) {
    if (NB && BOOK) await flush();
    const m = LIB.books.find((x) => x.id === id); if (!m) return; let d = await kvGet('bk:' + id); if (!d || !d.pages || !d.pages.length) d = { pages: [newPage()], cur: 0, imgs: {} };
    d.imgs = d.imgs || {}; d.cur = Math.min(d.cur || 0, d.pages.length - 1); NB = d; BOOK = m; LIB.last = id; undo = []; redo = []; ST.sel = null; cur = null; resetView();
    ov.classList.remove('lib'); sheet(''); setTitle(); ctxBar(); toolbar(); setTimeout(fit, 30); setTimeout(fit, 300);
  }
  const setTitle = () => { const el = $('nbTitle'); if (el && BOOK) el.textContent = '📓 ' + BOOK.title; };
  async function showLib() {
    if (NB && BOOK) await flush(); ov.classList.add('lib'); renderLib();
  }
  function renderLib() {
    const el = $('nbLib'), bs = LIB.books.slice().sort((a, b) => b.updated - a.updated);
    el.innerHTML = `<div class="nb-top"><button data-nb="close">✕</button><b class="nb-ttl">📚 ${T('My notebooks', 'دفاتري')}</b><span class="nb-sp"></span><button class="on" data-nb="newbook">➕ ${T('New notebook', 'دفتر جديد')}</button><button data-nb="backup">💾 ${T('Backup', 'نسخة احتياطية')}</button><button data-nb="restore">📥 ${T('Restore', 'استرجاع')}</button></div><div class="nb-libbody">` +
      (bs.length ? bs.map((b) => `<div class="nb-card"><button class="nb-cov" data-nb="openbook:${b.id}">${b.thumb ? `<img alt="" src="${b.thumb}">` : '<span>📓</span>'}</button><div class="nb-ct"><b>${esc0(b.title)}</b><small>${b.n} ${T('page(s)', 'صفحة')} · ${new Date(b.updated).toLocaleDateString(ar() ? 'ar-EG' : 'en')}</small></div><div class="nb-cb"><button data-nb="renbook:${b.id}">✎</button><button data-nb="dupbook:${b.id}">⎘</button><button data-nb="delbook:${b.id}">🗑</button></div></div>`).join('') : `<p class="nb-p" style="padding:20px">${T('No notebooks yet.', 'مفيش دفاتر لسه.')}</p>`) + `</div><p class="nb-p nb-tip">💡 ${T('Your notebooks live on this device. Tap 💾 Backup now and then to keep a copy you can restore on any phone.', 'دفاترك محفوظة على الجهاز ده. دوس 💾 نسخة احتياطية من وقت للتاني عشان تحتفظ بنسخة ترجّعها على أي موبايل.')}</p>`;
  }
  async function bookAction(k, id) {
    const m = LIB.books.find((x) => x.id === id);
    if (k === 'openbook') return openBook(id);
    if (!m) return;
    if (k === 'renbook') return titleDialog(m.title, async (t) => { m.title = t; await kvSet('lib', LIB); renderLib(); });
    if (k === 'dupbook') { if (!canBook()) return; if (BOOK && BOOK.id === id && NB) await flush(); const d = await kvGet('bk:' + id); if (!d) return; const nid = uid(), c = JSON.parse(JSON.stringify(d)); LIB.books.push({ id: nid, title: m.title + T(' (copy)', ' (نسخة)'), created: Date.now(), updated: Date.now(), n: c.pages.length, thumb: m.thumb }); await kvSet('bk:' + nid, c); await kvSet('lib', LIB); renderLib(); return; }
    if (k === 'delbook') { if (!confirm(T('Delete this notebook for good?', 'مسح الدفتر ده نهائيًا؟'))) return; await kvDel('bk:' + id); LIB.books = LIB.books.filter((x) => x.id !== id); if (BOOK && BOOK.id === id) { BOOK = null; NB = null; } await kvSet('lib', LIB); renderLib(); }
  }
  async function backupAll() {
    try {
      if (NB && BOOK) await flush(); const books = [];
      for (const m of LIB.books) { const d = await kvGet('bk:' + m.id); if (d) books.push({ meta: m, data: d }); }
      if (!books.length) return A.toast(T('Nothing to back up yet', 'مفيش دفاتر تتحفظ لسه'));
      const blob = new Blob([JSON.stringify({ app: 'anatovia-notebooks', v: 1, at: Date.now(), books })], { type: 'application/json' });
      const d = new Date(), ds = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      A.fileOut(blob, 'anatovia-notebooks-' + ds + '.json', 'application/json', { text: T('My Anatovia notebooks backup', 'نسخة احتياطية لدفاتري في Anatovia'), head: T('💾 Backup ready (' + books.length + ' notebooks)', '💾 النسخة الاحتياطية جاهزة (' + books.length + ' دفتر)') });
    } catch (err) { A.toast(T('Could not create the backup', 'تعذّر إنشاء النسخة الاحتياطية')); }
  }
  function restoreAll() {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
    inp.onchange = async () => {
      const f = inp.files && inp.files[0]; if (!f) return;
      try {
        const j = JSON.parse(await f.text()); if (!j || j.app !== 'anatovia-notebooks' || !Array.isArray(j.books)) throw new Error('bad');
        let added = 0; const ids = new Set(LIB.books.map((b) => b.id));
        for (const b of j.books) {
          if (!b || !b.meta || !b.data || !Array.isArray(b.data.pages) || !b.data.pages.length) continue;
          const m = { id: b.meta.id, title: String(b.meta.title || T('Notebook', 'دفتر')).slice(0, 60), created: b.meta.created || Date.now(), updated: b.meta.updated || Date.now(), n: b.data.pages.length, thumb: typeof b.meta.thumb === 'string' ? b.meta.thumb : '' };
          if (!m.id || ids.has(m.id)) { m.id = uid(); m.title += T(' (restored)', ' (مُسترجَع)'); }
          b.data.imgs = b.data.imgs || {}; ids.add(m.id); LIB.books.push(m); await kvSet('bk:' + m.id, b.data); added++;
        }
        await kvSet('lib', LIB); renderLib(); A.toast(added ? T(added + ' notebook(s) restored ✓', 'اتسترجع ' + added + ' دفتر ✓') : T('No notebooks found in this file', 'مفيش دفاتر في الملف ده'), 4000);
      } catch (err) { A.toast(T('This is not a valid backup file', 'الملف ده مش نسخة احتياطية صالحة'), 4000); }
    };
    inp.click();
  }
  function titleDialog(val, cb) {
    const d = dialog(`<h4>${T('Notebook name', 'اسم الدفتر')}</h4><input id="nbTt" type="text" maxlength="60" value="${esc0(val)}" style="width:100%;font-size:18px;border-radius:12px;padding:10px;border:1px solid var(--line);background:var(--surface2);color:var(--text)">`, (dl) => { const t = dl.querySelector('#nbTt').value.trim(); if (t) cb(t); });
    setTimeout(() => { const i = d.querySelector('#nbTt'); i.focus(); i.select(); }, 60);
  }

  const page = () => NB.pages[NB.cur];
  const items = () => page().items;
  function checkpoint() { undo.push(JSON.stringify(items())); if (undo.length > 50) undo.shift(); redo = []; save(); }
  function doUndo() { if (!undo.length) return; redo.push(JSON.stringify(items())); page().items = JSON.parse(undo.pop()); ST.sel = null; ctxBar(); draw(); save(); }
  function doRedo() { if (!redo.length) return; undo.push(JSON.stringify(items())); page().items = JSON.parse(redo.pop()); ST.sel = null; ctxBar(); draw(); save(); }

  /* ───────── images & text metrics ───────── */
  const IC = {};
  function getImg(src) {
    let m = IC[src]; if (m) return m.im;
    const im = new Image(); m = IC[src] = { im, ok: false }; im.onload = () => { m.ok = true; draw(); }; im.src = src; return im;
  }
  const svgSrc = (id) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(window.BONO.svg[id]);
  const srcOf = (it) => (it.t === 'k' ? svgSrc(it.id) : NB.imgs[it.im] || '');
  const mc = document.createElement('canvas').getContext('2d');
  const isAr = (s) => /[؀-ۿ]/.test(s);
  const fontOf = (it) => `${it.f === 'b' ? 800 : 600} ${it.s}px ${it.f === 'h' ? HAND : SANS}`;
  function textBox(it) {
    mc.font = fontOf(it); const ls = it.txt.split('\n'); let w = 0; for (const l of ls) w = Math.max(w, mc.measureText(l).width);
    const lh = it.s * 1.32; return { w: w + (it.bub ? 40 : 10), h: ls.length * lh + (it.bub ? 30 : 8), lh, ls };
  }
  function boxOf(it) {
    if (it.t === 't') { const b = textBox(it); return { w: b.w, h: b.h }; }
    if (it.t === 'k' || it.t === 'i') {
      const im = getImg(srcOf(it)), asp = im.naturalWidth ? im.naturalHeight / im.naturalWidth : 1;
      const base = it.t === 'k' ? (/^[bynh]_/.test(it.id) ? 150 : it.id.startsWith('k_badge') ? 170 : 110) : it.w;
      const w = base * it.sc; return { w, h: w * asp };
    }
    return { w: 0, h: 0 };
  }
  const pts = (it) => { const a = []; if (it.t === 's') for (let i = 0; i < it.p.length; i += 2) a.push([it.p[i], it.p[i + 1]]); else a.push([it.x1, it.y1], [it.x2, it.y2]); return a; };
  function centerOf(it) {
    if (it.t === 's' || it.t === 'a') { const a = pts(it); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of a) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } return [(x0 + x1) / 2, (y0 + y1) / 2]; }
    return [it.x, it.y];
  }
  function mapPts(it, fn) { if (it.t === 's') for (let i = 0; i < it.p.length; i += 2) { const q = fn(it.p[i], it.p[i + 1]); it.p[i] = q[0]; it.p[i + 1] = q[1]; } else { let q = fn(it.x1, it.y1); it.x1 = q[0]; it.y1 = q[1]; q = fn(it.x2, it.y2); it.x2 = q[0]; it.y2 = q[1]; } }
  const moveBy = (it, dx, dy) => { if (it.t === 's' || it.t === 'a') mapPts(it, (x, y) => [x + dx, y + dy]); else { it.x += dx; it.y += dy; } };
  function scaleBy(it, f) {
    if (it.t === 't') it.s = Math.max(12, Math.min(220, it.s * f));
    else if (it.t === 'k' || it.t === 'i') it.sc = Math.max(0.15, Math.min(8, it.sc * f));
    else { const [cx0, cy0] = centerOf(it); mapPts(it, (x, y) => [cx0 + (x - cx0) * f, cy0 + (y - cy0) * f]); }
  }
  function rotBy(it, a) {
    if (it.t === 't' || it.t === 'k' || it.t === 'i') it.r = (it.r || 0) + a;
    else { const [cx0, cy0] = centerOf(it), c = Math.cos(a), s = Math.sin(a); mapPts(it, (x, y) => [cx0 + (x - cx0) * c - (y - cy0) * s, cy0 + (x - cx0) * s + (y - cy0) * c]); }
  }
  function segDist(px, py, x1, y1, x2, y2) { const dx = x2 - x1, dy = y2 - y1, l = dx * dx + dy * dy; let t = l ? ((px - x1) * dx + (py - y1) * dy) / l : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(px - x1 - t * dx, py - y1 - t * dy); }
  function hit(it, x, y, pad) {
    pad = pad || 0;
    if (it.t === 's') { const a = pts(it), r = Math.max(10, (it.hl ? it.w * 0.5 : it.w) / 2 + 8) + pad; if (a.length === 1) return Math.hypot(x - a[0][0], y - a[0][1]) <= r; for (let i = 1; i < a.length; i++) if (segDist(x, y, a[i - 1][0], a[i - 1][1], a[i][0], a[i][1]) <= r) return true; return false; }
    if (it.t === 'a') return segDist(x, y, it.x1, it.y1, it.x2, it.y2) <= 16 + pad || (it.l && Math.hypot(x - (it.x1 + it.x2) / 2, y - (it.y1 + it.y2) / 2) < 50);
    const b = boxOf(it), c = Math.cos(-(it.r || 0)), s = Math.sin(-(it.r || 0)), dx = x - it.x, dy = y - it.y;
    const lx = dx * c - dy * s, ly = dx * s + dy * c; return Math.abs(lx) <= b.w / 2 + 8 + pad && Math.abs(ly) <= b.h / 2 + 8 + pad;
  }
  const topAt = (x, y) => { const a = items(); for (let i = a.length - 1; i >= 0; i--) if (hit(a[i], x, y)) return a[i]; return null; };

  /* ───────── handwriting smoothing: resample + gentle averaging, thickness follows speed (ink pen) ───────── */
  function smoothStroke(it, passes) {
    const n0 = it.p.length / 2; if (n0 < 3) return; const ms = it.m || [];
    let a = []; for (let i = 0; i < n0; i++) a.push([it.p[2 * i], it.p[2 * i + 1], ms[i] || 1]);
    const out = [a[0].slice()]; let acc = 0, prev = a[0];
    for (let i = 1; i < a.length; i++) {
      let b = a[i], d = Math.hypot(b[0] - prev[0], b[1] - prev[1]);
      while (acc + d >= 4 && d > 0) { const t = (4 - acc) / d, q = [prev[0] + (b[0] - prev[0]) * t, prev[1] + (b[1] - prev[1]) * t, prev[2] + (b[2] - prev[2]) * t]; out.push(q); prev = q; d = Math.hypot(b[0] - prev[0], b[1] - prev[1]); acc = 0; }
      acc += d; prev = b;
    }
    out.push(a[a.length - 1].slice());
    for (let k = 0; k < (passes || 2); k++) { const o = out.map((q) => q.slice()); for (let i = 1; i < out.length - 1; i++) for (let j = 0; j < 3; j++) o[i][j] = (out[i - 1][j] + 2 * out[i][j] + out[i + 1][j]) / 4; for (let i = 0; i < out.length; i++) out[i] = o[i]; }
    it.p = []; it.m = []; for (const q of out) { it.p.push(Math.round(q[0] * 10) / 10, Math.round(q[1] * 10) / 10); it.m.push(Math.round(q[2] * 100) / 100); }
  }

  /* ───────── drawing ───────── */
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function bubble(c, x, y, r, fill, line) { c.beginPath(); c.arc(x, y, r, 0, 7); if (fill) { c.fillStyle = fill; c.fill(); } if (line) { c.strokeStyle = line; c.lineWidth = 3; c.stroke(); } }
  function drawBg(c, pg) {
    c.fillStyle = pg.bg; c.fillRect(0, 0, PW, PH);
    const dark = pg.bg === '#1d2440' || pg.bg === '#101826', ink = dark ? '200,215,255' : '60,90,160';
    c.save();
    if (pg.paper === 'ruled') { c.strokeStyle = `rgba(${ink},.28)`; c.lineWidth = 1.6; for (let y = 160; y < PH - 70; y += 42) { c.beginPath(); c.moveTo(56, y); c.lineTo(PW - 56, y); c.stroke(); } }
    else if (pg.paper === 'grid') { c.strokeStyle = `rgba(${ink},.2)`; c.lineWidth = 1.2; for (let y = 60; y < PH - 50; y += 38) { c.beginPath(); c.moveTo(56, y); c.lineTo(PW - 56, y); c.stroke(); } for (let x = 56; x < PW - 50; x += 38) { c.beginPath(); c.moveTo(x, 60); c.lineTo(x, PH - 60); c.stroke(); } }
    else if (pg.paper === 'dots') { c.fillStyle = `rgba(${ink},.4)`; for (let y = 70; y < PH - 60; y += 38) for (let x = 66; x < PW - 56; x += 38) { c.beginPath(); c.arc(x, y, 2, 0, 7); c.fill(); } }
    c.restore();
    const c1 = pg.c1, c2 = pg.c2;
    c.save();
    if (pg.frame === 'waves') {
      c.strokeStyle = c2; c.globalAlpha = 0.55; c.lineWidth = 2; rr(c, 30, 30, PW - 60, PH - 60, 10); c.stroke(); c.globalAlpha = 1;
      c.save(); rr(c, 30, 30, PW - 60, PH - 60, 10); c.clip();
      c.fillStyle = c1; c.beginPath(); c.ellipse(120, PH - 40, 170, 190, 0.25, 0, 7); c.fill();
      c.setLineDash([10, 8]); c.strokeStyle = c2; c.lineWidth = 2.5; c.beginPath(); c.ellipse(120, PH - 40, 150, 170, 0.25, 0, 7); c.stroke(); c.setLineDash([]);
      c.fillStyle = c2; c.beginPath(); c.ellipse(PW - 90, PH - 60, 150, 210, -0.3, 0, 7); c.fill();
      c.strokeStyle = c1; c.lineWidth = 3; c.beginPath(); c.ellipse(PW - 90, PH - 60, 128, 188, -0.3, 0, 7); c.stroke();
      c.restore();
      bubble(c, 70, 78, 20, c2, '#1b2a4a'); bubble(c, 108, 60, 11, c1, '#1b2a4a'); bubble(c, 138, 92, 15, null, c1); bubble(c, PW - 78, 74, 26, c1, c2); bubble(c, PW - 120, 100, 12, null, c2);
      c.lineCap = 'round'; c.lineWidth = 9; for (let y = 140, i = 0; y < PH - 330; y += 80, i++) { c.strokeStyle = i % 2 ? c2 : c1; c.beginPath(); c.moveTo(44, y); c.lineTo(44, y + (i % 2 ? 46 : 22)); c.stroke(); }
    } else if (pg.frame === 'bubbles') {
      c.strokeStyle = c2; c.globalAlpha = 0.5; c.lineWidth = 2; rr(c, 30, 30, PW - 60, PH - 60, 18); c.stroke(); c.globalAlpha = 1;
      const B = [[70, 80, 34, c1], [120, 56, 18, c2], [40, 140, 14, c2], [150, 118, 12, c1], [PW - 70, PH - 80, 38, c2], [PW - 128, PH - 52, 18, c1], [PW - 42, PH - 150, 14, c1], [PW - 76, 70, 18, c1], [60, PH - 70, 22, c1]];
      for (const [x, y, r, f] of B) bubble(c, x, y, r, f, '#1b2a4a');
    } else if (pg.frame === 'dashed') {
      c.lineCap = 'round'; c.strokeStyle = c2; c.lineWidth = 10; c.setLineDash([26, 18]); rr(c, 32, 32, PW - 64, PH - 64, 28); c.stroke(); c.setLineDash([]);
      c.strokeStyle = c1; c.lineWidth = 3; rr(c, 56, 56, PW - 112, PH - 112, 18); c.stroke();
    } else if (pg.frame === 'corners') {
      const q = (x, y, r, a, f) => { c.fillStyle = f; c.beginPath(); c.moveTo(x, y); c.arc(x, y, r, a, a + Math.PI / 2); c.closePath(); c.fill(); };
      q(0, 0, 150, 0, c1); q(0, 0, 90, 0, c2); q(PW, 0, 150, Math.PI / 2, c1); q(PW, 0, 90, Math.PI / 2, c2); q(PW, PH, 150, Math.PI, c1); q(PW, PH, 90, Math.PI, c2); q(0, PH, 150, Math.PI * 1.5, c1); q(0, PH, 90, Math.PI * 1.5, c2);
    } else if (pg.frame === 'stripe') {
      const wave = (h, f) => { c.fillStyle = f; c.beginPath(); c.moveTo(0, 0); c.lineTo(PW, 0); c.lineTo(PW, h); for (let x = PW; x >= 0; x -= 40) c.quadraticCurveTo(x - 20, h + ((x / 40) % 2 ? 22 : -22), x - 40, h); c.closePath(); c.fill(); };
      wave(116, c2); wave(96, c1);
      c.fillStyle = c1; c.globalAlpha = 0.7; c.fillRect(0, PH - 30, PW, 30); c.fillStyle = c2; c.fillRect(0, PH - 12, PW, 12);
    }
    c.restore();
  }
  function drawItem(c, it) {
    c.save();
    if (it.t === 's' && it.ink && it.m && !it.hl) {
      c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = it.c; c.fillStyle = it.c; const m = it.m, nn = it.p.length / 2;
      if (nn < 2) { c.beginPath(); c.arc(it.p[0], it.p[1], it.w * 0.5 * (m[0] || 1), 0, 7); c.fill(); }
      for (let i = 1; i < nn; i++) { c.lineWidth = Math.max(0.8, it.w * (m[i] || 1)); c.beginPath(); c.moveTo(it.p[2 * i - 2], it.p[2 * i - 1]); c.lineTo(it.p[2 * i], it.p[2 * i + 1]); c.stroke(); }
    } else if (it.t === 's') {
      c.lineCap = it.hl ? 'butt' : 'round'; c.lineJoin = 'round'; c.strokeStyle = it.c; c.lineWidth = it.w; if (it.hl) c.globalAlpha = 0.4;
      c.beginPath(); c.moveTo(it.p[0], it.p[1]);
      if (it.p.length === 2) c.lineTo(it.p[0] + 0.1, it.p[1]);
      for (let i = 2; i < it.p.length; i += 2) { if (i + 2 < it.p.length) c.quadraticCurveTo(it.p[i], it.p[i + 1], (it.p[i] + it.p[i + 2]) / 2, (it.p[i + 1] + it.p[i + 3]) / 2); else c.lineTo(it.p[i], it.p[i + 1]); }
      c.stroke();
    } else if (it.t === 'a') {
      const a = Math.atan2(it.y2 - it.y1, it.x2 - it.x1), hl = 12 + it.w * 2.2;
      c.strokeStyle = it.c; c.fillStyle = it.c; c.lineWidth = it.w; c.lineCap = 'round';
      c.beginPath(); c.moveTo(it.x1, it.y1); c.lineTo(it.x2 - Math.cos(a) * hl * 0.6, it.y2 - Math.sin(a) * hl * 0.6); c.stroke();
      c.beginPath(); c.moveTo(it.x2, it.y2); c.lineTo(it.x2 - hl * Math.cos(a - 0.45), it.y2 - hl * Math.sin(a - 0.45)); c.lineTo(it.x2 - hl * Math.cos(a + 0.45), it.y2 - hl * Math.sin(a + 0.45)); c.closePath(); c.fill();
      if (it.l) {
        c.font = `700 26px ${SANS}`; const w = c.measureText(it.l).width + 26, mx = it.x1 - Math.cos(a) * 4, my = it.y1 - Math.sin(a) * 4;
        c.fillStyle = '#fff'; c.strokeStyle = it.c; c.lineWidth = 3; rr(c, mx - w / 2, my - 22 - 14, w, 40, 14); c.fill(); c.stroke();
        c.fillStyle = '#1b2a4a'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.direction = isAr(it.l) ? 'rtl' : 'ltr'; c.fillText(it.l, mx, my - 14);
      }
    } else if (it.t === 't') {
      const b = textBox(it); c.translate(it.x, it.y); c.rotate(it.r || 0);
      if (it.bub) { c.fillStyle = '#ffffff'; c.strokeStyle = '#1b2a4a'; c.lineWidth = 4; rr(c, -b.w / 2, -b.h / 2, b.w, b.h, 22); c.fill(); c.stroke(); }
      c.font = fontOf(it); c.fillStyle = it.bub ? '#1b2a4a' : it.c; c.textAlign = 'center'; c.textBaseline = 'middle';
      b.ls.forEach((l, i) => { c.direction = isAr(l) ? 'rtl' : 'ltr'; c.fillText(l, 0, -b.h / 2 + (it.bub ? 15 : 4) + b.lh * (i + 0.5)); });
    } else if (it.t === 'k' || it.t === 'i') {
      const im = getImg(srcOf(it)); if (im.naturalWidth) { const b = boxOf(it); c.translate(it.x, it.y); c.rotate(it.r || 0); if (it.t === 'i' && it.sh) { c.shadowColor = 'rgba(0,0,0,.3)'; c.shadowBlur = 14; c.shadowOffsetY = 5; } c.drawImage(im, -b.w / 2, -b.h / 2, b.w, b.h); }
    }
    c.restore();
  }
  function drawSel(c, it) {
    c.save(); c.strokeStyle = '#4a7bff'; c.lineWidth = 2.5; c.setLineDash([9, 6]);
    if (it.t === 's' || it.t === 'a') { const a = pts(it); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of a) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } c.strokeRect(x0 - 14, y0 - 14, x1 - x0 + 28, y1 - y0 + 28); }
    else { const b = boxOf(it); c.translate(it.x, it.y); c.rotate(it.r || 0); c.strokeRect(-b.w / 2 - 6, -b.h / 2 - 6, b.w + 12, b.h + 12); }
    c.restore();
  }
  function renderTo(c, pg, extra) { drawBg(c, pg); for (const it of pg.items) drawItem(c, it); if (extra) drawItem(c, extra); }
  function draw() {
    if (!cx || !NB) return; if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = 0; if (!cx || !NB) return; cx.setTransform(1, 0, 0, 1, 0, 0); cx.clearRect(0, 0, cv.width, cv.height); cx.setTransform(K * V.z, 0, 0, K * V.z, K * V.ox, K * V.oy);
      renderTo(cx, page(), cur);
      if (ST.sel && items().includes(ST.sel)) drawSel(cx, ST.sel);
    });
  }
  function fit() {
    if (!ov || ov.hidden || ov.classList.contains('lib') || !NB) return; const st = ov.querySelector('.nb-stage'), r = st.getBoundingClientRect();
    const s = Math.min((r.width - 16) / PW, (r.height - 16) / PH), w = Math.max(120, PW * s), h = PH * s, d = Math.min(2.5, window.devicePixelRatio || 1);
    cv.style.width = w + 'px'; cv.style.height = h + 'px'; cv.width = Math.round(w * d); cv.height = Math.round(h * d); K = cv.width / PW; draw();
  }
  window.addEventListener('resize', fit);

  /* ───────── UI ───────── */
  const sw = (list, cur0, key) => list.map((c) => `<button type="button" class="nb-sw ${c === cur0 ? 'on' : ''}" style="background:${c}" data-nb="${key}:${c}"></button>`).join('');
  function shell() {
    ov = document.createElement('div'); ov.id = 'nbx'; ov.dir = ar() ? 'rtl' : 'ltr';
    ov.innerHTML = `<div class="nb-top"><button data-nb="close">✕</button><button data-nb="lib">📚</button><b class="nb-ttl" id="nbTitle" data-nb="rentitle"></b><span class="nb-sp"></span>` +
      `<button data-nb="pg:-1">◀</button><span id="nbPg" class="nb-pg"></span><button data-nb="pg:1">▶</button><button data-nb="addpg">➕</button><button data-nb="dup">⎘</button><button data-nb="delpg">🗑</button><button data-nb="export">⬇️</button></div>` +
      `<div class="nb-stage"><canvas id="nbc"></canvas></div><div id="nbCtx" class="nb-ctx" hidden></div><div id="nbSheet" class="nb-sheet" hidden></div>` +
      `<div class="nb-tools" id="nbTools"></div><div id="nbLib" class="nb-lib"></div>`;
    (document.getElementById('app') || document.body).appendChild(ov); cv = ov.querySelector('#nbc'); cx = cv.getContext('2d');
    ov.addEventListener('click', onClick); bindPointer();
  }
  const TOOLS = [['select', '☝️', 'تحديد', 'Select'], ['hand', '✋', 'تحريك', 'Pan'], ['pen', '✏️', 'قلم', 'Pen'], ['hl', '🖍️', 'ماركر', 'Marker'], ['erase', '🧽', 'ممحاة', 'Eraser'], ['text', '🔤', 'نص', 'Text'], ['arrow', '↗️', 'سهم', 'Arrow']];
  function toolbar() {
    $('nbTools').innerHTML = TOOLS.map(([k, e, a, en]) => `<button class="${ST.tool === k ? 'on' : ''}" data-nb="tool:${k}"><i>${e}</i><small>${T(en, a)}</small></button>`).join('') +
      `<button data-nb="sheet:color"><i><span class="nb-dot" style="background:${ST.tool === 'hl' ? ST.hc : ST.c}"></span></i><small>${T('Color', 'لون')}</small></button>` +
      `<button data-nb="sheet:stickers"><i>😀</i><small>${T('Bono', 'بونو')}</small></button><button data-nb="sheet:model"><i>🦴</i><small>${T('3D part', 'من المجسم')}</small></button>` +
      `<button data-nb="sheet:design"><i>🎨</i><small>${T('Design', 'التصميم')}</small></button><button data-nb="zoom:in"><i>🔍</i><small>${T('Zoom +', 'تكبير')}</small></button><button data-nb="zoom:out"><i>🔎</i><small>${T('Zoom −', 'تصغير')}</small></button><button data-nb="zoom:reset"><i>⤢</i><small>${T('Fit', 'ملاءمة')}</small></button><button data-nb="undo"><i>↶</i><small>${T('Undo', 'تراجع')}</small></button><button data-nb="redo"><i>↷</i><small>${T('Redo', 'إعادة')}</small></button>`;
    $('nbPg').textContent = `${NB.cur + 1}/${NB.pages.length}`;
  }
  function ctxBar() {
    const el = $('nbCtx'); if (!el) return; const it = ST.sel;
    if (!it || !items().includes(it)) { el.hidden = true; ST.sel = null; return; }
    el.hidden = false;
    el.innerHTML = `<button data-nb="op:shrink">➖</button><button data-nb="op:grow">➕</button><button data-nb="op:rl">↺</button><button data-nb="op:rr">↻</button><button data-nb="op:copy">⎘</button><button data-nb="op:front">⬆️</button>` +
      (it.t === 't' || it.t === 'a' ? '<button data-nb="op:edit">✎</button>' : '') + (it.t === 'i' ? `<button class="${it.sh ? 'on' : ''}" data-nb="op:shadow">◐</button>` : '') + (it.t === 'i' && it.cam ? '<button data-nb="op:rot3d">🔄 3D</button>' : '') + (it.t === 's' && !it.hl ? '<button data-nb="op:smooth">✨</button>' : '') + (it.t === 's' || it.t === 't' || it.t === 'a' ? '<button data-nb="op:color">🎨</button>' : '') + '<button data-nb="op:del">🗑</button>';
  }
  function sheet(kind) {
    const el = $('nbSheet'); if (!kind || ST.sheet === kind) { ST.sheet = ''; el.hidden = true; return; }
    ST.sheet = kind; el.hidden = false; let h = `<button class="nb-x" data-nb="sheet:">✕</button>`; const pg = page();
    if (kind === 'color') {
      const hl = ST.tool === 'hl';
      h += `<h4>${hl ? T('Marker color', 'لون الماركر') : T('Pen color', 'لون القلم')}</h4><div class="nb-sws">${sw(hl ? HLC : COLORS, hl ? ST.hc : ST.c, 'col')}<input type="color" class="nb-col" value="${hl ? ST.hc : ST.c}" data-nbin="col"></div>` +
        `<h4>${T('Thickness', 'السُّمك')}</h4><input type="range" min="${hl ? 12 : 2}" max="${hl ? 48 : 22}" value="${hl ? ST.hw : ST.w}" data-nbin="wid" style="width:100%">` +
        (hl ? '' : `<div class="nb-row"><button class="${ST.smooth ? 'on' : ''}" data-nb="smooth">✨ ${T('Smooth handwriting', 'تنعيم الخط')}: ${ST.smooth ? T('On', 'شغّال') : T('Off', 'مقفول')}</button></div><p class="nb-p">${T('Keeps your own handwriting but removes shaky lines and varies thickness like an ink pen.', 'بيفضل خط إيدك زي ما هو، بس بيشيل الرعشة ويخلّي السُّمك زي قلم الحبر.')}</p>`);
    } else if (kind === 'stickers') {
      const B = window.BONO, G = B.groups || [], tab = ST.stab && G.some((g) => g.id === ST.stab) ? ST.stab : (G[0] ? G[0].id : 'b'), g = G.find((x) => x.id === tab) || G[0];
      const cell = (k) => `<button class="nb-st" data-nb="stk:${k}"><img alt="" loading="lazy" src="${svgSrc(k)}">${B.labels[k] ? `<small>${B.labels[k]}</small>` : ''}</button>`;
      h += `<div class="nb-tabs">${G.map((x) => `<button class="${x.id === tab ? 'on' : ''}" data-nb="stab:${x.id}">${ar() ? x.ar : x.en}${x.sub && ar() ? ' <small>(' + x.sub + ')</small>' : ''}</button>`).join('')}</div><div class="nb-grid">${g.ids.map(cell).join('')}</div>`;
    } else if (kind === 'design') {
      h += `<h4>${T('Paper', 'الورق')}</h4><div class="nb-row">${PAPERS.map(([k, a, e]) => `<button class="${pg.paper === k ? 'on' : ''}" data-nb="paper:${k}">${T(e, a)}</button>`).join('')}</div>` +
        `<h4>${T('Frame', 'الإطار')}</h4><div class="nb-row">${FRAMES.map(([k, a, e]) => `<button class="${pg.frame === k ? 'on' : ''}" data-nb="frame:${k}">${T(e, a)}</button>`).join('')}</div>` +
        `<h4>${T('Page color', 'لون الصفحة')}</h4><div class="nb-sws">${sw(BGS, pg.bg, 'bg')}<input type="color" class="nb-col" value="${pg.bg}" data-nbin="bg"></div>` +
        `<h4>${T('Frame colors', 'ألوان الإطار')} (1)</h4><div class="nb-sws">${sw(FCS, pg.c1, 'c1')}<input type="color" class="nb-col" value="${pg.c1}" data-nbin="c1"></div>` +
        `<h4>${T('Frame colors', 'ألوان الإطار')} (2)</h4><div class="nb-sws">${sw(FCS, pg.c2, 'c2')}<input type="color" class="nb-col" value="${pg.c2}" data-nbin="c2"></div>` +
        `<div class="nb-row" style="margin-top:12px"><button data-nb="designall">📑 ${T('Apply to all pages', 'طبّق على كل الصفحات')}</button></div>`;
    } else if (kind === 'model') {
      h += `<h4>🦴 ${T('Add a 3D part', 'ضيف جزء من المجسم')}</h4><p class="nb-p">${T('You will go to the 3D model: open any bone, muscle or nerve, zoom and rotate it the way you like, then tap the button. It lands in your page with no background.', 'هتروح للمجسم: افتح أي عضمة أو عضلة أو عصب، قرّب ودوّر زي ما تحب، وبعدين دوس الزرار. هتنزل في صفحتك من غير خلفية.')}</p><div class="nb-row"><button class="on" data-nb="pick">${T('Go to the model', 'روح للمجسم')}</button></div>`;
    }
    el.innerHTML = h;
  }
  function onClick(ev) {
    const b = ev.target.closest('[data-nb]'); if (!b) return; const [k, ...r] = b.dataset.nb.split(':'), v = r.join(':'), pg = NB ? page() : null;
    if (k === 'close') return close();
    if (k === 'lib') return showLib();
    if (k === 'rentitle') return titleDialog(BOOK.title, (t) => { BOOK.title = t; setTitle(); save(); });
    if (k === 'newbook') { if (!canBook()) return; return titleDialog(T('Notebook', 'دفتر') + ' ' + (LIB.books.length + 1), async (t) => { const m = await newBook(t); await openBook(m.id); }); }
    if (k === 'backup') return backupAll();
    if (k === 'restore') return restoreAll();
    if (k === 'openbook' || k === 'renbook' || k === 'dupbook' || k === 'delbook') return bookAction(k, v);
    if (k === 'tool') { ST.tool = v; ST.sel = null; ctxBar(); if (ST.sheet === 'color' && (v === 'pen' || v === 'hl')) sheet(''), sheet('color'); toolbar(); draw(); return; }
    if (k === 'sheet') { if (v === 'color' && ST.tool !== 'pen' && ST.tool !== 'hl') ST.tool = 'pen'; sheet(v); toolbar(); return; }
    if (k === 'col') { if (ST.tool === 'hl') ST.hc = v; else ST.c = v; sheet(''); sheet('color'); toolbar(); return; }
    if (k === 'pg') return gotoPage(NB.cur + (+v));
    if (k === 'addpg') return addPage();
    if (k === 'dup') { if (!canAdd()) return; const p = JSON.parse(JSON.stringify(pg)); p.id = uid(); NB.pages.splice(NB.cur + 1, 0, p); gotoPage(NB.cur + 1); save(); return; }
    if (k === 'delpg') { if (!confirm(T('Delete this page?', 'مسح الصفحة دي؟'))) return; if (NB.pages.length === 1) NB.pages[0] = newPage(); else NB.pages.splice(NB.cur, 1); NB.cur = Math.min(NB.cur, NB.pages.length - 1); undo = []; redo = []; ST.sel = null; ctxBar(); toolbar(); draw(); save(); return; }
    if (k === 'undo') return doUndo(); if (k === 'redo') return doRedo();
    if (k === 'export') return exportSheet();
    if (k === 'stk') { checkpoint(); const it = { t: 'k', id: v, x: PW / 2 + (Math.random() - 0.5) * 80, y: PH / 2 + (Math.random() - 0.5) * 120, sc: 1.4, r: 0 }; items().push(it); ST.tool = 'select'; ST.sel = it; sheet(''); ctxBar(); toolbar(); draw(); return; }
    if (k === 'paper' || k === 'frame' || k === 'bg' || k === 'c1' || k === 'c2') { pg[k] = v; sheet(''); sheet('design'); draw(); save(); return; }
    if (k === 'designall') { for (const q of NB.pages) { q.paper = pg.paper; q.frame = pg.frame; q.bg = pg.bg; q.c1 = pg.c1; q.c2 = pg.c2; } draw(); save(); A.toast(T('Applied to all pages', 'اتطبّق على كل الصفحات')); return; }
    if (k === 'smooth') { ST.smooth = !ST.smooth; Store.d.nbSm = ST.smooth ? 1 : 0; Store.save(); sheet(''); sheet('color'); return; }
    if (k === 'zoom') { if (v === 'reset') { resetView(); draw(); } else zoomAt(PW / 2, PH / 2, v === 'in' ? 1.4 : 1 / 1.4); return; }
    if (k === 'stab') { ST.stab = v; sheet(''); sheet('stickers'); return; }
    if (k === 'pick') return startPick();
    if (k === 'op') return doOp(v);
    if (k === 'pdfall') return exportPdf(true); if (k === 'pdfone') return exportPdf(false); if (k === 'img') return exportImg();
  }
  ((fn) => { document.addEventListener('input', fn); })((ev) => {
    const el = ev.target; if (!ov || !el.dataset || !el.dataset.nbin) return; const k = el.dataset.nbin, pg = page();
    if (k === 'wid') { if (ST.tool === 'hl') ST.hw = +el.value; else ST.w = +el.value; return; }
    if (k === 'col') { if (ST.tool === 'hl') ST.hc = el.value; else ST.c = el.value; toolbar(); return; }
    if (k === 'bg' || k === 'c1' || k === 'c2') { pg[k] = el.value; draw(); save(); }
  });
  function canAdd() { if (NB.pages.length >= FREE_PAGES && !(A.isPremium && A.isPremium())) { A.paywall('The free notebook has 3 pages. Premium gives you unlimited pages.', 'الدفتر المجاني فيه 3 صفحات. النسخة المميزة تدّيك صفحات بلا حدود.'); return false; } return true; }
  function addPage() { if (!canAdd()) return; const p = newPage(), c = page(); Object.assign(p, { paper: c.paper, frame: c.frame, bg: c.bg, c1: c.c1, c2: c.c2 }); NB.pages.splice(NB.cur + 1, 0, p); gotoPage(NB.cur + 1); save(); }
  function gotoPage(n) { if (n < 0 || n >= NB.pages.length) return; NB.cur = n; resetView(); undo = []; redo = []; ST.sel = null; ctxBar(); toolbar(); draw(); save(); }

  /* ───────── item operations ───────── */
  function doOp(op) {
    const it = ST.sel; if (!it) return;
    if (op === 'del') { checkpoint(); page().items = items().filter((x) => x !== it); ST.sel = null; }
    else if (op === 'copy') { checkpoint(); const c = JSON.parse(JSON.stringify(it)); moveBy(c, 30, 30); items().push(c); ST.sel = c; }
    else if (op === 'front') { checkpoint(); page().items = items().filter((x) => x !== it); items().push(it); }
    else if (op === 'grow' || op === 'shrink') { checkpoint(); scaleBy(it, op === 'grow' ? 1.15 : 1 / 1.15); }
    else if (op === 'rl' || op === 'rr') { checkpoint(); rotBy(it, (op === 'rr' ? 1 : -1) * Math.PI / 12); }
    else if (op === 'rot3d') { startPick(it); return; }
    else if (op === 'smooth' && it.t === 's') { checkpoint(); if (!it.m) it.m = new Array(it.p.length / 2).fill(1); smoothStroke(it, 3); it.ink = 1; }
    else if (op === 'shadow') { checkpoint(); it.sh = it.sh ? 0 : 1; }
    else if (op === 'edit') { if (it.t === 't') textDialog(it); else labelDialog(it); return; }
    else if (op === 'color') { checkpoint(); it.c = ST.tool === 'hl' && it.hl ? ST.hc : ST.c; }
    ctxBar(); draw(); save();
  }
  function dialog(html, onOk) {
    const d = document.createElement('div'); d.className = 'nb-dlg'; d.innerHTML = `<div class="nb-dc">${html}<div class="nb-row" style="margin-top:12px"><button class="on" id="nbOk">${T('OK', 'تمام')}</button><button id="nbNo">${T('Cancel', 'إلغاء')}</button></div></div>`;
    ov.appendChild(d); const close0 = () => d.remove(); d.querySelector('#nbNo').onclick = close0; d.querySelector('#nbOk').onclick = () => { onOk(d); close0(); };
    d.addEventListener('click', (e) => { const s = e.target.closest('[data-dg]'); if (!s) return; d.querySelectorAll(`[data-dg="${s.dataset.dg}"]`).forEach((x) => x.classList.remove('on')); s.classList.add('on'); d.dataset[s.dataset.dg] = s.dataset.v; });
    return d;
  }
  function textDialog(it, pos) {
    const isNew = !it, o = it || { t: 't', x: pos.x, y: pos.y, txt: '', s: 40, c: ST.c, f: 'n', bub: 0, r: 0 };
    const sizes = [[28, 'S'], [40, 'M'], [58, 'L'], [84, 'XL']], near = sizes.reduce((a, b) => (Math.abs(b[0] - o.s) < Math.abs(a[0] - o.s) ? b : a));
    const d = dialog(`<textarea id="nbTxt" rows="3" placeholder="${T('Type here…', 'اكتب هنا…')}" style="width:100%;font-size:18px;border-radius:12px;padding:10px;border:1px solid var(--line);background:var(--surface2);color:var(--text)">${esc0(o.txt)}</textarea>` +
      `<div class="nb-row">${sizes.map(([v, l]) => `<button data-dg="s" data-v="${v}" class="${near[0] === v ? 'on' : ''}">${l}</button>`).join('')}</div>` +
      `<div class="nb-row"><button data-dg="f" data-v="n" class="${o.f === 'n' ? 'on' : ''}">${T('Normal', 'عادي')}</button><button data-dg="f" data-v="h" class="${o.f === 'h' ? 'on' : ''}">${T('Handwriting', 'بخط اليد')}</button><button data-dg="f" data-v="b" class="${o.f === 'b' ? 'on' : ''}">${T('Bold', 'عريض')}</button></div>` +
      `<div class="nb-row"><button data-dg="bub" data-v="0" class="${o.bub ? '' : 'on'}">${T('Plain', 'بدون')}</button><button data-dg="bub" data-v="1" class="${o.bub ? 'on' : ''}">💬 ${T('Bubble', 'فقاعة')}</button></div>` +
      `<div class="nb-sws" id="nbTc">${sw(COLORS, o.c, 'tc')}</div>`, (dl) => {
      const txt = dl.querySelector('#nbTxt').value.replace(/\s+$/, ''); if (!txt) return;
      checkpoint(); o.txt = txt; o.s = +(dl.dataset.s || o.s); o.f = dl.dataset.f || o.f; o.bub = +(dl.dataset.bub != null ? dl.dataset.bub : o.bub); o.c = dl.dataset.tc || o.c;
      if (isNew) { items().push(o); ST.sel = o; } ctxBar(); draw(); save();
    });
    d.querySelectorAll('[data-nb^="tc:"]').forEach((b) => { b.addEventListener('click', (e) => { e.stopPropagation(); d.dataset.tc = b.dataset.nb.slice(3); d.querySelectorAll('.nb-sw').forEach((x) => x.classList.remove('on')); b.classList.add('on'); }); });
    setTimeout(() => d.querySelector('#nbTxt').focus(), 60);
  }
  const esc0 = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function labelDialog(it) {
    const d = dialog(`<h4>${T('What is this?', 'دا إيه؟')}</h4><input id="nbLb" type="text" value="${esc0(it.l || '')}" style="width:100%;font-size:18px;border-radius:12px;padding:10px;border:1px solid var(--line);background:var(--surface2);color:var(--text)">`, (dl) => { checkpoint(); it.l = dl.querySelector('#nbLb').value.trim(); ctxBar(); draw(); save(); });
    setTimeout(() => d.querySelector('#nbLb').focus(), 60);
  }

  /* ───────── pointer input ───────── */
  function bindPointer() {
    const P2 = new Map(); let drag = null, pinch = null, vpinch = null;
    const pos = (e) => { const r = cv.getBoundingClientRect(), sx = (e.clientX - r.left) / r.width * PW, sy = (e.clientY - r.top) / r.height * PH; return { x: (sx - V.ox) / V.z, y: (sy - V.oy) / V.z, sx, sy }; };
    const eraseAt = (p) => { const a = items(), n = a.length, keep = a.filter((it) => !hit(it, p.x, p.y, 8)); if (keep.length !== n) { if (!drag.cp) { undo.push(JSON.stringify(a)); redo = []; drag.cp = 1; } page().items = keep; ST.sel = null; ctxBar(); draw(); save(); } };
    cv.addEventListener('wheel', (e) => { e.preventDefault(); const p = pos(e); zoomAt(p.sx, p.sy, e.deltaY < 0 ? 1.15 : 1 / 1.15); }, { passive: false });
    cv.addEventListener('pointerdown', (e) => {
      cv.setPointerCapture(e.pointerId); const p = pos(e); P2.set(e.pointerId, p);
      if (P2.size === 2) {
        const [a, b] = [...P2.values()]; cur = null; drag = null;
        if (ST.sel && hit(ST.sel, (a.x + b.x) / 2, (a.y + b.y) / 2, 30)) { pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), a: Math.atan2(b.y - a.y, b.x - a.x) }; checkpoint(); }
        else vpinch = { d: Math.hypot(a.sx - b.sx, a.sy - b.sy), z: V.z, ox: V.ox, oy: V.oy, mx: (a.sx + b.sx) / 2, my: (a.sy + b.sy) / 2 };
        return;
      }
      if (P2.size > 1) return; drag = { p0: p, last: p, moved: false, cp: 0, t: performance.now(), ls: { x: p.sx, y: p.sy } };
      if (ST.tool === 'pen' || ST.tool === 'hl') { const hl = ST.tool === 'hl'; cur = { t: 's', c: hl ? ST.hc : ST.c, w: hl ? ST.hw : ST.w, hl, p: [p.x, p.y] }; if (!hl && ST.smooth) { cur.ink = 1; cur.m = [1]; } draw(); }
      else if (ST.tool === 'erase') eraseAt(p);
      else if (ST.tool === 'arrow') { cur = { t: 'a', x1: p.x, y1: p.y, x2: p.x, y2: p.y, c: ST.c, w: Math.max(4, ST.w), l: '' }; }
      else if (ST.tool === 'select') { const h = topAt(p.x, p.y); ST.sel = h; drag.item = h; ctxBar(); draw(); }
    });
    cv.addEventListener('pointermove', (e) => {
      if (!P2.has(e.pointerId)) return; const p = pos(e); P2.set(e.pointerId, p);
      if (vpinch && P2.size === 2) { const [a, b] = [...P2.values()], d = Math.hypot(a.sx - b.sx, a.sy - b.sy), mx = (a.sx + b.sx) / 2, my = (a.sy + b.sy) / 2, nz = Math.max(1, Math.min(5, vpinch.z * d / Math.max(8, vpinch.d))), px = (vpinch.mx - vpinch.ox) / vpinch.z, py = (vpinch.my - vpinch.oy) / vpinch.z; V.z = nz; V.ox = mx - px * nz; V.oy = my - py * nz; clampView(); draw(); return; }
      if (pinch && P2.size === 2 && ST.sel) { const [a, b] = [...P2.values()], d = Math.hypot(a.x - b.x, a.y - b.y), an = Math.atan2(b.y - a.y, b.x - a.x); if (pinch.d > 5 && d > 5) scaleBy(ST.sel, d / pinch.d); rotBy(ST.sel, an - pinch.a); pinch = { d, a: an }; draw(); return; }
      if (!drag) return; const dx = p.x - drag.last.x, dy = p.y - drag.last.y; if (Math.hypot(p.x - drag.p0.x, p.y - drag.p0.y) > 4) drag.moved = true;
      if (ST.tool === 'hand') { V.ox += p.sx - drag.ls.x; V.oy += p.sy - drag.ls.y; clampView(); drag.ls = { x: p.sx, y: p.sy }; draw(); return; }
      if (cur && cur.t === 's') {
        const n = cur.p.length;
        if (Math.hypot(p.x - cur.p[n - 2], p.y - cur.p[n - 1]) > 2.5) {
          if (cur.m) { const now = performance.now(), sp = Math.hypot(p.x - cur.p[n - 2], p.y - cur.p[n - 1]) / Math.max(1, now - drag.t); cur.m.push(Math.max(0.55, Math.min(1.35, 1.4 - sp * 0.6))); drag.t = now; }
          cur.p.push(p.x, p.y); draw();
        }
      }
      else if (cur && cur.t === 'a') { cur.x2 = p.x; cur.y2 = p.y; draw(); }
      else if (ST.tool === 'erase') eraseAt(p);
      else if (ST.tool === 'select' && drag.item && drag.moved) { if (!drag.cp) { checkpoint(); drag.cp = 1; } moveBy(drag.item, dx, dy); draw(); }
      drag.last = p;
    });
    const end = (e) => {
      P2.delete(e.pointerId); if (vpinch) { if (P2.size < 2) vpinch = null; return; }
      if (pinch) { if (P2.size < 2) { pinch = null; save(); } return; }
      if (!drag) return; const d = drag; drag = null;
      if (cur && cur.t === 's') { if (cur.ink && cur.m) smoothStroke(cur, 2); checkpoint(); items().push(cur); cur = null; draw(); }
      else if (cur && cur.t === 'a') { const a = cur; cur = null; if (Math.hypot(a.x2 - a.x1, a.y2 - a.y1) > 24) { checkpoint(); items().push(a); ST.sel = a; ctxBar(); labelDialog(a); } draw(); }
      else if (ST.tool === 'text' && !d.moved) { const h = topAt(d.p0.x, d.p0.y); if (h && h.t === 't') { ST.sel = h; ctxBar(); textDialog(h); } else textDialog(null, d.p0); }
      else if (ST.tool === 'select' && d.item && d.moved) save();
      else if (ST.tool === 'select' && d.item && !d.moved && d.item.t === 't' && ST.lastTap === d.item && Date.now() - ST.lastAt < 450) textDialog(d.item);
      if (ST.tool === 'select') { ST.lastTap = d.item || null; ST.lastAt = Date.now(); }
    };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  }

  /* ───────── 3D part → transparent sticker ───────── */
  const getCam = () => { const k = A.cam; return { t: k.target.slice(), d: k.distGoal || k.dist, y: k.yaw, p: k.pitch }; };
  function setCam(c) { const k = A.cam; k.goal = null; k.target = c.t.slice(); k.dist = k.distGoal = c.d; k.yaw = c.y; k.pitch = c.p; k.vy = k.vp = 0; A.redraw(); }
  function startPick(rep) {
    PICK.rep = rep || null; ov.hidden = true; document.body.classList.remove('nbopen'); let pill = $('nbPick');
    if (!pill) { pill = document.createElement('div'); pill.id = 'nbPick'; document.body.appendChild(pill); pill.addEventListener('click', (e) => { const b = e.target.closest('[data-nbp]'); if (!b) return; if (b.dataset.nbp === 'ok') capture(); else endPick(); }); }
    pill.innerHTML = `<button data-nbp="ok">📓 ${PICK.rep ? T('Update the picture', 'حدّث الصورة') : T('Put it in the notebook', 'حطّها في الدفتر')}</button><button data-nbp="no" class="x">✕</button><small>${T('Zoom in on the part first', 'قرّب الجزء الأول')}</small>`; pill.hidden = false;
    if (A.closeModal) A.closeModal();
    if (rep && rep.cam) (async () => { try { if (rep.pi >= 0 && P[rep.pi]) await A.select(rep.pi, { fly: false, noPanel: true }); } catch (e) { /* ignore */ } setCam(rep.cam); })();
  }
  function endPick() { PICK.rep = null; const p = $('nbPick'); if (p) p.hidden = true; ov.hidden = false; document.body.classList.add('nbopen'); fit(); }
  function capture() {
    const e = S.sel >= 0 ? P[S.sel] : null, keep = { iso: S.iso, sel: S.sel, hl: S.hl }, camNow = getCam(), piNow = e ? e.i : -1; let out = null;
    try {
      keep.qo = S.quizOnly; keep.focus = S.focus; keep.nf = A.R.noFloor; S.quizOnly = e ? (x) => x.i === e.i : keep.qo; S.focus = null; S.sel = -1; S.hl = null; A.R.noFloor = true;
      A.apply(); A.R.draw(A.cam); if (A.afterDraw) A.afterDraw();
      const gl = $('gl'), c = document.createElement('canvas'); c.width = gl.width; c.height = gl.height; const x = c.getContext('2d'); x.drawImage(gl, 0, 0);
      const d = x.getImageData(0, 0, c.width, c.height).data; let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
      for (let y = 0; y < c.height; y++) for (let xx = 0; xx < c.width; xx++) if (d[(y * c.width + xx) * 4 + 3] > 10) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (x1 > x0 && y1 > y0) {
        const w = x1 - x0 + 1, h = y1 - y0 + 1, s = Math.min(1, 900 / Math.max(w, h)), o = document.createElement('canvas'); o.width = Math.max(1, Math.round(w * s)); o.height = Math.max(1, Math.round(h * s));
        o.getContext('2d').drawImage(c, x0, y0, w, h, 0, 0, o.width, o.height); out = { url: o.toDataURL('image/png'), w: o.width, h: o.height };
      }
    } catch (err) { out = null; }
    S.iso = keep.iso; S.sel = keep.sel; S.hl = keep.hl; S.quizOnly = keep.qo; S.focus = keep.focus; A.R.noFloor = keep.nf; A.apply();
    if (!out) { A.toast(T('Nothing visible to capture', 'مفيش حاجة ظاهرة تتصوّر')); return; }
    if (PICK.rep && items().includes(PICK.rep)) { checkpoint(); const r0 = PICK.rep; const nid = uid(); NB.imgs[nid] = out.url; r0.im = nid; r0.cam = camNow; r0.pi = piNow; ST.sel = r0; endPick(); sheet(''); ctxBar(); toolbar(); draw(); save(); A.toast(T('Picture updated ✓', 'اتحدّثت الصورة ✓')); return; }
    const id = uid(); NB.imgs[id] = out.url; const wd = Math.min(380, Math.max(160, out.w * 0.5)); checkpoint();
    const it = { t: 'i', im: id, x: PW / 2, y: PH / 2, w: wd, sc: 1, r: 0, sh: 1, cam: camNow, pi: piNow }; items().push(it); ST.sel = it; ST.tool = 'select';
    endPick(); sheet(''); ctxBar(); toolbar(); draw(); save(); A.toast(T('Added to the page ✓', 'اتضافت للصفحة ✓'));
  }

  /* ───────── export ───────── */
  function exportSheet() { sheet(''); const el = $('nbSheet'); ST.sheet = 'export'; el.hidden = false; el.innerHTML = `<button class="nb-x" data-nb="sheet:">✕</button><h4>⬇️ ${T('Save / share', 'حفظ ومشاركة')}</h4><div class="nb-row"><button class="on" data-nb="pdfall">📄 ${T('Whole notebook (PDF)', 'الدفتر كله PDF')}</button><button data-nb="pdfone">📄 ${T('This page (PDF)', 'الصفحة دي PDF')}</button><button data-nb="img">🖼️ ${T('This page (image)', 'الصفحة دي صورة')}</button></div>`; }
  function renderCanvas(pg) { const c = document.createElement('canvas'); c.width = 1240; c.height = Math.round(1240 * PH / PW); const x = c.getContext('2d'); x.scale(c.width / PW, c.width / PW); renderTo(x, pg); return c; }
  const fname = () => ((BOOK && BOOK.title) || 'notebook').replace(/[\\/:*?"<>|]+/g, '-').trim() || 'notebook';
  const toBlob = (c, type, q) => new Promise((res) => c.toBlob((b) => res(b), type, q));
  async function preload() { const need = []; for (const pg of NB.pages) for (const it of pg.items) if (it.t === 'k' || it.t === 'i') need.push(getImg(srcOf(it))); await Promise.all(need.map((im) => (im.complete && im.naturalWidth ? 0 : new Promise((r) => { im.addEventListener('load', r, { once: true }); im.addEventListener('error', r, { once: true }); })))); }
  function makePdf(list) {
    const enc = new TextEncoder(), parts = [], offs = []; let len = 0; const n = list.length;
    const push = (v) => { const u = typeof v === 'string' ? enc.encode(v) : v; parts.push(u); len += u.length; };
    const obj = (id, body, stream) => { offs[id] = len; push(`${id} 0 obj\n${body}\n`); if (stream) { push('stream\n'); push(stream); push('\nendstream\n'); } push('endobj\n'); };
    push('%PDF-1.4\n'); obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
    obj(2, `<< /Type /Pages /Kids [${list.map((_, i) => `${3 + 3 * i} 0 R`).join(' ')}] /Count ${n} >>`);
    const MH = Math.round(595 * PH / PW);
    list.forEach((p, i) => { const b = 3 + 3 * i; obj(b, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 ${MH}] /Resources << /XObject << /Im0 ${b + 1} 0 R >> >> /Contents ${b + 2} 0 R >>`);
      obj(b + 1, `<< /Type /XObject /Subtype /Image /Width ${p.w} /Height ${p.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpg.length} >>`, p.jpg);
      const cs = enc.encode(`q 595 0 0 ${MH} 0 0 cm /Im0 Do Q`); obj(b + 2, `<< /Length ${cs.length} >>`, cs); });
    const total = 3 + 3 * n, xr = len; let tab = `xref\n0 ${total}\n0000000000 65535 f \n`; for (let i = 1; i < total; i++) tab += String(offs[i]).padStart(10, '0') + ' 00000 n \n';
    push(tab + `trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xr}\n%%EOF`); return new Blob(parts, { type: 'application/pdf' });
  }
  async function exportPdf(all) {
    A.toast(T('Preparing…', 'بجهّز الملف…'), 2500);
    try {
      await preload(); const list = [];
      for (const pg of all ? NB.pages : [page()]) { const c = renderCanvas(pg), b = await toBlob(c, 'image/jpeg', 0.9); list.push({ jpg: new Uint8Array(await b.arrayBuffer()), w: c.width, h: c.height }); }
      const pdf = makePdf(list); A.fileOut(pdf, fname() + '.pdf', 'application/pdf', { text: T('My Anatovia notebook', 'دفتري في Anatovia'), head: T('📄 Notebook PDF', '📄 دفتر المذاكرة PDF') });
    } catch (err) { A.toast(T('Could not create the file', 'تعذّر إنشاء الملف')); }
  }
  async function exportImg() {
    try { await preload(); const b = await toBlob(renderCanvas(page()), 'image/jpeg', 0.92); A.fileOut(b, fname() + '-' + (NB.cur + 1) + '.jpg', 'image/jpeg', { text: T('My Anatovia notes', 'ملاحظاتي في Anatovia'), head: T('🖼️ Page image', '🖼️ صورة الصفحة') }); }
    catch (err) { A.toast(T('Could not create the file', 'تعذّر إنشاء الملف')); }
  }

  /* ───────── open / close ───────── */
  function loadBono() { if (window.BONO) return Promise.resolve(); if (bonoReady) return bonoReady; bonoReady = new Promise((res) => { const s = document.createElement('script'); s.src = 'bono.js'; s.onload = res; s.onerror = res; document.body.appendChild(s); }); return bonoReady; }
  async function open() {
    if (A.closeModal) A.closeModal();
    await loadBono(); if (!window.BONO) { A.toast(T('Could not load the stickers', 'تعذّر تحميل الستيكرات')); return; }
    await loadLib(); if (!ov) shell();
    ov.hidden = false; ov.dir = ar() ? 'rtl' : 'ltr'; document.body.classList.add('nbopen'); ST.sel = null;
    if (!LIB.books.length) { const m = await newBook(T('My notebook', 'دفتري')); await openBook(m.id); }
    else if (LIB.books.length === 1) await openBook(LIB.books[0].id);
    else { ov.classList.add('lib'); renderLib(); }
    if (!Store.d.nbHint) { Store.d.nbHint = 1; Store.save(); A.toast(T('Tip: tap 📚 to keep several separate notebooks', 'نصيحة: دوس 📚 عشان تعمل أكتر من دفتر منفصل'), 5000); }
  }
  function close() { if (!ov) return; ov.hidden = true; document.body.classList.remove('nbopen'); flush(); }
  Object.assign(STR, { nb: { en: 'Bono\'s notebook', ar: 'دفتر بونو' }, nbSub: { en: 'Write, draw, add stickers & 3D parts, save as PDF', ar: 'اكتب وارسم وضيف ستيكرات وأجزاء من المجسم واحفظ PDF' } });
  A.hubExtra = A.hubExtra || {}; A.hubExtra.nb = open;
  A.nbApi = { open, get NB() { return NB; }, get ST() { return ST; }, get LIB() { return LIB; } };
})();
