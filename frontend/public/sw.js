const CACHE_NAME = "treino-loloa-v2";

const CORE_ASSETS = [
  "/",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Não cachear recursos externos.
  if (url.origin !== self.location.origin) return;

  // Proteção extra: se o SW ficar ativo em dev por acidente,
  // não cacheia arquivos do Vite.
  if (
    url.pathname.startsWith("/src/") ||
    url.pathname.includes("@vite") ||
    url.pathname.includes("/node_modules/.vite/")
  ) {
    event.respondWith(fetch(request));
    return;
  }

  // HTML / navegação: rede primeiro.
  // Isso evita carregar App antigo depois de atualizar código.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, copy);
          });

          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
    );

    return;
  }

  // Demais arquivos: rede primeiro, cache como fallback offline.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (!response || !response.ok) return response;

        const copy = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, copy);
        });

        return response;
      })
      .catch(() => caches.match(request))
  );
});