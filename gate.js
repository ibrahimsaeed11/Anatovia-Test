/* gate.js — mandatory sign-in + student profile (name, university, faculty, study year) shown before the app opens.
   v78 design: split screen — form panel + "Bono" the little skeleton doctor who reacts to what you do
   (follows the cursor / your typing, covers his eyes while you type a password, peeks when you show it, cheers on success).
   Note: this is a front-end gate (it cannot be a security boundary — Premium itself is still enforced by the server rules). */
'use strict';
(() => {
  if (window.__gateLoaded) return; window.__gateLoaded = true;
  const LS = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } } };
  const gA = () => (typeof A !== 'undefined' ? A : null);
  const hasS = () => { try { return typeof S !== 'undefined' && !!S; } catch (e) { return false; } };
  let lang = 'ar'; try { lang = (JSON.parse(LS.get('anat2') || '{}').lang) || 'ar'; } catch (e) { /* ignore */ }
  const L = () => (hasS() && S.lang ? S.lang : lang), ar = () => L() === 'ar';
  const T = (en, a) => (ar() ? a : en);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const $ = (id) => document.getElementById(id);
  const reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* which faculties exist + their look (codes match faculty.js) */
  const FAC_LOOK = { pt: ['🦵', '#ff9f45'], med: ['🩺', '#5b9dff'], dent: ['🦷', '#3fd8c8'], nurs: ['💉', '#5fd68a'], vet: ['🐾', '#c79a5b'], ahs: ['🧬', '#a68bff'], pe: ['🏃', '#ffd23f'], pharm: ['💊', '#ff7aa8'], other: ['🎓', '#80aad3'] };
  window.ANAT_FACLOOK = FAC_LOOK;
  const YEARS = [['1', '1', '1'], ['2', '2', '2'], ['3', '3', '3'], ['4', '4', '4'], ['5', '5', '5'], ['6', '6', '6'], ['int', 'Intern', 'امتياز'], ['grad', 'Graduate', 'خريج']];

  /* ───────── do we need the gate at all? ───────── */
  const cache = (() => { try { return JSON.parse(LS.get('anatovia_acct') || 'null'); } catch (e) { return null; } })();
  const localProf = () => { try { return JSON.parse(LS.get('anatovia_prof') || 'null') || {}; } catch (e) { return {}; } };
  const hasFirebase = () => !!window.FIREBASE_CONFIG;
  const needsNow = () => {
    if (!hasFirebase()) return false;
    const c = (gA() && A.acct && A.acct.email) ? { email: A.acct.email, fx: { uni: A.acct.uni, fac: A.acct.fac } } : cache;
    return !(c && c.email && c.fx && c.fx.uni && c.fx.fac && localProf().name);
  };

  let step = 'auth', mode = 'up', busy = false, msg = '', pf = { name: '', uni: '', fac: '', yr: '' }, confirmOn = false, root = null, closed = false;
  let pwFocus = false, pwShow = false, lastS = '';

  /* ───────── Bono (inline SVG, states driven by CSS via data-s on the stage) ───────── */
  const B = '#6f9bc8', SC = '#2a4f78';
  const limb = (d) => `<path d="${d}" stroke="${B}" stroke-width="15" fill="none"/><path d="${d}" stroke="url(#gbn)" stroke-width="11" fill="none"/>`;
  const cap = (x) => `<circle cx="${x}" cy="182" r="13" fill="url(#gsc)" stroke="${SC}" stroke-width="2"/>`;
  const hand = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#gbn)" stroke="${B}" stroke-width="2"/>`;
  const palm = (x, y, ry, lines) => `<ellipse cx="${x}" cy="${y}" rx="28" ry="${ry}" fill="url(#gbn)" stroke="${B}" stroke-width="2"/><path d="${lines}" stroke="#9fc3e6" stroke-width="2.5" fill="none"/>`;
  const BONO = `<svg class="bono" viewBox="0 0 240 300" role="img" aria-label="Bono" focusable="false">
<defs>
<radialGradient id="gbn" cx=".35" cy=".28" r=".85"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#e6f4ff"/><stop offset="1" stop-color="#9fc3e6"/></radialGradient>
<linearGradient id="gsc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5b86b6"/><stop offset="1" stop-color="#34608f"/></linearGradient>
<radialGradient id="gir" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#c8f1ff"/><stop offset=".5" stop-color="#5ad1ff"/><stop offset="1" stop-color="#3f6593"/></radialGradient>
</defs>
<ellipse cx="120" cy="288" rx="62" ry="8" fill="#000f22" opacity=".55"/>
<g class="bb" stroke-linecap="round" stroke-linejoin="round">
<path d="M104 240v32M136 240v32" stroke="${B}" stroke-width="15" fill="none"/><path d="M104 240v32M136 240v32" stroke="url(#gbn)" stroke-width="11" fill="none"/>
<path d="M86 282q0-10 14-10h14q4 0 4 10z M126 282q0-10 4-10h14q14 0 14 10z" fill="#5ad1ff" stroke="#2f7fa8" stroke-width="2"/>
<path d="M84 178Q84 160 102 160H138Q156 160 156 178V232Q156 246 142 246H98Q84 246 84 232Z" fill="url(#gsc)" stroke="${SC}" stroke-width="2"/>
<path d="M106 160l14 20 14-20z" fill="url(#gbn)"/>
<path d="M106 164Q98 204 120 208Q142 204 134 164" stroke="#e6f4ff" stroke-width="3" fill="none"/><circle cx="120" cy="210" r="6" fill="#ffc83d" stroke="#b8860b" stroke-width="1.5"/>
<g class="arm dn">${limb('M84 190Q70 206 72 226')}${limb('M156 190Q170 206 168 226')}${hand(72, 230, 10)}${hand(168, 230, 10)}${cap(86)}${cap(154)}</g>
<rect x="112" y="148" width="16" height="16" fill="#c0e6fd"/>
<rect x="84" y="130" width="72" height="30" rx="15" fill="url(#gbn)" stroke="${B}" stroke-width="2"/>
<ellipse cx="120" cy="90" rx="76" ry="68" fill="url(#gbn)" stroke="${B}" stroke-width="2"/>
<ellipse cx="86" cy="48" rx="24" ry="10" fill="#fff" opacity=".6" transform="rotate(-28 86 48)"/>
<path class="tt" d="M98 146h44M108 146v10M120 146v10M132 146v10" stroke="${B}" stroke-width="2.5" fill="none"/>
<g class="ey"><ellipse cx="90" cy="100" rx="22" ry="25" fill="#000f22"/><ellipse cx="150" cy="100" rx="22" ry="25" fill="#000f22"/>
<g class="ir" id="gIrL"><circle cx="92" cy="102" r="14" fill="url(#gir)"/><circle cx="92" cy="102" r="6" fill="#000f22"/><circle cx="86" cy="95" r="4.5" fill="#fff"/><circle cx="98" cy="108" r="2" fill="#fff"/></g>
<g class="ir" id="gIrR"><circle cx="152" cy="102" r="14" fill="url(#gir)"/><circle cx="152" cy="102" r="6" fill="#000f22"/><circle cx="146" cy="95" r="4.5" fill="#fff"/><circle cx="158" cy="108" r="2" fill="#fff"/></g></g>
<path class="eh" d="M68 106q22-30 44 0M128 106q22-30 44 0" stroke="#000f22" stroke-width="8" fill="none"/>
<ellipse cx="120" cy="122" rx="4" ry="5" fill="#000f22"/>
<ellipse class="ch" cx="60" cy="126" rx="10" ry="6" fill="#5ad1ff" opacity=".4"/><ellipse class="ch" cx="180" cy="126" rx="10" ry="6" fill="#5ad1ff" opacity=".4"/>
<path class="mo ms" d="M108 138q12 8 24 0" stroke="#3f6593" stroke-width="3" fill="none"/>
<g class="mo mo-o"><path d="M98 134q22 32 44 0z" fill="#000f22" stroke="#000f22" stroke-width="3"/><ellipse cx="120" cy="150" rx="9" ry="5" fill="#ff8a9a"/></g>
<path class="mo mf" d="M108 146q12-9 24 0" stroke="#3f6593" stroke-width="3" fill="none"/>
<path class="tear" d="M70 128q-5 8 0 12q5-4 0-12z" fill="#5ad1ff"/>
<g class="arm cv">${limb('M86 184Q30 170 66 112')}${limb('M154 184Q210 170 174 112')}${cap(86)}${cap(154)}${palm(90, 102, 24, 'M72 98h36M72 108h36')}${palm(150, 102, 24, 'M132 98h36M132 108h36')}</g>
<g class="arm pk">${limb('M86 184Q30 170 66 112')}${limb('M154 184Q214 160 176 84')}${cap(86)}${cap(154)}${palm(90, 102, 24, 'M72 98h36M72 108h36')}${palm(152, 78, 13, 'M134 76h36')}</g>
<g class="arm hp">${limb('M86 184Q36 170 40 104')}${limb('M154 184Q204 170 200 104')}${hand(40, 96, 11)}${hand(200, 96, 11)}${cap(86)}${cap(154)}</g>
<path class="sp" d="M22 44l4 11 11 4-11 4-4 11-4-11-11-4 11-4zM206 30l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#5ad1ff"/><path class="sp" d="M214 70l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#ffc83d"/>
</g></svg>`;

  /* ───────── styles ───────── */
  const css = `
#gate{--a:#5ad1ff;--g0:#000f22;--g1:#1b3554;--g2:#3f6593;--g3:#5b86b6;--g4:#80aad3;--g5:#c0e6fd;position:fixed;inset:0;z-index:9000;display:flex;background:#000f22;color:var(--g5);font-family:system-ui,-apple-system,"Segoe UI",Tahoma,"Noto Naskh Arabic","Noto Sans Arabic",Arial,sans-serif;transition:opacity .6s ease,transform .6s ease,visibility .6s}
#gate.out{opacity:0;transform:scale(1.03);visibility:hidden;pointer-events:none}
#gate *{box-sizing:border-box}
#gate button{font-family:inherit;cursor:pointer;border:0;background:none;color:inherit}
#gate .gpanel{position:relative;z-index:2;flex:0 0 min(540px,46vw);overflow:auto;-webkit-overflow-scrolling:touch;background:#00162e;border-inline-end:1px solid rgba(192,230,253,.12)}
#gate .gwrap{min-height:100%;display:flex;flex-direction:column;justify-content:center;gap:18px;padding:calc(56px + env(safe-area-inset-top)) clamp(24px,5vw,64px) calc(40px + env(safe-area-inset-bottom));max-width:620px;margin:0 auto}
#gate .gwrap.fx>*{opacity:0;animation:gup .6s cubic-bezier(.2,.9,.25,1) forwards}
#gate .gwrap.fx>*:nth-child(2){animation-delay:.08s}#gate .gwrap.fx>*:nth-child(3){animation-delay:.16s}#gate .gwrap.fx>*:nth-child(4){animation-delay:.24s}
@keyframes gup{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
#gate .gbrandrow{display:flex;align-items:center;gap:12px;direction:ltr;justify-content:flex-start}
#gate .gbrandrow b{font-size:26px;font-weight:800;color:#fff;letter-spacing:.3px}
#gate h1{margin:0;font-size:clamp(26px,3.2vw,36px);line-height:1.3;font-weight:800;color:#fff}
#gate p.lead,#gate p.sub{margin:0;color:var(--g4);font-size:15px;line-height:1.7}
#gate h2{margin:0 0 2px;font-size:24px;color:#fff;font-weight:800}
#gate .gc{display:flex;flex-direction:column;gap:12px}
#gate .gtabs{display:flex;gap:4px;padding:4px;border-radius:12px;background:#0d2340}
#gate .gtabs button{flex:1;height:42px;border-radius:9px;font-weight:700;font-size:15px;color:var(--g4);transition:background .2s,color .2s}
#gate .gtabs button.on{background:var(--a);color:var(--g0)}
#gate input,#gate select{width:100%;height:50px;border-radius:12px;border:1px solid rgba(192,230,253,.2);background:#0d2340;color:#e6f4ff;padding:0 16px;font-size:16px;font-family:inherit;outline:none;transition:border-color .2s,box-shadow .2s}
#gate input::placeholder{color:var(--g4)}
#gate input:focus,#gate select:focus{border-color:var(--a);box-shadow:0 0 0 3px rgba(90,209,255,.22)}
#gate select option,#gate select optgroup{background:#0b2038;color:#fff}
#gate .gpw{position:relative}#gate .gpw input{padding-right:52px}#gate .gpw button{position:absolute;top:0;right:2px;height:50px;width:48px;color:var(--g4);display:grid;place-items:center}
#gate .gpw button:hover,#gate .gpw button.on{color:var(--a)}
#gate .gb{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:52px;padding:0 18px;border-radius:12px;font-weight:800;font-size:16px;border:1px solid rgba(192,230,253,.28);background:transparent;color:#e6f4ff;transition:transform .15s,box-shadow .2s,background .2s}
#gate .gb:active{transform:scale(.98)}
#gate .gb.pri{background:var(--a);color:var(--g0);border-color:transparent;box-shadow:0 8px 28px rgba(90,209,255,.28)}
#gate .gb.pri:hover{box-shadow:0 10px 34px rgba(90,209,255,.45)}
#gate .gb[disabled]{opacity:.55;pointer-events:none}
#gate .gor{display:flex;align-items:center;gap:12px;color:var(--g4);font-size:13px}
#gate .gor::before,#gate .gor::after{content:"";flex:1;height:1px;background:rgba(192,230,253,.15)}
#gate .ge{padding:10px 12px;border-radius:12px;background:rgba(255,107,122,.14);border:1px solid rgba(255,107,122,.4);color:#ffc2c9;font-size:14px;line-height:1.6}
#gate .glk{color:var(--g4);font-size:14px;text-decoration:underline;text-align:center;cursor:pointer}
#gate .gl{font-size:13px;color:var(--g5);margin:6px 0 -4px;font-weight:700}
#gate .facs{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;perspective:700px}
#gate .fc{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;min-height:92px;padding:10px 4px;border-radius:14px;background:#0d2340;border:1.5px solid rgba(192,230,253,.16);text-align:center;font-size:12.5px;font-weight:700;line-height:1.35;color:var(--g5);transform-style:preserve-3d;transition:transform .15s ease,border-color .2s,background .2s,box-shadow .25s}
#gate .fc .em{font-size:28px;transition:transform .25s}
#gate .fc.sel{border-color:var(--c);background:color-mix(in srgb,var(--c) 18%,#0d2340);box-shadow:0 0 0 2px color-mix(in srgb,var(--c) 40%,transparent),0 10px 26px color-mix(in srgb,var(--c) 30%,transparent);color:#fff}
#gate .fc.sel .em{transform:scale(1.2) translateY(-2px)}
#gate .fc.sel::after{content:"✓";position:absolute;top:6px;inset-inline-end:8px;font-size:13px;color:var(--c)}
#gate .yrs{display:flex;flex-wrap:wrap;gap:8px}
#gate .yr{min-width:48px;height:42px;padding:0 14px;border-radius:12px;background:#0d2340;border:1.5px solid rgba(192,230,253,.16);font-weight:800;color:var(--g5);transition:transform .15s,background .2s,border-color .2s}
#gate .yr.sel{background:var(--a);color:var(--g0);border-color:var(--a);transform:translateY(-2px)}
#gate .gf{margin:0;font-size:12px;color:var(--g4);line-height:1.6}
#gate .gcf{position:fixed;inset:0;z-index:5;display:grid;place-items:center;padding:18px;background:rgba(0,10,24,.8);animation:gfade .25s both}
#gate .gcf .gc{max-width:420px;width:100%;padding:22px 20px;border-radius:20px;background:#0a2038;border:1px solid rgba(192,230,253,.2);box-shadow:0 24px 70px rgba(0,0,0,.6)}
@keyframes gfade{to{opacity:1}}
#gate .gr{display:flex;gap:10px}
#gate .gs{padding:12px;border-radius:12px;background:#0d2340;border:1px solid rgba(192,230,253,.16);font-size:14px;line-height:1.9;color:var(--g5)}
#gate .gs b{color:#fff}
#gate .glang{position:fixed;top:calc(12px + env(safe-area-inset-top));inset-inline-end:14px;z-index:6;height:38px;padding:0 14px;border-radius:12px;background:rgba(0,22,46,.7);border:1px solid rgba(192,230,253,.25);color:var(--g5);font-weight:700;font-size:13px;backdrop-filter:blur(6px)}
/* stage */
#gate .gstage{position:relative;flex:1;min-width:0;display:flex;align-items:center;justify-content:center;overflow:hidden;background:radial-gradient(circle at 50% 46%,#1b3554 0%,#0a2038 38%,#000f22 74%)}
#gate .gstage::before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(192,230,253,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(192,230,253,.05) 1px,transparent 1px);background-size:52px 52px;-webkit-mask-image:radial-gradient(circle at 50% 50%,#000 30%,transparent 78%);mask-image:radial-gradient(circle at 50% 50%,#000 30%,transparent 78%)}
#gate .gring{position:absolute;left:50%;top:50%;width:min(60vh,520px);height:min(60vh,520px);transform:translate(-50%,-50%);border-radius:50%;border:1px solid rgba(90,209,255,.22)}
#gate .gring.r2{width:min(86vh,760px);height:min(86vh,760px);border:1px dashed rgba(128,170,211,.18);animation:gspin 60s linear infinite}
@keyframes gspin{to{transform:translate(-50%,-50%) rotate(360deg)}}
#gate .bono{position:relative;height:min(82vh,700px);width:auto;max-width:92%;filter:drop-shadow(0 0 26px rgba(90,209,255,.28))}
#gate .bono .bb{animation:gbob 3.4s ease-in-out infinite}
@keyframes gbob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
#gate .bono .ey{transform-box:fill-box;transform-origin:center;animation:gblink 5.5s infinite}
@keyframes gblink{0%,93%,100%{transform:scaleY(1)}96%{transform:scaleY(.08)}}
#gate .bono .ir{transition:transform .14s ease-out}
#gate .bono .arm{opacity:0;transform:translateY(46px);transition:opacity .22s,transform .5s cubic-bezier(.3,1.5,.5,1);pointer-events:none}
#gate .bono .arm.dn{opacity:1;transform:none}
#gate .bono .eh,#gate .bono .mo-o,#gate .bono .mf,#gate .bono .sp,#gate .bono .tear{opacity:0;transition:opacity .2s}
#gate .gstage[data-s=cover] .arm.cv,#gate .gstage[data-s=peek] .arm.pk,#gate .gstage[data-s=happy] .arm.hp{opacity:1;transform:none}
#gate .gstage[data-s=cover] .arm.dn,#gate .gstage[data-s=peek] .arm.dn,#gate .gstage[data-s=happy] .arm.dn{opacity:0;transform:translateY(20px)}
#gate .gstage[data-s=happy] .ey,#gate .gstage[data-s=happy] .tt,#gate .gstage[data-s=happy] .ms{opacity:0}
#gate .gstage[data-s=happy] .eh,#gate .gstage[data-s=happy] .mo-o,#gate .gstage[data-s=happy] .sp{opacity:1}
#gate .gstage[data-s=happy] .bb{animation:ghop .7s ease-in-out infinite}
@keyframes ghop{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
#gate .gstage[data-s=sad] .ms{opacity:0}#gate .gstage[data-s=sad] .mf,#gate .gstage[data-s=sad] .tear{opacity:1}
#gate .bono .bb.shake{animation:gshake .5s}
@keyframes gshake{0%,100%{transform:none}20%{transform:translateX(-8px) rotate(-2deg)}40%{transform:translateX(8px) rotate(2deg)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}
#gate .gsay{position:absolute;top:9%;inset-inline-start:50%;transform:translateX(-50%);z-index:2;padding:9px 16px;border-radius:14px;background:rgba(13,35,64,.9);border:1px solid rgba(192,230,253,.2);font-size:14px;font-weight:700;color:var(--g5);white-space:nowrap;transition:opacity .2s}
#gate[dir=rtl] .gsay{transform:translateX(50%)}
#gate .gchip{position:absolute;z-index:1;padding:9px 16px;border-radius:12px;background:rgba(13,35,64,.85);border:1px solid rgba(192,230,253,.18);font-size:13px;color:var(--g5)}
#gate .gchip.c1{top:22%;inset-inline-start:7%}#gate .gchip.c2{bottom:22%;inset-inline-end:7%}#gate .gchip.c3{bottom:9%;inset-inline-start:7%}
@media (max-width:860px){
 #gate{flex-direction:column}
 #gate .gstage{order:-1;flex:0 0 clamp(190px,34dvh,330px)}
 #gate .gpanel{flex:1;min-height:0;margin-top:-22px;border-radius:24px 24px 0 0;border:0;border-top:1px solid rgba(192,230,253,.18);box-shadow:0 -18px 44px rgba(0,15,34,.7)}
 #gate .gwrap{justify-content:flex-start;padding-top:22px;gap:14px}
 #gate .bono{height:90%;margin-top:14px}
 #gate .gchip,#gate .gring.r2{display:none}
 #gate .gsay{top:6px;font-size:13px;padding:6px 12px}
 #gate .gbrandrow{display:none}
 #gate h1{font-size:22px}
}
@media (prefers-reduced-motion:reduce){#gate *,#gate *::after{animation:none!important}#gate .bono .arm,#gate .bono .ir{transition-duration:.01s}}`;
  const st = document.createElement('style'); st.id = 'gateCss'; st.textContent = css; document.head.appendChild(st);

  /* ───────── view ───────── */
  const facData = () => window.ANAT_FACS || {};
  const uniOpts = () => {
    const G = window.ANAT_UGROUPS, GN = window.ANAT_GN, U = window.ANAT_UNIS; if (!G || !U) return '';
    return Object.keys(G).map((g) => `<optgroup label="${esc(ar() ? GN[g][0] : GN[g][1])}">` + G[g].map((s) => { const u = U[s.split('|')[0]]; return `<option value="${u.c}" ${pf.uni === u.c ? 'selected' : ''}>${esc(ar() ? u.ar : u.en)}</option>`; }).join('') + '</optgroup>').join('') +
      `<option value="other" ${pf.uni === 'other' ? 'selected' : ''}>${T('Other / not listed', 'أخرى / مش موجودة')}</option>`;
  };
  const MARK = '<svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true"><circle cx="17" cy="17" r="15" fill="none" stroke="#5ad1ff" stroke-width="2"/><path d="M17 8v18M11 13h12M12 19h10" stroke="#5ad1ff" stroke-width="2" stroke-linecap="round"/></svg>';
  const brandRow = () => `<div class="gbrandrow">${MARK}<b>Anatovia</b></div>`;
  const errBox = () => (msg ? `<div class="ge" role="alert">${esc(msg)}</div>` : '');
  const nFacts = () => { const n = (window.CATALOG && CATALOG.length) || 2000; return Math.floor(n / 100) * 100; };
  const EYE = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  const GOOGLE = '<svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.5 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/><path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>';

  function viewAuth() {
    const up = mode === 'up';
    return `${brandRow()}
      <div><h1>${T('Welcome to the world of anatomy', 'أهلاً بيك في عالم التشريح')}</h1><p class="sub" style="margin-top:8px">${T('Sign up once and keep studying on any device.', 'سجّل بياناتك مرة واحدة وكمّل مذاكرتك على أي جهاز.')}</p></div>
      <div class="gc"><div class="gtabs"><button type="button" class="${up ? 'on' : ''}" data-g="tabup">${T('New account', 'حساب جديد')}</button><button type="button" class="${up ? '' : 'on'}" data-g="tabin">${T('I have an account', 'عندي حساب')}</button></div>
        <input id="gEmail" type="email" dir="ltr" autocomplete="email" inputmode="email" aria-label="${T('E-mail', 'البريد الإلكتروني')}" placeholder="${T('E-mail', 'البريد الإلكتروني')}">
        <div class="gpw"><input id="gPass" type="password" dir="ltr" autocomplete="${up ? 'new-password' : 'current-password'}" aria-label="${T('Password', 'كلمة المرور')}" placeholder="${T('Password (6+ characters)', 'كلمة المرور (6 حروف على الأقل)')}"><button type="button" data-g="eye" aria-label="${T('Show password', 'إظهار كلمة المرور')}">${EYE}</button></div>
        ${errBox()}
        <button class="gb pri" data-g="submit" ${busy ? 'disabled' : ''}>${busy ? '…' : up ? T('Create account', 'إنشاء الحساب') : T('Sign in', 'دخول')}</button>
        <div class="gor">${T('or', 'أو')}</div>
        <button class="gb" data-g="google" ${busy ? 'disabled' : ''}>${GOOGLE}${T('Continue with Google', 'المتابعة بحساب Google')}</button>
        ${up ? '' : `<a class="glk" data-g="reset">${T('Forgot password?', 'نسيت كلمة المرور؟')}</a>`}</div>
      <p class="gf">${T('Sign-up is required once — it personalises the app for your faculty.', 'التسجيل مطلوب مرة واحدة — بيجهّز التطبيق على حسب كليتك.')}</p>`;
  }
  function viewProfile() {
    const full = !(gA() && A.acct && A.acct.uni && A.acct.fac), F = facData(), codes = Object.keys(F);
    const cards = codes.map((c) => { const lk = FAC_LOOK[c] || ['🎓', '#80aad3'], f = F[c]; return `<button type="button" class="fc ${pf.fac === c ? 'sel' : ''}" data-g="fac" data-c="${c}" style="--c:${lk[1]}"><span class="em">${lk[0]}</span><span>${esc(ar() ? f.ar : f.en)}</span></button>`; }).join('');
    const yrs = YEARS.map((y) => `<button type="button" class="yr ${pf.yr === y[0] ? 'sel' : ''}" data-g="yr" data-v="${y[0]}">${T(y[1], y[2])}</button>`).join('');
    const email = (gA() && A.acct && A.acct.email) || '';
    return `${brandRow()}
      <div class="gc"><h2>${T('Tell us about you', 'عرّفنا بنفسك')}</h2><p class="lead">${email ? `<span dir="ltr">${esc(email)}</span> · ` : ''}${full ? T('This sets up the app for your faculty.', 'ده بيجهّز التطبيق على حسب كليتك.') : T('Almost done — just your name and study year.', 'قربنا نخلّص — اسمك وسنتك الدراسية بس.')}</p>
        <div class="gl">${T('Your name', 'اسمك')}</div><input id="gName" autocomplete="name" maxlength="40" value="${esc(pf.name)}" placeholder="${T('Full name', 'الاسم')}">
        ${full ? `<div class="gl">${T('University', 'الجامعة')}</div><select id="gUni"><option value="">${T('— Choose —', '— اختار —')}</option>${uniOpts()}</select>
        <div class="gl">${T('Faculty', 'الكلية')}</div><div class="facs">${cards}</div>` : ''}
        <div class="gl">${T('Study year', 'السنة الدراسية')}</div><div class="yrs">${yrs}</div>
        ${errBox()}
        <button class="gb pri" data-g="next" ${busy ? 'disabled' : ''}>${T('Continue', 'متابعة')}</button>
        ${full ? `<p class="gf">${T('University and faculty are saved once and cannot be changed later.', 'الجامعة والكلية بتتحفظ مرة واحدة ومش بتتغيّر بعد كده.')}</p>` : ''}
        <a class="glk" data-g="out">${T('Use a different account', 'استخدم حساب تاني')}</a></div>
      ${confirmOn ? viewConfirm() : ''}`;
  }
  function viewConfirm() {
    const F = facData(), full = !(A.acct && A.acct.uni), u = window.ANAT_UNIS && ANAT_UNIS[pf.uni];
    const yl = (YEARS.find((y) => y[0] === pf.yr) || [])[ar() ? 2 : 1];
    return `<div class="gcf"><div class="gc"><h2>${T('Confirm your data', 'تأكيد البيانات')}</h2>
      <div class="gs"><b>${esc(pf.name)}</b><br>${full ? `${esc(pf.uni === 'other' ? T('Other', 'أخرى') : (u ? (ar() ? u.ar : u.en) : ''))}<br>${esc(F[pf.fac] ? (ar() ? F[pf.fac].ar : F[pf.fac].en) : '')}<br>` : ''}${T('Year', 'السنة')}: ${esc(yl || '')}</div>
      ${full ? `<p class="lead">${T('University and faculty cannot be changed after saving.', 'الجامعة والكلية مش هتقدر تغيّرها بعد الحفظ.')}</p>` : ''}
      <div class="gr"><button class="gb" data-g="cback">${T('Edit', 'تعديل')}</button><button class="gb pri" data-g="save" ${busy ? 'disabled' : ''}>${busy ? '…' : T('Confirm & start', 'تأكيد وابدأ')}</button></div></div></div>`;
  }
  function viewDone() {
    return `${brandRow()}<div class="gc"><h2>${T('Welcome', 'أهلاً')} ${esc(pf.name.split(' ')[0] || '')} 👋</h2><p class="lead">${T('Opening your faculty…', 'بنفتح لك صفحة كليتك…')}</p></div>`;
  }
  function viewOffline() {
    return `${brandRow()}<div class="gc"><h2>${T('Internet needed', 'محتاج إنترنت')}</h2><p class="lead">${T('Connect to the internet once to create or sign in to your account. After that the app works offline.', 'اتصل بالإنترنت مرة واحدة عشان تعمل حسابك أو تسجل دخول. بعد كده التطبيق بيشتغل أوفلاين.')}</p><button class="gb pri" data-g="retry">${T('Try again', 'حاول تاني')}</button></div>`;
  }
  const VIEW = { auth: viewAuth, profile: viewProfile, done: viewDone, offline: viewOffline };
  const panel = () => root.querySelector('.gpanel');

  /* ───────── Bono behaviour ───────── */
  const SAY = () => ({ idle: T('Hi! I\'m Bono 👋', 'أهلاً! أنا بونو 👋'), cover: T('I\'m not looking… 🙈', 'مش باصص... 🙈'), peek: T('Just a tiny peek 👀', 'بصّة صغننة 👀'), happy: T('Welcome aboard! 🎉', 'أهلاً بيك! 🎉'), sad: T('Hmm, try again', 'جرّب تاني') });
  function bono() {
    if (!root) return; const stg = root.querySelector('.gstage'); if (!stg) return;
    let s = 'idle';
    if (step === 'done') s = 'happy'; else if (pwFocus && step === 'auth') s = pwShow ? 'peek' : 'cover'; else if (msg) s = 'sad';
    stg.dataset.s = s; const say = root.querySelector('.gsay'); if (say) say.textContent = SAY()[s];
    if (s === 'sad' && lastS !== 'sad' && !reduce) { const b = stg.querySelector('.bb'); if (b) { b.classList.remove('shake'); void b.getBoundingClientRect(); b.classList.add('shake'); } }
    lastS = s;
  }
  function look(x, y) {
    const svg = root && root.querySelector('.bono'); if (!svg) return; const r = svg.getBoundingClientRect(); if (!r.width) return;
    const cx = r.left + r.width / 2, cy = r.top + r.height * 0.34;
    const dx = Math.max(-1, Math.min(1, (x - cx) / (innerWidth * 0.35))) * 7, dy = Math.max(-1, Math.min(1, (y - cy) / (innerHeight * 0.35))) * 6;
    ['gIrL', 'gIrR'].forEach((id) => { const e = $(id); if (e) e.style.transform = `translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px)`; });
  }
  function lookAtInput(el) {
    const r = el.getBoundingClientRect(), len = (el.value || '').length, dir = getComputedStyle(el).direction;
    const x = dir === 'rtl' ? r.right - Math.min(r.width - 16, len * 9) : r.left + Math.min(r.width - 16, 16 + len * 9);
    look(x, r.top + r.height / 2);
  }

  function render(keepScroll) {
    if (!root) return;
    const w = root.querySelector('.gwrap'), pn = panel(), keep = keepScroll ? pn.scrollTop : 0;
    root.setAttribute('dir', ar() ? 'rtl' : 'ltr'); root.setAttribute('lang', L());
    const live = document.activeElement && root.contains(document.activeElement) ? document.activeElement.id : '', vals = {};
    ['gEmail', 'gPass', 'gName', 'gUni'].forEach((id) => { const e = $(id); if (e) vals[id] = e.value; });
    const showPw = pwShow && $('gPass') && $('gPass').type === 'text';
    w.innerHTML = VIEW[step]();
    Object.keys(vals).forEach((id) => { const e = $(id); if (e && vals[id] != null) e.value = vals[id]; });
    if (showPw && $('gPass')) { $('gPass').type = 'text'; const eb = root.querySelector('[data-g=eye]'); if (eb) eb.classList.add('on'); }
    if (live && $(live)) { try { $(live).focus(); } catch (e) { /* ignore */ } }
    if (keepScroll) pn.scrollTop = keep;
    root.querySelector('.glang').textContent = T('العربية', 'English');
    const c = root.querySelector('.gchips'); if (c) c.innerHTML = chips();
    bono();
  }
  const chips = () => `<span class="gchip c1">${nFacts()}+ ${T('3D models', 'نموذج ثلاثي الأبعاد')}</span><span class="gchip c2">${T('Arabic & English', 'عربي وإنجليزي')}</span><span class="gchip c3">${T('Quizzes & progress', 'اختبارات وتقارير تقدّم')}</span>`;

  /* 3D tilt on faculty cards */
  function tilt() {
    root.addEventListener('pointermove', (e) => { const b = e.target.closest && e.target.closest('.fc'); if (!b || reduce) return; const r = b.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; b.style.transform = `rotateX(${-y * 14}deg) rotateY(${x * 14}deg) translateZ(6px)`; });
    root.addEventListener('pointerout', (e) => { const b = e.target.closest && e.target.closest('.fc'); if (b) b.style.transform = ''; });
  }

  /* ───────── logic ───────── */
  const auth = () => (gA() && A.gateAuth) || null;
  const setStep = (s, m) => { step = s; msg = m || ''; busy = false; render(); panel().scrollTop = 0; };
  async function ensureReady() {
    const g = auth(); if (!g) return false;
    if (!navigator.onLine) return false;
    try { return await g.ready(); } catch (e) { return false; }
  }
  async function go(kind) {
    const g = auth(); if (!g) return;
    busy = true; msg = ''; render(true);
    if (!(await ensureReady())) return setStep('offline');
    try {
      if (kind === 'google') await g.google();
      else {
        const email = ($('gEmail').value || '').trim(), pass = $('gPass').value || '';
        if (!email || !pass) { busy = false; msg = T('Enter e-mail and password.', 'اكتب البريد وكلمة المرور.'); return render(true); }
        await g.email(mode, email, pass);
      }
      busy = false; msg = ''; /* onAcct moves us on */ evaluate();
    } catch (e) { busy = false; msg = A.errText ? A.errText(e) : T('Something went wrong.', 'حصل خطأ.'); pwFocus = false; render(true); }
  }
  async function doReset() {
    const g = auth(), email = ($('gEmail').value || '').trim(); if (!g) return;
    if (!email) { msg = T('Type your e-mail first.', 'اكتب بريدك الأول.'); return render(true); }
    if (!(await ensureReady())) return setStep('offline');
    try { await g.reset(email); msg = ''; render(true); A.toast && A.toast(T('Reset link sent to your e-mail.', 'بعتنا لينك إعادة التعيين على بريدك.'), 3500); } catch (e) { msg = A.errText(e); render(true); }
  }
  function readForm() {
    const n = $('gName'), u = $('gUni'); if (n) pf.name = n.value.trim(); if (u) pf.uni = u.value;
  }
  function validate() {
    readForm(); const full = !(A.acct && A.acct.uni && A.acct.fac);
    if (pf.name.length < 2) return T('Enter your name.', 'اكتب اسمك.');
    if (full && !pf.uni) return T('Choose your university.', 'اختار جامعتك.');
    if (full && !pf.fac) return T('Choose your faculty.', 'اختار كليتك.');
    if (!pf.yr) return T('Choose your study year.', 'اختار سنتك الدراسية.');
    return '';
  }
  async function save() {
    busy = true; msg = ''; render(true);
    try {
      const full = !(A.acct && A.acct.uni && A.acct.fac);
      if (full) await A.setFac(pf.uni, pf.fac);
      await A.setProfile(pf.name, pf.yr);
      confirmOn = false; step = 'done'; busy = false; render(); panel().scrollTop = 0;
      setTimeout(close, reduce ? 200 : 2000);
    } catch (e) { busy = false; confirmOn = false; msg = T('Could not save — check your connection.', 'ماتحفظش — اتأكد من الإنترنت.'); render(true); }
  }
  function close() {
    if (closed) return; closed = true; window.__gateOn = false;
    root.classList.add('out'); setTimeout(() => { if (root) root.remove(); const s = $('gateCss'); if (s) s.remove(); }, 800);
    try { if (A.onFaculty) A.onFaculty(true); if (A.toast) A.toast(T('Welcome ' + (pf.name || ''), 'أهلاً ' + (pf.name || '')), 2200); } catch (e) { /* ignore */ }
  }
  /* decide which screen to show given the account state */
  function evaluate() {
    if (closed) return;
    const A_ = gA() && A.acct;
    if (!needsNow()) { if (step !== 'done') close(); return; }
    if (step === 'done') return;
    if (A_ && A_.email) {
      const p = A.profile ? A.profile() : {}; if (!pf.name && p.name) pf.name = p.name; if (!pf.yr && p.yr) pf.yr = p.yr;
      if (step !== 'profile') setStep('profile');
    }
  }
  function show() {
    if (root) return; window.__gateOn = true;
    document.querySelectorAll('.tour').forEach((e) => e.remove());
    root = document.createElement('div'); root.id = 'gate';
    root.innerHTML = `<div class="gpanel"><div class="gwrap fx"></div></div><div class="gstage" data-s="idle"><i class="gring"></i><i class="gring r2"></i><div class="gsay"></div><div class="gchips">${chips()}</div>${BONO}</div><button class="glang" type="button"></button>`;
    document.body.appendChild(root);
    if (cache && cache.email) { step = 'profile'; }
    render(); tilt(); setTimeout(() => { const w = root && root.querySelector('.gwrap'); if (w) w.classList.remove('fx'); }, 1100);
    root.addEventListener('click', (e) => {
      if (e.target.closest('.glang')) { const b = $('btnLang'); if (b) b.click(); else { lang = lang === 'ar' ? 'en' : 'ar'; try { const o = JSON.parse(LS.get('anat2') || '{}'); o.lang = lang; LS.set('anat2', JSON.stringify(o)); } catch (er) { /* ignore */ } } return render(true); }
      const b = e.target.closest('[data-g]'); if (!b) return; const k = b.dataset.g;
      if (k === 'tabup' || k === 'tabin') { mode = k === 'tabup' ? 'up' : 'in'; msg = ''; pwFocus = false; render(true); }
      else if (k === 'eye') { const i = $('gPass'); if (!i) return; i.type = i.type === 'password' ? 'text' : 'password'; pwShow = i.type === 'text'; b.classList.toggle('on', pwShow); if (!pwFocus) { try { i.focus(); } catch (er) { /* ignore */ } } bono(); }
      else if (k === 'google') go('google'); else if (k === 'submit') go('email'); else if (k === 'reset') doReset();
      else if (k === 'fac') { readForm(); pf.fac = b.dataset.c; msg = ''; render(true); }
      else if (k === 'yr') { readForm(); pf.yr = b.dataset.v; msg = ''; render(true); }
      else if (k === 'next') { const m = validate(); if (m) { msg = m; return render(true); } msg = ''; confirmOn = true; render(true); }
      else if (k === 'cback') { confirmOn = false; render(true); }
      else if (k === 'save') save();
      else if (k === 'out') { if (auth()) auth().out(); step = 'auth'; mode = 'in'; pf = { name: '', uni: '', fac: '', yr: '' }; render(); }
      else if (k === 'retry') { setStep(gA() && A.acct && A.acct.email ? 'profile' : 'auth'); }
    });
    const keepFocus = (e) => { if (e.target.closest && e.target.closest('[data-g=eye]')) e.preventDefault(); };
    root.addEventListener('mousedown', keepFocus); root.addEventListener('pointerdown', keepFocus);
    root.addEventListener('keydown', (e) => { if (e.key === 'Enter' && step === 'auth' && e.target.tagName === 'INPUT') { e.preventDefault(); go('email'); } });
    root.addEventListener('change', (e) => { if (e.target.id === 'gUni') pf.uni = e.target.value; });
    root.addEventListener('focusin', (e) => { const id = e.target.id; if (id === 'gPass') { pwFocus = true; bono(); } else if (id === 'gEmail' || id === 'gName') { pwFocus = false; bono(); lookAtInput(e.target); } else { pwFocus = false; bono(); } });
    root.addEventListener('focusout', (e) => { if (e.target.id === 'gPass') { const n = e.relatedTarget; if (n && n.closest && n.closest('[data-g=eye]')) return; pwFocus = false; bono(); } });
    root.addEventListener('input', (e) => { if (e.target.id === 'gEmail' || e.target.id === 'gName') lookAtInput(e.target); if (msg && e.target.tagName === 'INPUT') { /* keep error until next submit */ } });
    window.addEventListener('pointermove', (e) => { if (!root || closed) return; const a = document.activeElement; if (a && (a.id === 'gEmail' || a.id === 'gName')) return; look(e.clientX, e.clientY); });
    /* wire into the account module */
    const wait = setInterval(() => {
      if (!(gA() && A.gateAuth && A.setFac)) return; clearInterval(wait);
      A.onAcct = evaluate;
      if (A.gateAuth && navigator.onLine) A.gateAuth.ready().then(() => { evaluate(); });
      evaluate();
    }, 100);
    setTimeout(() => clearInterval(wait), 30000);
  }

  /* language changes made by the app's own button */
  setInterval(() => { if (root && !closed && hasS() && S.lang !== lang) { lang = S.lang; render(true); } }, 500);
  /* sign-out later in the session → gate again */
  (function reGate() {
    setInterval(() => {
      if (!gA() || !A.gateAuth) return;
      if (closed && !window.__gateOn && A.gateAuth.state().known && !A.gateAuth.state().user && hasFirebase() && !(A.acct && A.acct.email)) {
        closed = false; root = null; step = 'auth'; mode = 'up'; pf = { name: '', uni: '', fac: '', yr: '' }; confirmOn = false; pwFocus = false; pwShow = false; msg = '';
        if (!$('gateCss')) { const s0 = document.createElement('style'); s0.id = 'gateCss'; s0.textContent = css; document.head.appendChild(s0); }
        show();
      }
    }, 2500);
  })();

  if (needsNow()) { if (document.body) show(); else document.addEventListener('DOMContentLoaded', show); }
  else { window.__gateOn = false; closed = true; }
})();
