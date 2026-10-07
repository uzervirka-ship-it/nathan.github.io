/* FinanceOS — fonctionne hors connexion. Les données restent dans le navigateur (localStorage). */
const VERSION = "financeos-v1";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png", "icons/apple-touch-icon.png", "icons/favicon-32.png"];
const LIBS = /^(https:\/\/cdn\.tailwindcss\.com|https:\/\/cdn\.jsdelivr\.net\/npm\/chart\.js@|https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/|https:\/\/fonts\.(googleapis|gstatic)\.com)/;

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // L'appli elle-même : réseau d'abord (mises à jour), cache si hors ligne.
  if (url.origin === location.origin) {
    e.respondWith(fetch(req).then(r => { if (r.ok) { const c = r.clone(); caches.open(VERSION).then(x => x.put(req, c)); } return r; })
      .catch(() => caches.match(req).then(r => r || caches.match("index.html"))));
    return;
  }
  // Bibliothèques et polices : cache d'abord.
  if (LIBS.test(req.url)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok || r.type === "opaque") { const c = r.clone(); caches.open(VERSION).then(x => x.put(req, c)); } return r; })));
  }
  // Tout le reste (cours de bourse, IA, banque) : jamais mis en cache.
});
