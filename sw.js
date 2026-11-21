// Service worker: guarda la "cáscara" de la app para que abra rápido.
// Los datos de los socios NUNCA se guardan: siempre se piden al servidor.
const VERSION = 'socios-cabb-v14';
const API_URL = 'https://script.google.com/macros/s/AKfycbz6MBX6o76Dno-xnLE1PtckRpIqfLbuaZ7VbjCjXEuwnreJOD_wJYgCZ9hWd848Ij8/exec';
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
  './socio-extras.js',
  './comision-extras.js',
  './comision-reportes.js',
  './comision-socios-extra.js',
  './comision-estadisticas.js',
  './comision-gestion.js',
  './socio-gestion.js',
  './socio-clases.js',
  './socio-orden.js',
  './socio-cumple.js',
  './comision-clases.js',
  './escudo.svg',
  './escudo-oro.svg',
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

// Notificaciones: el aviso llega vacío y el texto se pide al servidor (así no hace falta cifrarlo).
self.addEventListener('push', (e) => {
  const generico = { titulo: 'Círculo de Ajedrez', cuerpo: 'Tenés novedades en la app de socios.', url: './', tag: 'cabb' };
  e.waitUntil(
    self.registration.pushManager.getSubscription()
      .then((sub) => fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ accion: 'notificacion', args: [sub ? sub.endpoint : ''] }) }))
      .then((r) => r.json())
      .then((r) => (r && r.ok && r.data) || generico)
      .catch(() => generico)
      .then((n) => self.registration.showNotification(n.titulo, {
        body: n.cuerpo, icon: 'icon-192.png', badge: 'favicon-32.png', tag: n.tag || 'cabb', renotify: true, data: { url: n.url || './' }
      }))
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const destino = new URL((e.notification.data && e.notification.data.url) || './', self.location.href).href;
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((lista) => {
      const abierta = lista.find((c) => c.url.indexOf(self.registration.scope) === 0 && !/comision/.test(c.url));
      if (abierta) return abierta.focus();
      return self.clients.openWindow(destino);
    })
  );
});
