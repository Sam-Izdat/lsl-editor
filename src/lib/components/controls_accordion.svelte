<script lang="ts">
  import type { SvelteComponent } from 'svelte';
  import { Accordion, AccordionItem } from '@skeletonlabs/skeleton';

  import { 
    DebugTable,
    ProgControls,
  }  from '$lib/components';

  import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';
  export let monacoEditor: Monaco.editor.IStandaloneCodeEditor;

  // Icons
  import { Icon } from 'svelte-hero-icons';
  import * as hero from 'svelte-hero-icons';
  import { CustomIcon } from '$lib/components/icons';
  import * as ico from '$lib/components/icons';
</script>
<Accordion regionControl="border border-primary-800/30 shadow-xl">
  <AccordionItem open padding="py-1 px-1">
    <svelte:fragment slot="lead">
      <Icon src="{hero.BugAnt}" size="20" class="mx-1 my-1" solid/>
    </svelte:fragment>
    <svelte:fragment slot="summary"><p class="font-semibold text-base">Debug</p></svelte:fragment>
    <svelte:fragment slot="content">      
      <DebugTable monacoEditor={monacoEditor} />
    </svelte:fragment>
  </AccordionItem>
  <AccordionItem open padding="py-1 px-1">
    <svelte:fragment slot="lead">
      <Icon src="{hero.AdjustmentsHorizontal}" size="20" class="mx-1 my-1" solid/>
    </svelte:fragment>
    <svelte:fragment slot="summary"><p class="font-semibold text-base">Controls</p></svelte:fragment>
    <svelte:fragment slot="content">      
      <ProgControls/>
    </svelte:fragment>
  </AccordionItem>
</Accordion>