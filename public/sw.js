// Service Worker for Gymzarsko PWA
const CACHE_NAME = 'gymzarsko-v1.1.0'
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
]

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching app shell')
      return cache.addAll(urlsToCache).catch((error) => {
        console.error('[SW] Cache addAll error:', error)
      })
    })
  )
  // Force the waiting service worker to become the active service worker
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  // Take control of all pages immediately
  return self.clients.claim()
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return
  }

  // Skip Chrome extension requests
  if (event.request.url.includes('chrome-extension://')) {
    return
  }

  // Skip Firebase requests (always use network)
  if (
    event.request.url.includes('firebaseapp.com') ||
    event.request.url.includes('googleapis.com') ||
    event.request.url.includes('firebase.googleapis.com')
  ) {
    return event.respondWith(fetch(event.request))
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response from cache
      if (response) {
        return response
      }

      // Clone the request
      const fetchRequest = event.request.clone()

      return fetch(fetchRequest)
        .then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response
          }

          // Clone the response
          const responseToCache = response.clone()

          // Only cache GET requests
          if (event.request.method === 'GET') {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache)
            })
          }

          return response
        })
        .catch((error) => {
          console.error('[SW] Fetch error:', error)
          // Return offline page if available
          return caches.match('/index.html')
        })
    })
  )
})

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

console.log('[SW] Service Worker loaded')

