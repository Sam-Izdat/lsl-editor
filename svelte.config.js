// import adapter from '@sveltejs/adapter-auto';
import adapter from '@sveltejs/adapter-static';
import { APP_BASE_PATH } from './src/webui.config.js';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/* @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			fallback: 'index.html'
		}),
  	prerender: {
			crawl: true,
			entries: process.env.BUILD_TYPE === 'static' 
				? ['/', '/pth', '/code-viewer', '/canvasframe-error', '/open-file', '/get-gist', '/get-url', '/gist/0', '/url/0'] // static routes here
				: [] // leave empty dynamic routes
		},
    paths: {
      base: APP_BASE_PATH
    },
    alias: {
    	'$root': './src/*'
    }
	},
	extensions: ['.svelte'],
	preprocess: [vitePreprocess()],
};
export default config;