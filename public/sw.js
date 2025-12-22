const CACHE_NAME = "mindspark-v2"; // Increment version to force cache refresh
const OFFLINE_URLS = [
  "/",
  "/index.html",
];

// Install event - cache essential resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Caching app shell v2");
      return cache.addAll(OFFLINE_URLS);
    })
  );
  // Force activation immediately
  self.skipWaiting();
});

// Activate event - clean up ALL old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log("Deleting old cache:", name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first for most requests
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Skip caching for:
  // - API calls and edge functions
  // - node_modules (can cause React duplicate issues)
  // - Hot module replacement
  if (
    url.pathname.includes("/functions/") ||
    url.pathname.includes("/rest/") ||
    url.pathname.includes("/auth/") ||
    url.pathname.includes("/node_modules/") ||
    url.pathname.includes(".vite/") ||
    url.pathname.includes("@vite") ||
    url.pathname.includes("@react-refresh") ||
    url.search.includes("v=")
  ) {
    return;
  }

  // For HTML navigation, always fetch fresh
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the fresh version
          if (response.ok) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache only if network fails
          return caches.match("/") || caches.match("/index.html");
        })
    );
    return;
  }

  // For other assets, use network first strategy
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache static assets, not JS modules
        if (response.ok && response.type === "basic" && !url.pathname.endsWith(".js")) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
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
  console.log("Syncing pending study sessions...");
}

// Listen for skip waiting message
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});