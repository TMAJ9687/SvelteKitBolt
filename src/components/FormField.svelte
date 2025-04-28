<script lang="ts">
  export let label: string;
  export let error: string | null = null;
  export let required = false;
</script>

<div class="mb-4">
  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
    {label}{required ? ' *' : ''}
  </label>
  <slot />
  {#if error}
    <p class="mt-1 text-sm text-error-500">{error}</p>
  {/if}
</div>