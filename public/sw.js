const CACHE_NAME = "mindspark-v3";
const LESSONS_CACHE = "mindspark-lessons-v1";
const STATIC_CACHE = "mindspark-static-v1";

// Core app shell to cache
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
];

// Static assets to cache
const STATIC_ASSETS = [
  "/placeholder.svg",
];

// Install event - cache essential resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        console.log("Caching app shell v3");
        return cache.addAll(APP_SHELL);
      }),
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      }),
    ])
  );
  // Force activation immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  const currentCaches = [CACHE_NAME, LESSONS_CACHE, STATIC_CACHE];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !currentCaches.includes(name))
          .map((name) => {
            console.log("Deleting old cache:", name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Helper to check if request should bypass cache
const shouldBypassCache = (url) => {
  return (
    url.pathname.includes("/functions/") ||
    url.pathname.includes("/rest/") ||
    url.pathname.includes("/auth/") ||
    url.pathname.includes("/node_modules/") ||
    url.pathname.includes(".vite/") ||
    url.pathname.includes("@vite") ||
    url.pathname.includes("@react-refresh") ||
    url.search.includes("v=") ||
    url.hostname.includes("supabase")
  );
};

// Helper to check if it's a lesson request
const isLessonRequest = (url) => {
  return url.pathname.includes("/api/offline-lessons/");
};

// Fetch event - smart caching strategy
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Skip API calls and development resources
  if (shouldBypassCache(url)) {
    return;
  }

  // Handle offline lesson requests - cache first
  if (isLessonRequest(url)) {
    event.respondWith(
      caches.open(LESSONS_CACHE).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          return fetch(event.request).then((networkResponse) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // For HTML navigation - network first with cache fallback
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match("/") || caches.match("/index.html");
        })
    );
    return;
  }

  // For static assets (images, fonts, etc.) - cache first with network fallback
  if (
    url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)
  ) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // Return placeholder for images
            if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg)$/)) {
              return caches.match("/placeholder.svg");
            }
            return new Response("", { status: 404 });
          });
        });
      })
    );
    return;
  }

  // For other requests - network first strategy
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache successful responses for same-origin
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
  if (event.tag === "sync-progress") {
    event.waitUntil(syncPendingProgress());
  }
});

// Sync pending study sessions when back online
async function syncPendingSessions() {
  console.log("Syncing pending study sessions...");
  try {
    const db = await openDB();
    const sessions = await getAllPendingSessions(db);
    
    for (const session of sessions) {
      try {
        // Session would be sent to server here
        await removePendingSession(db, session.id);
      } catch (error) {
        console.error("Failed to sync session:", session.id, error);
      }
    }
  } catch (error) {
    console.error("Sync failed:", error);
  }
}

async function syncPendingProgress() {
  console.log("Syncing pending progress updates...");
}

// Simple IndexedDB helpers for offline queue
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("mindspark-sync", 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("pending-sessions")) {
        db.createObjectStore("pending-sessions", { keyPath: "id" });
      }
    };
  });
}

function getAllPendingSessions(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("pending-sessions", "readonly");
    const store = tx.objectStore("pending-sessions");
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
}

function removePendingSession(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("pending-sessions", "readwrite");
    const store = tx.objectStore("pending-sessions");
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Listen for skip waiting message
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Push notification handler
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body || "Time to study!",
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      vibrate: [100, 50, 100],
      data: {
        url: data.url || "/dashboard",
      },
      actions: [
        { action: "open", title: "Open App" },
        { action: "dismiss", title: "Dismiss" },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(data.title || "MindSpark Learning", options)
    );
  } catch (error) {
    console.error("Push notification error:", error);
  }
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const urlToOpen = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && "focus" in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
