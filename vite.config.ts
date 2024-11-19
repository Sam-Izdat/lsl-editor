import { purgeCss } from 'vite-plugin-tailwind-purgecss';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';
import pkg from './package.json';

export default defineConfig({
	plugins: [
    sveltekit(), 
    SvelteKitPWA({
      registerType: 'autoUpdate',
      injectRegister: 'inline',
      workbox: { 
        globPatterns: ['**/*.{js,wasm,css,ico,png,svg,webp,webmanifest}', '**/*.html'],
        maximumFileSizeToCacheInBytes: 10 * 1024 ** 2,
        navigationPreload: true,
        runtimeCaching: [
          {
            urlPattern: /\.(?:js|wasm|css|png|jpg|jpeg|svg|woff2)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'index-cache',
            },
          },
          {
            urlPattern: /.*/,
            handler: 'NetworkFirst',
          },
        ],
        navigateFallbackDenylist: [/canvasframe/]
      },
    }),
    purgeCss(),
    {
      name: 'no-split-iframe-group',
      config: (config) => {
        const iframeGroup = 'src/routes/(canvasframe)';
        config.build.rollupOptions = {
          ...config.build.rollupOptions,
          output: {
            manualChunks(id) {
              if (id.includes(iframeGroup)) {
                return 'iframe-group'; 
              }
            },
            entryFileNames: '[name].js',
          },
        };
      },
    },
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