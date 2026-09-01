const CACHE = 'orcamento-lotes-dev-v5';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './logo.png', './logo-base64.js'];
const CDN_ASSETS = [
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).then(() =>
    Promise.all(CDN_ASSETS.map(url => fetch(url, {mode:'cors'}).then(r => c.put(url, r)).catch(() => {})))
  )));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Nunca cachear chamadas ao Supabase (login, dados de produtos/lotes) —
  // elas precisam sempre vir frescas do servidor, senão trocas de acesso
  // ou de produto ficariam presas em uma versão antiga guardada no celular.
  if (e.request.url.includes('.supabase.co/')){
    e.respondWith(fetch(e.request));
    return;
  }

  // A própria página (index.html / navegação): sempre tenta buscar a
  // versão mais nova da internet primeiro. Só usa a cópia guardada se
  // estiver offline. Isso garante que o app nunca fica "preso" numa
  // versão antiga — sem precisar que o usuário limpe o cache manualmente.
  const isDocument = e.request.mode === 'navigate' || e.request.destination === 'document';
  if (isDocument){
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // Demais arquivos (ícones, logo, bibliotecas): cache primeiro, como
  // antes — eles mudam raramente e isso deixa o app rápido/offline-friendly.
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }).catch(() => cached))
  );
});
