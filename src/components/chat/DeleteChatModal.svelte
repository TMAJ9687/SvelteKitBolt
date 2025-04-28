```svelte
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { X } from 'lucide-svelte';
  import { clickOutside } from '$lib/actions/clickOutside';
  
  export let nickname: string;
  
  const dispatch = createEventDispatcher();
  let loading = false;
  
  function handleClose() {
    if (!loading) {
      dispatch('close');
    }
  }
  
  async function handleDelete() {
    loading = true;
    dispatch('confirm');
  }
</script>

<div 
  class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
  on:click|self={handleClose}
  on:keydown={(e) => e.key === 'Escape' && handleClose()}
>
  <div 
    class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full"
    use:clickOutside={handleClose}
  >
    <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
      <h3 class="text-lg font-medium">Delete Conversation</h3>
      <button 
        class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        on:click={handleClose}
        disabled={loading}
      >
        <X size={24} />
      </button>
    </div>
    
    <div class="p-6">
      <p class="text-gray-600 dark:text-gray-300">
        Are you sure you want to delete all messages with <span class="font-medium">{nickname}</span>? This action cannot be undone.
      </p>
      
      <div class="mt-6 flex justify-end gap-3">
        <button 
          class="btn btn-outline"
          on:click={handleClose}
          disabled={loading}
        >
          Cancel
        </button>
        <button 
          class="btn bg-error-500 text-white hover:bg-error-600"
          on:click={handleDelete}
          disabled={loading}
        >
          {#if loading}
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Deleting...
          {:else}
            Delete Conversation
          {/if}
        </button>
      </div>
    </div>
  </div>
</div>
```