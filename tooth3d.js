/* tooth3d.js — "Tooth gallery 3D" for dentistry: pick any permanent tooth (FDI 11–48) from a list and inspect it alone,
   full resolution (the scans' original triangles), orbit / zoom. Self-contained WebGL1 viewer; each tooth is fetched from
   teeth3d/<key>.bin only when opened (and then cached by the service worker). Models: University of Dundee School of Dentistry, CC BY 4.0. */
'use strict';
window.__tooth3dLoaded = true;
(function () {
  const T = (en, ar) => (S.lang === 'ar' ? ar : en);
  const $ = (id) => document.getElementById(id);
  const waitFor = (fn, cb) => { const t0 = setInterval(() => { if (fn()) { clearInterval(t0); cb(); } }, 200); setTimeout(() => clearInterval(t0), 20000); };

  Object.assign(STR, {
    dent3d: { en: 'Tooth gallery 3D', ar: 'معرض الأسنان 3D' },
    dent3dSub: { en: 'Pick any tooth and study it alone, full detail', ar: 'اختار أي سنّة وذاكرها لوحدها بكل التفاصيل' },
  });

  /* tooth kind → names (index 1..8) */
  const KIND = [null,
    ['Central incisor', 'قاطع مركزي'], ['Lateral incisor', 'قاطع جانبي'], ['Canine', 'ناب'], ['First premolar', 'ضاحك أول'],
    ['Second premolar', 'ضاحك ثاني'], ['First molar', 'ضرس أول'], ['Second molar', 'ضرس ثاني'], ['Third molar (wisdom)', 'ضرس العقل']];
  const QUAD = { 1: ['Upper right', 'علوي أيمن'], 2: ['Upper left', 'علوي أيسر'], 3: ['Lower left', 'سفلي أيسر'], 4: ['Lower right', 'سفلي أيمن'] };
  /* the scans are left-side teeth (quadrants 2 and 3); the right side is the mirror image */
  const keyOf = (fdi, variant) => (fdi >= 30 ? 'man' : 'max') + (fdi % 10) + (variant ? 'c' : '');
  const mirrored = (fdi) => { const q = Math.floor(fdi / 10); return q === 1 || q === 4; };
  const ROWS = [[18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28], [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]];

  /* ───────── list ───────── */
  function list() {
    const btn = (f) => `<button class="opt t3b" data-act="t3open" data-f="${f}"><b dir="ltr">${f}</b><small>${T(KIND[f % 10][0], KIND[f % 10][1])}</small></button>`;
    const side = (arr) => `<div class="t3row">${arr.map(btn).join('')}</div>`;
    return `<h2>🦷 ${T('Tooth gallery 3D', 'معرض الأسنان 3D')}</h2><p class="lead">${T('Tap a tooth to open it alone — drag to rotate, pinch or scroll to zoom. Full-detail scans.', 'اضغط على سنّة تتفتح لوحدها — اسحب علشان تلفّها وكبّر بإصبعين أو بالعجلة. نماذج بتفاصيلها الكاملة.')}</p>` +
      `<h4>${T('Upper jaw', 'الفك العلوي')}</h4><p class="tiny">${T('Right', 'أيمن')} ⟵ ⟶ ${T('Left', 'أيسر')}</p>${side(ROWS[0])}` +
      `<h4>${T('Lower jaw', 'الفك السفلي')}</h4><p class="tiny">${T('Right', 'أيمن')} ⟵ ⟶ ${T('Left', 'أيسر')}</p>${side(ROWS[1])}` +
      `<p class="tiny">${T('Permanent teeth (FDI numbering). Models: University of Dundee School of Dentistry, CC BY 4.0.', 'الأسنان الدائمة (ترقيم FDI). النماذج: كلية طب الأسنان بجامعة دندي، ترخيص CC BY 4.0.')}</p>`;
  }
  const css = document.createElement('style');
  css.textContent = '.t3row{display:grid;grid-template-columns:repeat(8,1fr);gap:6px;margin:6px 0 12px;direction:ltr}.t3b{display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 2px;min-width:0}.t3b b{font-size:15px}.t3b small{font-size:9.5px;line-height:1.2;text-align:center;color:var(--muted);overflow:hidden;max-width:100%}' +
    '@media (max-width:520px){.t3row{grid-template-columns:repeat(4,1fr)}}' +
    '.t3stage{position:relative;height:min(58vh,430px);border-radius:18px;overflow:hidden;background:radial-gradient(circle at 50% 38%,var(--surface2),var(--bg2));border:1px solid var(--line);touch-action:none}.t3stage canvas{width:100%;height:100%;display:block;cursor:grab}.t3stage canvas:active{cursor:grabbing}' +
    '.t3msg{position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:20px;color:var(--muted);font-size:14px;pointer-events:none}.t3info{margin:10px 0 4px}.t3info b{font-size:20px}.t3info small{display:block;color:var(--muted)}';
  document.head.appendChild(css);

  /* ───────── data ───────── */
  const cache = {};
  async function load(key) {
    if (cache[key]) return cache[key];
    const r = await fetch('teeth3d/' + key + '.bin');
    if (!r.ok) throw new Error('http ' + r.status);
    const buf = await r.arrayBuffer(), hl = new DataView(buf).getUint32(0, true);
    const hdr = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 4, hl))), base = 4 + hl;
    hdr.parts.forEach((p) => {
      p.pos = new Uint16Array(buf, base + p.pos, p.nv * 3); p.nor = new Int16Array(buf, base + p.nor, p.nv * 3);
      p.uv = new Uint16Array(buf, base + p.uv, p.nv * 2); p.idx = new Uint16Array(buf, base + p.idx, p.ni);
    });
    hdr.tex = hdr.tex.map((t) => new Blob([new Uint8Array(buf, base + t.off, t.len)], { type: 'image/jpeg' }));
    return (cache[key] = hdr);
  }

  /* ───────── viewer ───────── */
  const VS = 'attribute vec3 aPos;attribute vec3 aNor;attribute vec2 aUv;uniform mat4 uVP;uniform mat3 uM;uniform float uMir;varying vec3 vN;varying vec2 vUv;varying vec3 vP;void main(){vec3 p=aPos;p.x*=uMir;vN=uM*(aNor*vec3(uMir,1.0,1.0));vUv=aUv;vP=p;gl_Position=uVP*vec4(p,1.0);}';
  const FS = 'precision mediump float;varying vec3 vN;varying vec2 vUv;varying vec3 vP;uniform sampler2D uTex;uniform float uUseTex;uniform vec3 uCol;uniform vec3 uEye;' +
    'void main(){vec3 base=uUseTex>0.5?texture2D(uTex,vUv).rgb:uCol;vec3 n=normalize(vN);vec3 v=normalize(uEye-vP);if(dot(n,v)<0.0)n=-n;' +
    'vec3 l1=normalize(vec3(.45,.8,.55));vec3 l2=normalize(vec3(-.6,.2,.5));float d=max(dot(n,l1),0.0)*.78+max(dot(n,l2),0.0)*.28;float h=.5+.5*n.y;' +
    'vec3 hv=normalize(l1+v);float sp=pow(max(dot(n,hv),0.0),48.0)*.22;float rim=pow(1.0-max(dot(n,v),0.0),3.0)*.12;' +
    'vec3 c=base*(.30+.18*h+d)+vec3(sp)+vec3(rim);gl_FragColor=vec4(pow(c,vec3(.95)),1.0);}';

  let cur = null; // current viewer
  function stop() { if (cur) { cur.dead = true; try { const x = cur.gl.getExtension('WEBGL_lose_context'); if (x) x.loseContext(); } catch (e) { /* ignore */ } cur = null; } }

  function sh(gl, type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }

  function viewer(cv, data, mir) {
    const gl = cv.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: false }) || cv.getContext('experimental-webgl');
    if (!gl) throw new Error('no webgl');
    const pr = gl.createProgram(); gl.attachShader(pr, sh(gl, gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl, gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error('link');
    gl.useProgram(pr);
    const loc = (n) => gl.getUniformLocation(pr, n), at = (n) => gl.getAttribLocation(pr, n);
    const U = { vp: loc('uVP'), m: loc('uM'), mir: loc('uMir'), tex: loc('uTex'), use: loc('uUseTex'), col: loc('uCol'), eye: loc('uEye') };
    const buf = (target, arr) => { const b = gl.createBuffer(); gl.bindBuffer(target, b); gl.bufferData(target, arr, gl.STATIC_DRAW); return b; };
    const parts = data.parts.map((p) => {
      // positions: uint16 → float in [-1,1]
      const pos = new Float32Array(p.nv * 3); for (let i = 0; i < pos.length; i++) pos[i] = (p.pos[i] / 65535) * 2 - 1;
      const nor = new Float32Array(p.nv * 3); for (let i = 0; i < nor.length; i++) nor[i] = p.nor[i] / 32767;
      const uv = new Float32Array(p.nv * 2); for (let i = 0; i < uv.length; i++) uv[i] = p.uv[i] / 65535;
      return { n: p.ni, bp: buf(gl.ARRAY_BUFFER, pos), bn: buf(gl.ARRAY_BUFFER, nor), bu: buf(gl.ARRAY_BUFFER, uv), bi: buf(gl.ELEMENT_ARRAY_BUFFER, p.idx), tex: p.tex, col: p.col, t: null };
    });
    const texs = {};
    const st = { gl, dead: false, yaw: 0.6, pitch: 0.12, dist: 3.4, vy: 0, vx: 0, drag: false, mir: mir ? -1 : 1, auto: true, parts };
    data.tex.forEach((blob, i) => {
      const url = URL.createObjectURL(blob), im = new Image();
      im.onload = () => {
        if (st.dead) { URL.revokeObjectURL(url); return; }
        const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, im);
        gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        const ex = gl.getExtension('EXT_texture_filter_anisotropic'); if (ex) gl.texParameterf(gl.TEXTURE_2D, ex.TEXTURE_MAX_ANISOTROPY_EXT, 4);
        texs[i] = t; URL.revokeObjectURL(url);
      };
      im.src = url;
    });
    gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE); gl.clearColor(0, 0, 0, 0);

    const size = () => { const d = Math.min(window.devicePixelRatio || 1, 2), w = Math.max(2, Math.round(cv.clientWidth * d)), h = Math.max(2, Math.round(cv.clientHeight * d)); if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; } gl.viewport(0, 0, w, h); };
    let last = performance.now();
    function frame(now) {
      if (st.dead || !cv.isConnected || cv.offsetParent === null) { stop(); return; }
      const dt = Math.min(0.05, (now - last) / 1000); last = now; size();
      if (!st.drag) { st.yaw += st.vy; st.pitch += st.vx; st.vy *= 0.92; st.vx *= 0.92; if (st.auto) st.yaw += dt * 0.35; }
      st.pitch = Math.max(-1.5, Math.min(1.5, st.pitch));
      const cy = Math.cos(st.yaw), sy = Math.sin(st.yaw), cp = Math.cos(st.pitch), sp = Math.sin(st.pitch);
      const eye = [st.dist * cp * sy, st.dist * sp, st.dist * cp * cy];
      const proj = mat4Perspective(0.62, cv.width / cv.height, 0.1, 20), view = mat4LookAt(eye, [0, 0, 0], [0, 1, 0]);
      gl.uniformMatrix4fv(U.vp, false, mat4Mul(proj, view)); gl.uniformMatrix3fv(U.m, false, new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]));
      gl.uniform1f(U.mir, st.mir); gl.uniform3f(U.eye, eye[0] * st.mir, eye[1], eye[2]); gl.uniform1i(U.tex, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      parts.forEach((p) => {
        const t = p.tex >= 0 ? texs[p.tex] : null;
        gl.uniform1f(U.use, t ? 1 : 0); gl.uniform3f(U.col, p.col[0], p.col[1], p.col[2]); if (t) { gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, t); }
        const bind = (b, a, n) => { gl.bindBuffer(gl.ARRAY_BUFFER, b); const l = at(a); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, n, gl.FLOAT, false, 0, 0); };
        bind(p.bp, 'aPos', 3); bind(p.bn, 'aNor', 3); bind(p.bu, 'aUv', 2);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, p.bi); gl.drawElements(gl.TRIANGLES, p.n, gl.UNSIGNED_SHORT, 0);
      });
      requestAnimationFrame(frame);
    }
    /* pointer: one finger / mouse rotates, two fingers pinch, wheel zooms */
    const pts = new Map(); let pd = 0;
    cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); st.drag = true; st.auto = false; st.vx = st.vy = 0; if (pts.size === 2) { const [a, b] = [...pts.values()]; pd = Math.hypot(a[0] - b[0], a[1] - b[1]); } });
    cv.addEventListener('pointermove', (e) => {
      if (!pts.has(e.pointerId)) return; const o = pts.get(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size >= 2) { const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pd) st.dist = Math.max(1.6, Math.min(7, st.dist * pd / d)); pd = d; return; }
      const dx = e.clientX - o[0], dy = e.clientY - o[1]; st.yaw -= dx * 0.008; st.pitch += dy * 0.008; st.vy = -dx * 0.002; st.vx = dy * 0.002;
    });
    const up = (e) => { pts.delete(e.pointerId); pd = 0; if (!pts.size) st.drag = false; };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', (e) => { e.preventDefault(); st.dist = Math.max(1.6, Math.min(7, st.dist * (e.deltaY > 0 ? 1.1 : 0.9))); st.auto = false; }, { passive: false });
    st.reset = () => { st.yaw = 0.6; st.pitch = 0.12; st.dist = 3.4; st.vx = st.vy = 0; st.auto = true; };
    requestAnimationFrame(frame);
    return st;
  }

  /* ───────── tooth page ───────── */
  let curF = 0, curVar = false;
  function open(f, variant) {
    stop(); curF = f; curVar = !!variant;
    const q = Math.floor(f / 10), k = KIND[f % 10], hasVar = f % 10 === 6 && f < 30;
    A.modal(() => `<h2>🦷 <span dir="ltr">${f}</span></h2><div class="t3stage" id="t3stage"><canvas id="t3cv"></canvas><div class="t3msg" id="t3msg">${T('Loading…', 'جارِ التحميل…')}</div></div>` +
      `<div class="t3info"><b>${T(k[0], k[1])}${curVar ? ' — ' + T('Cusp of Carabelli', 'حدبة كاربيللي') : ''}</b><small>${T(QUAD[q][0], QUAD[q][1])} · FDI <span dir="ltr">${f}</span> · ${T('permanent', 'دائمة')}</small></div>` +
      `<div class="row" style="margin-top:6px"><button class="btn" data-act="t3list">← ${T('All teeth', 'كل الأسنان')}</button><button class="btn" data-act="t3reset">⟲ ${T('Reset view', 'رجّع الزاوية')}</button>` +
      (hasVar ? `<button class="btn ${curVar ? 'primary' : ''}" data-act="t3var">${curVar ? T('Normal first molar', 'الضرس الأول العادي') : T('With Carabelli cusp', 'مع حدبة كاربيللي')}</button>` : '') + `</div>`);
    const msg = $('t3msg'), cv = $('t3cv');
    load(keyOf(f, curVar)).then((d) => {
      if (curF !== f || !cv.isConnected) return;
      try { cur = viewer(cv, d, mirrored(f)); msg.remove(); } catch (e) { msg.textContent = T('Your device could not start the 3D view.', 'جهازك مقدرش يشغّل العرض 3D.'); }
    }).catch(() => { if (msg.isConnected) msg.textContent = T('Could not load this tooth — it needs an internet connection the first time.', 'مقدرناش نحمّل السنّة دي — أول مرة بتحتاج إنترنت.'); });
  }
  A.acts.t3open = (el) => open(+el.dataset.f);
  A.acts.t3list = () => { stop(); curF = 0; A.modal(list); };
  A.acts.t3reset = () => { if (cur) cur.reset(); };
  A.acts.t3var = () => open(curF, !curVar);

  waitFor(() => A.hubExtra && A.modal, () => { A.hubExtra.dent3d = () => { stop(); A.modal(list); }; });
})();
