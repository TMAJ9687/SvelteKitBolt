<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { X, Send } from 'lucide-svelte';
  import { clickOutside } from '$lib/actions/clickOutside';
  
  export let imageUrl: string;
  export let file: File;
  export let dailyUploads: number | undefined = undefined;
  export let maxUploads: number | undefined = undefined;
  export let isVip = false;
  
  const dispatch = createEventDispatcher();
  
  function handleCancel() {
    dispatch('cancel');
  }
  
  function handleSend() {
    dispatch('send', { file });
  }
</script>

<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
  <div 
    class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full"
    use:clickOutside={handleCancel}
  >
    <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
      <h3 class="text-lg font-medium">Preview Image</h3>
      <button 
        class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        on:click={handleCancel}
      >
        <X size={24} />
      </button>
    </div>
    
    <div class="p-4">
      <img 
        src={imageUrl} 
        alt="Preview" 
        class="max-h-[500px] w-auto mx-auto rounded-lg"
      />
      
      {#if !isVip && dailyUploads !== undefined && maxUploads !== undefined}
        <div class="mt-4 text-center text-sm text-gray-600 dark:text-gray-300">
          {dailyUploads}/{maxUploads} photos today
        </div>
      {/if}
    </div>
    
    <div class="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
      <button 
        class="btn btn-outline"
        on:click={handleCancel}
      >
        Cancel
      </button>
      <button 
        class="btn btn-primary flex items-center gap-2"
        on:click={handleSend}
        disabled={!isVip && dailyUploads !== undefined && maxUploads !== undefined && dailyUploads >= maxUploads}
      >
        <Send size={20} />
        Send Image
      </button>
    </div>
  </div>
</div>