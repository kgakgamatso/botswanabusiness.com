// 267connect.com service worker: keeps the site usable offline and on weak connections.
// Pages: network first, saved copy when offline. Libraries, map tiles and listing images: saved copy first, refreshed in the background.
// API calls (database and functions) are never cached here; the page keeps its own small offline copy of public data.
const V = 'bb-202611121114', RT = 'bb-rt';
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll(['./', 'index.html', 'maintenance.html'])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V && k !== RT).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
const trim = async () => { const c = await caches.open(RT); const ks = await c.keys(); for (const k of ks.slice(0, Math.max(0, ks.length - 150))) await c.delete(k); };
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r)
      .then((res) => { if (res.ok && u.origin === location.origin) { const c = res.clone(); caches.open(V).then((x) => x.put('index.html', c)); } return res; })
      .catch(() => caches.match('index.html').then((h) => h || caches.match('maintenance.html'))));
    return;
  }
  const media = u.hostname === 'cdn.jsdelivr.net' || u.pathname.includes('/storage/v1/object/public/') || /(^|\.)tile\.openstreetmap\.org$/.test(u.hostname);
  if (u.origin !== location.origin && !media) return;
  e.respondWith(caches.match(r).then((hit) => {
    const net = fetch(r).then((res) => {
      if (res.ok || res.type === 'opaque') { const c = res.clone(); caches.open(RT).then((x) => x.put(r, c)).then(trim); }
      return res;
    }).catch(() => hit);
    return hit || net;
  }));
});
