const CACHE_NAME = 'mega-smart-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/vite.svg'
];

// Instalação: Cacheia os arquivos estáticos principais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Ativação: Limpa caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Interceptação de Rede: Estratégia Network First (Tenta rede, se falhar, usa cache)
self.addEventListener('fetch', (event) => {
  // Ignora requisições de outras origens ou que não sejam GET para evitar erros de CORS opacos em cache
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Se a resposta for válida, clonamos e atualizamos o cache (Stale-while-revalidate logic simplificada)
        // Mas aqui vamos usar Network First simples
        return response;
      })
      .catch(() => {
        // Se falhar (offline), tenta retornar do cache
        return caches.match(event.request);
      })
  );
});