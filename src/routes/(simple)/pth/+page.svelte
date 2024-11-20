<script>
  import { onMount } from 'svelte';

  let appURL = null;
  let params = {};

  onMount(() => {
    const url = new URL(window.location.href);  
    const searchParams = new URLSearchParams(url.search); 

    appURL = searchParams.has('q') ? new URL(decodeURIComponent(searchParams.get('q'))) : null;

    let outURL = null;

    if (appURL.hostname == 'url' && appURL.pathname) {
      outURL = './get-url?q='+appURL.pathname.split('/')[1] ?? '';
    } else if (appURL.hostname == 'gist' && appURL.pathname) {
      outURL = './get-gist?q='+appURL.pathname.split('/')[1] ?? '';
    } 

    if (outURL) {
      window.location=outURL;
    }

    if (!searchParams.has('q')) {
      searchParams.forEach((value, key) => {
        params[key] = value;
      }); 
    }

  });
</script>

{#if appURL === null}
  <h3>Missing query</h3>
{/if}
{#if Object.keys(params).length > 0}
  <h3>Unrecognized parameters:</h3>
  <ul>
    {#each Object.entries(params) as [key, value]}
      <li>{key}: {value}</li>
    {/each}
  </ul>
{/if}