<script lang="ts">
  import type { SvelteComponent } from 'svelte';
  import { Accordion, AccordionItem } from '@skeletonlabs/skeleton';
  import { TabGroup, Tab, TabAnchor } from '@skeletonlabs/skeleton';

  import { Log } from '$lib';
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { debugStore } from '$lib/stores';
  import type { DebugMap, DebugLine } from '$lib/stores/stack_trace';

  import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';
  export let monacoEditor: Monaco.editor.IStandaloneCodeEditor;
  import { monacoStore, isDark } from '$lib/stores';
  import { get } from 'svelte/store';
  let monaco: typeof Monaco = get(monacoStore);
  monacoStore.subscribe(value => (monaco = value));

  // export let parent: SvelteComponent;

  // State
  let errors: Map = new Map();
  let script: string  = '';
  let decorations: monaco.editor.IEditorDecorationsCollection;

  // Icons
  // import { Icon } from 'svelte-hero-icons';
  // import * as hero from 'svelte-hero-icons';
  // import { CustomIcon } from '$lib/components/icons';
  // import * as ico from '$lib/components/icons';

  const findCodeString = (searchString) => {
    const model = monacoEditor.getModel();
    const content = model.getValue();

    const startIndex = content.indexOf(searchString);
    if (startIndex === -1) return; 

    const startPosition = model.getPositionAt(startIndex);
    const endPosition = model.getPositionAt(startIndex + searchString.length);
    return {
      lineStart: startPosition.lineNumber, 
      colStart: startPosition.column, 
      lineEnd: endPosition.lineNumber, 
      colEnd:endPosition.column,
      };
  };

  const markLineCol = (err, lineStart, colStart, lineEnd = null, colEnd = null) => {
    const model = monacoEditor.getModel();
    const wordInfo = model.getWordAtPosition({ lineNumber: lineStart, column: colStart });
    const lineContent = model.getLineContent(lineStart);
    const colEndToken = wordInfo ? wordInfo.endColumn : lineContent.length + 1;
    decorations.set([
      {
        range: new monaco.Range(lineStart, 1, lineStart, 1),
        options: {
          isWholeLine: true,
          className: "compileErrorGlyph",
          glyphMarginClassName: "compileErrorBackground",
        },
      },
    ]);
    monaco.editor.setModelMarkers(model, 'taichijs', [
      {
        severity: monaco.MarkerSeverity.Error,
        startLineNumber: lineStart,
        startColumn: colStart,
        endLineNumber: lineEnd ?? lineStart,
        endColumn: colEnd ?? colEndToken,
        message: err,
      }
    ]);
  };

  function unMarkLines(){
    const model = monacoEditor.getModel()
    if (model) {
      monaco.editor.setModelMarkers(model, "taichijs", [])
      decorations.set([])
    }
  };

  const jumpToPos = (lineno, colno) => {
    monacoEditor.setPosition({ lineNumber: lineno, column: colno });
    monacoEditor.revealPositionInCenter({ lineNumber: lineno, column: colno });
  }

  const handleBuildStart = (e: CustomEvent) => {
    if (decorations) unMarkLines();
    decorations = monacoEditor.createDecorationsCollection([]); 
    debugStore.clear();
    errors.clear();
    script = e.detail.script ?? '';
  };

  const handleErrorSelect = (message, lineno, colno) => {
    unMarkLines(); 
    markLineCol(message, lineno, colno);
    jumpToPos(lineno, colno);
  }

  const handleError = (e: CustomEvent) => {
    const { name, message, hash } = e.detail;
    errors.set(hash, `${name}: ${message}`);
  };

  const handleStackLine = (e: CustomEvent) => {
    const { source, lineno, colno, hash } = e.detail;
    debugStore.addTrace(hash, { source, lineno, colno });
    if ($debugStore.size == 1 && $debugStore.values().next().value.length == 1) {
      unMarkLines();
      markLineCol(errors.get(hash) ?? 'error', lineno, colno);
    }
  };
  
  onMount(async () => {
    if (browser) {
      window.addEventListener('build-start', handleBuildStart as EventListener);
      window.addEventListener('build-error', handleError as EventListener);
      window.addEventListener('build-err-stack-line', handleStackLine as EventListener);
    }
  });
  onDestroy(() => {
    if (browser) {
      window.removeEventListener('build-start', handleBuildStart as EventListener);
      window.removeEventListener('build-error', handleError as EventListener);
      window.removeEventListener('build-err-stack-line', handleStackLine as EventListener);
    }
  });
</script>


<Accordion padding="py-1 px-1">

  {#each $debugStore as [errorId, stackLines]}
  <AccordionItem open class="variant-ghost-error ">
    <svelte:fragment slot="summary">
      <p class="font-semibold text-base alert m-1 px-3 py-0">
        {errors.get(errorId) ?? ''}
      </p>
    </svelte:fragment>
    <svelte:fragment slot="content">
      <div class="table-container w-full p-0 m-0">
        <table class="table table-hover m-0">
          <thead>
            <tr>
              <th class="w-full !p-1">Error</th>
              <th class="w-24 !p-1">Line</th>
              <th class="w-24 !p-1">Col</th>
            </tr>
          </thead>
          <tbody class="font-mono">
            {#each stackLines as { source, lineno, colno }}
              <tr>
                <td class="!pt-1 !pb-1">
                  <button class="w-full text-left" on:click={
                    () => { handleErrorSelect(errors.get(errorId), lineno, colno) }
                  }>
                    {source}
                  </button>
                </td>
                <td class="!pt-1 !pb-1">{lineno}</td>
                <td class="!pt-1 !pb-1">{colno}</td>
              </tr>
              <tr>
                <td id="row_{errorId}_{lineno}_{colno}" colspan=3 class="!pt-1 !pb-1 hidden">
                  <div id="callgraph_{errorId}_{lineno}_{colno}" class="h-fit w-full flex justify-center p-2 callgraph" />
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </svelte:fragment>
  </AccordionItem>
  {/each}
</Accordion>
<style>
:global(.callgraph > svg)  {
  width: 100%;
  filter: drop-shadow(2px 4px 6px rgba(0, 0, 0, 0.4)) !important;
}
:global(.callgraph > svg polygon)  {
  opacity: 0.2 !important;
}

:global(html.dark .callgraph > svg)  {
  fill: #fff !important;
}

:global(.callgraph > svg text)  {
  padding: 10px;
}

:global(.compileErrorGlyph) {
  background-color: rgba(255, 0, 0, 0.2); /* Just an example color */
}
:global(.compileErrorBackground) {
  border-left: 2px solid red;
}
</style>