(() => {
  'use strict';

  if (typeof document === 'undefined') {
    const cacheName = 'gopro-guia-v1';
    self.addEventListener('install', event => {
      event.waitUntil(caches.open(cacheName).then(cache =>
        cache.addAll(['./', 'index.html', 'estilo.css', 'guia.js', 'favicon.svg'])
      ));
    });
    self.addEventListener('activate', event => {
      event.waitUntil(self.clients.claim());
    });
    self.addEventListener('message', event => {
      if (!Array.isArray(event.data?.assets)) return;
      const assets = event.data.assets.filter(asset => {
        try {
          const url = new URL(asset, self.registration.scope);
          return url.origin === self.location.origin &&
            url.href.startsWith(self.registration.scope) && url.pathname.endsWith('.svg');
        } catch { return false; }
      });
      event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(assets)).catch(() => {}));
    });
    self.addEventListener('fetch', event => {
      const url = new URL(event.request.url);
      if (event.request.method !== 'GET' || url.origin !== self.location.origin ||
          !url.href.startsWith(self.registration.scope) || url.pathname.endsWith('.pdf')) return;
      event.respondWith(fetch(event.request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(caches.open(cacheName).then(cache => cache.put(event.request, copy)).catch(() => {}));
        }
        return response;
      }).catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (event.request.mode === 'navigate') {
          const page = await caches.match(new URL('index.html', self.registration.scope).href);
          if (page) return page;
        }
        return Response.error();
      }));
    });
    return;
  }

  const checks = [...document.querySelectorAll('[data-check]')];
  const storageKey = 'gopro-guia-checklist-v1';
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
      checks.forEach(input => { input.checked = saved[input.dataset.check] === true; });
    }
  } catch { /* La lista sigue funcionando aunque el navegador bloquee el almacenamiento. */ }
  checks.forEach(input => input.addEventListener('change', () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(Object.fromEntries(
        checks.map(check => [check.dataset.check, check.checked])
      )));
    } catch { /* Marcar una casilla no depende de poder guardarla. */ }
  }));

  document.querySelectorAll('.video').forEach(video => {
    const button = video.querySelector('.video-facade');
    button.addEventListener('click', () => {
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube-nocookie.com/embed/${video.dataset.video}?start=${video.dataset.start}&autoplay=1&rel=0`;
      iframe.title = video.querySelector('h3').textContent;
      iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.loading = 'lazy';
      iframe.tabIndex = 0;
      button.replaceWith(iframe);
      iframe.focus();
    });
  });

  const steps = [...document.querySelectorAll('.step')];
  const chips = [...document.querySelectorAll('.step-nav a')];
  function setCurrent(id) {
    chips.forEach(chip => {
      if (chip.hash === `#${id}`) chip.setAttribute('aria-current', 'step');
      else chip.removeAttribute('aria-current');
    });
    const current = chips.find(chip => chip.hash === `#${id}`);
    if (current) {
      const rail = current.parentElement;
      const left = current.offsetLeft - rail.offsetLeft;
      if (left < rail.scrollLeft || left + current.offsetWidth > rail.scrollLeft + rail.clientWidth) {
        rail.scrollLeft = left - (rail.clientWidth - current.offsetWidth) / 2;
      }
    }
  }
  chips.forEach(chip => chip.addEventListener('click', () => setCurrent(chip.hash.slice(1))));
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(() => {
      const marker = Math.min(window.innerHeight * .35, 220);
      const current = steps.find(step => {
        const bounds = step.getBoundingClientRect();
        return bounds.top <= marker && bounds.bottom > marker;
      });
      if (current) setCurrent(current.id);
    }, { rootMargin: '-100px 0px -60% 0px', threshold: 0 });
    steps.forEach(step => observer.observe(step));
  }

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register('guia.js').then(() => navigator.serviceWorker.ready).then(registration => {
      const assets = [...new Set([...document.querySelectorAll('img')]
        .map(img => img.src).filter(src => new URL(src).origin === location.origin))];
      registration.active?.postMessage({ assets });
    }).catch(() => {});
  }
})();
