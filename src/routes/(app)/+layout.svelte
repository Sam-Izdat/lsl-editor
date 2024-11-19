<script lang="ts">
  import '../app.postcss';
  import { cfg } from '$root/webui.config.js';
  import { AppShell, AppBar } from '@skeletonlabs/skeleton';
  import { autoModeWatcher } from '@skeletonlabs/skeleton';
  import { computePosition, autoUpdate, offset, shift, flip, arrow } from '@floating-ui/dom';
  import { storePopup } from '@skeletonlabs/skeleton';
  storePopup.set({ computePosition, autoUpdate, offset, shift, flip, arrow });

  // Modals, Toasts/Growls, Drawers
  import { initializeStores, Modal, Toast, Drawer, getDrawerStore } from '@skeletonlabs/skeleton';  
  import type { DrawerSettings, DrawerStore } from '@skeletonlabs/skeleton';
  import { drawerContentStore  } from '$lib/stores/drawer';
  import { browser } from '$app/environment';
  initializeStores();
  let drawerContent;
  let props = {};

  // Subscribe to updates to dynamically load the component
  drawerContentStore.subscribe(({ component, props: componentProps }) => {
    drawerContent = component;
    props = componentProps;
  });

  import  { ModalInfo, ModalImportExport, ModalConfirm, ModalInput }  from '$lib/components';
  const modalRegistry: Record<string, ModalComponent> = {
    modalInfo:          { ref: ModalInfo },
    modalImportExport:  { ref: ModalImportExport },
    modalConfirm:       { ref: ModalConfirm },
    modalInput:         { ref: ModalInput },
  };

  import { Log } from '$lib';

  const dev_mode = import.meta.env.MODE === 'development';
  new Log({
    baseLogLevel:     Log.Level[dev_mode ? cfg.LOG_LEVEL_DEV : cfg.LOG_LEVEL_PROD], 
    baseTraceLevel:   Log.Level[dev_mode ? cfg.TRACE_LEVEL_DEV : cfg.TRACE_LEVEL_PROD],
  });

  if (browser && 'serviceWorker' in navigator) {
    // navigator.serviceWorker.register('/service-worker.js', {
    //     scope: '.' 
    // }).then(function(registration) {
    //     // Registration was successful
    //     console.log('ServiceWorker registration successful with scope: ', registration.scope);
    // }, function(err) {
    //     // registration failed :(
    //     console.log('ServiceWorker registration failed: ', err);
    // });
    self.addEventListener('fetch', (event) => {
      event.respondWith(
        (async () => {
          const request = event.request;
          const referer = request.headers.get('Referer'); // Originating page
          const origin = request.headers.get('Origin');   // Origin of the requester

          let response;

          // Serve from cache if available
          response = await caches.match(request);

          // Fetch from network if not in cache
          if (!response) {
            response = await fetch(request);
          }

          // Modify the response to include appropriate CSP headers
          if (response) {
            const newHeaders = new Headers(response.headers);

            // Apply sandboxed CSP if the request comes from the iframe
            if (referer && referer.includes('/canvasframe')) {
              newHeaders.set(
                'Content-Security-Policy',
                "default-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; worker-src 'none';"
              );
            } else {
              // Apply full-permission CSP for main app requests
              newHeaders.set(
                'Content-Security-Policy',
                "default-src * self blob: data: gap:; style-src * self 'unsafe-inline' blob: data: gap:; script-src * 'self' 'unsafe-eval' 'unsafe-inline' blob: data: gap:; object-src * 'self' blob: data: gap:; img-src * self 'unsafe-inline' blob: data: gap:; connect-src self * 'unsafe-inline' blob: data: gap:; frame-src * self blob: data: gap:;"
              );
            }

            return new Response(response.body, {
              status: response.status,
              statusText: response.statusText,
              headers: newHeaders,
            });
          }

          // Fallback in case of no response (e.g., offline and not cached)
          return new Response('Offline', { status: 503 });
        })()
      );
    });

  }
</script>

<svelte:head>
  {@html '<script>(' + autoModeWatcher.toString() + ')();</script>'}
  <meta name="theme-color" content="{cfg.PWA_THEME_COLOR}">
  <meta name="description" content={cfg.APP_DESCRIPTION} />
  <title>{cfg.APP_TITLE}</title>
</svelte:head>
<Modal components={modalRegistry} />
<Drawer>
  {#if drawerContent}
    <svelte:component this={drawerContent} {...props} />
  {/if}
</Drawer>
<Toast class="!z-[1000]" />
<AppShell slotSidebarLeft="bg-surface-500/5 w-56 h-[100%] p-4">
  <slot />
</AppShell>