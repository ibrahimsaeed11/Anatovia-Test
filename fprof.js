/* fprof.js — faculty profiles: what each faculty sees in the study hub, its accent colour, and the "my faculty" page.
   The account's faculty is locked after sign-up; "view as" below only changes what is shown on THIS device. */
'use strict';
window.__fprofLoaded = true;
(() => {
  const T = (en, ar) => (S.lang === 'ar' ? ar : en);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  /* hide = hub items that do not apply; first = items pinned to the top; note = faculty content still being prepared */
  const PROF = {
    pt: { hide: ['dent'], first: [], color: '#ff9f45' },
    med: { hide: ['dent', 'moves', 'tcards', 'calc'], first: [], color: '#5b9dff' },
    dent: { hide: ['moves', 'tcards', 'calc', 'spinal'], first: ['dent', 'quiz', 'cards'], color: '#3fd8c8', start: 'head' },
    nurs: { hide: ['dent', 'moves', 'tcards', 'calc', 'spinal'], first: [], color: '#5fd68a', note: true },
    vet: { hide: ['dent', 'moves', 'tcards', 'calc', 'spinal'], first: [], color: '#c79a5b', note: true },
    ahs: { hide: ['dent', 'tcards', 'calc', 'spinal'], first: [], color: '#a68bff', note: true },
    pe: { hide: ['dent', 'tcards', 'spinal'], first: ['moves'], color: '#ffd23f', note: true },
    pharm: { hide: ['dent', 'moves', 'tcards', 'calc', 'spinal'], first: [], color: '#ff7aa8', note: true },
    other: { hide: ['dent', 'tcards', 'calc', 'spinal'], first: [], color: '#80aad3' },
  };
  const FALLBACK = { hide: ['dent'], first: [], color: '#80aad3' };
  const LOOK = () => window.ANAT_FACLOOK || {};
  const view = () => { try { return Store.d.viewFac || ''; } catch (e) { return ''; } };
  A.facCode = () => view() || (A.acct && A.acct.fac) || '';
  const prof = () => PROF[A.facCode()] || FALLBACK;

  A.facHub = (items) => {
    const p = prof(), hide = new Set(p.hide), keep = items.filter((it) => !hide.has(it[0]));
    const head = p.first.map((k) => keep.find((it) => it[0] === k)).filter(Boolean);
    return head.concat(keep.filter((it) => !head.includes(it)));
  };
  A.facBadge = () => {
    const c = A.facCode(), F = window.ANAT_FACS && ANAT_FACS[c], look = LOOK()[c] || ['🎓'], pr = A.profile ? A.profile() : {}, p = prof();
    const yr = { int: T('Intern', 'امتياز'), grad: T('Graduate', 'خريج') }[pr.yr] || (pr.yr ? T('Year ', 'السنة ') + pr.yr : '');
    let h = '';
    if (F) h += `<div class="fbadge" style="--fc:${p.color}"><span class="fe">${look[0]}</span><span><b>${esc(S.lang === 'ar' ? F.ar : F.en)}</b><small>${esc([pr.name, yr].filter(Boolean).join(' · '))}</small></span></div>`;
    if (p.note) h += `<div class="advice" style="margin-bottom:10px">🚧 ${T('Content made specifically for your faculty is being prepared. Meanwhile you have the full 3D anatomy, quizzes and flashcards.', 'المحتوى المخصص لكليتك بيتجهّز. في الوقت ده معاك التشريح 3D الكامل والاختبارات والبطاقات.')}</div>`;
    return h;
  };
  A.onFaculty = (fromGate) => {
    const p = prof(); document.documentElement.style.setProperty('--fac', p.color);
    if (fromGate && p.start && A.flyRegion) { try { A.flyRegion(p.start); } catch (e) { /* ignore */ } }
  };
  Object.assign(STR, { myfac: { en: 'My faculty', ar: 'كليتي وبياناتي' }, myfacSub: { en: 'Your profile · switch what the app shows', ar: 'بياناتك · غيّر المحتوى المعروض' } });
  A.hubExtra = Object.assign(A.hubExtra || {}, { myfac: () => A.modal(page) });
  function page() {
    const c = A.facCode(), mine = (A.acct && A.acct.fac) || '', pr = A.profile ? A.profile() : {}, F = window.ANAT_FACS || {};
    const uni = A.uniName ? A.uniName(A.acct && A.acct.uni) : '';
    const chips = Object.keys(F).map((k) => `<button class="opt ${c === k ? 'sel' : ''}" data-act="fview" data-c="${k}">${(LOOK()[k] || ['🎓'])[0]} ${esc(S.lang === 'ar' ? F[k].ar : F[k].en)}${k === mine ? ' ★' : ''}</button>`).join('');
    return `<h2>🎓 ${T('My faculty', 'كليتي وبياناتي')}</h2><div class="acc-card"><b>${esc(pr.name || '')}</b><span class="acc-badge" dir="ltr">${esc(pr.email || '')}</span></div>` +
      `<p class="lead">${esc(uni)} · ${esc(F[mine] ? (S.lang === 'ar' ? F[mine].ar : F[mine].en) : '')}<br><small>${T('Your faculty is saved on your account and cannot be changed (contact us if it is wrong).', 'كليتك محفوظة على حسابك ومش بتتغيّر (كلمنا لو فيها غلط).')}</small></p>` +
      `<h4>${T('View the app as', 'اعرض التطبيق كأنك من')}</h4><p class="tiny">${T('Only changes what is shown on this device — useful to see another faculty’s tools.', 'بيغيّر المعروض على الجهاز ده بس — مفيد لو عايز تشوف أدوات كلية تانية.')}</p><div class="row">${chips}</div>`;
  }
  A.acts.fview = (el) => { const k = el.dataset.c; Store.d.viewFac = k === ((A.acct && A.acct.fac) || '') ? '' : k; Store.save(); A.onFaculty(); A.rerenderModal(); };
  A.onFaculty(); [1500, 4000, 9000].forEach((ms) => setTimeout(() => A.onFaculty(), ms));
  const css = document.createElement('style'); css.textContent = '.fbadge{display:flex;gap:12px;align-items:center;padding:12px 14px;margin-bottom:10px;border-radius:16px;background:color-mix(in srgb,var(--fc,var(--accent)) 16%,var(--surface2));border:1px solid color-mix(in srgb,var(--fc,var(--accent)) 55%,transparent)}.fbadge .fe{font-size:28px}.fbadge b{display:block}.fbadge small{color:var(--muted)}.hub button .em{background:color-mix(in srgb,var(--fac,var(--accent)) 24%,transparent)}'; document.head.appendChild(css);
})();
