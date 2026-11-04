// SimuLab UVa — service worker.
//
// Estrategia "red primero": con conexión siempre se carga la versión
// más reciente de cada simulador. Cada página visitada se guarda en
// caché, de modo que si después no hay conexión (aula, tren...) se
// abre la última versión vista.
//
// Si cambias mucho la estructura de la web, sube el número de versión
// para borrar la caché antigua.

const CACHE = 'simulab-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Solo peticiones GET de la propia web; lo demás pasa sin tocar.
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});
