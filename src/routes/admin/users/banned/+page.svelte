<script lang="ts">
  import { onMount } from 'svelte';
  import { firestore } from '$lib/firebase';
  import { collection, query, onSnapshot, doc, updateDoc, deleteField } from 'firebase/firestore';
  import { Search, UserX, Globe, Shield } from 'lucide-svelte';
  import { Circle } from 'svelte-loading-spinners';
  import toast from 'svelte-french-toast';
  
  interface BannedItem {
    id: string;
    type: 'user' | 'ip';
    nickname?: string;
    ipAddress?: string;
    reason: string;
    duration: number; // in hours
    bannedAt: string;
    bannedBy: string;
    expiresAt: string;
  }

  let loading = true;
  let bannedItems: BannedItem[] = [];
  let searchQuery = '';
  let totalBannedUsers = 0;
  let totalBannedIPs = 0;

  $: {
    totalBannedUsers = bannedItems.filter(item => item.type === 'user').length;
    totalBannedIPs = bannedItems.filter(item => item.type === 'ip').length;
  }

  $: filteredItems = bannedItems.filter(item => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    if (item.type === 'user') {
      return item.nickname?.toLowerCase().includes(searchLower);
    } else {
      return item.ipAddress?.includes(searchLower);
    }
  });

  onMount(() => {
    // Set up real-time listener for banned items
    const q = query(collection(firestore, 'bans'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      bannedItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as BannedItem));
      loading = false;
    }, (error) => {
      console.error('Error fetching banned items:', error);
      toast.error('Failed to load banned items');
      loading = false;
    });

    return unsubscribe;
  });

  async function handleUnban(item: BannedItem) {
    try {
      const banRef = doc(firestore, 'bans', item.id);
      
      if (item.type === 'user') {
        // Update user profile to remove ban status
        const userRef = doc(firestore, 'profiles', item.id);
        await updateDoc(userRef, {
          banned: deleteField(),
          banReason: deleteField(),
          banExpiry: deleteField()
        });
      }
      
      // Delete the ban document
      await updateDoc(banRef, {
        active: false,
        unbannedAt: new Date().toISOString()
      });

      toast.success(`${item.type === 'user' ? 'User' : 'IP'} has been unbanned`);
    } catch (error) {
      console.error('Error unbanning:', error);
      toast.error('Failed to unban');
    }
  }

  function formatDuration(hours: number): string {
    if (hours >= 8760) return 'Permanent';
    if (hours >= 720) return `${Math.floor(hours / 720)} months`;
    if (hours >= 24) return `${Math.floor(hours / 24)} days`;
    return `${hours} hours`;
  }

  function formatDate(date: string): string {
    return new Date(date).toLocaleString();
  }

  function getTimeRemaining(expiresAt: string): string {
    const now = new Date();
    const expiry = new Date(expiresAt);
    if (expiry < now) return 'Expired';
    
    const diff = expiry.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} days remaining`;
    return `${hours} hours remaining`;
  }
</script>

<div class="space-y-6">
  <div class="flex justify-between items-center">
    <div>
      <h2 class="text-2xl font-bold mb-2">Banned Users & IPs</h2>
      <div class="flex gap-4">
        <div class="flex items-center gap-2 text-sm">
          <UserX size={16} class="text-error-500" />
          <span>{totalBannedUsers} banned users</span>
        </div>
        <div class="flex items-center gap-2 text-sm">
          <Globe size={16} class="text-error-500" />
          <span>{totalBannedIPs} banned IPs</span>
        </div>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <div class="relative">
        <input
          type="text"
          placeholder="Search by nickname or IP..."
          bind:value={searchQuery}
          class="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border-none focus:ring-2 focus:ring-primary-500"
        />
        <Search class="absolute left-3 top-2.5 text-gray-400" size={20} />
      </div>
    </div>

    {#if loading}
      <div class="flex justify-center py-12">
        <Circle size="60" color="#2AB0A8" unit="px" duration="1s" />
      </div>
    {:else if filteredItems.length === 0}
      <div class="text-center py-12 text-gray-500 dark:text-gray-400">
        No banned users or IPs found
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-800 text-left">
              <th class="p-4 font-medium">Type</th>
              <th class="p-4 font-medium">Nickname/IP</th>
              <th class="p-4 font-medium">Reason</th>
              <th class="p-4 font-medium">Duration</th>
              <th class="p-4 font-medium">Banned At</th>
              <th class="p-4 font-medium">Banned By</th>
              <th class="p-4 font-medium">Status</th>
              <th class="p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            {#each filteredItems as item}
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td class="p-4">
                  <div class="flex items-center gap-2">
                    {#if item.type === 'user'}
                      <UserX size={16} class="text-error-500" />
                      <span>User</span>
                    {:else}
                      <Globe size={16} class="text-error-500" />
                      <span>IP</span>
                    {/if}
                  </div>
                </td>
                <td class="p-4 font-medium">
                  {item.type === 'user' ? item.nickname : item.ipAddress}
                </td>
                <td class="p-4 text-gray-600 dark:text-gray-300">
                  {item.reason}
                </td>
                <td class="p-4">
                  {formatDuration(item.duration)}
                </td>
                <td class="p-4 text-gray-600 dark:text-gray-300">
                  {formatDate(item.bannedAt)}
                </td>
                <td class="p-4">
                  <div class="flex items-center gap-2">
                    <Shield size={16} />
                    <span>{item.bannedBy}</span>
                  </div>
                </td>
                <td class="p-4">
                  <span class="text-sm text-gray-500 dark:text-gray-400">
                    {getTimeRemaining(item.expiresAt)}
                  </span>
                </td>
                <td class="p-4">
                  <button
                    class="px-3 py-1 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
                    on:click={() => handleUnban(item)}
                  >
                    Unban
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>