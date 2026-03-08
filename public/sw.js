// SARA CRM Service Worker v1
const CACHE_NAME = 'sara-crm-v2';
const OFFLINE_URL = '/offline.html';

// Static assets to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/icon.svg',
  '/manifest.json',
];

// Install: pre-cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Helper: fetch with timeout
function fetchWithTimeout(request, timeoutMs) {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    fetch(request, { signal: controller.signal })
      .then((response) => {
        clearTimeout(timeoutId);
        resolve(response);
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        reject(err);
      });
  });
}

// Check if request is an API call (exclude supabase - never cache DB queries)
function isApiRequest(url) {
  return url.includes('/api/');
}

// Supabase requests: always network, never cache
function isSupabaseRequest(url) {
  return url.includes('supabase');
}

// Check if request is a static asset
function isStaticAsset(url) {
  return /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot)(\?.*)?$/.test(url);
}

// Fetch handler
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET for caching (but queue failed POST/PUT for background sync)
  if (request.method !== 'GET') {
    if ((request.method === 'POST' || request.method === 'PUT') && isApiRequest(request.url)) {
      event.respondWith(
        fetch(request.clone()).catch(() => {
          // Queue for background sync if available
          if (self.registration.sync) {
            return saveFailedRequest(request).then(() => {
              return new Response(JSON.stringify({ queued: true, message: 'Solicitud guardada para enviar cuando haya conexion' }), {
                status: 202,
                headers: { 'Content-Type': 'application/json' },
              });
            });
          }
          return new Response(JSON.stringify({ error: 'Sin conexion' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );
    }
    return;
  }

  // Supabase requests: always pass through to network, never cache
  if (isSupabaseRequest(request.url)) {
    return;
  }

  // API requests: network-first with 5s timeout, fallback to cache
  if (isApiRequest(request.url)) {
    event.respondWith(
      fetchWithTimeout(request.clone(), 5000)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || new Response(JSON.stringify({ error: 'Sin conexion', offline: true }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            });
          });
        })
    );
    return;
  }

  // Static assets: cache-first, fallback to network
  if (isStaticAsset(request.url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request.clone()).then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Navigation requests: network-first, fallback to cached index.html (SPA)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetchWithTimeout(request.clone(), 5000)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => {
          return caches.match('/').then((cached) => {
            return cached || caches.match(OFFLINE_URL);
          });
        })
    );
    return;
  }

  // Default: network with cache fallback
  event.respondWith(
    fetch(request.clone())
      .then((response) => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// Background sync: retry failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'sara-crm-sync') {
    event.waitUntil(retryFailedRequests());
  }
});

// Save failed request to IndexedDB for later retry
async function saveFailedRequest(request) {
  try {
    const body = await request.clone().text();
    const data = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: body,
      timestamp: Date.now(),
    };

    const db = await openSyncDB();
    const tx = db.transaction('requests', 'readwrite');
    tx.objectStore('requests').add(data);
    await tx.complete;

    if (self.registration.sync) {
      await self.registration.sync.register('sara-crm-sync');
    }
  } catch (e) {
    console.warn('SW: Could not save failed request', e);
  }
}

// Retry all saved failed requests
async function retryFailedRequests() {
  try {
    const db = await openSyncDB();
    const tx = db.transaction('requests', 'readonly');
    const store = tx.objectStore('requests');

    return new Promise((resolve, reject) => {
      const getAllReq = store.getAll();
      getAllReq.onsuccess = async () => {
        const requests = getAllReq.result || [];
        for (const req of requests) {
          try {
            await fetch(req.url, {
              method: req.method,
              headers: req.headers,
              body: req.body,
            });
            // Remove from queue on success
            const delTx = db.transaction('requests', 'readwrite');
            delTx.objectStore('requests').delete(req.id);
          } catch (e) {
            console.warn('SW: Retry failed for', req.url);
          }
        }
        resolve();
      };
      getAllReq.onerror = () => reject(getAllReq.error);
    });
  } catch (e) {
    console.warn('SW: Could not retry requests', e);
  }
}

// Open IndexedDB for sync queue
function openSyncDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('sara-crm-sync', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('requests')) {
        db.createObjectStore('requests', { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
