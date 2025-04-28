<script lang="ts">
  import { onMount } from 'svelte';
  import { firestore } from '$lib/firebase';
  import { doc, updateDoc, arrayRemove } from 'firebase/firestore';
  import { Search, X as CloseIcon } from 'lucide-svelte';
  import { clickOutside } from '$lib/actions/clickOutside';
  import toast from 'svelte-french-toast';
  import UserAvatar from '../UserAvatar.svelte';
  import type { ChatUser } from '$lib/types/chat';
  
  export let currentUser: ChatUser;
  export let onClose: () => void;
  
  let loading = true;
  let blockedUsers: ChatUser[] = [];
  let searchQuery = '';
  
  $: filteredUsers = blockedUsers.filter(user => {
    if (!searchQuery) return true;
    return user.nickname.toLowerCase().includes(searchQuery.toLowerCase());
  });
  
  onMount(async () => {
    await loadBlockedUsers();
  });
  
  async function loadBlockedUsers() {
    try {
      const promises = (currentUser.blockedUsers || []).map(uid =>
        firestore.collection('profiles').doc(uid).get()
      );
      
      const snapshots = await Promise.all(promises);
      blockedUsers = snapshots
        .filter(doc => doc.exists)
        .map(doc => ({ uid: doc.id, ...doc.data() } as ChatUser));
      
    } catch (error) {
      console.error('Error loading blocked users:', error);
      toast.error('Failed to load blocked users');
    } finally {
      loading = false;
    }
  }
  
  async function handleUnblock(user: ChatUser) {
    try {
      const currentUserRef = doc(firestore, 'profiles', currentUser.uid);
      const blockedUserRef = doc(firestore, 'profiles', user.uid);
      
      await Promise.all([
        updateDoc(currentUserRef, {
          blockedUsers: arrayRemove(user.uid)
        }),
        updateDoc(blockedUserRef, {
          blockedUsers: arrayRemove(currentUser.uid)
        })
      ]);
      
      // Update local state
      blockedUsers = blockedUsers.filter(u => u.uid !== user.uid);
      toast.success(`Unblocked ${user.nickname}`);
      
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast.error('Failed to unblock user');
    }
  }
</script>

<div 
  class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
  on:click|self={onClose}
>
  <div 
    class="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col"
    use:clickOutside={onClose}
  >
    <!-- Header -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
      <h2 class="text-xl font-bold">Blocked Users</h2>
      <button
        class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        on:click={onClose}
      >
        <CloseIcon size={24} />
      </button>
    </div>
    
    <!-- Search -->
    {#if currentUser.isAdmin || blockedUsers.length > 5}
      <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        <div class="relative">
          <input
            type="text"
            placeholder="Search blocked users..."
            bind:value={searchQuery}
            class="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border-none focus:ring-2 focus:ring-primary-500"
          />
          <Search class="absolute left-3 top-2.5 text-gray-400" size={20} />
        </div>
      </div>
    {/if}
    
    <!-- User List -->
    <div class="flex-1 overflow-y-auto">
      {#if loading}
        <div class="flex justify-center items-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      {:else if blockedUsers.length === 0}
        <div class="text-center py-12 px-4">
          <div class="mb-4 text-gray-400 dark:text-gray-500">
            <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path>
            </svg>
          </div>
          <p class="text-gray-500 dark:text-gray-400">
            You haven't blocked anyone yet
          </p>
        </div>
      {:else}
        {#each filteredUsers as user}
          <div class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-4">
              <UserAvatar {user} size="lg" showStatus={false} />
              
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-medium">{user.nickname}</span>
                  {#if user.isVip}
                    <span class="text-yellow-500">👑</span>
                    <span class="text-xs bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 px-2 py-0.5 rounded-full">
                      VIP
                    </span>
                  {/if}
                </div>
                
                <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {user.gender}, {user.age}
                </div>
                
                <div class="flex items-center gap-2 mt-1">
                  <img 
                    src="https://flagcdn.com/{user.countryCode}.svg" 
                    alt="{user.country} flag"
                    class="w-4 h-3 object-cover rounded"
                  />
                  <span class="text-sm text-gray-600 dark:text-gray-300">
                    {user.country}
                  </span>
                </div>
              </div>
              
              <button
                class="px-3 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded-full transition-colors"
                on:click={() => handleUnblock(user)}
              >
                Unblock
              </button>
            </div>
          </div>
        {/each}
      {/if}
    </div>
  </div>
</div>