const CACHE_NAME = "vpcompras-v3";

const STATIC_FILES = [
  "/",
  "/index.html",
  "/style.css",
  "/manifest.json"
];

// Instala nova versão
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_FILES))
      .then(() => self.skipWaiting())
  );
});

// Remove caches antigos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Busca primeiro a versão atualizada na internet
self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  // API nunca deve usar cache
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // app.js sempre atualizado
  if (url.pathname === "/app.js") {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Demais arquivos: tenta internet primeiro
  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();

        caches.open(CACHE_NAME)
          .then((cache) => cache.put(request, copy));

        return response;
      })
      .catch(() => caches.match(request))
  );
});
