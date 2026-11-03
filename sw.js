// Service worker simples: tenta sempre a rede primeiro (conteúdo actualizado)
// e usa a cópia guardada só quando não há ligação. Dados do Supabase nunca são guardados.
const CACHE = "ae-v5";
const SHELL = ["./", "index.html", "styles.css", "app.js", "config.js", "icon-192.png", "icon-180.png", "hero-poster.jpg", "logo.png", "manifest.webmanifest"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.headers.has("range") || /\.(mp4|webm)$/i.test(r.url)) return;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  e.respondWith(
    fetch(r).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); }
      return res;
    }).catch(() => caches.match(r).then(m => m || caches.match("index.html")))
  );
});
