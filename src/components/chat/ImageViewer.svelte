<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { X, Eye, EyeOff } from 'lucide-svelte';
  import { clickOutside } from '$lib/actions/clickOutside';
  
  export let imageUrl: string;
  export let blurred = true;
  
  const dispatch = createEventDispatcher();
  let showFullscreen = false;
  
  function toggleBlur() {
    blurred = !blurred;
    dispatch('blur', { blurred });
  }
  
  function handleClose() {
    showFullscreen = false;
  }
</script>

<div class="relative w-[300px] h-[300px] overflow-hidden rounded-lg group">
  <img 
    src={imageUrl} 
    alt="Shared image"
    class="w-full h-full object-cover cursor-pointer transition-all duration-200
          {blurred ? 'blur-xl' : ''}"
    on:click={() => showFullscreen = true}
  />
  
  <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
  
  <button
    class="absolute bottom-2 right-2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
    on:click={toggleBlur}
    title={blurred ? 'Reveal image' : 'Blur image'}
  >
    {#if blurred}
      <Eye size={20} />
    {:else}
      <EyeOff size={20} />
    {/if}
  </button>
</div>

{#if showFullscreen}
  <div 
    class="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
    use:clickOutside={handleClose}
  >
    <button 
      class="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
      on:click={handleClose}
    >
      <X size={32} />
    </button>
    
    <img 
      src={imageUrl} 
      alt="Full size image"
      class="max-w-full max-h-[90vh] w-auto h-auto rounded-lg"
    />
  </div>
{/if}