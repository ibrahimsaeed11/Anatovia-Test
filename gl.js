/* gl.js — tiny dependency-free WebGL renderer: orbit camera (360° yaw, never below
   the floor), lighting, ghost layers, floor, and colour-ID picking. Classic script. */
'use strict';

const V3 = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  len: (a) => Math.hypot(a[0], a[1], a[2]),
  norm(a) { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t],
};
function mat4Perspective(fovy, aspect, near, far) {
  const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
}
function mat4LookAt(eye, target, up) {
  const z = V3.norm(V3.sub(eye, target)), x = V3.norm(V3.cross(up, z)), y = V3.cross(z, x);
  return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0,
    -V3.dot(x, eye), -V3.dot(y, eye), -V3.dot(z, eye), 1]);
}
function mat4Mul(a, b) {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++)
    o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
  return o;
}

/* ───────────── orbit camera ───────────── */
const PITCH_MIN = -1.45;  // can look up at the model from below (the floor is hidden then)
const PITCH_MAX = 1.50;
class OrbitCamera {
  constructor() {
    this.defaults = { target: [0, 0.88, 0], dist: 3.5, yaw: 0, pitch: 0.12 };
    this.target = this.defaults.target.slice(); this.dist = this.defaults.dist;
    this.yaw = 0; this.pitch = this.defaults.pitch;
    this.fov = 36 * Math.PI / 180; this.aspect = 1;
    this.vy = 0; this.vp = 0;      // angular velocity (inertia)
    this.distGoal = this.dist;     // smoothed zoom
    this.goal = null; this.spin = false;
    this.minDist = 0.28; this.maxDist = 6;
  }
  get eye() {
    const d = this.dist, cp = Math.cos(this.pitch);
    return [this.target[0] + d * cp * Math.sin(this.yaw), this.target[1] + d * Math.sin(this.pitch), this.target[2] + d * cp * Math.cos(this.yaw)];
  }
  get right() { return V3.norm(V3.cross([0, 1, 0], V3.sub(this.eye, this.target))); }
  get up() { const f = V3.norm(V3.sub(this.eye, this.target)); return V3.norm(V3.cross(f, V3.cross([0, 1, 0], f))); }
  orbit(dx, dy) {
    this.goal = null;
    const k = 0.0075;
    this.yaw -= dx * k; this.pitch += dy * k;
    this.pitch = Math.max(PITCH_MIN, Math.min(PITCH_MAX, this.pitch));
    this._vy = -dx * k; this._vp = dy * k; this._t = performance.now();
  }
  release() {
    const fresh = performance.now() - (this._t || 0) < 70, cap = (v) => Math.max(-0.05, Math.min(0.05, v));
    this.vy = fresh ? cap(this._vy || 0) : 0; this.vp = fresh ? cap(this._vp || 0) : 0; this._vy = this._vp = 0;
  }
  pan(dx, dy, viewH) {
    this.goal = null;
    const s = (2 * this.dist * Math.tan(this.fov / 2)) / viewH;
    const r = this.right, u = this.up;
    this.target = V3.add(this.target, V3.add(V3.mul(r, -dx * s), V3.mul(u, dy * s)));
    this.target[1] = Math.max(0.05, Math.min(1.75, this.target[1]));
    this.target[0] = Math.max(-1.2, Math.min(1.2, this.target[0]));
    this.target[2] = Math.max(-1.2, Math.min(1.2, this.target[2]));
  }
  zoom(f) { this.goal = null; this.distGoal = Math.max(this.minDist, Math.min(this.maxDist, this.distGoal * f)); }
  flyTo(target, dist, yaw = null, pitch = null) {
    dist = Math.max(this.minDist, Math.min(this.maxDist, dist));
    this.goal = { target, dist, yaw, pitch }; this.vy = this.vp = 0; this.distGoal = dist;
  }
  reset() { const d = this.defaults; this.flyTo(d.target.slice(), d.dist, d.yaw, d.pitch); }
  /** advance; returns true while still moving (renderer must keep drawing) */
  update(dt) {
    dt = Math.max(0.001, Math.min(0.05, dt || 0.016));
    let moving = false;
    if (this.goal) {
      const g = this.goal, k = 1 - Math.pow(0.0008, dt);
      this.target = V3.lerp(this.target, g.target, k);
      this.dist += (g.dist - this.dist) * k;
      if (g.yaw !== null) { let d = g.yaw - this.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); this.yaw += d * k; }
      if (g.pitch !== null) this.pitch += (Math.max(PITCH_MIN, Math.min(PITCH_MAX, g.pitch)) - this.pitch) * k;
      const done = V3.len(V3.sub(g.target, this.target)) < 0.002 && Math.abs(g.dist - this.dist) < 0.004 &&
        (g.yaw === null || Math.abs(Math.atan2(Math.sin(g.yaw - this.yaw), Math.cos(g.yaw - this.yaw))) < 0.01) &&
        (g.pitch === null || Math.abs(Math.max(PITCH_MIN, Math.min(PITCH_MAX, g.pitch)) - this.pitch) < 0.01);
      if (done) this.goal = null;
      moving = true;
    } else if (Math.abs(this.distGoal - this.dist) > 1e-4) {
      this.dist += (this.distGoal - this.dist) * (1 - Math.pow(0.0006, dt)); moving = true;
    }
    if (Math.abs(this.vy) > 1e-4 || Math.abs(this.vp) > 1e-4) {
      const q = Math.min(dt, 0.05) * 60; this.yaw += this.vy * q; this.pitch = Math.max(PITCH_MIN, Math.min(PITCH_MAX, this.pitch + this.vp * q));
      const f = Math.pow(0.003, dt); this.vy *= f; this.vp *= f; moving = true;
    }
    if (this.spin && !this.dragging) { this.yaw += dt * 1.0; moving = true; }
    return moving;
  }
  matrices() {
    const near = Math.max(0.03, this.dist * 0.08);
    const proj = mat4Perspective(this.fov, this.aspect, near, 30);
    const view = mat4LookAt(this.eye, this.target, [0, 1, 0]);
    return { vp: mat4Mul(proj, view), eye: this.eye };
  }
}

/* ───────────── shaders ───────────── */
const VS = `
attribute vec3 aPos; attribute vec3 aNor;
uniform mat4 uVP; uniform vec3 uOff; uniform vec3 uLo; uniform vec3 uSpan;
uniform mat3 uRot; uniform vec3 uPiv; uniform float uMode; uniform float uK; uniform vec3 uA; uniform vec4 uDL;
varying vec3 vN; varying vec3 vP;
void main(){
  vec3 p = uLo + aPos * uSpan + uOff; vec3 n = aNor;
  if (uMode > 0.5) {   // 1 = rigid rotation about a joint pivot; 2 = muscle: only the part nearest the insertion (fraction beyond uK) follows the rotating bone, the belly stays anchored
    vec3 q = uPiv + uRot * (p - uPiv); vec3 nn = uRot * aNor; float w = 1.0;
    if (uMode > 1.5) { float tt = clamp(dot(p - uA, uDL.xyz) / uDL.w, 0.0, 1.0); float x = clamp((tt - uK) / max(1.0 - uK, 0.05), 0.0, 1.0); w = x * x * (3.0 - 2.0 * x); }
    p = mix(p, q, w); n = mix(aNor, nn, w);
  }
  vP = p; vN = n; gl_Position = uVP * vec4(p,1.0);
}`;
const FS = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec3 vN; varying vec3 vP;
#SPOTDECL
uniform vec3 uColor; uniform vec4 uTint; uniform vec3 uEye; uniform vec3 uKey; uniform vec3 uFill; uniform float uAlpha; uniform float uLight; uniform vec4 uClip; uniform vec4 uTa; uniform vec4 uTr;
void main(){
  bool clipOn = dot(uClip.xyz, uClip.xyz) > 0.0;
  if (clipOn && dot(vP, uClip.xyz) > uClip.w) discard;
  if (clipOn && !gl_FrontFacing) { vec3 cc = vec3(0.90, 0.58, 0.55) * (0.78 + 0.22 * uLight); gl_FragColor = vec4(cc * uAlpha, uAlpha); return; }
  vec3 n = normalize(vN); vec3 v = normalize(uEye - vP);
  if (dot(n, v) < 0.0) n = -n;
  float d1 = max(dot(n, uKey), 0.0), d2 = max(dot(n, uFill), 0.0);
  float hemi = n.y * 0.5 + 0.5;
  vec3 amb = mix(vec3(0.24,0.22,0.22), vec3(0.50,0.52,0.56), hemi);
  vec3 base = uColor;
  if (uTr.w > 0.5) { float kr = smoothstep(-0.0009, 0.0009, dot(vP, uTa.xyz) - uTa.w); base = mix(uColor, uTr.xyz, kr); }   // tooth: root tinted below the cervical plane
  base = mix(base, uTint.rgb, uTint.a);
#SPOTLOOP
  vec3 col = base * (amb + d1 * 0.74 + d2 * 0.24);
  vec3 h = normalize(uKey + v);
  col += vec3(0.30,0.28,0.24) * pow(max(dot(n, h), 0.0), 40.0) * 0.30;
  float rim = pow(1.0 - max(dot(n, v), 0.0), 3.0);
  col += uTint.rgb * rim * 0.10 * uTint.a + vec3(0.10,0.14,0.18) * rim * 0.35 * uLight;
  gl_FragColor = vec4(col * uAlpha, uAlpha);
}`;
const SPOT_DECL = (N) => N ? `uniform vec4 uSp[${N}]; uniform vec3 uSc[${N}]; uniform float uSn;` : '';
const SPOT_LOOP = (N) => N ? `{ float bw = 0.0; vec3 bc = base; for (int k = 0; k < ${N}; k++) { if (float(k) >= uSn) break; float dd = distance(vP, uSp[k].xyz); float w = 1.0 - smoothstep(uSp[k].w * 0.62, uSp[k].w, dd); if (w > bw) { bw = w; bc = uSc[k]; } } base = mix(base, bc, bw * 0.92); }` : '';
const FS_PICK = `precision mediump float; varying vec3 vP; uniform vec3 uId; uniform vec4 uClip; void main(){ if (dot(uClip.xyz, uClip.xyz) > 0.0 && dot(vP, uClip.xyz) > uClip.w) discard; gl_FragColor = vec4(uId, 1.0); }`;
const VS_FLOOR = `attribute vec3 aPos; uniform mat4 uVP; varying vec3 vW; void main(){ vW = aPos; gl_Position = uVP * vec4(aPos,1.0); }`;
const FS_FLOOR = `
precision mediump float; varying vec3 vW; uniform vec3 uFloorCol; uniform vec3 uLine; uniform float uDark;
void main(){
  float r = length(vW.xz);
  float fade = 1.0 - smoothstep(0.35, 2.6, r);
  float shadow = (1.0 - smoothstep(0.06, 0.62, length(vec2(vW.x*0.9, vW.z*1.25)))) * 0.55;
  float ring = 0.0;
  float rr = fract(r / 0.5);
  ring = (1.0 - smoothstep(0.0, 0.02, abs(rr - 0.0))) * 0.5 + (1.0 - smoothstep(0.0, 0.02, abs(rr - 1.0))) * 0.5;
  float ang = atan(vW.z, vW.x); float spoke = (1.0 - smoothstep(0.0, 0.02, abs(fract(ang / 0.5236 + 0.5) - 0.5))) * smoothstep(0.1, 0.3, r);
  float line = clamp(ring + spoke * 0.6, 0.0, 1.0) * 0.28 * fade;
  vec3 col = mix(uFloorCol, uLine, line);
  float a = fade * 0.92;
  col = mix(col, vec3(0.0), shadow * uDark);
  a = max(a, shadow * 0.9);
  gl_FragColor = vec4(col * a, a);
}`;

class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    const opts = { antialias: true, alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: false, powerPreference: 'high-performance' };
    const gl = canvas.getContext('webgl', opts) || canvas.getContext('experimental-webgl', opts);
    if (!gl) throw new Error('webgl-unsupported');
    this.gl = gl;
    let nsp = 32; try { const mv = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS); nsp = Math.max(0, Math.min(32, Math.floor((mv - 24) / 2))); } catch (e) { nsp = 0; } if (nsp < 8) nsp = 0;
    this.nsp = nsp;
    this.prog = this._program(VS, FS.replace('#SPOTDECL', SPOT_DECL(nsp)).replace('#SPOTLOOP', SPOT_LOOP(nsp)), ['uVP', 'uOff', 'uLo', 'uSpan', 'uColor', 'uTint', 'uEye', 'uKey', 'uFill', 'uAlpha', 'uLight', 'uClip', 'uRot', 'uPiv', 'uMode', 'uK', 'uA', 'uDL', 'uTa', 'uTr'].concat(nsp ? ['uSp', 'uSc', 'uSn'] : []));
    this.pickProg = this._program(VS, FS_PICK, ['uVP', 'uOff', 'uLo', 'uSpan', 'uId', 'uClip', 'uRot', 'uPiv', 'uMode', 'uK', 'uA', 'uDL']);
    this.floorProg = this._program(VS_FLOOR, FS_FLOOR, ['uVP', 'uFloorCol', 'uLine', 'uDark']);
    this.items = []; this.fbo = null; this.pickW = 0; this.pickH = 0; this.dpr = 1;
    this.floorY = -0.002; this.floorCol = [0.55, 0.6, 0.7]; this.lineCol = [1, 1, 1]; this.floorDark = 1; this.light = 1; this.clip = [0, 0, 0, 0];
    // floor disc
    const seg = 64, R = 4, v = [0, this.floorY, 0];
    for (let i = 0; i <= seg; i++) { const a = i / seg * Math.PI * 2; v.push(Math.cos(a) * R, this.floorY, Math.sin(a) * R); }
    this.floorBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.floorBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.STATIC_DRAW); this.floorN = seg + 2;
    gl.enable(gl.DEPTH_TEST);
  }
  _compile(type, src) {
    const gl = this.gl, s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  _program(vs, fs, uniforms) {
    const gl = this.gl, p = gl.createProgram();
    gl.attachShader(p, this._compile(gl.VERTEX_SHADER, vs)); gl.attachShader(p, this._compile(gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(p, 0, 'aPos'); gl.bindAttribLocation(p, 1, 'aNor');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}; uniforms.forEach((n) => { u[n] = gl.getUniformLocation(p, n); });
    return { p, u };
  }
  addPacked(pt, id, index) {
    const gl = this.gl;
    const mk = (target, data) => { const b = gl.createBuffer(); gl.bindBuffer(target, b); gl.bufferData(target, data, gl.STATIC_DRAW); return b; };
    const item = { id, index, pb: mk(gl.ARRAY_BUFFER, pt.pos), nb: mk(gl.ARRAY_BUFFER, pt.nor), ib: mk(gl.ELEMENT_ARRAY_BUFFER, pt.idx),
      count: pt.idx.length, vpos: pt.pos, lo: pt.lo, span: pt.span, offset: [0, 0, 0], goalOff: [0, 0, 0],
      tint: [0, 0, 0, 0], color: [0.93, 0.89, 0.8], alpha: 1, visible: false, pickable: false };
    this.items.push(item); return item;
  }
  resize(w, h, dpr) {
    this.dpr = dpr;
    const W = Math.max(2, Math.round(w * dpr)), H = Math.max(2, Math.round(h * dpr));
    if (this.canvas.width !== W || this.canvas.height !== H) { this.canvas.width = W; this.canvas.height = H; }
    this.gl.viewport(0, 0, W, H);
  }
  _bind(it, pr) {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, it.pb); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.UNSIGNED_SHORT, true, 6, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, it.nb); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.BYTE, true, 4, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, it.ib);
    gl.uniform3fv(pr.u.uLo, it.lo); gl.uniform3fv(pr.u.uSpan, it.span);
  }
  /** ease item offsets toward their goals; returns true while animating */
  animate(dt) {
    let moving = false; const k = 1 - Math.pow(0.002, dt);
    for (const it of this.items) {
      if (!it.visible) { it.offset = it.goalOff.slice(); continue; }
      for (let d = 0; d < 3; d++) {
        const df = it.goalOff[d] - it.offset[d];
        if (Math.abs(df) > 1e-4) { it.offset[d] += df * k; moving = true; } else it.offset[d] = it.goalOff[d];
      }
    }
    return moving;
  }
  draw(cam) {
    const gl = this.gl, { vp, eye } = cam.matrices();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    // floor
    const fp = this.floorProg; gl.useProgram(fp.p);
    gl.uniformMatrix4fv(fp.u.uVP, false, vp); gl.uniform3fv(fp.u.uFloorCol, this.floorCol); gl.uniform3fv(fp.u.uLine, this.lineCol); gl.uniform1f(fp.u.uDark, this.floorDark);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.floorBuf); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, 0); gl.disableVertexAttribArray(1);
    if (!this.noFloor && eye[1] > 0.02) { gl.depthMask(false); gl.drawArrays(gl.TRIANGLE_FAN, 0, this.floorN); gl.depthMask(true); }
    // model
    const pr = this.prog; gl.useProgram(pr.p);
    gl.uniformMatrix4fv(pr.u.uVP, false, vp); gl.uniform3fv(pr.u.uEye, eye); gl.uniform1f(pr.u.uLight, this.light); gl.uniform4fv(pr.u.uClip, this.clip);
    const f = V3.norm(V3.sub(eye, cam.target)), r = cam.right, u = cam.up;
    gl.uniform3fv(pr.u.uKey, V3.norm(V3.add(V3.add(V3.mul(f, 0.7), V3.mul(u, 0.55)), V3.mul(r, -0.45))));
    gl.uniform3fv(pr.u.uFill, V3.norm(V3.add(V3.add(V3.mul(f, 0.4), V3.mul(u, -0.1)), V3.mul(r, 0.8))));
    const pass = (ghost) => {
      for (const it of this.items) {
        if (!it.visible || (it.alpha < 0.999) !== ghost) continue;
        this._bind(it, pr);
        gl.uniform3fv(pr.u.uOff, it.offset); gl.uniform3fv(pr.u.uColor, it.color); gl.uniform4fv(pr.u.uTint, it.tint);
        gl.uniform1f(pr.u.uAlpha, it.alpha);
        { const rt = it.root; if (rt) { gl.uniform4f(pr.u.uTa, rt.n[0], rt.n[1], rt.n[2], rt.d + rt.n[0] * it.offset[0] + rt.n[1] * it.offset[1] + rt.n[2] * it.offset[2]); gl.uniform4f(pr.u.uTr, rt.col[0], rt.col[1], rt.col[2], 1); } else gl.uniform4f(pr.u.uTr, 0, 0, 0, 0); }
        { const an = it.anim; if (an) { gl.uniform1f(pr.u.uMode, an.mode); gl.uniform1f(pr.u.uK, an.k || 0); gl.uniformMatrix3fv(pr.u.uRot, false, an.rot); gl.uniform3fv(pr.u.uPiv, an.piv); gl.uniform3fv(pr.u.uA, an.a); gl.uniform4fv(pr.u.uDL, an.dl); } else gl.uniform1f(pr.u.uMode, 0); }
        if (this.nsp) { const sp = it.spots; if (sp) { gl.uniform4fv(pr.u.uSp, sp.pos); gl.uniform3fv(pr.u.uSc, sp.col); gl.uniform1f(pr.u.uSn, sp.n); } else gl.uniform1f(pr.u.uSn, 0); }
        gl.drawElements(gl.TRIANGLES, it.count, gl.UNSIGNED_SHORT, 0);
      }
    };
    pass(false);
    gl.depthMask(false); pass(true); gl.depthMask(true);
  }
  _ensureFbo() {
    const gl = this.gl, W = this.canvas.width, H = this.canvas.height;
    if (this.fbo && this.pickW === W && this.pickH === H) return;
    if (this.fbo) { gl.deleteFramebuffer(this.fbo.f); gl.deleteTexture(this.fbo.t); gl.deleteRenderbuffer(this.fbo.d); }
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    const d = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, d); gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, W, H);
    const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, d);
    this.fbo = { f, t, d }; this.pickW = W; this.pickH = H;
  }
  /** index of the pickable item under CSS pixel (x,y), or -1 */
  pick(cam, x, y) {
    const gl = this.gl; this._ensureFbo();
    const { vp } = cam.matrices();
    gl.disable(gl.BLEND);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo.f); gl.viewport(0, 0, this.pickW, this.pickH);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const pr = this.pickProg; gl.useProgram(pr.p); gl.uniformMatrix4fv(pr.u.uVP, false, vp); gl.uniform4fv(pr.u.uClip, this.clip);
    for (const it of this.items) {
      if (!it.visible || !it.pickable) continue;
      const id = it.index + 1; this._bind(it, pr);
      gl.uniform3fv(pr.u.uOff, it.offset); gl.uniform3f(pr.u.uId, (id & 255) / 255, ((id >> 8) & 255) / 255, 0);
      gl.drawElements(gl.TRIANGLES, it.count, gl.UNSIGNED_SHORT, 0);
    }
    const px = Math.floor(x * this.dpr), py = this.pickH - 1 - Math.floor(y * this.dpr);
    const rad = Math.max(1, Math.round(6 * this.dpr)), size = rad * 2 + 1;
    const x0 = Math.max(0, px - rad), y0 = Math.max(0, py - rad);
    const w = Math.min(size, this.pickW - x0), h = Math.min(size, this.pickH - y0);
    if (w <= 0 || h <= 0) { gl.bindFramebuffer(gl.FRAMEBUFFER, null); return -1; }
    const buf = new Uint8Array(w * h * 4); gl.readPixels(x0, y0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, this.canvas.width, this.canvas.height); gl.enable(gl.BLEND);
    const read = (cx, cy) => { const k = ((cy - y0) * w + (cx - x0)) * 4; if (cx < x0 || cy < y0 || cx >= x0 + w || cy >= y0 + h || buf[k + 3] === 0) return -1; return (buf[k] | (buf[k + 1] << 8)) - 1; };
    const exact = read(px, py); if (exact >= 0) return exact;
    let best = -1, bd = 1e9;
    for (let cy = y0; cy < y0 + h; cy++) for (let cx = x0; cx < x0 + w; cx++) { const id = read(cx, cy); if (id >= 0) { const d = (cx - px) ** 2 + (cy - py) ** 2; if (d < bd) { bd = d; best = id; } } }
    return best;
  }
}
