/* app.js — 3D viewer, layers, selection, info panel, search. Study features live in study.js. */
'use strict';
const A = { acts: {} };
const $ = (id) => document.getElementById(id);
const P = window.CATALOG;
const PACK_OF = { bone: ['bones', 'teeth'], muscle: ['muscles'], vessel: ['vessels'], nerve: ['nerves'], brain: ['brain'], organ: ['organs'], ligament: ['ligaments'] };
const S = {
  lang: 'ar', theme: 'dark',
  layers: { bone: 'on', muscle: 'off', vessel: 'off', nerve: 'off', brain: 'off', organ: 'off', ligament: 'off' },
  region: null, hidden: new Set(), hideStack: [], sel: -1, iso: -1, explode: 0, pulled: new Set(),
  hl: null, moveSet: null, moveId: null, quiz: null, loaded: {}, spin: false,
};
A.S = S; A.P = P; A.$ = $;
const REGION_VIEW = {
  head: [[0, 1.58, 0.02], 0.85], neck: [[0, 1.46, 0], 0.95], spine: [[0, 1.05, -0.02], 2.3], thorax: [[0, 1.3, 0], 1.55],
  abdomen: [[0, 1.08, 0], 1.45], pelvis: [[0, 0.9, 0], 1.35], upper: [[0, 1.2, 0], 2.9], lower: [[0, 0.5, 0], 2.9],
};
const t = (k) => (STR[k] ? STR[k][S.lang] : k);
const L = (pair) => (pair ? pair[S.lang === 'ar' ? 1 : 0] : '');
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
A.t = t; A.L = L; A.esc = esc;

/* ───────── catalog preparation ───────── */
const SIDE_RE_EN = / – (right|left)$/;
const SIDE_RE_AR = / (الأيمن|الأيسر|اليمنى|اليسرى)$/;
P.forEach((e, i) => {
  e.i = i;
  e.baseEn = e.en.replace(SIDE_RE_EN, ''); e.baseAr = e.ar.replace(SIDE_RE_AR, '');
  e.q = norm(e.en + ' ' + e.ar + ' ' + (e.reg || ''));
  e.h = (i * 2654435761 % 1000) / 1000;
});
const name1 = (e) => (S.lang === 'ar' ? e.ar : e.en);
const name2 = (e) => (S.lang === 'ar' ? e.en : e.ar);
const base1 = (e) => (S.lang === 'ar' ? e.baseAr : e.baseEn);
A.name1 = name1; A.name2 = name2; A.base1 = base1;

function colorFor(e) {
  const h = e.h;
  switch (e.k) {
    case 'bone': return [0.93 - h * 0.04, 0.89 - h * 0.04, 0.79 - h * 0.05];
    case 'cart': return [0.56, 0.80, 0.92];
    case 'disc': return [0.36 + h * 0.08, 0.64, 0.82];
    case 'tendon': return [0.96, 0.94, 0.84];
    case 'lig': return [0.62 + h * 0.1, 0.86, 0.40 + h * 0.08];
    case 'capsule': return [0.55, 0.80, 0.88];
    case 'fibro': return [0.30 + h * 0.08, 0.66, 0.84];
    case 'retin': return [0.98, 0.93, 0.70];
    case 'bursa': return [0.78, 0.55, 0.90];
    case 'muscle': return [Math.min(1, 0.70 + h * 0.20), 0.18 + h * 0.14, 0.17 + h * 0.08];
    case 'artery': return /pulmonary|of (left|right) lung|lingular/i.test(e.grp || '') ? [0.24, 0.36, 0.86] : [0.90, 0.13, 0.17];
    case 'vein': return /pulmonary|of (left|right) lung|lingular/i.test(e.grp || '') ? [0.92, 0.18, 0.20] : [0.20, 0.33, 0.84];
    case 'nerve': return /spinal cord|cauda/i.test(e.grp || '') ? [0.96, 0.93, 0.80] : [0.98, 0.86, 0.22];
    case 'tooth': return [0.97 - h * 0.03, 0.96 - h * 0.03, 0.90 - h * 0.04];
    case 'brain': {
      const g = e.grp || '';
      if (A.brainColor) { const c = A.brainColor(e); if (c) return c; }
      if (/ventricle|choroid/i.test(g)) return [0.35, 0.62, 0.90];
      if (/corpus callosum|fornix|commissure|stria|optic|peduncle|pyramid|septum/i.test(g)) return [0.95, 0.92, 0.86];
      if (/lobule|vermis|culmen|declive|central lobule|lingula|flocculus|tonsil/i.test(g)) return [0.86 + h * 0.04, 0.68, 0.46];
      if (/midbrain|pons|medulla|olive|colliculus|red nucleus/i.test(g)) return [0.90, 0.80, 0.52];
      if (/thalamus|caudate|putamen|globus|lentiform|hippocampus|amygdala|hypothalamus|mamillary|habenula|geniculate|septal/i.test(g)) return [0.78 + h * 0.06, 0.50, 0.58];
      return [0.88 + h * 0.05, 0.64 + h * 0.06, 0.64 + h * 0.04];
    }
    default: {
      const g = e.grp || '';
      if (/sclera|cornea|vitreous/.test(g)) return [0.96, 0.96, 0.98];
      if (/iris/.test(g)) return [0.42, 0.55, 0.70];
      if (/lens/.test(g)) return [0.90, 0.95, 1.0];
      if (/retina/.test(g)) return [0.86, 0.52, 0.44];
      if (/eyeball/.test(g)) return [0.96, 0.96, 0.98];
      if (/thyroid/.test(g)) return [0.78, 0.40, 0.36];
      if (/parathyroid|pineal|pituitary|adenohypo|neurohypo/.test(g)) return [0.95, 0.80, 0.55];
      if (/tongue|uvula|palate|gingiva|pharynx|nasal cavity|epiglottis/.test(g)) return [0.88, 0.48, 0.46];
      if (/parotid|sublingual|submandibular/.test(g)) return [0.94, 0.78, 0.46];
      if (/thymus/.test(g)) return [0.92, 0.80, 0.62];
      if (/omentum|mesocolon|meso-appendix/.test(g)) return [0.96, 0.86, 0.50];
      if (/testis|epididym|deferens|seminal|prostate|ejaculatory|penis|corpus/.test(g)) return [0.86, 0.60, 0.56];
      if (/ureter|renal pelvis|urethra/.test(g)) return [0.92, 0.80, 0.42];
      if (/papillary/.test(g)) return [0.70, 0.26, 0.28];
      if (/atrium|ventricle/.test(g)) return [0.74, 0.18, 0.24];
      if (/pituitary/.test(g)) return [0.95, 0.80, 0.55];
      if (/lung|bronch|trachea/.test(g)) return [0.93, 0.62, 0.66];
      if (/heart|valve/.test(g)) return [0.78, 0.20, 0.26];
      if (/liver/.test(g)) return [0.52 + (e.h * 0.1), 0.22, 0.14];
      if (/kidney|adrenal|suprarenal/.test(g)) return [0.62, 0.22, 0.20];
      if (/spleen/.test(g)) return [0.52, 0.22, 0.40];
      if (/gallbladder/.test(g)) return [0.42, 0.62, 0.30];
      if (/bladder/.test(g)) return [0.92, 0.80, 0.42];
      if (/stomach|duoden|jejun|small intestine|ileum|colon|rectum|appendix|esoph|pancreas|taenia|bile duct/.test(g)) return [0.90, 0.58, 0.48];
      return [0.92, 0.74, 0.46];
    }
  }
}

/* ───────── renderer / camera ───────── */
let R, cam, itemOf = new Array(P.length).fill(null);
let raf = 0, lastT = 0;
function requestRender() { if (!raf) { lastT = performance.now(); raf = requestAnimationFrame(frame); } }
function frame(now) {
  raf = 0;
  const dt = Math.max(0.001, Math.min(0.05, (now - lastT) / 1000)); lastT = now;
  const m1 = cam.update(dt), m2 = R.animate(dt);
  R.draw(cam);
  if (A.afterDraw) A.afterDraw();
  if (m1 || m2 || cam.dragging) requestRender();
}
A.redraw = () => { requestRender(); };

async function ensure(sys) {
  if (S.loaded[sys]) return;
  const pks = PACK_OF[sys];
  S.loaded[sys] = 'loading';
  if (!$('loading').classList.contains('done')) $('loadMsg').textContent = t('loading'); else toast(t('loadingSys'), 8000);
  for (const pk of pks) {
    const bytes = await Packs.load(pk);
    for (const e of P) {
      if (e.pk !== pk) continue;
      const it = R.addPacked(Packs.part(bytes, e.o), e.id, e.i);
      it.color = colorFor(e); itemOf[e.i] = it;
      if (e.rt) it.root = { n: e.rt.slice(0, 3), d: e.rt[3], col: [0.93, 0.86, 0.68] };
    }
  }
  S.loaded[sys] = true; hideToast();
  applyState(true);
}
A.ensure = ensure;

function explodeOffset(e) {
  const k = S.explode, c = e.c; let o = [0, 0, 0];
  if (k > 0) {
    const jit = (e.h - 0.5);
    o = [c[0] * 1.15 * k + jit * 0.04 * k, (c[1] - 0.9) * 0.42 * k, (c[2] + 0.04) * 1.7 * k + 0.04 * k * Math.sin(e.i)];
    if (Math.abs(c[0]) < 0.05 && (e.reg === 'spine' || e.reg === 'thorax')) o[2] -= 0.12 * k;
  }
  if (S.pulled.has(e.i)) {
    const d = V3.norm([c[0] * 1.0, 0.05, c[2] + 0.25]);
    o = V3.add(o, V3.mul(d, 0.35));
  }
  return o;
}

/** push state (layers, filters, selection, explode) into the GPU items */
function applyState(noRender) {
  const GH = 0.13;
  const ms = S.moveSet;
  for (const e of P) {
    const it = itemOf[e.i]; if (!it) continue;
    const mode = S.layers[e.sys];
    let vis = mode !== 'off' && !S.hidden.has(e.i), alpha = 1, pick = true;
    if (e.lk && !(A.isPremium && A.isPremium())) vis = false;   // Premium-only structures stay hidden for free users
    if (vis) {
      if (mode === 'ghost') { alpha = GH; pick = false; }
      else if (e.sys === 'organ' && /omentum|mesocolon|meso-appendix|^pleura/.test(e.grp || '') && e.i !== S.sel) { alpha = 0.32; pick = false; } // see-through peritoneal sheets
      if (S.region && e.reg !== S.region) { alpha = Math.min(alpha, GH); pick = false; }
      if (S.iso >= 0 && e.i !== S.iso) { alpha = Math.min(alpha, 0.08); pick = false; }
      if (ms && e.sys === 'muscle') {
        if (ms.has(e.grp)) { alpha = 1; pick = true; } else { alpha = Math.min(alpha, 0.07); pick = false; }
      }
      if (S.sel >= 0 && P[S.sel] && P[S.sel].sys === 'nerve' && e.sys === 'nerve' && e.i !== S.sel && alpha > 0.4) alpha = 0.4;
      if (S.focus && !S.focus.has(e.i)) { alpha = Math.min(alpha, e.sys === 'bone' ? 0.16 : 0.05); pick = false; }
      if (S.quizOnly && !S.quizOnly(e)) { vis = false; }
      if (e.k === 'tooth' && !!e.dec !== (S.dent === 'dec') && e.i !== S.sel && !(S.hl && S.hl.has(e.i)) && !(S.focus && S.focus.has(e.i))) vis = false;   // permanent / deciduous dentition toggle
    }
    it.visible = vis; it.alpha = alpha; it.pickable = vis && pick && alpha > 0.5;
    let tint = [0, 0, 0, 0];
    if (e.i === S.sel) tint = (e.sys === 'nerve' || e.sys === 'brain') ? [0.0, 0.95, 1.0, 0.92] : [1, 0.78, 0.18, 0.75];
    else if (S.hl && S.hl.has(e.i)) tint = S.hl.get(e.i);
    else if (ms && e.sys === 'muscle' && ms.has(e.grp)) tint = [1, 0.74, 0.15, 0.55];
    it.tint = tint;
    it.goalOff = explodeOffset(e);
  }
  renderChips();
  if (!noRender) requestRender(); else requestRender();
}
A.apply = applyState;

/* ───────── camera helpers ───────── */
function partCenter(e) { const it = itemOf[e.i]; const o = it ? it.goalOff : [0, 0, 0]; return [e.c[0] + o[0], Math.max(0.05, e.c[1] + o[1]), e.c[2] + o[2]]; }
function flyToPart(e) {
  const d = Math.max(0.5, Math.min(3.4, e.r * 5.2 + 0.32));
  cam.flyTo(partCenter(e), d, null, cam.pitch < 0 ? cam.pitch : Math.max(cam.pitch, 0.1)); requestRender();
}
A.flyToPart = flyToPart;
function flyRegion(reg) {
  if (!reg) { cam.reset(); requestRender(); return; }
  const v = REGION_VIEW[reg]; cam.flyTo(v[0].slice(), v[1], null, 0.12); requestRender();
}
A.flyRegion = flyRegion;

/* ───────── selection & panel ───────── */
async function reveal(e) {
  if (S.layers[e.sys] !== 'on') S.layers[e.sys] = 'on';
  await ensure(e.sys);
  S.hidden.delete(e.i);
  if (S.region && e.reg !== S.region) S.region = null;
  if (S.iso >= 0 && S.iso !== e.i) S.iso = -1;
}
A.reveal = reveal;
async function select(i, opts = {}) {
  const e = P[i]; if (!e) return;
  if (e.lk && !(A.isPremium && A.isPremium())) { if (A.paywall) A.paywall('This structure is part of Premium (vessels, nerves, brain, organs, ligaments and small muscles).', 'التركيب ده ضمن النسخة المميزة (الأوعية والأعصاب والمخ والأعضاء والأربطة والعضلات الصغيرة).'); return; }
  if (opts.reveal !== false) await reveal(e);
  S.sel = i; Store.touchDay();
  if (e.k === 'tooth') S.dent = e.dec ? 'dec' : 'perm';
  applyState();
  if (opts.fly !== false) flyToPart(e);
  if (!opts.noPanel) openPanel();
}
function deselect() { S.sel = -1; closePanel(); applyState(); }
A.select = select; A.deselect = deselect;

function openPanel() { document.getElementById('app').classList.add('psel'); renderPanel(); $('panel').classList.remove('closed', 'peek'); $('panel').classList.add('peek'); if (innerWidth < 900) $('panel').classList.remove('peek'); $('panelBody').scrollTop = 0; }
function closePanel() { document.getElementById('app').classList.remove('psel'); $('panel').classList.add('closed'); $('panel').classList.remove('peek'); }
function fact(label, text) { return text ? `<div><b>${esc(label)}</b>${esc(text)}</div>` : ''; }
function renderPanel() {
  const e = P[S.sel]; if (!e) return;
  const st = Store.d, id = e.id;
  const tags = [`<span class="tag k">${t('kind_' + e.k)}</span>`, `<span class="tag">${t(e.reg)}</span>`];
  if (e.side) tags.push(`<span class="tag">${t('side_' + e.side)}</span>`);
  if (e.ty) tags.push(`<span class="tag">${L(e.ty)}</span>`);
  let h = `<div class="pn-head"><h2 class="pn-title">${esc(name1(e))}</h2><p class="pn-sub">${esc(name2(e))}</p></div><div class="tags">${tags.join('')}</div>`;
  h += `<div class="actions">
    ${A.speakBtn ? A.speakBtn(e) : ''}<button class="act ${st.learned[id] ? 'on' : ''}" data-act="learn">✓ ${t('learned')}</button>
    <button class="act gold ${st.fav[id] ? 'on' : ''}" data-act="fav">★ ${t('fav')}</button>
    <button class="act" data-act="hide">🙈 ${t('hidePart')}</button>
    <button class="act ${S.iso === e.i ? 'on' : ''}" data-act="iso">◎ ${t('isolate')}</button>
    <button class="act ${S.pulled.has(e.i) ? 'on' : ''}" data-act="pull">⇱ ${S.pulled.has(e.i) ? t('putBack') : t('pullOut')}</button></div>`;
  if (e.sum) h += `<p class="pn-sum">${esc(L(e.sum))}</p>`;
  if (e.mu) {
    const m = e.mu;
    h += `<div class="mu">${fact(t('origin'), L([m[0], m[1]]))}${fact(t('insertion'), L([m[2], m[3]]))}${fact(t('action'), L([m[4], m[5]]))}${fact(t('nerve'), L([m[6], m[7]]))}</div>`;
    if (e.mv) {
      h += `<h4>${t('actsIn')}</h4><div class="pills">` + e.mv.map((id2) => { const mv = MOVES.find((x) => x.id === id2); return mv ? `<span class="pill2" data-act="move" data-id="${id2}">${esc(S.lang === 'ar' ? mv.ar : mv.en)}</span>` : ''; }).join('') + '</div>';
    }
  }
  if (e.facts && e.facts.length) h += `<h4>${t('keyFacts')}</h4><ul class="facts">${e.facts.map((f) => `<li>${esc(L(f))}</li>`).join('')}</ul>`;
  if (e.pt) h += `<h4>${t('ptNote')}</h4><div class="pt">${esc(L(e.pt))}</div>`;
  // related parts: opposite side and sibling heads/parts
  const rel = P.filter((x) => x.i !== e.i && x.grp === e.grp && (x.side !== e.side || x.baseEn !== e.baseEn) && (x.sys === e.sys)).slice(0, 10);
  if (rel.length) h += `<h4>${S.lang === 'ar' ? 'أجزاء مرتبطة' : 'Related parts'}</h4><div class="pills">${rel.map((x) => `<span class="pill2" data-act="goto" data-i="${x.i}">${esc(name1(x))}</span>`).join('')}</div>`;
  if (A.panelExtra) h += A.panelExtra(e);
  h += `<h4>${t('notes')}</h4><textarea class="note" id="noteBox" placeholder="${esc(t('notePh'))}">${esc(st.notes[id] || '')}</textarea>`;
  $('panelBody').innerHTML = h;
  const nb = $('noteBox');
  if (nb) nb.addEventListener('input', () => { const s = Store.d; if (nb.value.trim()) s.notes[id] = nb.value; else delete s.notes[id]; Store.save(); });
}
A.renderPanel = renderPanel;

A.acts.learn = () => { const s = Store.d, id = P[S.sel].id; if (s.learned[id]) delete s.learned[id]; else s.learned[id] = 1; Store.save(); Store.touchDay(); renderPanel(); };
A.acts.fav = () => { const s = Store.d, id = P[S.sel].id; if (s.fav[id]) delete s.fav[id]; else s.fav[id] = 1; Store.save(); renderPanel(); };
A.acts.hide = () => { const i = S.sel; S.hidden.add(i); S.hideStack.push(i); S.sel = -1; closePanel(); applyState(); toast(S.lang === 'ar' ? 'تم الإخفاء — اضغط «تراجع» لإرجاعها' : 'Hidden — tap Undo to bring it back'); };
A.acts.dent = () => { S.dent = S.dent === 'dec' ? 'perm' : 'dec'; if (S.sel >= 0 && P[S.sel] && P[S.sel].k === 'tooth' && !!P[S.sel].dec !== (S.dent === 'dec')) { S.sel = -1; closePanel(); } applyState(); toast(S.dent === 'dec' ? t('dentDecTip') : t('dentPermTip')); };
A.acts.iso = () => { S.iso = S.iso === S.sel ? -1 : S.sel; applyState(); renderPanel(); };
A.acts.pull = () => { const i = S.sel; if (S.pulled.has(i)) S.pulled.delete(i); else S.pulled.add(i); applyState(); flyToPart(P[i]); renderPanel(); };
A.acts.goto = (el) => select(+el.dataset.i);
A.acts.move = (el) => { if (A.startMove) A.startMove(el.dataset.id); };

/* ───────── chips (layers + tools) ───────── */
const ICON = {
  regions: '<svg viewBox="0 0 24 24" class="ico"><circle cx="12" cy="5" r="2.5"/><path d="M12 8v7m-4-5h8M9 22l3-7 3 7"/></svg>',
  explode: '<svg viewBox="0 0 24 24" class="ico"><path d="M12 9V3m0 0l-2.5 2.5M12 3l2.5 2.5M12 15v6m0 0l-2.5-2.5M12 21l2.5-2.5M9 12H3m0 0l2.5-2.5M3 12l2.5 2.5M15 12h6m0 0l-2.5-2.5M21 12l-2.5 2.5"/></svg>',
  undo: '<svg viewBox="0 0 24 24" class="ico"><path d="M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3"/></svg>',
  all: '<svg viewBox="0 0 24 24" class="ico"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  spin: '<svg viewBox="0 0 24 24" class="ico"><path d="M20 12a8 8 0 1 1-2.5-5.8M20 4v5h-5"/></svg>',
  reset: '<svg viewBox="0 0 24 24" class="ico"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4.5v4h4"/></svg>',
};
const SYSICO = {
  bone: 'M6.5 3.5a2.5 2.5 0 0 1 3.5 3l7.5 7.5a2.5 2.5 0 1 1-3.5 3.5L6.5 10a2.5 2.5 0 0 1 0-6.5z', muscle: 'M3 12c4-6 14-6 18 0-4 6-14 6-18 0z',
  vessel: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z', nerve: 'M12 21V11M12 11L6 5M12 11l6-6M12 16l-4-3',
  brain: 'M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 3 3 3 0 0 0 1 5 3 3 0 0 0 4 4 3 3 0 0 0 3-1V5a2 2 0 0 0-3-1zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 3 3 3 0 0 1-1 5 3 3 0 0 1-4 4V5',
  organ: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.5-7 10-7 10z', ligament: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
};
const SHORT = { ligament: { en: 'Ligaments', ar: 'الأربطة' } };
const MORE_ICO = '<svg viewBox="0 0 24 24" class="ico"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>';
function renderChips() {
  const nav = $('chips'), ar = S.lang === 'ar'; let h = '';
  const premium = A.isPremium && A.isPremium();
  /* layers dock (bottom) */
  h += '<div class="dock">';
  for (const s of SYSTEMS) {
    const lock = A.PAID_SYS && A.PAID_SYS.has(s) && !premium ? '<i>🔒</i>' : '';
    h += `<button class="dk c-${s}" data-act="layer" data-s="${s}" data-state="${S.layers[s]}"><svg viewBox="0 0 24 24"><path d="${SYSICO[s]}"/></svg><span>${SHORT[s] ? SHORT[s][ar ? 'ar' : 'en'] : t(s)}</span>${lock}</button>`;
  }
  h += '</div>';
  /* tools (side) */
  const tl = (act, icon, label, on) => `<button class="tl ${on ? 'on' : ''}" data-act="${act}" title="${label}" aria-label="${label}">${icon}</button>`;
  h += '<div class="tools">';
  h += tl('regions', ICON.regions, S.region ? t(S.region) : t('regions'), !!S.region);
  h += tl('explode', ICON.explode, t('explode'), S.explode > 0);
  if (S.layers.bone !== 'off') h += tl('dent', '<svg viewBox="0 0 24 24" class="ico"><path d="M12 5.5C10.5 4 8.5 3.5 7 4.2 4.8 5.2 4.5 8 5.5 10.5c.8 2 .8 4 1.2 6.5.3 1.7 1.2 3 2.1 3 1.2 0 1.3-3.2 1.7-4.4.3-.8 1.6-.8 1.9 0 .4 1.2.5 4.4 1.7 4.4.9 0 1.8-1.3 2.1-3 .4-2.5.4-4.5 1.2-6.5C19.5 8 19.2 5.2 17 4.2c-1.5-.7-3.5-.2-5 1.3z"/></svg>', S.dent === 'dec' ? t('dentDec') : t('dentPerm'), S.dent === 'dec');
  h += tl('spin', ICON.spin, t('spin'), !!S.spin);
  h += tl('resetview', ICON.reset, t('resetView'), false);
  if (S.hideStack.length) h += tl('undo', ICON.undo, t('undo'), false);
  if (S.hidden.size || S.iso >= 0 || S.region || S.pulled.size || S.moveSet || S.focus || S.cutOn || S.fnOn) h += tl('showall', ICON.all, t('showAll'), false);
  const extra = A.extraChips ? A.extraChips() : '';
  if (extra) h += tl('more', MORE_ICO, ar ? 'المزيد' : 'More', !!S.moreOpen);
  h += '</div>';
  if (extra && S.moreOpen) h += `<div class="more">${extra}</div>`;
  nav.innerHTML = h;
}
document.addEventListener('click', (ev) => { if (S.moreOpen && ev.target.closest('.more .chip')) setTimeout(() => { S.moreOpen = false; renderChips(); }, 0); });
A.acts.more = () => { S.moreOpen = !S.moreOpen; renderChips(); };
A.acts.layer = async (el) => {
  const s = el.dataset.s, order = ['on', 'ghost', 'off'];
  if (A.PAID_SYS && A.PAID_SYS.has(s) && !(A.isPremium && A.isPremium()) && S.layers[s] === 'off') { A.paywall('Vessels, nerves, brain, organs and ligaments are part of Premium.', 'الأوعية والأعصاب والمخ والأعضاء والأربطة ضمن النسخة المميزة.'); return; }
  if (s === 'muscle' && S.layers[s] === 'off' && !(A.isPremium && A.isPremium()) && !Store.d.mwarn) { Store.d.mwarn = 1; Store.save(); A.toast(S.lang === 'ar' ? 'العضلات الصغيرة (الوجه واليد والقدم والعمود الفقري العميقة) للمشتركين' : 'Small muscles (face, hand, foot, deep spine) are Premium', 3500); }
  S.layers[s] = order[(order.indexOf(S.layers[s]) + 1) % 3];
  if (S.layers[s] !== 'off') await ensure(s);
  applyState();
};
A.acts.regions = () => A.openRegions();
A.acts.explode = () => { $('explodeBar').hidden = false; if (S.explode === 0) { S.explode = 0.6; $('explodeRange').value = 60; } applyState(); };
A.acts.undo = () => { const i = S.hideStack.pop(); S.hidden.delete(i); applyState(); };
A.acts.showall = () => { S.hidden.clear(); S.hideStack = []; S.iso = -1; S.region = null; S.pulled.clear(); S.explode = 0; $('explodeBar').hidden = true; A.clearMove && A.clearMove(true); if (A.onShowAll) A.onShowAll(); applyState(); };
A.acts.spin = () => { S.spin = !S.spin; cam.spin = S.spin; renderChips(); requestRender(); };
A.acts.resetview = () => {
  if (!S.quiz) {
    A.acts.showall();   // un-hide, un-isolate, un-explode, clear movement/focus/cut/function overlays
    for (const k of Object.keys(S.layers)) S.layers[k] = k === 'bone' ? 'on' : 'off';
    S.sel = -1; S.hl = null; S.focus = null; S.lm = false; S.lmSel = -1; S.moveSet = null;
    if (S.spin) { S.spin = false; cam.spin = false; }
    try { closePanel(); } catch (e) { /* panel not open */ }
    applyState(true); renderChips();
  }
  cam.reset(); requestRender();
};

/* ───────── modal ───────── */
A.modalFn = null;
A.modal = (fn) => { A.modalFn = fn; $('modalBody').innerHTML = fn(); $('modal').hidden = false; $('modal').querySelector('.modal-card').scrollTop = 0; };
A.rerenderModal = () => { if (A.modalFn && !$('modal').hidden) { const sc = $('modal').querySelector('.modal-card').scrollTop; $('modalBody').innerHTML = A.modalFn(); $('modal').querySelector('.modal-card').scrollTop = sc; } };
A.closeModal = () => { $('modal').hidden = true; A.modalFn = null; };
A.openRegions = () => A.modal(() => `<h2>${t('regions')}</h2><div class="row">` +
  `<button class="opt ${!S.region ? 'sel' : ''}" data-act="region" data-r="">${t('allBody')}</button>` +
  REGIONS.map((r) => `<button class="opt ${S.region === r ? 'sel' : ''}" data-act="region" data-r="${r}">${t(r)}</button>`).join('') + '</div>');
A.acts.region = (el) => { S.region = el.dataset.r || null; A.closeModal(); applyState(); flyRegion(S.region); };

/* ───────── toast ───────── */
let toastTimer = 0;
function toast(msg, ms = 2600) { const el = $('toast'); el.textContent = msg; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, ms); }
function hideToast() { $('toast').hidden = true; }
A.toast = toast;

/* ───────── file out: always offer a real Download + a separate Share ───────── */
A.dl = (blob, name) => {
  const u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = name; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 8000);
  toast(S.lang === 'ar' ? 'تم التنزيل ✔' : 'Downloaded ✔');
};
A.shareFile = async (blob, name, type, text, title) => {
  const file = new File([blob], name, { type });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: title || 'Anatovia', text: text || '' }); return; }
  } catch (e) { if (e && e.name === 'AbortError') return; }
  A.dl(blob, name);
};
let FO = null;
A.fileOut = (blob, name, type, o) => {
  o = o || {}; FO = { blob, name, type, text: o.text || '', title: o.title }; const ar = S.lang === 'ar';
  const img = type.indexOf('image/') === 0; if (FO.url) URL.revokeObjectURL(FO.url); FO.url = img ? URL.createObjectURL(blob) : '';
  A.modal(() => `<h2>${o.head || (ar ? 'جاهز ✔' : 'Ready ✔')}</h2>` +
    (FO.url ? `<img src="${FO.url}" alt="" style="width:100%;max-height:52vh;object-fit:contain;border-radius:12px;border:1px solid var(--line);margin-bottom:12px">` : '') +
    `<div class="row"><button class="btn primary" data-act="fodl">⬇️ ${ar ? 'تنزيل على الجهاز' : 'Download'}</button><button class="btn" data-act="fosh">📤 ${ar ? 'مشاركة' : 'Share'}</button></div>`);
};
A.acts.fodl = () => { if (FO) A.dl(FO.blob, FO.name); };
A.acts.fosh = () => { if (FO) A.shareFile(FO.blob, FO.name, FO.type, FO.text, FO.title); };

/* ───────── search ───────── */
function search(q) {
  const n = norm(q.trim()); if (!n) return [];
  const toks = n.split(/\s+/);
  const out = [];
  for (const e of P) {
    if (!toks.every((tk) => e.q.includes(tk))) continue;
    const nm = norm(e.baseEn) + ' ' + norm(e.baseAr);
    const score = (nm.startsWith(n) || norm(e.baseAr).startsWith(n) ? 0 : nm.includes(n) ? 1 : 2) * 10 + (e.sys === 'bone' ? 0 : 1);
    out.push([score, e]);
  }
  out.sort((a, b) => a[0] - b[0] || a[1].en.length - b[1].en.length);
  return out.slice(0, 30).map((x) => x[1]);
}
function showResults(list) {
  const ul = $('results');
  if (!list.length) { ul.innerHTML = `<li><small>${t('noResults')}</small></li>`; ul.hidden = false; return; }
  ul.innerHTML = list.map((e, k) => `<li data-i="${e.i}" class="${k === 0 ? 'hl' : ''}"><span><b>${esc(name1(e))}</b><span class="sub">${esc(name2(e))}</span></span><small>${t('kind_' + e.k)}</small></li>`).join('');
  ul.hidden = false;
}
function bindSearch() {
  const q = $('q'), ul = $('results');
  q.addEventListener('input', () => { if (!q.value.trim()) { ul.hidden = true; return; } showResults(search(q.value)); });
  q.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { const li = ul.querySelector('li[data-i]'); if (li) pickResult(+li.dataset.i); } if (ev.key === 'Escape') { ul.hidden = true; q.blur(); } });
  ul.addEventListener('pointerdown', (ev) => { const li = ev.target.closest('li[data-i]'); if (li) { ev.preventDefault(); pickResult(+li.dataset.i); } });
  document.addEventListener('pointerdown', (ev) => { if (!ev.target.closest('.search')) ul.hidden = true; });
}
function pickResult(i) { $('results').hidden = true; $('q').value = ''; $('q').blur(); select(i); }

/* ───────── pointer interaction ───────── */
function bindPointer() {
  const cv = $('gl'), ptrs = new Map();
  let start = null, pinch = null, moved = false, tDown = 0;
  const pos = (ev) => { const r = cv.getBoundingClientRect(); return [ev.clientX - r.left, ev.clientY - r.top]; };
  cv.addEventListener('pointerdown', (ev) => {
    cv.setPointerCapture(ev.pointerId); ptrs.set(ev.pointerId, pos(ev)); cam.dragging = true; cam.vy = cam.vp = 0;
    if (ptrs.size === 1) { start = pos(ev); moved = false; tDown = performance.now(); }
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), m: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] }; moved = true; }
    $('hint').classList.add('off'); requestRender();
  });
  cv.addEventListener('pointermove', (ev) => {
    if (!ptrs.has(ev.pointerId)) return;
    const p = pos(ev), prev = ptrs.get(ev.pointerId); ptrs.set(ev.pointerId, p);
    if (ptrs.size === 1) {
      if (!moved && Math.hypot(p[0] - start[0], p[1] - start[1]) > 6) moved = true;
      if (moved) {
        const dx = p[0] - prev[0], dy = p[1] - prev[1];
        if (ev.shiftKey || ev.buttons === 2 || ev.buttons === 4) cam.pan(dx, dy, cv.clientHeight); else cam.orbit(dx, dy);
        requestRender();
      }
    } else if (ptrs.size === 2 && pinch) {
      const [a, b] = [...ptrs.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]), m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      if (d > 5 && pinch.d > 5) { cam.distGoal = Math.max(cam.minDist, Math.min(cam.maxDist, cam.distGoal * pinch.d / d)); cam.dist = cam.distGoal; }
      cam.pan(m[0] - pinch.m[0], m[1] - pinch.m[1], cv.clientHeight);
      pinch = { d, m }; requestRender();
    }
  });
  const up = (ev) => {
    if (!ptrs.has(ev.pointerId)) return;
    const wasOne = ptrs.size === 1; ptrs.delete(ev.pointerId);
    if (wasOne) {
      cam.dragging = false;
      if (!moved && performance.now() - tDown < 500 && ev.type === 'pointerup') tap(start[0], start[1]); else cam.release();
    }
    if (ptrs.size < 2) pinch = null;
    if (ptrs.size === 1) { start = [...ptrs.values()][0]; moved = true; }
    requestRender();
  };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('contextmenu', (e) => e.preventDefault());
  cv.addEventListener('wheel', (ev) => { ev.preventDefault(); cam.zoom(Math.exp(Math.max(-60, Math.min(60, ev.deltaY)) * 0.0014)); cam.dist = cam.distGoal * 0.5 + cam.dist * 0.5; requestRender(); }, { passive: false });
  cv.addEventListener('dblclick', (ev) => { const [x, y] = pos(ev); if (R.pick(cam, x, y) < 0) { cam.reset(); requestRender(); } });
  cv.addEventListener('keydown', (ev) => {
    const k = { ArrowLeft: [-18, 0], ArrowRight: [18, 0], ArrowUp: [0, 18], ArrowDown: [0, -18] }[ev.key];
    if (k) { cam.orbit(k[0], k[1]); requestRender(); ev.preventDefault(); }
    if (ev.key === '+' || ev.key === '=') { cam.zoom(0.85); requestRender(); } if (ev.key === '-') { cam.zoom(1.18); requestRender(); }
  });
}
function tap(x, y) {
  const idx = R.pick(cam, x, y);
  if (S.quiz && S.quiz.onTap) { S.quiz.onTap(idx, x, y); return; }
  if (A.onTap && A.onTap(x, y)) return;
  if (idx >= 0) select(idx, { fly: true }); else if (S.sel >= 0) deselect();
}

/* ───────── i18n / theme ───────── */
function applyLang() {
  document.documentElement.lang = S.lang; document.documentElement.dir = S.lang === 'ar' ? 'rtl' : 'ltr';
  $('q').placeholder = t('searchPh'); $('lblStudy').textContent = t('study'); $('btnLang').textContent = t('lang');
  $('hint').textContent = t('tapHint'); $('lblExplodeBar').textContent = t('explode'); document.title = 'Anatovia';
  renderChips(); if (S.sel >= 0) renderPanel(); A.rerenderModal(); A.onLang && A.onLang();
}
function applyTheme() {
  document.documentElement.dataset.theme = S.theme;
  const dark = S.theme === 'dark';
  R.floorCol = dark ? [0.17, 0.12, 0.09] : [0.85, 0.80, 0.73]; R.lineCol = dark ? [0.70, 0.60, 0.50] : [0.49, 0.35, 0.27];
  R.floorDark = dark ? 1 : 0.55; R.light = dark ? 1 : 0.5;
  const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = dark ? '#000B33' : '#F8F4EA';
  requestRender();
}

/* ───────── boot ───────── */
async function boot() {
  const st = Store.d; S.lang = st.lang || 'ar'; S.theme = st.theme || 'dark';
  try { R = new Renderer($('gl')); } catch (err) { $('loading').classList.add('done'); $('fatal').hidden = false; $('fatalMsg').textContent = STR.webgl.ar + ' / ' + STR.webgl.en; return; }
  cam = new OrbitCamera(); A.cam = cam; A.R = R;
  const view = $('view');
  const fit = () => { const w = view.clientWidth, h = view.clientHeight; if (!w || !h) return; R.resize(w, h, Math.min(2, window.devicePixelRatio || 1)); cam.aspect = w / h; requestRender(); };
  new ResizeObserver(fit).observe(view); fit();
  // phones in portrait: pull the camera back so the whole body fits
  const adjust = () => { const a = view.clientWidth / Math.max(1, view.clientHeight); cam.defaults.dist = a < 0.62 ? 3.9 : a < 1 ? 3.5 : 3.0; };
  adjust(); cam.dist = cam.distGoal = cam.defaults.dist; addEventListener('resize', adjust);
  applyTheme(); bindPointer(); bindSearch();
  document.body.addEventListener('click', (ev) => { const el = ev.target.closest('[data-act]'); if (el && A.acts[el.dataset.act]) A.acts[el.dataset.act](el, ev); });
  $('btnStudy').addEventListener('click', () => A.openHub && A.openHub());
  $('btnLang').addEventListener('click', () => { S.lang = S.lang === 'ar' ? 'en' : 'ar'; Store.d.lang = S.lang; Store.save(); applyLang(); });
  $('btnTheme').addEventListener('click', () => { S.theme = S.theme === 'dark' ? 'light' : 'dark'; Store.d.theme = S.theme; Store.save(); applyTheme(); });
  $('modalX').addEventListener('click', () => A.closeModal()); $('modal').addEventListener('pointerdown', (ev) => { if (ev.target === $('modal')) A.closeModal(); });
  $('panelClose').addEventListener('click', deselect);
  $('sheetHandle').addEventListener('click', () => $('panel').classList.toggle('peek'));
  $('explodeRange').addEventListener('input', (ev) => { S.explode = ev.target.value / 100; cam.goal = null; cam.distGoal = Math.max(cam.distGoal, cam.defaults.dist * (1 + 0.45 * S.explode)); applyState(); });
  $('explodeDone').addEventListener('click', () => { $('explodeBar').hidden = true; if (S.explode === 0) applyState(); });
  applyLang();
  try { await ensure('bone'); } catch (err) { $('loading').classList.add('done'); $('fatal').hidden = false; $('fatalMsg').textContent = 'Failed to load model: ' + err.message; return; }
  $('loading').classList.add('done');
  Store.touchDay();
  setTimeout(() => $('hint').classList.add('off'), 6000);
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); A.deferredPrompt = e; });
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    let want = false;
    navigator.serviceWorker.register('sw.js').then((reg) => {
      const bar = () => {
        if (!navigator.serviceWorker.controller || document.getElementById('updBar')) return;   // first install → nothing to update
        const ar = S.lang === 'ar', b = document.createElement('div'); b.id = 'updBar'; b.setAttribute('role', 'status');
        b.innerHTML = `<button type="button" class="upd-go">🔄 ${ar ? 'في تحديث جديد — اضغط للتحديث' : 'New update — tap to refresh'}</button><button type="button" class="upd-x" aria-label="close">✕</button>`;
        b.querySelector('.upd-go').onclick = () => {
          want = true; const w = reg.waiting;
          if (w) w.postMessage({ type: 'SKIP_WAITING' }); else location.reload();
          setTimeout(() => location.reload(), 4000);                                        // safety net
        };
        b.querySelector('.upd-x').onclick = () => b.remove();
        document.body.appendChild(b);
      };
      if (reg.waiting) bar();
      reg.addEventListener('updatefound', () => { const w = reg.installing; if (w) w.addEventListener('statechange', () => { if (w.state === 'installed') bar(); }); });
      const chk = () => { try { reg.update().catch(() => {}); } catch (e) { /* ignore */ } };
      document.addEventListener('visibilitychange', () => { if (!document.hidden) chk(); });
      setInterval(chk, 30 * 60 * 1000);
      navigator.serviceWorker.addEventListener('controllerchange', () => { if (want) location.reload(); });
    }).catch(() => {});
  }
  window.__anat = { A, S, P, cam, R, itemOf, study: A.quizApi };
  window.__ready = true;
}
A.applyLang = applyLang; A.renderChips = renderChips; A.itemOf = itemOf;
boot();
