const CACHE_NAME = 'medichain-v1.0.0';
const API_CACHE_NAME = 'medichain-api-v1.0.0';

// Files to cache for offline functionality
const STATIC_CACHE_URLS = [
  '/',
  '/manifest.json',
  '/offline',
  // Core app pages
  '/dashboard',
  '/dashboard/records',
  '/dashboard/records/new',
  '/dashboard/qr',
  '/emergency',
  '/login',
  '/register',
  // Static assets will be cached automatically by Next.js
];

// API endpoints to cache
const API_CACHE_URLS = [
  '/api/healthrecords',
  '/api/healthrecords/stats',
  '/api/patient/profile',
  '/api/patient/emergency-info'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static files...');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('Service Worker: Static files cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Error caching static files:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Old caches cleaned up');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle network requests with cache strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different types of requests with appropriate strategies
  if (url.pathname.startsWith('/api/')) {
    // API requests - Network First with fallback to cache
    event.respondWith(networkFirstWithCache(request, API_CACHE_NAME));
  } else if (url.pathname.startsWith('/_next/') || url.pathname.includes('.')) {
    // Static assets - Cache First
    event.respondWith(cacheFirstWithNetworkFallback(request, CACHE_NAME));
  } else {
    // HTML pages - Network First with offline page fallback
    event.respondWith(networkFirstWithOfflineFallback(request));
  }
});

// Network First strategy with cache fallback
async function networkFirstWithCache(request, cacheName) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache for:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline data structure for API requests
    if (request.url.includes('/api/healthrecords')) {
      return new Response(JSON.stringify([]), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      });
    }
    
    throw error;
  }
}

// Cache First strategy with network fallback
async function cacheFirstWithNetworkFallback(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('Service Worker: Network and cache failed for:', request.url);
    throw error;
  }
}

// Network First with offline page fallback for HTML pages
async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('Service Worker: Network failed for page:', request.url);
    
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.destination === 'document') {
      const offlinePage = await caches.match('/offline');
      if (offlinePage) {
        return offlinePage;
      }
    }
    
    throw error;
  }
}

// Background sync for when connectivity is restored
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered:', event.tag);
  
  if (event.tag === 'health-records-sync') {
    event.waitUntil(syncHealthRecords());
  }
});

// Sync pending health records when online
async function syncHealthRecords() {
  try {
    // Get pending records from IndexedDB
    const pendingRecords = await getPendingRecords();
    
    for (const record of pendingRecords) {
      try {
        const response = await fetch('/api/healthrecords', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${record.token}`
          },
          body: JSON.stringify(record.data)
        });
        
        if (response.ok) {
          await removePendingRecord(record.id);
          console.log('Service Worker: Synced record:', record.id);
        }
      } catch (error) {
        console.error('Service Worker: Failed to sync record:', record.id, error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Background sync failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'New health record activity',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/view-action.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss-action.png'
      }
    ],
    requireInteraction: data.requireInteraction || false,
    silent: false,
    tag: data.tag || 'medichain-notification'
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'MediChain', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data;
  
  if (action === 'view' || !action) {
    const url = data.url || '/dashboard';
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Check if app is already open
          for (const client of clientList) {
            if (client.url.includes(url) && 'focus' in client) {
              return client.focus();
            }
          }
          
          // Open new window/tab
          if (clients.openWindow) {
            return clients.openWindow(url);
          }
        })
    );
  }
});

// Helper functions for IndexedDB operations
async function getPendingRecords() {
  // Implement IndexedDB operations for offline storage
  // This would typically use the IndexedDB API to store pending records
  return [];
}

async function removePendingRecord(id) {
  // Implement IndexedDB removal
  console.log('Removing pending record:', id);
}

// Message handling for communication with the main app
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
      
    case 'CACHE_HEALTH_RECORDS':
      cacheHealthRecords(payload);
      break;
      
    default:
      console.log('Service Worker: Unknown message type:', type);
  }
});

// Cache health records for offline access
async function cacheHealthRecords(records) {
  try {
    const cache = await caches.open(API_CACHE_NAME);
    const recordsResponse = new Response(JSON.stringify(records), {
      headers: { 'Content-Type': 'application/json' }
    });
    
    await cache.put('/api/healthrecords', recordsResponse);
    console.log('Service Worker: Health records cached for offline access');
  } catch (error) {
    console.error('Service Worker: Failed to cache health records:', error);
  }
}