const CACHE = 'shimora-student-v2';
const APP_SHELL = [
  '/student.html', '/styles.css', '/student.css', '/student-config.js', '/student.js',
  '/app-install.js', '/app.webmanifest', '/app-icon.svg', '/favicon.png',
  '/apple-touch-icon.png', '/offline.html'
];
const STATIC_PATHS = new Set(APP_SHELL);

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith('shimora-student-') && key !== CACHE).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(async () =>
      (await caches.match(url.pathname)) || (await caches.match('/offline.html'))
    ));
    return;
  }

  if (STATIC_PATHS.has(url.pathname)) {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request)));
  }
});
