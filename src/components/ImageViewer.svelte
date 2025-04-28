<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { X, Eye, EyeOff } from 'lucide-svelte';
  
  export let imageUrl: string;
  export let width: number;
  export let height: number;
  export let blurred = true;
  
  const dispatch = createEventDispatcher();
  let showFullscreen = false;
  
  function toggleBlur() {
    blurred = !blurred;
  }
  
  function handleClose() {
    showFullscreen = false;
  }
</script>

<div class="relative">
  <div class="w-[300px] h-[300px] overflow-hidden rounded-lg relative">
    <img 
      src={imageUrl} 
      alt="Shared image"
      class="w-full h-full object-cover cursor-pointer transition-all duration-200
            {blurred ? 'blur-xl' : ''}"
      on:click={() => showFullscreen = true}
    />
    
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
</div>

{#if showFullscreen}
  <div class="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
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
      style="aspect-ratio: {width}/{height}"
    />
  </div>
{/if}