import { purgeCss } from 'vite-plugin-tailwind-purgecss';
import { VitePWA } from 'vite-plugin-pwa';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import pkg from './package.json';

export default defineConfig({
	plugins: [
    sveltekit(), 
    purgeCss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        maximumFileSizeToCacheInBytes: 10 * 1024 ** 2,
        runtimeCaching: [
          {
            urlPattern: /\.(?:js|wasm|css|png|jpg|jpeg|svg|woff2)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'dynamic-resources',
            },
          },
          {
            urlPattern: /.*/,
            handler: 'NetworkFirst',
          },
        ],
      },
    }),
  ],
  define: {
    __APP_NAME__: JSON.stringify(pkg.name),
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_TYPE__: JSON.stringify(process.env.BUILD_TYPE)
  },
  optimizeDeps: {
    //exclude: ['./src/lib/vendor/LegitScriptWasm.js', './src/lib/vendor/LegitScriptWasm.js']
  },
  //ssr: { noExternal: ['./src/lib/vendor/LegitScriptWasm.js'] }
});