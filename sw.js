// Service worker: guarda la "cáscara" de la app para que abra rápido.
// Los datos de los socios NUNCA se guardan: siempre se piden al servidor.
const VERSION = 'socios-cabb-v3';
const ARCHIVOS = [
  './',
  './index.html',
  './app.js',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './favicon-32.png',
  './comision.html',
  './comision.js',
  './comision-eventos.js',
  './eventos-socio.js',
  './comision.webmanifest',
  './comision-192.png',
  './comision-512.png',
  './comision-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return; // API y externos: directo a la red
  // Primero la red (para recibir actualizaciones); si no hay conexión, lo guardado.
  e.respondWith(
    fetch(e.request)
      .then((r) => {
        const copia = r.clone();
        caches.open(VERSION).then((c) => c.put(e.request, copia));
        return r;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html')))
  );
});
