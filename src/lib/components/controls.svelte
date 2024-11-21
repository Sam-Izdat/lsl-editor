<script lang="ts">
  import { Log } from '$lib';
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { 
    contextValues,
    contextVars,
    handleContextUpdate,
    sendContextValueUpdate,
  } from '$lib/stores';

  // import { RangeSlider } from '@skeletonlabs/skeleton';
  import { CustomRangeSlider } from '$lib/components';
  import { SlideToggle } from '@skeletonlabs/skeleton';

  let unsubscribe = () => {};

  onMount(async () => {    
    if (browser) {
      window.addEventListener('prog-context-update', handleContextUpdate as EventListener);
    }
  });
  onDestroy(() => {
    unsubscribe();
    if (browser) {
      window.removeEventListener('prog-context-update', handleContextUpdate as EventListener);
    }
  });
</script>  
<div class="context-container">
{#each $contextVars as item, i (item)}
  {#if item.type == 'TextRequest'}
    {#if item.text.startsWith('# ')}
    <div class="my-1">
      <hr/>
      <h4 class="h4 text-center">{item.text.replace(/^# /, '')}</h4>
    </div>
    {:else if item.text.startsWith('> ')}
    <div class="my-1">
      <blockquote class="border-l-4 border-surface-500/30 pl-4 italic">
        {item.text.replace(/^> /, '')}
      </blockquote>
    </div>
    {:else if item.text.startsWith('!!!')}
    <div class="my-1">
      <span class="badge variant-ghost-warning">
        {item.text.replace(/^!!!/, '')}
      </span>
    </div>
    {:else if item.text.startsWith('!badge:')}
    <div class="my-1">
      <span class="badge variant-ghost-surface">
        {item.text.replace(/^!badge:/, '')}
      </span>
    </div>
    {:else if item.text === '---'}
    <hr class="my-1" />
    {:else}
    <div>
      <span class="flex-auto">{item.text}</span>
    </div>
    {/if}
  {:else if item.type == 'FloatRequest'}
      <CustomRangeSlider 
        name="ctrl-float-slider-{i}" 
        bind:value={$contextValues[item.name]} 
        max={item.max_val} 
        min={item.min_val} 
        step={0.001} 
        on:input={() => {sendContextValueUpdate(item.name, $contextValues[item.name])}}
        label={item.name}
        valueParsed={parseFloat($contextValues[item.name]).toFixed(6)}
        ticked
      />
  {:else if item.type == 'IntRequest'}
      <CustomRangeSlider 
        name="ctrl-int-slider-{i}" 
        bind:value={$contextValues[item.name]} 
        max={item.max_val} 
        min={item.min_val}  
        step={1} 
        on:input={() => {sendContextValueUpdate(item.name, $contextValues[item.name])}}
        label={item.name}
        valueParsed={parseInt($contextValues[item.name])}
        ticked
      />
  {:else if item.type == 'BoolRequest'}
    <div>
      <SlideToggle 
        name="ctrl-checkbox-{i}" 
        bind:checked={$contextValues[item.name]} 
        on:change={() => {sendContextValueUpdate(item.name, $contextValues[item.name])}} 
        size="sm"
      >
        {item.name}
      </SlideToggle>
    </div>
  {/if}
{/each}
</div>