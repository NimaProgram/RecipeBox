const CACHE_NAME = 'recipebox-v1.1.0-mfi';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/script.js',
    '/favicon.svg',
    '/manifest.json',
    '/js/theme-manager.js',
    '/js/custom-dropdown.js',
    '/js/dropdown-integration.js',
    '/js/database.js',
    '/js/recipe-manager.js',
    '/js/ui-manager.js',
    '/js/inventory-manager.js',
    '/js/file-manager.js'
];

// MFI対応: より高速なキャッシュ戦略
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('RecipeBox: Cache opened for MFI');
                return cache.addAll(urlsToCache);
            })
    );
    // 即座にアクティブ化
    self.skipWaiting();
});

self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        console.log('RecipeBox: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // 即座にコントロール開始
    self.clients.claim();
});

self.addEventListener('fetch', function(event) {
    // MFI対応: モバイルに最適化されたキャッシュ戦略
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                // キャッシュヒット - レスポンス返却
                if (response) {
                    return response;
                }
                
                // クローンしてフェッチ
                var fetchRequest = event.request.clone();
                
                return fetch(fetchRequest).then(
                    function(response) {
                        // 無効なレスポンスかチェック
                        if(!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // レスポンスをクローンしてキャッシュ
                        var responseToCache = response.clone();
                        
                        caches.open(CACHE_NAME)
                            .then(function(cache) {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    }
                ).catch(function() {
                    // オフライン時のフォールバック
                    if (event.request.destination === 'document') {
                        return caches.match('/index.html');
                    }
                });
            }
        )
    );
});