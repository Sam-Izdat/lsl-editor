<svelte:head>
  <script>
    const originalFetch = window.fetch;
    console.warn('==== OVERRIDING IFRAME FETCH ====');
    window.fetch = async (url, options) => {
        console.warn('=========== CANVAS FRAME FETCH', url);
        return new Promise((resolve, reject) => {
            const id = Math.random().toString(36).substr(2); // Unique ID for response tracking
            const listener = (event) => {
                if (event.data.id === id) {
                    window.removeEventListener('message', listener);
                    event.data.error ? reject(event.data.error) : resolve(new Response(event.data.response));
                }
            };
            window.addEventListener('message', listener);

            // Send request to parent
            window.parent.postMessage({ id, url, options }, '*');
        });
    };
  </script>
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; connect-src 'self'; worker-src 'none';">
  <meta http-equiv="Permissions-Policy" content="storage-access=(), fullscreen=(self)">
</svelte:head>
<slot />