import { build, files, version } from '$service-worker';

// Create a unique cache name for this deployment
const CACHE = `cache-${version}`;

const ASSETS = [
  ...build, // the app itself
  ...files  // everything in `static`
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

// self.addEventListener('fetch', (event) => {
//   console.warn('FETCH REQUEST');
//   event.respondWith(
//     (async () => {

//       const request = event.request;
//       const referer = request.headers.get('Referer'); // Originating page
//       const origin = request.headers.get('Origin');   // Origin of the requester

//       let response;

//       // Serve from cache if available
//       response = await caches.match(request);

//       // Fetch from network if not in cache
//       if (!response) {
//         response = await fetch(request);
//       }

//       // Modify the response to include appropriate CSP headers
//       if (response) {
//         const newHeaders = new Headers(response.headers);
//         // Apply sandboxed CSP if the request comes from the iframe
//         if (referer && referer.includes('/canvasframe')) {
//           console.warn('CANVASFRAME REQUEST');
//           newHeaders.set(
//             'Content-Security-Policy',
//             "default-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; connect-src 'self'; worker-src 'none';"
//           );
//         } else {
//           // Apply full-permission CSP for main app requests
//           newHeaders.set(
//             'Content-Security-Policy',
//             "default-src * self blob: data: gap:; style-src * self 'unsafe-inline' blob: data: gap:; script-src * 'self' 'unsafe-eval' 'unsafe-inline' blob: data: gap:; object-src * 'self' blob: data: gap:; img-src * self 'unsafe-inline' blob: data: gap:; connect-src self * 'unsafe-inline' blob: data: gap:; frame-src * self blob: data: gap:; worker-src 'self' blob:;"
//           );
//         }

//         return new Response(response.body, {
//           status: response.status,
//           statusText: response.statusText,
//           headers: newHeaders,
//         });
//       }

//       // Fallback in case of no response (e.g., offline and not cached)
//       return new Response('Offline', { status: 503 });
//     })()
//   );
// });