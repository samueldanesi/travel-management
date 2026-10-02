// Service worker minimale: l'app si apre anche senza rete (dati demo salvati nel browser).
const CACHE = 'castruccio-v2'

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', './manifest.webmanifest'])).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  )
})

// Rete prima (così gli aggiornamenti arrivano subito), cache come ripiego offline.
self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET' || !req.url.startsWith('http')) return
  e.respondWith(
    fetch(req, { cache: 'no-cache' })
      .then((res) => {
        if (res.ok) {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(req, copy))
        }
        return res
      })
      .catch(() => caches.match(req).then((r) => r || caches.match('./')))
  )
})
