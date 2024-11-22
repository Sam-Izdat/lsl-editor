<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { cfg } from '$root/webui.config.js';
  import { CustomCodeBlock } from '$lib/components';
  import hljs from 'highlight.js/lib/core';
  import { storeHighlightJs } from '@skeletonlabs/skeleton';

  import { Log } from '$lib';

  const loadLanguage = async (language) => {
    let langModule; 
    switch (language) {
      case 'javascript':
        langModule = await import(`highlight.js/lib/languages/javascript`);
        break;
      case 'typescript':
      case 'ts':        
        langModule = await import(`highlight.js/lib/languages/typescript`);
        break;
      case 'python':
      case 'py':
        langModule = await import(`highlight.js/lib/languages/python`);
        break;
      case 'lua':
        langModule = await import(`highlight.js/lib/languages/lua`);
        break;
      case 'rust':
      case 'rs':
        langModule = await import(`highlight.js/lib/languages/rust`);
        break;
      case 'perl':
        langModule = await import(`highlight.js/lib/languages/perl`);
        break;
      case 'bash':
      case 'sh':
        langModule = await import(`highlight.js/lib/languages/bash`);
        break;
      case 'angelscript':
      case 'asc':
        langModule = await import(`highlight.js/lib/languages/angelscript`);
        break;
      case 'go':
        langModule = await import(`highlight.js/lib/languages/go`);
        break;
      case 'glsl':
        langModule = await import(`highlight.js/lib/languages/glsl`);
        break;
      // FIXME: Not sure how to include these -- files don't exist, though they are listed as supported:
      // https://github.com/highlightjs/highlight.js/tree/main/src/languages
      // https://github.com/highlightjs/highlight.js/blob/main/SUPPORTED_LANGUAGES.md
      // case 'hlsl':
      //   langModule = await import(`highlight.js/lib/languages/hlsl`);
      //   break;
      // case 'wgsl':
      //   langModule = await import(`highlight.js/lib/languages/wgsl`);
      //   break;
      case 'csharp':
      case 'cs':
        langModule = await import(`highlight.js/lib/languages/csharp`);
        break;
      case 'cpp':
      case 'c++':
      case 'cxx':
        langModule = await import(`highlight.js/lib/languages/cpp`);
        break;
      case 'c':
      case 'clang':
      default:
        langModule = await import(`highlight.js/lib/languages/c`);
    }
    return langModule.default; // Return the language module
  }

  const themes = {
    'github': () => import('highlight.js/styles/github.css'),
    'github-dark': () => import('highlight.js/styles/github-dark.css'),
    'github-dark-dimmed': () => import('highlight.js/styles/github-dark-dimmed.css'),
    'stackoverflow-light': () => import('highlight.js/styles/stackoverflow-light.css'),
    'stackoverflow-dark': () => import('highlight.js/styles/stackoverflow-dark.css'),
  };

  let failed = false;  

  let uri = '';
  let url = '';
  let uriType = 'url';
  let script = '// ...';
  let inplace = true;
  let activeTheme = null; 
  let editorParamStr = '';

  const editorParamList = ['view', 'readonly', 'autobuild'];

  $: editorURL = uriType == 'gist' 
    ? `./get-gist?q=${uri}${editorParamStr}`
    : `./get-url?q=${url}${editorParamStr}`;

  // This doesn't actually work more than once.
  // Maybe something is getting cached. Possibly another stupid sveltekit thing. Could be vite.
  const setTheme = async (newTheme) => {
    loadLanguage(cfg.EDITOR_LANGUAGE.toLowerCase()).then((lang) => {
      hljs.registerLanguage((cfg.LANGUAGE_ALIAS).toLowerCase(), lang);      
      storeHighlightJs.set(hljs);
    });

    if (newTheme === activeTheme) return;
    document.querySelectorAll('[data-hljs-theme]').forEach(style => style.remove());
    const styleModule = await themes[newTheme]();
    const styleTag = document.createElement('style');
    const css = `${styleModule.default} /* ${Date.now()} */`; 
    styleTag.textContent = css;
    styleTag.setAttribute('data-hljs-theme', newTheme);
    document.head.appendChild(styleTag);
    activeTheme = newTheme;
  };

  let isDark = true;

  onMount(async () => {
    const winURL = new URL(window.location.href);  
    const winParams = new URLSearchParams(winURL.search); 
    isDark = !!parseInt(winParams.get('dark') ?? 1);
    await setTheme(isDark ? 'github-dark' : 'github');

    uri = winParams.get('q');
    if (uri) {
      try {
        uriType = winParams.get('type') ?? uriType;
        if (uriType == 'gist') {
          let rawURL: string = `https://api.github.com/gists/${uri}`;
          rawURL += (rawURL.includes('?') ? '&' : '?') + `cacheBust=${Date.now()}`;
          fetch(rawURL)
            .then(response => {
              if (!response.ok) {
                failed = true;
                throw new Error('Network response was not ok');
              }
              return response.json();
            })
            .then(gist => {
              const firstEntry = Object.entries(gist.files)[0];
              const [firstKey, firstValue] = firstEntry ?? [];
              return firstValue.content;
            })
            .then(data => {
              script = data;
            })
            .catch(e => {
              console.error(e);
              script = `// Failed to load script: ${e.message}`;
            });
        } else {
          // assume URL (default)
          let rawURL = uri;
          rawURL += (rawURL.includes('?') ? '&' : '?') + `cacheBust=${Date.now()}`;
          fetch(rawURL)
            .then(response => {
              if (!response.ok) {
                failed = true;
                throw new Error('Network response was not ok');
              }
              return response.text(); 
            })
            .then(data => {
              url = winParams.get('q');
              script = data;
            })
            .catch(e => {
              console.error(e);
              script = `// Failed to load script: ${e.message}`;
            })
        }
      } catch(e) {
        console.error(e);
        script = `// Failed to load script: ${e.message}`;
        throw(e);
      }

      inplace = !!parseInt(winParams.get('inplace')) ?? inplace;
      editorParamList.forEach(param => {
        let val = winParams.get(param);
        if (val) editorParamStr += (editorURL.includes('?') ? '&' : '?') + `${param}=${val}`;
      });
    }
  });

</script>
<div class="code_container">
  <CustomCodeBlock 
    language="legitsl" 
    code={script} 
    background="{isDark ? 'bg-stone-900' : 'bg-neutral-100'}"  
    color="{isDark ? 'text-neutral-100' : 'text-neutral-900'}"
    darkMode={isDark}
    editorURL={editorURL}
    inplace={inplace}
  >
  </CustomCodeBlock>
</div>
<style>
  @import '$lib/styles/code.css'
</style>