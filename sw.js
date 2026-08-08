// RecipeBox Service Worker
// - HTML: network-first（更新をすぐ反映、オフライン時はキャッシュ）
// - その他: cache-first（高速表示）

const CACHE_NAME = 'recipebox-v2.1.0';
const CORE_ASSETS = [
    './',
    './index.html',
    './styles.css',
    './favicon.svg',
    './manifest.json',
    './assets/fontawesome/css/fontawesome.min.css',
    './assets/fontawesome/css/solid.min.css',
    './assets/fontawesome/webfonts/fa-solid-900.woff2',
    './js/app.js',
    './js/store.js',
    './js/recipe-logic.js',
    './js/schema.js',
    './js/persistence.js',
    './js/theme.js',
    './js/dom.js',
    './js/dialogs.js',
    './js/combobox.js',
    './js/icons.js',
    './js/views/welcome.js',
    './js/views/tree.js',
    './js/views/materials.js',
    './js/views/recipeForm.js',
    './js/views/recipeList.js',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((names) =>
            Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;

    const isDocument = request.mode === 'navigate' || request.destination === 'document';

    if (isDocument) {
        // network-first
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                    return response;
                })
                .catch(() => caches.match(request).then((r) => r || caches.match('./index.html')))
        );
        return;
    }

    // cache-first（成功したGETのみキャッシュ）
    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) return cached;
            return fetch(request).then((response) => {
                if (response && response.status === 200 && response.type === 'basic') {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                }
                return response;
            }).catch(() => cached);
        })
    );
});
