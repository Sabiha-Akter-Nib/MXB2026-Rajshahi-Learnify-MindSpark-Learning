const CACHE_NAME = "mindspark-v1";
const OFFLINE_URLS = [
  "/",
  "/dashboard",
  "/tutor",
  "/subjects",
  "/practice",
  "/login",
  "/signup",
];

// Install event - cache essential resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Caching app shell");
      return cache.addAll(OFFLINE_URLS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
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

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // Skip API calls and edge functions
  if (
    event.request.url.includes("/functions/") ||
    event.request.url.includes("/rest/") ||
    event.request.url.includes("/auth/")
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached version and update in background
        event.waitUntil(
          fetch(event.request).then((response) => {
            if (response.ok) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, response);
              });
            }
          }).catch(() => {})
        );
        return cachedResponse;
      }

      // Try network first
      return fetch(event.request)
        .then((response) => {
          // Cache successful responses
          if (response.ok && response.type === "basic") {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Return offline page for navigation requests
          if (event.request.mode === "navigate") {
            return caches.match("/");
          }
          return new Response("Offline", { status: 503 });
        });
    })
  );
});

// Handle background sync for study sessions
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-session") {
    event.waitUntil(syncPendingSessions());
  }
});

async function syncPendingSessions() {
  // Get pending sessions from IndexedDB and sync when online
  console.log("Syncing pending study sessions...");
}
