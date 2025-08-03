// DeskDev Portfolio Service Worker
const CACHE_VERSION = 'deskdev-v1.1.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// Core files to cache immediately on install
const CORE_FILES = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/manifest.json',
  '/offline.html',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/webfonts/fa-solid-900.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/webfonts/fa-brands-400.woff2'
];

// Files to cache on first visit
const STATIC_ASSETS = [
  '/icons/icon-16x16.png',
  '/icons/icon-32x32.png',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
];

// Install event - cache core files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...', CACHE_VERSION);
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching core files');
        return cache.addAll(CORE_FILES);
      })
      .then(() => {
        console.log('Service Worker: Core files cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Error caching core files:', error);
        // Continue installation even if some files fail to cache
        return Promise.resolve();
      })
  );
});

// Activate event - clean up old caches and update
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...', CACHE_VERSION);
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete old caches that don't match current version
            if (!cacheName.includes(CACHE_VERSION)) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated successfully');
        return self.clients.claim();
      })
      .then(() => {
        // Cache static assets after activation
        return cacheStaticAssets();
      })
  );
});

// Cache static assets
async function cacheStaticAssets() {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const promises = STATIC_ASSETS.map(async (asset) => {
      try {
        await cache.add(asset);
        console.log('Service Worker: Cached static asset:', asset);
      } catch (error) {
        console.warn('Service Worker: Failed to cache static asset:', asset, error);
      }
    });
    await Promise.all(promises);
    console.log('Service Worker: Static assets caching completed');
  } catch (error) {
    console.error('Service Worker: Error caching static assets:', error);
  }
}

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different types of requests with appropriate strategies
  if (request.destination === 'document' || request.destination === '') {
    // HTML pages - network first, fallback to cache
    event.respondWith(networkFirst(request, STATIC_CACHE));
  } else if (request.destination === 'style' || request.destination === 'script') {
    // CSS and JS files - cache first, fallback to network
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else if (request.destination === 'image') {
    // Images - cache first, fallback to network
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else if (request.destination === 'font') {
    // Fonts - cache first, fallback to network
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else {
    // Other resources - network first, fallback to cache
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
  }
});

// Network first strategy
async function networkFirst(request, cacheName) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the successful response
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      console.log('Service Worker: Network response cached:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache:', request.url, error);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('Service Worker: Serving from cache:', request.url);
      return cachedResponse;
    }
    
    // Return offline page for HTML requests
    if (request.destination === 'document' || request.destination === '') {
      console.log('Service Worker: Serving offline page');
      return caches.match('/offline.html');
    }
    
    // Return a custom offline response for other requests
    return new Response('Offline content not available', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain'
      })
    });
  }
}

// Cache first strategy
async function cacheFirst(request, cacheName) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('Service Worker: Serving from cache (cache first):', request.url);
      return cachedResponse;
    }
    
    // Fallback to network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the successful response
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      console.log('Service Worker: Network response cached (cache first):', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Cache and network failed:', request.url, error);
    
    // Return a custom offline response
    return new Response('Offline content not available', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain'
      })
    });
  }
}

// Runtime caching for dynamic content
async function runtimeCache(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('Runtime content not available', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  } else if (event.tag === 'cache-update') {
    event.waitUntil(updateCache());
  }
});

// Perform background sync
async function doBackgroundSync() {
  try {
    console.log('Service Worker: Processing background sync');
    
    // Get all clients
    const clients = await self.clients.matchAll();
    
    // Notify clients about sync
    clients.forEach(client => {
      client.postMessage({
        type: 'BACKGROUND_SYNC',
        message: 'Background sync completed'
      });
    });
    
    // Perform any pending offline actions here
    // For example, sync form data, upload files, etc.
    
  } catch (error) {
    console.error('Service Worker: Background sync failed:', error);
  }
}

// Update cache with new content
async function updateCache() {
  try {
    console.log('Service Worker: Updating cache');
    
    // Update core files
    const cache = await caches.open(STATIC_CACHE);
    const promises = CORE_FILES.map(async (url) => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
          console.log('Service Worker: Updated cache for:', url);
        }
      } catch (error) {
        console.warn('Service Worker: Failed to update cache for:', url, error);
      }
    });
    
    await Promise.all(promises);
    console.log('Service Worker: Cache update completed');
    
  } catch (error) {
    console.error('Service Worker: Cache update failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  let notificationData = {
    title: 'DevDesk Portfolio',
    body: 'New update available!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Portfolio',
        icon: '/icons/icon-96x96.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/icon-96x96.png'
      }
    ]
  };

  // Parse push data if available
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (error) {
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification('WebDev Portfolio', notificationData)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked:', event.action);
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/index.html')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  } else {
    // Default action - open the portfolio
    event.waitUntil(
      clients.openWindow('/index.html')
    );
  }
});

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      cacheUrls(event.data.urls)
    );
  }
  
  if (event.data && event.data.type === 'DELETE_CACHE') {
    event.waitUntil(
      deleteCache(event.data.cacheName)
    );
  }
  
  if (event.data && event.data.type === 'GET_CACHE_INFO') {
    event.waitUntil(
      getCacheInfo().then(info => {
        event.ports[0].postMessage({ cacheInfo: info });
      })
    );
  }
});

// Cache specific URLs
async function cacheUrls(urls) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const promises = urls.map(async (url) => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
          console.log('Service Worker: Cached URL:', url);
        }
      } catch (error) {
        console.warn('Service Worker: Failed to cache URL:', url, error);
      }
    });
    
    await Promise.all(promises);
    console.log('Service Worker: URL caching completed');
  } catch (error) {
    console.error('Service Worker: Error caching URLs:', error);
  }
}

// Delete specific cache
async function deleteCache(cacheName) {
  try {
    const deleted = await caches.delete(cacheName);
    console.log('Service Worker: Cache deleted:', cacheName, deleted);
    return deleted;
  } catch (error) {
    console.error('Service Worker: Error deleting cache:', error);
    return false;
  }
}

// Get cache information
async function getCacheInfo() {
  try {
    const cacheNames = await caches.keys();
    const cacheInfo = {};
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      cacheInfo[cacheName] = {
        name: cacheName,
        size: keys.length,
        urls: keys.map(request => request.url)
      };
    }
    
    return cacheInfo;
  } catch (error) {
    console.error('Service Worker: Error getting cache info:', error);
    return {};
  }
}

// Periodic cache cleanup
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'cache-cleanup') {
    event.waitUntil(cleanupCache());
  }
});

// Clean up old cache entries
async function cleanupCache() {
  try {
    console.log('Service Worker: Starting cache cleanup');
    
    const cacheNames = await caches.keys();
    const promises = cacheNames.map(async (cacheName) => {
      if (!cacheName.includes(CACHE_VERSION)) {
        console.log('Service Worker: Cleaning up old cache:', cacheName);
        return caches.delete(cacheName);
      }
    });
    
    await Promise.all(promises);
    console.log('Service Worker: Cache cleanup completed');
  } catch (error) {
    console.error('Service Worker: Cache cleanup failed:', error);
  }
} 