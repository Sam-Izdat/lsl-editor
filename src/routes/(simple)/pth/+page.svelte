<script>
  import { onMount } from 'svelte';
  import { guessRawURL } from '$lib';
  import { cfg } from '$root/webui.config.js';

  // current window URL
  let winURL;
  // current window URL parameters
  let winParams;

  // decoded app-protocol href
  let appHref;
  // decoded app-protocol URL
  let appURL;

  // redirect href (starts undefined, goes null on failure)
  let outHref;

  let realURL = false;

  onMount(() => {
    winURL = new URL(window.location.href);  
    winParams = new URLSearchParams(winURL.search); 

    appHref = winParams.get('q');
    appURL = appHref ? new URL(appHref) : null;

    if (appURL) {
      if (appURL.hostname == 'url' && appURL.pathname) {
        let remoteURL = appURL.pathname.replace(/^\/+/, '');
        // match web+app://url/[encoded-url]
        outHref = './get-url?q='+remoteURL ?? '';
      } else if (appURL.hostname == 'gist' && appURL.pathname) {
        // match web+app://gist/[gist-id]
        outHref = './get-gist?q='+appURL.pathname.split('/')[1] ?? '';
      } else if (appURL.hostname) {
        // assume actual URL
        realURL = true;
        let remoteURL = guessRawURL(appHref.replace('web+'+cfg.PWA_URL_PATTERN, 'https'));
        outHref = './get-url?q='+encodeURIComponent(remoteURL) ?? '';
      } else {
        outHref = null;
      }

      // collect params; skip real to URLs avoid param collisions...
      // non-encoded URLs will be loaded with app defaults
      if (outHref && !realURL) {
        appURL.searchParams.forEach((value, key) => {
          outHref += `${outHref.includes('?') ? '&' : '?'}${key}=${value}`;
        });
        window.location=outHref; 
      }
    } else {
      outHref = null;
    }
  });
</script>

{#if outHref === null}
<h3>could not make sense of URL...</h3>
{/if}