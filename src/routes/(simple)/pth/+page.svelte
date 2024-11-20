<script>
  import { onMount } from 'svelte';

  let params = {};

  onMount(() => {
    const url = new URL(window.location.href);  // Get current URL
    const searchParams = new URLSearchParams(url.search);  // Extract query parameters
    
    if (searchParams.has('url')) {
      window.location='./get-url?q='+searchParams.get('url');
    } else if (searchParams.has('gist')) {
      window.location='./get-gist?q='+searchParams.get('gist');
    } else {
      searchParams.forEach((value, key) => {
        params[key] = value;
      });
    }

  });
</script>

{#if Object.keys(params).length > 0}
  <h3>Unrecognized query parameters:</h3>
  <ul>
    {#each Object.entries(params) as [key, value]}
      <li>{key}: {value}</li>
    {/each}
  </ul>
{/if}