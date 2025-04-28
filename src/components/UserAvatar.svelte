```svelte
<script lang="ts">
  import type { ChatUser } from '$lib/types/chat';
  import { Crown } from 'lucide-svelte';
  
  export let user: ChatUser;
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let showStatus = true;
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-lg',
    lg: 'w-12 h-12 text-xl'
  };
  
  function isUserOnline(lastActive: any): boolean {
    if (!lastActive) return false;
    const lastActiveTime = new Date(lastActive).getTime();
    return Date.now() - lastActiveTime <= 60000; // 60 seconds
  }
</script>

<div class="relative inline-block">
  <!-- Avatar circle -->
  <div class="relative">
    <div class="{sizeClasses[size]} rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center font-semibold {user.isVip ? 'ring-2 ring-yellow-400 dark:ring-yellow-500' : ''}">
      {user.nickname[0].toUpperCase()}
    </div>
    
    {#if user.isVip}
      <div class="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-0.5 shadow-sm">
        <Crown size={12} class="text-white" />
      </div>
    {/if}
  </div>
  
  <!-- Online status indicator -->
  {#if showStatus && isUserOnline(user.lastActive)}
    <div class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-success-500 rounded-full border-2 border-white dark:border-gray-800"></div>
  {/if}
</div>
```