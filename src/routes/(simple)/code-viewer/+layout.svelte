<script lang="ts">
  import '../../app.postcss';
</script>
<svelte:head>
  <meta http-equiv="Content-Security-Policy" content="default-src * self blob: data: gap:; style-src * self 'unsafe-inline' blob: data: gap:; script-src * 'self' 'unsafe-eval' 'unsafe-inline' blob: data: gap:; object-src * 'self' blob: data: gap:; img-src * self 'unsafe-inline' blob: data: gap:; connect-src self * 'unsafe-inline' blob: data: gap:; frame-src * self blob: data: gap:; worker-src 'self' blob:;">
  <meta http-equiv="Permissions-Policy" content="storage-access=(), fullscreen=(self)">
</svelte:head>
<slot />