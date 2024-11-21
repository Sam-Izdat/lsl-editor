<script lang="ts">
  import type { SvelteComponent } from 'svelte';
  import { Accordion, AccordionItem } from '@skeletonlabs/skeleton';
  import { TabGroup, Tab, TabAnchor } from '@skeletonlabs/skeleton';
  import { FileDropzone } from '@skeletonlabs/skeleton';
  import { RadioGroup, RadioItem } from '@skeletonlabs/skeleton';

  import { CodeBlock } from '@skeletonlabs/skeleton';
  import hljs from 'highlight.js/lib/core';
  import xml from 'highlight.js/lib/languages/xml';
  hljs.registerLanguage('xml', xml);
  import 'highlight.js/styles/github-dark-dimmed.css';
  import { storeHighlightJs } from '@skeletonlabs/skeleton';
  storeHighlightJs.set(hljs);

  import { getModalStore } from '@skeletonlabs/skeleton';

  import { Log, guessRawURL } from '$lib';
  import { cfg } from '$root/webui.config.js';

  import * as ds from '$lib/stores/doc_session';
  import type DocumentSession from '$lib/doc_types';

  export let parent: SvelteComponent;
  const modalStore = getModalStore();

  const cButton: string           = 'fixed top-4 right-4 z-50 font-bold shadow-xl';
  const cBase: string             = 'card p-4 w-modal shadow-xl space-y-4';

  let tabSet: number              = 0; // DELETEME

  const strLoadRemotely: string = "Load from Web";
  const strLoadLocally: string  = "Load Locally";
  const strImportFile: string   = "Import File";
  const strImportRawURL: string = "About External Resources";

  const fileImportHandler = (e: Event): void => {
    const target = e.target as HTMLInputElement;
    const files = target.files;
    let baseFilename = 'Untitled Script';

    if (files && files.length > 0) {
      const file = files[0];

      const validExtensions = [cfg.PWA_FILE_EXT, '.txt']; // Add your valid extensions here
      const extension = file.name.split('.').pop()?.toLowerCase();
      
      if (!validExtensions.includes(`.${extension}`)) {
        Log.toastError(`Invalid file type. Please upload a ${cfg.PWA_FILE_EXT} or .txt file.`);
        return; 
      }

      baseFilename = file.name.substring(0, file.name.lastIndexOf('.'));

      const reader = new FileReader();
      
      reader.onload = (event) => {
        const content = event.target?.result; // This will be the file content
        $modalStore[0].importFileCallback(content, baseFilename);
      };

      reader.onerror = (error) => {
        Log.error('Error reading file:', error);
      };

      reader.readAsText(file);
    } else {
      Log.warning('No file selected.');
    }
  };
  
  const registerProtocolHandler = () => {
    navigator.registerProtocolHandler(
      `web+${cfg.PWA_URL_PATTERN}`,
      `${cfg.APP_HOST_PATH}/pth?q=%s`,
    );
  };

  const copyURLToClipboard = () => {
    if (shareableURL) {
      navigator.clipboard.writeText(shareableURL).then(() => {
        Log.toastSuccess('copied to clipboard');
      }).catch(err => {
        Log.toastError('could not copy to clipboard');
        Log.error(err);
      });
    }
  };

  const copyPWAURLToClipboard = () => {
    if (shareableURL) {
      navigator.clipboard.writeText(shareablePWAURL).then(() => {
        Log.toastSuccess('copied to clipboard');
      }).catch(err => {
        Log.toastError('could not copy to clipboard');
        Log.error(err);
      });
    }
  };  

  const handlePaste = (event: ClipboardEvent) => {
    event.preventDefault();
    const pastedText = event.clipboardData.getData('text');
    extResourceValue = pastedText;
    makeURL();
  };

  let extResourceValue: string = '';
  let selectedOption: string = 'raw';
  let shareableURL: string = '';
  let shareablePWAURL: string = '';


  const defaultView       = 0;
  const defaultAutoBuild  = 0;
  const defaultReadOnly   = 0;

  $: makeURL = () => {
    if (extResourceValue.trim() === '') {
      shareableURL = ''; 
      shareablePWAURL = '';
      return; 
    }
    let rawURL = cfg.GUESS_RAW_URL ? guessRawURL(extResourceValue) : extResourceValue;
    const encodedURI = encodeURIComponent(rawURL.trim());
    if (selectedOption === 'raw') {      
      shareableURL = __BUILD_TYPE__ == 'static'
        ? `${cfg.APP_HOST_PATH}get-url?q=${encodedURI}`
        : `${cfg.APP_HOST_PATH}url/${encodedURI}`;
      shareablePWAURL = `web+${cfg.PWA_URL_PATTERN}://url/${encodedURI}`;
    } else if (selectedOption === 'gist') {
      shareableURL = __BUILD_TYPE__ == 'static'
        ? `${cfg.APP_HOST_PATH}get-gist?q=${encodedURI}`
        : `${cfg.APP_HOST_PATH}gist/${encodedURI}`;
      shareablePWAURL = `web+${cfg.PWA_URL_PATTERN}://gist/${encodedURI}`;
    }

    if (urlView != defaultView) {
      shareableURL += `${shareableURL.includes('?') ? '&' : '?'}view=${urlView}`;
      shareablePWAURL += `${shareablePWAURL.includes('?') ? '&' : '?'}view=${urlView}`;
    }
    if (urlAutoBuild != defaultAutoBuild) {
      shareableURL += `${shareableURL.includes('?') ? '&' : '?'}autobuild=${urlAutoBuild}`;
      shareablePWAURL += `${shareablePWAURL.includes('?') ? '&' : '?'}autobuild=${urlAutoBuild}`;
    }
    if (urlReadOnly != defaultReadOnly) {
      shareableURL += `${shareableURL.includes('?') ? '&' : '?'}readonly=${urlReadOnly}`;
      shareablePWAURL += `${shareablePWAURL.includes('?') ? '&' : '?'}readonly=${urlReadOnly}`;
    }
  };

  $: iframeWidth            = null;
  $: iframeHeight           = null;
  $: iframeAllowFullscreen  = 1;
  $: urlView                = 0;
  $: urlAutoBuild           = 0;
  $: urlReadOnly            = 0;

  $: if (urlView !== undefined)       makeURL();
  $: if (urlAutoBuild !== undefined)  makeURL();
  $: if (urlReadOnly !== undefined)   makeURL();

  // Icons
  import { Icon } from 'svelte-hero-icons';
  import * as hero from 'svelte-hero-icons';
  import { CustomIcon } from '$lib/components/icons';
  import * as ico from '$lib/components/icons';
</script>


{#if $modalStore[0]}
  <div class="{cBase}">

    <TabGroup>
      <Tab bind:group={tabSet} name="tab3" value={0}>
        <svelte:fragment slot="lead"><Icon src="{hero.ArrowDownTray}" size="20" style="margin: 4px auto;" alt={strImportFile} solid/></svelte:fragment>
        <span class="hidden lg:inline ml-2">Import / Export File</span>
      </Tab>
      <Tab bind:group={tabSet} name="tab3" value={1}>
        <svelte:fragment slot="lead"><Icon src="{hero.Link}" size="20" style="margin: 4px auto;" alt={strImportRawURL} solid/></svelte:fragment>
        <span class="hidden lg:inline ml-2">Import / Share External</span>
      </Tab>
      <svelte:fragment slot="panel">
        <div class="h-full overflow-auto text-sm border border-primary-900/30">
        {#if tabSet === 0}
          <div class="card min-h-48 bg-surface-50-900-token shadow-inner divide-y divide-surface-400/10 rounded h-56 overflow-y-auto">  
            <FileDropzone name="files" class="h-28" on:change={fileImportHandler}>    
              <svelte:fragment slot="lead">
                <Icon src="{hero.ArrowDownTray}" size="20" class="mx-auto" solid/>
              </svelte:fragment>
              <svelte:fragment slot="message">Import</svelte:fragment>
              <svelte:fragment slot="meta">browse or drag: {cfg.PWA_FILE_EXT}, .txt</svelte:fragment>
            </FileDropzone>
            <div class="flex justify-center p-1">
              <button title="Export" class="btn mt-8 variant-ghost-primary" 
                on:click={$modalStore[0].exportFileCallback}>
                <Icon src="{hero.ArrowUpTray}" size="20" style="margin: 2px auto;" solid/>
                <span>Export</span>
              </button> 
            </div>
          </div>
        {:else if tabSet === 1}
          <div class="card min-h-48 bg-surface-50-900-token shadow-inner divide-y divide-surface-400/10 h-56 overflow-y-auto">

          <form on:submit|preventDefault>
            <div class="card p-4 w-full text-token space-y-4">
              <div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
                <div class="input-group-shim">
                  <Icon src="{hero.Link}" size="20" solid/>
                </div>
                <input 
                  type="text" 
                  placeholder="URL/URI" 
                  bind:value={extResourceValue} 
                  on:input={makeURL} 
                  on:paste={handlePaste} 
                  class="flex-grow" 
                />
                <select bind:value={selectedOption} on:change={makeURL}>
                  <option value='raw'>Raw URL</option>
                  <option value='gist'>Gist ID</option>
                </select>
              </div>
            </div>
          </form>



            <Accordion>
              <AccordionItem>
                <svelte:fragment slot="lead">
                  <Icon src="{hero.InformationCircle}" size="20" style="margin: 4px auto;" alt="About" solid/>
                </svelte:fragment>
                <svelte:fragment slot="summary"><p class="font-semibold text-base">{strImportRawURL}</p></svelte:fragment>
                <svelte:fragment slot="content">
                  <p class="text-sm">
                    You can import externally-hosted scripts if you have a URL to a raw script file or a 
                    <a href="https://gist.github.com/" target="_blank">gist</a> ID. 
                    The import link generated will be shareable and will stay up to date if the file changes on the external host. 
                    You can also embed this editor with its external resource in an iframe - e.g. to post on a blog.
                  </p>
                  <p class="text-sm">
                    If you install the PWA with a capable browsser, you can also change the protcol of any raw <code>https://</code> URL to 
                    <code>web+{cfg.PWA_URL_PATTERN}://</code> in order to import the script into the editor. If you cannot or do 
                    not wish to install the PWA, you can register a protocol handler to do the same.
                  </p>
                  <div class="flex justify-center">
                    <button class="btn {parent.buttonNeutral}" on:click={registerProtocolHandler}>
                      Register Protocol Handler
                    </button>
                  </div>
                </svelte:fragment>
              </AccordionItem>
              <AccordionItem open>
                <svelte:fragment slot="lead">
                  <Icon src="{hero.Share}" size="20" style="margin: 4px auto;" alt="link" solid/>
                </svelte:fragment>
                <svelte:fragment slot="summary"><p class="font-semibold text-base">Shareable Link</p></svelte:fragment>
                <svelte:fragment slot="content">


                  <div class="card variant-soft-secondary">
                    <div class="flex items-center justify-between p-2">
                      <div class="flex-grow truncate overflow-hidden text-ellipsis whitespace-nowrap text-left max-w-[calc(100%-64px)]">
                        {shareableURL}
                      </div>
                      <div class="flex space-x-2">
                        <button on:click={copyURLToClipboard} title="Copy to Clipboard">
                          <Icon src="{hero.ClipboardDocumentCheck}" size="20" solid/>
                        </button>
                        <button on:click={() => window.open(shareableURL, '_blank')} title="Go">
                          <Icon src="{hero.ArrowRightCircle}" size="20" solid/>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div class="card variant-soft-secondary">
                    <div class="flex items-center justify-between p-2">
                      <div class="flex-grow truncate overflow-hidden text-ellipsis whitespace-nowrap text-left max-w-[calc(100%-64px)]">
                        {shareablePWAURL}
                      </div>
                      <div class="flex space-x-2">
                        <button on:click={copyPWAURLToClipboard} title="Copy to Clipboard">
                          <Icon src="{hero.ClipboardDocumentCheck}" size="20" solid/>
                        </button>
                        <button on:click={() => window.open(shareablePWAURL, '_blank')} title="Go">
                          <Icon src="{hero.ArrowRightCircle}" size="20" solid/>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center justify-center my-1">
                    <RadioGroup class="mx-1">
                      <RadioItem bind:group={urlView} name="url-view" value={0} title="Split-Pane">
                        <Icon src="{hero.RectangleGroup}" size="16" class="mx-0 my-1" solid/>
                      </RadioItem>
                      <RadioItem bind:group={urlView} name="url-view" value={1} title="View Code">
                        <Icon src="{hero.CodeBracket}" size="16" class="mx-0 my-1" solid/>
                      </RadioItem>
                      <RadioItem bind:group={urlView} name="url-view" value={2} title="View Canvas">
                        <Icon src="{hero.Photo}" size="16" class="mx-0 my-1" solid/>
                      </RadioItem>
                      <RadioItem bind:group={urlView} name="url-view" value={3} title="View Controls">
                        <Icon src="{hero.AdjustmentsHorizontal}" size="16" class="mx-0 my-1" solid/>
                      </RadioItem>
                    </RadioGroup>
                  </div>
                  <div class="flex items-center justify-center my-1">
                    <RadioGroup class="mx-1" on:change={makeURL}>
                      <RadioItem 
                        bind:group={urlAutoBuild} 
                        on:click={() => {urlAutoBuild = +!urlAutoBuild;}}
                        name="url-autobuild" value={+!defaultAutoBuild} title="Auto-Build"
                      >
                        <CustomIcon src={ico.ClockCycle} size='16' class="mx-0 my-1" />
                      </RadioItem>
                    </RadioGroup>
                    <RadioGroup class="mx-1" on:change={makeURL}>
                      <RadioItem 
                        bind:group={urlReadOnly} 
                        on:click={() => {urlReadOnly = +!urlReadOnly;}}
                        name="url-readonly" value={+!defaultReadOnly} title="Read-Only"
                      >
                        <Icon src="{urlReadOnly ? hero.LockClosed : hero.LockOpen}" size="16" class="mx-0 my-1" solid/>
                      </RadioItem>
                    </RadioGroup>
                  </div>

                </svelte:fragment>
              </AccordionItem>
              <AccordionItem>
                <svelte:fragment slot="lead">
                  <Icon src="{hero.CodeBracketSquare}" size="20" style="margin: 4px auto;" alt="link" solid/>
                </svelte:fragment>
                <svelte:fragment slot="summary"><p class="font-semibold text-base">Embed</p></svelte:fragment>
                <svelte:fragment slot="content">
                  <CodeBlock language="html" code={
                  `<iframe ` +
                  `\n  width="${iframeWidth || 800}" `+
                  `\n  height="${iframeHeight || 600}" ` + 
                  `${iframeAllowFullscreen ? '\n  allow="fullscreen" ' : ''}` + 
                  `\n  src="${shareableURL || '[PROVIDE URL ABOVE]'}" ` + 
                  `\n  title="${cfg.APP_TITLE}">`}>
                  </CodeBlock>
                  <div>
                    <div class="flex items-center justify-center">
                      <input 
                        class="input w-28 display-inline-block m-1" 
                        title="Width" 
                        type="text" 
                        placeholder="Width" 
                        bind:value={iframeWidth}
                      />
                      <input 
                        class="input w-28 display-inline-block m-1" 
                        title="Height" 
                        type="text" 
                        placeholder="Height" 
                        bind:value={iframeHeight}
                      />
                      <RadioGroup class="mx-1">
                        <RadioItem 
                          bind:group={iframeAllowFullscreen} 
                          on:click={() => {iframeAllowFullscreen = +!iframeAllowFullscreen;}}
                          name="iframe-allow-fullscreen" value={1} title="Allow Fullscreen"
                        >
                          <Icon src="{hero.ArrowsPointingOut}" size="16" class="mx-0 my-1" solid/>
                        </RadioItem>
                      </RadioGroup>
                    </div>
                  </div>
                </svelte:fragment>
              </AccordionItem>
            </Accordion>
          </div>
        {/if}
        </div>
      </svelte:fragment>
    </TabGroup>
    <footer class="flex justify-between items-center p-2 m-0 border border-primary-800/30 rounded shadow-xl">
      <div class="text-left pl-4">
          <h4 class="h4">{$modalStore[0].title ?? 'Import / Export'}</h4>
      </div>
      <div class="flex justify-end">
          <button class="btn {parent.buttonNeutral}" on:click={parent.onClose}>Close</button>
      </div>
    </footer>
  </div>
{/if}