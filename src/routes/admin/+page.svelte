<script lang="ts">
  import { onMount } from 'svelte';
  import { Circle } from 'svelte-loading-spinners';
  import { Users, MessageSquare, Flag, Crown } from 'lucide-svelte';
  
  let loading = true;
  let stats = {
    totalUsers: 0,
    onlineUsers: 0,
    vipUsers: 0,
    activeChats: 0,
    pendingReports: 0,
    dailyMessages: 0
  };
  
  onMount(async () => {
    // TODO: Fetch real stats from Firebase
    setTimeout(() => {
      stats = {
        totalUsers: 1250,
        onlineUsers: 42,
        vipUsers: 85,
        activeChats: 16,
        pendingReports: 3,
        dailyMessages: 1842
      };
      loading = false;
    }, 1000);
  });
  
  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users },
    { label: 'Online Now', value: stats.onlineUsers, icon: Users },
    { label: 'VIP Users', value: stats.vipUsers, icon: Crown },
    { label: 'Active Chats', value: stats.activeChats, icon: MessageSquare },
    { label: 'Pending Reports', value: stats.pendingReports, icon: Flag },
    { label: 'Messages Today', value: stats.dailyMessages, icon: MessageSquare }
  ];
</script>

<div class="max-w-7xl mx-auto">
  <div class="mb-8">
    <h2 class="text-2xl font-bold mb-2">Overview</h2>
    <p class="text-gray-600 dark:text-gray-400">
      Welcome to the admin dashboard. Monitor site activity and manage users from here.
    </p>
  </div>
  
  {#if loading}
    <div class="flex justify-center py-12">
      <Circle size="60" color="#2AB0A8" unit="px" duration="1s" />
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each statCards as stat}
        <div class="card p-6">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                {stat.label}
              </p>
              <p class="text-2xl font-semibold mt-1">
                {stat.value.toLocaleString()}
              </p>
            </div>
            <div class="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
              <svelte:component 
                this={stat.icon}
                size={20}
                class="text-primary-500"
              />
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>