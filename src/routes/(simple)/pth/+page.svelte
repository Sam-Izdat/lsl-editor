<script>
  import { onMount } from 'svelte';

  let appURL = null;
  let outURL = null;

  onMount(() => {
    const url = new URL(window.location.href);  
    const searchParams = new URLSearchParams(url.search); 

    appURL = searchParams.has('q') ? new URL(decodeURIComponent(searchParams.get('q'))) : null;

    if (appURL) {
      if (appURL.hostname == 'url' && appURL.pathname) {
        outURL = './get-url?q='+appURL.pathname.split('/')[1] ?? '';
      } else if (appURL.hostname == 'gist' && appURL.pathname) {
        outURL = './get-gist?q='+appURL.pathname.split('/')[1] ?? '';
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