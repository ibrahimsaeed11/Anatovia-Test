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
  /* Bono = the sticker-pack bone mascot (same art as bono.js), rebuilt in layers so the face and arms can move */
  const INK = '#000B33', CRM = '#f6efe2';
  const arm = (d) => `<path d="${d}" stroke="${INK}" stroke-width="19" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${CRM}" stroke-width="11" fill="none" stroke-linecap="round"/>`;
  const hnd = (x, y, rot, flip, sc) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${flip * (sc || 1)},${sc || 1})"><ellipse cx="-9" cy="-6" rx="5.5" ry="7.5" transform="rotate(-30 -9 -6)" fill="#fbf6ec" stroke="${INK}" stroke-width="3.5"/><circle r="12" fill="#fbf6ec" stroke="${INK}" stroke-width="4"/><path d="M-3 4 Q2 8 7 3" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
  const eye = (id, x, dx) => `<g class="ir" id="${id}"><circle cx="${x}" cy="140" r="11" fill="${INK}"/><circle cx="${x + 3.3}" cy="135.8" r="4.6" fill="#fff"/><path d="M${x - 9.9} 141.1 Q${x} 152.6 ${x + 9.9} 141.1" stroke="#AEB8D9" stroke-width="1.8" fill="none" opacity=".8"/><circle cx="${x - 3.3}" cy="143.9" r="1.8" fill="#fff"/></g>`;
  const star = (x, y, sc, c) => `<path transform="translate(${x} ${y}) scale(${sc})" d="M0 -12 L3.5 -3.5 L12 -3 L5.5 3 L7.5 12 L0 7 L-7.5 12 L-5.5 3 L-12 -3 L-3.5 -3.5Z" fill="${c}" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>`;
  const BODY = ['<rect x="100" y="58" width="100" height="184" rx="34"/>', '<circle cx="104" cy="72" r="33"/>', '<circle cx="196" cy="72" r="33"/>', '<circle cx="104" cy="228" r="33"/>', '<circle cx="196" cy="228" r="33"/>'].join('');
  const BONO = `<svg class="bono" viewBox="50 18 200 196" role="img" aria-label="Bono" focusable="false">
<defs><linearGradient id="gbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffaf0"/><stop offset=".65" stop-color="#f1e8d8"/><stop offset="1" stop-color="#d9e6f7"/></linearGradient></defs>
<ellipse cx="150" cy="272" rx="88" ry="11" fill="#000" opacity=".3"/>
<g class="bb">
<g fill="${INK}" stroke="${INK}" stroke-width="9" stroke-linejoin="round">${BODY}</g>
<g fill="url(#gbg)">${BODY}</g>
<g fill="#d8c9ad" opacity=".55"><circle cx="118" cy="98" r="2.6"/><circle cx="185" cy="205" r="2.2"/><circle cx="176" cy="96" r="1.8"/><circle cx="122" cy="212" r="2.4"/><circle cx="192" cy="128" r="1.6"/></g>
<path d="M78 70 Q74 100 90 120" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".7"/>
<path d="M172 238 Q200 240 214 224" stroke="#E3B95B" stroke-width="5" fill="none" stroke-linecap="round" opacity=".5"/>
<g class="arm dn">${arm('M104 160 Q74 166 72 196')}${hnd(72, 200, 0, -1)}${arm('M196 160 Q226 166 228 196')}${hnd(228, 200, 0, 1)}</g>
<g class="ey">${eye('gIrL', 125)}${eye('gIrR', 175)}</g>
<path class="eh" d="M114 144 Q125 128 136 144M164 144 Q175 128 186 144" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>
<g class="br"><path d="M112 118 L132 126" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/><path d="M168 126 L188 118" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/></g>
<path class="mo ms" d="M134 168 Q150 180 166 168" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>
<g class="mo mo-o"><path d="M132 162 Q150 188 168 162Z" fill="${INK}"/><path d="M142 174 Q150 182 158 174" fill="#ff5d8f"/></g>
<path class="mo mf" d="M134 178 Q150 160 166 178" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>
<ellipse cx="108" cy="162" rx="10" ry="6" fill="#ff8fb1" opacity=".6"/><ellipse cx="192" cy="162" rx="10" ry="6" fill="#ff8fb1" opacity=".6"/>
<ellipse class="tear" cx="116" cy="160" rx="4" ry="8" fill="#7fb2e6"/>
<g class="arm cv">${arm('M104 162 Q80 156 112 142')}${arm('M196 162 Q220 156 188 142')}${hnd(125, 141, 0, -1, 1.5)}${hnd(175, 141, 0, 1, 1.5)}</g>
<g class="arm pk">${arm('M104 162 Q80 156 112 142')}${arm('M196 162 Q238 150 192 112')}${hnd(125, 141, 0, -1, 1.5)}${hnd(180, 112, 20, 1, 1.4)}</g>
<g class="arm hp">${arm('M104 158 Q70 150 66 108')}${hnd(66, 100, 10, -1)}${arm('M196 158 Q230 150 234 108')}${hnd(234, 100, -10, 1)}</g>
<g class="sp">${star(64, 52, 0.9, '#e0b45a')}${star(238, 72, 0.7, '#E3B95B')}${star(222, 34, 0.6, '#d98b6a')}</g>
</g></svg>`;

  const SPINE = [44, 52, 60, 68, 76, 84, 92, 98, 104, 108, 112, 116, 118, 120, 120].map((w, i) => `<rect class="v" style="animation-delay:${(i * 0.22).toFixed(2)}s" x="${60 - w / 2}" y="${20 + i * 52}" width="${w}" height="34" rx="14" fill="none" stroke="#AEB8D9" stroke-width="2"/>`).join('');

  const FLOATS = [[8, 26, 14, 0], [18, 16, 18, 4], [30, 22, 16, 9], [44, 14, 20, 2], [57, 24, 15, 7], [68, 18, 19, 11], [79, 28, 17, 5], [90, 15, 21, 1], [36, 12, 22, 13], [63, 20, 18, 15]].map((f) => `<b style="left:${f[0]}%;--sz:${f[1]}px;--d:${f[2]}s;--dl:-${f[3]}s"></b>`).join('');

  /* ───────── styles ───────── */
  const css = `
@font-face{font-family:"Cairo";src:url(fonts/cairo.woff) format("woff");font-weight:200 1000;font-style:normal;font-display:swap}
#gate{--ln:#F8F4EA;--kh:#AEB8D9;--cm:#E3B95B;--co:#4A5580;--es:#000B33;--pp:#FFFDF8;--ls:#DDD6C4;position:fixed;inset:0;z-index:9000;overflow:auto;-webkit-overflow-scrolling:touch;background:var(--ln);color:var(--es);font-family:"Cairo","Segoe UI",Tahoma,"Noto Sans Arabic",system-ui,-apple-system,Arial,sans-serif;transition:opacity .6s ease,transform .6s ease,visibility .6s}
#gate.out{opacity:0;transform:scale(1.03);visibility:hidden;pointer-events:none}
#gate *{box-sizing:border-box}
#gate button{font-family:inherit;cursor:pointer;border:0;background:none;color:inherit}
#gate .gbg{position:fixed;inset:0;overflow:hidden;pointer-events:none}
#gate .gbg i{position:absolute;border-radius:50%}
#gate .gbg .c1{width:760px;height:760px;background:#EDE6D4;top:-300px;inset-inline-end:-200px;animation:gdrift 14s ease-in-out infinite alternate}
#gate .gbg .c2{width:520px;height:520px;background:#DDD6C4;bottom:-260px;inset-inline-start:-120px;animation:gdrift 18s -6s ease-in-out infinite alternate-reverse}
@keyframes gdrift{from{transform:translate(0,0) scale(1)}to{transform:translate(40px,28px) scale(1.07)}}
#gate .gbg b{position:absolute;bottom:-50px;width:var(--sz);height:var(--sz);opacity:0;animation:gfloat var(--d) linear infinite;animation-delay:var(--dl)}
#gate .gbg b::before,#gate .gbg b::after{content:"";position:absolute;background:#c9b79f;border-radius:3px}#gate .gbg b::before{left:0;right:0;top:38%;height:24%}#gate .gbg b::after{top:0;bottom:0;left:38%;width:24%}
@keyframes gfloat{0%{transform:translateY(0) rotate(0);opacity:0}12%{opacity:.55}88%{opacity:.55}100%{transform:translateY(-115vh) rotate(200deg);opacity:0}}
#gate .gbg rect.v{transform-box:fill-box;transform-origin:center;animation:gwave 4.6s ease-in-out infinite}
@keyframes gwave{0%,100%{transform:translateX(0);stroke:#AEB8D9}50%{transform:translateX(7px);stroke:#E3B95B}}
#gate .gbg svg{position:absolute;top:40px;width:130px;height:820px;opacity:.9;overflow:visible}
#gate .gbg svg.s1{inset-inline-start:max(20px,calc(50% - 560px))}#gate .gbg svg.s2{inset-inline-end:max(20px,calc(50% - 560px));transform:scaleY(-1)}
#gate .gmain{position:relative;z-index:2;min-height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:calc(60px + env(safe-area-inset-top)) 16px calc(20px + env(safe-area-inset-bottom))}
#gate .gbrandk{position:fixed;top:calc(14px + env(safe-area-inset-top));inset-inline-start:22px;z-index:6;display:flex;align-items:center;gap:10px;height:38px}#gate .gbrandk b{direction:ltr;font-size:20px;font-weight:700;letter-spacing:.2px;color:var(--es)}#gate .gbrandk svg{width:30px;height:30px;animation:gspinm 16s linear infinite}
@keyframes gspinm{to{transform:rotate(360deg)}}
#gate .gstage{position:relative;width:min(190px,22vh,50vw);margin-bottom:-5px;z-index:1;animation:gpeek .9s .15s cubic-bezier(.2,1.3,.3,1) both}
@keyframes gpeek{from{transform:translateY(70px);opacity:0}to{transform:none;opacity:1}}
#gate .gsay.pop{animation:gpop .45s cubic-bezier(.2,1.5,.3,1)}
@keyframes gpop{from{transform:scale(.6);opacity:0}to{transform:none;opacity:1}}
#gate .gsay{position:absolute;top:10%;inset-inline-start:calc(100% + 8px);padding:8px 14px;border-radius:14px;background:var(--pp);border:1px solid var(--ls);box-shadow:0 8px 20px rgba(0,11,51,.1);font-size:13px;font-weight:600;color:var(--es);white-space:nowrap;transition:opacity .2s}
#gate .gcard{position:relative;z-index:2;width:min(460px,100%);padding:22px 34px 24px;background:var(--pp);border:1px solid var(--ls);border-radius:24px;box-shadow:0 30px 60px rgba(0,11,51,.14);animation:gcardin .8s cubic-bezier(.2,.9,.25,1) both}
@keyframes gcardin{from{opacity:0;transform:translateY(40px) scale(.97)}to{opacity:1;transform:none}}
#gate .gwrap{display:flex;flex-direction:column;gap:12px}
#gate .gwrap.fx>*{opacity:0;animation:gup .6s cubic-bezier(.2,.9,.25,1) forwards}
#gate .gwrap.fx>*:nth-child(2){animation-delay:.08s}#gate .gwrap.fx>*:nth-child(3){animation-delay:.16s}#gate .gwrap.fx>*:nth-child(4){animation-delay:.24s}
@keyframes gup{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes gfade{to{opacity:1}}
#gate .gnote{min-height:40px;display:flex;align-items:center;justify-content:center;text-align:center}#gate .gnote .ge{width:100%;padding:8px 12px;font-size:13px}
#gate h1,#gate h2{margin:0;font-family:inherit;font-weight:700;color:var(--es);line-height:1.35}
#gate h1{font-size:26px}#gate h2{font-size:24px}
#gate p.lead,#gate p.sub{margin:6px 0 0;color:var(--co);font-size:14px;line-height:1.7}
#gate .gc{display:flex;flex-direction:column;gap:14px}
#gate .gtabs{display:flex;border-bottom:1px solid var(--ls)}
#gate .gtabs button{flex:1;padding:12px 0;font-weight:500;font-size:15px;color:var(--co);border-bottom:3px solid transparent;margin-bottom:-1px;transition:color .2s,border-color .2s}
#gate .gtabs button.on{color:var(--es);font-weight:700;border-color:var(--es)}
#gate input,#gate select{width:100%;height:46px;border-radius:12px;border:1px solid var(--kh);background:var(--pp);color:var(--es);-webkit-text-fill-color:var(--es);padding:0 16px;font-size:15px;font-family:inherit;outline:none;transition:border-color .2s,box-shadow .2s}
#gate input::placeholder{color:#8E98BD;-webkit-text-fill-color:#8E98BD}
#gate input:-webkit-autofill,#gate input:-webkit-autofill:hover,#gate input:-webkit-autofill:focus,#gate input:autofill{-webkit-text-fill-color:var(--es);caret-color:var(--es);-webkit-box-shadow:0 0 0 60px var(--pp) inset;transition:background-color 9999s}
#gate input:focus,#gate select:focus{border-color:var(--co);box-shadow:0 0 0 3px rgba(125,90,68,.18)}
#gate select option,#gate select optgroup{background:#fff;color:var(--es)}
#gate .gpw{position:relative}#gate .gpw input{padding-right:52px}#gate .gpw button{position:absolute;top:0;right:2px;height:46px;width:48px;color:var(--co);display:grid;place-items:center}
#gate .gpw button:hover,#gate .gpw button.on{color:var(--es)}
#gate .gb{position:relative;display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:48px;padding:0 18px;border-radius:12px;font-weight:600;font-size:15px;border:1px solid var(--kh);background:#fff;color:var(--es);transition:transform .15s,box-shadow .2s,background .2s}
#gate .gb:hover{background:var(--ln)}#gate .gb:active{transform:scale(.98)}
#gate .gb.pri{background:var(--es);color:var(--ln);border-color:transparent;font-weight:700;font-size:16px;box-shadow:0 8px 20px rgba(0,11,51,.25)}
#gate .gb.pri:hover{background:#3b2820}
#gate .gb.pri{overflow:hidden}#gate .gb.pri::after{content:"";position:absolute;top:0;bottom:0;width:36%;left:-60%;background:linear-gradient(100deg,transparent,rgba(245,241,234,.35),transparent);transform:skewX(-20deg);animation:gshine 4.2s 1.6s ease-in-out infinite}
@keyframes gshine{0%{left:-60%}50%,100%{left:130%}}
#gate input:focus{transform:translateY(-1px)}
#gate .gb[disabled]{opacity:.55;pointer-events:none}
#gate .gor{display:flex;align-items:center;gap:12px;color:var(--co);font-size:13px}
#gate .gor::before,#gate .gor::after{content:"";flex:1;height:1px;background:var(--ls)}
#gate .ge{padding:10px 12px;border-radius:12px;background:#f8e7e2;border:1px solid #e2b3a6;color:#8a2f1c;font-size:14px;line-height:1.6}
#gate .glk{color:var(--co);font-size:14px;text-decoration:underline;text-align:center;cursor:pointer}
#gate .gl{font-size:13px;color:var(--es);margin:4px 0 -6px;font-weight:600}
#gate .gf{margin:0;font-size:12px;color:var(--co);line-height:1.6}
#gate .facs{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;perspective:700px}
#gate .fc{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;min-height:92px;padding:10px 4px;border-radius:14px;background:var(--pp);border:1.5px solid var(--ls);text-align:center;font-size:12.5px;font-weight:600;line-height:1.35;color:var(--es);transform-style:preserve-3d;transition:transform .15s ease,border-color .2s,background .2s,box-shadow .25s}
#gate .fc .em{font-size:28px;transition:transform .25s}
#gate .fc.sel{border-color:var(--c);background:color-mix(in srgb,var(--c) 14%,#fff);box-shadow:0 0 0 2px color-mix(in srgb,var(--c) 40%,transparent),0 10px 22px color-mix(in srgb,var(--c) 26%,transparent)}
#gate .fc.sel .em{transform:scale(1.2) translateY(-2px)}
#gate .fc.sel::after{content:"✓";position:absolute;top:6px;inset-inline-end:8px;font-size:13px;color:var(--es)}
#gate .yrs{display:flex;flex-wrap:wrap;gap:8px}
#gate .yr{min-width:48px;height:42px;padding:0 14px;border-radius:12px;background:var(--pp);border:1.5px solid var(--ls);font-weight:700;color:var(--es);transition:transform .15s,background .2s,border-color .2s}
#gate .yr.sel{background:var(--es);color:var(--ln);border-color:var(--es);transform:translateY(-2px)}
#gate .gcf{position:fixed;inset:0;z-index:5;display:grid;place-items:center;padding:18px;background:rgba(0,11,51,.55);animation:gfade .25s both}
#gate .gcf .gc{max-width:420px;width:100%;padding:24px 22px;border-radius:20px;background:var(--pp);border:1px solid var(--ls);box-shadow:0 24px 70px rgba(0,11,51,.35)}
#gate .gr{display:flex;gap:10px}
#gate .gs{padding:12px;border-radius:12px;background:var(--ln);border:1px solid var(--ls);font-size:14px;line-height:1.9;color:var(--es)}
#gate .glang{position:fixed;top:calc(12px + env(safe-area-inset-top));inset-inline-end:14px;z-index:6;height:38px;padding:0 14px;border-radius:12px;background:var(--pp);border:1px solid var(--kh);color:var(--es);font-weight:600;font-size:13px}
/* Bono */
#gate .bono{display:block;width:100%;height:auto;filter:drop-shadow(0 16px 18px rgba(0,11,51,.22))}
#gate .bono .bb{transform-box:fill-box;transform-origin:50% 100%;animation:gbob 3.6s ease-in-out infinite}
@keyframes gbob{0%,100%{transform:translateY(0) rotate(0)}30%{transform:translateY(-4px) rotate(1.4deg)}70%{transform:translateY(-3px) rotate(-1.4deg)}}
#gate .bono .ey{transform-box:fill-box;transform-origin:center;animation:gblink 5.5s infinite}
@keyframes gblink{0%,93%,100%{transform:scaleY(1)}96%{transform:scaleY(.08)}}
#gate .bono .ir{transition:transform .14s ease-out}
#gate .bono .arm{opacity:0;transform:translateY(40px);transition:opacity .22s,transform .5s cubic-bezier(.3,1.5,.5,1);pointer-events:none}
#gate .bono .arm.dn{opacity:1;transform:none}
#gate .bono .eh,#gate .bono .mo-o,#gate .bono .mf,#gate .bono .sp,#gate .bono .tear,#gate .bono .br{opacity:0;transition:opacity .2s}
#gate .gstage[data-s=cover] .arm.cv,#gate .gstage[data-s=peek] .arm.pk,#gate .gstage[data-s=happy] .arm.hp{opacity:1;transform:none}
#gate .gstage[data-s=cover] .arm.dn,#gate .gstage[data-s=peek] .arm.dn,#gate .gstage[data-s=happy] .arm.dn{opacity:0;transform:translateY(20px)}
#gate .gstage[data-s=happy] .ey,#gate .gstage[data-s=happy] .ms{opacity:0}
#gate .gstage[data-s=happy] .eh,#gate .gstage[data-s=happy] .mo-o,#gate .gstage[data-s=happy] .sp{opacity:1}
#gate .gstage[data-s=happy] .bb{animation:ghop .7s ease-in-out infinite}
@keyframes ghop{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
#gate .gstage[data-s=sad] .ms{opacity:0}#gate .gstage[data-s=sad] .mf,#gate .gstage[data-s=sad] .tear,#gate .gstage[data-s=sad] .br{opacity:1}
#gate .bono .bb.shake{animation:gshake .5s}
@keyframes gshake{0%,100%{transform:none}20%{transform:translateX(-8px) rotate(-2deg)}40%{transform:translateX(8px) rotate(2deg)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}
@media (max-height:820px){#gate .sub{display:none}#gate .gcard{padding:18px 30px 18px}#gate .gmain{padding-top:54px}}
@media (max-width:760px){
 #gate .gbg svg,#gate .gsay{display:none}
 #gate .gcard{padding:20px 22px 24px;border-radius:22px}
 #gate h1{font-size:26px}
 #gate .gstage{width:min(160px,22vh,46vw)}
 #gate .gbrandk{inset-inline-start:14px}
 #gate .gmain{justify-content:flex-start}
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
  const MARK = '<svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true"><circle cx="17" cy="17" r="15" fill="none" stroke="#4A5580" stroke-width="2"/><path d="M17 8v18M11 13h12M12 19h10" stroke="#4A5580" stroke-width="2" stroke-linecap="round"/></svg>';
  const brandRow = () => '';
  const errBox = () => (msg ? `<div class="ge" role="alert">${esc(msg)}</div>` : '');
  const nFacts = () => { const n = (window.CATALOG && CATALOG.length) || 2000; return Math.floor(n / 100) * 100; };
  const EYE = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  const GOOGLE = '<svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.5 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/><path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>';

  function viewAuth() {
    const up = mode === 'up';
    return `<div class="gtabs"><button type="button" class="${up ? 'on' : ''}" data-g="tabup">${T('New account', 'حساب جديد')}</button><button type="button" class="${up ? '' : 'on'}" data-g="tabin">${T('I have an account', 'عندي حساب')}</button></div>
      <div><h1>${up ? T('Create your account', 'أنشئ حسابك') : T('Welcome back', 'نورتنا تاني')}</h1><p class="sub">${up ? T('Sign up once and keep studying on any device.', 'سجّل مرة واحدة وكمّل مذاكرتك على أي جهاز.') : T('Sign in and pick up where you left off.', 'ادخل وكمّل من حيث وقفت.')}</p></div>
      <div class="gc">
        <input id="gEmail" type="email" dir="ltr" autocomplete="email" inputmode="email" aria-label="${T('E-mail', 'البريد الإلكتروني')}" placeholder="${T('E-mail', 'البريد الإلكتروني')}">
        <div class="gpw"><input id="gPass" type="password" dir="ltr" autocomplete="${up ? 'new-password' : 'current-password'}" aria-label="${T('Password', 'كلمة المرور')}" placeholder="${T('Password (6+ characters)', 'كلمة المرور (6 حروف على الأقل)')}"><button type="button" data-g="eye" aria-label="${T('Show password', 'إظهار كلمة المرور')}">${EYE}</button></div>
        <button class="gb pri" data-g="submit" ${busy ? 'disabled' : ''}>${busy ? '…' : up ? T('Create account', 'إنشاء الحساب') : T('Sign in', 'دخول')}</button>
        <div class="gor">${T('or', 'أو')}</div>
        <button class="gb" data-g="google" ${busy ? 'disabled' : ''}>${GOOGLE}${T('Continue with Google', 'المتابعة بحساب Google')}</button>
        <div class="gnote">${msg ? `<div class="ge" role="alert">${esc(msg)}</div>` : up ? `<p class="gf">${T('Sign-up is required once — it personalises the app for your faculty.', 'التسجيل مطلوب مرة واحدة — بيجهّز التطبيق على حسب كليتك.')}</p>` : `<a class="glk" data-g="reset">${T('Forgot password?', 'نسيت كلمة المرور؟')}</a>`}</div></div>`;
  }
  function viewProfile() {
    const full = !(gA() && A.acct && A.acct.uni && A.acct.fac), F = facData(), codes = Object.keys(F);
    const cards = codes.map((c) => { const lk = FAC_LOOK[c] || ['🎓', '#80aad3'], f = F[c]; return `<button type="button" class="fc ${pf.fac === c ? 'sel' : ''}" data-g="fac" data-c="${c}" style="--c:${lk[1]}"><span class="em">${lk[0]}</span><span>${esc(ar() ? f.ar : f.en)}</span></button>`; }).join('');
    const yrs = YEARS.map((y) => `<button type="button" class="yr ${pf.yr === y[0] ? 'sel' : ''}" data-g="yr" data-v="${y[0]}">${T(y[1], y[2])}</button>`).join('');
    const email = (gA() && A.acct && A.acct.email) || '';
    return `${brandRow()}
      <div class="gc"><h2>${T('Tell us about you', 'عرّفنا بنفسك')}</h2><p class="lead">${email ? `<span dir="ltr">${esc(email)}</span> · ` : ''}${full ? T('This sets up the app for your faculty.', 'ده بيجهّز التطبيق على حسب كليتك.') : T('Almost done — just your name and study year.', 'قربنا نخلّص — اسمك وسنتك الدراسية بس.')}</p>
        <div class="gl">${T('Your name', 'اسمك')}</div><input id="gName" autocomplete="off" maxlength="40" value="${esc(pf.name)}" placeholder="${T('Full name', 'الاسم')}">
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
  const panel = () => root;

  /* ───────── Bono behaviour ───────── */
  const SAY = () => ({ idle: T('Hi! I\'m Bono 👋', 'أهلاً! أنا بونو 👋'), cover: T('I\'m not looking… 🙈', 'مش باصص... 🙈'), peek: T('Just a tiny peek 👀', 'بصّة صغننة 👀'), happy: T('Welcome aboard! 🎉', 'أهلاً بيك! 🎉'), sad: T('Hmm, try again', 'جرّب تاني') });
  function bono() {
    if (!root) return; const stg = root.querySelector('.gstage'); if (!stg) return;
    let s = 'idle';
    if (step === 'done') s = 'happy'; else if (pwFocus && step === 'auth') s = pwShow ? 'peek' : 'cover'; else if (msg) s = 'sad';
    stg.dataset.s = s; const say = root.querySelector('.gsay'); if (say && say.textContent !== SAY()[s]) { say.textContent = SAY()[s]; say.classList.remove('pop'); void say.offsetWidth; say.classList.add('pop'); }
    if (s === 'sad' && lastS !== 'sad' && !reduce) { const b = stg.querySelector('.bb'); if (b) { b.classList.remove('shake'); void b.getBoundingClientRect(); b.classList.add('shake'); } }
    lastS = s;
  }
  function look(x, y) {
    const svg = root && root.querySelector('.bono'); if (!svg) return; const r = svg.getBoundingClientRect(); if (!r.width) return;
    const cx = r.left + r.width / 2, cy = r.top + r.height * 0.5;
    const dx = Math.max(-1, Math.min(1, (x - cx) / (innerWidth * 0.35))) * 4, dy = Math.max(-1, Math.min(1, (y - cy) / (innerHeight * 0.35))) * 3.5;
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
    bono();
  }
  const chips = () => `<div><b>${nFacts()}+</b><small>${T('3D models', 'نموذج ثلاثي الأبعاد')}</small></div><div><b>AR · EN</b><small>${T('Arabic & English', 'عربي وإنجليزي')}</small></div><div><b>${T('Quiz', 'كويز')}</b><small>${T('Quizzes & progress', 'اختبارات وتقارير')}</small></div>`;

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
    root.innerHTML = `<div class="gbg"><i class="c1"></i><i class="c2"></i>${FLOATS}<svg class="s1" viewBox="0 0 120 820" aria-hidden="true">${SPINE}</svg><svg class="s2" viewBox="0 0 120 820" aria-hidden="true">${SPINE}</svg></div><div class="gbrandk">${MARK}<b>Anatovia</b></div><div class="gmain"><div class="gstage" data-s="idle"><div class="gsay"></div>${BONO}</div><div class="gcard"><div class="gwrap fx"></div></div></div><button class="glang" type="button"></button>`;
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
    /* faculty.js loads after us: redraw once its lists exist (profile step needs them) */
    const fw = setInterval(() => { if (closed || !root) return clearInterval(fw); if (window.ANAT_FACS && window.ANAT_UNIS) { clearInterval(fw); if (step === 'profile') render(true); } }, 250); setTimeout(() => clearInterval(fw), 20000);
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
