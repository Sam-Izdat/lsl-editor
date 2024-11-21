<script>
  import { onMount } from 'svelte';
  import { guessRawURL } from '$lib';
  import { cfg } from '$root/webui.config.js';

  let appURL = null;
  let outURL = null;

  onMount(() => {
    const url = new URL(window.location.href);  
    const searchParams = new URLSearchParams(url.search); 

    const appHref = searchParams.get('q');
    appURL = searchParams.has('q') ? new URL(appHref) : null;

    if (appURL) {
      if (appURL.hostname == 'url' && appURL.pathname) {
        let remoteURL = new URL(appHref).pathname.replace(/^\/+/, '');
        outURL = './get-url?q='+remoteURL ?? '';
      } else if (appURL.hostname == 'gist' && appURL.pathname) {
        outURL = './get-gist?q='+appURL.pathname.split('/')[1] ?? '';
      } else if (appURL.hostname) {
        // assume actual URL
        let remoteURL = guessRawURL(appHref.replace('web+'+cfg.PWA_URL_PATTERN, 'https'));
        outURL = './get-url?q='+encodeURIComponent(remoteURL) ?? '';
      }
      appURL.searchParams.forEach((value, key) => {
        outURL += `${outURL.includes('?') ? '&' : '?'}${key}=${value}`;
      });
      window.location=outURL;
    }
  });
</script>

{#if outURL === null}
  <h3>Couldn't make sense of URL...</h3>
{/if}