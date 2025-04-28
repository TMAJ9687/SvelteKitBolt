<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { X } from 'lucide-svelte';
  import { clickOutside } from '$lib/actions/clickOutside';

  export let reportedUser: { uid: string; nickname: string };

  const dispatch = createEventDispatcher();
  let selectedReason = '';
  let otherDetails = '';
  let submitting = false;

  const reportReasons = [
    'Under age (user is below 18)',
    'Harassment/Bullying',
    'Hate Speech/Discrimination',
    'Spam/Scam',
    'Explicit/Inappropriate content',
    'Other'
  ];

  function handleClose() {
    dispatch('close');
  }

  async function handleSubmit() {
    if (!selectedReason) return;

    submitting = true;

    try {
      dispatch('submit', {
        reason: selectedReason,
        details: selectedReason === 'Other' ? otherDetails : ''
      });
    } finally {
      submitting = false;
    }
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
      <h3 class="text-lg font-medium">Report User</h3>
      <button 
        class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        on:click={handleClose}
      >
        <X size={24} />
      </button>
    </div>
    <div class="p-4">
      <p class="mb-4 text-gray-600 dark:text-gray-300">
        Report inappropriate behavior by <span class="font-medium">{reportedUser.nickname}</span>
      </p>
      <div class="space-y-2">
        {#each reportReasons as reason}
          <label class="flex items-center gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
            <input
              type="radio"
              name="reason"
              value={reason}
              bind:group={selectedReason}
              class="text-primary-500 focus:ring-primary-500"
            />
            <span>{reason}</span>
          </label>
        {/each}
      </div>
      {#if selectedReason === 'Other'}
        <div class="mt-4">
          <textarea
            bind:value={otherDetails}
            placeholder="Please provide details about your report..."
            class="input resize-none"
            rows="3"
            maxlength="120"
          ></textarea>
          <div class="text-xs text-gray-500 mt-1">
            {otherDetails.length}/120 characters
          </div>
        </div>
      {/if}
    </div>
    <div class="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
      <button 
        class="btn btn-outline"
        on:click={handleClose}
      >
        Cancel
      </button>
      <button 
        class="btn btn-primary"
        disabled={!selectedReason || (selectedReason === 'Other' && !otherDetails) || submitting}
        on:click={handleSubmit}
      >
        {#if submitting}
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Submitting...
        {:else}
          Submit Report
        {/if}
      </button>
    </div>
  </div>
</div>
