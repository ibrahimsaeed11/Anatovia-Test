/* store.js — tiny localStorage wrapper (everything in try/catch; works without storage). */
'use strict';
const Store = (() => {
  const KEY = 'anat2';
  let mem = null;
  const blank = () => ({ lang: 'ar', theme: 'dark', learned: {}, fav: {}, notes: {}, srs: {}, hist: [], days: [], seenHint: 0 });
  function load() {
    if (mem) return mem;
    try { const r = localStorage.getItem(KEY); mem = r ? Object.assign(blank(), JSON.parse(r)) : blank(); } catch (e) { mem = blank(); }
    return mem;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* storage unavailable */ } }
  const today = () => { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };
  const dayNum = (n) => Math.floor(Date.UTC(Math.floor(n / 10000), Math.floor(n / 100) % 100 - 1, n % 100) / 864e5);
  return {
    get d() { return load(); }, save,
    touchDay() { const s = load(), t = today(); if (s.days[s.days.length - 1] !== t) { s.days.push(t); if (s.days.length > 400) s.days.shift(); save(); } },
    streak() {
      const s = load(); if (!s.days.length) return 0;
      let n = 1; const dn = s.days.map(dayNum), now = dayNum(today());
      if (now - dn[dn.length - 1] > 1) return 0;
      for (let i = dn.length - 1; i > 0; i--) { if (dn[i] - dn[i - 1] === 1) n++; else break; }
      return n;
    },
    reset() { mem = blank(); save(); },
  };
})();
