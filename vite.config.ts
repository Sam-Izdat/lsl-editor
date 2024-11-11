import { purgeCss } from 'vite-plugin-tailwind-purgecss';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import pkg from './package.json';

export default defineConfig({
	plugins: [sveltekit(), purgeCss()],
  define: {
    __APP_NAME__: JSON.stringify(pkg.name),
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_TYPE__: JSON.stringify(process.env.BUILD_TYPE)
  },
  optimizeDeps: {
    exclude: ['./src/lib/vendor/LegitScriptWasm.js', './src/lib/vendor/LegitScriptWasm.js']
  },
  ssr: { noExternal: ['./src/lib/vendor/LegitScriptWasm.js'] }
});