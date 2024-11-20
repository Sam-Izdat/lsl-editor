import { build, files, version } from '$service-worker';

// Create a unique cache name for this deployment
const CACHE = `cache-${version}`;

const ROUTES = ['./', './pth', './canvasframe-error', './open-file', './get-gist', './get-url', './gist/0', './url/0'];

const ASSETS = [
  ...build, // the app itself
  ...files,  // everything in `static`
  ...ROUTES
];

self.addEventListener('install', (event) => {
  // Create a new cache and add all files to it
  async function addFilesToCache() {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS);
  }

  event.waitUntil(addFilesToCache());
});

self.addEventListener('activate', (event) => {
  // Remove previous cached data from disk
  async function deleteOldCaches() {
    for (const key of await caches.keys()) {
      if (key !== CACHE) await caches.delete(key);
    }
  }

  event.waitUntil(deleteOldCaches());
});

self.addEventListener('fetch', (event) => {
  // ignore POST requests etc
  if (event.request.method !== 'GET') return;

  async function respond() {
    const url = new URL(event.request.url);
    const cache = await caches.open(CACHE);

    const request = event.request;
    const referer = request.headers.get('Referer'); // Originating page
    const origin = request.headers.get('Origin');   // Origin of the requester

    // Detect if the request originates from the iframe (e.g., by URL path or referer)
    if (referer && referer.includes('canvasframe')) {
      console.warn('!!!CF REQUEST', referer);
      event.respondWith((async () => {
        const cache = await caches.open(CACHE);

        try {
          // Attempt to fetch from the network
          const response = await fetch(event.request);

          // Cache successful responses
          if (response.status === 200) {
            cache.put(event.request, response.clone());
          }

          return response;
        } catch {
          // Fallback to cache if offline
          const cachedResponse = await cache.match(event.request);
          if (cachedResponse) return cachedResponse;

          // If all else fails, send an error
          return new Response('Resource not available', { status: 503 });
        }
      })());
    } else {
      // `build`/`files` can always be served from the cache
      if (ASSETS.includes(url.pathname)) {
        const response = await cache.match(url.pathname);

        if (response) {
          return response;
        }
      }

      // for everything else, try the network first, but
      // fall back to the cache if we're offline
      try {
        const response = await fetch(event.request);

        // if we're offline, fetch can return a value that is not a Response
        // instead of throwing - and we can't pass this non-Response to respondWith
        if (!(response instanceof Response)) {
          throw new Error('invalid response from fetch');
        }

        if (response.status === 200) {
          cache.put(event.request, response.clone());
        }

        return response;
      } catch (err) {
        const response = await cache.match(event.request);

        if (response) {
          return response;
        }

        // if there's no cache, then just error out
        // as there is nothing we can do to respond to this request
        throw err;
      }
    }
  }

  event.respondWith(respond());
});