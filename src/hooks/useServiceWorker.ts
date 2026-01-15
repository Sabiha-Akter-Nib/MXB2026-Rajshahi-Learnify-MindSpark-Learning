import { useState, useEffect, useCallback } from "react";

interface ServiceWorkerState {
  isRegistered: boolean;
  isUpdateAvailable: boolean;
  registration: ServiceWorkerRegistration | null;
}

export const useServiceWorker = () => {
  const [state, setState] = useState<ServiceWorkerState>({
    isRegistered: false,
    isUpdateAvailable: false,
    registration: null,
  });

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const checkRegistration = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          setState({
            isRegistered: true,
            isUpdateAvailable: !!registration.waiting,
            registration,
          });

          // Listen for updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  setState((prev) => ({ ...prev, isUpdateAvailable: true }));
                }
              });
            }
          });
        }
      } catch (error) {
        console.error("Service worker registration check failed:", error);
      }
    };

    checkRegistration();
  }, []);

  const updateServiceWorker = useCallback(() => {
    if (state.registration?.waiting) {
      state.registration.waiting.postMessage({ type: "SKIP_WAITING" });
      window.location.reload();
    }
  }, [state.registration]);

  const clearCache = useCallback(async () => {
    if ("caches" in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
      window.location.reload();
    }
  }, []);

  return {
    ...state,
    updateServiceWorker,
    clearCache,
  };
};
