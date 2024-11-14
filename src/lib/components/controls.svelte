<script lang="ts">
  import { Log } from '$lib';
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { 
    contextValues,
    contextVars,
    handleContextUpdate 
  } from '$lib/stores';

  // import { RangeSlider } from '@skeletonlabs/skeleton';
  import { CustomRangeSlider } from '$lib/components';
  import { SlideToggle } from '@skeletonlabs/skeleton';

  import { txContextValue } from '$lib/harbor';

  const handleValueUpdate = (name, value) => {
    let canvasframe = document.querySelector("#canvasframe");
    let canvasframeWindow = canvasframe.contentWindow;
    txContextValue(canvasframeWindow, name, value)
  }

  onMount(async () => {
    if (browser) {
      window.addEventListener('prog-context-update', handleContextUpdate as EventListener);
    }
  });
  onDestroy(() => {
    if (browser) {
      window.removeEventListener('prog-context-update', handleContextUpdate as EventListener);
    }
  });
</script>

{#each $contextVars as item, i (item)}
  {#if item.type == 'TextRequest'}
    <div class="card text-token card m-2 p-2 border border-primary-800/30 rounded">
      <span class="flex-auto">{item.text}</span>
    </div>
  {:else if item.type == 'FloatRequest'}
    <div class="card rounded m-2 p-2 border border-primary-800/30 rounded">
      <CustomRangeSlider 
        name="ctrl-float-slider-{i}" 
        bind:value={$contextValues[item.name]} 
        max={item.max_val} 
        min={item.min_val} 
        step={0.001} 
        on:input={() => {handleValueUpdate(item.name, $contextValues[item.name])}}
        ticked
      >
        <div class="flex justify-between items-center">
          <div>{item.name}</div>
          <div class="text-xs">{parseFloat($contextValues[item.name]).toFixed(6)} / {item.max_val}</div>
        </div>
      </CustomRangeSlider>
    </div>
  {:else if item.type == 'IntRequest'}
    <div class="card rounded m-2 p-2 border border-primary-800/30 rounded">
      <CustomRangeSlider 
        name="ctrl-int-slider-{i}" 
        bind:value={$contextValues[item.name]} 
        max={item.max_val} 
        min={item.min_val}  
        step={1} 
        on:input={() => {handleValueUpdate(item.name, $contextValues[item.name])}}
        ticked
      >
        <div class="flex justify-between items-center">
          <div>{item.name}</div>
          <div class="text-xs">{parseInt($contextValues[item.name])} / {item.max_val}</div>
        </div>
      </CustomRangeSlider>
    </div>
  {:else if item.type == 'BoolRequest'}
    <div class="card rounded m-2 px-2 pt-2 pb-0 border border-primary-800/30 rounded">        
      <SlideToggle 
        name="ctrl-checkbox-{i}" 
        bind:checked={$contextValues[item.name]} 
        on:change={() => {handleValueUpdate(item.name, $contextValues[item.name])}} 
        size="sm"
      >
        {item.name}
      </SlideToggle>
    </div>
  {/if}
{/each}