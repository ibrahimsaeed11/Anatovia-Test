/* packs.js — loads the quantised anatomy meshes (models/*.js) on demand. */
'use strict';
const Packs = {
  cache: {},
  load(name) {
    return new Promise((resolve, reject) => {
      if (this.cache[name]) { resolve(this.cache[name]); return; }
      const done = () => {
        const b64 = window.__PACKS && window.__PACKS[name];
        if (!b64) { reject(new Error('pack ' + name)); return; }
        const bin = atob(b64), u = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
        delete window.__PACKS[name];
        this.cache[name] = u; resolve(u);
      };
      if (window.__PACKS && window.__PACKS[name]) { done(); return; }
      const s = document.createElement('script');
      s.src = 'models/' + name + '.js';
      s.onload = done; s.onerror = () => reject(new Error('pack ' + name));
      document.head.appendChild(s);
    });
  },
  /** Decode one part from a pack. */
  part(bytes, off) {
    const dv = new DataView(bytes.buffer, bytes.byteOffset + off, 32);
    const lo = [dv.getFloat32(0, true), dv.getFloat32(4, true), dv.getFloat32(8, true)];
    const hi = [dv.getFloat32(12, true), dv.getFloat32(16, true), dv.getFloat32(20, true)];
    const nV = dv.getUint32(24, true), nI = dv.getUint32(28, true);
    const base = bytes.byteOffset + off + 32;
    const pos = new Uint16Array(bytes.buffer.slice(base, base + nV * 6));
    const nor = new Int8Array(bytes.buffer.slice(base + nV * 6, base + nV * 10));
    const idx = new Uint16Array(bytes.buffer.slice(base + nV * 10, base + nV * 10 + nI * 2));
    return { lo, span: [hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]], pos, nor, idx };
  },
};
