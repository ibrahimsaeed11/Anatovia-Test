/* Service worker: caches the whole app on first visit so it works offline. */
const VERSION = 'anatovia-v88';
const FILES = ['./', 'index.html', 'style.css', 'i18n.js', 'catalog.js', 'gl.js', 'packs.js', 'store.js', 'app.js', 'study.js', 'features.js', 'clinic-data.js', 'clinic.js', 'spinal-data.js', 'play.js', 'firebase-config.js', 'account.js', 'tour.js', 'tests.js', 'nerves.js', 'calc.js', 'board.js', 'faculty.js', 'gate.js', 'fonts/cairo.woff', 'dental.js', 'tooth3d.js', 'fprof.js', 'voice.js', 'notebook.js','extras.js','motion.js', 'bono.js', 'duel.js', 'share.js', 'report.js', 'landmarks.js', 'models/bones.js', 'manifest.webmanifest', 'icons/favicon.svg',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)));   // no skipWaiting: the page shows an "update available" bar and activates us on tap
});
self.addEventListener('message', (e) => { if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// Network-first for the app files (so updates reach students quickly), falling back to cache offline.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then((hit) => hit || caches.match('index.html')))
  );
});
