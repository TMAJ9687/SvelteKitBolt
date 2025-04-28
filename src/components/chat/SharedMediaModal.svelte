```svelte
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { X } from 'lucide-svelte';
  import { clickOutside } from '$lib/actions/clickOutside';
  import type { Message } from '$lib/types/chat';
  
  export let messages: Message[];
  
  const dispatch = createEventDispatcher();
  
  $: mediaMessages = messages
    .filter(msg => msg.image && !msg.image.expired)
    .sort((a, b) => {
      const timeA = a.timestamp?.toDate?.() || new Date(a.timestamp);
      const timeB = b.timestamp?.toDate?.() || new Date(b.timestamp);
      return timeB.getTime() - timeA.getTime();
    });
  
  function handleClose() {
    dispatch('close');
  }
  
  function formatDate(timestamp: any): string {
    if (!timestamp) return '';
    const date = timestamp.toDate?.() || new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
</script>

<div 
  class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
  on:click|self={handleClose}
  on:keydown={(e) => e.key === 'Escape' && handleClose()}
>
  <div 
    class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col"
    use:clickOutside={handleClose}
  >
    <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
      <h3 class="text-lg font-medium">Shared Media</h3>
      <button 
        class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        on:click={handleClose}
      >
        <X size={24} />
      </button>
    </div>
    
    <div class="p-4 overflow-y-auto flex-1">
      {#if mediaMessages.length === 0}
        <div class="text-center text-gray-500 dark:text-gray-400 py-8">
          No media shared in this conversation
        </div>
      {:else}
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          {#each mediaMessages as message}
            <div class="relative aspect-square group">
              <img 
                src={message.image?.url} 
                alt="Shared media"
                class="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              />
              <div class="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-b-lg">
                <p class="text-xs text-white">{formatDate(message.timestamp)}</p>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
```