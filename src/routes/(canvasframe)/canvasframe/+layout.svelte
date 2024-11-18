<script>
  import { browser } from '$app/environment';
  if (browser) {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js', {
          scope: '.' 
      }).then(function(registration) {
          // Registration was successful
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
      }, function(err) {
          // registration failed :(
          console.log('ServiceWorker registration failed: ', err);
      });
    }
  }
</script>
<slot />