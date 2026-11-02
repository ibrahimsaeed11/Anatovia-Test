/* share.js — (1) pronounce the English term (device voice), (2) share a branded snapshot of the model. */
'use strict';
if (!window.__shareLoaded) (() => {
  window.__shareLoaded = 1;
  const { S, P, $, name1, name2 } = A;
  const ar = () => S.lang === 'ar';
  const T = (en, a) => (ar() ? a : en);
  const SITE = 'ibrahimsaeed11.github.io/Anatovia';

  /* ───────── 1. pronunciation ───────── */
  const canSpeak = 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
  let voice = null;
  const pickVoice = () => { try { const v = speechSynthesis.getVoices(); voice = v.find((x) => /^en[-_]US/i.test(x.lang)) || v.find((x) => /^en/i.test(x.lang)) || null; } catch (e) { voice = null; } };
  if (canSpeak) { pickVoice(); try { speechSynthesis.addEventListener('voiceschanged', pickVoice); } catch (e) { /* ignore */ } }
  A.speakBtn = (e) => (canSpeak ? `<button class="act" data-act="speak" data-i="${e.i}">🔊 ${T('Pronounce', 'نطق')}</button>` : '');
  A.acts.speak = (el) => {
    const e = P[+el.dataset.i]; if (!e || !canSpeak) return;
    const txt = String(e.baseEn || e.en).replace(/\([^)]*\)/g, ' ').replace(/[–—\/]/g, ' ').replace(/\s+/g, ' ').trim();
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(txt); u.lang = 'en-US'; u.rate = 0.85; if (voice) u.voice = voice;
      speechSynthesis.speak(u);
    } catch (err) { A.toast(T('Voice is not available on this device', 'الصوت غير متاح على هذا الجهاز')); }
  };

  /* ───────── 2. snapshot ───────── */
  const css = (n, d) => { try { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || d; } catch (e) { return d; } };
  const rr = (c, x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
  const isAr = (s) => /[؀-ۿ]/.test(s);
  function compose() {
    const gl = $('gl'), lm = $('lm');
    A.R.draw(A.cam); if (A.afterDraw) A.afterDraw();           // fresh frame, read in the same task
    const W = gl.width, H = gl.height, bar = Math.round(Math.max(52, W * 0.085));
    const c = document.createElement('canvas'); c.width = W; c.height = H + bar;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, css('--bg1', '#000B33')); g.addColorStop(1, css('--bg2', '#000B33'));
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.drawImage(gl, 0, 0, W, H);
    if (lm && lm.width) x.drawImage(lm, 0, 0, W, H);
    const k = W / Math.max(320, gl.clientWidth || 400);          // css px → image px
    const e = S.sel >= 0 ? P[S.sel] : null;
    if (e) {
      const a = name1(e), b = name2(e), f1 = 19 * k, f2 = 13 * k;
      const fam = 'system-ui,-apple-system,"Segoe UI",Tahoma,"Noto Naskh Arabic",Arial,sans-serif';
      x.font = `700 ${f1}px ${fam}`; const w1 = x.measureText(a).width; x.font = `500 ${f2}px ${fam}`; const w2 = x.measureText(b).width;
      const w = Math.min(W - 24 * k, Math.max(w1, w2) + 28 * k), h = f1 + f2 + 22 * k, px = (W - w) / 2, py = 14 * k;
      x.fillStyle = 'rgba(12,18,40,.82)'; rr(x, px, py, w, h, 14 * k); x.fill();
      x.strokeStyle = 'rgba(255,255,255,.22)'; x.lineWidth = 1 * k; x.stroke();
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillStyle = '#fff'; x.font = `700 ${f1}px ${fam}`; x.direction = isAr(a) ? 'rtl' : 'ltr'; x.fillText(a, W / 2, py + 8 * k + f1 / 2, w - 16 * k);
      x.fillStyle = 'rgba(255,255,255,.72)'; x.font = `500 ${f2}px ${fam}`; x.direction = isAr(b) ? 'rtl' : 'ltr'; x.fillText(b, W / 2, py + 12 * k + f1 + f2 / 2, w - 16 * k);
      x.direction = 'ltr';
    }
    // footer
    x.fillStyle = 'rgba(10,14,32,.96)'; x.fillRect(0, H, W, bar);
    x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillStyle = '#AEB8D9'; x.font = `800 ${bar * 0.42}px system-ui,Arial,sans-serif`;
    x.fillText('Anatovia', 16 * k, H + bar * 0.38);
    x.fillStyle = 'rgba(255,255,255,.7)'; x.font = `500 ${bar * 0.25}px system-ui,Arial,sans-serif`; x.fillText(SITE, 16 * k, H + bar * 0.75);
    x.textAlign = 'right'; x.fillStyle = 'rgba(255,255,255,.45)'; x.font = `400 ${bar * 0.2}px system-ui,Arial,sans-serif`;
    x.fillText('3D: BodyParts3D · Z-Anatomy', W - 14 * k, H + bar * 0.38);
    x.fillText('CC BY-SA 2.1 JP / 4.0', W - 14 * k, H + bar * 0.7);
    return c;
  }
  const toBlob = (c) => new Promise((res) => {
    try {
      let src = c; const MAXW = 1080;                                   // keep the file small (WhatsApp-friendly)
      if (c.width > MAXW) { src = document.createElement('canvas'); src.width = MAXW; src.height = Math.round(c.height * MAXW / c.width); const q = src.getContext('2d'); q.imageSmoothingQuality = 'high'; q.drawImage(c, 0, 0, src.width, src.height); }
      src.toBlob((b) => res(b), 'image/jpeg', 0.9);
    } catch (e) { res(null); }
  });
  A.acts.snap = async () => {
    let c; try { c = compose(); } catch (e) { return A.toast(T('Could not take the snapshot', 'تعذّر أخذ اللقطة')); }
    const blob = await toBlob(c); if (!blob) return A.toast(T('Could not take the snapshot', 'تعذّر أخذ اللقطة'));
    const e = S.sel >= 0 ? P[S.sel] : null, nm = (e ? (e.baseEn || e.en) : 'anatomy').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'anatomy';
    const file = new File([blob], `anatovia-${nm}.jpg`, { type: 'image/jpeg' });
    const text = T('Anatovia — 3D anatomy in Arabic & English', 'Anatovia — التشريح ثلاثي الأبعاد بالعربي والإنجليزي') + '\n\u200E' + 'https://' + SITE + '/';
    A.fileOut(blob, file.name, 'image/jpeg', { text, head: T('📸 Snapshot', '📸 اللقطة') });
  };
  const prev = A.extraChips;
  A.extraChips = () => (prev ? prev() : '') + `<button class="chip" data-act="snap"><svg viewBox="0 0 24 24" class="ico"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>${T('Snapshot', 'لقطة')}</button>`;
  if (A.renderChips) A.renderChips();
})();
