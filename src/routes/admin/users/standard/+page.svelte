<script lang="ts">
  import { onMount } from 'svelte';
  import { firestore } from '$lib/firebase';
  import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
  import { MoreVertical, Search, Ban, FileEdit as Edit, Crown, X, UserX } from 'lucide-svelte';
  import { Circle } from 'svelte-loading-spinners';
  import { clickOutside } from '$lib/actions/clickOutside';
  import toast from 'svelte-french-toast';
  import type { ChatUser } from '$lib/types/chat';

  let loading = true;
  let users: ChatUser[] = [];
  let searchQuery = '';
  let showBanModal = false;
  let showEditModal = false;
  let selectedUser: ChatUser | null = null;
  let banDuration = '24';
  let banReason = '';
  let submitting = false;

  $: filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    return user.nickname.toLowerCase().includes(searchQuery.toLowerCase());
  });

  onMount(() => {
    const q = query(
      collection(firestore, 'profiles'),
      where('isVip', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      users = snapshot.docs.map(doc => ({
        ...doc.data(),
        uid: doc.id
      })) as ChatUser[];
      loading = false;
    });

    return unsubscribe;
  });

  async function handleBan() {
    if (!selectedUser || !banReason || !banDuration) {
      toast.error('Please fill in all fields');
      return;
    }

    submitting = true;
    try {
      const userRef = doc(firestore, 'profiles', selectedUser.uid);
      await updateDoc(userRef, {
        banned: true,
        banReason,
        banDuration: parseInt(banDuration),
        banExpiry: new Date(Date.now() + parseInt(banDuration) * 60 * 60 * 1000).toISOString()
      });

      toast.success(`${selectedUser.nickname} has been banned`);
      showBanModal = false;
      selectedUser = null;
      banReason = '';
      banDuration = '24';
    } catch (error) {
      console.error('Error banning user:', error);
      toast.error('Failed to ban user');
    } finally {
      submitting = false;
    }
  }

  async function handleUpgrade(user: ChatUser) {
    try {
      const userRef = doc(firestore, 'profiles', user.uid);
      await updateDoc(userRef, {
        isVip: true
      });
      toast.success(`${user.nickname} has been upgraded to VIP`);
    } catch (error) {
      console.error('Error upgrading user:', error);
      toast.error('Failed to upgrade user');
    }
  }

  async function handleKick(user: ChatUser) {
    try {
      const userRef = doc(firestore, 'profiles', user.uid);
      await updateDoc(userRef, {
        kicked: true,
        lastKicked: new Date().toISOString()
      });
      toast.success(`${user.nickname} has been kicked`);
    } catch (error) {
      console.error('Error kicking user:', error);
      toast.error('Failed to kick user');
    }
  }
</script>

<div class="max-w-7xl mx-auto">
  <div class="mb-8">
    <h2 class="text-2xl font-bold mb-2">Standard Users</h2>
    <p class="text-gray-600 dark:text-gray-400">
      Manage standard users and their permissions
    </p>
  </div>

  <div class="card overflow-hidden">
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <div class="relative">
        <input
          type="text"
          placeholder="Search users..."
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
    {:else if filteredUsers.length === 0}
      <div class="text-center py-12 text-gray-500 dark:text-gray-400">
        No standard users found
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-800 text-left">
              <th class="p-4 font-medium">User</th>
              <th class="p-4 font-medium">Status</th>
              <th class="p-4 font-medium">Location</th>
              <th class="p-4 font-medium">Joined</th>
              <th class="p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            {#each filteredUsers as user}
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-800 {user.banned ? 'opacity-75 bg-gray-50 dark:bg-gray-800' : ''}">
                <td class="p-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-lg font-semibold">
                      {user.nickname[0].toUpperCase()}
                    </div>
                    <div>
                      <div class="font-medium">
                        {user.nickname}
                      </div>
                      <div class="text-sm text-gray-500 dark:text-gray-400">
                        {user.gender}, {user.age}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="p-4">
                  {#if user.banned}
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-error-100 text-error-800 dark:bg-error-900 dark:text-error-200">
                      Banned
                    </span>
                  {:else if user.online}
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200">
                      Online
                    </span>
                  {:else}
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                      Offline
                    </span>
                  {/if}
                </td>
                <td class="p-4">
                  <div class="flex items-center gap-2">
                    <img 
                      src="https://flagcdn.com/{user.countryCode}.svg" 
                      alt="{user.country} flag"
                      class="w-4 h-3 object-cover rounded"
                    />
                    <span>{user.country}</span>
                  </div>
                </td>
                <td class="p-4 text-gray-500 dark:text-gray-400">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td class="p-4">
                  <div class="relative">
                    <button
                      class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                      on:click={() => selectedUser = user}
                    >
                      <MoreVertical size={20} />
                    </button>

                    {#if selectedUser?.uid === user.uid}
                      <div 
                        class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10"
                        use:clickOutside={() => selectedUser = null}
                      >
                        <button
                          class="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-2"
                          on:click={() => handleKick(user)}
                        >
                          <UserX size={16} />
                          <span>Kick</span>
                        </button>
                        <button
                          class="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-2"
                          on:click={() => { showBanModal = true; }}
                        >
                          <Ban size={16} />
                          <span>Ban</span>
                        </button>
                        <button
                          class="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-2"
                          on:click={() => { showEditModal = true; }}
                        >
                          <Edit size={16} />
                          <span>Edit</span>
                        </button>
                        <button
                          class="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-2"
                          on:click={() => handleUpgrade(user)}
                        >
                          <Crown size={16} />
                          <span>Upgrade to VIP</span>
                        </button>
                      </div>
                    {/if}
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>

<!-- Ban Modal -->
{#if showBanModal && selectedUser}
  <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
      <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 class="text-lg font-medium">Ban User</h3>
        <button 
          class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          on:click={() => { showBanModal = false; selectedUser = null; }}
        >
          <X size={24} />
        </button>
      </div>
      
      <div class="p-4">
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1">Ban Duration (hours)</label>
          <select
            bind:value={banDuration}
            class="input"
          >
            <option value="24">24 hours</option>
            <option value="48">48 hours</option>
            <option value="72">72 hours</option>
            <option value="168">1 week</option>
            <option value="720">30 days</option>
            <option value="999999">Permanent</option>
          </select>
        </div>
        
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1">Reason</label>
          <textarea
            bind:value={banReason}
            class="input"
            rows="3"
            placeholder="Enter ban reason..."
          ></textarea>
        </div>
      </div>
      
      <div class="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
        <button 
          class="btn btn-outline"
          on:click={() => { showBanModal = false; selectedUser = null; }}
          disabled={submitting}
        >
          Cancel
        </button>
        <button 
          class="btn bg-error-500 text-white hover:bg-error-600"
          on:click={handleBan}
          disabled={submitting}
        >
          {#if submitting}
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Banning...
          {:else}
            Ban User
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}